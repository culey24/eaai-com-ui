"""Header và tiện ích gọi backend Node (route agent integration)."""

from __future__ import annotations

import os
from typing import Mapping


def be_integration_headers(extra: Mapping[str, str] | None = None) -> dict[str, str]:
    """Trùng biến AGENT_INTEGRATION_SECRET với backend; bắt buộc khi BE bật middleware."""
    out: dict[str, str] = {}
    if extra:
        out.update(dict(extra))
    secret = (os.getenv("AGENT_INTEGRATION_SECRET") or "").strip()
    if secret:
        out["x-agent-integration-secret"] = secret
    return out
