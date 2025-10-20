#!/bin/bash

# Test incremental deployment
echo "=== Testing Incremental Deployment ==="

# 1. Make a test change
echo "// Test change at $(date)" >> api/src/main.ts
git add api/src/main.ts
git commit -m "Test incremental deployment"

# 2. Get current SHA
LOCAL_SHA=$(git rev-parse HEAD)
echo "Local SHA: ${LOCAL_SHA:0:8}"

# 3. Deploy only the change
echo "Deploying only changed file..."
rsync -avz \
  --files-from=<(echo "api/src/main.ts") \
  -e "ssh -i ~/Downloads/opdwallet-arm-key.pem" \
  . ubuntu@34.202.161.177:/home/ubuntu/opdwallet/

# 4. Update tracking
ssh -i ~/Downloads/opdwallet-arm-key.pem ubuntu@34.202.161.177 \
  "echo '{\"sha\":\"$LOCAL_SHA\",\"timestamp\":\"$(date -u)\",\"mode\":\"incremental\"}' > /home/ubuntu/opdwallet/.deployment-tracking.json"

echo "✅ Incremental deployment complete!"
echo "Only 1 file transferred instead of entire codebase"