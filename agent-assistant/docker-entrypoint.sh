#!/bin/sh
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

ADK_LOG=/tmp/adk-boot.log

kill_children() {
  [ -n "${UV_PID:-}" ] && kill "$UV_PID" 2>/dev/null || true
  [ -n "${ADK_PID:-}" ] && kill "$ADK_PID" 2>/dev/null || true
}

trap 'kill_children; exit 143' TERM INT

echo "[entrypoint] adk web :$AGENT_PORT first, then uvicorn :$CHATBOT_PORT (adk log: $ADK_LOG; adk without PORT env)"
echo "[entrypoint] Cloud Run: startup probe on :$CHATBOT_PORT must stay pending until this wait finishes (override ADK_WAIT_SEC if needed)."

# ADK trước — tránh race: probe TCP 8003 pass sớm trong khi ADK chưa bind → /chat-with-agent 500
# nohup + env -u PORT: tránh ADK chết vì SIGHUP / ưu tiên PORT=ingress của PaaS
nohup env -u PORT adk web --host 0.0.0.0 --port "$AGENT_PORT" agents >"$ADK_LOG" 2>&1 &
ADK_PID=$!

ADK_WAIT_SEC="${ADK_WAIT_SEC:-120}"
# Chỉ socket TCP không đủ: ADK HTTP có thể chưa serve /run; dùng HTTP GET (openapi/docs) giống client thật hơn
adk_http_ready() {
  python -c "
import sys, urllib.request, urllib.error
port = int(sys.argv[1])
for path in ('/openapi.json', '/docs', '/'):
    try:
        r = urllib.request.urlopen('http://127.0.0.1:%d' % port + path, timeout=4)
        r.read(64)
        r.close()
        sys.exit(0)
    except urllib.error.HTTPError:
        sys.exit(0)
    except Exception:
        pass
sys.exit(1)
" "$AGENT_PORT" 2>/dev/null
}

echo "[entrypoint] waiting up to ${ADK_WAIT_SEC}s for ADK HTTP on 127.0.0.1:$AGENT_PORT (pid $ADK_PID)"
i=0
while [ "$i" -lt "$ADK_WAIT_SEC" ]; do
  if ! kill -0 "$ADK_PID" 2>/dev/null; then
    echo "[entrypoint] adk web exited before bind. Log:" >&2
    cat "$ADK_LOG" >&2 || true
    kill_children
    exit 1
  fi
  if adk_http_ready; then
    echo "[entrypoint] ADK HTTP ready on $AGENT_PORT"
    break
  fi
  i=$((i + 1))
  sleep 1
done

if [ "$i" -eq "$ADK_WAIT_SEC" ]; then
  echo "[entrypoint] timeout ADK :$AGENT_PORT. Log:" >&2
  cat "$ADK_LOG" >&2 || true
  kill_children
  exit 1
fi

echo "[entrypoint] starting uvicorn on :$CHATBOT_PORT (ADK already listening)"
uvicorn chatbot_server.server:app --host 0.0.0.0 --port "$CHATBOT_PORT" &
UV_PID=$!
sleep 2
if ! adk_http_ready; then
  echo "[entrypoint] ADK stopped responding after uvicorn start. Log:" >&2
  cat "$ADK_LOG" >&2 || true
  kill_children
  exit 1
fi

while kill -0 "$UV_PID" 2>/dev/null && kill -0 "$ADK_PID" 2>/dev/null; do
  sleep 3
done
echo "[entrypoint] uvicorn or adk exited" >&2
cat "$ADK_LOG" >&2 2>/dev/null || true
kill_children
wait 2>/dev/null || true
exit 1
