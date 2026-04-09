import os
import logging
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
import requests

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest
from google.adk.planners import BuiltInPlanner
from google.genai import types

from utils.llm_provider import get_adk_model
from utils.be_integration import be_integration_headers

from .prompt import REMINDER_AGENT_INSTRUCTION_PROMPT
from .tools import get_active_journal_periods, get_current_schedule, get_user_journal_status, list_user_reminders, set_reminder
from ...service_urls import get_be_server_base_url

load_dotenv()  # Load environment variables from .env file
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

BE_SERVER = get_be_server_base_url()

MAX_RETRIES = 3
# Đủ chỗ cho get_user_journal_status + get_active_journal_periods + nhiều set_reminder (nhiều đợt chưa nộp).
MAX_FUNCTION_CALLS = 12

# Không dùng chung `current_attempt` với Manager: sau call_persona + call_reminder, state của Manager
# làm bộ đếm của Reminder tăng sớm → before_model trả "không tìm thấy thông tin" sau 3–4 tool calls.
_ATTEMPT_KEY = "_reminder_fc_round"


def setup_before_model_call(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    # Update timestamp in the callback context
    callback_context.state["_timestamp"] = datetime.now().isoformat()

    step = int(callback_context.state.get(_ATTEMPT_KEY, 0))
    callback_context.state["current_attempt"] = step

    if step >= MAX_RETRIES + 2: # 1 for result from the final function call and 1 for the first exceeded step
        callback_context.state[_ATTEMPT_KEY] = 0
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
    step = int(callback_context.state.get(_ATTEMPT_KEY, 0))
    if llm_response.content and llm_response.content.parts:
        if llm_response.content.parts[0].text:
            pass # Do nothing with the text part
 
            # original_text = llm_response.content.parts[0].text
            # print("[Callback] Original text:", original_text)
        if llm_response.content.parts[0].function_call:
            callback_context.state[_ATTEMPT_KEY] = step + 1
            # print("[Callback] Function call detected")
    return None
 
 
def process_after_agent_call(callback_context: CallbackContext) -> Optional[types.Content]:
    callback_context.state[_ATTEMPT_KEY] = 0
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

    callback_context.state[_ATTEMPT_KEY] = 0
    callback_context.state["current_attempt"] = 0

    invocation_context = getattr(callback_context, "_invocation_context", {})
    if invocation_context:
        callback_context.state["user_id"] = getattr(invocation_context, "user_id", "user")

    # Initialize User's role
    if "user_role" not in callback_context.state:
        logger.warning(f"'user_role' not in callback_context.state")
        callback_context.state["user_role"] = get_user_role(callback_context.state["user_id"])

    # Initialize static profile from user's learning history
    if "static_profile" not in callback_context.state:
        logger.warning(f"'static_profile' not in callback_context.state")
        callback_context.state["static_profile"] = get_learning_history(
            callback_context.state["user_id"]
        )

    # Initialize dynamic profile for user_id
    if "dynamic_profile" not in callback_context.state:
        callback_context.state["dynamic_profile"] = []


def create_agent(query: Optional[str] = None) -> Agent:
    """
    Creates and returns a Provider LLM agent with specified configurations.

    Returns:
        Agent: The created Provider LLM agent.
    """
    instruction = REMINDER_AGENT_INSTRUCTION_PROMPT
    if query:
        instruction += f"""
        ## Specific Query Mandate
        - The user has requested: {query}
        """

    provider_agent = Agent(
        name="hcmut_reminder_agent",
        model=get_adk_model(),
        instruction=instruction.format(
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
        output_key="reminded_infos",
        tools=[get_user_journal_status, get_active_journal_periods, get_current_schedule, set_reminder, list_user_reminders],
        generate_content_config=types.GenerateContentConfig(
            temperature=0.1,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                maximum_remote_calls=MAX_FUNCTION_CALLS
            )
        ),
        planner=BuiltInPlanner(thinking_config=types.ThinkingConfig(include_thoughts=False))
    )
    return provider_agent
 
 
# root_agent = create_agent()
