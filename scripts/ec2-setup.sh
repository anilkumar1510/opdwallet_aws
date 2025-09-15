#!/bin/bash

# EC2 Initial Setup Script
# Run this once after creating EC2 instance

set -e

echo "========================================"
echo "OPD Wallet EC2 Setup & Configuration"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install essential packages
echo -e "${YELLOW}Installing essential packages...${NC}"
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    htop \
    ufw \
    fail2ban \
    unzip

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    rm get-docker.sh

    # Configure Docker daemon
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
    sudo systemctl restart docker
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js already installed${NC}"
fi

# Install nginx (for future SSL setup)
echo -e "${YELLOW}Installing Nginx...${NC}"
sudo apt-get install -y nginx
sudo systemctl stop nginx  # Will be managed by Docker

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Setup fail2ban for SSH protection
echo -e "${YELLOW}Configuring fail2ban...${NC}"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create project directory
echo -e "${YELLOW}Setting up project directory...${NC}"
mkdir -p /home/ubuntu/opdwallet
cd /home/ubuntu/opdwallet

# Clone repository if not exists
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Please provide your Git repository URL:${NC}"
    read -p "Git repo URL: " GIT_REPO
    git clone $GIT_REPO .
fi

# Setup environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Setting up environment variables...${NC}"
    cp .env.production .env

    # Generate secure passwords
    MONGO_PASS=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

    # Update .env
    sed -i "s|CHANGE_THIS_STRONG_PASSWORD|$MONGO_PASS|g" .env
    sed -i "s|CHANGE_THIS_TO_RANDOM_64_CHAR_STRING|$JWT_SECRET|g" .env
    sed -i "s|YOUR_EC2_PUBLIC_IP|$PUBLIC_IP|g" .env

    echo -e "${GREEN}Environment variables configured${NC}"
fi

# Create deployment key for GitHub Actions
echo -e "${YELLOW}Setting up deployment key...${NC}"
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    echo -e "${GREEN}SSH key generated${NC}"
    echo -e "${YELLOW}Add this public key to GitHub Deploy Keys:${NC}"
    cat ~/.ssh/id_rsa.pub
fi

# Setup automated backups
echo -e "${YELLOW}Setting up automated backups...${NC}"
mkdir -p /home/ubuntu/backups

# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup MongoDB
docker exec opd-mongodb mongodump --archive=/data/backup_$DATE.archive --db=opd_wallet_prod
docker cp opd-mongodb:/data/backup_$DATE.archive $BACKUP_DIR/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.archive" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -

# Setup monitoring script
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash
# Check if containers are running
if ! docker-compose -f /home/ubuntu/opdwallet/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "Services are down. Restarting..."
    cd /home/ubuntu/opdwallet
    docker-compose -f docker-compose.prod.yml up -d
fi
EOF

chmod +x /home/ubuntu/monitor.sh

# Add monitoring to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/monitor.sh") | crontab -

# Create systemd service for auto-start
sudo tee /etc/systemd/system/opdwallet.service > /dev/null <<EOF
[Unit]
Description=OPD Wallet Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/opdwallet
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=ubuntu
Group=docker

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable opdwallet.service

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Important information:"
echo "----------------------"
echo "Public IP: $PUBLIC_IP"
echo "MongoDB Password: Saved in .env"
echo "JWT Secret: Saved in .env"
echo ""
echo "Next steps:"
echo "1. Build and start services:"
echo "   cd /home/ubuntu/opdwallet"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "2. Access your application:"
echo "   Member Portal: http://$PUBLIC_IP"
echo "   Admin Portal: http://$PUBLIC_IP/admin"
echo "   API Docs: http://$PUBLIC_IP/api/docs"
echo ""
echo "3. For GitHub Actions CI/CD, add these secrets:"
echo "   - EC2_HOST: $PUBLIC_IP"
echo "   - EC2_USER: ubuntu"
echo "   - EC2_SSH_KEY: [Your private key content]"
echo ""
echo "========================================"