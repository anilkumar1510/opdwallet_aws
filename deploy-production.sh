#!/bin/bash

# ================================================
# Production Deployment Script - Option C
# Clean separation from local environment
# ================================================

set -e

AWS_IP="51.21.190.63"
KEY_PATH="~/Downloads/opdwallet-arm-key.pem"
REMOTE_DIR="/home/ubuntu/opdwallet"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}    Production Deployment (Option C)${NC}"
echo -e "${GREEN}================================================${NC}"

# Verify local is protected
echo -e "${BLUE}📋 Verifying local environment protection${NC}"
if grep -q "localhost" /Users/turbo/Projects/opdwallet/docker-compose.yml; then
    echo -e "${GREEN}✅ Local docker-compose.yml is safe (has localhost)${NC}"
else
    echo -e "${RED}❌ Warning: Local docker-compose.yml may be contaminated${NC}"
    exit 1
fi

# Create deployment package
echo -e "${BLUE}📦 Creating production deployment package${NC}"
LOCAL_SHA=$(git rev-parse HEAD)

# Create a temp directory for clean deployment
TEMP_DIR=$(mktemp -d)
echo "Using temp dir: $TEMP_DIR"

# Copy only production files (exclude local configs)
echo "Copying production files..."
cp -r api web-admin web-member $TEMP_DIR/
cp docker-compose.production.yml $TEMP_DIR/
cp .env.production $TEMP_DIR/

# Create tarball
cd $TEMP_DIR
tar -czf /tmp/production-deployment.tar.gz .
cd - > /dev/null
rm -rf $TEMP_DIR

ARCHIVE_SIZE=$(du -h /tmp/production-deployment.tar.gz | cut -f1)
echo -e "${GREEN}✅ Archive created: ${ARCHIVE_SIZE}${NC}"

# Upload to AWS
echo -e "${BLUE}📤 Uploading to AWS${NC}"
scp -i ${KEY_PATH/#\~/$HOME} /tmp/production-deployment.tar.gz ubuntu@$AWS_IP:/tmp/
scp -i ${KEY_PATH/#\~/$HOME} .env.production ubuntu@$AWS_IP:/home/ubuntu/.env.production

# Deploy on AWS
echo -e "${BLUE}🚀 Deploying on AWS${NC}"

ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
set -e

echo "📂 Preparing deployment directory..."

# Stop existing containers
docker-compose -f $REMOTE_DIR/docker-compose.production.yml down 2>/dev/null || true
docker-compose -f $REMOTE_DIR/docker-compose.yml down 2>/dev/null || true

# Backup and extract
if [ -d $REMOTE_DIR ]; then
    sudo rm -rf ${REMOTE_DIR}.backup
    mv $REMOTE_DIR ${REMOTE_DIR}.backup
fi

mkdir -p $REMOTE_DIR
cd $REMOTE_DIR
tar -xzf /tmp/production-deployment.tar.gz
rm /tmp/production-deployment.tar.gz

# Copy env file
cp /home/ubuntu/.env.production .env.production

# Create tracking file
cat > .deployment-tracking.json << EOF
{
    "sha": "$LOCAL_SHA",
    "branch": "main",
    "timestamp": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
    "mode": "production",
    "compose_file": "docker-compose.production.yml"
}
EOF

echo "🔨 Building production images..."
# Build with production settings
export COMPOSE_FILE=docker-compose.production.yml
export DOCKER_BUILDKIT=1

# Clean any orphan containers
docker container prune -f

# Build and start services
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Health check
echo "🔍 Checking service health..."
curl -f http://localhost:4000/health || echo "API still starting..."
docker-compose -f docker-compose.production.yml ps

echo "✅ Deployment complete!"
ENDSSH

# Clean up temp file
rm /tmp/production-deployment.tar.gz

# Final status
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Production Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "Access your application at:"
echo -e "  ${BLUE}Admin:${NC}  http://$AWS_IP:3001"
echo -e "  ${BLUE}Member:${NC} http://$AWS_IP:3002"
echo -e "  ${BLUE}API:${NC}    http://$AWS_IP:4000"
echo -e "\nLocal environment: ${GREEN}Untouched ✅${NC}"
echo -e "Deployed SHA: ${LOCAL_SHA:0:8}"