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
from .prompt import BATCH_EVALUATOR_AGENT_INSTRUCTION_PROMPT

load_dotenv()
logger = logging.getLogger(__name__)

def create_agent(query: Optional[str] = None) -> Agent:
    instruction = BATCH_EVALUATOR_AGENT_INSTRUCTION_PROMPT
    
    if query:
        instruction += f"\n\n## Content to Evaluate:\n{query}"

    agent = Agent(
        name="batch_evaluator_agent",
        model=get_adk_model(),
        instruction=instruction,
        output_key="evaluation_result",
        generate_content_config=types.GenerateContentConfig(
            temperature=0.3,
        ),
        planner=BuiltInPlanner(thinking_config=types.ThinkingConfig(include_thoughts=False))
    )
    return agent
