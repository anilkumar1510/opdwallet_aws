#!/bin/bash

# =============================================
# Fixed AWS Deployment Script for OPD Wallet
# Handles all configuration issues automatically
# =============================================

# Configuration
AWS_IP="34.202.161.177"
KEY_PATH="~/Downloads/opdwallet-arm-key.pem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Fixed OPD Wallet Deployment to AWS...${NC}"

# 1. Fix configurations before deployment
echo -e "${YELLOW}🔧 Fixing configurations...${NC}"

# Fix admin portal middleware (cookie name)
if grep -q "auth-token" web-admin/middleware.ts 2>/dev/null; then
    echo "  - Fixing admin portal middleware cookie name..."
    sed -i.bak "s/auth-token/opd_session/g" web-admin/middleware.ts
fi

# Ensure all next.config.js files have proper API rewrites
echo "  - Ensuring proper API rewrites in all portals..."

# Fix admin portal next.config.js
cat > web-admin/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    // In Docker, use the container name; otherwise use localhost
    const apiUrl = process.env.API_URL ?
      `${process.env.API_URL}/api/:path*` :
      'http://localhost:4001/api/:path*';
    console.log('API URL for rewrites:', apiUrl);

    return [
      {
        source: '/api/:path*',
        destination: apiUrl,
      },
    ];
  },
};

module.exports = nextConfig;
EOF

# Fix member portal next.config.js
cat > web-member/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  async rewrites() {
    // In Docker, use the container name; otherwise use localhost
    const apiUrl = process.env.API_URL ?
      `${process.env.API_URL}/api/:path*` :
      'http://localhost:4000/api/:path*';
    console.log('API URL for rewrites:', apiUrl);

    return [
      {
        source: '/api/:path*',
        destination: apiUrl,
      },
    ];
  },
};

module.exports = nextConfig;
EOF

echo -e "${GREEN}✓ Configurations fixed${NC}"

# 2. Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf deployment.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='web-doctor' \
  docker-compose.yml \
  api/ \
  web-admin/ \
  web-member/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to create deployment package${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Package created ($(du -h deployment.tar.gz | cut -f1))${NC}"

# 3. Copy to AWS
echo -e "${YELLOW}📤 Uploading to AWS...${NC}"
scp -i ${KEY_PATH/#\~/$HOME} -o StrictHostKeyChecking=no deployment.tar.gz ubuntu@$AWS_IP:/home/ubuntu/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to upload to AWS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Upload complete${NC}"

# 4. Deploy on AWS
echo -e "${YELLOW}🎯 Deploying on server...${NC}"
ssh -i ${KEY_PATH/#\~/$HOME} -o StrictHostKeyChecking=no ubuntu@$AWS_IP << ENDSSH
  set -e

  cd /home/ubuntu

  # Backup existing deployment
  if [ -d opdwallet ]; then
    echo "📂 Backing up existing deployment..."
    sudo rm -rf opdwallet-backup
    mv opdwallet opdwallet-backup
  fi

  # Create new deployment
  mkdir -p opdwallet
  cd opdwallet
  tar -xzf ../deployment.tar.gz

  # Ensure docker-compose.yml has correct API_URL (without /api suffix)
  echo "🔧 Verifying docker-compose.yml configuration..."

  # Update API_URL in docker-compose.yml to not include /api
  sed -i 's|API_URL: http://opd-api-dev:4000/api|API_URL: http://opd-api-dev:4000|g' docker-compose.yml

  # Stop existing containers
  docker-compose down 2>/dev/null || true

  # Start services (will rebuild if needed)
  echo "🚀 Starting services..."
  docker-compose up -d

  # Wait for services to be ready
  echo "⏳ Waiting for services to start..."
  sleep 15

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
    echo "Test login credentials:"
    echo "  Admin: admin@opdwallet.com / Admin@123"
    echo "  Member: user@gmail.com / User@1234"
    echo ""
    echo "To check logs:"
    echo "  ssh -i $KEY_PATH ubuntu@$AWS_IP 'cd opdwallet && docker-compose logs'"
else
    echo -e "${RED}❌ Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi