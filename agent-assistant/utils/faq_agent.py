"""
FAQ Agent — agent đầu tiên trong pipeline /chat-with-agent.

Ưu tiên: PostgreSQL + pgvector (embedding OpenRouter 1536, lưu cột embedding).
Fallback: đọc GET /faq + embed trong RAM (OpenRouter hoặc fastembed), hoặc file JSON.

Biến môi trường:
- FAQ_AGENT_ENABLED: 1 (mặc định) / 0
- FAQ_USE_PGVECTOR: 1 (mặc định) khi có DATABASE_URL + OPENROUTER_API_KEY — tắt = 0
- DATABASE_URL — kết nối Postgres (cùng Prisma backend)
- FAQ_EMBEDDING_THRESHOLD, OPENROUTER_*, FAQ_CACHE_TTL_SEC, FAQ_EMBEDDING_BACKEND, ...
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np

from utils.be_integration import be_integration_headers
from utils.faq_pgvector import pgvector_path_enabled, pick_localized_answer
from utils.service_urls import get_be_server_base_url

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_agent: Optional["FaqAgent"] = None

_DEFAULT_THRESHOLD = 0.72
_DEFAULT_TTL = 60.0


def _env_flag(name: str, default: bool = True) -> bool:
    v = (os.getenv(name) or "").strip().lower()
    if not v:
        return default
    return v in ("1", "true", "yes", "on")


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def _default_faq_json_path() -> Path:
    return Path(__file__).resolve().parent.parent / "data" / "faq.json"


def _load_faq_from_json_file() -> List[Dict[str, Any]]:
    path = (os.getenv("FAQ_JSON_PATH") or "").strip()
    p = Path(path) if path else _default_faq_json_path()
    if not p.is_file():
        return []
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        items = data.get("items")
        return items if isinstance(items, list) else []
    except Exception as e:
        logger.warning("FAQ JSON fallback read failed: %s", e)
        return []


def _fetch_faq_from_be() -> List[Dict[str, Any]]:
    base = (get_be_server_base_url() or "").strip().rstrip("/")
    if not base:
        return []
    url = f"{base}/faq"
    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.get(url, headers=be_integration_headers())
            if r.status_code != 200:
                logger.warning("GET /faq failed: %s %s", r.status_code, r.text[:200])
                return []
            data = r.json()
            faq = data.get("faq")
            if not isinstance(faq, list):
                return []
            return faq
    except Exception as e:
        logger.warning("GET /faq error: %s", e)
        return []


def _normalize_entries(raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for it in raw:
        if not isinstance(it, dict):
            continue
        qv = (it.get("questionVi") or it.get("question") or "").strip()
        qe = (it.get("questionEn") or "").strip()
        av = (it.get("answerVi") or it.get("answer") or "").strip()
        ae = (it.get("answerEn") or "").strip()
        kw_v = it.get("keywordsVi")
        if kw_v is None:
            kw_v = it.get("keywords") or []
        if not isinstance(kw_v, list):
            kw_v = []
        kw_e = it.get("keywordsEn") or []
        if not isinstance(kw_e, list):
            kw_e = []
        kw_s_v = " ".join(str(x) for x in kw_v)
        kw_s_e = " ".join(str(x) for x in kw_e)
        passage = f"{qv} {qe} {kw_s_v} {kw_s_e}".strip()
        if not passage:
            continue
        if not av and not ae:
            continue
        if not av:
            av = ae
        if not ae:
            ae = av
        out.append({"passage": passage, "answerVi": av, "answerEn": ae})
    return out


class FaqAgent:
    """
    Agent FAQ: pgvector (ưu tiên) hoặc embed passage/query trong RAM.
    """

    def __init__(self) -> None:
        self._entries: List[Dict[str, Any]] = []
        self._passage_embeddings: List[np.ndarray] = []
        self._cache_until = 0.0
        self._embed_backend = ""
        self._local_embed_model = None

    def _resolve_embed_backend(self) -> str:
        explicit = (os.getenv("FAQ_EMBEDDING_BACKEND") or "").strip().lower()
        if explicit in ("openrouter", "local"):
            return explicit
        if (os.getenv("OPENROUTER_API_KEY") or "").strip():
            return "openrouter"
        return "local"

    def _embed_batch(self, texts: List[str]) -> List[np.ndarray]:
        backend = self._resolve_embed_backend()
        if backend == "openrouter":
            from utils.embeddings_openrouter import openrouter_embed_texts

            vecs = openrouter_embed_texts(texts)
            return [np.asarray(v, dtype=np.float64) for v in vecs]

        from fastembed import TextEmbedding

        model_name = (
            (os.getenv("FAQ_LOCAL_EMBEDDING_MODEL") or "").strip()
            or "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )
        if self._local_embed_model is None:
            self._local_embed_model = TextEmbedding(model_name=model_name)
        gen = self._local_embed_model.embed(texts)
        return [np.asarray(e, dtype=np.float64) for e in gen]

    def _refresh_entries_locked(self) -> None:
        ttl = float(os.getenv("FAQ_CACHE_TTL_SEC") or _DEFAULT_TTL)
        if not (ttl > 0):
            ttl = _DEFAULT_TTL
        now = time.monotonic()
        if self._entries and now < self._cache_until:
            return

        raw = _fetch_faq_from_be()
        if not raw:
            raw = _load_faq_from_json_file()

        entries = _normalize_entries(raw)
        self._embed_backend = self._resolve_embed_backend()

        if not entries:
            self._entries = []
            self._passage_embeddings = []
            self._cache_until = now + ttl
            logger.info("FAQ Agent: no entries from DB or JSON fallback")
            return

        passages = [e["passage"] for e in entries]
        try:
            self._passage_embeddings = self._embed_batch(passages)
            self._entries = entries
            self._cache_until = now + ttl
            logger.info(
                "FAQ Agent: loaded %s entries, embed_backend=%s",
                len(entries),
                self._embed_backend,
            )
        except Exception as e:
            logger.error("FAQ Agent: passage embedding failed: %s", e)
            self._entries = []
            self._passage_embeddings = []
            self._cache_until = now + min(ttl, 10.0)

    def _run_legacy(self, user_message: str) -> Tuple[Optional[str], float]:
        """
        Trả về (câu trả lời, điểm cosine tốt nhất) hoặc (None, điểm) nếu không hit.
        """
        text = (user_message or "").strip()
        if len(text) < 2:
            return None, 0.0

        with _lock:
            self._refresh_entries_locked()
            entries = self._entries
            passage_embs = self._passage_embeddings

        if not entries or not passage_embs:
            return None, 0.0
        if len(entries) != len(passage_embs):
            logger.error(
                "FAQ Agent (legacy): số entry (%s) != số embedding (%s) — bỏ qua khớp",
                len(entries),
                len(passage_embs),
            )
            return None, 0.0

        threshold_s = (os.getenv("FAQ_EMBEDDING_THRESHOLD") or "").strip()
        try:
            threshold = float(threshold_s) if threshold_s else _DEFAULT_THRESHOLD
        except ValueError:
            threshold = _DEFAULT_THRESHOLD
        threshold = max(0.0, min(1.0, threshold))

        try:
            q_vec = self._embed_batch([text])[0]
        except Exception as e:
            logger.warning("FAQ Agent: query embedding failed: %s", e)
            return None, 0.0

        best_sim = -1.0
        best_answer: Optional[str] = None
        for ent, p_emb in zip(entries, passage_embs):
            sim = _cosine_sim(q_vec, p_emb)
            if sim > best_sim:
                best_sim = sim
                best_answer = pick_localized_answer(
                    ent["answerVi"], ent["answerEn"], text
                )

        if best_answer is not None and best_sim >= threshold:
            logger.info(
                "FAQ Agent (legacy) hit: score=%.4f threshold=%.4f backend=%s",
                best_sim,
                threshold,
                self._embed_backend,
            )
            return best_answer, best_sim

        logger.debug(
            "FAQ Agent (legacy) miss: best_score=%.4f threshold=%.4f", best_sim, threshold
        )
        return None, best_sim

    def run(self, user_message: str) -> Tuple[Optional[str], float]:
        if not _env_flag("FAQ_AGENT_ENABLED", True):
            return None, 0.0

        text = (user_message or "").strip()
        if len(text) < 2:
            return None, 0.0

        if pgvector_path_enabled():
            try:
                from utils.faq_pgvector import run_faq_with_pgvector

                return run_faq_with_pgvector(text)
            except Exception as e:
                logger.warning("FAQ pgvector failed, fallback legacy: %s", e)

        return self._run_legacy(text)


def get_faq_agent() -> FaqAgent:
    global _agent
    with _lock:
        if _agent is None:
            _agent = FaqAgent()
        return _agent


def run_faq_agent(user_message: str) -> Tuple[Optional[str], float]:
    return get_faq_agent().run(user_message)
