#!/bin/bash

# OPD Wallet Code Quality Scanner
# This script helps you run SonarQube analysis on your projects

set -e

echo "🔍 OPD Wallet Code Quality Scanner"
echo "===================================="
echo ""

# Check if SonarQube is running
if ! docker ps | grep -q opdwallet-sonarqube; then
    echo "⚠️  SonarQube is not running!"
    echo "Starting SonarQube..."
    docker-compose -f docker-compose.sonarqube.yml up -d
    echo "⏳ Waiting for SonarQube to start (this may take 1-2 minutes)..."
    sleep 60
fi

echo "✅ SonarQube is running at http://localhost:9000"
echo ""
echo "📋 Available options:"
echo "  1. Run ESLint + TypeScript checks (Quick)"
echo "  2. Run full SonarQube analysis (Requires setup)"
echo "  3. View SonarQube logs"
echo "  4. Stop SonarQube"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔍 Running quick quality checks..."
        echo ""

        echo "📦 Checking API..."
        cd api && npm run quality
        cd ..

        echo ""
        echo "📦 Checking Member Portal..."
        cd web-member && npm run quality
        cd ..

        echo ""
        echo "📦 Checking Admin Portal..."
        cd web-admin && npm run quality
        cd ..

        echo ""
        echo "✅ All checks complete!"
        ;;
    2)
        echo ""
        echo "📊 For full SonarQube analysis:"
        echo "1. Open http://localhost:9000"
        echo "2. Login with admin/admin (change password on first login)"
        echo "3. Create projects with these keys:"
        echo "   - opdwallet-api"
        echo "   - opdwallet-web-member"
        echo "   - opdwallet-web-admin"
        echo "4. Generate tokens for each project"
        echo "5. Run the scan commands from CODE_QUALITY_GUIDE.md"
        echo ""
        echo "See CODE_QUALITY_GUIDE.md for detailed instructions."
        ;;
    3)
        echo ""
        docker logs opdwallet-sonarqube --tail 100
        ;;
    4)
        echo ""
        echo "🛑 Stopping SonarQube..."
        docker-compose -f docker-compose.sonarqube.yml down
        echo "✅ SonarQube stopped"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
