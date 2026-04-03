# Agent assistant + Chatbot (IS-1 / eaai)

Một thư mục gồm:

- `agents/` — Google ADK (manager + sub-agents), port **8000** (`adk web … agents` → REST `/apps/agents/...`).
- `chatbot_server/` — FastAPI (`/health`, `/chat-with-agent`, …), port **8003**.
- `utils/` — LLM (`llm_provider.py`), URL (`service_urls.py`), helpers (`types.py`).

## Cấu hình

Xem `.env.example`. Quan trọng:

- `BE_SERVER_BASE_URL` — API **eaai** (tích hợp agent, không có `/api` prefix cho `/users/...`).
- `GOOGLE_API_KEY` / `MODEL_ID` hoặc OpenRouter.
- Khi **chạy tách hai process trên máy**: đặt `AGENT_SERVER_HOST` / `AGENT_SERVER_PORT` để chatbot tới ADK (thường `127.0.0.1:8000`).

## Chạy local (hai terminal)

Dùng **virtualenv** và gọi `adk` từ trong venv để tránh trùng tên: trên một số máy lệnh `adk` toàn cục là **công cụ khác** (`adk --help` chỉ thấy `start` / `config` — đó không phải Google ADK). Google ADK đến từ gói `google-adk` trong `requirements.txt`.

```bash
cd agent-assistant
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
export PYTHONPATH="$PWD"
pip install -r requirements.txt

# Terminal 1 — ADK (dùng đúng binary trong venv)
./.venv/bin/adk web --host 0.0.0.0 --port 8000 agents

# Terminal 2 — chatbot (gọi agent ở 8000); kích hoạt cùng venv nếu cần
source .venv/bin/activate
export AGENT_SERVER_HOST=127.0.0.1
export AGENT_SERVER_PORT=8000
python -m uvicorn chatbot_server.server:app --host 0.0.0.0 --port 8003
```

Eaai: `AGENTIC_CHATBOT_BASE_URL=http://127.0.0.1:8003`.

## Docker (một container: chatbot + ADK)

```bash
./run-docker.sh
```

Publish: **8003** (chatbot), **8000** (ADK web/API). Trong container, entrypoint tự đặt chatbot gọi agent qua `127.0.0.1:8000` nếu bạn chưa set `AGENT_SERVER_*`.
