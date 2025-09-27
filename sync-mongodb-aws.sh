#!/bin/bash

# Simple MongoDB Sync Script
# Copies the entire MongoDB data directory from local to AWS

set -e

AWS_IP="51.20.125.246"
PEM_FILE="./opdwallet-server.pem"
AWS_USER="ubuntu"

echo "📊 Syncing MongoDB data to AWS..."
echo "=================================="

# Stop containers on AWS first
echo "🛑 Stopping Docker containers on AWS..."
ssh -i "$PEM_FILE" "${AWS_USER}@${AWS_IP}" "cd /home/ubuntu/opdwallet && docker-compose down"

# Upload the backup folder with all data
echo ""
echo "📤 Uploading MongoDB backup (this may take a moment)..."
scp -i "$PEM_FILE" -r mongodb-backup/mongodb-backup/opd_wallet "${AWS_USER}@${AWS_IP}:/tmp/"

# Restore on AWS
echo ""
echo "🔧 Restoring MongoDB data on AWS..."
ssh -i "$PEM_FILE" "${AWS_USER}@${AWS_IP}" << 'ENDSSH'
set -e

cd /home/ubuntu/opdwallet

echo "🐳 Starting MongoDB container..."
docker-compose up -d mongo

echo "⏳ Waiting for MongoDB to start..."
sleep 15

echo "📋 Copying backup into container..."
docker cp /tmp/opd_wallet opd-mongo-dev:/tmp/

echo "📊 Restoring data..."
docker exec opd-mongo-dev mongorestore \
    --username=admin \
    --password=admin123 \
    --authenticationDatabase=admin \
    --db opd_wallet \
    --drop \
    /tmp/opd_wallet/

echo "✅ Data restored!"

echo "🐳 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to stabilize..."
sleep 20

echo "📋 Checking services..."
docker-compose ps

echo ""
echo "📊 Verifying MongoDB data..."
docker exec opd-mongo-dev mongosh opd_wallet --eval '
    print("\n📦 Database Collections:");
    db.getCollectionNames().forEach(function(c) {
        let count = db.getCollection(c).countDocuments();
        print("  ✓ " + c + ": " + count + " documents");
    });

    print("\n👥 Sample Users:");
    db.users.find({}, {email: 1, memberId: 1, role: 1}).forEach(u => {
        print("  - " + u.email + " (" + u.memberId + ") - " + u.role);
    });
'

echo "🧹 Cleaning up..."
rm -rf /tmp/opd_wallet

ENDSSH

echo ""
echo "=================================="
echo "✅ MongoDB sync completed!"
echo ""
echo "🌐 Test the application:"
echo "   Member Portal: http://51.20.125.246:3002"
echo "   Admin Portal:  http://51.20.125.246:3001"
echo "   API:           http://51.20.125.246:4000"
echo ""