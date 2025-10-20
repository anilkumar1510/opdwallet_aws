# OPD Wallet - Deployment & Infrastructure Guide

> **Part of Product Architecture Documentation**
> See [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) for system overview

**Last Updated**: October 18, 2025
**Production Server**: http://51.20.125.246
**Cloud Provider**: AWS EC2
**Infrastructure**: Docker + Docker Compose + Nginx

---

## Table of Contents

1. [Docker Compose Configurations](#docker-compose-configurations)
2. [Container Architecture](#container-architecture)
3. [Nginx Configuration](#nginx-configuration)
4. [Environment Variables](#environment-variables)
5. [Deployment Workflow](#deployment-workflow)
6. [Health Monitoring](#health-monitoring)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)

---

## Docker Compose Configurations

The project includes 6 different Docker Compose configurations for various deployment scenarios:

### 1. Development (`docker-compose.yml`)

**Purpose**: Local development with direct port access

**Services**:
- `mongodb` - Port 27017 exposed
- `api` - Port 4000 exposed
- `web-admin` - Port 3001 exposed
- `web-member` - Port 3002 exposed

**Container Names**:
- `opd-mongo-dev`
- `opd-api-dev`
- `opd-web-admin-dev`
- `opd-web-member-dev`

**Usage**:
```bash
docker-compose up -d
```

**Features**:
- Direct port access for all services
- Hot reload enabled
- Development environment variables
- Local file volumes for code changes

---

### 2. Production (`docker-compose.prod.yml`)

**Purpose**: Production deployment with reverse proxy

**Services**:
- `nginx` - Port 80, 443 exposed
- `mongodb` - Internal only
- `api` - Internal only (via nginx)
- `web-admin` - Internal only (via nginx /admin)
- `web-member` - Internal only (via nginx /)

**Container Names**:
- `opd-nginx-prod`
- `opd-mongo-prod`
- `opd-api-prod`
- `opd-web-admin-prod`
- `opd-web-member-prod`

**Usage**:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Features**:
- Nginx reverse proxy
- Internal service network
- Production environment variables
- SSL/TLS support (configured)

---

### 3. Simple (`docker-compose.simple.yml`)

**Purpose**: Simplified production deployment

**Services**:
- `nginx` - Port 80 exposed
- `mongodb` - Internal
- `api` - Internal
- `web-admin` - Internal
- `web-member` - Internal

**Container Names**:
- `opd-nginx-simple`
- `opd-mongodb-simple`
- `opd-api-simple`
- `opd-web-admin-simple`
- `opd-web-member-simple`

**Usage**:
```bash
docker-compose -f docker-compose.simple.yml up -d
```

---

### 4. Secure (`docker-compose.secure.yml`)

**Purpose**: Security-hardened deployment with SSL/TLS

**Services**:
- `nginx` - Port 443 with SSL
- `mongodb` - Auth enabled, localhost only
- `api` - Internal
- `web-admin` - Internal
- `web-member` - Internal

**Features**:
- HTTPS enforced
- MongoDB authentication enabled
- Secure environment variable handling
- Restricted network access

---

### 5. ECR (`docker-compose.ecr.yml`)

**Purpose**: AWS ECR-based deployment

**Services**:
- Uses AWS ECR images
- `nginx` - Port 80, 443
- All services internal

**Features**:
- Images pulled from AWS ECR
- Automated image updates
- Registry authentication

---

### 6. Secrets (`docker-compose.secrets.yml`)

**Purpose**: Production with AWS Secrets Manager

**Services**:
- AWS Secrets Manager integration
- All secrets from AWS SSM
- `nginx` - Port 80, 443

**Features**:
- No hardcoded secrets
- AWS Secrets Manager integration
- Dynamic secret rotation support

---

## Container Architecture

### Network Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Host                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         opd-network (bridge)                   │    │
│  │                                                 │    │
│  │  ┌──────────────┐    ┌──────────────┐         │    │
│  │  │ nginx:alpine │───→│  api:4000    │         │    │
│  │  │  Port 80/443 │    │  (NestJS)    │         │    │
│  │  │              │    └──────┬───────┘         │    │
│  │  │              │           │                  │    │
│  │  │              │───→┌──────▼───────┐         │    │
│  │  │              │   │ web-admin:3000│         │    │
│  │  │              │   └───────────────┘         │    │
│  │  │              │           │                  │    │
│  │  │              │───→┌──────▼───────┐         │    │
│  │  │              │   │web-member:3000│         │    │
│  │  │              │   └───────────────┘         │    │
│  │  └──────────────┘           │                  │    │
│  │                       ┌──────▼───────┐         │    │
│  │                       │mongodb:27017 │         │    │
│  │                       │ (Persistent) │         │    │
│  │                       └──────────────┘         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Volumes:                                               │
│  - mongodb_data (persistent)                            │
│  - nginx_logs (persistent)                              │
│  - uploads (persistent - for file storage)              │
└─────────────────────────────────────────────────────────┘
```

### Volume Management

**Persistent Volumes**:
1. `mongodb_data`: Database files
2. `nginx_logs`: Nginx access and error logs
3. `uploads`: Uploaded files (claims, prescriptions, reports)

**Volume Locations**:
- Development: Local project directories
- Production: Docker named volumes

**Backup Strategy**:
```bash
# Backup MongoDB data
docker run --rm -v opd_mongodb_data:/data -v $(pwd):/backup ubuntu tar czf /backup/mongodb-backup.tar.gz /data

# Restore MongoDB data
docker run --rm -v opd_mongodb_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/mongodb-backup.tar.gz -C /
```

---

## Nginx Configuration

### Upstream Definitions

```nginx
upstream api_backend {
    server api:4000;
    keepalive 32;
}

upstream admin_backend {
    server web-admin:3000;
    keepalive 32;
}

upstream member_backend {
    server web-member:3000;
    keepalive 32;
}
```

### Routing Rules

```nginx
server {
    listen 80;
    server_name _;

    # API Routes
    location /api {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Admin Portal Routes
    location /admin {
        proxy_pass http://admin_backend/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting
        limit_req zone=app burst=50 nodelay;
    }

    # Operations Portal Routes
    location /operations {
        proxy_pass http://admin_backend/operations;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # TPA Portal Routes
    location /tpa {
        proxy_pass http://admin_backend/tpa;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Finance Portal Routes
    location /finance {
        proxy_pass http://admin_backend/finance;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Member Portal Routes (Default)
    location / {
        proxy_pass http://member_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting
        limit_req zone=app burst=50 nodelay;
    }
}
```

### Rate Limiting Configuration

```nginx
http {
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=app:10m rate=30r/s;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    limit_conn addr 10;
}
```

---

## Environment Variables

### Backend (API)

#### Core Configuration
```bash
NODE_ENV=production
PORT=4000
API_PORT=4001
```

#### Database
```bash
MONGODB_URI=mongodb://mongodb:27017/opd_wallet
DB_QUERY_TIMEOUT=5000
DB_POOL_SIZE=10
```

#### Authentication
```bash
JWT_SECRET=<secure_random_string_64_chars>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<secure_random_string_64_chars>
JWT_REFRESH_EXPIRY=30d
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=86400000  # 24 hours in ms
```

#### Session Management
```bash
COOKIE_NAME=opd_session
COOKIE_MAX_AGE=604800000  # 7 days in ms
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
COOKIE_HTTPONLY=true
```

#### Security
```bash
CORS_ORIGIN=http://51.20.125.246,https://51.20.125.246
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=1000
```

#### Google Maps API
```bash
GOOGLE_MAPS_API_KEY=<your_google_maps_api_key>
```

#### AWS (Optional)
```bash
USE_SECRETS_MANAGER=false
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=<access_key>
AWS_SECRET_ACCESS_KEY=<secret_key>
```

### Frontend

#### Admin Portal
```bash
NEXT_PUBLIC_API_URL=http://51.20.125.246/api
NODE_ENV=production
```

#### Member Portal
```bash
NEXT_PUBLIC_API_URL=http://51.20.125.246/api
NODE_ENV=production
```

### Environment File Structure

**.env.development** (Not committed):
```bash
# Development environment variables
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/opd_wallet
JWT_SECRET=dev_secret_change_in_production
COOKIE_SECURE=false
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

**.env.production** (Not committed):
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/opd_wallet
JWT_SECRET=<production_secret>
COOKIE_SECURE=true
CORS_ORIGIN=http://51.20.125.246
```

**.env.example** (Committed):
```bash
# Example environment variables - Copy to .env and update values
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/opd_wallet
JWT_SECRET=your_jwt_secret_here
# ... more variables
```

---

## Deployment Workflow

### Manual Deployment

#### Step 1: SSH to EC2 Instance
```bash
ssh -i keypair.pem ubuntu@51.20.125.246
```

#### Step 2: Navigate to Project
```bash
cd ~/opdwallet
```

#### Step 3: Pull Latest Code
```bash
git pull origin main
```

#### Step 4: Build and Deploy
```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional)
docker system prune -f

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
sleep 10
```

#### Step 5: Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs --tail=50

# Test API health
curl http://localhost/api/health
```

---

### CI/CD Pipeline (GitHub Actions)

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.7.0
        with:
          ssh-private-key: ${{ secrets.EC2_SSH_KEY }}

      - name: Deploy to EC2
        run: |
          ssh -o StrictHostKeyChecking=no ubuntu@51.20.125.246 << 'EOF'
            cd ~/opdwallet
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d --build
            docker system prune -f
          EOF

      - name: Health Check
        run: |
          sleep 20
          curl -f http://51.20.125.246/api/health || exit 1

      - name: Notify Success
        if: success()
        run: echo "Deployment successful!"

      - name: Notify Failure
        if: failure()
        run: echo "Deployment failed!"
```

---

## Health Monitoring

### Application Health Checks

#### API Health Endpoint
```bash
curl http://51.20.125.246/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-16T10:30:00Z",
  "uptime": 3600,
  "database": "connected"
}
```

#### Container Health Status
```bash
# Check all containers
docker ps

# Check specific service
docker-compose -f docker-compose.prod.yml ps api

# Check container health
docker inspect --format='{{.State.Health.Status}}' opd-api-prod
```

### Log Monitoring

#### View Real-Time Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

#### Log Locations
- **API Logs**: Docker container logs (stdout/stderr)
- **Nginx Logs**: `/var/log/nginx/` (inside container)
- **MongoDB Logs**: Docker container logs

### Performance Monitoring

**Current Status**: ⚠️ Not Implemented

**Planned Tools**:
- APM: New Relic / DataDog
- Error Tracking: Sentry
- Log Aggregation: ELK Stack / Splunk
- Uptime Monitoring: UptimeRobot / Pingdom

---

## Common Commands

### Development

```bash
# Start development environment
make up
# Or: docker-compose up -d

# View logs
make logs
make logs-api
make logs-admin

# Access MongoDB shell
make mongo-shell
# Or: docker exec -it opd-mongo-dev mongosh

# Reset database
make reset-db

# Stop all services
make down
# Or: docker-compose down
```

### Production

```bash
# Deploy production
make prod-up
# Or: docker-compose -f docker-compose.prod.yml up -d --build

# View production logs
make prod-logs
# Or: docker-compose -f docker-compose.prod.yml logs -f

# Check status
make prod-status
# Or: docker-compose -f docker-compose.prod.yml ps

# Stop production
make prod-down
# Or: docker-compose -f docker-compose.prod.yml down

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Database Operations

```bash
# Access MongoDB shell
docker exec -it opd-mongo-prod mongosh -u admin -p admin123

# Backup database
mongodump --uri="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" --out=/backup

# Restore database
mongorestore --uri="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" /backup

# Check database size
docker exec -it opd-mongo-prod mongosh -u admin -p admin123 --eval "db.stats()"
```

### Container Management

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop specific container
docker stop opd-api-prod

# Remove container
docker rm opd-api-prod

# View container logs
docker logs opd-api-prod -f

# Execute command in container
docker exec -it opd-api-prod sh

# Inspect container
docker inspect opd-api-prod

# Clean up unused resources
docker system prune -a
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

**Symptom**: Container exits immediately after starting

**Diagnosis**:
```bash
docker logs <container_name>
docker-compose -f docker-compose.prod.yml logs <service_name>
```

**Common Causes**:
- Port already in use
- Environment variables missing
- Database connection failure
- Build errors

**Solution**:
```bash
# Check port usage
netstat -tuln | grep 4000

# Rebuild with no cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Check environment variables
docker-compose -f docker-compose.prod.yml config
```

---

#### 2. 502 Bad Gateway

**Symptom**: Nginx returns 502 error

**Diagnosis**:
```bash
docker logs opd-nginx-prod
docker logs opd-api-prod
```

**Common Causes**:
- Backend service not running
- Backend service crashed
- Network connectivity issue

**Solution**:
```bash
# Restart backend service
docker-compose -f docker-compose.prod.yml restart api

# Check service health
curl http://localhost:4000/api/health

# Rebuild if necessary
docker-compose -f docker-compose.prod.yml up -d --build api
```

---

#### 3. Database Connection Failed

**Symptom**: API can't connect to MongoDB

**Diagnosis**:
```bash
docker logs opd-api-prod | grep -i mongo
docker exec -it opd-mongo-prod mongosh
```

**Common Causes**:
- MongoDB not running
- Wrong connection string
- Authentication failure

**Solution**:
```bash
# Check MongoDB status
docker ps | grep mongo

# Restart MongoDB
docker-compose -f docker-compose.prod.yml restart mongodb

# Verify connection string
docker-compose -f docker-compose.prod.yml config | grep MONGODB_URI
```

---

#### 4. High Memory Usage

**Symptom**: Server running out of memory

**Diagnosis**:
```bash
docker stats
free -h
```

**Solution**:
```bash
# Set memory limits in docker-compose.yml
services:
  api:
    mem_limit: 512m
    mem_reservation: 256m

# Restart with limits
docker-compose -f docker-compose.prod.yml up -d

# Clean up unused resources
docker system prune -a
```

---

### Debugging Checklist

1. **Check Container Status**
   ```bash
   docker ps -a
   ```

2. **Review Logs**
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100
   ```

3. **Test Network Connectivity**
   ```bash
   docker exec -it opd-api-prod ping mongodb
   ```

4. **Verify Environment Variables**
   ```bash
   docker-compose -f docker-compose.prod.yml config
   ```

5. **Check Resource Usage**
   ```bash
   docker stats --no-stream
   ```

6. **Test Endpoints**
   ```bash
   curl -v http://localhost/api/health
   curl -v http://localhost/api/auth/me
   ```

---

## Security Best Practices

### Production Checklist

- [ ] Change all default credentials
- [ ] Use strong JWT secrets
- [ ] Enable MongoDB authentication
- [ ] Configure SSL/TLS certificates
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable firewall rules
- [ ] Regular security updates

### Credentials to Change

**MongoDB**:
- Default: `admin:admin123`
- Change to: Strong password with special characters

**Super Admin**:
- Default: `admin@opdwallet.com:Admin@123`
- Change to: Unique credentials

**JWT Secrets**:
- Generate new 64-character random strings
- Never commit to version control

---

## Backup & Recovery

### Database Backup

**Automated Backup Script** (`scripts/backup-db.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
docker exec opd-mongo-prod mongodump \
  --uri="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" \
  --out=/tmp/backup_$DATE

# Copy to host
docker cp opd-mongo-prod:/tmp/backup_$DATE $BACKUP_DIR/

# Compress
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

### Restore from Backup

```bash
# Extract backup
tar -xzf backup_20250116_100000.tar.gz

# Restore to MongoDB
docker exec -i opd-mongo-prod mongorestore \
  --uri="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" \
  --drop \
  /tmp/backup_20250116_100000
```

---

## Default Credentials

### Development

**Super Admin**:
- Email: `admin@opdwallet.com`
- Password: `Admin@123`

**MongoDB**:
- Username: `admin`
- Password: `admin123`

### Production

⚠️ **CRITICAL**: Change all default credentials immediately after deployment

---

## Useful Links

- **Production URL**: http://51.20.125.246
- **Admin Portal**: http://51.20.125.246/admin
- **Member Portal**: http://51.20.125.246
- **API Base**: http://51.20.125.246/api
- **Health Check**: http://51.20.125.246/api/health

---

**Document Maintained By**: Development Team
**Last Updated**: October 18, 2025
**Version**: 6.8
