"""Tiện ích cho chatbot_server (timestamp ADK, làm sạch JSON LLM)."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone


def timestamp_to_datetime(ts) -> datetime | str:
    """ADK có thể trả timestamp float (giây) hoặc chuỗi ISO."""
    if ts is None:
        return datetime.now(timezone.utc)
    if isinstance(ts, datetime):
        return ts
    if isinstance(ts, (int, float)):
        return datetime.fromtimestamp(float(ts), tz=timezone.utc)
    if isinstance(ts, str):
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except ValueError:
            return ts
    return str(ts)


def clean_llm_json(raw: str) -> str:
    """Bóc fence ```json ... ``` hoặc trả chuỗi gốc nếu không parse được JSON."""
    if not raw or not isinstance(raw, str):
        return ""
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, count=1, flags=re.IGNORECASE)
        text = re.sub(r"\s*```\s*$", "", text, count=1)
        text = text.strip()
    try:
        parsed = json.loads(text)
        return json.dumps(parsed, ensure_ascii=False)
    except json.JSONDecodeError:
        return text
