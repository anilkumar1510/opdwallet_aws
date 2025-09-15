#!/bin/bash

# Quick Deploy Script - Run this on your EC2 instance
# This script sets up everything needed to run OPD Wallet

set -e

echo "======================================"
echo "OPD Wallet Quick Deploy"
echo "======================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "🌐 EC2 Public IP: $PUBLIC_IP"

# Setup environment variables
if [ ! -f .env ]; then
    echo "📝 Setting up environment variables..."
    cp .env.production .env

    # Generate secure passwords
    MONGO_PASS=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)

    # Update .env file
    sed -i "s|CHANGE_THIS_STRONG_PASSWORD|$MONGO_PASS|g" .env
    sed -i "s|CHANGE_THIS_TO_RANDOM_64_CHAR_STRING|$JWT_SECRET|g" .env
    sed -i "s|YOUR_EC2_PUBLIC_IP|$PUBLIC_IP|g" .env
    sed -i "s|yourdomain.com|$PUBLIC_IP|g" .env

    echo "✅ Environment variables configured"
    echo "⚠️  Passwords have been auto-generated and saved in .env"
else
    echo "✅ Environment variables already configured"
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check status
echo "📊 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Show access URLs
echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "Access your application at:"
echo "👤 Member Portal: http://$PUBLIC_IP"
echo "👨‍💼 Admin Portal: http://$PUBLIC_IP/admin"
echo "📚 API Docs: http://$PUBLIC_IP/api/docs"
echo ""
echo "Default credentials:"
echo "Member: member@test.com / Test123!"
echo "Admin: admin@test.com / Test123!"
echo ""
echo "⚠️  Important Security Notes:"
echo "1. Change default passwords immediately"
echo "2. Configure SSL certificate for HTTPS"
echo "3. Update security group rules as needed"
echo "4. Review and update .env file settings"
echo ""
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "======================================="