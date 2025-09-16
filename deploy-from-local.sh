#!/bin/bash

# Deploy from local machine to EC2
# Usage: ./deploy-from-local.sh

set -e

echo "🚀 Starting deployment to EC2..."

# Variables
EC2_HOST="13.60.210.156"
EC2_USER="ubuntu"
SSH_KEY="opdwallet-server.pem"
ECR_REGISTRY="695990114347.dkr.ecr.eu-north-1.amazonaws.com"
AWS_REGION="eu-north-1"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi

# Build and push images to ECR
echo "📦 Building and pushing Docker images to ECR..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push API
echo "Building API..."
docker build -f api/Dockerfile.prod -t $ECR_REGISTRY/opdwallet/api:latest ./api
docker push $ECR_REGISTRY/opdwallet/api:latest

# Build and push Admin
echo "Building Admin Portal..."
docker build -f web-admin/Dockerfile.prod -t $ECR_REGISTRY/opdwallet/web-admin:latest ./web-admin
docker push $ECR_REGISTRY/opdwallet/web-admin:latest

# Build and push Member
echo "Building Member Portal..."
docker build -f web-member/Dockerfile.prod -t $ECR_REGISTRY/opdwallet/web-member:latest ./web-member
docker push $ECR_REGISTRY/opdwallet/web-member:latest

# Deploy to EC2
echo "🚢 Deploying to EC2..."

ssh -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
set -e

# Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 695990114347.dkr.ecr.eu-north-1.amazonaws.com

# Pull latest images
echo "Pulling latest images..."
docker pull 695990114347.dkr.ecr.eu-north-1.amazonaws.com/opdwallet/api:latest
docker pull 695990114347.dkr.ecr.eu-north-1.amazonaws.com/opdwallet/web-admin:latest
docker pull 695990114347.dkr.ecr.eu-north-1.amazonaws.com/opdwallet/web-member:latest

# Restart containers with new images
echo "Restarting containers..."
docker stop opd-api opd-web-admin opd-web-member || true
docker rm opd-api opd-web-admin opd-web-member || true

# Start new containers
docker run -d --name opd-api \
  --network opdwallet_opd-network \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://opd-mongo:27017/opd_wallet \
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
  -e COOKIE_SECURE=false \
  -e COOKIE_HTTPONLY=true \
  -e CORS_ORIGIN='*' \
  695990114347.dkr.ecr.eu-north-1.amazonaws.com/opdwallet/api:latest

docker run -d --name opd-web-admin \
  --network opdwallet_opd-network \
  -e NODE_ENV=production \
  -e API_URL=http://opd-api:4000/api \
  -e NEXT_PUBLIC_API_URL=http://13.60.210.156/api \
  695990114347.dkr.ecr.eu-north-1.amazonaws.com/opdwallet/web-admin:latest

docker run -d --name opd-web-member \
  --network opdwallet_opd-network \
  -e NODE_ENV=production \
  -e API_URL=http://opd-api:4000/api \
  -e NEXT_PUBLIC_API_URL=http://13.60.210.156/api \
  695990114347.dkr.ecr.eu-north-1.amazonaws.com/opdwallet/web-member:latest

# Check status
sleep 5
echo ""
echo "=== Deployment Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "=== Health Check ==="
curl -sf http://localhost/health && echo "✅ Health check passed!" || echo "❌ Health check failed"
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application available at: http://$EC2_HOST"
echo ""
echo "To check logs:"
echo "  ssh -i $SSH_KEY $EC2_USER@$EC2_HOST docker logs opd-api"
echo "  ssh -i $SSH_KEY $EC2_USER@$EC2_HOST docker logs opd-web-admin"
echo "  ssh -i $SSH_KEY $EC2_USER@$EC2_HOST docker logs opd-web-member"