#!/bin/bash

# ================================================
# OPD Wallet Deployment v2.0
# Complete rewrite with proper incremental tracking
# ================================================

set -e

# Configuration
AWS_IP="${AWS_IP:-34.202.161.177}"
KEY_PATH="${SSH_KEY:-~/Downloads/opdwallet-arm-key.pem}"
REMOTE_DIR="/home/ubuntu/opdwallet"
TRACKING_FILE=".deployment-tracking.json"
MODE="${1:-auto}"  # auto|full|incremental|status

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Start time
START_TIME=$(date +%s)

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}    OPD Wallet Deployment v2.0${NC}"
echo -e "${CYAN}================================================${NC}"

# Function: Check local state
check_local_state() {
    echo -e "\n${BLUE}📋 Local Environment Check${NC}"
    echo -e "├─ Branch: $(git rev-parse --abbrev-ref HEAD)"
    echo -e "├─ Commit: $(git rev-parse --short HEAD)"
    echo -e "├─ Modified files: $(git status --porcelain | wc -l)"

    # Check for uncommitted changes
    if [ $(git status --porcelain | wc -l) -gt 0 ]; then
        echo -e "└─ ${YELLOW}⚠️  Warning: Uncommitted changes detected${NC}"
        git status --short | head -5
    else
        echo -e "└─ ${GREEN}✓ Working directory clean${NC}"
    fi
}

# Function: Check remote state
check_remote_state() {
    echo -e "\n${BLUE}🌐 Remote Environment Check${NC}"

    REMOTE_INFO=$(ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << 'ENDSSH' 2>/dev/null || echo "ERROR"
        if [ -f /home/ubuntu/opdwallet/.deployment-tracking.json ]; then
            cat /home/ubuntu/opdwallet/.deployment-tracking.json 2>/dev/null || echo "{}"
        else
            echo '{"status":"not_tracked"}'
        fi
ENDSSH
)

    if [ "$REMOTE_INFO" = "ERROR" ]; then
        echo -e "└─ ${RED}❌ Cannot connect to AWS${NC}"
        exit 1
    elif echo "$REMOTE_INFO" | grep -q "not_tracked"; then
        echo -e "├─ Status: ${YELLOW}No tracking data found${NC}"
        echo -e "└─ Action: ${YELLOW}Full deployment required${NC}"
        return 1
    else
        REMOTE_SHA=$(echo "$REMOTE_INFO" | grep -o '"sha":"[^"]*"' | cut -d'"' -f4)
        REMOTE_TIME=$(echo "$REMOTE_INFO" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
        REMOTE_MODE=$(echo "$REMOTE_INFO" | grep -o '"mode":"[^"]*"' | cut -d'"' -f4)

        echo -e "├─ Last deployed: ${GREEN}${REMOTE_SHA:-unknown}${NC}"
        echo -e "├─ Deploy time: ${REMOTE_TIME:-unknown}"
        echo -e "└─ Deploy mode: ${REMOTE_MODE:-unknown}"

        # Store for later use
        export LAST_DEPLOYED_SHA="$REMOTE_SHA"
        return 0
    fi
}

# Function: Analyze changes
analyze_changes() {
    if [ -z "$LAST_DEPLOYED_SHA" ]; then
        echo -e "\n${YELLOW}📊 Change Analysis: First deployment${NC}"
        export DEPLOY_MODE="full"
        return
    fi

    # Check if we have this SHA locally
    if ! git rev-list --quiet "$LAST_DEPLOYED_SHA" 2>/dev/null; then
        echo -e "\n${YELLOW}📊 Change Analysis: Cannot track (different history)${NC}"
        echo -e "└─ Will use checksum-based sync"
        export DEPLOY_MODE="checksum"
        return
    fi

    echo -e "\n${BLUE}📊 Change Analysis${NC}"

    # Get changed files
    CHANGED_FILES=$(git diff --name-only "$LAST_DEPLOYED_SHA" HEAD 2>/dev/null || echo "")
    CHANGE_COUNT=$(echo "$CHANGED_FILES" | grep -v "^$" | wc -l)

    if [ "$CHANGE_COUNT" -eq 0 ]; then
        echo -e "└─ ${GREEN}✓ No changes since last deployment${NC}"
        export DEPLOY_MODE="none"
        return
    fi

    echo -e "├─ Changed files: ${YELLOW}$CHANGE_COUNT${NC}"

    # Analyze what services need rebuilding
    export REBUILD_API=false
    export REBUILD_ADMIN=false
    export REBUILD_MEMBER=false

    if echo "$CHANGED_FILES" | grep -q "^api/"; then
        REBUILD_API=true
        echo -e "├─ ${YELLOW}→ API changes detected${NC}"
    fi
    if echo "$CHANGED_FILES" | grep -q "^web-admin/"; then
        REBUILD_ADMIN=true
        echo -e "├─ ${YELLOW}→ Admin portal changes detected${NC}"
    fi
    if echo "$CHANGED_FILES" | grep -q "^web-member/"; then
        REBUILD_MEMBER=true
        echo -e "├─ ${YELLOW}→ Member portal changes detected${NC}"
    fi

    # Show sample of changes
    echo -e "└─ Sample changes:"
    echo "$CHANGED_FILES" | head -3 | sed 's/^/     /'

    export DEPLOY_MODE="incremental"
    export CHANGED_FILES
}

# Function: Full deployment
deploy_full() {
    echo -e "\n${BLUE}🚀 Executing Full Deployment${NC}"

    # Create deployment package
    echo -e "├─ Creating deployment archive..."
    git archive --format=tar.gz --output=/tmp/deployment.tar.gz HEAD

    ARCHIVE_SIZE=$(du -h /tmp/deployment.tar.gz | cut -f1)
    echo -e "├─ Archive size: ${ARCHIVE_SIZE}"

    # Upload to AWS
    echo -e "├─ Uploading to AWS..."
    scp -i ${KEY_PATH/#\~/$HOME} -q /tmp/deployment.tar.gz ubuntu@$AWS_IP:/tmp/

    # Deploy on AWS
    echo -e "└─ Deploying on server..."

    LOCAL_SHA=$(git rev-parse HEAD)
    LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
        # Backup existing deployment
        if [ -d $REMOTE_DIR ]; then
            echo "   ├─ Backing up existing deployment..."
            sudo rm -rf ${REMOTE_DIR}.backup
            mv $REMOTE_DIR ${REMOTE_DIR}.backup
        fi

        # Extract new deployment
        echo "   ├─ Extracting new code..."
        mkdir -p $REMOTE_DIR
        cd $REMOTE_DIR
        tar -xzf /tmp/deployment.tar.gz
        rm /tmp/deployment.tar.gz

        # Create tracking file
        cat > $TRACKING_FILE << EOF
{
    "sha": "$LOCAL_SHA",
    "branch": "$LOCAL_BRANCH",
    "timestamp": "$TIMESTAMP",
    "mode": "full",
    "services": ["api", "web-admin", "web-member"]
}
EOF

        # Detect and use appropriate compose file
        if [ -f docker-compose.aws.yml ]; then
            COMPOSE_FILE="docker-compose.aws.yml"
            echo "   ├─ Using docker-compose.aws.yml"
        elif [ -f docker-compose.prod.yml ]; then
            COMPOSE_FILE="docker-compose.prod.yml"
            echo "   ├─ Using docker-compose.prod.yml"
        else
            COMPOSE_FILE="docker-compose.yml"
            echo "   ├─ Using docker-compose.yml (default)"
        fi

        # Stop existing containers
        docker-compose -f \$COMPOSE_FILE down 2>/dev/null || true

        # Start new containers
        echo "   ├─ Starting services..."
        docker-compose -f \$COMPOSE_FILE up -d --build

        # Wait for services
        sleep 5

        echo "   └─ Services status:"
        docker-compose -f \$COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}"
ENDSSH

    rm /tmp/deployment.tar.gz
}

# Function: Incremental deployment
deploy_incremental() {
    echo -e "\n${BLUE}📤 Executing Incremental Deployment${NC}"
    echo -e "├─ Changes to sync: $(echo "$CHANGED_FILES" | wc -l) files"

    # Create list of changed files
    echo "$CHANGED_FILES" > /tmp/changed_files.txt

    # Sync changed files
    echo -e "├─ Syncing changed files..."
    rsync -avz --files-from=/tmp/changed_files.txt \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude 'dist' \
        --exclude '.git' \
        -e "ssh -i ${KEY_PATH/#\~/$HOME}" \
        . ubuntu@$AWS_IP:$REMOTE_DIR/ 2>/dev/null | grep -c "^" | while read count; do
            echo -e "│  └─ Transferred: $count items"
        done

    # Update tracking
    LOCAL_SHA=$(git rev-parse HEAD)
    LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    SERVICES_TO_REBUILD=""
    [ "$REBUILD_API" = true ] && SERVICES_TO_REBUILD="$SERVICES_TO_REBUILD api"
    [ "$REBUILD_ADMIN" = true ] && SERVICES_TO_REBUILD="$SERVICES_TO_REBUILD web-admin"
    [ "$REBUILD_MEMBER" = true ] && SERVICES_TO_REBUILD="$SERVICES_TO_REBUILD web-member"

    echo -e "└─ Rebuilding services: ${YELLOW}${SERVICES_TO_REBUILD:-none}${NC}"

    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
        cd $REMOTE_DIR

        # Update tracking file
        cat > $TRACKING_FILE << EOF
{
    "sha": "$LOCAL_SHA",
    "branch": "$LOCAL_BRANCH",
    "timestamp": "$TIMESTAMP",
    "mode": "incremental",
    "services": [$(echo $SERVICES_TO_REBUILD | tr ' ' ',' | sed 's/,/", "/g' | sed 's/^/"/;s/$/"/')]
}
EOF

        # Detect compose file
        if [ -f docker-compose.aws.yml ]; then
            COMPOSE_FILE="docker-compose.aws.yml"
        elif [ -f docker-compose.prod.yml ]; then
            COMPOSE_FILE="docker-compose.prod.yml"
        else
            COMPOSE_FILE="docker-compose.yml"
        fi

        # Rebuild only changed services
        if [ ! -z "$SERVICES_TO_REBUILD" ]; then
            for service in $SERVICES_TO_REBUILD; do
                echo "   ├─ Rebuilding \$service..."
                docker-compose -f \$COMPOSE_FILE up -d --build \$service
            done
        fi

        echo "   └─ Services status:"
        docker-compose -f \$COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}"
ENDSSH

    rm /tmp/changed_files.txt
}

# Function: Checksum-based deployment
deploy_checksum() {
    echo -e "\n${BLUE}🔄 Executing Checksum-based Sync${NC}"
    echo -e "├─ Using rsync checksum comparison"
    echo -e "└─ Syncing all files (smart diff)..."

    # Count files before sync
    SYNC_OUTPUT=$(rsync -avz --checksum --dry-run \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude 'dist' \
        --exclude '.git' \
        --exclude '*.log' \
        -e "ssh -i ${KEY_PATH/#\~/$HOME}" \
        . ubuntu@$AWS_IP:$REMOTE_DIR/ 2>/dev/null | grep -c "^" || echo "0")

    echo -e "   ├─ Files to sync: $SYNC_OUTPUT"

    # Actual sync
    rsync -avz --checksum \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude 'dist' \
        --exclude '.git' \
        --exclude '*.log' \
        -e "ssh -i ${KEY_PATH/#\~/$HOME}" \
        . ubuntu@$AWS_IP:$REMOTE_DIR/ 2>/dev/null | tail -1

    # Update tracking
    LOCAL_SHA=$(git rev-parse HEAD)
    LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    echo -e "   └─ Rebuilding all services (cannot detect specific changes)..."

    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << ENDSSH
        cd $REMOTE_DIR

        # Update tracking file
        cat > $TRACKING_FILE << EOF
{
    "sha": "$LOCAL_SHA",
    "branch": "$LOCAL_BRANCH",
    "timestamp": "$TIMESTAMP",
    "mode": "checksum",
    "services": ["api", "web-admin", "web-member"]
}
EOF

        # Detect compose file
        if [ -f docker-compose.aws.yml ]; then
            COMPOSE_FILE="docker-compose.aws.yml"
        elif [ -f docker-compose.prod.yml ]; then
            COMPOSE_FILE="docker-compose.prod.yml"
        else
            COMPOSE_FILE="docker-compose.yml"
        fi

        # Rebuild all services
        docker-compose -f \$COMPOSE_FILE up -d --build

        echo "   └─ Services status:"
        docker-compose -f \$COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}"
ENDSSH
}

# Function: Show deployment status
show_status() {
    echo -e "\n${BLUE}📊 Deployment Status${NC}"

    ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << 'ENDSSH'
        echo "├─ Running containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | sed 's/^/│  /'

        if [ -f /home/ubuntu/opdwallet/.deployment-tracking.json ]; then
            echo "└─ Deployment info:"
            cat /home/ubuntu/opdwallet/.deployment-tracking.json | python3 -m json.tool 2>/dev/null | sed 's/^/   /'
        fi
ENDSSH
}

# Main execution flow
main() {
    case "$MODE" in
        status)
            check_remote_state
            show_status
            ;;
        full)
            check_local_state
            deploy_full
            ;;
        incremental)
            check_local_state
            check_remote_state
            analyze_changes
            if [ "$DEPLOY_MODE" = "incremental" ]; then
                deploy_incremental
            else
                echo -e "${YELLOW}Cannot do incremental, falling back to full${NC}"
                deploy_full
            fi
            ;;
        auto|*)
            check_local_state

            if check_remote_state; then
                analyze_changes

                case "$DEPLOY_MODE" in
                    none)
                        echo -e "\n${GREEN}✅ Already up to date!${NC}"
                        ;;
                    incremental)
                        deploy_incremental
                        ;;
                    checksum)
                        deploy_checksum
                        ;;
                    full)
                        deploy_full
                        ;;
                esac
            else
                deploy_full
            fi
            ;;
    esac

    # Calculate execution time
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo -e "\n${GREEN}✅ Deployment Complete${NC}"
    echo -e "├─ Duration: ${DURATION} seconds"
    echo -e "├─ Mode used: ${DEPLOY_MODE:-$MODE}"
    echo -e "└─ Access URLs:"
    echo -e "   ├─ Admin:  http://$AWS_IP:3001"
    echo -e "   ├─ Member: http://$AWS_IP:3002"
    echo -e "   └─ API:    http://$AWS_IP:4000"
}

# Run main
main