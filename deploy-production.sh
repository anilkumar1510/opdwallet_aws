#!/bin/bash

# Professional Production Deployment Script for OPD Wallet
# Run this on your AWS EC2 instance

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo "=================================================="
echo "       OPD Wallet Production Deployment"
echo "=================================================="
echo ""

# Step 1: Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed!"
    exit 1
fi

if ! command -v git &> /dev/null; then
    log_error "Git is not installed!"
    exit 1
fi

log_success "All prerequisites met"

# Step 2: Navigate to project directory
log_info "Navigating to project directory..."

if [ ! -d ~/opdwallet ]; then
    log_warning "Project directory not found. Cloning repository..."
    cd ~
    git clone https://github.com/anilkumar1510/opdwallet.git
fi

cd ~/opdwallet
log_success "In project directory: $(pwd)"

# Step 3: Backup current deployment (if exists)
if [ -f docker-compose.prod.yml ]; then
    log_info "Creating backup of current deployment..."
    docker-compose -f docker-compose.prod.yml ps > deployment-backup-$(date +%Y%m%d-%H%M%S).log 2>&1 || true
fi

# Step 4: Pull latest code
log_info "Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
log_success "Code updated to latest version"

# Step 5: Create/Update environment file
log_info "Setting up environment configuration..."

# Get the server's public IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com) || SERVER_IP="51.20.125.246"

if [ ! -f .env.production ]; then
    cat > .env.production << EOF
NODE_ENV=production
MONGO_DATABASE=opd_wallet
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRY=7d
COOKIE_NAME=opd_session
COOKIE_SECURE=false
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax
COOKIE_MAX_AGE=604800000
PUBLIC_API_URL=http://${SERVER_IP}/api
NEXT_PUBLIC_API_URL=http://${SERVER_IP}/api
EOF
    log_success "Environment file created with server IP: ${SERVER_IP}"
else
    log_info "Environment file already exists"
fi

# Step 6: Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --timeout 30 || true
log_success "Existing containers stopped"

# Step 7: Clean Docker system
log_info "Cleaning Docker system to free resources..."
docker system prune -f
docker volume prune -f
log_success "Docker system cleaned"

# Step 8: Check available memory
log_info "System resources:"
free -h
df -h /

# Step 9: Build services
log_info "Building Docker images (this may take 10-15 minutes)..."
echo ""

# Build with progress indication
docker-compose -f docker-compose.prod.yml build --no-cache 2>&1 | while IFS= read -r line; do
    echo "  $line"
    # Show progress indicator every few lines
    if [[ $line == *"Step"* ]]; then
        echo -ne "\r${BLUE}[BUILDING]${NC} Processing... "
    fi
done

echo ""
log_success "All Docker images built successfully"

# Step 10: Start services
log_info "Starting all services..."
docker-compose -f docker-compose.prod.yml up -d
log_success "All services started"

# Step 11: Wait for services to be ready
log_info "Waiting for services to initialize..."
sleep 20

# Step 12: Health check
log_info "Performing health checks..."

# Check if all containers are running
RUNNING_CONTAINERS=$(docker ps --filter "label=com.docker.compose.project=opdwallet" --format "{{.Names}}" | wc -l)

if [ "$RUNNING_CONTAINERS" -ge 4 ]; then
    log_success "All containers are running"
else
    log_warning "Only $RUNNING_CONTAINERS containers are running. Expected at least 4."
fi

# Step 13: Display container status
log_info "Container Status:"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Step 14: Test endpoints
log_info "Testing application endpoints..."

# Test member portal
if curl -f -s -o /dev/null "http://localhost"; then
    log_success "Member portal is accessible"
else
    log_warning "Member portal is not responding yet"
fi

# Test admin portal
if curl -f -s -o /dev/null "http://localhost/admin"; then
    log_success "Admin portal is accessible"
else
    log_warning "Admin portal is not responding yet"
fi

# Test API
if curl -f -s -o /dev/null "http://localhost:4000/health"; then
    log_success "API is healthy"
else
    log_warning "API is not responding yet"
fi

# Step 15: Final status
echo ""
echo "=================================================="
echo "       Deployment Complete!"
echo "=================================================="
echo ""
log_success "Application deployed successfully!"
echo ""
echo "Access your application at:"
echo "  Member Portal: http://${SERVER_IP}"
echo "  Admin Portal: http://${SERVER_IP}/admin"
echo "  API: http://${SERVER_IP}/api"
echo ""
echo "Test Credentials:"
echo "  Admin: admin@opdwallet.com / Admin@123"
echo "  Member: john.doe@company.com / Member@123"
echo ""
echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "To stop: docker-compose -f docker-compose.prod.yml down"
echo ""