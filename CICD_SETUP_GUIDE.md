# CI/CD Setup Guide for OPD Wallet

## Prerequisites
- GitHub repository access with workflow permissions
- AWS Account with appropriate permissions
- AWS CLI configured locally

## Step 1: GitHub Repository ✅
- Repository: https://github.com/anilkumar1510/opdwallet.git
- Status: **COMPLETE**

## Step 2: GitHub Actions Workflow

### Manual Setup Required:
Since your GitHub token lacks `workflow` scope, you need to:

1. **Option A: Update GitHub Token**
   ```bash
   # Go to GitHub Settings → Developer Settings → Personal Access Tokens
   # Create new token with 'workflow' scope
   # Update local credentials:
   git config --global credential.helper osxkeychain
   # Then push again
   ```

2. **Option B: Add via GitHub UI**
   - Go to: https://github.com/anilkumar1510/opdwallet
   - Click "Create new file"
   - Name: `.github/workflows/ci.yml`
   - Copy content from below

### CI Workflow Content:
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20.x'

jobs:
  test-and-build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}

    - name: Install API dependencies
      working-directory: ./api
      run: npm ci

    - name: Install Admin dependencies
      working-directory: ./web-admin
      run: npm ci

    - name: Install Member dependencies
      working-directory: ./web-member
      run: npm ci

    - name: Build API
      working-directory: ./api
      run: npm run build

    - name: Build Admin Portal
      working-directory: ./web-admin
      run: npm run build

    - name: Build Member Portal
      working-directory: ./web-member
      run: npm run build

    - name: Build Docker images
      run: docker-compose -f docker-compose.prod.yml build
```

## Step 3: AWS ECR Setup

### Create ECR Repositories:
```bash
# Install AWS CLI if not already installed
brew install awscli

# Configure AWS credentials
aws configure

# Create ECR repositories
aws ecr create-repository --repository-name opdwallet/api --region eu-north-1
aws ecr create-repository --repository-name opdwallet/web-admin --region eu-north-1
aws ecr create-repository --repository-name opdwallet/web-member --region eu-north-1
aws ecr create-repository --repository-name opdwallet/nginx --region eu-north-1

# Get login token
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin [YOUR_AWS_ACCOUNT_ID].dkr.ecr.eu-north-1.amazonaws.com
```

### Update docker-compose.prod.yml:
```yaml
# Replace local image names with ECR URLs
image: [YOUR_AWS_ACCOUNT_ID].dkr.ecr.eu-north-1.amazonaws.com/opdwallet/api:latest
```

## Step 4: CD Workflow (Deploy to AWS)

### Add deployment workflow:
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AWS_REGION: eu-north-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.eu-north-1.amazonaws.com

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push API image
      run: |
        docker build -f api/Dockerfile.prod -t $ECR_REGISTRY/opdwallet/api:latest ./api
        docker push $ECR_REGISTRY/opdwallet/api:latest

    - name: Build and push Admin image
      run: |
        docker build -f web-admin/Dockerfile.prod -t $ECR_REGISTRY/opdwallet/web-admin:latest ./web-admin
        docker push $ECR_REGISTRY/opdwallet/web-admin:latest

    - name: Build and push Member image
      run: |
        docker build -f web-member/Dockerfile.prod -t $ECR_REGISTRY/opdwallet/web-member:latest ./web-member
        docker push $ECR_REGISTRY/opdwallet/web-member:latest

    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ubuntu
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /home/ubuntu/opdwallet
          aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin ${{ env.ECR_REGISTRY }}
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d
```

## Step 5: GitHub Secrets Setup

Add these secrets in GitHub repository settings:

1. Go to: https://github.com/anilkumar1510/opdwallet/settings/secrets/actions
2. Add the following secrets:

```
AWS_ACCOUNT_ID: [Your AWS Account ID]
AWS_ACCESS_KEY_ID: [Your AWS Access Key]
AWS_SECRET_ACCESS_KEY: [Your AWS Secret Key]
EC2_HOST: 13.60.210.156
EC2_SSH_KEY: [Contents of opdwallet-server.pem file]
```

## Step 6: AWS IAM Permissions

Create an IAM user with these policies:
- AmazonEC2ContainerRegistryPowerUser
- AmazonEC2FullAccess (or limited EC2 permissions)

## Step 7: Test the Pipeline

1. Make a small change to README.md
2. Commit and push
3. Check GitHub Actions tab for workflow runs
4. Verify deployment on EC2

## Current Manual Deployment (Until CI/CD is ready)

```bash
# Use the deployment script
./deploy.sh

# Or manually:
ssh -i opdwallet-server.pem ubuntu@13.60.210.156
cd /home/ubuntu/opdwallet
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Security Notes

⚠️ **Before going to production:**
- Use AWS Secrets Manager for sensitive data
- Enable HTTPS with SSL certificates
- Set up MongoDB authentication
- Implement rate limiting
- Enable CloudWatch monitoring
- Set up backup strategy