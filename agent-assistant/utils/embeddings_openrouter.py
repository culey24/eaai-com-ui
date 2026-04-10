"""Embedding qua OpenRouter API (OpenAI-compatible /v1/embeddings)."""

from __future__ import annotations

import logging
import os
from typing import List

import httpx

logger = logging.getLogger(__name__)

OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings"


def openrouter_embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Trả về vector embedding theo đúng thứ tự `texts`.
    Cần OPENROUTER_API_KEY; model: OPENROUTER_EMBEDDING_MODEL (mặc định openai/text-embedding-3-small).
    """
    if not texts:
        return []
    api_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is required for OpenRouter embeddings")

    model = (os.getenv("OPENROUTER_EMBEDDING_MODEL") or "openai/text-embedding-3-small").strip()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    # Luôn gửi mảng — tương thích batch và đơn lẻ.
    payload = {"model": model, "input": texts}

    with httpx.Client(timeout=60.0) as client:
        r = client.post(OPENROUTER_EMBEDDINGS_URL, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()

    items = data.get("data") or []
    if not items:
        raise ValueError("OpenRouter embeddings: empty data")

    # Sắp xếp theo index nếu có
    def sort_key(x):
        return x.get("index", 0)

    sorted_items = sorted(items, key=sort_key)
    out: List[List[float]] = []
    for item in sorted_items:
        emb = item.get("embedding")
        if not isinstance(emb, list):
            raise ValueError("OpenRouter embeddings: invalid embedding vector")
        out.append([float(x) for x in emb])

    if len(out) != len(texts):
        # Không được pad bằng vector trùng — FAQ sẽ khớp sai câu. Chỉ cắt dư thừa.
        logger.error(
            "OpenRouter embeddings: nhận %s vector cho %s input — có thể lỗi API/batch",
            len(out),
            len(texts),
        )
        if len(out) < len(texts):
            raise ValueError(
                f"OpenRouter trả ít embedding hơn số câu ({len(out)} < {len(texts)})"
            )
        out = out[: len(texts)]

    return out
