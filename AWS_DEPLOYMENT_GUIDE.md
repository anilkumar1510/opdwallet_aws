# AWS Deployment Guide for OPD Wallet

## Prerequisites

1. **AWS Account** with EC2 access
2. **AWS CLI** installed locally (optional)
3. **Docker** and **Docker Compose** on your local machine
4. **Git** installed locally

## Step-by-Step Deployment Process

### Step 1: Launch EC2 Instance

1. **Login to AWS Console** → Navigate to EC2

2. **Launch Instance:**
   - **Name**: `opdwallet-server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**:
     - Development: `t2.medium` (2 vCPU, 4 GB RAM)
     - Production: `t3.large` (2 vCPU, 8 GB RAM) or higher
   - **Key Pair**: Create new or use existing (.pem file)
   - **Network Settings**:
     - Allow SSH traffic from your IP
     - Allow HTTP traffic from anywhere (0.0.0.0/0)
     - Allow HTTPS traffic from anywhere (0.0.0.0/0)
   - **Storage**: 30 GB gp3 (adjust based on needs)

3. **Configure Security Group:**
   ```
   Inbound Rules:
   - SSH (22): Your IP
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom TCP (4000): 0.0.0.0/0 (API, optional for direct access)
   ```

4. **Launch Instance** and wait for it to be running

### Step 2: Connect to EC2 Instance

```bash
# Set correct permissions for your key
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Step 3: Install Required Software on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Install Node.js (for running scripts)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
docker --version
docker-compose --version
node --version
git --version

# Logout and login again for docker group to take effect
exit
```

### Step 4: Clone and Setup Project

```bash
# Connect again
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Clone your repository (or upload via SCP)
git clone <YOUR_REPO_URL> opdwallet
cd opdwallet

# Or if uploading from local:
# On your local machine:
scp -i your-key.pem -r /path/to/opdwallet ubuntu@<EC2_PUBLIC_IP>:~/
```

### Step 5: Configure Environment Variables

```bash
cd ~/opdwallet

# Copy production environment template
cp .env.production .env

# Edit environment variables
nano .env

# Update these values:
# - MONGO_ROOT_PASSWORD: Use a strong password
# - JWT_SECRET: Generate a random 64-character string
# - PUBLIC_API_URL: http://<YOUR_EC2_PUBLIC_IP>/api
# - COOKIE_DOMAIN: Your EC2 public IP or domain
```

**Generate secure passwords:**
```bash
# Generate MongoDB password
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

### Step 6: Build and Deploy

```bash
# Build all Docker images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check if all containers are running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Initialize database with seed data (optional)
docker exec -it opd-api node scripts/seed.js
```

### Step 7: Access Your Application

Your application should now be accessible at:
- **Member Portal**: `http://<EC2_PUBLIC_IP>`
- **Admin Portal**: `http://<EC2_PUBLIC_IP>/admin`
- **API Documentation**: `http://<EC2_PUBLIC_IP>/api/docs`

**Default Test Credentials:**
- Member: `member@test.com` / `Test123!`
- Admin: `admin@test.com` / `Test123!`

### Step 8: Setup Domain (Optional)

1. **Allocate Elastic IP** in AWS Console
2. **Associate** it with your EC2 instance
3. **Configure Route 53** or your DNS provider:
   ```
   Type: A Record
   Name: opdwallet.yourdomain.com
   Value: <ELASTIC_IP>
   ```

### Step 9: Setup SSL Certificate (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d opdwallet.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Maintenance Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Database
```bash
# Create backup
docker exec opd-mongodb mongodump --archive=/data/backup.archive --db=opd_wallet_prod

# Copy to local
docker cp opd-mongodb:/data/backup.archive ./backup-$(date +%Y%m%d).archive
```

### Monitor Resources
```bash
# Check disk usage
df -h

# Check memory
free -h

# Check Docker stats
docker stats

# Check container logs size
du -sh /var/lib/docker/containers/*/*-json.log
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api

# Check port conflicts
sudo lsof -i :80
sudo lsof -i :4000
```

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker exec -it opd-mongodb mongosh --eval "db.adminCommand('ping')"

# Check connection from API
docker exec -it opd-api npm run test:db
```

### Permission Issues
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER ~/opdwallet
```

### High Memory Usage
```bash
# Limit container resources in docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
```

## Security Best Practices

1. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker-compose pull
   ```

2. **Firewall Configuration**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **Environment Variables**
   - Never commit `.env` files
   - Use AWS Secrets Manager for production
   - Rotate secrets regularly

4. **Monitoring**
   - Setup CloudWatch alarms
   - Enable VPC Flow Logs
   - Use AWS GuardDuty

5. **Backups**
   - Enable automated EBS snapshots
   - Regular MongoDB backups to S3
   - Test restore procedures

## Cost Optimization

### Estimated Monthly Costs (US East 1)
- **t2.medium** (Dev): ~$34/month
- **t3.large** (Prod): ~$60/month
- **EBS Storage** (30GB): ~$3/month
- **Data Transfer**: ~$9/GB (after 1GB free)
- **Elastic IP**: Free when attached, $3.60/month if not

### Cost Saving Tips
1. Use Reserved Instances for production (up to 72% savings)
2. Stop development instances when not in use
3. Use S3 for static assets instead of serving from EC2
4. Enable CloudFront CDN for better performance and lower costs

## Automated Deployment Script

Use the provided script for quick deployment:

```bash
# On your local machine
cd opdwallet
chmod +x scripts/deploy-aws.sh

# Run deployment
./scripts/deploy-aws.sh <EC2_PUBLIC_IP> <PATH_TO_PEM_FILE>
```

## Support & Monitoring

### Health Checks
- Application: `http://<IP>/health`
- API: `http://<IP>/api/health`

### Logs Location
- Application logs: `docker logs opd-api`
- Nginx logs: `docker logs opd-nginx`
- MongoDB logs: `docker logs opd-mongodb`

### Useful Commands Cheatsheet
```bash
# Quick status check
docker ps

# Restart everything
docker-compose -f docker-compose.prod.yml restart

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Start everything
docker-compose -f docker-compose.prod.yml up -d

# Update and restart
git pull && docker-compose -f docker-compose.prod.yml up -d --build

# Clean up Docker resources
docker system prune -a
```

## Next Steps

1. ✅ Configure domain name
2. ✅ Setup SSL certificates
3. ✅ Configure automated backups
4. ✅ Setup monitoring (CloudWatch/Datadog)
5. ✅ Implement CI/CD pipeline
6. ✅ Configure auto-scaling (if needed)
7. ✅ Setup logging aggregation
8. ✅ Implement rate limiting
9. ✅ Configure CDN for static assets
10. ✅ Regular security audits

---

**Note**: This guide assumes you're deploying to a single EC2 instance. For production high-availability setup, consider using:
- AWS ECS/EKS for container orchestration
- RDS for managed MongoDB
- ALB for load balancing
- Auto Scaling Groups
- Multi-AZ deployment