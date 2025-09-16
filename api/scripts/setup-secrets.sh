#!/bin/bash

# Setup AWS Secrets Manager for OPD Wallet
set -e

echo "🔐 Setting up AWS Secrets Manager..."

AWS_REGION="eu-north-1"
SECRET_NAME="opdwallet/production"

# Generate random secrets
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Create secrets JSON
cat > /tmp/opdwallet-secrets.json << EOF
{
  "JWT_SECRET": "$JWT_SECRET",
  "MONGODB_URI": "mongodb://opd-mongo:27017/opd_wallet",
  "COOKIE_SECRET": "$COOKIE_SECRET",
  "SESSION_SECRET": "$SESSION_SECRET",
  "ENCRYPTION_KEY": "$ENCRYPTION_KEY",
  "NODE_ENV": "production",
  "CORS_ORIGIN": "*"
}
EOF

# Create or update secret
echo "📤 Creating/updating secret in AWS..."
if aws secretsmanager describe-secret --secret-id $SECRET_NAME --region $AWS_REGION &>/dev/null; then
    echo "Updating existing secret..."
    aws secretsmanager update-secret \
        --secret-id $SECRET_NAME \
        --secret-string file:///tmp/opdwallet-secrets.json \
        --region $AWS_REGION
else
    echo "Creating new secret..."
    aws secretsmanager create-secret \
        --name $SECRET_NAME \
        --description "OPD Wallet Production Secrets" \
        --secret-string file:///tmp/opdwallet-secrets.json \
        --region $AWS_REGION
fi

rm -f /tmp/opdwallet-secrets.json

echo "✅ Secret created/updated successfully!"
echo ""
echo "📋 To retrieve: aws secretsmanager get-secret-value --secret-id $SECRET_NAME --region $AWS_REGION"