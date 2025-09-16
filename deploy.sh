#!/bin/bash

# OPD Wallet Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 OPD Wallet Deployment Script"
echo "================================"

# Configuration
EC2_IP="13.60.210.156"
SSH_KEY="opdwallet-server.pem"
REMOTE_DIR="/home/ubuntu/opdwallet"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi

echo "📦 Step 1: Building Docker images locally..."
docker-compose -f docker-compose.prod.yml build

echo "📤 Step 2: Syncing files to EC2..."
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '*.log' \
    ./ ubuntu@$EC2_IP:$REMOTE_DIR/

echo "🔧 Step 3: Deploying on EC2..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ubuntu@$EC2_IP << 'ENDSSH'
    cd /home/ubuntu/opdwallet
    echo "Building images on server..."
    docker-compose -f docker-compose.prod.yml build

    echo "Stopping old containers..."
    docker-compose -f docker-compose.prod.yml down

    echo "Starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d

    echo "Waiting for services to be ready..."
    sleep 10

    echo "Checking container status..."
    docker ps --format "table {{.Names}}\t{{.Status}}"

    echo "Testing health endpoints..."
    curl -f http://localhost/health || echo "Warning: Health check failed"
ENDSSH

echo "✅ Deployment complete!"
echo "🌐 Access the application at: http://$EC2_IP"
echo "📊 Admin Portal: http://$EC2_IP/admin"