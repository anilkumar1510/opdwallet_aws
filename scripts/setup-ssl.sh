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
