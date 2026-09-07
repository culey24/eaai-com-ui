# Chatbot Server API Documentation

The Chatbot Server acts as the primary orchestrator, managing user sessions, file uploads, and routing messages between the UI, the AI Agent, and direct LLM calls.

**Base URL:** `http://<host>:<port>`

---

## 1. System Health
### Health Check
* **Endpoint:** `/health`
* **Method:** `GET`
* **Description:** Verifies if the Chatbot Server is active.
* **Response (200 OK):** 
    ```json
    {"status": "Server is ready"}
    ```

---

## 2. Session Management
### 2.1. Create Session
* **Endpoint:** `/users/{user_id}/sessions`
* **Method:** `POST`
* **Description:** Initializes a new chat session in the local database and synchronizes it with the AGENT SERVER.
* **Response (200 OK):** 
    ```json
    {
        "user_id": "",
        "session_id": "",
        "message": "Successfully created session on AGENT SERVER."
    }
    ```

### 2.2. Get Session History
* **Endpoint:** `/users/{user_id}/sessions/{session_id}`
* **Method:** `GET`
* **Description:** Retrieves the full conversation history for a specific session from the **Backend Database**. This provides a persistent history including metadata like dynamic profiles and attached files, which may not be available in the Agent's temporary memory.
* **Response (200 OK):**
    ```json
    {
      "user_id": "string",
      "session_id": "string",
      "conversations": [
        {
          "conversation_id": 123,
          "text": "Hello, can you help me with my schedule?",
          "role": "user",
          "files": ["file_id_1.pdf"],
          "dynamic_profile": [],
          "timestamp": "2026-04-02 10:00:00"
        },
        {
          "conversation_id": 124,
          "text": "Of course! I see you have a Math class at 8:00 AM.",
          "role": "model",
          "files": null,
          "dynamic_profile": [
            { "fact": "User is interested in morning schedules", "confidence": 0.9 }
          ],
          "timestamp": "2026-04-02 10:00:05"
        }
      ]
    }
    ```

### 2.3. Delete/Deactivate Session
* **Endpoint:** `/users/{user_id}/sessions/{session_id}`
* **Method:** `DELETE`
* **Description:** Deletes the session on the Agent Server and marks it as `deactive` in the local database.
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "session_id": "",
        "status": "Session deactivated"
    }
    ```

---

## 3. Chat & AI Endpoints

### 3.1. Chat with AI Agent
* **Endpoint:** `/chat-with-agent`
* **Method:** `POST`
* **Description:** Sends a message to the Agentic system. Supports file attachments. It captures the `dynamic_profile` from the agent's internal state.
* **Request Body:**
    ```json
    {
      "user_id": "",
      "session_id": "",
      "message": "",
      "files": ["list_of_file_names_optional"]
    }
    ```
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "session_id": "",
        "text": "",
        "files": [],
        "role": "model",
        "dynamic_profile": "",
        "timestamp": "ISO-8601"
    }
    ```

### 3.2. Chat with LLM (Direct Gemini Call)
* **Endpoint:** `/chat-with-llm`
* **Method:** `POST`
* **Description:** A fallback or direct route to call the Gemini model without agentic coordination. Includes automatic retry logic for 503/429 errors.
* **Request Body:**
    ```json
    {
      "user_id": "",
      "session_id": "",
      "message": "",
      "files": ["list_of_file_names_optional"]
    }
    ```
* **Response (200 OK):**
    ```json
    {
        "user_id": "",
        "session_id": "",
        "text": "",
        "files": [],
        "role": "model",
        "timestamp": "ISO-8601"
    }
    ```

### 3.3. Chat with Teaching Assistant (TA)
* **Endpoint:** `/chat-with-ta`
* **Method:** `POST`
* **Description:** Routes messages specifically for human-in-the-loop interactions. Saves messages with the assigned role (`TA` or `user`).
* **Request Body:**
    ```json
    {
        "user_id": "",
        "session_id": "",
        "text": "",
        "files": [],
        "role": "user/TA",
        "timestamp": "ISO-8601"
    }
    ```

---

## 4. File Management

### 4.1. Upload File
* **Endpoint:** `/upload`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Description:** Uploads a file, renames it using the format `{session_id}_{original_name}`, and saves it to the server's upload directory.
* **Form Data:**
    - `file`: (Binary)
    - `user_id`: "string"
    - `session_id`: "string"
* **Response (200 OK):**
    ```json
    {
      "user_id": "",
      "session_id": "",
      "file_name": "session123_document.pdf",
      "message": "File uploaded and processed successfully"
    }
    ```
