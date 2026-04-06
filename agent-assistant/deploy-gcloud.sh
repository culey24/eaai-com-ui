#!/usr/bin/env bash
# Deploy agent-stack: build local → push Artifact Registry → Cloud Run.
# Yêu cầu: Docker chạy được, gcloud login, repo Artifact Registry đã tạo (vd. docker-repo).

set -euo pipefail

cd "$(dirname "$0")"

export PROJECT_ID=eaai-agent-chatbot
export REGION=asia-southeast1
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-repo/agent-stack:latest"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

docker build -t "$IMAGE" .
docker push "$IMAGE"

gcloud run deploy agent-service \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "$IMAGE" \
  --port 8003
