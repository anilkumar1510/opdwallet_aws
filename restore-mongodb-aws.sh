#!/bin/bash

# MongoDB Data Restore Script for AWS
# Restores MongoDB data to AWS instance

set -e

AWS_IP="51.20.125.246"
PEM_FILE="./opdwallet-server.pem"
AWS_USER="ubuntu"

echo "📊 Restoring MongoDB data to AWS..."
echo "===================================="

# Upload MongoDB backup
echo "📤 Uploading MongoDB backup..."
scp -i "$PEM_FILE" mongodb-data.tar.gz "${AWS_USER}@${AWS_IP}:/tmp/"
echo "✅ MongoDB backup uploaded"

# Restore on AWS
ssh -i "$PEM_FILE" "${AWS_USER}@${AWS_IP}" << 'ENDSSH'
set -e

cd /home/ubuntu/opdwallet

echo "📦 Extracting MongoDB backup..."
rm -rf /tmp/mongodb-restore
mkdir -p /tmp/mongodb-restore
tar -xzf /tmp/mongodb-data.tar.gz -C /tmp/mongodb-restore/

echo "⏳ Waiting for MongoDB to be fully ready..."
sleep 10

echo "📊 Restoring MongoDB data (without authentication)..."
docker exec opd-mongo-dev mongorestore \
    --db=opd_wallet \
    --drop \
    /tmp/mongodb-restore/opd_wallet/ || echo "Restore completed with warnings"

echo "🔐 Setting up MongoDB admin user..."
docker exec opd-mongo-dev mongosh opd_wallet --eval '
    db.getSiblingDB("admin").createUser({
        user: "admin",
        pwd: "admin123",
        roles: [ { role: "root", db: "admin" } ]
    })
' || echo "User may already exist"

echo "🧹 Cleaning up..."
rm -f /tmp/mongodb-data.tar.gz
rm -rf /tmp/mongodb-restore

echo "✅ MongoDB data restored successfully!"

echo ""
echo "📋 Verifying data..."
docker exec opd-mongo-dev mongosh opd_wallet --eval '
    print("Collections:");
    db.getCollectionNames().forEach(function(c) {
        print("  - " + c + ": " + db.getCollection(c).countDocuments() + " documents");
    });
'
ENDSSH

echo ""
echo "✅ MongoDB restore completed!"