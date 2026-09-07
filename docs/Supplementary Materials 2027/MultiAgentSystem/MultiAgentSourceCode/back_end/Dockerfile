FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY back_end/ .

RUN pip install --no-cache-dir -r requirements.txt

COPY .env .

COPY databases/postgresql/postgresql_database.py ./utils
COPY databases/postgresql/queries.py ./utils

CMD ["python", "server.py"]
