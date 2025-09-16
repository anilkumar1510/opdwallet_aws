#!/bin/bash

# Setup AWS Secrets Manager for OPD Wallet
# This script creates secrets in AWS Secrets Manager and configures the application to use them

set -e

echo "🔐 Setting up AWS Secrets Manager..."

# Configuration
AWS_REGION="eu-north-1"
SECRET_NAME="opdwallet/production"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "📝 Creating secrets in AWS Secrets Manager..."

# Create the secret JSON
cat > /tmp/opdwallet-secrets.json << 'EOF'
{
  "JWT_SECRET": "your-super-secret-jwt-key-change-in-production-$(openssl rand -hex 32)",
  "MONGODB_URI": "mongodb://opd-mongo:27017/opd_wallet",
  "MONGODB_USER": "opdwallet",
  "MONGODB_PASSWORD": "$(openssl rand -base64 32)",
  "COOKIE_SECRET": "$(openssl rand -hex 32)",
  "ADMIN_EMAIL": "admin@opdwallet.com",
  "ADMIN_PASSWORD": "$(openssl rand -base64 16)",
  "SMTP_HOST": "email-smtp.eu-north-1.amazonaws.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "",
  "SMTP_PASS": "",
  "REDIS_URL": "redis://opd-redis:6379",
  "SESSION_SECRET": "$(openssl rand -hex 32)",
  "ENCRYPTION_KEY": "$(openssl rand -hex 32)"
}
EOF

# Generate actual random values
JWT_SECRET=$(openssl rand -hex 32)
MONGODB_PASSWORD=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=$(openssl rand -base64 16)
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Create the actual secrets JSON
cat > /tmp/opdwallet-secrets-final.json << EOF
{
  "JWT_SECRET": "$JWT_SECRET",
  "MONGODB_URI": "mongodb://opd-mongo:27017/opd_wallet",
  "MONGODB_USER": "opdwallet",
  "MONGODB_PASSWORD": "$MONGODB_PASSWORD",
  "COOKIE_SECRET": "$COOKIE_SECRET",
  "ADMIN_EMAIL": "admin@opdwallet.com",
  "ADMIN_PASSWORD": "$ADMIN_PASSWORD",
  "SMTP_HOST": "email-smtp.eu-north-1.amazonaws.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "",
  "SMTP_PASS": "",
  "REDIS_URL": "redis://opd-redis:6379",
  "SESSION_SECRET": "$SESSION_SECRET",
  "ENCRYPTION_KEY": "$ENCRYPTION_KEY"
}
EOF

# Create or update the secret in AWS Secrets Manager
echo "🚀 Creating secret in AWS Secrets Manager..."
if aws secretsmanager describe-secret --secret-id $SECRET_NAME --region $AWS_REGION &>/dev/null; then
    echo "Secret already exists. Updating..."
    aws secretsmanager update-secret \
        --secret-id $SECRET_NAME \
        --secret-string file:///tmp/opdwallet-secrets-final.json \
        --region $AWS_REGION
else
    echo "Creating new secret..."
    aws secretsmanager create-secret \
        --name $SECRET_NAME \
        --description "OPD Wallet Production Secrets" \
        --secret-string file:///tmp/opdwallet-secrets-final.json \
        --region $AWS_REGION
fi

# Clean up temporary files
rm -f /tmp/opdwallet-secrets.json /tmp/opdwallet-secrets-final.json

echo "✅ Secrets created successfully!"
echo ""
echo "📋 Secret ARN:"
aws secretsmanager describe-secret --secret-id $SECRET_NAME --region $AWS_REGION --query 'ARN' --output text
echo ""
echo "🔑 To retrieve secrets in your application:"
echo "   aws secretsmanager get-secret-value --secret-id $SECRET_NAME --region $AWS_REGION"
echo ""
echo "📦 Next steps:"
echo "1. Update your application to fetch secrets from AWS Secrets Manager"
echo "2. Add IAM permissions for EC2 instance to read secrets"
echo "3. Update GitHub Actions to use secrets from Secrets Manager"
echo ""
echo "🎯 IAM Policy needed (attach to EC2 instance role):"
cat << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:eu-north-1:*:secret:opdwallet/*"
        }
    ]
}
EOF