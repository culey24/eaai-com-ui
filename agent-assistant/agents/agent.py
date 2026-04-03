import os
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
import logging
import requests

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest
from google.adk.planners import BuiltInPlanner
from google.genai import types

from .prompt import MANAGER_AGENT_INSTRUCTION_PROMPT
from .tools import (
    call_persona_agent,
    call_provider_agent,
    call_supporter_agent,
    call_reminder_agent,
    read_uploaded_data_file,
)

load_dotenv()  # Load environment variables from .env file
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

from utils.llm_provider import get_adk_model
from utils.be_integration import be_integration_headers

from .service_urls import get_be_server_base_url

BE_SERVER = get_be_server_base_url()
ADK_APP_NAME = (os.getenv("ADK_APP_NAME") or "agents").strip() or "agents"

MAX_RETRIES = 4
MAX_FUNCTION_CALLS = 3

 
def setup_before_model_call(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    # Update timestamp in the callback context
    callback_context.state["_timestamp"] = datetime.now().isoformat()

    if "current_attempt" not in callback_context.state:
        # Initialize the step counter if not present
        callback_context.state["current_attempt"] = 0

    step = callback_context.state["current_attempt"]
    if step >= MAX_RETRIES + 2: # 1 for result from the final function call and 1 for the first exceeded step
        # Reset the step counter
        callback_context.state["current_attempt"] = 0
        # Skip further model calls – return failure string
        return LlmResponse(
            content=types.Content(
                role="model",
                parts=[types.Part(
                    text=(
                        "Rất tiếc, tôi không tìm thấy thông tin phù hợp. "
                        "Nếu bạn có thêm chi tiết, tôi sẵn lòng tìm giúp bạn."
                    )
                )]
            )
        )
    return None


def after_model_call(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> Optional[LlmResponse]:
    step = callback_context.state.get("current_attempt", 0)
    if llm_response.content and llm_response.content.parts:
        if llm_response.content.parts[0].text:
            pass # Do nothing with the text part

            # original_text = llm_response.content.parts[0].text
            # print("[Callback] Original text:", original_text)
        if llm_response.content.parts[0].function_call:
            callback_context.state["current_attempt"] = step + 1
            # print("[Callback] Function call detected")
    return None


def process_after_agent_call(callback_context: CallbackContext) -> Optional[types.Content]:
    # Reset the step counter after the model call
    callback_context.state["current_attempt"] = 0
    return None


def init_session_state(callback_context: CallbackContext) -> None:

    def get_user_role(user_id: str) -> str:
        response = requests.get(
            f"{BE_SERVER}/users/{user_id}/role",
            headers=be_integration_headers(),
            timeout=15,
        )
        if response.status_code == 200:
            return response.json().get("user_role", "student")
        return "student"

    def get_learning_history(user_id: str) -> list:
        response = requests.get(
            f"{BE_SERVER}/users/{user_id}/learning_history",
            headers=be_integration_headers(),
            timeout=30,
        )
        if response.status_code == 200:
            data = response.json().get("learning_history")
            return data if isinstance(data, list) else []
        return []

    # Initialize the session state for the agent
    if "current_attempt" not in callback_context.state:
        # Initialize the step counter if not present
        # This is necessary to ensure the agent can track attempts correctly
        # across multiple calls
        callback_context.state["current_attempt"] = 0

    invocation_context = getattr(callback_context, "_invocation_context", {})
    if invocation_context:
        user_id = getattr(invocation_context, "user_id", "user")
        callback_context.state["user_id"] = user_id

    # Initialize User's role
    if "user_role" not in callback_context.state:
        callback_context.state["user_role"] = get_user_role(callback_context.state["user_id"])

    # Initialize static profile from user's learning history
    if "static_profile" not in callback_context.state:
        callback_context.state["static_profile"] = get_learning_history(
            callback_context.state["user_id"]
        )
        # logger.info(callback_context.state['static_profile'])

    # Initialize dynamic profile for user_id
    if "dynamic_profile" not in callback_context.state:
        callback_context.state["dynamic_profile"] = []

    # logger.info(f"Current State: {callback_context.state}")


def create_agent() -> Agent:
    """
    Create the Manager LLM agent for coordinating sub-agents.

    Returns:
        Agent: The created Manager LLM agent.
    """

    manager_agent = Agent(
        name="hcmut_manager_agent",
        model=get_adk_model(),
        instruction=MANAGER_AGENT_INSTRUCTION_PROMPT.format(
            user_id="{user_id}",
            user_role="{user_role}",
            max_retries=MAX_RETRIES,
            current_attempt="{current_attempt}",
            static_profile="{static_profile}",
            dynamic_profile="{dynamic_profile}"
        ),
        before_model_callback=setup_before_model_call,
        before_agent_callback=init_session_state,
        after_model_callback=after_model_call,
        after_agent_callback=process_after_agent_call,
        tools=[
            call_persona_agent,
            read_uploaded_data_file,
            call_provider_agent,
            call_supporter_agent,
            call_reminder_agent,
        ],
        generate_content_config=types.GenerateContentConfig(
            temperature=0.2,
            top_p=0.1,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                maximum_remote_calls=MAX_FUNCTION_CALLS
            )
        ),
        planner=BuiltInPlanner(thinking_config=types.ThinkingConfig(
            include_thoughts=False,
            thinking_budget=1000  # Set a reasonable thinking budget for the agent
        ))
    )
    return manager_agent


root_agent = create_agent()
runner = Runner(
    agent=root_agent,
    app_name=ADK_APP_NAME,
    session_service=InMemorySessionService()
)
