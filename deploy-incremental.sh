#!/bin/bash

# ========================================
# Incremental Deployment Script
# Deploys only changed files to AWS
# ========================================

set -e

# Configuration
AWS_IP="${AWS_IP:-51.21.190.63}"
KEY_PATH="${SSH_KEY:-~/Downloads/opdwallet-arm-key.pem}"
DEPLOY_MODE="${1:-incremental}"  # incremental|full|build

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get current git branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}📌 Current branch: $CURRENT_BRANCH${NC}"

# Function to get changed files
get_changed_files() {
    # Get the last deployed commit from AWS
    LAST_DEPLOYED=$(ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP \
        "cd /home/ubuntu/opdwallet 2>/dev/null && git rev-parse HEAD 2>/dev/null || echo 'NONE'")

    if [ "$LAST_DEPLOYED" = "NONE" ]; then
        echo -e "${YELLOW}⚠️  No previous deployment found. Full deployment required.${NC}"
        DEPLOY_MODE="full"
        return
    fi

    echo -e "${GREEN}✓ Last deployed commit: ${LAST_DEPLOYED:0:8}${NC}"

    # Get list of changed files
    CHANGED_FILES=$(git diff --name-only $LAST_DEPLOYED HEAD 2>/dev/null || echo "")

    if [ -z "$CHANGED_FILES" ]; then
        echo -e "${GREEN}✓ No files changed since last deployment${NC}"
        exit 0
    fi

    echo -e "${YELLOW}📝 Changed files:${NC}"
    echo "$CHANGED_FILES" | head -20

    # Analyze what needs rebuilding
    if echo "$CHANGED_FILES" | grep -q "^api/"; then
        REBUILD_API=true
        echo -e "${YELLOW}  → API changes detected${NC}"
    fi
    if echo "$CHANGED_FILES" | grep -q "^web-admin/"; then
        REBUILD_ADMIN=true
        echo -e "${YELLOW}  → Admin portal changes detected${NC}"
    fi
    if echo "$CHANGED_FILES" | grep -q "^web-member/"; then
        REBUILD_MEMBER=true
        echo -e "${YELLOW}  → Member portal changes detected${NC}"
    fi
}

# Function to sync only changed files
sync_changed_files() {
    echo -e "${BLUE}📤 Syncing changed files...${NC}"

    # Create a list of changed files
    git diff --name-only $LAST_DEPLOYED HEAD > /tmp/changed_files.txt

    # Use rsync to sync only changed files
    rsync -avz --files-from=/tmp/changed_files.txt \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude 'dist' \
        -e "ssh -i ${KEY_PATH/#\~/$HOME}" \
        . ubuntu@$AWS_IP:/home/ubuntu/opdwallet/

    # Update git reference on server
    CURRENT_COMMIT=$(git rev-parse HEAD)
    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP \
        "cd /home/ubuntu/opdwallet && echo $CURRENT_COMMIT > .last_deployed_commit"

    rm /tmp/changed_files.txt
    echo -e "${GREEN}✓ Files synced${NC}"
}

# Function to rebuild and restart services
rebuild_services() {
    echo -e "${BLUE}🔨 Rebuilding changed services on AWS...${NC}"

    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
        cd /home/ubuntu/opdwallet

        # Export environment for production
        export AWS_PUBLIC_IP=$AWS_IP

        # Copy production env file if exists
        if [ -f .env.production ]; then
            cp .env.production .env
        fi

        # Rebuild only changed services
        if [ "${REBUILD_API:-false}" = "true" ]; then
            echo "🔨 Rebuilding API..."
            docker-compose -f docker-compose.aws.yml build api
            docker-compose -f docker-compose.aws.yml up -d api
        fi

        if [ "${REBUILD_ADMIN:-false}" = "true" ]; then
            echo "🔨 Rebuilding Admin Portal..."
            docker-compose -f docker-compose.aws.yml build web-admin
            docker-compose -f docker-compose.aws.yml up -d web-admin
        fi

        if [ "${REBUILD_MEMBER:-false}" = "true" ]; then
            echo "🔨 Rebuilding Member Portal..."
            docker-compose -f docker-compose.aws.yml build web-member
            docker-compose -f docker-compose.aws.yml up -d web-member
        fi

        # Show status
        docker-compose -f docker-compose.aws.yml ps
ENDSSH
}

# Function for full deployment
full_deployment() {
    echo -e "${BLUE}🚀 Starting full deployment...${NC}"

    # Create deployment package
    echo -e "${YELLOW}📦 Creating deployment package...${NC}"
    git archive -o deployment.tar.gz HEAD

    # Upload to AWS
    echo -e "${YELLOW}📤 Uploading to AWS...${NC}"
    scp -i ${KEY_PATH/#\~/$HOME} deployment.tar.gz ubuntu@$AWS_IP:/tmp/

    # Deploy on AWS
    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
        # Backup existing deployment
        if [ -d /home/ubuntu/opdwallet ]; then
            sudo rm -rf /home/ubuntu/opdwallet-backup
            mv /home/ubuntu/opdwallet /home/ubuntu/opdwallet-backup
        fi

        # Extract new deployment
        mkdir -p /home/ubuntu/opdwallet
        cd /home/ubuntu/opdwallet
        tar -xzf /tmp/deployment.tar.gz
        rm /tmp/deployment.tar.gz

        # Initialize git for tracking
        git init
        git add -A
        git commit -m "Deployment $(date +%Y%m%d_%H%M%S)"

        # Copy production env if exists
        if [ -f /home/ubuntu/.env.production ]; then
            cp /home/ubuntu/.env.production .env.production
        fi

        # Build and start all services
        export AWS_PUBLIC_IP=$AWS_IP
        docker-compose -f docker-compose.aws.yml build
        docker-compose -f docker-compose.aws.yml up -d

        # Wait for services
        sleep 10
        docker-compose -f docker-compose.aws.yml ps
ENDSSH

    # Clean up
    rm deployment.tar.gz
}

# Main execution
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   OPD Wallet Incremental Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

case "$DEPLOY_MODE" in
    incremental)
        get_changed_files
        if [ "$DEPLOY_MODE" != "full" ]; then
            sync_changed_files
            rebuild_services
        else
            full_deployment
        fi
        ;;
    full)
        full_deployment
        ;;
    build)
        # Only rebuild without syncing files
        REBUILD_API=true
        REBUILD_ADMIN=true
        REBUILD_MEMBER=true
        rebuild_services
        ;;
    *)
        echo -e "${RED}❌ Unknown deploy mode: $DEPLOY_MODE${NC}"
        echo "Usage: ./deploy-incremental.sh [incremental|full|build]"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}Access your application at:${NC}"
echo "  Admin:  http://$AWS_IP:3001"
echo "  Member: http://$AWS_IP:3002"
echo "  API:    http://$AWS_IP:4000"