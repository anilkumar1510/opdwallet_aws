# 🚀 OPD Wallet - Local Development Setup Guide

## Prerequisites
- Docker Desktop installed
- Node.js 20+ (optional, only if running without Docker)
- Git

---

## 🐳 Method 1: Docker Compose (Recommended)

This method runs everything in containers - no need to install MongoDB or Node.js locally.

### Quick Start
```bash
# 1. Clone the repository (if not already done)
git clone https://github.com/anilkumar1510/opdwallet.git
cd opdwallet

# 2. Start all services
docker-compose up -d

# 3. Wait for services to start (check logs)
docker-compose logs -f

# 4. Access the applications
# Member Portal: http://localhost:3002
# Admin Portal: http://localhost:3001
# API: http://localhost:4000/api
# API Docs: http://localhost:4000/api/docs
```

### Test Credentials
- Email: `member@test.com`
- Password: `Test123!`

### Useful Docker Commands
```bash
# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# View logs for specific service
docker-compose logs -f api
docker-compose logs -f web-member
docker-compose logs -f web-admin

# Rebuild after code changes
docker-compose up -d --build

# Access MongoDB shell
docker exec -it opd-mongo mongosh -u admin -p admin123
```

---

## 💻 Method 2: Run Services Locally (Without Docker)

This method requires MongoDB installed locally.

### Prerequisites
- MongoDB 7.0+ installed and running locally
- Node.js 20+ and npm

### Setup Steps

#### 1. Install and Start MongoDB
```bash
# macOS with Homebrew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Windows/Linux - download from https://www.mongodb.com/download-center/community
```

#### 2. Create Environment Files

Create `.env` in the root directory:
```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/opd_wallet
JWT_SECRET=your-local-dev-secret-key
COOKIE_NAME=opd_session
COOKIE_SECURE=false
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax
PORT=4000
```

#### 3. Start the API Server
```bash
cd api
npm install
npm run start:dev
# API will run on http://localhost:4000
```

#### 4. Start Admin Portal (in new terminal)
```bash
cd web-admin
npm install
npm run dev
# Admin portal will run on http://localhost:3001
```

#### 5. Start Member Portal (in new terminal)
```bash
cd web-member
npm install
npm run dev
# Member portal will run on http://localhost:3002
```

---

## 🛠️ Development Workflow

### Making Changes

1. **API Changes**
   - Edit files in `/api/src`
   - The server auto-restarts with hot reload
   - Check API docs at http://localhost:4000/api/docs

2. **Frontend Changes**
   - Edit files in `/web-admin` or `/web-member`
   - Next.js hot reloads automatically
   - Changes appear instantly in browser

3. **Database Changes**
   - Connect to MongoDB: `docker exec -it opd-mongo mongosh -u admin -p admin123`
   - Switch to database: `use opd_wallet`
   - Run queries directly

### Seeding Test Data

```bash
# Run seed script to create test user
docker exec -it opd-mongo mongosh -u admin -p admin123 opd_wallet --eval '
db.users.insertOne({
  userId: "USR000001",
  uhid: "UH000001",
  memberId: "OPD000001",
  email: "member@test.com",
  passwordHash: "$2b$10$BlBrAV.EPHlwi8J4AthxAObGm6zhCVKF3SXHbi5ZICs.omu3RQL2S",
  role: "MEMBER",
  relationship: "SELF",
  name: {
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe"
  },
  phone: "+1234567890",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date()
})
'
```

---

## 🧪 Testing

### API Testing with curl
```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@test.com","password":"Test123!"}' \
  -c cookies.txt

# Get current user
curl http://localhost:4000/api/auth/me -b cookies.txt
```

### Run Tests
```bash
# API tests
cd api
npm test

# Frontend tests
cd web-member
npm test
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3002
   lsof -i :3002
   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify MongoDB authentication

3. **Docker Issues**
   ```bash
   # Reset everything
   docker-compose down -v
   docker system prune -a
   docker-compose up -d --build
   ```

4. **npm install fails**
   ```bash
   # Clear cache
   npm cache clean --force
   # Delete node_modules
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📝 Environment Variables

### Complete List for Local Development

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment mode |
| MONGODB_URI | mongodb://localhost:27017/opd_wallet | MongoDB connection |
| JWT_SECRET | dev_jwt_secret | JWT signing key |
| JWT_EXPIRY | 7d | Token expiration |
| COOKIE_NAME | opd_session | Session cookie name |
| COOKIE_SECURE | false | HTTPS only cookies |
| COOKIE_HTTPONLY | true | HTTP only cookies |
| COOKIE_SAMESITE | lax | CSRF protection |
| COOKIE_MAX_AGE | 604800000 | 7 days in ms |
| BCRYPT_ROUNDS | 10 | Password hashing |
| PORT | 4000 | API server port |
| CORS_ORIGIN | * | Allowed origins |

---

## 🔧 VS Code Setup

### Recommended Extensions
- ESLint
- Prettier
- MongoDB for VS Code
- Thunder Client (API testing)
- Docker
- GitLens

### Debug Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to API",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"],
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/api/dist/**/*.js"]
    }
  ]
}
```

---

## 📚 Useful Resources

- **API Documentation**: http://localhost:4000/api/docs
- **MongoDB Compass**: Connect to `mongodb://admin:admin123@localhost:27017`
- **React DevTools**: Chrome/Firefox extension for debugging React
- **Redux DevTools**: If using Redux (not currently implemented)

---

## 🚦 Quick Status Check

Run this script to verify everything is working:
```bash
#!/bin/bash
echo "Checking services..."
echo -n "MongoDB: "
curl -s http://localhost:27017 > /dev/null && echo "✅ Running" || echo "❌ Not running"
echo -n "API: "
curl -s http://localhost:4000/api/health > /dev/null && echo "✅ Running" || echo "❌ Not running"
echo -n "Admin Portal: "
curl -s http://localhost:3001 > /dev/null && echo "✅ Running" || echo "❌ Not running"
echo -n "Member Portal: "
curl -s http://localhost:3002 > /dev/null && echo "✅ Running" || echo "❌ Not running"
```

---

## 💡 Tips

1. **Use Docker** for consistency across team members
2. **Check logs** when something doesn't work: `docker-compose logs -f`
3. **Keep services running** in background: `docker-compose up -d`
4. **Use Postman/Insomnia** for API testing
5. **Enable debug mode** in VS Code for better debugging experience

---

Happy Coding! 🎉