FROM python:3.11-slim
 
WORKDIR /app
 
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
 
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    libpq-dev \
    gcc \
    chromium \
    chromium-driver \
    libglib2.0-0 \
    libnss3 \
    libfontconfig1 \
    libxtst6 \
    libgtk-3-0 \
    libasound2 \
    libxss1 \
    fonts-liberation \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*
 
COPY ingestor/ .
   
RUN pip install --upgrade pip --default-timeout=1000
 
RUN pip install -r requirements.txt
 
COPY .env .
COPY databases/postgresql/postgresql_database.py ./core/
COPY databases/postgresql/queries.py ./core/
COPY data/crawled_data/ ./data/crawled_data
 
CMD ["python", "server.py"]
