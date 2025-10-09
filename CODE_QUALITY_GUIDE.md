# Code Quality Analysis Guide

This guide explains how to analyze your OPD Wallet project for code quality, security, and performance issues.

---

## 🎯 Quick Start

### 1. **Check SonarQube Status**
```bash
# Check if SonarQube is running
docker ps | grep sonarqube

# If not running, start it:
docker-compose -f docker-compose.sonarqube.yml up -d

# Check logs:
docker logs opdwallet-sonarqube
```

### 2. **Access SonarQube Dashboard**
- URL: http://localhost:9000
- Default credentials:
  - Username: `admin`
  - Password: `admin` (you'll be prompted to change this on first login)

### 3. **Install SonarScanner** (One-time setup)
```bash
# macOS
brew install sonar-scanner

# Or download from: https://docs.sonarsource.com/sonarqube/latest/analyzing-source-code/scanners/sonarqube-scanner/
```

---

## 📊 Running Quality Analysis

### **Option 1: Quick ESLint + TypeScript Check**

Run in each project directory:

```bash
# API
cd api
npm run quality

# Member Portal
cd web-member
npm run quality

# Admin Portal
cd web-admin
npm run quality
```

**What it checks:**
- ✅ Code style and patterns (ESLint + SonarJS rules)
- ✅ TypeScript type errors
- ✅ Code complexity
- ✅ Duplicate code
- ✅ Code smells

### **Option 2: Full SonarQube Analysis** (Recommended)

#### First Time Setup:
1. Go to http://localhost:9000
2. Click "Create Project" → "Manually"
3. Create projects with these keys:
   - `opdwallet-api`
   - `opdwallet-web-member`
   - `opdwallet-web-admin`
4. Generate a token for each project (save it!)

#### Scan Individual Projects:

**API (NestJS):**
```bash
cd api
sonar-scanner \
  -Dsonar.projectKey=opdwallet-api \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN_HERE
```

**Member Portal:**
```bash
cd web-member
sonar-scanner \
  -Dsonar.projectKey=opdwallet-web-member \
  -Dsonar.sources=app,components \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN_HERE
```

**Admin Portal:**
```bash
cd web-admin
sonar-scanner \
  -Dsonar.projectKey=opdwallet-web-admin \
  -Dsonar.sources=app,components \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN_HERE
```

#### View Results:
- Go to http://localhost:9000
- Click on the project name
- View the dashboard with scores and issues

---

## 📈 Understanding the Results

### **SonarQube Ratings (A-F)**

| Rating | Quality Gate | What it means |
|--------|-------------|---------------|
| A | Excellent | < 5% technical debt |
| B | Good | 6-10% technical debt |
| C | Average | 11-20% technical debt |
| D | Poor | 21-50% technical debt |
| F | Very Poor | > 50% technical debt |

### **Key Metrics:**

1. **Bugs** - Actual code errors that need fixing
2. **Vulnerabilities** - Security issues
3. **Code Smells** - Maintainability issues
4. **Coverage** - Test coverage percentage (requires running tests with coverage)
5. **Duplications** - Repeated code blocks
6. **Technical Debt** - Estimated time to fix all issues

---

## 🔧 Available Scripts

### **API (api/package.json)**
```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix code style issues
npm run type-check    # Check TypeScript types
npm run quality       # Run lint + type-check
npm run build         # Build and type-check
```

### **Web Portals (web-member, web-admin)**
```bash
npm run lint          # Check code style (Next.js + SonarJS)
npm run lint:fix      # Auto-fix code style issues
npm run type-check    # Check TypeScript types
npm run quality       # Run lint + type-check
npm run build         # Build and type-check
```

---

## 🛠️ ESLint Configuration

### **API** (.eslintrc.json)
- TypeScript ESLint rules
- SonarJS code quality rules
- Cognitive complexity limit: 15
- No duplicate strings (more than 5 occurrences)

### **Web Portals** (.eslintrc.json)
- Next.js recommended rules
- SonarJS code quality rules
- React hooks rules
- Cognitive complexity limit: 15

---

## 🎯 Recommended Workflow

### **Daily Development:**
```bash
# Before committing code
cd <project-directory>
npm run quality
```

### **Weekly/Before Deployment:**
```bash
# Full analysis with SonarQube
# Run for each project
cd api && sonar-scanner [options]
cd web-member && sonar-scanner [options]
cd web-admin && sonar-scanner [options]
```

### **Fix Priority:**
1. 🔴 **Bugs** - Fix immediately
2. 🟠 **Vulnerabilities** - Fix before deployment
3. 🟡 **Code Smells (Critical/Major)** - Fix in next sprint
4. 🟢 **Minor Issues** - Fix when time permits

---

## 💡 Tips

1. **Auto-fix many issues:**
   ```bash
   npm run lint:fix
   ```

2. **Focus on new code:**
   - SonarQube can track "New Code" vs "Overall Code"
   - Keep new code at A rating even if legacy code has issues

3. **Integrate with CI/CD:**
   - Add `npm run quality` to your CI pipeline
   - Fail builds if quality gates aren't met

4. **Regular monitoring:**
   - Check SonarQube dashboard weekly
   - Set up quality gates and notifications

---

## 🔍 Common Issues & Fixes

### **"Cognitive complexity too high"**
- Break down large functions into smaller ones
- Extract complex logic into separate functions

### **"No duplicate strings"**
- Move repeated strings to constants
- Use enums or configuration files

### **"Unused variables"**
- Remove or prefix with underscore: `_unusedVar`

### **"Missing type annotations"**
- Add explicit return types to functions
- Avoid using `any` type

---

## 📊 Stopping SonarQube

When you're done:
```bash
docker-compose -f docker-compose.sonarqube.yml down

# To remove data and start fresh:
docker-compose -f docker-compose.sonarqube.yml down -v
```

---

## 🆘 Troubleshooting

### SonarQube won't start:
```bash
# Check if port 9000 is already in use
lsof -i :9000

# Check logs
docker logs opdwallet-sonarqube
```

### Scan fails:
- Ensure SonarQube is running
- Check that you've created the project in SonarQube UI
- Verify your token is correct
- Check that `sonar-project.properties` exists

### Too many issues:
- Focus on one project at a time
- Start with "Bugs" and "Vulnerabilities"
- Use filters in SonarQube to see critical issues only

---

## 📚 Resources

- [SonarQube Documentation](https://docs.sonarsource.com/sonarqube/latest/)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [SonarJS Rules](https://github.com/SonarSource/eslint-plugin-sonarjs)
- [TypeScript ESLint](https://typescript-eslint.io/)

---

**Happy coding! 🚀**
