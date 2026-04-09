import logging
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
import requests

from google.adk.agents import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest
from google.adk.planners import BuiltInPlanner
from google.genai import types

from utils.llm_provider import get_adk_model
from utils.be_integration import be_integration_headers

from .prompt import RUBRIC_AGENT_INSTRUCTION_PROMPT
from ...service_urls import get_be_server_base_url

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s",
)
logger = logging.getLogger(__name__)

BE_SERVER = get_be_server_base_url()

MAX_RETRIES = 3
MAX_FUNCTION_CALLS = 0

_ATTEMPT_KEY = "_rubric_fc_round"


def setup_before_model_call(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    callback_context.state["_timestamp"] = datetime.now().isoformat()
    step = int(callback_context.state.get(_ATTEMPT_KEY, 0))
    callback_context.state["current_attempt"] = step
    if step >= MAX_RETRIES + 2:
        callback_context.state[_ATTEMPT_KEY] = 0
        callback_context.state["current_attempt"] = 0
        return LlmResponse(
            content=types.Content(
                role="model",
                parts=[
                    types.Part(
                        text=(
                            "Rất tiếc, mình không xử lý kịp yêu cầu so khớp rubric. "
                            "Bạn gửi lại rubric/yêu cầu và (nếu có) đoạn bài cần đối chiếu nhé."
                        )
                    )
                ],
            )
        )
    return None


def after_model_call(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> Optional[LlmResponse]:
    step = int(callback_context.state.get(_ATTEMPT_KEY, 0))
    if llm_response.content and llm_response.content.parts:
        if llm_response.content.parts[0].function_call:
            callback_context.state[_ATTEMPT_KEY] = step + 1
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

    if "user_role" not in callback_context.state:
        callback_context.state["user_role"] = get_user_role(callback_context.state["user_id"])

    if "static_profile" not in callback_context.state:
        callback_context.state["static_profile"] = get_learning_history(
            callback_context.state["user_id"]
        )

    if "dynamic_profile" not in callback_context.state:
        callback_context.state["dynamic_profile"] = []


def create_agent(query: Optional[str] = None) -> Agent:
    instruction = RUBRIC_AGENT_INSTRUCTION_PROMPT
    if query:
        instruction += f"""
## Yêu cầu cụ thể (từ Manager)
{query}
"""

    return Agent(
        name="hcmut_rubric_agent",
        model=get_adk_model(),
        instruction=instruction.format(
            user_id="{user_id}",
            user_role="{user_role}",
            max_retries=MAX_RETRIES,
            current_attempt="{current_attempt}",
            static_profile="{static_profile}",
            dynamic_profile="{dynamic_profile}",
        ),
        before_model_callback=setup_before_model_call,
        before_agent_callback=init_session_state,
        after_model_callback=after_model_call,
        after_agent_callback=process_after_agent_call,
        output_key="rubric_infos",
        generate_content_config=types.GenerateContentConfig(
            temperature=0.2,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                maximum_remote_calls=MAX_FUNCTION_CALLS
            ),
        ),
        planner=BuiltInPlanner(thinking_config=types.ThinkingConfig(include_thoughts=False)),
    )
