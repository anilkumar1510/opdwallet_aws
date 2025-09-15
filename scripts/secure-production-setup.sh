#!/bin/bash

# Security Setup Script for OPD Wallet Production
# This script implements all security requirements per Operating Rules #5 and #6

set -e

echo "=================================================="
echo "🔒 OPD Wallet Production Security Setup"
echo "=================================================="

# Configuration
DOMAIN="${DOMAIN:-13.60.210.156}"  # Change to actual domain when available
EMAIL="${EMAIL:-admin@opdwallet.com}"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

echo -e "${YELLOW}📋 Step 1: Generating secure environment variables${NC}"

# Generate secure secrets
JWT_SECRET=$(generate_secret)
MONGO_ROOT_PASSWORD=$(generate_secret)
MONGO_USER_PASSWORD=$(generate_secret)
SESSION_SECRET=$(generate_secret)
REFRESH_TOKEN_SECRET=$(generate_secret)

# Create production environment file
cat > $ENV_FILE << EOF
# Generated on $(date)
# PRODUCTION CONFIGURATION - SECURE

# Node Environment
NODE_ENV=production

# MongoDB Configuration (WITH AUTH)
MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
MONGODB_DATABASE=opd_wallet
MONGODB_USERNAME=opduser
MONGODB_PASSWORD=${MONGO_USER_PASSWORD}
MONGODB_URI=mongodb://opduser:${MONGO_USER_PASSWORD}@opd-mongodb:27017/opd_wallet?authSource=opd_wallet

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=1h
JWT_REFRESH_SECRET=${REFRESH_TOKEN_SECRET}
JWT_REFRESH_EXPIRY=7d

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}
COOKIE_NAME=opd_session_prod
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict
COOKIE_MAX_AGE=3600000
COOKIE_DOMAIN=

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=3
LOCK_TIME=86400000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=5

# CORS Configuration
CORS_ORIGIN=https://${DOMAIN}
CORS_CREDENTIALS=true

# API Configuration
API_PORT=4000
API_PREFIX=api
API_VERSION=v1

# Rate Limiting
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=1000

# Security Headers
HELMET_ENABLED=true
CSP_ENABLED=true

# Audit Logging
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=730

# Performance Monitoring
MONITORING_ENABLED=true
DB_QUERY_TIMEOUT=5000
DB_POOL_SIZE=10

# Email Configuration (Update with actual SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@opdwallet.com
SMTP_PASS=change_this_password
FROM_EMAIL=noreply@opdwallet.com

# Feature Flags
ENABLE_2FA=false
ENABLE_CAPTCHA=true
ENABLE_PASSWORD_HISTORY=true
PASSWORD_HISTORY_COUNT=5
EOF

echo -e "${GREEN}✅ Environment variables generated${NC}"

echo -e "${YELLOW}📋 Step 2: Creating MongoDB initialization script with authentication${NC}"

cat > scripts/init-mongo-secure.js << 'EOF'
// MongoDB Secure Initialization Script
print('Starting MongoDB secure initialization...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create root user if not exists
try {
  db.createUser({
    user: process.env.MONGODB_ROOT_USERNAME || 'root',
    pwd: process.env.MONGODB_ROOT_PASSWORD || 'changeMe123!',
    roles: [
      { role: 'root', db: 'admin' }
    ]
  });
  print('Root user created');
} catch (e) {
  print('Root user already exists');
}

// Switch to application database
db = db.getSiblingDB('opd_wallet');

// Create application user
try {
  db.createUser({
    user: process.env.MONGODB_USERNAME || 'opduser',
    pwd: process.env.MONGODB_PASSWORD || 'changeMe456!',
    roles: [
      { role: 'readWrite', db: 'opd_wallet' },
      { role: 'dbAdmin', db: 'opd_wallet' }
    ]
  });
  print('Application user created');
} catch (e) {
  print('Application user already exists');
}

// Create indexes for performance (Rule #6)
db.users.createIndex({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
db.users.createIndex({ uhid: 1 }, { unique: true });
db.users.createIndex({ memberId: 1 }, { unique: true });
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ role: 1, status: 1 });

db.policies.createIndex({ policyNumber: 1 }, { unique: true });
db.policies.createIndex({ status: 1, effectiveFrom: 1 });

db.userPolicyAssignments.createIndex({ userId: 1, status: 1 });
db.userPolicyAssignments.createIndex({ policyId: 1, status: 1 });
db.userPolicyAssignments.createIndex({ userId: 1, policyId: 1, effectiveFrom: 1 });

db.claims.createIndex({ claimId: 1 }, { unique: true });
db.claims.createIndex({ userId: 1, status: 1 });
db.claims.createIndex({ serviceDate: 1 });

db.transactions.createIndex({ transactionId: 1 }, { unique: true });
db.transactions.createIndex({ userId: 1, createdAt: -1 });

db.appointments.createIndex({ appointmentId: 1 }, { unique: true });
db.appointments.createIndex({ userId: 1, appointmentDate: 1 });

// Create audit log collection with TTL
db.createCollection('auditLogs');
db.auditLogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

print('Indexes created successfully');

// Insert test data with secure password hash
db.users.insertOne({
  userId: 'USR000001',
  uhid: 'UH000001',
  memberId: 'OPD000001',
  email: 'member@test.com',
  passwordHash: '$2b$12$YourSecureHashHere', // Will be updated
  role: 'MEMBER',
  relationship: 'SELF',
  name: {
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe'
  },
  phone: '+1234567890',
  status: 'ACTIVE',
  mustChangePassword: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB secure initialization completed');
EOF

echo -e "${GREEN}✅ MongoDB initialization script created${NC}"

echo -e "${YELLOW}📋 Step 3: Creating secure Docker Compose configuration${NC}"

cat > docker-compose.secure.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: opd-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGODB_DATABASE}
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./scripts/init-mongo-secure.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - opd-network
    ports:
      - "127.0.0.1:27017:27017"  # Only bind to localhost
    command: mongod --auth --bind_ip_all
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: opd-api
    restart: always
    env_file: .env.production
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - opd-network
    expose:
      - "4000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  web-admin:
    build:
      context: ./web-admin
      dockerfile: Dockerfile
    container_name: opd-web-admin
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://${DOMAIN}/api
      API_URL: http://api:4000/api
    depends_on:
      - api
    networks:
      - opd-network
    expose:
      - "3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3

  web-member:
    build:
      context: ./web-member
      dockerfile: Dockerfile
    container_name: opd-web-member
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://${DOMAIN}/api
      API_URL: http://api:4000/api
    depends_on:
      - api
    networks:
      - opd-network
    expose:
      - "3002"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: opd-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.secure.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - api
      - web-admin
      - web-member
    networks:
      - opd-network
    command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"

  certbot:
    image: certbot/certbot
    container_name: opd-certbot
    restart: unless-stopped
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  opd-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  mongodb_data:
  mongodb_config:
EOF

echo -e "${GREEN}✅ Secure Docker Compose configuration created${NC}"

echo -e "${YELLOW}📋 Step 4: Creating secure Nginx configuration with SSL${NC}"

cat > nginx/nginx.secure.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=global:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=1000r/h;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Hide nginx version
    server_tokens off;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL certificates (will be generated by Let's Encrypt)
        ssl_certificate /etc/letsencrypt/live/opdwallet/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/opdwallet/privkey.pem;

        # HSTS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

        # CSP Header
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;

        # API endpoints with rate limiting
        location /api {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://api:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Security
            proxy_hide_header X-Powered-By;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth {
            limit_req zone=auth burst=2 nodelay;

            proxy_pass http://api:4000/api/auth;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Admin portal
        location /admin {
            limit_req zone=global burst=10 nodelay;

            proxy_pass http://web-admin:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Member portal (default)
        location / {
            limit_req zone=global burst=10 nodelay;

            proxy_pass http://web-member:3002;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files for member portal
        location /_next {
            proxy_pass http://web-member:3002/_next;
            proxy_http_version 1.1;
            proxy_set_header Host $host;

            # Cache static assets
            proxy_cache_valid 200 30d;
            add_header Cache-Control "public, max-age=2592000, immutable";
        }

        # Deny access to sensitive files
        location ~ /\. {
            deny all;
        }

        location ~ /\.env {
            deny all;
        }
    }
}
EOF

echo -e "${GREEN}✅ Secure Nginx configuration created${NC}"

echo -e "${YELLOW}📋 Step 5: SSL Certificate setup script${NC}"

cat > scripts/setup-ssl.sh << 'EOF'
#!/bin/bash

DOMAIN="${1:-13.60.210.156}"
EMAIL="${2:-admin@opdwallet.com}"

echo "Setting up SSL for domain: $DOMAIN"

# Create directories
mkdir -p certbot/conf certbot/www

# Generate temporary self-signed certificate for initial setup
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/privkey.pem \
    -out nginx/ssl/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=OPD Wallet/CN=$DOMAIN"

echo "Temporary SSL certificate created"

# For production with real domain, uncomment below:
# docker-compose -f docker-compose.secure.yml up -d nginx
# docker-compose -f docker-compose.secure.yml run --rm certbot certonly \
#     --webroot --webroot-path=/var/www/certbot \
#     --email $EMAIL \
#     --agree-tos \
#     --no-eff-email \
#     -d $DOMAIN

echo "SSL setup complete"
EOF

chmod +x scripts/setup-ssl.sh

echo -e "${GREEN}✅ SSL setup script created${NC}"

echo "=================================================="
echo -e "${GREEN}✅ Security setup scripts created successfully!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review the generated .env.production file"
echo "2. Run: ./scripts/setup-ssl.sh <your-domain> <your-email>"
echo "3. Deploy with: docker-compose -f docker-compose.secure.yml up -d"
echo ""
echo "Important files created:"
echo "- .env.production (secure environment variables)"
echo "- docker-compose.secure.yml (production Docker config)"
echo "- nginx/nginx.secure.conf (SSL and security headers)"
echo "- scripts/init-mongo-secure.js (MongoDB with auth)"
echo "- scripts/setup-ssl.sh (SSL certificate setup)"