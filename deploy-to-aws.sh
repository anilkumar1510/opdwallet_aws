#!/bin/bash

# =============================================
# Simple AWS Deployment Script for OPD Wallet
# =============================================

# Configuration - UPDATE THESE VALUES
AWS_IP="51.21.190.63"  # Your t4g.medium instance IP
KEY_PATH="~/Downloads/opdwallet-arm-key.pem"  # Path to your SSH key

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting OPD Wallet Deployment to AWS...${NC}"

# Check if AWS_IP is configured
if [ "$AWS_IP" = "YOUR-EC2-PUBLIC-IP" ]; then
    echo -e "${RED}❌ Error: Please update AWS_IP in this script with your EC2 IP address${NC}"
    exit 1
fi

# Check if key file exists
if [ ! -f "${KEY_PATH/#\~/$HOME}" ]; then
    echo -e "${RED}❌ Error: SSH key not found at $KEY_PATH${NC}"
    exit 1
fi

# 1. Create a deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf deployment.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.log' \
  docker-compose.yml \
  api/ \
  web-admin/ \
  web-member/

# Check if tar was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to create deployment package${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Package created ($(du -h deployment.tar.gz | cut -f1))${NC}"

# 2. Copy to AWS
echo -e "${YELLOW}📤 Uploading to AWS...${NC}"
scp -i ${KEY_PATH/#\~/$HOME} -o StrictHostKeyChecking=no deployment.tar.gz ubuntu@$AWS_IP:/home/ubuntu/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to upload to AWS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Upload complete${NC}"

# 3. Deploy on AWS
echo -e "${YELLOW}🎯 Deploying on server...${NC}"
ssh -i ${KEY_PATH/#\~/$HOME} -o StrictHostKeyChecking=no ubuntu@$AWS_IP << ENDSSH
  set -e

  # Extract files
  cd /home/ubuntu

  # Backup existing deployment
  if [ -d opdwallet ]; then
    echo "📂 Backing up existing deployment..."
    rm -rf opdwallet-backup
    mv opdwallet opdwallet-backup
  fi

  # Create new deployment
  mkdir -p opdwallet
  cd opdwallet
  tar -xzf ../deployment.tar.gz

  # Update docker-compose.yml with actual IP
  sed -i "s/YOUR-EC2-IP/$AWS_IP/g" docker-compose.yml

  # Stop existing containers
  docker-compose down 2>/dev/null || true

  # Build images (this will use ARM architecture)
  echo "🔨 Building Docker images..."
  docker-compose build --no-cache

  # Start services
  echo "🚀 Starting services..."
  docker-compose up -d

  # Wait for services to start
  echo "⏳ Waiting for services to start..."
  sleep 10

  # Show status
  echo "📊 Service Status:"
  docker-compose ps

  # Clean up
  rm ../deployment.tar.gz

  echo "✅ Deployment complete!"
ENDSSH

# Check if SSH command was successful
if [ $? -eq 0 ]; then
    # Clean up local deployment package
    rm deployment.tar.gz

    echo -e "${GREEN}"
    echo "========================================="
    echo "🎉 Deployment Successful!"
    echo "========================================="
    echo -e "${NC}"
    echo "Your application is now running at:"
    echo -e "${GREEN}   Admin Portal:${NC}  http://$AWS_IP:3001"
    echo -e "${GREEN}   Member Portal:${NC} http://$AWS_IP:3002"
    echo -e "${GREEN}   API:${NC}          http://$AWS_IP:4000"
    echo ""
    echo "To check logs, run:"
    echo "  ssh -i $KEY_PATH ubuntu@$AWS_IP 'cd opdwallet && docker-compose logs'"
else
    echo -e "${RED}❌ Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi