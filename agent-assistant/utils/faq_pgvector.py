"""
FAQ + PostgreSQL pgvector: lưu embedding (OpenRouter, 1536 chiều), truy vấn ORDER BY embedding <=> query.

Cần: DATABASE_URL, OPENROUTER_API_KEY, extension vector trên DB.
Tắt: FAQ_USE_PGVECTOR=0 — dùng luồng legacy (embed trong RAM).

Khoảng cách cosine: similarity ≈ 1 - dist (vector đã chuẩn hoá như OpenAI).
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

DIM = int(os.getenv("FAQ_EMBEDDING_DIMENSION", "1536"))

# Ký tự có dấu tiếng Việt (NFC) — dùng đoán ngôn ngữ câu hỏi user
_VI_MARK_RE = re.compile(
    r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]"
)


def _db_url() -> str:
    return (os.getenv("DATABASE_URL") or "").strip()


def pgvector_path_enabled() -> bool:
    if (os.getenv("FAQ_USE_PGVECTOR") or "1").strip().lower() in ("0", "false", "no"):
        return False
    if not _db_url():
        return False
    if not (os.getenv("OPENROUTER_API_KEY") or "").strip():
        return False
    return True


def _vector_literal(vec: List[float]) -> str:
    return "[" + ",".join(str(float(x)) for x in vec) + "]"


def _norm_keywords(val: Any) -> List[str]:
    if val is None:
        return []
    if isinstance(val, str):
        try:
            val = json.loads(val)
        except Exception:
            return []
    if not isinstance(val, list):
        return []
    return [str(x).strip() for x in val if str(x).strip()]


def _passage_from_row(row: Dict[str, Any]) -> str:
    qv = (row.get("question_vi") or "").strip()
    qe = (row.get("question_en") or "").strip()
    kw_v = _norm_keywords(row.get("keywords_vi"))
    kw_e = _norm_keywords(row.get("keywords_en"))
    parts = [qv, qe, " ".join(kw_v), " ".join(kw_e)]
    return " ".join(p for p in parts if p).strip()


def _has_vietnamese(text: str) -> bool:
    if not text:
        return False
    return bool(_VI_MARK_RE.search(text))


def pick_localized_answer(answer_vi: str, answer_en: str, user_message: str) -> str:
    """Chọn câu trả lời VI hoặc EN theo ngôn ngữ câu hỏi (heuristic đơn giản)."""
    vi = (answer_vi or "").strip()
    en = (answer_en or "").strip()
    if not vi and not en:
        return ""
    if not en:
        return vi
    if not vi:
        return en
    msg = (user_message or "").strip()
    if _has_vietnamese(msg):
        return vi
    return en


def sync_missing_embeddings(conn) -> int:
    """Embed các FAQ active còn embedding NULL; commit do caller xử lý."""
    from psycopg2.extras import RealDictCursor

    from utils.embeddings_openrouter import openrouter_embed_texts

    model = (os.getenv("OPENROUTER_EMBEDDING_MODEL") or "openai/text-embedding-3-small").strip()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT faq_id, question_vi, question_en, keywords_vi, keywords_en
            FROM faq_entries
            WHERE is_active = true AND embedding IS NULL
            ORDER BY sort_order ASC, faq_id ASC
            """
        )
        rows = [dict(r) for r in cur.fetchall()]

    if not rows:
        return 0

    passages: List[str] = []
    ids: List[int] = []
    for r in rows:
        p = _passage_from_row(r)
        if not p:
            continue
        passages.append(p)
        ids.append(int(r["faq_id"]))

    if not passages:
        return 0

    vecs = openrouter_embed_texts(passages)
    if len(vecs) != len(ids):
        raise RuntimeError("OpenRouter embedding batch length mismatch")

    n = 0
    with conn.cursor() as cur:
        for fid, vec in zip(ids, vecs):
            if len(vec) != DIM:
                logger.warning(
                    "FAQ embedding dim %s != %s (faq_id=%s), bỏ qua",
                    len(vec),
                    DIM,
                    fid,
                )
                continue
            lit = _vector_literal(vec)
            cur.execute(
                """
                UPDATE faq_entries
                SET embedding = %s::vector, embedding_model = %s
                WHERE faq_id = %s
                """,
                (lit, model, fid),
            )
            n += cur.rowcount or 0

    if n:
        logger.info("FAQ pgvector: đã đồng bộ %s embedding", n)
    return n


def search_best_faq(conn, user_message: str) -> Tuple[Optional[str], float]:
    """
    Trả về (answer, similarity) hoặc (None, best_similarity_để_debug).
    Dùng cosine distance <=> ; similarity = 1 - dist (xấp xỉ với vector chuẩn hoá).
    """
    from psycopg2.extras import RealDictCursor

    from utils.embeddings_openrouter import openrouter_embed_texts

    text = (user_message or "").strip()
    if len(text) < 2:
        return None, 0.0

    raw_th = (os.getenv("FAQ_EMBEDDING_THRESHOLD") or "0.72").strip() or "0.72"
    try:
        threshold = float(raw_th)
    except ValueError:
        logger.warning("FAQ_EMBEDDING_THRESHOLD không hợp lệ %r — dùng 0.72", raw_th)
        threshold = 0.72
    threshold = max(0.0, min(1.0, threshold))
    max_dist = 1.0 - threshold

    qv = openrouter_embed_texts([text])[0]
    if len(qv) != DIM:
        raise ValueError(f"Query embedding dim {len(qv)} != {DIM}")

    lit = _vector_literal(qv)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT answer_vi, answer_en, (embedding <=> %s::vector) AS dist
            FROM faq_entries
            WHERE is_active = true AND embedding IS NOT NULL
            ORDER BY embedding <=> %s::vector
            LIMIT 1
            """,
            (lit, lit),
        )
        row = cur.fetchone()

    if not row:
        return None, 0.0

    dist = float(row["dist"])
    sim = 1.0 - dist
    if sim > 1.0:
        sim = 1.0
    if sim < 0.0:
        sim = 0.0

    if dist > max_dist:
        logger.debug(
            "FAQ pgvector miss: dist=%.4f max_dist=%.4f sim≈%.4f", dist, max_dist, sim
        )
        return None, sim

    avi = (row.get("answer_vi") or "").strip()
    aen = (row.get("answer_en") or "").strip()
    ans = pick_localized_answer(avi, aen, text)
    if not ans:
        return None, sim

    logger.info(
        "FAQ pgvector hit: dist=%.4f sim≈%.4f threshold=%.4f", dist, sim, threshold
    )
    return ans, sim


def run_faq_with_pgvector(user_message: str) -> Tuple[Optional[str], float]:
    """Một kết nối: sync embedding thiếu → tìm kiếm."""
    import psycopg2

    dsn = _db_url()
    with psycopg2.connect(dsn) as conn:
        sync_missing_embeddings(conn)
        conn.commit()
        return search_best_faq(conn, user_message)
