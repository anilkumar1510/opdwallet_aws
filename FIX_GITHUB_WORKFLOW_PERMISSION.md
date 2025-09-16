# Fix GitHub Workflow Permission - Step by Step Guide

## Quick Fix (5 minutes)

### Step 1: Generate New Token
1. Open browser and go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: `opdwallet-workflow`
4. Set expiration (90 days recommended)
5. Select these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
6. Click **"Generate token"** at the bottom
7. **COPY THE TOKEN NOW** (you won't see it again!)

### Step 2: Update Local Git Credentials

**For Mac (your system):**
```bash
# Remove old credentials
git credential-osxkeychain erase
host=github.com
protocol=https
[press enter twice]

# Next push will ask for username and password
# Username: anilkumar1510
# Password: [PASTE YOUR NEW TOKEN HERE]
```

**Alternative method:**
```bash
# Set token directly in remote URL
git remote set-url origin https://anilkumar1510:YOUR_TOKEN_HERE@github.com/anilkumar1510/opdwallet.git
```

### Step 3: Test the Permission
```bash
# Try pushing the workflow file
git push origin main
```

## What the Token Looks Like
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Always starts with `ghp_`)

## Security Note
- Never commit the token to your repository
- Store it in a password manager
- Revoke old tokens you're not using

## Need the workflow file?
The workflow file is already created locally. Once you fix permissions, I can push it.