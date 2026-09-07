import os
import shutil
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Any, Dict, Annotated
import uuid
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import requests
import httpx
from dotenv import load_dotenv
import pandas as pd
import json
from pydantic import BaseModel, Field

from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai.errors import APIError as GeminiAPIError
from openai import AsyncOpenAI

from utils.types import timestamp_to_datetime, clean_llm_json, UPLOADED_DATA_FOLDER

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)

AGENT_SERVER = f"http://{os.getenv('AGENT_SERVER_HOST', 'localhost')}:{os.getenv('AGENT_SERVER_PORT', '8000')}"
BE_SERVER = f"http://{os.getenv('BE_SERVER_HOST', 'localhost')}:{os.getenv('BE_SERVER_PORT', '8002')}"

CURRENT_DIR = Path(__file__).parent
DATA_FOLDER = CURRENT_DIR.parent.parent.parent / "data"
DATA_FOLDER.mkdir(parents=True, exist_ok=True)
EVALUATION_DIR = DATA_FOLDER / "eval_data"
EVALUATION_DIR.mkdir(parents=True, exist_ok=True)

APP_NAME = "agents"
MAX_RETRIES = 5
BATCH_SIZE = 5


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
    session_id = uuid.uuid4()
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
        response = requests.post(url, timeout=60)

        if response.status_code == 200:
            return JSONResponse(
                status_code=200,
                content={"message": "Successfully created session on AGENT SERVER."}
            )

    return JSONResponse(
        status_code=500, content={"error": "Failed to create session on AGENT SERVER."}
    )


@app.get("/users/{user_id}/sessions/{session_id}")
async def get_session(user_id: str, session_id: str):
    url = f"{BE_SERVER}/sessions/{session_id}/conversations"

    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            response_data = response.json()
            conversations = response_data.get("data", [])

            list_event = []
            for conv in conversations:
                list_event.append({
                    "conversation_id": conv.get("conversation_id"),
                    "text": conv.get("content"),
                    "role": conv.get("chat_role"),
                    "files": conv.get("files"),
                    "dynamic_profile": conv.get("dynamic_profile"),
                    "timestamp": conv.get("created_at")
                })

            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "conversations": list_event
                }
            )

        else:
            logger.error(f"Failed to fetch conversations for session {session_id}: {response.text}")
            return JSONResponse(
                status_code=response.status_code,
                content={
                    "user_id": user_id,
                    "session_id": session_id,
                    "error": "Failed to fetch conversations."
                }
            )

    except requests.exceptions.RequestException as e:
        logger.error(f"Connection error to Backend: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "user_id": user_id,
                "session_id": session_id,
                "error": "Backend Server is unreachable"
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
        response = requests.post(f"{AGENT_SERVER}/run", json=payload, timeout=300)

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
async def run_llm(request: Request, max_retries):
    request_data = await request.json()
    user_id = request_data.get("user_id")
    session_id = request_data.get("session_id")
    message = request_data.get("message")
    await db_save_message(session_id, "user", message)

    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    retries = 0
    while retries < max_retries:
        try:
            response = client.models.generate_content(
                model=os.getenv("MODEL_ID", "gemini-2.5-flash"), contents=message
            )
            response_text = clean_llm_json(response.text)
            await db_save_message(session_id, "model", response_text)
            return response_text

        except GeminiAPIError as e:
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
                "error": str(e)
            }
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


@app.post("/upload")
async def upload_file(
    file: Annotated[UploadFile, File(description="File to upload.")],
    user_id: Annotated[str, Form(description="User ID.")],
    session_id: Annotated[str, Form(description="Session ID.")]
):
    """
    Get file, user_id, session_id via multipart/form-data.
    Save the file to the specified directory with a new name in the format:
    {session_id}_{original_name}{extension}
    """
    try:
        original_path = Path(file.filename)
        # Get the file name without extension (e.g., 'image')
        original_name = original_path.stem
        # Get the extension with the dot (e.g., '.jpg')
        extension = original_path.suffix
        new_filename = f"{session_id}_{original_name}{extension}"
        save_path = UPLOADED_DATA_FOLDER / new_filename

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return JSONResponse(
            status_code=200,
            content={
                "user_id": user_id,
                "session_id": session_id,
                "file_name": new_filename,
                "message": "File uploaded and processed successfully"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "user_id": user_id,
                "session_id": session_id,
                "error": str(e)
            }
        )
    finally:
        await file.close()


# =============================================================================================== #


@app.post("/insert_test_users")
async def insert_test_users(
    file: Annotated[UploadFile, File(description="CSV file containing test users.")]
):
    try:
        # 1. Get original path and extension
        original_path = Path(file.filename)
        extension = original_path.suffix

        # 2. Check extension
        if extension != ".csv":
            return JSONResponse(
                status_code=500,
                content={"error": f"Not support extension '{extension}'."}
            )

        # 3. Save file
        new_filename = f"eval_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}{extension}"
        save_path = EVALUATION_DIR / new_filename
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. Insert users to DB
        df = pd.read_csv(save_path)
        if 'user_id' not in df.columns:
            return JSONResponse(
                status_code=500,
                content={"error": "CSV file must contain 'user_id' column."}
            )
        
        for index, row in df.iterrows():
            user_id = str(row['user_id'])
            payload = {
                "user_id": user_id,
                "username": user_id,
                "password": "123456",
                "fullname": str(row.get('user_name', '')),
                "user_role": "student",
                "chat_role": "user",
                "date_of_birth": datetime(2000, 1, 1).isoformat(),
                "gender": "Other",
                "major": "7480101",
                "training_program_type": "Undergraduate"
            }
            response = requests.post(f"{BE_SERVER}/users", json=payload, timeout=10)
            if response.status_code != 201:
                logger.error(f"Failed to insert test user {user_id}: {response.text}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "file_name": file.filename,
                        "message": f"Failed to insert test user {user_id}."
                    }
                )
            return JSONResponse(
                status_code=200,
                content={
                    "file_path": save_path,
                    "message": "Test users inserted successfully."
                }
            )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "file_name": file.filename,
                "message": "Error occurred while inserting test users.",
                "error": str(e)
            }
        )
    finally:
        await file.close()


@app.post("/run_test_queries")
async def run_test_queries(
    file: Annotated[UploadFile, File(description="File to upload.")]
):
    user_id_error = "unknown"
    try:
        # 1. Kiểm tra extension
        original_path = Path(file.filename)
        if original_path.suffix != ".csv":
            return JSONResponse(status_code=400, content={"error": "Only .csv supported."})

        # 2. Lưu file gốc
        new_filename = f"raw_queries_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        save_path = EVALUATION_DIR / new_filename
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Đọc dữ liệu
        df = pd.read_csv(save_path)
        query_column = 'query' if 'query' in df.columns else df.columns[0]
        
        enable_persona = os.getenv("ENABLE_PERSONA", "false").lower() == "true"
        file_type = "with_persona" if enable_persona else "without_persona"
        output_filename = f"eval_data_{file_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = EVALUATION_DIR / output_filename

        total_processed = 0
        # Chia dataframe thành các batch
        for i in range(0, len(df), BATCH_SIZE):
            batch_df = df.iloc[i : i + BATCH_SIZE]
            tasks = []
            
            for _, row in batch_df.iterrows():
                u_id = str(row["user_id"])
                q_text = str(row[query_column])
                s_id = str(uuid.uuid4())
                expected_output = row["expected_output"]
                user_id_error = u_id
                # Tạo task async cho từng query trong batch
                tasks.append(generate_answer_async(u_id, s_id, q_text, expected_output))
            
            # Chạy song song các query trong 1 batch
            batch_results = await asyncio.gather(*tasks)
            
            # Loại bỏ các kết quả rỗng (do lỗi hoàn toàn)
            valid_results = [r for r in batch_results if r]
            
            # 4. Ghi vào cuối file CSV (Append mode)
            if valid_results:
                result_df = pd.DataFrame(valid_results)
                # Nếu file chưa tồn tại thì ghi header, nếu rồi thì append
                is_new_file = not os.path.exists(output_path)
                result_df.to_csv(output_path, mode='a', index=False, header=is_new_file, encoding='utf-8-sig')
            
            total_processed += len(valid_results)
            logger.info(f"Progress: {total_processed}/{len(df)} queries saved to {output_path}")

        return JSONResponse(
            status_code=200,
            content={
                "message": "Ablation test completed.",
                "total_processed": total_processed,
                "output_file": str(output_path)
            }
        )

    except Exception as e:
        logger.error(f"Error when processing file {file.filename}: {str(e)}")
        return JSONResponse(status_code=500, content={"user_id": user_id_error, "error": str(e)})
    finally:
        await file.close()


async def generate_answer_async(user_id, session_id, query, expected_output):
    max_retries = 3
    async with httpx.AsyncClient() as client:
        # 1. Khởi tạo session
        create_session_url = f"{AGENT_SERVER}/apps/agents/users/{user_id}/sessions/{session_id}"
        try:
            await client.post(create_session_url, timeout=30)
        except Exception as e:
            logger.error(f"Failed to create session: {e}")

        # 2. Gọi Agent với cơ chế Retry
        for attempt in range(max_retries):
            try:
                run_payload = {
                    "app_name": "agents",
                    "user_id": user_id,
                    "session_id": session_id,
                    "new_message": {"role": "user", "parts": [{"text": query}]}
                }

                response = await client.post(f"{AGENT_SERVER}/run", json=run_payload, timeout=300.0)
                if response.status_code == 200:
                    response_json = response.json()
                    row_data = {
                        "user_id": user_id, "session_id": session_id,
                        "query": query, "expected_output": expected_output
                    }

                    for event in response_json:
                        if "actions" in event and "stateDelta" in event["actions"]:
                            delta = event["actions"]["stateDelta"]
                            if "dynamic_profile" in delta:
                                row_data["dynamic_profile"] = delta.get("dynamic_profile")
                            if "user_context" in delta:
                                row_data["user_context"] = delta.get("user_context")

                        if "content" in event and "parts" in event["content"]:
                            row_data["answer"] = event["content"]["parts"][0].get("text")

                    return row_data

                elif response.status_code == 429 or "overloaded" in response.text:
                    raise Exception("Model Overloaded")
                else:
                    logger.error(f"Agent error {response.status_code}: {response.text}")

            except Exception as e:
                if attempt < max_retries - 1:
                    wait = (attempt + 1) * 3
                    logger.warning(f"Retry {attempt+1} for {user_id} after {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    logger.error(f"Failed after {max_retries} attempts for {query[:20]}")

    return None


@app.post("/run-only-gemini")
async def run_only_gemini(
    file: Annotated[UploadFile, File(description="File to upload.")]
):
    original_path = Path(file.filename)
    if original_path.suffix != ".csv":
        return JSONResponse(status_code=400, content={"error": "Only .csv supported."})

    temp_filename = f"temp_only_gemini_{uuid.uuid4()}.csv"
    save_path = EVALUATION_DIR / temp_filename

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        df = pd.read_csv(save_path)
        query_col = 'query' if 'query' in df.columns else df.columns[0]

        output_filename = f"gemini_only_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = EVALUATION_DIR / output_filename

        all_results = []
        for i in range(0, len(df), BATCH_SIZE):
            batch_df = df.iloc[i : i + BATCH_SIZE]
            tasks = []

            logger.info(f"Gemini Baseline: Processing batch {i//BATCH_SIZE + 1}...")

            for _, row in batch_df.iterrows():
                user_id = str(row['user_id'])
                query_text = str(row[query_col])
                static_profile = get_learning_history(user_id)
                tasks.append(call_gemini_direct(query_text, static_profile, row))

            batch_results = await asyncio.gather(*tasks)
            all_results.extend(batch_results)

            temp_df = pd.DataFrame(batch_results)
            is_new = not os.path.exists(output_path)
            temp_df.to_csv(output_path, mode='a', index=False, header=is_new, encoding='utf-8-sig')

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "total_processed": len(all_results),
                "output_file": str(output_path)
            }
        )

    except Exception as e:
        logger.error(f"Error in run_only_gemini: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        if save_path.exists():
            os.remove(save_path)
        await file.close()


async def call_gemini_direct(query, static_profile, original_row, max_retries=MAX_RETRIES):
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    model_id = os.getenv("MODEL_ID", "gemini-2.5-flash")

    contents = f"""
        You are an academic assistant. Please use the following student information to help answer this question:
        - Learning History: {json.dumps(static_profile, ensure_ascii=False)}
        - Query: {query}"
    """
    result_row = original_row.to_dict()
    retries = 0
    while retries < max_retries:
        try:
            response = client.models.generate_content(model=model_id, contents=contents)
            response_text = clean_llm_json(response.text)
            result_row["answer"] = response_text
            logger.info(f"Response from Gemini for query '{query}'.")
            return result_row

        except GeminiAPIError as e:
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
                break
            else:
                logger.error(f"Unrecoverable API Error (Status {status_code}): {e}")
                break

        except Exception as e:
            logger.error(f"Unexpected error when chatting with LLM: {e}")
            break

    result_row["answer"] = None
    return result_row


@app.post("/evaluate/llm-as-judge")
async def evaluate_by_llm_as_judge(
    file: Annotated[UploadFile, File(description="CSV file containing data for evaluation")]
):
    original_path = Path(file.filename)
    if original_path.suffix != ".csv":
        return JSONResponse(status_code=400, content={"error": "Only .csv supported."})

    temp_filename = f"temp_eval_{uuid.uuid4()}.csv"
    save_path = EVALUATION_DIR / temp_filename
    
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        df = pd.read_csv(save_path)
        required_cols = [
            'user_id', 'query', 'dynamic_profile',
            'user_context', 'answer', 'expected_output'
        ]

        for col in required_cols:
            if col not in df.columns:
                logger.warning(f"The {col} column is missing from the CSV file")

        evaluation_results = []
        for index, row in df.iterrows():
            user_id = str(row["user_id"])
            logger.info(f"Processing query {index + 1}/{len(df)} for User {user_id}")

            static_profile = get_learning_history(user_id)
            eval_json = await get_llm_evaluation(
                query=row['query'],
                static_profile=static_profile,
                dynamic_profile=row.get("dynamic_profile", None),
                user_context=row.get("user_context", None),
                answer=row.get("answer", None),
                expected_output=row.get("expected_output", None)
            )
            logger.info(f"Score for query {index+1}: {eval_json}")

            result_row = row.to_dict()
            result_row.update(eval_json)
            evaluation_results.append(result_row)

            await asyncio.sleep(1)

        final_df = pd.DataFrame(evaluation_results)
        avg_metrics = {
            "avg_personalization_score": round(float(final_df['personalization_score'].mean()), 2) if 'personalization_score' in final_df.columns else 0,
            "avg_accuracy_score": round(float(final_df["accuracy_score"].mean()), 2) if 'accuracy_score' in final_df.columns else 0,
            "avg_context_score": round(float(final_df["context_score"].mean()), 2) if 'context_score' in final_df.columns else 0
        }

        output_file = f"llm_as_judge_evaluation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = EVALUATION_DIR / output_file
        final_df.to_csv(output_path, index=False, encoding='utf-8-sig')

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "processed_queries": len(evaluation_results),
                "output_file": str(output_path),
                **avg_metrics
            }
        )

    except Exception as e:
        logger.error(f"Error during evaluation: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        if save_path.exists():
            os.remove(save_path)
        await file.close()


def get_learning_history(user_id: str) -> dict:
    response = requests.get(f"{BE_SERVER}/users/{user_id}/learning_history")
    if response.status_code == 200:
        return response.json().get("learning_history", {})
    return {}


async def get_llm_evaluation(
    query, static_profile, dynamic_profile=None,
    user_context=None, answer=None, expected_output=None
):
    EVALUATION_API_KEY = os.getenv("EVALUATION_API_KEY")
    EVALUATION_MODEL_ID = os.getenv("EVALUATION_MODEL_ID", "gpt-4o")
    client = AsyncOpenAI(api_key=EVALUATION_API_KEY)

    prompt = f"""
    You are a specialist in assessing personalization within the personalized educational AI chatbot system.
    Your task is to score the Answer based on Static Profile, Dynamic Profile, the expected output and the personalized contexts provided.

    ### INPUT
    1. User Query: {query}
    2. Static Profile (Learning History): {static_profile}
    3. Dynamic Profile (Interests/Status): {dynamic_profile}
    4. User Context (Conversation Context): {user_context}
    5. Answer (Answer to be graded): {answer}
    6. Expected Output (Expected answer from the expert): {expected_output}

    ### EVALUATION CRITERIA (10-point scale):
    1. Personalization:
    - 9-10: Accurately uses subjects in static_profile and interests in dynamic_profile to provide advice.
    - 7-8: Mentions the profile but is too general and not skillfully integrated into the solution.
    - 5-6: Identifies the profile but omits in-depth details.
    - <5: Provides a formulaic answer, no different from asking a typical chatbot question.
    2. Accuracy (Comparison with Expected Output):
    - 9-10: Matches>90% of the main points of Expected Output, technical information is absolutely accurate.
    - 7-8: Correct main points but the wording or order of priority differs slightly from expectations.
    - 5-6: Minor errors in secondary details but the solution is still correct.
    - <5: Incorrect knowledge or contradicts Expected Output.
    3. Context Adherence:
    - 9-10: No violations of any constraints (word limits, tone, explanation).
    - 7-8: Mostly compliant, with only minor formatting errors (e.g., disorganized order of presentation).
    - <5: Serious violations (e.g., detailed answers required but answers are brief).

    ### OUTPUT SCHEMA
    Return a single result in JSON format with the following structure:
    {{
        "personalization_score": float,
        "accuracy_score": float,
        "context_score": float
    }}
    """

    for attempt in range(MAX_RETRIES):
        try:
            response = await client.chat.completions.create(
                model=EVALUATION_MODEL_ID,
                messages=[
                    {"role": "system", "content": "You are a precise educational AI auditor."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            content = response.choices[0].message.content
            clean_content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_content)
        except Exception:
            if attempt < MAX_RETRIES - 1:
                wait = (attempt + 1) * 3
                logger.warning(f"Retry {attempt+1} for query '{query[:20]}' after {wait}s...")
                await asyncio.sleep(wait)
            else:
                logger.error(f"Failed after {MAX_RETRIES} attempts for query '{query[:20]}'")


@app.post("/evaluate/ablation-study")
async def evaluate_ablation_study(
    file: Annotated[UploadFile, File(description="CSV without Persona")]
):
    temp_without = EVALUATION_DIR / f"temp_without_{uuid.uuid4()}.csv"

    try:
        with open(temp_without, "wb") as f: shutil.copyfileobj(file.file, f)

        df_without = pd.read_csv(temp_without)
        df_without = df_without.rename(columns={'answer': 'answer_without_persona'})

        results = []
        for index, row in df_without.iterrows():
            user_id = str(row['user_id'])
            logger.info(f"Evaluating Ablation {index + 1}/{len(df_without)}...")

            static_profile = get_learning_history(user_id)
            evaluation = await get_ablation_study_evaluation(
                query=row['query'],
                static_profile=static_profile,
                dynamic_profile=row["dynamic_profile"],
                user_context=row["user_context"],
                answer=row['answer_without_persona'],
                expected_output=row['expected_output']
            )

            full_row = row.to_dict()
            full_row.update(evaluation)
            results.append(full_row)

            await asyncio.sleep(1)

        final_df = pd.DataFrame(results)
        output_file = f"ablation_eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = EVALUATION_DIR / output_file

        final_df.to_csv(output_path, index=False, encoding='utf-8-sig')
        avg_metrics = {
            "avg_personalization_score": round(float(final_df['personalization_score'].mean()), 2) if 'personalization_score' in final_df.columns else 0,
            "avg_accuracy_score": round(float(final_df["accuracy_score"].mean()), 2) if 'accuracy_score' in final_df.columns else 0,
            "avg_context_score": round(float(final_df["context_score"].mean()), 2) if 'context_score' in final_df.columns else 0
        }
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "processed_queries": len(results),
                "output_file": str(output_path),
                **avg_metrics
            }
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        if temp_without.exists():
            os.remove(temp_without)
        await file.close()


async def get_ablation_study_evaluation(
    query, static_profile, dynamic_profile, user_context, answer, expected_output
):
    EVALUATION_API_KEY = os.getenv("EVALUATION_API_KEY")
    EVALUATION_MODEL_ID = os.getenv("EVALUATION_MODEL_ID", "gpt-4o")
    client = AsyncOpenAI(api_key=EVALUATION_API_KEY)

    prompt = f"""
    You are a specialist in assessing personalization within the personalized educational AI chatbot system.
    Your task is to score the Answer based on Static Profile, Dynamic Profile, the expected output and the personalized contexts provided.

    ### GOAL
    Evaluate how well a generic AI response (without access to a persona-driven module) naturally aligns with the user's specific background and needs.
    You must apply the same strict criteria as if evaluating the full system to highlight the gap between a generic and a personalized response.

    ### INPUT
    1. User Query: {query}
    2. Static Profile (Learning History): {static_profile}
    3. Dynamic Profile (Interests/Status): {dynamic_profile}
    4. User Context (Conversation Context): {user_context}
    5. Answer WITHOUT Persona: {answer}
    6. Expected Output (Expected answer from the expert): {expected_output}

    ### EVALUATION CRITERIA (10-point scale):
    1. Personalization:
    - 9-10: Accurately uses subjects in static_profile and interests in dynamic_profile to provide advice.
    - 7-8: Mentions the profile but is too general and not skillfully integrated into the solution.
    - 5-6: Identifies the profile but omits in-depth details.
    - <5: Provides a formulaic answer, no different from asking a typical chatbot question.
    2. Accuracy (Comparison with Expected Output):
    - 9-10: Matches>90% of the main points of Expected Output, technical information is absolutely accurate.
    - 7-8: Correct main points but the wording or order of priority differs slightly from expectations.
    - 5-6: Minor errors in secondary details but the solution is still correct.
    - <5: Incorrect knowledge or contradicts Expected Output.
    3. Context Adherence:
    - 9-10: No violations of any constraints (word limits, tone, explanation).
    - 7-8: Mostly compliant, with only minor formatting errors (e.g., disorganized order of presentation).
    - <5: Serious violations (e.g., detailed answers required but answers are brief).

    ### IMPORTAMT
    ### IMPORTANT NOTES
    - Do NOT give "pity points" because the answer is labeled "Without Persona". 
    - If the answer is generic and ignores the student's major or learning history, the "Personalization" score must be low (<5).

    ### OUTPUT SCHEMA
    Return a single result in JSON format with the following structure:
    {{
        "personalization_score": float,
        "accuracy_score": float,
        "context_score": float
    }}
    """

    for attempt in range(MAX_RETRIES):
        try:
            response = await client.chat.completions.create(
                model=EVALUATION_MODEL_ID,
                messages=[
                    {"role": "system", "content": "You are a senior AI researcher specialized in ablation studies."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            content = response.choices[0].message.content
            clean_content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_content)
        except Exception:
            if attempt < MAX_RETRIES - 1:
                wait = (attempt + 1) * 3
                logger.warning(f"Retry {attempt+1} for query '{query[:20]}' after {wait}s...")
                await asyncio.sleep(wait)
            else:
                logger.error(f"Failed after {MAX_RETRIES} attempts for query '{query[:20]}'")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("CHATBOT_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("CHATBOT_SERVER_PORT", 8003))
    )
