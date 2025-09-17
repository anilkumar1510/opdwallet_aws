# GitHub Secrets Setup for CI/CD

## Required GitHub Secrets

You need to add these secrets to your repository:
**Settings → Secrets and variables → Actions → New repository secret**

### 1. EC2_HOST
- **Value**: `51.20.125.246`
- **Description**: The public IP address of your EC2 instance

### 2. EC2_SSH_KEY
- **Value**: Contents of your .pem file (the actual private key)
- **Description**: SSH private key for EC2 access
- **Format**: Should start with `-----BEGIN RSA PRIVATE KEY-----`

### 3. EC2_SSH_KEY_BASE64 (Alternative)
- **Value**: Base64 encoded version of your .pem file
- **Description**: Use this if EC2_SSH_KEY has formatting issues
- **How to create**: `base64 < your-key.pem | pbcopy` (Mac) or `base64 < your-key.pem` (Linux)

### 4. GH_TOKEN
- **Value**: Your GitHub Personal Access Token
- **Description**: For cloning private repository
- **How to create**:
  1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token (classic)
  3. Name: "EC2 Deployment"
  4. Select scope: ✅ `repo` (Full control of private repositories)
  5. Copy the token (starts with `ghp_`)

## Verification

After adding all secrets, verify they're set:
1. Go to Settings → Secrets and variables → Actions
2. You should see all 4 secrets listed

## Deployment will fail if:
- EC2_HOST is incorrect or unreachable
- EC2_SSH_KEY is not properly formatted
- GH_TOKEN doesn't have repo access
- Any secret is missing

## Testing
After setting up secrets, push any change to main branch to trigger deployment.