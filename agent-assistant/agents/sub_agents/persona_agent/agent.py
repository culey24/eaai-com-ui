import os
import logging
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
import requests
import json

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest
from google.adk.planners import BuiltInPlanner
from google.genai import types
 
from utils.llm_provider import get_adk_model
from utils.be_integration import be_integration_headers

from .prompt import PERSONA_AGENT_INSTRUCTION_PROMPT
from ...service_urls import get_be_server_base_url

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

BE_SERVER = get_be_server_base_url()

MAX_RETRIES = 3
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

    current_profile = callback_context.state.get("dynamic_profile", [])

    if llm_response.content and llm_response.content.parts:
        if llm_response.content.parts[0].text:
            text_response = llm_response.content.parts[0].text.strip()
            # logger.info(f"Persona Agent response text: {text_response}")

            try:
                # 1. Find and extract the JSON portion if it is enclosed within a Markdown code block (```json...```)
                if text_response.startswith("```json"):
                    json_str = text_response.replace("```json", "", 1).rstrip("```").strip()
                elif text_response.startswith("```"):
                    json_str = text_response.replace("```", "", 1).rstrip("```").strip()
                else:
                    json_str = text_response

                updated_profile = json.loads(json_str)

                # 2. Update the dynamic_profile in the callback_context state
                if isinstance(updated_profile, list) or isinstance(updated_profile, dict):
                    # Update the subject information to match the subject_name, while keeping the rest of the subjects unchanged.
                    if current_profile == []:
                        logger.info(f"Updated dynamic profile: {updated_profile}")
                        callback_context.state["dynamic_profile"] = updated_profile
                        return None
                    
                    target_subject_name = updated_profile.get('subject_name')
                    found = False

                    if not target_subject_name:
                        logger.warning("JSON response missing 'subject_name'")
                        return None

                    new_profile = []
                    for subject in current_profile:
                        if subject['subject_name'] == target_subject_name:
                            new_profile.append(updated_profile)
                            found = True
                        else:
                            new_profile.append(subject)

                    if not found:
                        new_profile.append(updated_profile)
                    
                    logger.info(f"Updated dynamic profile: {new_profile}")
                    callback_context.state["dynamic_profile"] = new_profile
                
                else:
                    logger.warning(f"Expected dict but got {type(updated_profile)}. Skipping update.")
                    return None

            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON from Persona Agent response: {e} - Response text: {text_response}")
                # If decoding fails, allow the LLM to retry (increase the step).
                callback_context.state["current_attempt"] = step + 1
                
        if llm_response.content.parts[0].function_call:
            # Increase step if there is a function call (though there shouldn't be in Persona Agent)
            callback_context.state["current_attempt"] = step + 1
            
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
    user_id = getattr(invocation_context, "user_id", "user")
    if invocation_context:
        callback_context.state["user_id"] = user_id

    # Initialize User's role
    if "user_role" not in callback_context.state:
        callback_context.state["user_role"] = get_user_role(callback_context.state["user_id"])

    # Initialize static profile from user's learning history
    if "static_profile" not in callback_context.state:
        history_data = get_learning_history(callback_context.state["user_id"])

        try:
            profile_str = json.dumps(history_data, ensure_ascii=False, indent=2).strip()
            callback_context.state["static_profile"] = profile_str
        except Exception as e:
            logger.error(f"Failed to dump static profile to JSON: {e}")
            callback_context.state["static_profile"] = str(history_data).strip()

    # Initialize dynamic profile for user_id
    if "dynamic_profile" not in callback_context.state:
        callback_context.state["dynamic_profile"] = []

    # logger.info(f"Current State: {callback_context.state}")


def create_agent(query: Optional[str] = None) -> Agent:
    """
    Creat Persona LLM agent for updating user's dynamic profile.

    Returns:
        Agent: The created Provider LLM agent.
    """
    instruction = PERSONA_AGENT_INSTRUCTION_PROMPT
    if query:
        instruction += f"""
        ## Specific Query Mandate
        - The user has requested: {query}
        """

    provider_agent = Agent(
        name="hcmut_persona_agent",
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
        output_key="personal_infos",
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
