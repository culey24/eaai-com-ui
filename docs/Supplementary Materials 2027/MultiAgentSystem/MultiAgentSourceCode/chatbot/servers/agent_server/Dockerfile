FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*


COPY chatbot/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY chatbot/core/ .
COPY .env ./agents

CMD ["adk", "web"]
