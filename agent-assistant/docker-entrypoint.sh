#!/bin/sh
set -e
export PYTHONPATH=/app

# .env / env-file may leave literal quotes in values (e.g. CHATBOT_SERVER_PORT="8003")
strip_port_quotes() {
  printf '%s' "$1" | tr -d "\"'"
}
CHATBOT_PORT=$(strip_port_quotes "${CHATBOT_SERVER_PORT:-8003}")
AGENT_PORT=$(strip_port_quotes "${AGENT_SERVER_PORT:-8000}")

# Trong cùng một container: chatbot gọi ADK qua loopback
if [ -z "${AGENT_SERVER_BASE_URL:-}" ] && [ -z "${AGENT_SERVER_HOST:-}" ]; then
  export AGENT_SERVER_HOST=127.0.0.1
  export AGENT_SERVER_PORT="$AGENT_PORT"
fi

echo "[entrypoint] chatbot uvicorn 0.0.0.0:$CHATBOT_PORT + adk web 0.0.0.0:$AGENT_PORT (app=agents)"
uvicorn chatbot_server.server:app --host 0.0.0.0 --port "$CHATBOT_PORT" &
exec adk web --host 0.0.0.0 --port "$AGENT_PORT" agents
