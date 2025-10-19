# Development Setup Guide - OPD Wallet

**Last Updated**: October 19, 2025
**Version**: 2.0 - Production-Like Development Environment

---

## 🎯 Overview

This guide explains how to set up a **production-like development environment** on your local machine. The new setup mirrors the AWS production environment exactly, ensuring consistency across the team and catching issues before deployment.

### Why Production-Like Development?

**Problems with Old Setup:**
- ❌ Each developer had different data (local MongoDB)
- ❌ Different URL structure (ports vs paths)
- ❌ No nginx locally (but used in production)
- ❌ Hard to debug production-specific issues

**Benefits of New Setup:**
- ✅ All team members share the same AWS dev database
- ✅ Nginx reverse proxy locally (just like production)
- ✅ Same URL structure: `http://localhost/admin` not `http://localhost:3001`
- ✅ Catches routing and proxy issues before deployment
- ✅ Still supports hot reload for fast development

---

## 📋 Prerequisites

### Required Software
- **Docker Desktop** (latest version)
  - Download: https://www.docker.com/products/docker-desktop
  - Ensure it's running before starting development
- **Git** (for cloning the repository)
- **Node.js 20+** (for local npm commands if needed)
- **Make** (comes with macOS/Linux, Windows needs installation)

### Network Access
- Stable internet connection (to connect to AWS dev database)
- VPN access (if required by your organization)

### AWS Access
- AWS dev database should be running on: `51.20.125.246:27017`
- Port 27017 must be accessible from your IP
- Contact DevOps if you cannot connect

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Clone the repository
git clone <repository-url>
cd opdwallet_aws

# 2. Start the production-like dev environment
make dev-prod-like

# 3. Access the application
# Open browser: http://localhost/admin
```

That's it! You're now running a production-like environment locally.

---

## 📖 Detailed Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd opdwallet_aws
```

### Step 2: Environment Configuration (Optional)

The project comes with `.env.dev` pre-configured. You only need to customize if:
- AWS IP has changed
- You need a different Google Maps API key
- You want custom settings

**To customize:**

```bash
# Copy the dev environment file (optional)
cp .env.dev .env.dev.local

# Edit your local copy
# Update MONGODB_URI if AWS IP changed
# Add your GOOGLE_MAPS_API_KEY
```

**Default configuration (`.env.dev`):**
```bash
# Local MongoDB container
MONGODB_URI=mongodb://admin:admin123@mongo:27017/opd_wallet_dev?authSource=admin

# All services accessed via nginx
NEXT_PUBLIC_API_URL=http://localhost/api
```

### Step 3: Start the Development Environment

```bash
make dev-prod-like
```

**What this does:**
1. Starts local MongoDB container
2. Starts nginx reverse proxy on port 80
3. Starts API service (connects to local MongoDB)
4. Starts Admin, Member, and Doctor portals
5. Sets up development mode with hot reload
6. Configures path-based routing (like production)

**Output:**
```
🚀 Starting production-like development environment...

Features:
  ✅ Nginx reverse proxy (like production)
  ✅ Local MongoDB (fast, offline development)
  ✅ Same URL structure as production
  ✅ Hot reload enabled for development

✅ Environment started successfully!

📍 Access your application:
   Member Portal:     http://localhost/
   Admin Portal:      http://localhost/admin
   Operations Portal: http://localhost/operations
   TPA Portal:        http://localhost/tpa
   Doctor Portal:     http://localhost/doctor
   API:               http://localhost/api
   Health Check:      http://localhost/health
```

### Step 4: Verify Everything is Running

```bash
# Check service status
make dev-prod-like-status

# Or use Docker directly
docker ps
```

**You should see these containers:**
- `opd-mongo-dev` (MongoDB database)
- `opd-nginx-dev` (nginx reverse proxy)
- `opd-api-dev` (NestJS API)
- `opd-web-admin-dev` (Admin portal)
- `opd-web-member-dev` (Member portal)
- `opd-web-doctor-dev` (Doctor portal)

### Step 5: Test the Application

**Open your browser and test each portal:**

1. **Member Portal**: http://localhost/
   - Should load the landing page
   - Login with test credentials

2. **Admin Portal**: http://localhost/admin
   - Should load admin dashboard
   - Login with admin credentials

3. **Operations Portal**: http://localhost/operations
   - Should load operations dashboard
   - Login with OPS role credentials

4. **Doctor Portal**: http://localhost/doctor
   - Should load doctor dashboard
   - Login with doctor credentials

5. **API Health Check**: http://localhost/health
   - Should return: `healthy - development environment`

---

## 🛠️ Daily Development Workflow

### Starting Work

```bash
# Start the environment
make dev-prod-like

# View logs (all services)
make dev-prod-like-logs

# Or view specific service logs
make dev-prod-like-logs-api      # API only
make dev-prod-like-logs-admin    # Admin portal only
make dev-prod-like-logs-member   # Member portal only
```

### Making Code Changes

**The environment supports hot reload:**
- Edit files in `api/`, `web-admin/`, `web-member/`, `web-doctor/`
- Changes are automatically detected
- Refresh your browser to see changes

**Example: Edit Admin Portal**
```bash
# 1. Edit a file
code web-admin/app/admin/page.tsx

# 2. Save the file
# 3. Wait for Next.js to recompile (see logs)
# 4. Refresh browser at http://localhost/admin
```

### Viewing Logs

```bash
# All logs (follow mode)
make dev-prod-like-logs

# API logs only
make dev-prod-like-logs-api

# Admin portal logs only
make dev-prod-like-logs-admin

# Nginx logs only
make dev-prod-like-logs-nginx
```

### Stopping Work

```bash
# Stop all services
make dev-prod-like-down

# Or stop and restart (if you need to)
make dev-prod-like-restart
```

---

## 🔧 Common Tasks

### Rebuild After Major Changes

If you pull changes that include `package.json` updates or Docker configuration changes:

```bash
# Stop environment
make dev-prod-like-down

# Rebuild from scratch
make dev-prod-like-build

# Start fresh
make dev-prod-like
```

### Access MongoDB Directly

Your local MongoDB is accessible at `localhost:27017`:

```bash
# MongoDB Connection String
mongodb://admin:admin123@localhost:27017/opd_wallet_dev?authSource=admin

# Using mongosh (MongoDB Shell)
mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet_dev?authSource=admin"

# Using MongoDB Compass (GUI)
# Connection String: mongodb://admin:admin123@localhost:27017/opd_wallet_dev?authSource=admin

# Or access via Docker
docker exec -it opd-mongo-dev mongosh -u admin -p admin123 --authenticationDatabase admin opd_wallet_dev
```

### Seed the Database

If the dev database needs sample data:

```bash
# SSH into the API container
docker exec -it opd-api-dev sh

# Run seed commands
npm run seed
npm run seed:masters

# Exit container
exit
```

### Clean Restart

If things get weird, clean restart:

```bash
# Stop everything
make dev-prod-like-down

# Remove all containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Start fresh
make dev-prod-like
```

---

## 🐛 Troubleshooting

### Issue: Cannot Access http://localhost

**Symptoms:**
- Browser shows "Connection refused"
- `curl http://localhost` fails

**Solution:**
1. Check if nginx is running:
   ```bash
   docker ps | grep nginx
   ```
2. Check nginx logs:
   ```bash
   make dev-prod-like-logs-nginx
   ```
3. Restart environment:
   ```bash
   make dev-prod-like-restart
   ```

### Issue: Cannot Connect to MongoDB

**Symptoms:**
- API logs show `MongooseError: Cannot connect`
- Services fail to start

**Solutions:**

1. **Check MongoDB container is running:**
   ```bash
   docker ps | grep opd-mongo-dev
   ```

2. **Check MongoDB logs:**
   ```bash
   docker logs opd-mongo-dev
   ```

3. **Restart MongoDB:**
   ```bash
   docker-compose -f docker-compose.dev.yml restart mongo
   ```

4. **Test MongoDB connection:**
   ```bash
   docker exec -it opd-mongo-dev mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.adminCommand('ping')"
   ```

### Issue: Hot Reload Not Working

**Symptoms:**
- Changes to code don't appear in browser
- Have to restart containers to see changes

**Solutions:**

1. **Check file watching:**
   ```bash
   # View logs for the portal you're working on
   make dev-prod-like-logs-admin  # or -member, -api

   # Look for "compiled successfully" messages
   ```

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

3. **Restart the specific service:**
   ```bash
   docker-compose -f docker-compose.dev.yml restart web-admin
   ```

### Issue: Port 80 Already in Use

**Symptoms:**
- Error: `bind: address already in use`
- nginx container fails to start

**Solutions:**

1. **Check what's using port 80:**
   ```bash
   # Windows
   netstat -ano | findstr :80

   # macOS/Linux
   lsof -i :80
   ```

2. **Stop conflicting service:**
   - Apache/IIS/other web servers
   - Other Docker containers

3. **Use alternative port (temporary workaround):**
   Edit `docker-compose.dev.yml`:
   ```yaml
   nginx:
     ports:
       - "8080:80"  # Use port 8080 instead
   ```
   Access via: `http://localhost:8080/admin`

### Issue: 404 Not Found for /admin or /doctor

**Symptoms:**
- `http://localhost/` works
- `http://localhost/admin` shows 404

**Solutions:**

1. **Check portal is running:**
   ```bash
   docker ps | grep admin
   ```

2. **Check nginx routing:**
   ```bash
   make dev-prod-like-logs-nginx
   # Look for routing errors
   ```

3. **Verify basePath configuration:**
   - Check `web-admin/next.config.js` has `basePath: '/admin'`
   - Check `web-doctor/next.config.js` has `basePath: '/doctor'`

### Issue: API Returns CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls fail from frontend

**Solutions:**

1. **Check API is accessible:**
   ```bash
   curl http://localhost/api/health
   ```

2. **Verify nginx CORS headers:**
   - Check `nginx/nginx.dev.conf` has CORS headers
   - Restart nginx: `docker-compose -f docker-compose.dev.yml restart nginx`

3. **Check environment variables:**
   - Ensure `NEXT_PUBLIC_API_URL=http://localhost/api` in portals

---

## 📚 Available Commands

### Primary Commands

| Command | Description |
|---------|-------------|
| `make dev-prod-like` | Start production-like development environment |
| `make dev-prod-like-down` | Stop development environment |
| `make dev-prod-like-logs` | View all logs |
| `make dev-prod-like-restart` | Restart environment |
| `make dev-prod-like-status` | Check service status |

### Log Commands

| Command | Description |
|---------|-------------|
| `make dev-prod-like-logs-api` | View API logs only |
| `make dev-prod-like-logs-admin` | View admin portal logs |
| `make dev-prod-like-logs-member` | View member portal logs |
| `make dev-prod-like-logs-doctor` | View doctor portal logs |
| `make dev-prod-like-logs-nginx` | View nginx logs |

### Utility Commands

| Command | Description |
|---------|-------------|
| `make dev-prod-like-build` | Rebuild all images |
| `make help` | Show all available commands |

---

## 🔐 Credentials

### Development Database (Local)

```
Host: localhost
Port: 27017
Database: opd_wallet_dev
Username: admin
Password: admin123
Auth DB: admin
Connection: mongodb://admin:admin123@localhost:27017/opd_wallet_dev?authSource=admin
```

### Test User Accounts

**Admin User:**
```
Email: admin@opdwallet.com
Password: Admin@123
Role: ADMIN
```

**Member User:**
```
Email: member@test.com
Password: Member@123
Role: MEMBER
```

**Doctor User:**
```
Email: doctor@test.com
Password: Doctor@123
Role: DOCTOR
```

**OPS User:**
```
Email: ops@opdwallet.com
Password: Ops@123
Role: OPS
```

---

## 🆚 Comparison: Old vs New Setup

| Feature | Old Setup (Legacy) | New Setup (Production-Like) |
|---------|-------------------|---------------------------|
| **Database** | Local MongoDB per developer | Local MongoDB per developer |
| **Data Consistency** | Each developer has own data | Each developer has own data |
| **URL Structure** | `localhost:3001`, `localhost:3002` | `localhost/admin`, `localhost/` |
| **Nginx** | ❌ Not used locally | ✅ Used locally (like prod) |
| **Routing** | Direct port access | Path-based routing |
| **Hot Reload** | ✅ Supported | ✅ Still supported |
| **Production Parity** | ❌ Very different from prod | ✅ Mirrors production (except DB location) |
| **Offline Work** | ✅ Works offline | ✅ Works offline |

---

## 💡 Best Practices

### DO:
- ✅ Always use `make dev-prod-like` for development
- ✅ Test on all portals before committing
- ✅ Seed your local database regularly
- ✅ Check logs when something doesn't work
- ✅ Pull latest code regularly
- ✅ Share database dumps with team if needed

### DON'T:
- ❌ Don't use old `docker-compose.yml` for development
- ❌ Don't commit `.env.dev.local` (it's in .gitignore)
- ❌ Don't change nginx config without team discussion
- ❌ Don't use production database for development
- ❌ Don't forget to seed master data after fresh setup

---

## 🚀 Next Steps

1. **Set up your IDE**
   - Configure ESLint and Prettier
   - Install recommended extensions

2. **Familiarize with the codebase**
   - Read `docs/DOCUMENTATION_INDEX.md`
   - Review architecture diagrams

3. **Run tests**
   - Unit tests: `cd api && npm test`
   - E2E tests: See testing documentation

4. **Start contributing**
   - Pick an issue from the backlog
   - Create a feature branch
   - Make changes and test locally
   - Submit PR for review

---

## 📞 Support

**Issues with setup?**
- Check this guide's troubleshooting section
- Search existing GitHub issues
- Ask in team Slack channel
- Contact DevOps for infrastructure issues

**Need access?**
- AWS database access: Contact DevOps
- Repository access: Contact Team Lead
- VPN access: Contact IT

---

**Happy Coding! 🎉**
