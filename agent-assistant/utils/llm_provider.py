"""Chọn LLM theo biến môi trường: OpenRouter nếu có OPENROUTER_API_KEY, không thì Google Gemini."""
from __future__ import annotations

import logging
import os
from typing import Any, Union

logger = logging.getLogger(__name__)


def _strip_or_empty(key: str) -> str:
    v = os.getenv(key)
    return (v or "").strip()


def use_openrouter() -> bool:
    return bool(_strip_or_empty("OPENROUTER_API_KEY"))


# Slug OpenRouter/LiteLLM cho Gemini 2.5 Flash (khi không đặt OPENROUTER_MODEL_ID / MODEL_ID).
_DEFAULT_OPENROUTER_GEMINI = "openrouter/google/gemini-2.5-flash"


def resolve_openrouter_model_id() -> str:
    """Model LiteLLM/OpenRouter, ví dụ openrouter/google/gemini-2.5-flash."""
    explicit = _strip_or_empty("OPENROUTER_MODEL_ID")
    if explicit:
        return explicit
    mid = _strip_or_empty("MODEL_ID")
    if not mid:
        return _DEFAULT_OPENROUTER_GEMINI
    if mid.startswith("openrouter/"):
        return mid
    if "/" in mid:
        return f"openrouter/{mid}"
    return f"openrouter/google/{mid}"


def get_adk_model() -> Union[Any, str]:
    """Tham số model cho google.adk.agents.Agent: LiteLlm (OpenRouter) hoặc tên model Gemini."""
    if use_openrouter():
        from google.adk.models.lite_llm import LiteLlm

        model_id = resolve_openrouter_model_id()
        logger.info("ADK backend=openrouter model=%s", model_id)
        return LiteLlm(model=model_id)

    model = _strip_or_empty("MODEL_ID") or "gemini-2.0-flash"
    logger.info("ADK backend=google_gemini model=%s", model)
    return model


def gemini_chat_completion_text(message: str) -> str:
    from google import genai

    api_key = _strip_or_empty("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is required when OpenRouter is not configured")
    model = _strip_or_empty("MODEL_ID") or "gemini-2.5-flash"
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(model=model, contents=message)
    return response.text or ""


def openrouter_chat_completion_text(message: str) -> str:
    import litellm

    model = resolve_openrouter_model_id()
    api_key = _strip_or_empty("OPENROUTER_API_KEY")
    resp = litellm.completion(
        model=model,
        messages=[{"role": "user", "content": message}],
        api_key=api_key,
    )
    if not resp.choices:
        return ""
    msg = resp.choices[0].message
    return (msg.content or "") if msg else ""


def chat_completion_text(message: str) -> str:
    if use_openrouter():
        return openrouter_chat_completion_text(message)
    return gemini_chat_completion_text(message)
