#!/bin/bash

# Direct deployment script - run this ON your AWS server

echo "🚀 Deploying OPD Wallet..."

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Clean up to free memory
echo "🧹 Cleaning Docker system..."
docker system prune -af

# Build and start everything
echo "🔨 Building and starting all services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Show status
echo "✅ Deployment complete!"
docker ps

echo ""
echo "🌐 Application should be accessible at:"
echo "   http://51.20.125.246 - Member Portal"
echo "   http://51.20.125.246/admin - Admin Portal"