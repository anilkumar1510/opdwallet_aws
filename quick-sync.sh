#!/bin/bash

# =============================================
# Quick Sync Script - Push code changes to AWS
# For fast updates without full redeployment
# =============================================

AWS_IP="51.21.190.63"
KEY_PATH="~/Downloads/opdwallet-arm-key.pem"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}⚡ Quick Sync to AWS${NC}"

# Parse arguments
SERVICE=$1
if [ -z "$SERVICE" ]; then
    echo "Syncing all services..."
    SYNC_ALL=true
else
    echo "Syncing $SERVICE only..."
    SYNC_ALL=false
fi

# Function to sync a service
sync_service() {
    local service=$1
    local container=$2

    echo -e "${YELLOW}📤 Syncing $service...${NC}"

    # Use rsync for efficient sync (only changed files)
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude 'dist' \
        --exclude '.git' \
        -e "ssh -i ${KEY_PATH/#\~/$HOME} -o StrictHostKeyChecking=no" \
        $service/ ubuntu@$AWS_IP:/home/ubuntu/opdwallet/$service/

    # Restart container
    echo -e "${YELLOW}🔄 Restarting $container...${NC}"
    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP "cd /home/ubuntu/opdwallet && docker-compose restart $container"

    echo -e "${GREEN}✓ $service synced and restarted${NC}"
}

# Sync based on selection
if [ "$SYNC_ALL" = true ]; then
    sync_service "api" "api"
    sync_service "web-admin" "web-admin"
    sync_service "web-member" "web-member"
else
    case $SERVICE in
        api)
            sync_service "api" "api"
            ;;
        admin)
            sync_service "web-admin" "web-admin"
            ;;
        member)
            sync_service "web-member" "web-member"
            ;;
        *)
            echo -e "${RED}❌ Unknown service: $SERVICE${NC}"
            echo "Usage: ./quick-sync.sh [api|admin|member]"
            echo "       ./quick-sync.sh  (syncs all)"
            exit 1
            ;;
    esac
fi

echo -e "${GREEN}✅ Sync complete!${NC}"