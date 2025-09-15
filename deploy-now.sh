#!/bin/bash

# Deploy to AWS EC2 with automatic repository setup
EC2_IP="13.60.210.156"
PEM_FILE="/Users/turbo/Projects/opdwallet/opdwallet-server.pem"
GITHUB_TOKEN="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"

echo "🚀 Deploying OPD Wallet to AWS EC2..."
echo "=================================="

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo "❌ Error: PEM file not found at $PEM_FILE"
    exit 1
fi

# Set correct permissions
chmod 400 "$PEM_FILE"

echo "📡 Connecting to EC2 server..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ubuntu@$EC2_IP << ENDSSH
    echo "✅ Connected to EC2"

    # Check if repository exists
    if [ ! -d "/home/ubuntu/opdwallet" ]; then
        echo "📦 Cloning repository for first time..."
        cd /home/ubuntu
        git clone https://$GITHUB_TOKEN@github.com/anilkumar1510/opdwallet.git
        cd opdwallet
    else
        echo "📦 Pulling latest changes..."
        cd /home/ubuntu/opdwallet
        git pull https://$GITHUB_TOKEN@github.com/anilkumar1510/opdwallet.git main
    fi

    # Check if docker-compose.prod.yml exists
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo "⚠️  Creating production docker-compose file..."
        cp docker-compose.yml docker-compose.prod.yml
    fi

    echo "🔨 Building Docker images..."
    docker-compose -f docker-compose.prod.yml build

    echo "🔄 Restarting services..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d

    echo "🧹 Cleaning up old images..."
    docker image prune -f

    echo ""
    echo "✅ Deployment complete! Service status:"
    docker ps --format "table {{.Names}}\t{{.Status}}"

    echo ""
    echo "📊 Checking application health..."
    sleep 5
    curl -s http://localhost/api/health || echo "API health check pending..."
ENDSSH

echo ""
echo "=================================="
echo "🎉 Deployment finished!"
echo "🌐 Application URLs:"
echo "   Member Portal: http://$EC2_IP"
echo "   Admin Portal: http://$EC2_IP/admin"
echo "   API: http://$EC2_IP/api"
echo "=================================="