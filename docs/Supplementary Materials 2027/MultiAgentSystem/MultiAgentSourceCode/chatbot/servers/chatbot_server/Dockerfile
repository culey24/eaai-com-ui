FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*


COPY chatbot/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY .env .

COPY chatbot/servers/chatbot_server/ .

COPY chatbot/utils/ ./utils

CMD ["python", "server.py"]
