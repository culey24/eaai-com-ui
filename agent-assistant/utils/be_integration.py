"""Header và tiện ích gọi backend Node (route agent integration)."""

from __future__ import annotations

import logging
import os
from typing import Mapping

_logger = logging.getLogger(__name__)


def log_agent_integration_http(
    event: str,
    *,
    method: str,
    path: str,
    user_id: str | None = None,
    status_code: int | None = None,
) -> None:
    """Một dòng log có cấu trúc cho mọi HTTP tới route integration (journal, reminders, …)."""
    _logger.info(
        "[agent_integration] event=%s method=%s path=%s user_id=%s status=%s",
        event,
        method,
        path,
        user_id if user_id else "-",
        status_code if status_code is not None else "-",
    )


def be_integration_headers(extra: Mapping[str, str] | None = None) -> dict[str, str]:
    """Trùng biến AGENT_INTEGRATION_SECRET với backend; bắt buộc khi BE bật middleware."""
    out: dict[str, str] = {}
    if extra:
        out.update(dict(extra))
    secret = (os.getenv("AGENT_INTEGRATION_SECRET") or "").strip()
    if secret:
        out["x-agent-integration-secret"] = secret
    return out
