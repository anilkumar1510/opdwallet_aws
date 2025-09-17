#!/bin/bash

# Force fresh deployment to AWS EC2
EC2_IP="51.20.125.246"
PEM_FILE="/Users/turbo/Projects/opdwallet/opdwallet-server.pem"

echo "🚀 Force Fresh Deployment to AWS EC2..."
echo "=================================="

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo "❌ Error: PEM file not found at $PEM_FILE"
    exit 1
fi

# Set correct permissions
chmod 400 "$PEM_FILE"

echo "📡 Connecting to EC2 server at $EC2_IP..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ubuntu@$EC2_IP << 'ENDSSH'
    echo "✅ Connected to EC2"

    echo "🧹 Removing old repository..."
    cd ~
    sudo rm -rf opdwallet

    echo "📦 Cloning fresh repository..."
    git clone https://github.com/anilkumar1510/opdwallet.git
    cd opdwallet

    echo "📋 Latest commits:"
    git log --oneline -n 5

    echo "📝 Creating .env.production..."
    cat > .env.production << 'EOF'
# MongoDB Configuration
MONGO_DATABASE=opd_wallet
JWT_SECRET=your-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
COOKIE_NAME=opd_session
COOKIE_SECURE=false
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax
COOKIE_MAX_AGE=604800000
PUBLIC_API_URL=http://51.20.125.246/api
NODE_ENV=production
EOF

    echo "🛑 Stopping all containers..."
    docker-compose -f docker-compose.prod.yml down

    echo "🧹 Cleaning Docker system..."
    docker system prune -af
    docker volume prune -f

    echo "🔨 Building images fresh (no cache)..."
    export DOCKER_DEFAULT_PLATFORM=linux/amd64

    echo "📦 Pulling MongoDB..."
    docker-compose -f docker-compose.prod.yml pull mongodb

    echo "📦 Building API..."
    docker-compose --env-file .env.production -f docker-compose.prod.yml build --no-cache api

    echo "📦 Building Admin Portal..."
    docker-compose --env-file .env.production -f docker-compose.prod.yml build --no-cache web-admin

    echo "📦 Building Member Portal..."
    docker-compose --env-file .env.production -f docker-compose.prod.yml build --no-cache web-member

    echo "📦 Building Nginx..."
    docker-compose --env-file .env.production -f docker-compose.prod.yml build --no-cache nginx

    echo "🚢 Starting all services..."
    docker-compose --env-file .env.production -f docker-compose.prod.yml up -d

    echo "⏳ Waiting for services to be ready..."
    sleep 30

    echo "🔍 Container status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo "📊 Checking member portal build..."
    docker exec opd-web-member ls -la .next/standalone/ 2>&1 || echo "Checking standard build..."
    docker exec opd-web-member ls -la .next/static/ 2>&1 || echo "No static directory"

    echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "=================================="
echo "🎉 Fresh deployment finished!"
echo "🌐 Application URLs:"
echo "   Member Portal: http://$EC2_IP"
echo "   Admin Portal: http://$EC2_IP/admin"
echo "   API: http://$EC2_IP/api"
echo "=================================="