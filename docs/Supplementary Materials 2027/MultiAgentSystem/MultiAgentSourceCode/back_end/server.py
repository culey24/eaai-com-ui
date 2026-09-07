import os
import json
import shutil
from datetime import datetime, date
from pathlib import Path
from typing import Annotated, Optional, List, Any
import asyncio
import uuid
import logging
import requests
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from utils.postgresql_database import PostgreSQLDatabase
from utils.queries import *

load_dotenv()  # Load environment variables from .env file
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(name)s:%(filename)s:%(lineno)d %(levelname)s %(process)d %(message)s'
)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="[Chatbot] Back-end APIs",
    description="APIs from BE Server",
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
db_connector = PostgreSQLDatabase(
    host=os.getenv('POSTGRES_HOST', 'localhost'),
    port=int(os.getenv('POSTGRES_PORT', "5432")),
    user=os.getenv('POSTGRES_USER', 'postgres'),
    password=os.getenv('POSTGRES_PASSWORD', 'password'),
    database=os.getenv('POSTGRES_DB', 'test_db')
)
if db_connector.connect():
    logger.info("Database connection established successfully.")
else:
    logger.error("Failed to establish database connection.")


async def run_db_query(func, *args):
    """
    Execute synchronous database query function in a thread pool.
    This function is now 'async def' and uses asyncio to correctly await 
    the result of the blocking call in the thread pool.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, func, db_connector, *args)


######################### APIs #########################


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the server is running.
    """
    return JSONResponse(
        status_code=200,
        content={"status": "Server is ready"}
    )


@app.post("/login")
async def login_api(request: Request):
    try:
        data = await request.json()
        result = await run_db_query(
            get_user_account, data.get("username"), data.get("password")
        )

        if result and len(result) > 0:
            user_info = result[0]
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_info['user_id'],
                    "user_role": user_info['user_role'],
                    "message": "Login successful"
                }
            )
        else:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )

    except HTTPException:
        # Re-raise HTTPException to let FastAPI handle it
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "System error occurred during login."
            }
        )


@app.get("/users/{user_id}/profile")
async def get_user_profile_api(user_id: str):
    """
    Get detailed user profile information by user_id.
    """
    try:
        result = await run_db_query(get_user_info, user_id)

        if result and len(result) > 0:
            profile_data = result[0]
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": profile_data['user_id'],
                    "username": profile_data['username'],
                    "fullname": profile_data['fullname'],
                    "user_role": profile_data['user_role'],
                    "date_of_birth": profile_data['date_of_birth'].isoformat() if profile_data['date_of_birth'] else None,
                    "gender": profile_data['gender'],
                    "major_name": profile_data['major_name'],
                    "training_program_type": profile_data['training_program_type'],
                    "ethnicity": profile_data['ethnicity'],
                    "religion": profile_data['religion'],
                    "permanent_address": profile_data['permanent_address'],
                    "contact_address": profile_data['contact_address'],
                    "email": profile_data['email'],
                    "phone_number": profile_data['phone_number'],
                    "user_class": profile_data['user_class']
                }
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"User profile not found with ID: {user_id}"
            )

    except HTTPException:
        # Re-raise HTTPException to let FastAPI handle it
        raise
    except Exception as e:
        logger.error(f"ERROR when getting user profile for '{user_id}': {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "System error occurred while retrieving user profile information."
            }
        )


@app.get("/users/{user_id}/role")
async def get_user_role_api(user_id: str):
    """
    Get user role by user_id.
    """
    try:
        result = await run_db_query(get_user_role, user_id)

        if result and len(result) > 0:
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "user_role": result[0]['user_role'],
                    "user_class": result[0]['user_class']
                }
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"User role not found with ID: {user_id}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ERROR when getting user role for {user_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "System error occurred while retrieving user role."
            }
        )


@app.get("/users/{user_id}/learning_history")
async def get_learning_history_api(user_id: str):
    """
    Get learning history by user_id.
    """
    try:
        result = await run_db_query(get_learning_history_by_user_id, user_id)

        if result is not None:
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "learning_history": result
                }
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Learning history not found for user ID: {user_id}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ERROR when getting learning history for {user_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "System error occurred while retrieving learning history."
            }
        )


@app.get("/users/{user_id}/schedule")
async def get_user_current_schedule_api(user_id: str):
    """
    Get user schedule by user_id.
    """
    try:
        result = await run_db_query(get_student_current_schedule, user_id)

        if result is not None:
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "schedule": result
                }
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Schedule not found for user ID: {user_id}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ERROR when getting schedule for {user_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "System error occurred while retrieving schedule."
            }
        )


@app.get("/users/{user_id}/sessions")
async def get_user_sessions_api(user_id: str):
    """
    Get user sessions by user_id.
    """
    try:
        result = await run_db_query(get_sessions_by_user_id, user_id)

        if result is not None:
            return JSONResponse(
                status_code=200,
                content={
                    "user_id": user_id,
                    "sessions": result
                }
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Sessions not found for user ID: {user_id}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ERROR when getting sessions for {user_id}: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "System error occurred while retrieving sessions."
            }
        )


@app.get("/majors")
async def get_all_majors_api():
    try:
        result = await run_db_query(get_all_majors)
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching majors: {e}")
        return JSONResponse(status_code=500, content={"error": "Could not retrieve majors"})


@app.get("/majors/{major_code}/subjects")
async def get_subjects_by_major_api(major_code: str):
    try:
        result = await run_db_query(get_subjects_by_major, major_code)
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"No subjects found for major code: {major_code}"
            )
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching subjects for major {major_code}: {e}")
        return JSONResponse(
            status_code=500, content={"error": "Could not retrieve subjects for the given major"}
        )


@app.get("/subjects")
async def get_all_subjects_api():
    try:
        result = await run_db_query(get_all_subjects)
        if not result:
            raise HTTPException(
                status_code=404,
                detail="No subjects found in the database."
            )
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching subjects: {e}")
        return JSONResponse(status_code=500, content={"error": "Could not retrieve subjects"})


@app.get("/semesters")
async def get_all_semesters_api():
    try:
        result = await run_db_query(get_all_semesters)
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching semesters: {e}")
        return JSONResponse(status_code=500, content={"error": "Could not retrieve semesters"})


@app.get("/classes/{semester_id}")
async def get_classes_api(semester_id: Optional[int] = None):
    try:
        if semester_id:
            result = await run_db_query(get_classes_by_semester, semester_id)
        else:
            result = await run_db_query(get_all_classes)
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching classes: {e}")
        return JSONResponse(status_code=500, content={"error": "Could not retrieve classes"})


@app.get("/classes/{class_code}")
async def get_class_details_api(class_code: str):
    """Lấy thông tin chi tiết của một lớp học cụ thể"""
    try:
        result = await run_db_query(get_class_details, class_code)
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Class not found with code: {class_code}"
            )
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching class details for {class_code}: {e}")
        return JSONResponse(status_code=500, content={"error": "Could not retrieve class details"})


@app.get("/classes/{class_code}/students")
async def get_class_students_api(class_code: str):
    """Lấy danh sách sinh viên trong một lớp cụ thể"""
    try:
        result = await run_db_query(get_students_by_class, class_code)
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching students for class {class_code}: {e}")
        return JSONResponse(status_code=500, content={"error": "Could not retrieve class students"})


@app.get("/students/{student_id}/classes")
async def get_student_classes_api(student_id: str):
    """Lấy danh sách lớp học mà sinh viên đã đăng ký"""
    try:
        result = await run_db_query(get_classes_by_student_id, student_id)
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching classes for student {student_id}: {e}")
        return JSONResponse(
            status_code=500, content={"error": "Could not retrieve student classes"}
        )


@app.get("/sessions/{session_id}/conversations")
async def get_session_conversations_api(session_id: str):
    """Lấy danh sách các cuộc trò chuyện trong một phiên cụ thể"""
    try:
        result = await run_db_query(get_conversations_by_session_id, session_id)
        return JSONResponse(status_code=200, content={"data": result})
    except Exception as e:
        logger.error(f"Error fetching conversations for session {session_id}: {e}")
        return JSONResponse(
            status_code=500, content={"error": "Could not retrieve session conversations"}
        )


# ============================================================================================ #


@app.post("/users")
async def add_user_api(request: Request):
    data = await request.json()
    try:
        user_id = data.get("user_id")
        result = await run_db_query(
            insert_user,
            user_id, data.get("username"), data.get("password"),
            data.get("fullname"), data.get("user_role"), data.get("chat_role"),
            data.get("date_of_birth"), data.get("gender"),
            data.get("major"), data.get("training_program_type"),
            data.get("citizen_identification", None),
            data.get("date_of_issue", None),
            data.get("place_of_issue", None),
            data.get("ethnicity", None), data.get("religion", None),
            data.get("permanent_address", None), data.get("contact_address", None),
            data.get("phone_number", None), data.get("email", None),
            data.get("user_class", None)
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create user '{user_id}'."
            )
        return JSONResponse(
            status_code=201, content={"message": f"Added user '{user_id}' successfully."}
        )
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/users/{user_id}/sessions")
async def add_user_session(user_id:str, request: Request):
    data = await request.json()
    try:
        session_id = data.get("session_id", uuid.uuid4())
        result = await run_db_query(
            insert_session,
            session_id, user_id
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create session for user '{user_id}'."
            )
        return JSONResponse(
            status_code=201, content={
                "session_id": session_id,
                "message": f"Session created successfully for user '{user_id}'."
            }
        )
    except Exception as e:
        logger.error(f"Error creating session for user '{user_id}': {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/majors")
async def add_major_api(request: Request):
    data = await request.json()
    try:
        result = await run_db_query(
            insert_major, data.get("major_code"), data.get("major_name")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to add major '{major_code}'."
            )
        return JSONResponse(
            status_code=201, content={"message": "Added major '{major_code}' successfully"}
        )
    except Exception as e:
        logger.error(f"Error adding major: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/subjects")
async def add_subject_api(request: Request):
    data = await request.json()
    try:
        subject_code = data.get("subject_code")
        result = await run_db_query(
            insert_subject,
            subject_code,
            data.get("subject_name"),
            data.get("level_id"),
            data.get("credits"),
            data.get("outline")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to add subject '{subject_code}'."
            )
        return JSONResponse(
            status_code=201, content={"message": f"Added subject '{subject_code}' successfully"})
    except Exception as e:
        logger.error(f"Error adding subject: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/major-subjects")
async def add_major_subject_api(request: Request):
    data = await request.json()
    try:
        result = await run_db_query(
            insert_major_subject, data.get("major_code"), data.get("subject_code")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail="Failed to link Subject to Major."
            )
        return JSONResponse(
            status_code=201, content={"message": "Subject linked to Major successfully"}
        )
    except Exception as e:
        logger.error(f"Error linking major-subject: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/semesters")
async def add_semester_api(request: Request):
    data = await request.json()
    try:
        result = await run_db_query(
            insert_semester, data.get("semester_id"), data.get("semester_name")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to add semester '{semester_id}'."
            )
        return JSONResponse(
            status_code=201, content={"message": f"Added semester '{semester_id}' successfully"})
    except Exception as e:
        logger.error(f"Error adding semester: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/classes")
async def add_class_api(request: Request):
    data = await request.json()
    try:
        class_id = data.get("class_id")
        result = await run_db_query(
            insert_class,
            class_id, data.get("class_code"),
            data.get("subject_code"), data.get("semester_id"),
            data.get("day_of_week"),
            data.get("start_lesson"), data.get("end_lesson"),
            data.get("room"),
            data.get("teaching_weeks")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create class '{class_id}'."
            )
        return JSONResponse(
            status_code=201, content={"message": f"Created class '{class_id}' successfully."}
        )
    except Exception as e:
        logger.error(f"Error creating class: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/class-students")
async def add_student_to_class_api(request: Request):
    data = await request.json()
    try:
        student_id = data.get("student_id")
        result = await run_db_query(
            insert_class_student,
            student_id, data.get("class_id"),
            data.get("study_status"), data.get("score")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to add student '{student_id}' to class."
            )
        return JSONResponse(
            status_code=201,
            content={"message": f"Added student '{student_id}' to class successfully"}
        )
    except Exception as e:
        logger.error(f"Error adding student to class: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/sessions/{session_id}/conversations")
async def add_session_conversations_api(session_id:str, request: Request):
    data = await request.json()
    try:
        result = await run_db_query(
            insert_conversation,
            session_id, data.get("chat_role"), data.get("content"),
            data.get("files"), data.get("dynamic_profile"), data.get("tokens_count")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to add conversations to session '{session_id}'."
            )
        return JSONResponse(
            status_code=201, content={"message": "Added conversations successfully."}
        )
    except Exception as e:
        logger.error(f"Error adding conversations to session '{session_id}': {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ============================================================================================ #


@app.post("/sessions/{session_id}/update")
async def update_session_status_api(session_id:str, request: Request):
    data = await request.json()
    try:
        session_id = data.get("session_id")
        result = await run_db_query(
            update_session_status,
            session_id, data.get("new_status")
        )
        if not result:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to update status on session '{session_id}'."
            )
        return JSONResponse(
            status_code=201, content={"message": f"Updated status on session '{session_id}'."}
        )
    except Exception as e:
        logger.error(f"Error updating status on session '{session_id}': {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("BE_SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("BE_SERVER_PORT", 8002))
    )
