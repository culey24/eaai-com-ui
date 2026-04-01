#!/usr/bin/env bash
# Build & chạy chatbot (8003) + ADK (8000) trong một container.
set -euo pipefail

cd "$(dirname "$0")"

IMAGE_NAME="${IMAGE_NAME:-agent-stack}"
CONTAINER_NAME="${CONTAINER_NAME:-agent-stack-local}"
CHATBOT_HOST_PORT="${CHATBOT_HOST_PORT:-8003}"
AGENT_HOST_PORT="${AGENT_HOST_PORT:-8000}"

if [[ ! -f .env ]]; then
  echo "Thiếu .env — cp .env.example .env"
  exit 1
fi

echo "==> docker build -t ${IMAGE_NAME} ."
docker build -t "${IMAGE_NAME}" .

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

echo "==> docker run (chatbot :${CHATBOT_HOST_PORT} → 8003, agent :${AGENT_HOST_PORT} → 8000)"
echo "    eaai AGENTIC_CHATBOT_BASE_URL=http://127.0.0.1:${CHATBOT_HOST_PORT}"
exec docker run --rm \
  --name "${CONTAINER_NAME}" \
  -p "${CHATBOT_HOST_PORT}:8003" \
  -p "${AGENT_HOST_PORT}:8000" \
  --env-file .env \
  "${IMAGE_NAME}"
