# EAAI Chatbot — Dev runner
# Usage:
#   make dev          → DB + Backend + Agent + Frontend
#   make db           → PostgreSQL (5432)
#   make be           → Backend (Express :3000)
#   make agent        → Chatbot Server (FastAPI :8003)
#   make fe           → Frontend (Vite :5173)
#   make stop-db      → dừng DB containers
#   make logs-db      ! xem log DB

.PHONY: dev db be agent adk fe stop-db logs-db seed

# ── Paths ─────────────────────────────────────────────────────────────────────
BACKEND_DIR := backend
FRONTEND_DIR := frontend
AGENT_DIR := agent-assistant

# ── Màu terminal ──────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
RESET := \033[0m

# ── DB ────────────────────────────────────────────────────────────────────────
db:
	@echo "$(CYAN)▶ Khởi động PostgreSQL (5432)...$(RESET)"
	docker compose -f $(BACKEND_DIR)/docker-compose.yml up -d || \
	  (echo "$(CYAN)⚠ DB có thể đang chạy rồi — kiểm tra: docker ps$(RESET)" && true)
	@echo "$(CYAN)✓ DB: localhost:5432$(RESET)"

seed:
	@echo "$(CYAN)▶ Đồng bộ schema Prisma (idempotent)...$(RESET)"
	cd $(BACKEND_DIR) && npx prisma db push

stop-db:
	docker compose -f $(BACKEND_DIR)/docker-compose.yml stop

logs-db:
	docker compose -f $(BACKEND_DIR)/docker-compose.yml logs -f db

# ── Individual services ───────────────────────────────────────────────────────
be:
	@echo "$(CYAN)▶ backend (Express :3000)$(RESET)"
	npm run backend:dev

agent:
	@echo "$(CYAN)▶ agent-assistant (FastAPI :8003)$(RESET)"
	cd $(AGENT_DIR) && PYTHONPATH=. .venv/bin/python chatbot_server/server.py

adk:
	@echo "$(CYAN)▶ agent-adk (Port 8000)$(RESET)"
	cd $(AGENT_DIR) && PYTHONPATH=. .venv/bin/adk web --host 0.0.0.0 --port 8000 agents

fe:
	@echo "$(CYAN)▶ frontend (Vite :5173)$(RESET)"
	npm run dev

# ── Dev: toàn bộ trong 1 lệnh ─────────────────────────────────────────────────
# Dùng & để chạy song song, trap để dừng sạch khi Ctrl+C
dev: db
	@echo "$(CYAN)▶ Khởi động tất cả services (BE:3000, FE:5173, Agent:8003, ADK:8000)...$(RESET)"
	@echo "$(CYAN)  Nhấn Ctrl+C để dừng tất cả$(RESET)"
	@trap 'kill 0' SIGINT; \
	  (npm run backend:dev 2>&1 | sed "s/^/[be]    /") & \
	  (cd $(AGENT_DIR) && PYTHONPATH=. .venv/bin/adk web --host 0.0.0.0 --port 8000 agents 2>&1 | sed "s/^/[adk]   /") & \
	  (cd $(AGENT_DIR) && PYTHONPATH=. .venv/bin/python chatbot_server/server.py 2>&1 | sed "s/^/[agent] /") & \
	  (npm run dev 2>&1 | sed "s/^/[fe]    /") & \
	  wait
