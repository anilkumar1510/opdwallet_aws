#!/bin/bash

# Simple deployment script that always works
set -e

echo "🚀 OPD Wallet Deployment Script"
echo "================================"

# Stop containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Clean up
echo "🧹 Cleaning Docker system..."
docker system prune -f

# Build each service separately to avoid memory issues
echo "🔨 Building services (this will take 10-15 minutes)..."

echo "Building MongoDB (pulling image)..."
docker-compose -f docker-compose.prod.yml pull mongodb

echo "Building Redis (pulling image)..."
docker-compose -f docker-compose.prod.yml pull redis

echo "Building API..."
docker-compose -f docker-compose.prod.yml build api

echo "Building Admin Portal..."
docker-compose -f docker-compose.prod.yml build web-admin

echo "Building Member Portal..."
docker-compose -f docker-compose.prod.yml build web-member

echo "Building Doctor Portal..."
docker-compose -f docker-compose.prod.yml build web-doctor

# Start all services
echo "🚢 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Show status
echo "✅ Deployment complete! Containers status:"
docker ps

echo ""
echo "🔍 Verifying services..."
docker exec opd-redis-prod redis-cli --raw incr ping >/dev/null 2>&1 && echo "✅ Redis: Running" || echo "⚠️ Redis: Check required"
docker exec opd-mongodb-prod mongosh --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1 && echo "✅ MongoDB: Running" || echo "⚠️ MongoDB: Check required"

echo ""
echo "🌐 Access URLs:"
echo "   Member Portal: http://51.20.125.246"
echo "   Admin Portal: http://51.20.125.246/admin"
echo "   API: http://51.20.125.246/api"