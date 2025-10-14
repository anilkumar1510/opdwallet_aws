#!/bin/bash

# ================================================
# Production Deployment - Fixed Version
# ================================================

set -e

AWS_IP="51.21.190.63"
KEY_PATH="~/Downloads/opdwallet-arm-key.pem"

echo "🚀 Production Deployment (Fixed)"

# Upload files without node_modules
echo "📤 Creating and uploading clean deployment..."

# Use rsync to exclude node_modules
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude 'web-doctor' \
  --exclude 'docker-compose.yml' \
  --exclude 'docker-compose.local.yml' \
  -e "ssh -i ${KEY_PATH/#\~/$HOME}" \
  . ubuntu@$AWS_IP:/home/ubuntu/opdwallet-clean/

# Upload env file
scp -i ${KEY_PATH/#\~/$HOME} .env.production ubuntu@$AWS_IP:/home/ubuntu/.env.production

# Deploy on AWS
ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << 'ENDSSH'
set -e

cd /home/ubuntu

# Stop any existing
docker-compose -f opdwallet/docker-compose.production.yml down 2>/dev/null || true
docker-compose -f opdwallet/docker-compose.yml down 2>/dev/null || true

# Clean up and move new deployment
sudo rm -rf opdwallet
mv opdwallet-clean opdwallet
cd opdwallet

# Copy env file
cp /home/ubuntu/.env.production .env.production

# Use simple docker-compose for now (avoid build issues)
echo "📝 Creating development mode compose file..."
cat > docker-compose.yml << 'EOF'
services:
  mongo:
    image: mongo:7.0
    container_name: opd-mongo-prod
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: opd_wallet
    volumes:
      - mongo-data:/data/db
    networks:
      - opd-network

  api:
    image: node:20-alpine
    container_name: opd-api-prod
    restart: always
    working_dir: /app
    ports:
      - "4000:4000"
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin
      PORT: 4000
    depends_on:
      - mongo
    volumes:
      - ./api:/app
    networks:
      - opd-network
    command: sh -c "npm install && npm run build && npm run start:prod"

  web-admin:
    image: node:20-alpine
    container_name: opd-web-admin-prod
    restart: always
    working_dir: /app
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://51.21.190.63:4000/api
      API_URL: http://api:4000
      NODE_ENV: production
    depends_on:
      - api
    volumes:
      - ./web-admin:/app
    networks:
      - opd-network
    command: sh -c "npm install && npm run build && npm run start"

  web-member:
    image: node:20-alpine
    container_name: opd-web-member-prod
    restart: always
    working_dir: /app
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://51.21.190.63:4000/api
      API_URL: http://api:4000
      NODE_ENV: production
    depends_on:
      - api
    volumes:
      - ./web-member:/app
    networks:
      - opd-network
    command: sh -c "npm install && npm run build && npm run start"

volumes:
  mongo-data:

networks:
  opd-network:
    driver: bridge
EOF

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait
sleep 20

# Check status
docker-compose ps

echo "✅ Deployment complete!"

# Create tracking
cat > .deployment-tracking.json << EOF
{
    "sha": "$(git rev-parse HEAD 2>/dev/null || echo 'manual')",
    "timestamp": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
    "mode": "production-hybrid"
}
EOF
ENDSSH

echo "✅ Production deployment complete!"
echo "Access at:"
echo "  Admin:  http://$AWS_IP:3001"
echo "  Member: http://$AWS_IP:3002"
echo "  API:    http://$AWS_IP:4000"