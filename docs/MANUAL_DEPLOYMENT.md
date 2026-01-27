# Manual Deployment Instructions

## Prerequisites
1. SSH access to your AWS EC2 instance
2. Docker and Docker Compose installed on the server
3. Git installed on the server

## Step-by-Step Deployment Process

### 1. SSH to Your Server
```bash
ssh -i opdwallet-server.pem ubuntu@51.20.125.246
```

If the IP has changed, get the new IP from AWS Console.

### 2. Navigate to Project Directory
```bash
cd ~/opdwallet_aws
```

If the directory doesn't exist, clone it:
```bash
git clone https://github.com/your-org/opdwallet.git opdwallet_aws
cd opdwallet_aws
```

### 3. Pull Latest Code
```bash
git pull origin main
```

### 4. Create Environment File (if needed)
```bash
cat > .env.production << 'EOF'
NODE_ENV=production
MONGO_DATABASE=opd_wallet
JWT_SECRET=your-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
COOKIE_NAME=opd_session
COOKIE_SECURE=false
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax
COOKIE_MAX_AGE=604800000
PUBLIC_API_URL=http://YOUR_SERVER_IP/api
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP/api
EOF
```

Replace `YOUR_SERVER_IP` with your actual server IP.

### 5. Stop Existing Containers
```bash
docker-compose -f docker-compose.prod.yml down
```

### 6. Clean Docker System (Optional but recommended)
```bash
docker system prune -af
```

### 7. Build and Start All Services
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

This will:
- Build all Docker images
- Start all containers in background
- May take 10-15 minutes on first run

### 8. Monitor the Build Progress
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

Press Ctrl+C to exit log viewing.

### 9. Verify All Containers Are Running
```bash
docker ps
```

You should see 10 containers running:
- opd-nginx-dev (Port 80) - Reverse proxy
- opd-api-dev (Port 4000) - Backend API
- opd-web-member-dev (Port 3002) - Member Portal
- opd-web-admin-dev (Port 3001) - Admin Portal
- opd-web-doctor-dev (Port 3003) - Doctor Portal
- opd-web-tpa-dev (Port 3004) - TPA Portal
- opd-web-operations-dev (Port 3005) - Operations Portal
- opd-web-finance-dev (Port 3006) - Finance Portal
- opd-mongo-dev (Port 27017) - MongoDB database
- opd-redis-dev (Port 6380) - Redis cache

### 10. Test the Application
Open in browser (via Nginx):
- Member Portal: http://YOUR_SERVER_IP/
- Admin Portal: http://YOUR_SERVER_IP/admin
- Doctor Portal: http://YOUR_SERVER_IP/doctor
- TPA Portal: http://YOUR_SERVER_IP/tpa
- Operations Portal: http://YOUR_SERVER_IP/operations
- Finance Portal: http://YOUR_SERVER_IP/finance
- API Health Check: http://YOUR_SERVER_IP/api/health

Or access directly via ports:
- Member: http://YOUR_SERVER_IP:3002
- Admin: http://YOUR_SERVER_IP:3001/admin
- Doctor: http://YOUR_SERVER_IP:3003/doctor
- TPA: http://YOUR_SERVER_IP:3004/tpa
- Operations: http://YOUR_SERVER_IP:3005/operations
- Finance: http://YOUR_SERVER_IP:3006/finance

Test credentials:
- Admin: admin@opdwallet.com / Admin@123
- Member: john.doe@company.com / Member@123
- Doctor: doctor@example.com / Doctor@123

## Troubleshooting

### If build fails with memory error:
Build services one by one:
```bash
docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml build web-admin
docker-compose -f docker-compose.prod.yml build web-member
docker-compose -f docker-compose.prod.yml up -d
```

### If containers keep restarting:
Check logs:
```bash
docker logs opd-api
docker logs opd-web-member
docker logs opd-web-admin
```

### If website shows 502 Bad Gateway:
1. Wait 2-3 minutes for services to start
2. Check if all containers are running: `docker ps`
3. Restart nginx: `docker restart opd-nginx`

### To completely reset:
```bash
docker-compose -f docker-compose.prod.yml down -v
docker system prune -af
# Then rebuild from step 7
```

## Quick Deployment Script
You can also use the provided script:
```bash
cd ~/opdwallet_aws
./deploy-on-aws.sh
```

Note: Make sure the script has execute permissions:
```bash
chmod +x deploy-on-aws.sh
```