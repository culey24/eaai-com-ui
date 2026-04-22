import os
import json
import shutil
import time
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, Any, Dict, Tuple, List
import uuid
import logging
from concurrent.futures import ThreadPoolExecutor
import requests
import httpx
import pandas as pd
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google.genai.errors import APIError as GeminiAPIError

from utils.types import timestamp_to_datetime, clean_llm_json
from utils.service_urls import get_agent_server_base_url, get_be_server_base_url
from utils.llm_provider import chat_completion_text, use_openrouter
from utils.be_integration import be_integration_headers
from utils.upload_paths import uploaded_data_dir
from utils.faq_agent import run_faq_agent
from agents.sub_agents.batch_evaluator_agent.agent import create_agent as create_batch_evaluator_agent

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

AGENT_SERVER = get_agent_server_base_url()
BE_SERVER = get_be_server_base_url()
logger.info("AGENT_SERVER=%s BE_SERVER=%s", AGENT_SERVER, BE_SERVER)


def _requests_post_retry_connect(url: str, **kwargs):
    """
    ADK cold start / race với Cloud Run: probe 8003 pass khi uvicorn lên, ADK :8000 có thể chưa bind.
    """
    max_attempts = 30
    delay_s = 2.0
    last_err = None
    for attempt in range(max_attempts):
        try:
            return requests.post(url, **kwargs)
        except requests.exceptions.ConnectionError as e:
            last_err = e
            if attempt < max_attempts - 1:
                logger.warning(
                    "POST %s ConnectionError %s/%s: %s; retry in %ss",
                    url,
                    attempt + 1,
                    max_attempts,
                    e,
                    delay_s,
                )
                time.sleep(delay_s)
    raise last_err


def _is_adk_session_not_found_response(response: requests.Response) -> bool:
    """ADK mất session (restart / InMemorySessionService) trong khi UUID vẫn còn ở BE."""
    if response.status_code != 404:
        return False
    text = (response.text or "").lower()
    if "session not found" in text:
        return True
    try:
        j = response.json()
        d = j.get("detail")
        if isinstance(d, str) and "session not found" in d.lower():
            return True
    except Exception:
        pass
    return False


def _register_session_on_adk_server(user_id: str, session_id: str, app_name: str) -> bool:
    """Đồng bộ lại session lên ADK (cùng URL như create_session)."""
    url = f"{AGENT_SERVER}/apps/{app_name}/users/{user_id}/sessions/{session_id}"
    r = _requests_post_retry_connect(url, timeout=60)
    if r.status_code != 200:
        logger.error(
            "register ADK session failed: HTTP %s %s",
            r.status_code,
            (r.text or "")[:1500],
        )
    return r.status_code == 200


def _normalize_adk_run_events(response_json: Any) -> List[Any]:
    """POST /run có thể trả list trực tiếp hoặc { \"events\": [...] }."""
    if isinstance(response_json, list):
        return response_json
    if isinstance(response_json, dict):
        ev = response_json.get("events")
        if isinstance(ev, list):
            return ev
        for key in ("data", "result", "output"):
            v = response_json.get(key)
            if isinstance(v, list):
                return v
    return []


def _extract_text_from_adk_run_event(event_data: Any) -> Optional[str]:
    if not isinstance(event_data, dict):
        return None
    content = event_data.get("content")
    if not isinstance(content, dict):
        return None
    parts = content.get("parts")
    if not isinstance(parts, list):
        return None
    for part in parts:
        if not isinstance(part, dict):
            continue
        t = part.get("text")
        if t is not None and str(t).strip():
            return str(t)
    return None


def _extract_bot_text_from_adk_run(response_json: Any) -> Tuple[Optional[str], Optional[Any]]:
    """Lấy nội dung assistant từ tin nhắn gần nhất (duyệt từ cuối event list)."""
    events = _normalize_adk_run_events(response_json)
    for event_data in reversed(events):
        txt = _extract_text_from_adk_run_event(event_data)
        if txt and txt.strip():
            ts = event_data.get("timestamp") if isinstance(event_data, dict) else None
            return txt.strip(), ts
    return None, None


CURRENT_DIR = Path(__file__).parent
# agent-assistant/chatbot_server → data cùng cấp với chatbot_server
DATA_FOLDER = CURRENT_DIR.parent / "data"
DATA_FOLDER.mkdir(parents=True, exist_ok=True)
EVALUATION_DIR = DATA_FOLDER / "eval_data"
EVALUATION_DIR.mkdir(parents=True, exist_ok=True)

APP_NAME = (os.getenv("ADK_APP_NAME") or "agents").strip() or "agents"
MAX_RETRIES = 5


app = FastAPI(
    title="Chatbot APIs",
    description="APIs used by Chatbot Server for managing sessions and interactions",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

executor = ThreadPoolExecutor()


# =============================================================================================== #


async def db_save_session(user_id: str):
    url = f"{BE_SERVER}/users/{user_id}/sessions"
    session_id = str(uuid.uuid4())
    # JSON body must use primitives; uuid.UUID is not JSON-serializable for httpx.
    payload = {"user_id": user_id, "session_id": session_id}

    headers = be_integration_headers()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0, headers=headers)
            if response.status_code == 201:
                logger.info(f"Successfully created session for user {user_id}")
                return session_id
            else:
                logger.error(f"BE failed to create session: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error calling BE add_user_session: {e}")
            return None


async def db_update_session_status(session_id: str, status: str):
    url = f"{BE_SERVER}/sessions/{session_id}/update"
    payload = {
        "session_id": session_id,
        "new_status": status
    }

    headers = be_integration_headers()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0, headers=headers)
            if response.status_code == 201:
                logger.info(f"Successfully updated session {session_id} to {status}")
                return True
            else:
                logger.error(f"BE failed to update session: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error calling BE update_session_status: {e}")
            return False


async def db_get_user_role(user_id: str) -> str:
    url = f"{BE_SERVER}/users/{user_id}/role"
    headers = be_integration_headers()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=5.0, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return data.get("user_role", "user")
            return "user"
        except Exception as e:
            logger.error(f"Error getting user role from BE: {e}")
            return "user"


async def db_save_message(
    session_id: str, role: str, content: str,
    file_ids: Optional[list] = None,
    dynamic_profile: Optional[Dict[str, Any]] = None,
    tokens_count: Optional[int] = None
):
    url = f"{BE_SERVER}/sessions/{session_id}/conversations"
    payload = {
        "session_id": session_id,
        "chat_role": role,
        "content": content,
        "file_ids": file_ids,
        "dynamic_profile": dynamic_profile,
        "tokens_count": tokens_count
    }

    headers = be_integration_headers()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0, headers=headers)
            if response.status_code == 201:
                logger.info(f"Message saved: {role} for session {session_id}")
                return True
            else:
                logger.error(f"Failed to save message to BE: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Connection error to BE: {e}")
            return False


# =============================================================================================== #


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form(..., description="User ID."),
    session_id: str = Form(..., description="Session ID (UUID phiên agent)."),
):
    """
    Lưu file upload: `{session_id}_{tên_gốc}{đuôi}` trong data/uploaded_data/.
    Dùng `file_name` trả về với tool `read_uploaded_data_file` của agent.
    """
    try:
        original_path = Path(file.filename or "unnamed")
        original_name = original_path.stem
        extension = original_path.suffix
        new_filename = f"{session_id}_{original_name}{extension}"
        save_path = uploaded_data_dir() / new_filename

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return JSONResponse(
            status_code=200,
            content={
                "user_id": user_id,
                "session_id": session_id,
                "file_name": new_filename,
                "message": "File uploaded successfully",
            },
        )
    except Exception as e:
        logger.error("upload failed: %s", e)
        return JSONResponse(
            status_code=500,
            content={"user_id": user_id, "session_id": session_id, "error": str(e)},
        )
    finally:
        await file.close()


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the server is running.
    """
    return JSONResponse(
        status_code=200,
        content={"status": "Server is ready"}
    )


@app.post("/users/{user_id}/sessions")
async def create_session(user_id: str, app_name: str = APP_NAME):
    session_id = await db_save_session(user_id)

    if not session_id:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to create session in backend (BE).", "user_id": user_id},
        )

    url = f"{AGENT_SERVER}/apps/{app_name}/users/{user_id}/sessions/{session_id}"
    response = await asyncio.to_thread(_requests_post_retry_connect, url, timeout=60)

    if response.status_code == 200:
        return JSONResponse(
            status_code=200,
            content={
                "message": "Successfully created session on AGENT SERVER.",
                "user_id": user_id,
                "session_id": session_id,
                "adk_registered": True,
            },
        )

    return JSONResponse(
        status_code=502,
        content={
            "error": "Backend session created but ADK registration failed.",
            "user_id": user_id,
            "session_id": session_id,
            "adk_registered": False,
            "adk_status": response.status_code,
        },
    )


@app.get("/users/{user_id}/sessions/{session_id}")
async def get_session(user_id: str, session_id: str, app_name: str = APP_NAME):
    """Ưu tiên PostgreSQL (agent_session_messages); fallback ADK khi không có bản ghi / lỗi."""
    be_url = f"{BE_SERVER}/sessions/{session_id}/conversations"
    headers = be_integration_headers()
    try:
        async with httpx.AsyncClient() as client:
            be_resp = await client.get(be_url, headers=headers, timeout=30.0)
        if be_resp.status_code == 401:
            logger.error("Backend agent integration 401 — kiểm tra AGENT_INTEGRATION_SECRET")
            return JSONResponse(
                status_code=502,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "error": "Backend integration unauthorized",
                },
            )
        if be_resp.status_code == 200:
            payload = be_resp.json()
            owner = payload.get("user_id")
            if owner and owner != user_id:
                logger.warning(
                    "session %s thuộc user_id=%s, path user_id=%s",
                    session_id,
                    owner,
                    user_id,
                )
            rows = payload.get("data") or []
            conversations = []
            events = []
            for conv in rows:
                ts_raw = conv.get("created_at")
                conversations.append({
                    "conversation_id": conv.get("conversation_id"),
                    "text": conv.get("content"),
                    "role": conv.get("chat_role"),
                    "files": conv.get("files"),
                    "dynamic_profile": conv.get("dynamic_profile"),
                    "timestamp": ts_raw,
                })
                events.append({
                    "text": conv.get("content") or "",
                    "role": conv.get("chat_role"),
                    "timestamp": timestamp_to_datetime(ts_raw),
                })
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "events": events,
                    "conversations": conversations,
                    "source": "database",
                },
            )
        if be_resp.status_code != 404:
            logger.warning(
                "GET %s → %s %s", be_url, be_resp.status_code, be_resp.text[:500]
            )
    except Exception as e:
        logger.warning("Đọc session từ BE lỗi: %s", e)

    url = f"{AGENT_SERVER}/apps/{app_name}/users/{user_id}/sessions/{session_id}"
    response = requests.get(url, timeout=60)
    if response.status_code == 200:
        response_json = response.json()

        if "events" in response_json:
            list_event = []
            for event in response_json["events"]:
                if "content" in event.keys():
                    if "text" in event["content"]["parts"][0].keys():
                        list_event.append({
                            "text": event["content"]["parts"][0]["text"],
                            "role": event["content"]["role"],
                            "timestamp": timestamp_to_datetime(event["timestamp"])
                        })

            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "events": list_event,
                    "source": "adk",
                }
            )

        else:
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "events": [],
                    "source": "adk",
                }
            )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "user_id": user_id,
                "session_id": session_id,
                "error": "Failed to get session",
                "source": "adk",
            }
        )


@app.delete("/users/{user_id}/sessions/{session_id}")
async def delete_session(user_id: str, session_id: str, app_name: str = APP_NAME):
    agent_url = f"{AGENT_SERVER}/apps/{app_name}/users/{user_id}/sessions/{session_id}"
    response = requests.delete(agent_url, timeout=60)

    if response.status_code == 200: 
        if await db_update_session_status(session_id, "deactive"):
            return JSONResponse(status_code=200, content={"status": "Session deactivated"})

    return JSONResponse(status_code=500, content={"status": "Failed to delete session"})


@app.post("/chat-with-agent")
async def run_agent(request: Request):
    request_data = await request.json()
    user_id = request_data.get("user_id")
    session_id = request_data.get("session_id")
    message = request_data.get("message")
    payload = {
        "app_name": APP_NAME,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": {
            "role": "user",
            "parts": [{"text": message}]
        },
        # "streaming": True
    }

    await db_save_message(session_id, "user", message)

    # Agent 1 — FAQ Agent: embedding (OpenRouter hoặc local), đủ ngưỡng thì trả lời ngay; sau đó mới ADK.
    try:
        faq_text, faq_score = await asyncio.to_thread(
            run_faq_agent, message if isinstance(message, str) else ""
        )
    except Exception as e:
        logger.exception("chat-with-agent: run_faq_agent failed: %s", e)
        return JSONResponse(
            status_code=500,
            content={"error": f"faq_agent: {e!s}", "detail": "run_faq_agent raised"},
        )

    if faq_text:
        await db_save_message(session_id, "model", faq_text)
        return JSONResponse(
            status_code=200,
            content={
                "user_id": user_id,
                "session_id": session_id,
                "text": faq_text,
                "role": "model",
                "source": "faq_agent",
                "faq_score": round(faq_score, 4),
            },
        )

    try:
        response = await asyncio.to_thread(
            _requests_post_retry_connect,
            f"{AGENT_SERVER}/run",
            json=payload,
            timeout=300,
        )

        if _is_adk_session_not_found_response(response):
            logger.warning(
                "chat-with-agent: ADK 404 Session not found — re-register session %s user %s then retry /run",
                session_id,
                user_id,
            )
            reg_ok = await asyncio.to_thread(
                _register_session_on_adk_server, user_id, session_id, APP_NAME
            )
            if reg_ok:
                # Tránh race: ADK vừa POST session xong, /run gọi quá sớm có thể 500.
                await asyncio.sleep(0.35)
                response = await asyncio.to_thread(
                    _requests_post_retry_connect,
                    f"{AGENT_SERVER}/run",
                    json=payload,
                    timeout=300,
                )
            else:
                logger.error(
                    "chat-with-agent: could not re-register session on ADK; returning first 404"
                )

        if response.status_code == 200:
            try:
                response_json = response.json()
            except Exception as e:
                logger.exception("chat-with-agent: ADK /run 200 nhưng không parse được JSON: %s", e)
                return JSONResponse(
                    status_code=502,
                    content={"error": "ADK /run trả body không phải JSON", "detail": str(e)},
                )

            bot_text, _ = _extract_bot_text_from_adk_run(response_json)
            if bot_text:
                await db_save_message(session_id, "model", bot_text)
                return JSONResponse(
                    status_code=200,
                    content={
                        "user_id": user_id,
                        "session_id": session_id,
                        "text": bot_text,
                        "role": "model",
                        "source": "adk",
                    },
                )

            logger.error(
                "chat-with-agent: ADK /run 200 nhưng không có text trong events; "
                "top_type=%s keys=%s sample=%s",
                type(response_json).__name__,
                list(response_json.keys()) if isinstance(response_json, dict) else None,
                json.dumps(response_json, default=str)[:4000],
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Agent returned empty content",
                    "hint": "Xem log chatbot (sample ADK response đã ghi) hoặc /tmp/adk-boot.log",
                },
            )
        else:
            err_snip = (response.text or "")[:2000]
            try:
                ej = response.json()
                if isinstance(ej, dict) and ej.get("detail"):
                    err_snip = f"{ej.get('detail')!s} | raw={err_snip[:800]}"
            except Exception:
                pass
            logger.error(
                "chat-with-agent: ADK /run HTTP %s body=%s",
                response.status_code,
                err_snip,
            )
            return JSONResponse(
                status_code=response.status_code, content={"error": response.text}
            )
    except Exception as e:
        logger.exception("Error in chat-with-agent (ADK /run or parse): %s", e)
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/evaluate-journal")
async def evaluate_journal(request: Request):
    """
    Specialized endpoint for batch evaluation of journal content.
    Does not save to DB (handled by the caller) and uses BatchEvaluatorAgent directly.
    """
    try:
        request_data = await request.json()
        user_id = request_data.get("user_id")
        content = request_data.get("content")
        
        if not user_id or not content:
            return JSONResponse(
                status_code=400,
                content={"error": "user_id and content are required"}
            )
            
        # Create the specialized evaluator agent
        # We don't pass query here to avoid curly brace parsing issues in system instruction
        agent = create_batch_evaluator_agent()
        
        # We need a Runner to execute the agent
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService
        from google.genai import types
        
        # Use a one-off session
        session_id = str(uuid.uuid4())
        session_service = InMemorySessionService()
        
        # We MUST create the session before running
        await session_service.create_session(
            app_name=f"{APP_NAME}_batch",
            user_id=user_id,
            session_id=session_id
        )
        
        runner = Runner(
            app_name=f"{APP_NAME}_batch",
            agent=agent,
            session_service=session_service
        )
        
        # Run the agent directly via Runner
        try:
            # Runner.run() is a generator
            def run_sync():
                events = runner.run(
                    user_id=user_id,
                    session_id=session_id,
                    new_message=types.Content(
                        role="user",
                        parts=[types.Part(text=f"Please evaluate this journal content:\n\n{content}")]
                    )
                )
                
                # Collect bot text from events
                bot_text = ""
                for event in events:
                    if event.is_final_response() and event.content and event.content.parts:
                        for part in event.content.parts:
                            if part.text:
                                bot_text += part.text
                return bot_text
            
            evaluation = await asyncio.to_thread(run_sync)
            
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "evaluation": evaluation.strip() or "No evaluation generated",
                }
            )
        except Exception as e:
            logger.error("Runner.run failed: %s", e)
            return JSONResponse(
                status_code=500,
                content={"error": f"Agent execution failed: {str(e)}"}
            )
            
    except Exception as e:
        logger.exception("Error in evaluate-journal: %s", e)
        return JSONResponse(status_code=500, content={"error": str(e)})
async def run_llm(request: Request, max_retries: int = 3):
    request_data = await request.json()
    user_id = request_data.get("user_id")
    session_id = request_data.get("session_id")
    message = request_data.get("message")
    await db_save_message(session_id, "user", message)

    retries = 0
    while retries < max_retries:
        try:
            raw = chat_completion_text(message)
            response_text = clean_llm_json(raw)
            await db_save_message(session_id, "model", response_text)
            return response_text

        except GeminiAPIError as e:
            if use_openrouter():
                logger.error(f"Unexpected Gemini error in OpenRouter mode: {e}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "user_id": user_id,
                        "session_id": session_id,
                        "error": str(e),
                    },
                )

            status_code = e.response.status_code

            if status_code in [503, 429]:
                retries += 1
                wait_time = 2 ** retries

                logger.warning(
                    f"API Error {status_code} ({e.response}). "
                    f"Retrying attempt {retries}/{max_retries} in {wait_time}s..."
                )
                time.sleep(wait_time)

            elif status_code == 400:
                logger.error(f"Fatal 400 API Error: {e}")
                return None
            else:
                logger.error(f"Unrecoverable API Error (Status {status_code}): {e}")
                return None

        except Exception as e:
            logger.error(f"Unexpected error when chatting with LLM: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "error": str(e),
                },
            )


@app.post("/chat-with-ta")
async def send_message_to_ta(request: Request):
    request_data = await request.json()
    user_id = request_data.get("user_id")
    session_id = request_data.get("session_id")
    message = request_data.get("message")

    # 1. Kiểm tra role của người gửi
    user_role = await db_get_user_role(user_id)

    # 2. Xác định chat_role để lưu vào DB
    # Nếu role từ DB là TA thì lưu chat_role='TA', ngược lại mặc định là 'user'
    assigned_chat_role = "TA" if user_role == "TA" else "user"

    # 3. Lưu vào PostgreSQL via Backend API
    success = await db_save_message(session_id, assigned_chat_role, message)

    if success:
        return JSONResponse(
            status_code=201,
            content={"status": "success", "chat_role": assigned_chat_role}
        )
    return JSONResponse(status_code=500, content={"error": "Failed to save message"})


# =============================================================================================== #


# @app.post("/run_all")
# async def run_all_queries(
#     file: Annotated[UploadFile, File(description="File to upload.")],
#     user_id: Annotated[str, Form(description="User ID.")]
# ):
#     try:
#         # 1. Get original path and extension
#         original_path = Path(file.filename)
#         extension = original_path.suffix

#         # 2. Check extension
#         if extension != ".csv":
#             return JSONResponse(
#                 status_code=500,
#                 content={"error": f"Not support extension '{extension}'."}
#             )

#         # 3. Save file
#         new_filename = f"raw_queries_{datetime.now().strftime('%Y%m%d_%H%M%S')}{extension}"
#         save_path = EVALUATION_DIR / new_filename
#         with open(save_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)

#         # 4. Handle each query
#         df = pd.read_csv(save_path)
#         if 'query' not in df.columns:
#             query_column = df.columns[0]
#         else:
#             query_column = 'query'

#         results = []
#         for index, row in df.iterrows():
#             query_text = str(row[query_column])
#             session_id = str(uuid.uuid4())

#             logger.info(f"Processing query {index+1}: {query_text}")

#             # 4.1. Create session
#             create_session_url = f"{AGENT_SERVER}/apps/agents/users/{user_id}/sessions/{session_id}"
#             requests.post(create_session_url, timeout=60)

#             max_retries = 3
#             for attempt in range(max_retries):
#                 try:
#                     # 4.2. Run agent
#                     run_payload = {
#                         "app_name": APP_NAME,
#                         "user_id": user_id,
#                         "session_id": session_id,
#                         "new_message": {
#                             "role": "user",
#                             "parts": [{"text": query_text}]
#                         }
#                     }
#                     response = requests.post(f"{AGENT_SERVER}/run", json=run_payload, timeout=300)
#                     if response.status_code == 200:
#                         response_json = response.json()

#                         for event_data in reversed(response_json):
#                             if event_data.get("content") and event_data["content"].get("parts") \
#                             and "text" in event_data["content"]["parts"][0]:
#                                 results.append({
#                                     "query": query_text,
#                                     "answer": event_data["content"]["parts"][0]["text"]
#                                 })
#                         break

#                     elif response.status_code == 500 and "overloaded" in response.text:
#                         raise Exception("Model overloaded")

#                 except Exception:
#                     if attempt < max_retries - 1:
#                         wait_time = (attempt + 1) * 2 
#                         logger.warning(f"Model overloaded, retry after {wait_time}s...")
#                         time.sleep(wait_time)

#         # 5. Save results to file csv
#         result_df = pd.DataFrame(results)
#         output_filename = f"eval_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
#         output_path = os.path.join(os.path.dirname(save_path), output_filename)
#         result_df.to_csv(output_path, index=False, encoding='utf-8')

#         return JSONResponse(
#             status_code=200,
#             content={
#                 "message": "Run all queries completely.",
#                 "total_processed": len(results),
#                 "output_file": output_path
#             }
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "user_id": user_id,
#                 "file_name": file.filename,
#                 "error": str(e)
#             }
#         )
#     finally:
#         await file.close()


# @app.post("/evaluate")
# async def evaluate_queries(
#     file_name: Annotated[str, Form(description="File name to evaluate")],
#     user_id: Annotated[str, Form(description="User ID.")]
# ):

#     genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
#     model = genai.GenerativeModel(os.getenv("MODEL_ID", "gemini-2.0-flash"))

#     try:
#         file_path = EVALUATION_DIR / file_name
#         if not file_path.exists():
#             return JSONResponse(status_code=404, content={"error": "File not found"})

#         user_learning_history = get_learning_history(user_id)

#         df = pd.read_csv(file_path)

#         tasks = [
#             get_evaluation(model, row['query'], row['answer'], user_learning_history)
#             for _, row in df.iterrows()
#         ]
#         eval_results = await asyncio.gather(*tasks)

#         df_eval = pd.DataFrame(eval_results)
#         df_final = pd.concat([df, df_eval], axis=1)
#         df_final.to_csv(
#             EVALUATION_DIR / f"evaluation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
#             index=False
#         )

#         avg_fluency = df_final['fluency'].mean()
#         avg_relevance = df_final['relevance'].mean()
#         avg_personalization = df_final['personalization'].mean()
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "user_id": user_id,
#                 "file_name": file_name,
#                 "total_records": len(df_final),
#                 "avg_fluency": round(float(avg_fluency), 2),
#                 "avg_relevance": round(float(avg_relevance), 2),
#                 "avg_personalization": round(float(avg_personalization), 2)
#             }
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "user_id": user_id,
#                 "file_name": file_name,
#                 "error": str(e)
#             }
#         )


# def get_learning_history(user_id: str) -> dict:
#     response = requests.get(f"{BE_SERVER}/users/{user_id}/learning_history")
#     if response.status_code == 200:
#         return response.json().get("learning_history", {})
#     return {}


# async def get_evaluation(model, query, answer, learning_history, learning_style):
#     prompt = f"""
#     You are a expert evaluating experimental results. The evaluation is based on a 10-point scale and the following criteria:
#     1. Fluency: Natural language, correct grammar.
#     2. Relevance: Answers the question directly.
#     3. Personalization: Content matches the user's personalized educational history.

#     Input:
#     - Question: {query}
#     - Answer: {answer}
#     - User's learning history: {learning_history}
#     - User's learning style: {learning_style}

#     The result should be in ONLY one JSON format as follows:
#     {{
#         "fluency": score,
#         "relevance": score,
#         "personalization": score
#     }}
#     """
#     try:
#         response = await model.generate_content_async(
#             prompt,
#             generation_config=genai.types.GenerationConfig(
#                 response_mime_type="application/json"
#             )
#         )
#         return json.loads(response.text)

#     except Exception as e:
#         logger.error(f"Error when calling Gemini model: {e}")
#         return {"fluency": 0, "relevance": 0, "personalization": 0}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("CHATBOT_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("CHATBOT_SERVER_PORT", 8003))
    )
