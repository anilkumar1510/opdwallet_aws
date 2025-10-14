# AWS Deployment Guide - Simple Approach

## Part 1: Creating t4g.medium EC2 Instance

### Step-by-Step AWS Console Instructions:

1. **Login to AWS Console**
   - Go to: https://aws.amazon.com/console/
   - Navigate to EC2 Dashboard

2. **Launch Instance**
   - Click "Launch Instance" (orange button)

3. **Configure Instance:**
   - **Name**: `opdwallet-server`

   - **AMI (Operating System)**:
     - Select: "Ubuntu Server 24.04 LTS"
     - **IMPORTANT**: Click "Browse more AMIs"
     - Filter by: "64-bit (Arm)" architecture
     - Select the ARM version of Ubuntu

   - **Instance Type**:
     - Select: `t4g.medium` (2 vCPU, 4GB RAM)
     - This is ARM-based Graviton processor

   - **Key Pair**:
     - Create new key pair
     - Name: `opdwallet-arm-key`
     - Type: RSA
     - Format: .pem
     - Download and save it safely

   - **Network Settings**:
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
     - Add Custom TCP Rules:
       - Port 3001 (Admin Portal)
       - Port 3002 (Member Portal)
       - Port 4000 (API)
       - Port 27017 (MongoDB if needed externally)

   - **Storage**:
     - 30 GB gp3 (or more if needed)

4. **Launch Instance**
   - Review and Launch
   - Note down the Public IP address

## Part 2: Initial Server Setup (One-Time)

```bash
# 1. Connect to your instance
chmod 600 ~/opdwallet-arm-key.pem
ssh -i ~/opdwallet-arm-key.pem ubuntu@YOUR-EC2-IP

# 2. Update system
sudo apt update && sudo apt upgrade -y

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
exit

# 4. Reconnect (to apply docker permissions)
ssh -i ~/opdwallet-arm-key.pem ubuntu@YOUR-EC2-IP

# 5. Install Docker Compose
sudo apt install docker-compose -y

# 6. Install Git
sudo apt install git -y

# 7. Clone your repository (or create directory)
mkdir opdwallet
cd opdwallet
```

## Part 3: Simple Deployment Process (Repeatable)

### The Simplest Approach: Direct File Copy + Docker Compose

#### On Your Mac - Create Deployment Script

Save this as `deploy-to-aws.sh` in your project root:

```bash
#!/bin/bash

# Configuration
AWS_IP="YOUR-EC2-PUBLIC-IP"  # Replace with your EC2 IP
KEY_PATH="~/opdwallet-arm-key.pem"  # Path to your SSH key

echo "🚀 Deploying to AWS..."

# 1. Create a deployment package
echo "📦 Creating deployment package..."
tar -czf deployment.tar.gz \
  docker-compose.yml \
  api/ \
  web-admin/ \
  web-member/ \
  --exclude node_modules \
  --exclude .next \
  --exclude dist

# 2. Copy to AWS
echo "📤 Copying to AWS..."
scp -i $KEY_PATH deployment.tar.gz ubuntu@$AWS_IP:/home/ubuntu/

# 3. Deploy on AWS
echo "🎯 Deploying on server..."
ssh -i $KEY_PATH ubuntu@$AWS_IP << 'ENDSSH'
  # Extract files
  cd /home/ubuntu
  rm -rf opdwallet-old
  mv opdwallet opdwallet-old 2>/dev/null || true
  mkdir opdwallet
  cd opdwallet
  tar -xzf ../deployment.tar.gz

  # Build and run
  docker-compose down 2>/dev/null || true
  docker-compose build --no-cache
  docker-compose up -d

  # Show status
  echo "✅ Deployment complete!"
  docker-compose ps
ENDSSH

echo "🎉 Done! Your app is running at:"
echo "   Admin Portal: http://$AWS_IP:3001"
echo "   Member Portal: http://$AWS_IP:3002"
echo "   API: http://$AWS_IP:4000"
```

#### Make it executable:
```bash
chmod +x deploy-to-aws.sh
```

## Part 4: Docker Compose Configuration

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: opdwallet-mongo
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: opdadmin
      MONGO_INITDB_ROOT_PASSWORD: OpdAdmin2024
      MONGO_INITDB_DATABASE: opd_wallet
    volumes:
      - mongo-data:/data/db

  api:
    build: ./api
    container_name: opdwallet-api
    restart: always
    ports:
      - "4000:4000"
    environment:
      PORT: 4000
      MONGODB_URI: mongodb://opdadmin:OpdAdmin2024@mongodb:27017/opd_wallet?authSource=admin
      JWT_SECRET: your-jwt-secret-key-change-this
      NODE_ENV: production
    depends_on:
      - mongodb
    command: npm run start:prod

  web-admin:
    build: ./web-admin
    container_name: opdwallet-admin
    restart: always
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://YOUR-EC2-IP:4000/api
      API_BASE_URL: http://api:4000/api
    depends_on:
      - api
    command: sh -c "npm run build && npm run start"

  web-member:
    build: ./web-member
    container_name: opdwallet-member
    restart: always
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://YOUR-EC2-IP:4000/api
      API_BASE_URL: http://api:4000/api
    depends_on:
      - api
    command: sh -c "npm run build && npm run start"

volumes:
  mongo-data:
```

## Part 5: Dockerfile for Each Service

### api/Dockerfile:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
```

### web-admin/Dockerfile:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# Build happens in docker-compose command
```

### web-member/Dockerfile:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# Build happens in docker-compose command
```

## Usage - Super Simple!

### First Time Setup:
1. Create t4g.medium EC2 instance (follow Part 1)
2. Setup server (follow Part 2)
3. Update `deploy-to-aws.sh` with your EC2 IP
4. Update `docker-compose.yml` with your EC2 IP

### Every Deployment (Forever):
```bash
# Just run this one command:
./deploy-to-aws.sh
```

That's it! This single command will:
- Package your code
- Upload to AWS
- Build Docker images
- Start all services
- Show you the URLs

## Troubleshooting

### Check logs:
```bash
ssh -i ~/opdwallet-arm-key.pem ubuntu@YOUR-EC2-IP
cd opdwallet
docker-compose logs api        # API logs
docker-compose logs web-admin  # Admin portal logs
docker-compose logs web-member  # Member portal logs
docker-compose logs mongodb    # Database logs
```

### Restart services:
```bash
docker-compose restart
```

### Stop everything:
```bash
docker-compose down
```

### Start everything:
```bash
docker-compose up -d
```

## Important Notes

1. **Security**:
   - Change the JWT_SECRET in production
   - Update MongoDB password
   - Consider using AWS Secrets Manager

2. **Domain Names**:
   - Later, you can point domains to your EC2 IP
   - Update NEXT_PUBLIC_API_BASE_URL accordingly

3. **Backups**:
   - MongoDB data is stored in Docker volume
   - Consider regular backups of the volume

4. **Monitoring**:
   - Services auto-restart with `restart: always`
   - Consider adding health checks

## Summary

**One command deployment:** `./deploy-to-aws.sh`

This approach:
- ✅ Works every time
- ✅ Takes ~5 minutes
- ✅ No platform issues (ARM to ARM)
- ✅ Exact copy of local setup
- ✅ Easy to understand and modify