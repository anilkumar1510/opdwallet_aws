# OPD Wallet Docker Commands

.PHONY: help
help:
	@echo "OPD Wallet Docker Management"
	@echo "============================"
	@echo ""
	@echo "Development (Quick Start):"
	@echo "  make dev-prod-like      - 🌟 RECOMMENDED: Production-like dev (nginx + remote DB)"
	@echo "  make dev-prod-like-logs - View logs for production-like dev"
	@echo "  make dev-prod-like-down - Stop production-like dev environment"
	@echo ""
	@echo "Development (Legacy/Local DB):"
	@echo "  make up          - Start all services with Docker (local MongoDB)"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs for all services"
	@echo "  make logs-api    - View API logs"
	@echo "  make logs-admin  - View Admin portal logs"
	@echo "  make logs-member - View Member portal logs"
	@echo "  make clean       - Stop services and remove volumes"
	@echo "  make build       - Rebuild all images"
	@echo "  make status      - Check status of all services"
	@echo ""
	@echo "Production Deployments:"
	@echo "  make prod-up     - Start production deployment"
	@echo "  make simple-up   - Start simple deployment"
	@echo "  make secure-up   - Start secure deployment (SSL)"
	@echo "  make ecr-up      - Start ECR deployment"
	@echo "  make secrets-up  - Start AWS Secrets deployment"
	@echo ""
	@echo "Database:"
	@echo "  make reset-db    - Reset MongoDB database"
	@echo "  make mongo-shell - Access MongoDB shell"

# Start all services
.PHONY: up
up:
	docker-compose up -d
	@echo "Services starting..."
	@echo "Admin Portal: http://localhost:3001"
	@echo "Member Portal: http://localhost:3002"
	@echo "API: http://localhost:4000"
	@echo "MongoDB: localhost:27017"

# Stop all services
.PHONY: down
down:
	docker-compose down

# Restart all services
.PHONY: restart
restart: down up

# View logs for all services
.PHONY: logs
logs:
	docker-compose logs -f

# View API logs
.PHONY: logs-api
logs-api:
	docker-compose logs -f api

# View Admin portal logs
.PHONY: logs-admin
logs-admin:
	docker-compose logs -f web-admin

# View Member portal logs
.PHONY: logs-member
logs-member:
	docker-compose logs -f web-member

# Stop services and remove volumes
.PHONY: clean
clean:
	docker-compose down -v

# Rebuild all images
.PHONY: build
build:
	docker-compose build --no-cache

# Check status of all services
.PHONY: status
status:
	docker-compose ps

# Development commands
.PHONY: dev
dev:
	docker-compose up

# Run only backend services (mongo + api)
.PHONY: backend
backend:
	docker-compose up -d mongo api

# Run only frontend services
.PHONY: frontend
frontend:
	docker-compose up -d web-admin web-member

# Reset database
.PHONY: reset-db
reset-db:
	docker-compose stop mongodb
	docker-compose rm -f mongodb
	docker volume rm opdwallet_mongo-data 2>/dev/null || true
	docker-compose up -d mongodb
	@echo "MongoDB has been reset"

# Access MongoDB shell
.PHONY: mongo-shell
mongo-shell:
	docker exec -it opd-mongo-dev mongosh -u admin -p admin123 --authenticationDatabase admin

# Install dependencies for all services
.PHONY: install
install:
	cd api && npm install
	cd web-admin && npm install
	cd web-member && npm install

# Production commands
.PHONY: prod-build
prod-build:
	docker-compose -f docker-compose.prod.yml build

.PHONY: prod-up
prod-up:
	docker-compose -f docker-compose.prod.yml up -d

.PHONY: prod-down
prod-down:
	docker-compose -f docker-compose.prod.yml down

.PHONY: prod-logs
prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

.PHONY: prod-status
prod-status:
	docker-compose -f docker-compose.prod.yml ps

# Simple deployment commands
.PHONY: simple-build
simple-build:
	docker-compose -f docker-compose.simple.yml build

.PHONY: simple-up
simple-up:
	docker-compose -f docker-compose.simple.yml up -d
	@echo "Simple deployment started!"
	@echo "Application: http://localhost"

.PHONY: simple-down
simple-down:
	docker-compose -f docker-compose.simple.yml down

.PHONY: simple-logs
simple-logs:
	docker-compose -f docker-compose.simple.yml logs -f

.PHONY: simple-status
simple-status:
	docker-compose -f docker-compose.simple.yml ps

# Secure deployment commands
.PHONY: secure-build
secure-build:
	docker-compose -f docker-compose.secure.yml build

.PHONY: secure-up
secure-up:
	docker-compose -f docker-compose.secure.yml up -d
	@echo "Secure deployment started with SSL/TLS!"
	@echo "Application: https://localhost"

.PHONY: secure-down
secure-down:
	docker-compose -f docker-compose.secure.yml down

.PHONY: secure-logs
secure-logs:
	docker-compose -f docker-compose.secure.yml logs -f

.PHONY: secure-status
secure-status:
	docker-compose -f docker-compose.secure.yml ps

# ECR deployment commands
.PHONY: ecr-up
ecr-up:
	docker-compose -f docker-compose.ecr.yml up -d
	@echo "ECR deployment started!"

.PHONY: ecr-down
ecr-down:
	docker-compose -f docker-compose.ecr.yml down

.PHONY: ecr-logs
ecr-logs:
	docker-compose -f docker-compose.ecr.yml logs -f

.PHONY: ecr-status
ecr-status:
	docker-compose -f docker-compose.ecr.yml ps

# Secrets deployment commands
.PHONY: secrets-up
secrets-up:
	docker-compose -f docker-compose.secrets.yml up -d
	@echo "Secrets deployment started!"

.PHONY: secrets-down
secrets-down:
	docker-compose -f docker-compose.secrets.yml down

.PHONY: secrets-logs
secrets-logs:
	docker-compose -f docker-compose.secrets.yml logs -f

.PHONY: secrets-status
secrets-status:
	docker-compose -f docker-compose.secrets.yml ps

# Deploy to AWS EC2
.PHONY: deploy-aws
deploy-aws:
	@if [ -z "$(EC2_IP)" ]; then echo "Error: EC2_IP not set. Usage: make deploy-aws EC2_IP=xx.xx.xx.xx PEM_FILE=path/to/key.pem"; exit 1; fi
	@if [ -z "$(PEM_FILE)" ]; then echo "Error: PEM_FILE not set. Usage: make deploy-aws EC2_IP=xx.xx.xx.xx PEM_FILE=path/to/key.pem"; exit 1; fi
	chmod +x scripts/deploy-aws.sh
	./scripts/deploy-aws.sh $(EC2_IP) $(PEM_FILE)

# Migrate to Plan Versions v1
.PHONY: migrate-planv1
migrate-planv1:
	@echo "🚀 Running Plan Versions v1 migration..."
	@cd scripts && npx ts-node migrate_plan_versions_v1.ts
	@echo "✅ Migration completed"

# ============================================================================
# PRODUCTION-LIKE DEVELOPMENT ENVIRONMENT
# ============================================================================
# This mirrors AWS production setup locally with:
# - Nginx reverse proxy (like production)
# - Remote shared dev database on AWS (consistent data across team)
# - Same URL structure as production (no port numbers)
# - Hot reload still enabled for development
#
# RECOMMENDED FOR ALL TEAM MEMBERS
# ============================================================================

# Start production-like development environment
.PHONY: dev-prod-like
dev-prod-like:
	@echo "🚀 Starting production-like development environment..."
	@echo ""
	@echo "Features:"
	@echo "  ✅ Nginx reverse proxy (like production)"
	@echo "  ✅ Remote shared dev database on AWS"
	@echo "  ✅ Same URL structure as production"
	@echo "  ✅ Hot reload enabled for development"
	@echo ""
	docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
	@echo ""
	@echo "✅ Environment started successfully!"
	@echo ""
	@echo "📍 Access your application:"
	@echo "   Member Portal:     http://localhost/"
	@echo "   Admin Portal:      http://localhost/admin"
	@echo "   Operations Portal: http://localhost/operations"
	@echo "   TPA Portal:        http://localhost/tpa"
	@echo "   Doctor Portal:     http://localhost/doctor"
	@echo "   API:               http://localhost/api"
	@echo "   Health Check:      http://localhost/health"
	@echo ""
	@echo "📊 View logs:         make dev-prod-like-logs"
	@echo "🛑 Stop environment:  make dev-prod-like-down"
	@echo ""

# Stop production-like development environment
.PHONY: dev-prod-like-down
dev-prod-like-down:
	@echo "🛑 Stopping production-like development environment..."
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ Environment stopped"

# View logs for production-like development
.PHONY: dev-prod-like-logs
dev-prod-like-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# View API logs only
.PHONY: dev-prod-like-logs-api
dev-prod-like-logs-api:
	docker-compose -f docker-compose.dev.yml logs -f api

# View Admin portal logs only
.PHONY: dev-prod-like-logs-admin
dev-prod-like-logs-admin:
	docker-compose -f docker-compose.dev.yml logs -f web-admin

# View Member portal logs only
.PHONY: dev-prod-like-logs-member
dev-prod-like-logs-member:
	docker-compose -f docker-compose.dev.yml logs -f web-member

# View Doctor portal logs only
.PHONY: dev-prod-like-logs-doctor
dev-prod-like-logs-doctor:
	docker-compose -f docker-compose.dev.yml logs -f web-doctor

# View nginx logs only
.PHONY: dev-prod-like-logs-nginx
dev-prod-like-logs-nginx:
	docker-compose -f docker-compose.dev.yml logs -f nginx

# Restart production-like development environment
.PHONY: dev-prod-like-restart
dev-prod-like-restart: dev-prod-like-down dev-prod-like

# Check status of production-like development services
.PHONY: dev-prod-like-status
dev-prod-like-status:
	docker-compose -f docker-compose.dev.yml ps

# Rebuild production-like development environment
.PHONY: dev-prod-like-build
dev-prod-like-build:
	docker-compose -f docker-compose.dev.yml build --no-cache