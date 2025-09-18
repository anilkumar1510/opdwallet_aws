#!/bin/bash

# Deploy script for OPD Wallet Admin Portal
set -e

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the web-admin directory."
    exit 1
fi

# Build the application
echo "📦 Building the application..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Error: Build failed. .next directory not found."
    exit 1
fi

echo "✅ Build completed successfully!"

# Optional: Deploy to production (add your deployment commands here)
# For example:
# - Copy build files to server
# - Run on a specific port
# - Restart PM2 process
# - Update nginx configuration

echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Copy the build files to your production server"
echo "2. Set up environment variables on the server"
echo "3. Start the application with 'npm start' or PM2"
echo "4. Configure your web server (nginx/Apache) to proxy requests"