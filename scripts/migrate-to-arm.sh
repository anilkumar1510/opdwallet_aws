#!/bin/bash

# Script to backup data from current EC2 before migrating to ARM instance

set -e

echo "🔄 EC2 ARM Migration Helper"
echo "==========================="
echo ""
echo "This script will help you migrate from x86_64 to ARM (Graviton) instance"
echo ""

EC2_HOST="13.60.210.156"
EC2_USER="ubuntu"
SSH_KEY="opdwallet-server.pem"

echo "📦 Step 1: Backup MongoDB data from current instance"
echo "----------------------------------------------"

# Create backup directory
mkdir -p backups

# Backup MongoDB data
echo "Backing up MongoDB data..."
ssh -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
  # Export MongoDB data
  docker exec opd-mongo mongodump --archive=/tmp/mongodb-backup.archive --gzip
  docker cp opd-mongo:/tmp/mongodb-backup.archive /home/ubuntu/

  # Save docker images list
  docker images --format "{{.Repository}}:{{.Tag}}" > /home/ubuntu/docker-images.txt

  # Save nginx config
  cp /home/ubuntu/nginx.conf /home/ubuntu/nginx-backup.conf 2>/dev/null || true

  echo "Backup completed on EC2"
EOF

# Download backups
echo "Downloading backups to local..."
scp -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$EC2_HOST:/home/ubuntu/mongodb-backup.archive ./backups/
scp -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$EC2_HOST:/home/ubuntu/docker-images.txt ./backups/
scp -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$EC2_HOST:/home/ubuntu/nginx-backup.conf ./backups/ 2>/dev/null || true

echo "✅ Backups saved to ./backups/"
echo ""

echo "📋 Step 2: Create new ARM EC2 instance"
echo "--------------------------------------"
echo ""
echo "Manual steps in AWS Console:"
echo ""
echo "1. Go to EC2 Console: https://eu-north-1.console.aws.amazon.com/ec2"
echo "2. Click 'Launch Instance'"
echo "3. Configuration:"
echo "   - Name: opdwallet-arm"
echo "   - AMI: Ubuntu Server 24.04 LTS (ARM)"
echo "   - Instance Type: t4g.medium (ARM-based)"
echo "   - Key Pair: Use existing 'opdwallet-server' key"
echo "   - Network: Same VPC/Subnet as current instance"
echo "   - Security Group: Use same as current (allow 22, 80, 443, 27017)"
echo "   - Storage: 30 GB gp3"
echo ""
echo "4. After launch, note the new Public IP"
echo ""
echo "Press Enter when you have the new ARM instance IP..."
read

echo ""
echo "Enter the new ARM instance IP: "
read NEW_IP

echo ""
echo "📦 Step 3: Setup new ARM instance"
echo "---------------------------------"

cat > setup-arm-instance.sh << 'SETUP'
#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Install AWS CLI
sudo apt-get install -y awscli

# Install Node.js (for local builds if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create docker network
docker network create opdwallet_opd-network

# Configure AWS CLI (you'll need to add credentials)
aws configure set region eu-north-1

echo "✅ ARM instance setup complete!"
SETUP

echo "Setting up new ARM instance..."
scp -o StrictHostKeyChecking=no -i $SSH_KEY setup-arm-instance.sh $EC2_USER@$NEW_IP:/tmp/
ssh -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$NEW_IP 'bash /tmp/setup-arm-instance.sh'

echo ""
echo "📥 Step 4: Restore data to new instance"
echo "---------------------------------------"

# Upload backups
echo "Uploading backups..."
scp -o StrictHostKeyChecking=no -i $SSH_KEY ./backups/* $EC2_USER@$NEW_IP:/home/ubuntu/

# Restore on new instance
ssh -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$NEW_IP << 'EOF'
  # Start MongoDB
  docker run -d --name opd-mongo \
    --network opdwallet_opd-network \
    -v mongo-data:/data/db \
    -p 27017:27017 \
    mongo:7.0

  # Wait for MongoDB to start
  sleep 10

  # Restore MongoDB data
  docker cp /home/ubuntu/mongodb-backup.archive opd-mongo:/tmp/
  docker exec opd-mongo mongorestore --archive=/tmp/mongodb-backup.archive --gzip

  echo "✅ MongoDB data restored"
EOF

echo ""
echo "🚀 Step 5: Build and deploy ARM-compatible images"
echo "-------------------------------------------------"
echo ""
echo "Now run these commands to build and deploy for ARM:"
echo ""
echo "1. Update your GitHub secrets:"
echo "   - EC2_HOST: $NEW_IP"
echo ""
echo "2. Build and deploy ARM images:"
echo "   ./deploy-from-local.sh"
echo ""
echo "3. Update DNS/Load Balancer to point to new IP: $NEW_IP"
echo ""
echo "✅ Migration preparation complete!"
echo ""
echo "Old instance: $EC2_HOST (x86_64)"
echo "New instance: $NEW_IP (ARM/aarch64)"