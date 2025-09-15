# OPD Wallet Docker Commands

.PHONY: help
help:
	@echo "OPD Wallet Docker Management"
	@echo "============================"
	@echo "make up          - Start all services with Docker"
	@echo "make down        - Stop all services"
	@echo "make restart     - Restart all services"
	@echo "make logs        - View logs for all services"
	@echo "make logs-api    - View API logs"
	@echo "make logs-admin  - View Admin portal logs"
	@echo "make logs-member - View Member portal logs"
	@echo "make clean       - Stop services and remove volumes"
	@echo "make build       - Rebuild all images"
	@echo "make status      - Check status of all services"

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
	docker-compose stop mongo
	docker-compose rm -f mongo
	docker volume rm opdwallet_mongo-data 2>/dev/null || true
	docker-compose up -d mongo
	@echo "MongoDB has been reset"

# Access MongoDB shell
.PHONY: mongo-shell
mongo-shell:
	docker exec -it opd-mongo mongosh -u admin -p admin123 --authenticationDatabase admin

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

# Deploy to AWS EC2
.PHONY: deploy-aws
deploy-aws:
	@if [ -z "$(EC2_IP)" ]; then echo "Error: EC2_IP not set. Usage: make deploy-aws EC2_IP=xx.xx.xx.xx PEM_FILE=path/to/key.pem"; exit 1; fi
	@if [ -z "$(PEM_FILE)" ]; then echo "Error: PEM_FILE not set. Usage: make deploy-aws EC2_IP=xx.xx.xx.xx PEM_FILE=path/to/key.pem"; exit 1; fi
	chmod +x scripts/deploy-aws.sh
	./scripts/deploy-aws.sh $(EC2_IP) $(PEM_FILE)