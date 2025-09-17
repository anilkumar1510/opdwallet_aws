# IntelliSystem CI/CD Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Docker Configuration](#docker-configuration)
4. [GitHub Actions Workflow](#github-actions-workflow)
5. [AWS EC2 Deployment](#aws-ec2-deployment)
6. [Service Components](#service-components)
7. [Build Process](#build-process)
8. [Deployment Pipeline](#deployment-pipeline)
9. [Environment Configuration](#environment-configuration)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

## Overview

The IntelliSystem employs a modern CI/CD pipeline leveraging Docker containerization, GitHub Actions for automation, and AWS EC2 for hosting. This document provides a comprehensive understanding of the entire deployment ecosystem.

### Key Technologies
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud Infrastructure**: AWS EC2
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Runtime**: Node.js 20
- **Frontend Framework**: React 18

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Repository: intelli-system                          │  │
│  │  Branch: main (production)                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                     Push to main                            │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GitHub Actions Workflow                             │  │
│  │  .github/workflows/deploy.yml                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                        SSH Deploy
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS EC2 Instance                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Docker Compose Stack                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Frontend │  │ Backend  │  │   Redis  │          │  │
│  │  │  :3000   │  │  :3001   │  │  :6379   │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Worker   │  │Demo Work │  │PostgreSQL│          │  │
│  │  │ (Batch)  │  │(Analysis)│  │  :5436   │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Docker Configuration

### Docker Compose Services

The system uses Docker Compose to orchestrate 6 interconnected services:

#### 1. Backend Service (`backend`)
```yaml
backend:
  build:
    context: .
    dockerfile: server/Dockerfile
  environment:
    - DATABASE_URL=postgresql://myuser:mypassword@db:5432/mydatabase
    - JWT_SECRET=your-super-secret-jwt-key
    - NODE_ENV=development
    - FRONTEND_URL=http://13.60.66.60:3000
    - REDIS_HOST=redis
  ports:
    - "3001:3001"
  depends_on:
    - redis
```

**Purpose**: Main API server handling all business logic, authentication, and data processing.

**Key Features**:
- Express.js server running on port 3001
- JWT-based authentication
- Connection to PostgreSQL database
- Integration with Redis for queue management
- Email service integration for notifications

#### 2. Database Service (`db`)
```yaml
db:
  image: postgres:15
  restart: always
  environment:
    POSTGRES_USER: myuser
    POSTGRES_PASSWORD: mypassword
    POSTGRES_DB: mydatabase
  ports:
    - "5436:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./setup-database.sql:/docker-entrypoint-initdb.d/setup.sql
```

**Purpose**: PostgreSQL database storing all application data.

**Key Features**:
- PostgreSQL version 15
- Persistent data storage via Docker volumes
- Automatic database initialization via setup script
- Exposed on non-standard port 5436 to avoid conflicts

#### 3. Worker Service (`worker`)
```yaml
worker:
  build:
    context: .
    dockerfile: server/Dockerfile
  working_dir: /app
  command: node workers/batchProcessingWorker.js
  depends_on:
    - backend
    - redis
```

**Purpose**: Background job processor for batch operations.

**Responsibilities**:
- Processing uploaded CSV/Excel files
- Batch data validation
- Asynchronous report generation
- Database batch inserts

#### 4. Demographic Worker Service (`demographic-worker`)
```yaml
demographic-worker:
  build:
    context: .
    dockerfile: server/Dockerfile
  working_dir: /app
  command: node workers/demographicWorker.js
```

**Purpose**: Specialized worker for demographic data analysis.

**Responsibilities**:
- Age distribution calculations
- Gender analysis processing
- Statistical computations
- Report aggregation

#### 5. Frontend Service (`frontend`)
```yaml
frontend:
  build:
    context: .
    dockerfile: client/Dockerfile
  environment:
    - REACT_APP_API_URL=http://13.60.66.60:3001
  ports:
    - "3000:3000"
  depends_on:
    - backend
```

**Purpose**: React-based web application UI.

**Key Features**:
- React 18 with Tailwind CSS
- Real-time updates via API polling
- Responsive design for mobile/desktop
- Direct API connection to backend service

#### 6. Redis Service (`redis`)
```yaml
redis:
  image: redis:7
  ports:
    - "6379:6379"
```

**Purpose**: In-memory data store for caching and job queue management.

**Uses**:
- BullMQ job queue backend
- Session storage
- Temporary data caching
- Real-time data synchronization

### Dockerfile Configurations

#### Backend Dockerfile (`server/Dockerfile`)
```dockerfile
FROM node:20
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server ./
EXPOSE 3001
CMD ["npm", "run", "dev"]
```

**Build Process**:
1. Uses Node.js 20 base image
2. Sets working directory to `/app`
3. Copies and installs dependencies first (for Docker layer caching)
4. Copies application code
5. Exposes port 3001
6. Runs development server

#### Frontend Dockerfile (`client/Dockerfile`)
```dockerfile
FROM node:20
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
EXPOSE 3000
CMD ["npm", "start"]
```

**Build Process**:
1. Uses Node.js 20 base image
2. Sets working directory to `/app`
3. Installs frontend dependencies
4. Copies React application code
5. Exposes port 3000
6. Starts React development server

## GitHub Actions Workflow

### Deployment Workflow (`deploy.yml`)

The automated deployment is triggered on every push to the main branch:

```yaml
name: Deploy to EC2

on:
  push:
    branches:
      - main 

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - name: Connect and deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_KEY }}
          port: 22
          script: |
            cd ~/intelli-system
            git pull origin main
            echo "🛠 Restarting containers..."
            docker-compose down
            echo "♻️ Building containers..."
            docker-compose build --no-cache | tee build.log &
            pid=$!
            while kill -0 $pid 2>/dev/null; do
              echo "⏳ Still building..."
              sleep 60
            done
            docker-compose up -d
            echo "✅ Deployment complete"
```

### Workflow Breakdown

1. **Trigger**: Activates on push to `main` branch
2. **Runner**: Uses GitHub-hosted Ubuntu runner
3. **Timeout**: 60-minute maximum execution time
4. **SSH Connection**: Uses `appleboy/ssh-action` for secure connection

### Deployment Steps

1. **Connect to EC2**: SSH into AWS EC2 instance using stored secrets
2. **Navigate**: Change to project directory (`~/intelli-system`)
3. **Pull Code**: Fetch latest changes from GitHub
4. **Stop Services**: Gracefully shutdown running containers
5. **Build Images**: Rebuild Docker images with `--no-cache` flag
6. **Progress Monitoring**: Background build with progress updates every 60 seconds
7. **Start Services**: Launch containers in detached mode
8. **Confirmation**: Log deployment success

## AWS EC2 Deployment

### EC2 Instance Configuration

**Instance Details**:
- **Type**: Typically t2.medium or larger
- **OS**: Ubuntu 22.04 LTS
- **Public IP**: 13.60.66.60 (elastic IP recommended)
- **Security Groups**: Ports 22, 3000, 3001, 5436, 6379

### Initial Server Setup

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
git clone https://github.com/your-org/intelli-system.git ~/intelli-system

# 5. Set up environment variables
cd ~/intelli-system
cp .env.example .env
# Edit .env with production values

# 6. Initial deployment
docker-compose up -d
```

### GitHub Secrets Configuration

Required secrets in GitHub repository settings:

1. **EC2_HOST**: Public IP address of EC2 instance
2. **EC2_KEY**: Private SSH key for EC2 access (contents of .pem file)

## Service Components

### Backend Architecture

**Technology Stack**:
- Node.js 20 with Express.js
- PostgreSQL 15 for data persistence
- Redis 7 for caching/queues
- BullMQ for job processing
- JWT for authentication
- Multer for file uploads
- OpenAI API integration

**Key Endpoints**:
- `/api/auth/*` - Authentication routes
- `/api/admin/*` - Admin management
- `/api/corporate/*` - Corporate user routes
- `/api/batch/*` - Batch processing
- `/api/reports/*` - Report generation

### Frontend Architecture

**Technology Stack**:
- React 18
- Tailwind CSS for styling
- Axios for API calls
- React Router for navigation
- Chart.js for data visualization

**Key Features**:
- Responsive dashboard
- Real-time data updates
- File upload interface
- Report visualization
- User management UI

### Worker Services

**Batch Processing Worker**:
- Handles CSV/Excel file processing
- Validates data format
- Performs batch inserts
- Sends completion notifications

**Demographic Worker**:
- Calculates age distributions
- Processes gender statistics
- Generates demographic reports
- Updates aggregated data

## Build Process

### Local Build

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend

# Build with no cache
docker-compose build --no-cache
```

### Production Build

The production build process includes:

1. **Code Compilation**: TypeScript to JavaScript (if applicable)
2. **Dependency Installation**: Production-only dependencies
3. **Asset Optimization**: Minification and bundling
4. **Image Layer Caching**: Efficient Docker layer management

### Build Optimization

**Docker Layer Caching**:
- Package files copied before source code
- Dependencies installed in separate layer
- Source code changes don't invalidate dependency cache

**Multi-stage Builds** (recommended for production):
```dockerfile
# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["node", "index.js"]
```

## Deployment Pipeline

### Complete Deployment Flow

```
Developer Push → GitHub → GitHub Actions → SSH to EC2 → Pull Code → Docker Build → Container Restart → Health Check
```

### Deployment Stages

1. **Development Phase**
   - Local development with hot reload
   - Testing with local Docker setup
   - Code review and testing

2. **Commit Phase**
   - Push to feature branch
   - Pull request creation
   - Code review process

3. **Integration Phase**
   - Merge to main branch
   - Automated deployment trigger
   - GitHub Actions execution

4. **Deployment Phase**
   - SSH connection to EC2
   - Git pull latest changes
   - Docker image rebuild
   - Container orchestration

5. **Verification Phase**
   - Health endpoint checks
   - Service availability verification
   - Error log monitoring

### Rollback Strategy

```bash
# Quick rollback to previous version
cd ~/intelli-system
git log --oneline -5  # View recent commits
git checkout <previous-commit-hash>
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Environment Configuration

### Environment Variables

**Backend Environment**:
```env
DATABASE_URL=postgresql://myuser:mypassword@db:5432/mydatabase
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
FRONTEND_URL=http://your-domain.com
REDIS_HOST=redis
OPENAI_API_KEY=your-api-key
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password
EMAIL_FROM=IntelliSystem <noreply@yourdomain.com>
```

**Frontend Environment**:
```env
REACT_APP_API_URL=http://your-ec2-ip:3001
```

### Security Considerations

1. **Secrets Management**:
   - Never commit sensitive data to repository
   - Use GitHub Secrets for CI/CD variables
   - Rotate keys regularly
   - Use AWS Secrets Manager for production

2. **Network Security**:
   - Configure security groups properly
   - Use HTTPS in production
   - Implement rate limiting
   - Enable CORS appropriately

3. **Container Security**:
   - Use specific image versions (not `latest`)
   - Run containers as non-root user
   - Implement health checks
   - Regular security updates

## Monitoring & Maintenance

### Health Checks

**Docker Compose Health Check**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Log Management

**View Logs**:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Performance Monitoring

**Key Metrics**:
- Container CPU usage
- Memory consumption
- Disk I/O
- Network traffic
- Response times
- Error rates

**Monitoring Commands**:
```bash
# Container stats
docker stats

# System resources
docker system df

# Container inspection
docker inspect <container_id>
```

### Backup Strategy

**Database Backup**:
```bash
# Manual backup
docker exec db pg_dump -U myuser mydatabase > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * docker exec db pg_dump -U myuser mydatabase > /backups/db_$(date +\%Y\%m\%d).sql
```

**Volume Backup**:
```bash
# Backup Docker volume
docker run --rm -v intelli-system_pgdata:/data -v $(pwd):/backup ubuntu tar czf /backup/pgdata_backup.tar.gz /data
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Won't Start

**Symptoms**: Container exits immediately after starting

**Diagnosis**:
```bash
docker-compose logs <service_name>
docker-compose ps
```

**Common Causes**:
- Port already in use
- Missing environment variables
- Database connection issues
- Syntax errors in code

**Solutions**:
```bash
# Check port usage
sudo lsof -i :3001

# Verify environment
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

#### 2. Database Connection Errors

**Symptoms**: "ECONNREFUSED" or "connection timeout"

**Solutions**:
```bash
# Check database container
docker-compose ps db
docker-compose logs db

# Verify network
docker network ls
docker network inspect intelli-system_default

# Test connection
docker exec -it intelli-system_backend_1 ping db
```

#### 3. Build Failures

**Symptoms**: Docker build fails with npm errors

**Solutions**:
```bash
# Clear Docker cache
docker system prune -a

# Remove node_modules
docker-compose down
docker volume prune
docker-compose build --no-cache

# Check disk space
df -h
```

#### 4. Memory Issues

**Symptoms**: Containers killed with exit code 137

**Solutions**:
```bash
# Check memory
free -h
docker stats

# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 5. GitHub Actions Failures

**Symptoms**: Deployment workflow fails

**Common Issues**:
- SSH key mismatch
- Network timeout
- Build timeout
- Insufficient server resources

**Debug Steps**:
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Test SSH connection manually
4. Check EC2 instance status
5. Review server logs

### Debug Commands

```bash
# Container debugging
docker-compose exec backend sh
docker-compose exec backend npm run test

# Network debugging
docker network inspect bridge
docker port <container>

# Process debugging
docker top <container>
ps aux | grep docker

# Disk usage
docker system df
du -sh /var/lib/docker

# Clean up
docker system prune -a --volumes
```

### Emergency Procedures

**Full System Reset**:
```bash
# Stop all containers
docker-compose down -v

# Remove all Docker data (WARNING: Destructive)
docker system prune -a --volumes

# Reinstall from scratch
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

**Data Recovery**:
```bash
# Restore database from backup
docker-compose exec -T db psql -U myuser mydatabase < backup.sql

# Verify restoration
docker-compose exec db psql -U myuser -d mydatabase -c "\dt"
```

## Best Practices

### Development Workflow

1. **Branch Strategy**:
   - `main` - Production branch (auto-deploys)
   - `develop` - Development branch
   - `feature/*` - Feature branches
   - `hotfix/*` - Emergency fixes

2. **Testing**:
   - Unit tests before commit
   - Integration tests in CI
   - Load testing before major releases
   - Security scanning

3. **Code Quality**:
   - ESLint for code style
   - Prettier for formatting
   - Code reviews required
   - Documentation updates

### Production Recommendations

1. **Security**:
   - Use HTTPS with SSL certificates
   - Implement rate limiting
   - Regular security updates
   - Audit logging

2. **Performance**:
   - Enable gzip compression
   - Implement caching strategies
   - Database query optimization
   - CDN for static assets

3. **Reliability**:
   - Health checks for all services
   - Automated backups
   - Monitoring and alerting
   - Disaster recovery plan

4. **Scalability**:
   - Horizontal scaling ready
   - Load balancer configuration
   - Database replication
   - Microservices architecture

## Conclusion

This CI/CD pipeline provides a robust, automated deployment system that ensures consistent and reliable deployments. The Docker-based architecture enables easy scaling, portability, and maintenance while GitHub Actions automates the entire deployment process.

For questions or issues, consult the troubleshooting section or contact the DevOps team.

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: DevOps Team