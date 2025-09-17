#!/bin/bash

# Debug script for production Next.js static file serving issues
EC2_IP="51.20.125.246"
PEM_FILE="/Users/turbo/Projects/opdwallet/opdwallet-server.pem"

echo "🔍 Debugging Production Static File Issues on AWS EC2"
echo "======================================================"

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo "❌ Error: PEM file not found at $PEM_FILE"
    exit 1
fi

# Set correct permissions
chmod 400 "$PEM_FILE"

echo "📡 Connecting to EC2 server at $EC2_IP..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ubuntu@$EC2_IP << 'ENDSSH'
    echo "✅ Connected to EC2"
    echo ""

    echo "1️⃣ Checking if latest code is deployed..."
    echo "============================================"
    cd ~/opdwallet
    git log --oneline -n 5
    echo ""

    echo "2️⃣ Checking Docker container status..."
    echo "========================================"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""

    echo "3️⃣ Checking web-member container logs..."
    echo "=========================================="
    docker logs opd-web-member --tail 20 2>&1
    echo ""

    echo "4️⃣ Checking if standalone build exists in container..."
    echo "========================================================"
    docker exec opd-web-member ls -la / 2>&1 | head -20
    echo ""

    echo "5️⃣ Checking .next directory structure..."
    echo "=========================================="
    docker exec opd-web-member ls -la .next/ 2>&1 || echo "No .next directory found"
    echo ""

    echo "6️⃣ Checking if server.js exists..."
    echo "====================================="
    docker exec opd-web-member ls -la server.js 2>&1 || echo "No server.js found"
    echo ""

    echo "7️⃣ Checking what's actually running in container..."
    echo "===================================================="
    docker exec opd-web-member ps aux 2>&1 | grep -E "node|npm"
    echo ""

    echo "8️⃣ Checking nginx logs for routing issues..."
    echo "=============================================="
    docker logs opd-nginx --tail 30 2>&1 | grep -E "_next|404|error"
    echo ""

    echo "9️⃣ Testing direct container access..."
    echo "======================================="
    echo "Testing member portal directly:"
    docker exec opd-web-member curl -I http://localhost:3002/ 2>&1 | head -10
    echo ""
    echo "Testing static file directly:"
    docker exec opd-web-member curl -I http://localhost:3002/_next/static/ 2>&1 | head -10
    echo ""

    echo "🔟 Checking Next.js config in container..."
    echo "==========================================="
    docker exec opd-web-member cat next.config.js 2>&1 || echo "No next.config.js found"
    echo ""

    echo "1️⃣1️⃣ Checking environment variables..."
    echo "========================================="
    docker exec opd-web-member env | grep -E "PORT|NODE|HOSTNAME" | sort
    echo ""

    echo "1️⃣2️⃣ Checking if build happened with standalone mode..."
    echo "========================================================="
    docker exec opd-web-member ls -la .next/standalone/ 2>&1 || echo "No standalone directory"
    echo ""

    echo "1️⃣3️⃣ Checking actual process running..."
    echo "========================================="
    docker exec opd-web-member sh -c "ps -ef | grep -v grep | grep -E 'node|npm'" 2>&1
    echo ""

    echo "1️⃣4️⃣ Checking if static files exist in container..."
    echo "====================================================="
    docker exec opd-web-member find . -name "*.css" -path "*/_next/static/*" 2>/dev/null | head -5 || echo "No CSS files found"
    echo ""

    echo "1️⃣5️⃣ Checking Dockerfile.prod contents..."
    echo "==========================================="
    cat ~/opdwallet/web-member/Dockerfile.prod | grep -A5 -B5 "CMD\|server.js\|npm start" 2>&1
    echo ""

    echo "✅ Debug information collected!"
ENDSSH

echo ""
echo "======================================================"
echo "🎯 Debug script completed!"
echo "======================================================"