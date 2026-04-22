import os
import json
import logging
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

from google.adk.agents import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest
from google.adk.planners import BuiltInPlanner
from google.genai import types

from utils.llm_provider import get_adk_model
from .prompt import SUGGESTION_AGENT_INSTRUCTION_PROMPT

load_dotenv()
logger = logging.getLogger(__name__)

# Paths to the indexes
INDEX_FILE = Path(__file__).parent.parent.parent.parent / "data" / "pdf_index.json"
WEB_INDEX_FILE = Path(__file__).parent.parent.parent.parent / "data" / "web_links_index.json"

def load_pdf_index():
    """Load the PDF index from the JSON file."""
    if not INDEX_FILE.exists():
        logger.warning(f"PDF index file not found at {INDEX_FILE}")
        return "[]"
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error loading PDF index: {e}")
        return "[]"

def load_web_index():
    """Load the web links index from the JSON file."""
    if not WEB_INDEX_FILE.exists():
        logger.warning(f"Web index file not found at {WEB_INDEX_FILE}")
        return "[]"
    try:
        with open(WEB_INDEX_FILE, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error loading web index: {e}")
        return "[]"

def init_session_state(callback_context: CallbackContext) -> None:
    if "dynamic_profile" not in callback_context.state:
        callback_context.state["dynamic_profile"] = []
    if "language" not in callback_context.state:
        callback_context.state["language"] = "vi"

def create_agent(query: Optional[str] = None) -> Agent:
    pdf_index_data = load_pdf_index()
    web_index_data = load_web_index()
    
    instruction = SUGGESTION_AGENT_INSTRUCTION_PROMPT.format(
        dynamic_profile="{dynamic_profile}",
        pdf_index=pdf_index_data,
        web_index=web_index_data,
        language="{language}"
    )

    if query:
        instruction += f"\n\n## Current User Query:\n{query}"

    suggestion_agent = Agent(
        name="hcmut_suggestion_agent",
        model=get_adk_model(),
        instruction=instruction,
        before_agent_callback=init_session_state,
        output_key="suggestion_infos",
        generate_content_config=types.GenerateContentConfig(
            temperature=0.1,
        ),
        planner=BuiltInPlanner(thinking_config=types.ThinkingConfig(include_thoughts=False))
    )
    return suggestion_agent
