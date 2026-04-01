"""BUILD URL BE / Agent Server từ env (chatbot + agents đều dùng)."""

import os


def _strip_base(url: str) -> str:
    return url.strip().rstrip("/")


def get_be_server_base_url() -> str:
    explicit = (os.getenv("BE_SERVER_BASE_URL") or "").strip()
    if explicit:
        return _strip_base(explicit)
    scheme = (os.getenv("BE_SERVER_SCHEME") or "http").strip().lower()
    if scheme not in ("http", "https"):
        scheme = "http"
    host = (os.getenv("BE_SERVER_HOST") or "localhost").strip()
    port_raw = (os.getenv("BE_SERVER_PORT") or "").strip()
    if not port_raw:
        port_raw = "443" if scheme == "https" else "8002"
    default_port = "443" if scheme == "https" else "80"
    if port_raw == default_port:
        return _strip_base(f"{scheme}://{host}")
    return _strip_base(f"{scheme}://{host}:{port_raw}")


def get_agent_server_base_url() -> str:
    explicit = (os.getenv("AGENT_SERVER_BASE_URL") or "").strip()
    if explicit:
        return _strip_base(explicit)
    scheme = (os.getenv("AGENT_SERVER_SCHEME") or "http").strip().lower()
    if scheme not in ("http", "https"):
        scheme = "http"
    host = (os.getenv("AGENT_SERVER_HOST") or "localhost").strip()
    port_raw = (os.getenv("AGENT_SERVER_PORT") or "").strip()
    if not port_raw:
        port_raw = "443" if scheme == "https" else "8000"
    default_port = "443" if scheme == "https" else "80"
    if port_raw == default_port:
        return _strip_base(f"{scheme}://{host}")
    return _strip_base(f"{scheme}://{host}:{port_raw}")
