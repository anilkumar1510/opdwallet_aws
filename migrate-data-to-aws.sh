#!/bin/bash

# Configuration
AWS_IP="34.202.161.177"
KEY_PATH="~/Downloads/opdwallet-arm-key.pem"

echo "🚀 Starting database migration to AWS..."

# Export local database
echo "📦 Exporting local database..."
docker exec opd-mongo-dev mongodump \
  -u admin -p admin123 \
  --authenticationDatabase admin \
  --db opd_wallet \
  --out /tmp/mongodump

# Create archive
docker exec opd-mongo-dev tar -czf /tmp/opd_wallet_backup.tar.gz -C /tmp mongodump

# Copy from container to local
docker cp opd-mongo-dev:/tmp/opd_wallet_backup.tar.gz /tmp/opd_wallet_backup.tar.gz

# Transfer to AWS
echo "📤 Transferring to AWS..."
scp -i ${KEY_PATH/#\~/$HOME} /tmp/opd_wallet_backup.tar.gz ubuntu@$AWS_IP:/tmp/

# Restore on AWS
echo "📥 Restoring database on AWS..."
ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP << 'EOF'
  # Copy to MongoDB container
  docker cp /tmp/opd_wallet_backup.tar.gz opd-mongo-dev:/tmp/

  # Extract and restore
  docker exec opd-mongo-dev tar -xzf /tmp/opd_wallet_backup.tar.gz -C /tmp

  # Restore the database
  docker exec opd-mongo-dev mongorestore \
    -u admin -p admin123 \
    --authenticationDatabase admin \
    --db opd_wallet \
    --drop \
    /tmp/mongodump/opd_wallet

  # Cleanup
  docker exec opd-mongo-dev rm -rf /tmp/mongodump /tmp/opd_wallet_backup.tar.gz
  rm /tmp/opd_wallet_backup.tar.gz
EOF

# Cleanup local temp file
rm /tmp/opd_wallet_backup.tar.gz

echo "✅ Database migration complete!"

# Verify
echo "📊 Verifying migration..."
ssh -i ${KEY_PATH/#\~/$HOME} ubuntu@$AWS_IP "docker exec opd-mongo-dev mongosh -u admin -p admin123 --authenticationDatabase admin opd_wallet --eval 'print(\"Users count:\", db.users.countDocuments())'"