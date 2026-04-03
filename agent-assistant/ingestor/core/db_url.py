"""Thông tin kết nối PostgreSQL từ DATABASE_URL (cùng biến với Prisma) hoặc POSTGRES_*."""
from __future__ import annotations

import os
from urllib.parse import unquote, urlparse


def get_psycopg2_kwargs() -> dict:
    raw = (os.getenv('DATABASE_URL') or '').strip()
    if raw:
        parsed = urlparse(raw)
        path = (parsed.path or '/').lstrip('/')
        dbname = path.split('?')[0] or 'postgres'
        return {
            'host': parsed.hostname or 'localhost',
            'port': parsed.port or 5432,
            'user': unquote(parsed.username or ''),
            'password': unquote(parsed.password or ''),
            'database': dbname,
        }
    return {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', '5432')),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'password'),
        'database': os.getenv('POSTGRES_DB', 'postgres'),
    }
