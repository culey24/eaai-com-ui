# Chatbot (8003) + ADK (8000); tuỳ chọn Ingestor (8001): INGESTOR_ENABLED=1 + DATABASE_URL.
#   docker build -t agent-stack .
#   docker run --rm --env-file .env -p 8003:8003 -p 8000:8000 -p 8001:8001 agent-stack
#
# Eaai: AGENTIC_CHATBOT_BASE_URL=http://127.0.0.1:8003

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY agents ./agents
COPY utils ./utils
COPY ingestor ./ingestor
COPY chatbot_server ./chatbot_server
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PYTHONPATH=/app
ENV AGENT_SERVER_PORT=8000
ENV CHATBOT_SERVER_PORT=8003
ENV INGESTOR_PORT=8001

EXPOSE 8000 8001 8003

ENTRYPOINT ["/docker-entrypoint.sh"]
