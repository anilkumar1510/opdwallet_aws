#!/bin/bash

# OPD Wallet Container Cleanup Script
# Prevents port conflicts by stopping and removing all OPD containers before deployment

set -e

echo "🧹 Starting OPD Wallet container cleanup..."

# Function to stop and remove containers by pattern
cleanup_containers() {
    local pattern=$1
    local containers=$(docker ps -aq --filter name="$pattern" 2>/dev/null || true)

    if [ ! -z "$containers" ]; then
        echo "🛑 Stopping containers matching pattern: $pattern"
        docker stop $containers 2>/dev/null || true
        echo "🗑️ Removing containers matching pattern: $pattern"
        docker rm $containers 2>/dev/null || true
    else
        echo "✅ No containers found matching pattern: $pattern"
    fi
}

# Function to remove networks
cleanup_networks() {
    local networks=$(docker network ls --filter name="opd" -q 2>/dev/null || true)
    local networks2=$(docker network ls --filter name="opdwallet" -q 2>/dev/null || true)

    if [ ! -z "$networks" ]; then
        echo "🌐 Removing OPD networks..."
        docker network rm $networks 2>/dev/null || true
    fi

    if [ ! -z "$networks2" ]; then
        echo "🌐 Removing opdwallet networks..."
        docker network rm $networks2 2>/dev/null || true
    fi
}

# Stop and remove all OPD containers across all configurations
echo "🔍 Searching for OPD containers..."

# Development containers
cleanup_containers "opd-.*-dev"

# Production containers
cleanup_containers "opd-.*-prod"

# Simple deployment containers
cleanup_containers "opd-.*-simple"

# Secure deployment containers
cleanup_containers "opd-.*-secure"

# ECR deployment containers
cleanup_containers "opd-.*-ecr"

# Secrets deployment containers
cleanup_containers "opd-.*-secrets"

# Legacy containers without suffix (from old configs)
cleanup_containers "opd-api$"
cleanup_containers "opd-web-admin$"
cleanup_containers "opd-web-member$"
cleanup_containers "opd-mongo$"
cleanup_containers "opd-mongodb$"
cleanup_containers "opd-nginx$"
cleanup_containers "opd-redis$"
cleanup_containers "opd-certbot$"

# Clean up dangling images and volumes (optional)
echo "🧽 Cleaning up dangling Docker resources..."
docker system prune -f 2>/dev/null || true

# Clean up networks
cleanup_networks

# Check for any remaining containers using port 4000
echo "🔍 Checking for any containers still using port 4000..."
port_conflicts=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":4000->" || true)
if [ ! -z "$port_conflicts" ]; then
    echo "⚠️ Warning: Found containers still using port 4000:"
    echo "$port_conflicts"
else
    echo "✅ No containers using port 4000"
fi

echo "✨ Cleanup completed successfully!"
echo ""
echo "📊 Current container status:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"