#!/bin/bash

# AWS EC2 Deployment Script for OPD Wallet
# This script helps deploy the application to an AWS EC2 instance

set -e

echo "========================================="
echo "OPD Wallet AWS Deployment Script"
echo "========================================="

# Configuration
EC2_USER="ubuntu"
EC2_HOST=""
KEY_PATH=""
PROJECT_NAME="opdwallet"
REMOTE_PATH="/home/ubuntu/${PROJECT_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if EC2_HOST is provided
if [ -z "$1" ]; then
    print_error "Please provide EC2 public IP or hostname"
    echo "Usage: ./deploy-aws.sh <EC2_PUBLIC_IP> <PATH_TO_PEM_FILE>"
    exit 1
fi

if [ -z "$2" ]; then
    print_error "Please provide path to your .pem file"
    echo "Usage: ./deploy-aws.sh <EC2_PUBLIC_IP> <PATH_TO_PEM_FILE>"
    exit 1
fi

EC2_HOST=$1
KEY_PATH=$2

# Verify PEM file exists
if [ ! -f "$KEY_PATH" ]; then
    print_error "PEM file not found at: $KEY_PATH"
    exit 1
fi

print_status "Starting deployment to EC2: $EC2_HOST"

# Step 1: Create deployment package
print_status "Creating deployment package..."
rm -rf deploy-package
mkdir -p deploy-package

# Copy necessary files
cp -r api deploy-package/
cp -r web-admin deploy-package/
cp -r web-member deploy-package/
cp -r nginx deploy-package/
cp docker-compose.prod.yml deploy-package/
cp .env.production deploy-package/.env
cp Makefile deploy-package/

# Create setup script for EC2
cat > deploy-package/setup-ec2.sh << 'EOF'
#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js (for initial setup)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Setup complete!"
EOF

chmod +x deploy-package/setup-ec2.sh

# Create deployment tarball
print_status "Creating deployment archive..."
tar -czf opdwallet-deploy.tar.gz -C deploy-package .

# Step 2: Upload to EC2
print_status "Uploading to EC2 instance..."
scp -i "$KEY_PATH" opdwallet-deploy.tar.gz "$EC2_USER@$EC2_HOST:~/"

# Step 3: Deploy on EC2
print_status "Deploying on EC2..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << ENDSSH
    # Create project directory
    mkdir -p $REMOTE_PATH

    # Extract deployment package
    tar -xzf ~/opdwallet-deploy.tar.gz -C $REMOTE_PATH

    # Run setup script
    cd $REMOTE_PATH
    chmod +x setup-ec2.sh
    ./setup-ec2.sh

    # Update .env with EC2 public IP
    PUBLIC_IP=\$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    sed -i "s|YOUR_EC2_PUBLIC_IP|\$PUBLIC_IP|g" .env

    # Build and start containers
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d

    # Check container status
    docker-compose -f docker-compose.prod.yml ps

    # Verify critical services
    echo "Verifying services..."
    docker exec opd-redis-prod redis-cli --raw incr ping >/dev/null 2>&1 && echo "✅ Redis: Running" || echo "⚠️ Redis: Check required"
    docker exec opd-mongodb-prod mongosh --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1 && echo "✅ MongoDB: Running" || echo "⚠️ MongoDB: Check required"

    echo "Deployment complete!"
    echo "Access your application at:"
    echo "Member Portal: http://\$PUBLIC_IP"
    echo "Admin Portal: http://\$PUBLIC_IP/admin"
    echo "API: http://\$PUBLIC_IP/api"
ENDSSH

# Cleanup
print_status "Cleaning up local files..."
rm -rf deploy-package
rm -f opdwallet-deploy.tar.gz

print_status "Deployment complete!"
echo ""
echo "========================================="
echo "Your application should now be accessible at:"
echo "Member Portal: http://$EC2_HOST"
echo "Admin Portal: http://$EC2_HOST/admin"
echo "API: http://$EC2_HOST/api/docs"
echo "========================================="
echo ""
print_warning "Important: Update your security group to allow inbound traffic on port 80"
print_warning "Remember to configure SSL certificates for production use"