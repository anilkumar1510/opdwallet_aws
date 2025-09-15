#!/bin/bash

# Server Health Check Script
# Usage: ./check-server.sh <EC2_IP> <PEM_FILE>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <EC2_IP> <PEM_FILE>"
    exit 1
fi

EC2_IP=$1
PEM_FILE=$2

echo "======================================"
echo "OPD Wallet Server Health Check"
echo "======================================"
echo "Server: $EC2_IP"
echo ""

# Check if server is reachable
echo "1. Checking server connectivity..."
if ping -c 1 $EC2_IP &> /dev/null; then
    echo "   ✅ Server is reachable"
else
    echo "   ❌ Server is not reachable"
    exit 1
fi

# Check SSH access
echo "2. Checking SSH access..."
if ssh -i $PEM_FILE -o ConnectTimeout=5 ubuntu@$EC2_IP "echo 'SSH OK'" &> /dev/null; then
    echo "   ✅ SSH access successful"
else
    echo "   ❌ SSH access failed"
    exit 1
fi

# Check services
echo "3. Checking Docker services..."
ssh -i $PEM_FILE ubuntu@$EC2_IP << 'EOF'
    cd /home/ubuntu/opdwallet 2>/dev/null || { echo "   ❌ Project directory not found"; exit 1; }

    # Check Docker
    if command -v docker &> /dev/null; then
        echo "   ✅ Docker installed"
    else
        echo "   ❌ Docker not installed"
    fi

    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        echo "   ✅ Docker Compose installed"
    else
        echo "   ❌ Docker Compose not installed"
    fi

    # Check running containers
    echo ""
    echo "4. Container Status:"
    docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo "   ⚠️  Containers not running"

    # Check disk space
    echo ""
    echo "5. Disk Usage:"
    df -h | grep -E "^/dev/" | awk '{print "   "$1" - Used: "$3"/"$2" ("$5")"}'

    # Check memory
    echo ""
    echo "6. Memory Usage:"
    free -h | grep Mem | awk '{print "   Total: "$2" | Used: "$3" | Free: "$4}'

    # Check CPU
    echo ""
    echo "7. CPU Load:"
    uptime | awk -F'load average:' '{print "   Load Average:"$2}'

    # Check application endpoints
    echo ""
    echo "8. Application Endpoints:"
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

    # Check nginx/web server
    if curl -s -o /dev/null -w "%{http_code}" http://localhost > /dev/null 2>&1; then
        echo "   ✅ Web server responding"
    else
        echo "   ❌ Web server not responding"
    fi

    # Check API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health > /dev/null 2>&1; then
        echo "   ✅ API server healthy"
    else
        echo "   ❌ API server not responding"
    fi

    # Check MongoDB
    if docker exec opd-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "   ✅ MongoDB connected"
    else
        echo "   ❌ MongoDB not responding"
    fi

    # Recent logs
    echo ""
    echo "9. Recent Error Logs (last 10 lines):"
    docker-compose -f docker-compose.prod.yml logs --tail=10 2>&1 | grep -i error || echo "   No recent errors"

    echo ""
    echo "10. Access URLs:"
    echo "   Member Portal: http://$PUBLIC_IP"
    echo "   Admin Portal: http://$PUBLIC_IP/admin"
    echo "   API Docs: http://$PUBLIC_IP/api/docs"
EOF

echo ""
echo "======================================"
echo "Health check complete!"
echo "======================================