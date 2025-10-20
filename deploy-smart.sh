#!/bin/bash

# ========================================
# Smart Incremental Deployment (FIXED)
# Properly tracks changes without breaking
# ========================================

set -e

# Configuration
AWS_IP="${AWS_IP:-34.202.161.177}"
KEY_PATH="${SSH_KEY:-~/Downloads/opdwallet-arm-key.pem}"
REMOTE_DIR="/home/ubuntu/opdwallet"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Smart Incremental Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Get local commit SHA
LOCAL_SHA=$(git rev-parse HEAD)
echo -e "${BLUE}📌 Local commit: ${LOCAL_SHA:0:8}${NC}"

# Step 2: Check what's deployed on AWS
REMOTE_SHA=$(ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP \
    "cat $REMOTE_DIR/.deployed_sha 2>/dev/null || echo 'FIRST_DEPLOYMENT'")

if [ "$REMOTE_SHA" = "FIRST_DEPLOYMENT" ]; then
    echo -e "${YELLOW}⚠️  First deployment - full sync required${NC}"
    DEPLOY_TYPE="full"
else
    echo -e "${GREEN}✓ Last deployed: ${REMOTE_SHA:0:8}${NC}"

    # Check if we have this commit locally
    if git cat-file -e $REMOTE_SHA 2>/dev/null; then
        # We can do incremental!
        CHANGED=$(git diff --name-only $REMOTE_SHA $LOCAL_SHA | wc -l)
        echo -e "${GREEN}✓ Changed files: $CHANGED${NC}"

        if [ "$CHANGED" -eq 0 ]; then
            echo -e "${GREEN}✓ Already up to date!${NC}"
            exit 0
        fi

        DEPLOY_TYPE="incremental"

        # Show what changed
        echo -e "${YELLOW}📝 Changes:${NC}"
        git diff --name-only $REMOTE_SHA $LOCAL_SHA | head -10

        # Determine what to rebuild
        REBUILD=""
        if git diff --name-only $REMOTE_SHA $LOCAL_SHA | grep -q "^api/"; then
            REBUILD="$REBUILD api"
            echo -e "${YELLOW}  → API changes detected${NC}"
        fi
        if git diff --name-only $REMOTE_SHA $LOCAL_SHA | grep -q "^web-admin/"; then
            REBUILD="$REBUILD web-admin"
            echo -e "${YELLOW}  → Admin portal changes detected${NC}"
        fi
        if git diff --name-only $REMOTE_SHA $LOCAL_SHA | grep -q "^web-member/"; then
            REBUILD="$REBUILD web-member"
            echo -e "${YELLOW}  → Member portal changes detected${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot track changes (different git history)${NC}"
        echo -e "${YELLOW}   Using rsync checksum method instead${NC}"
        DEPLOY_TYPE="rsync"
    fi
fi

# Step 3: Deploy based on type
case "$DEPLOY_TYPE" in
    full)
        echo -e "${BLUE}🚀 Full deployment...${NC}"

        # Create archive of current code
        git archive -o /tmp/deployment.tar.gz HEAD

        # Upload and extract
        scp -i ${KEY_PATH/#\~/$HOME} /tmp/deployment.tar.gz ubuntu@$AWS_IP:/tmp/

        ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
            # Backup existing
            if [ -d $REMOTE_DIR ]; then
                sudo rm -rf ${REMOTE_DIR}.backup
                mv $REMOTE_DIR ${REMOTE_DIR}.backup
            fi

            # Extract new code
            mkdir -p $REMOTE_DIR
            cd $REMOTE_DIR
            tar -xzf /tmp/deployment.tar.gz
            rm /tmp/deployment.tar.gz

            # Record deployment SHA
            echo "$LOCAL_SHA" > .deployed_sha

            # Check for production compose file
            if [ -f docker-compose.aws.yml ]; then
                echo "Using production configuration"
                export COMPOSE_FILE=docker-compose.aws.yml
            elif [ -f docker-compose.prod.yml ]; then
                echo "Using docker-compose.prod.yml"
                export COMPOSE_FILE=docker-compose.prod.yml
            else
                echo "WARNING: No production compose file, using default"
                export COMPOSE_FILE=docker-compose.yml
            fi

            # Copy production env if exists
            if [ -f ~/.env.production ]; then
                cp ~/.env.production .env
            fi

            # Build and start
            docker-compose -f \$COMPOSE_FILE down 2>/dev/null || true
            docker-compose -f \$COMPOSE_FILE up -d --build

            # Show status
            docker-compose -f \$COMPOSE_FILE ps
ENDSSH

        rm /tmp/deployment.tar.gz
        ;;

    incremental)
        echo -e "${BLUE}📤 Incremental sync...${NC}"

        # Create file list of changes
        git diff --name-only $REMOTE_SHA $LOCAL_SHA > /tmp/changed_files.txt

        # Sync only changed files
        rsync -avz --files-from=/tmp/changed_files.txt \
            --exclude 'node_modules' \
            --exclude '.next' \
            --exclude 'dist' \
            -e "ssh -i ${KEY_PATH/#\~/$HOME}" \
            . ubuntu@$AWS_IP:$REMOTE_DIR/

        # Update deployed SHA
        ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP \
            "echo '$LOCAL_SHA' > $REMOTE_DIR/.deployed_sha"

        # Rebuild only what changed
        if [ ! -z "$REBUILD" ]; then
            echo -e "${BLUE}🔨 Rebuilding: $REBUILD${NC}"

            ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
                cd $REMOTE_DIR

                # Detect compose file
                if [ -f docker-compose.aws.yml ]; then
                    COMPOSE_FILE=docker-compose.aws.yml
                elif [ -f docker-compose.prod.yml ]; then
                    COMPOSE_FILE=docker-compose.prod.yml
                else
                    COMPOSE_FILE=docker-compose.yml
                fi

                # Rebuild changed services
                for service in $REBUILD; do
                    echo "Rebuilding \$service..."
                    docker-compose -f \$COMPOSE_FILE up -d --build \$service
                done

                docker-compose -f \$COMPOSE_FILE ps
ENDSSH
        fi

        rm /tmp/changed_files.txt
        ;;

    rsync)
        echo -e "${BLUE}📤 Rsync-based sync (checksum)...${NC}"

        # Use rsync with checksum to detect changes
        rsync -avz --checksum \
            --exclude 'node_modules' \
            --exclude '.next' \
            --exclude '.git' \
            --exclude 'dist' \
            -e "ssh -i ${KEY_PATH/#\~/$HOME}" \
            . ubuntu@$AWS_IP:$REMOTE_DIR/

        # Update deployed SHA
        ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP \
            "echo '$LOCAL_SHA' > $REMOTE_DIR/.deployed_sha"

        # Since we can't detect what changed, rebuild all
        echo -e "${YELLOW}⚠️  Cannot detect specific changes - rebuilding all services${NC}"

        ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
            cd $REMOTE_DIR

            # Detect compose file
            if [ -f docker-compose.aws.yml ]; then
                COMPOSE_FILE=docker-compose.aws.yml
            elif [ -f docker-compose.prod.yml ]; then
                COMPOSE_FILE=docker-compose.prod.yml
            else
                COMPOSE_FILE=docker-compose.yml
            fi

            docker-compose -f \$COMPOSE_FILE up -d --build
            docker-compose -f \$COMPOSE_FILE ps
ENDSSH
        ;;
esac

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}Access your application at:${NC}"
echo "  Admin:  http://$AWS_IP:3001"
echo "  Member: http://$AWS_IP:3002"
echo "  API:    http://$AWS_IP:4000"