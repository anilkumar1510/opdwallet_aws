#!/bin/bash

# Production Build Script
# This script builds and tests the application locally before deployment

set -e  # Exit on error

echo "🚀 Starting production build process..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Step 1: Clean up old containers and images
print_status "Cleaning up old containers and images..."
docker-compose -f docker-compose.prod.yml down --volumes 2>/dev/null || true
docker system prune -f

# Step 2: Build images
print_status "Building Docker images..."

# Build arguments
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Build each service
echo "Building API..."
docker-compose -f docker-compose.prod.yml build api || {
    print_error "API build failed"
    exit 1
}

echo "Building Admin Portal..."
docker-compose -f docker-compose.prod.yml build web-admin || {
    print_error "Admin portal build failed"
    exit 1
}

echo "Building Member Portal..."
docker-compose -f docker-compose.prod.yml build web-member || {
    print_error "Member portal build failed"
    exit 1
}

# Step 3: Start services
print_status "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Step 4: Wait for services to be ready
print_status "Waiting for services to initialize (30 seconds)..."
sleep 30

# Step 5: Health checks
print_status "Running health checks..."

check_service() {
    local name=$1
    local url=$2

    if curl -f -s -o /dev/null "$url"; then
        print_status "$name is healthy"
        return 0
    else
        print_error "$name is not responding"
        return 1
    fi
}

# Check each service
check_service "API" "http://localhost:4000/health"
check_service "Member Portal" "http://localhost:3002"
check_service "Admin Portal" "http://localhost:3001"
check_service "Nginx" "http://localhost/health"

# Step 6: Run smoke tests
print_status "Running smoke tests..."

# Test static assets
if curl -f -s "http://localhost/_next/static/chunks/webpack-*.js" | head -c 100 > /dev/null 2>&1; then
    print_status "Static assets are being served correctly"
else
    print_warning "Static assets might not be configured properly"
fi

# Test API endpoints
if curl -f -s "http://localhost/api/health" > /dev/null 2>&1; then
    print_status "API endpoints are accessible"
else
    print_error "API endpoints are not accessible"
fi

# Step 7: Show container status
print_status "Container status:"
docker-compose -f docker-compose.prod.yml ps

# Step 8: Show logs for debugging
print_status "Recent logs (last 10 lines per service):"
echo "---"
for service in api web-admin web-member nginx mongodb; do
    echo "[$service]"
    docker-compose -f docker-compose.prod.yml logs --tail=10 $service 2>/dev/null || true
    echo "---"
done

# Success message
echo ""
print_status "Production build completed successfully!"
echo "=================================="
echo "Access the application at:"
echo "  Member Portal: http://localhost"
echo "  Admin Portal: http://localhost/admin"
echo "  API: http://localhost/api"
echo ""
echo "To stop the services, run:"
echo "  docker-compose -f docker-compose.prod.yml down"