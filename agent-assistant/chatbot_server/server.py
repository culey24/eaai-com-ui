import os
import json
import shutil
import time
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, Any, Dict
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


CURRENT_DIR = Path(__file__).parent
# agent-assistant/chatbot_server → data cùng cấp với chatbot_server
DATA_FOLDER = CURRENT_DIR.parent / "data"
DATA_FOLDER.mkdir(parents=True, exist_ok=True)
EVALUATION_DIR = DATA_FOLDER / "eval_data"
EVALUATION_DIR.mkdir(parents=True, exist_ok=True)

APP_NAME = "agents"
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

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
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

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
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
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=5.0)
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

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
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

    if session_id:
        url = f"{AGENT_SERVER}/apps/{app_name}/users/{user_id}/sessions/{session_id}"
        response = await asyncio.to_thread(_requests_post_retry_connect, url, timeout=60)

        if response.status_code == 200:
            return JSONResponse(
                status_code=200,
                content={"message": "Successfully created session on AGENT SERVER."}
            )

    return JSONResponse(
        status_code=500, content={"error": "Failed to create session on AGENT SERVER."}
    )


@app.get("/users/{user_id}/sessions/{session_id}")
async def get_session(user_id: str, session_id: str, app_name: str = APP_NAME):
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
                    "events": list_event
                }
            )

        else:
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "events": []
                }
            )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "user_id": user_id,
                "session_id": session_id,
                "error": "Failed to get session"
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
    try:
        response = await asyncio.to_thread(
            _requests_post_retry_connect,
            f"{AGENT_SERVER}/run",
            json=payload,
            timeout=300,
        )

        if response.status_code == 200:
            response_json = response.json()

            for event_data in reversed(response_json):
                if event_data.get("content") and "text" in event_data["content"]["parts"][0]:
                    bot_text = event_data["content"]["parts"][0]["text"]
                    event_timestamp = event_data.get("timestamp")

                    await db_save_message(session_id, "model", bot_text)

                    return JSONResponse(
                        status_code=200,
                        content={
                            "user_id": user_id,
                            "session_id": session_id,
                            "text": bot_text,
                            "role": "model"
                        }
                    )
            return JSONResponse(
                status_code=500, content={"error": "Agent returned empty content"}
            )
        else:
            return JSONResponse(
                status_code=response.status_code, content={"error": response.text}
            )
    except Exception as e:
        logger.error(f"Error in chat-with-agent: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/chat-with-llm")
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
