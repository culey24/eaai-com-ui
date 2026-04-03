"""Thư mục file user upload (cùng convention ingestor uploaded_data nếu cần)."""
from __future__ import annotations

from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]


def uploaded_data_dir() -> Path:
    d = _REPO_ROOT / 'data' / 'uploaded_data'
    d.mkdir(parents=True, exist_ok=True)
    return d
