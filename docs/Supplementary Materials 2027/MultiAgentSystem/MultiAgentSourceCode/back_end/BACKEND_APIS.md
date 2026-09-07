# Back-end API Documentation

This document provides the technical specifications for the Back-end APIs of the Chatbot system.

**Base URL:** `http://<host>:<port>` (Default: `http://0.0.0.0:8002`)

---

## 1. System Health
### Check Server Status
* **Endpoint:** `/health`
* **Method:** `GET`
* **Description:** Verifies if the server is running and the database connection is alive.
* **Response (200 OK):**
    ```json
    { "status": "Server is ready" }
    ```

---

## 2. Authentication
### User Login
* **Endpoint:** `/login`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
* **Response (200 OK):**
    ```json
    {
      "user_id": "string",
      "user_role": "string",
      "message": "Login successful"
    }
    ```
* **Error (401 Unauthorized):** Invalid username or password.

---

## 3. User & Profile Management

### 3.1. Get User Profile
* **Endpoint:** `/users/{user_id}/profile`
* **Method:** `GET`
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "username": "",
        "fullname": "",
        "user_role": "teacher/student/TA",
        "date_of_birth": "",
        "gender": "Male/Female/Other",
        "major_name": "",
        "training_program_type": "",
        "ethnicity": "",
        "religion": "",
        "permanent_address": "",
        "contact_address": "",
        "email": "",
        "phone_number": "",
        "user_class": "IS-1/IS-2/IS-3"
    }
    ```

### 3.2. Get User Role
* **Endpoint:** `/users/{user_id}/role`
* **Method:** `GET`
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "user_role": "teacher/student/TA",
        "user_class": "IS-1/IS-2/IS-3"
    }
    ```

### 3.3. Get User Learning History
* **Endpoint:** `/users/{user_id}/learning_history`
* **Method:** `GET`
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "learning_history": ""
    }
    ```

### 3.4. Get Student Schedule
* **Endpoint:** `/users/{user_id}/schedule`
* **Method:** `GET`
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "schedule": ""
    }
    ```

### 3.5. Get User Sessions
* **Endpoint:** `/users/{user_id}/sessions`
* **Method:** `GET`
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "sessions": ""
    }
    ```

### 3.6. Add New User
* **Endpoint:** `/users`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "username": "",
        "password": "",
        "fullname": "",
        "user_role": "teacher/student/TA",
        "date_of_birth": "",
        "gender": "Male/Female/Other",
        "major": "",
        "training_program_type": "",
        "citizen_identification": "",
        "date_of_issue": "",
        "place_of_issue": "",
        "ethnicity": "",
        "religion": "",
        "permanent_address": "",
        "contact_address": "",
        "phone_number": "",
        "email": "",
        "user_class": "IS-1/IS-2/IS-3"
    }
    ```

### 3.7. Add User Session
* **Endpoint:** `/users/{user_id}/sessions`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "session_id": ""
    }
    ```

---

## 4. Academic Data

### 4.1. Get All Majors
* **Endpoint:** `/majors`
* **Method:** `GET`

### 4.2. Get Subjects by Major
* **Endpoint:** `/majors/{major_code}/subjects`
* **Method:** `GET`

### 4.3. Get All Subjects
* **Endpoint:** `/subjects`
* **Method:** `GET`

### 4.4. Get All Semesters
* **Endpoint:** `/semesters`
* **Method:** `GET`

### 4.5. Get All Classes
* **Endpoint:** `/classes`
* **Method:** `GET`

### 4.6. Get Classes By Semester
* **Endpoint:** `/classes/{semester_id}`
* **Method:** `GET`

### 4.7. Get Class Details
* **Endpoint:** `/classes/{class_code}`
* **Method:** `GET`

### 4.8. Get Studens By Class
* **Endpoint:** `/classes/{class_code}/students`
* **Method:** `GET`

### 4.9. Get List of Classes that students have registered for
* **Endpoint:** `/students/{student_id}/classes`
* **Method:** `GET`

### 4.10. Add Major
* **Endpoint:** `/majors`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "major_code": "",
        "major_name": ""
    }
    ```

### 4.11. Add Subjects
* **Endpoint:** `/subjects`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "subject_code": "",
        "subject_name": "",
        "level_id": "",
        "credits": "",
        "outline": ""
    }
    ```

### 4.12. Add Subject to Major
* **Endpoint:** `/major-subjects`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "major_code": "",
        "subject_code": ""
    }
    ```

### 4.13. Add Semester
* **Endpoint:** `/semesters`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "semester_id": "",
        "semester_name": ""
    }
    ```

### 4.14. Add Class
* **Endpoint:** `/classes`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "class_id": "",
        "class_code": "",
        "subject_code": "",
        "semester_id": "",
        "day_of_week": "",
        "start_lesson": "",
        "end_lesson": "",
        "room": "",
        "teaching_weeks": ""
    }
    ```

### 4.15. Add Student to Class
* **Endpoint:** `/class-students`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "student_id": "",
        "class_id": "",
        "study_status": "",
        "score": ""
    }
    ```

---

## 5. Chat & Session Management

### 5.1. Create Chat Session
* **Endpoint:** `/users/{user_id}/sessions`
* **Method:** `POST`
* **Request Body:** 
    ```json
    {"session_id": ""}
    ```

### 5.2. Get Session History
* **Endpoint:** `/sessions/{session_id}/conversations`
* **Method:** `GET`
* **Description:** Retrieves all messages (User/Assistant) for a specific session.

### 5.3. Save Conversation
* **Endpoint:** `/sessions/{session_id}/conversations`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "session_id": "",
        "chat_role": "user/model/TA",
        "content": "string",
        "files": [],
        "dynamic_profile": {},
        "tokens_count": 0
    }
    ```

### 5.4. Update Session Status
* **Endpoint:** `/sessions/{session_id}/update`
* **Method:** `POST`
* **Request Body:**
    ```json
    {
        "session_id": "",
        "new_status": "deactive"
    }
    ```

