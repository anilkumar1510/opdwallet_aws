#!/bin/bash

# AWS Deployment Script for OPD Wallet
# This script deploys code and MongoDB data to AWS EC2 instance

set -e  # Exit on error

# Configuration
AWS_IP="51.20.125.246"
PEM_FILE="./opdwallet-server.pem"
AWS_USER="ubuntu"
PROJECT_DIR="/home/ubuntu/opdwallet"
MONGO_BACKUP_DIR="./mongodb-backup/mongodb-backup"

echo "🚀 Starting deployment to AWS instance: ${AWS_IP}"
echo "=================================================="

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo "❌ Error: PEM file not found at $PEM_FILE"
    exit 1
fi

# Check PEM file permissions
chmod 400 "$PEM_FILE"
echo "✅ PEM file permissions set to 400"

# Test SSH connection
echo ""
echo "🔐 Testing SSH connection to AWS..."
if ! ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${AWS_USER}@${AWS_IP}" "echo 'SSH connection successful'"; then
    echo "❌ Error: Cannot connect to AWS instance"
    exit 1
fi
echo "✅ SSH connection successful"

# Stop local Docker services
echo ""
echo "🛑 Stopping local Docker services..."
docker-compose down || true

# Create tarball of project (excluding node_modules, .git, etc.)
echo ""
echo "📦 Creating project tarball..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='mongodb-backup' \
    --exclude='*.log' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    -czf opdwallet-code.tar.gz \
    api/ \
    web-admin/ \
    web-member/ \
    docker-compose.yml \
    docker-compose.prod.yml \
    Makefile \
    README.md \
    *.md 2>/dev/null || tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='mongodb-backup' \
    --exclude='*.log' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    -czf opdwallet-code.tar.gz \
    api/ \
    web-admin/ \
    web-member/ \
    docker-compose.yml \
    docker-compose.prod.yml \
    Makefile

echo "✅ Project tarball created"

# Create MongoDB backup tarball
echo ""
echo "📦 Creating MongoDB backup tarball..."
tar -czf mongodb-data.tar.gz -C mongodb-backup/mongodb-backup opd_wallet/
echo "✅ MongoDB backup tarball created"

# Copy files to AWS
echo ""
echo "📤 Uploading code to AWS..."
scp -i "$PEM_FILE" opdwallet-code.tar.gz "${AWS_USER}@${AWS_IP}:/tmp/"
echo "✅ Code uploaded"

echo ""
echo "📤 Uploading MongoDB backup to AWS..."
scp -i "$PEM_FILE" mongodb-data.tar.gz "${AWS_USER}@${AWS_IP}:/tmp/"
echo "✅ MongoDB backup uploaded"

# Deploy on AWS
echo ""
echo "🔧 Deploying on AWS instance..."
ssh -i "$PEM_FILE" "${AWS_USER}@${AWS_IP}" << 'ENDSSH'
set -e

echo "📂 Creating project directory..."
sudo mkdir -p /home/ubuntu/opdwallet
sudo chown -R ubuntu:ubuntu /home/ubuntu/opdwallet
cd /home/ubuntu/opdwallet

echo "🗑️  Stopping existing Docker containers..."
docker-compose down || true
docker stop $(docker ps -aq) 2>/dev/null || true

echo "📦 Extracting code..."
tar -xzf /tmp/opdwallet-code.tar.gz -C /home/ubuntu/opdwallet/
echo "✅ Code extracted"

echo "📦 Extracting MongoDB backup..."
mkdir -p /tmp/mongodb-restore
tar -xzf /tmp/mongodb-data.tar.gz -C /tmp/mongodb-restore/
echo "✅ MongoDB backup extracted"

echo "🐳 Starting MongoDB container first..."
docker-compose up -d mongo

echo "⏳ Waiting for MongoDB to be ready (30 seconds)..."
sleep 30

echo "📊 Restoring MongoDB data..."
docker exec opd-mongo-dev mongorestore \
    --uri="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" \
    --drop \
    /tmp/mongodb-restore/opd_wallet/ || true

echo "✅ MongoDB data restored"

echo "🐳 Building and starting all Docker services..."
docker-compose down
docker-compose up -d --build

echo "⏳ Waiting for services to start (45 seconds)..."
sleep 45

echo "🔍 Checking Docker containers status..."
docker ps

echo "🧹 Cleaning up temporary files..."
rm -f /tmp/opdwallet-code.tar.gz
rm -f /tmp/mongodb-data.tar.gz
rm -rf /tmp/mongodb-restore

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Services Status:"
docker-compose ps

echo ""
echo "🌐 Application URLs:"
echo "   Admin Portal:  http://51.20.125.246:3001"
echo "   Member Portal: http://51.20.125.246:3002"
echo "   API:           http://51.20.125.246:4000"
ENDSSH

# Clean up local files
echo ""
echo "🧹 Cleaning up local temporary files..."
rm -f opdwallet-code.tar.gz
rm -f mongodb-data.tar.gz

echo ""
echo "=================================================="
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Test the application at: http://51.20.125.246:3002"
echo "   2. Check logs: ssh -i ${PEM_FILE} ${AWS_USER}@${AWS_IP} 'cd ${PROJECT_DIR} && docker-compose logs -f'"
echo "   3. Check status: ssh -i ${PEM_FILE} ${AWS_USER}@${AWS_IP} 'cd ${PROJECT_DIR} && docker-compose ps'"
echo ""
echo "🎉 All done!"