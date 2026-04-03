import logging
from pathlib import Path

from google.adk.tools import ToolContext, agent_tool

from utils.file_reader import FileReader
from utils.upload_paths import uploaded_data_dir

from .sub_agents.persona_agent import create_agent as create_persona_agent
from .sub_agents.provider_agent import create_agent as create_provider_agent
from .sub_agents.reminder_agent import create_agent as create_reminder_agent
from .sub_agents.supporter_agent import create_agent as create_supporter_agent


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

_MAX_UPLOAD_EXTRACT = 100_000


async def read_uploaded_data_file(file_name: str, tool_context: ToolContext):
    """
    Đọc nội dung file người dùng đã upload qua POST /upload (tên file trả về API).
    Chỉ chấp nhận tên file đơn, không đường dẫn.
    """
    if not file_name or not isinstance(file_name, str):
        return 'Thiếu tên file.'
    safe = Path(file_name.strip()).name
    if safe != file_name.strip():
        return 'Tên file không hợp lệ (không được chứa đường dẫn).'
    path = uploaded_data_dir() / safe
    if not path.is_file():
        return f'Không tìm thấy file "{safe}". Hãy upload trước qua /upload.'
    reader = FileReader(path)
    ext = path.suffix.lower()
    if ext in ('.xlsx', '.xls', '.csv'):
        raw = reader.extract_text()
        if raw is None:
            return 'Không đọc được bảng tính.'
        text = raw.head(80).to_string() if hasattr(raw, 'head') else str(raw)
    else:
        text = reader.extract_text() or ''
    if not text.strip():
        return 'Không trích được chữ từ file.'
    if len(text) > _MAX_UPLOAD_EXTRACT:
        return (
            text[:_MAX_UPLOAD_EXTRACT]
            + f'\n\n… (đã cắt còn {_MAX_UPLOAD_EXTRACT} ký tự)'
        )
    return text


async def call_persona_agent(query: str, tool_context: ToolContext):
    """
    Calls the persona agent with the provided query and returns the response.

    Args:
        query: A query to be processed by the persona agent.
        tool_context: The context object provided by the ADK framework for
                        performing tasks like calling agents.
    Returns:
        A string containing the response from the persona agent.
    """
    try:
        persona_agent = create_persona_agent(query=query)
        persona_tool = agent_tool.AgentTool(agent=persona_agent)
        response = await persona_tool.run_async(
            args={"request": "Update the dynamic profile based on the query."},
            tool_context=tool_context
        )
        return "Updated dynamic profile successfully."
    except Exception as e:
        logger.error(f"Error calling Persona Agent: {str(e)}")
        return f"Error calling Persona Agent: {str(e)}"


async def call_provider_agent(query: str, tool_context: ToolContext):
    """
    Calls the provider agent with the provided query and returns the response.
 
    Args:
        query: A query to be processed by the provider agent.
        tool_context: The context object provided by the ADK framework for
                        performing tasks like calling agents.
    Returns:
        A string containing the response from the provider agent.
    """
    try:
        provider_agent = create_provider_agent(query=query)
        provider_tool = agent_tool.AgentTool(agent=provider_agent)
        response = await provider_tool.run_async(
            args={"request": "Provide informations based on the query."},
            tool_context=tool_context
        )
        return tool_context.state["provided_infos"]
    except Exception as e:
        logger.error(f"Error calling provider agent: {str(e)}")
        return f"Error calling provider agent: {str(e)}"


async def call_supporter_agent(query: str, tool_context: ToolContext):
    """
    Calls the supporter agent with the provided query and returns the response.
 
    Args:
        query: A query to be processed by the supporter agent.
        tool_context: The context object provided by the ADK framework for
                        performing tasks like calling agents.
    Returns:
        A string containing the response from the supporter agent.
    """
    try:
        supporter_agent = create_supporter_agent(query=query)
        supporter_tool = agent_tool.AgentTool(agent=supporter_agent)
        response = await supporter_tool.run_async(
            args={"request": "Practical support based on the query."},
            tool_context=tool_context
        )
        return tool_context.state["supported_infos"]
    except Exception as e:
        logger.error(f"Error calling supporter agent: {str(e)}")
        return f"Error calling supporter agent: {str(e)}"


async def call_reminder_agent(query: str, tool_context: ToolContext):
    """
    Calls the reminder agent with the provided query and returns the response.
 
    Args:
        query: A query to be processed by the reminder agent.
        tool_context: The context object provided by the ADK framework for
                        performing tasks like calling agents.
    Returns:
        A string containing the response from the reminder agent.
    """
    try:
        reminder_agent = create_reminder_agent(query=query)
        reminder_tool = agent_tool.AgentTool(agent=reminder_agent)
        response = await reminder_tool.run_async(
            args={"request": "Provide reminders based on the query."},
            tool_context=tool_context
        )
        return tool_context.state["reminded_infos"]
    except Exception as e:
        logger.error(f"Error calling reminder agent: {str(e)}")
        return f"Error calling reminder agent: {str(e)}"
