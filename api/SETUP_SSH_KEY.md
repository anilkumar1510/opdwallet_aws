# Setting Up SSH Key for GitHub Actions

The deployment workflows are failing due to SSH key formatting issues. Follow these steps to fix it:

## Step 1: Create Base64 Encoded SSH Key

Run this command in the project root directory where your `opdwallet-server.pem` file is located:

```bash
base64 -i opdwallet-server.pem | tr -d '\n' > opdwallet-server-base64.txt
```

## Step 2: Add to GitHub Secrets

1. Go to your GitHub repository: https://github.com/anilkumar1510/opdwallet
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Create a new secret:
   - Name: `EC2_SSH_KEY_BASE64`
   - Value: Copy the entire contents of `opdwallet-server-base64.txt`

## Step 3: Use the New Workflow

The `deploy-base64.yml` workflow will automatically use the base64-encoded SSH key.

## Alternative: Manual Deployment

If GitHub Actions continues to fail, you can deploy manually from your local machine:

```bash
# From the project root directory
./deploy-from-local.sh
```

This script will:
1. Build and push Docker images to ECR
2. SSH into EC2 and pull the latest images
3. Restart all containers with the new images

## Current Deployment Status

✅ Application is running at: http://13.60.210.156
✅ All services are operational:
- API: Running
- Admin Portal: Running
- Member Portal: Running
- MongoDB: Running
- Nginx: Running

## Troubleshooting

If SSH still fails, verify:
1. The EC2 instance security group allows SSH (port 22) from GitHub Actions IP ranges
2. The SSH key matches the one configured on the EC2 instance
3. The EC2_HOST secret is correctly set to: 13.60.210.156