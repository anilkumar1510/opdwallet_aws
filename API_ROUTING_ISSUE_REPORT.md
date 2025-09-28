# API Routing Issue Report

**Date:** 2025-09-28
**Issue:** 500 Internal Server Error when creating online consultation appointments
**Root Cause:** API requests going to wrong port

---

## Problem Summary

When clicking "Confirm Booking" for online consultations:
- **Expected:** Request goes to `http://localhost:4000/api/appointments`
- **Actual:** Request goes to `http://localhost:3002/api/appointments`
- **Result:** 500 Internal Server Error

---

## Environment Analysis

### Current Setup

**API Container:**
```
Name: opd-api-dev
Port Mapping: 0.0.0.0:4000->4000/tcp
Status: Running
Endpoint: http://localhost:4000/api/
```

**Web Member Container:**
```
Name: opd-web-member-dev
Port Mapping: 0.0.0.0:3002->3000/tcp
Status: Running
Browser Access: http://localhost:3002
```

### Next.js Configuration

**File:** `/web-member/next.config.js`

```javascript
async rewrites() {
  // In Docker, use the container name; otherwise use localhost
  const apiUrl = process.env.API_URL ?
    `${process.env.API_URL}/:path*` :
    'http://localhost:4000/api/:path*';  // ✅ Correct default

  console.log('API URL for rewrites:', apiUrl);

  return [
    {
      source: '/api/:path*',
      destination: apiUrl,  // ✅ Should proxy /api/* to localhost:4000
    },
  ];
}
```

---

## Root Cause Analysis

### Issue #1: Request Not Using Proxy

The browser is making a request to:
```
http://localhost:3002/api/appointments
```

This means:
- ✅ The `/api/` route is being hit
- ❌ But Next.js is NOT proxying it to `localhost:4000`
- ❌ Instead, it's trying to handle it as a Next.js API route (which doesn't exist)

### Issue #2: You're Using Port 3002 (Docker Container)

When you access `http://localhost:3002`:
- You're accessing the **Dockerized web-member** container
- The container is running **inside Docker network**
- The `next.config.js` rewrites **don't work properly in Docker** because:
  - Inside Docker: `localhost:4000` refers to the container itself
  - It should use the **container name** `opd-api-dev:4000` instead

### Issue #3: Environment Variable Not Set

The Docker container needs `API_URL` environment variable:
```bash
# Should be set in docker-compose.yml or .env
API_URL=http://opd-api-dev:4000/api
```

---

## Why This Worked Before (In-Clinic)

The in-clinic consultation flow probably worked because:
1. You may have tested it on a different port (3001, 3005)
2. Those might be **local Next.js dev servers** (not Docker)
3. Local dev servers can reach `localhost:4000` properly

---

## Solutions

### Solution 1: Use Local Dev Server (Recommended for Development)

**Stop using port 3002 and use the local dev server:**

```bash
# Terminal 1: Make sure API is running
docker-compose up api mongo

# Terminal 2: Run web-member locally (not in Docker)
cd web-member
PORT=3005 npm run dev
```

**Then access:** `http://localhost:3005`

**Why this works:**
- ✅ `localhost:4000` is accessible from your local machine
- ✅ Next.js rewrites work perfectly
- ✅ No Docker networking issues

---

### Solution 2: Fix Docker Configuration

**Update `docker-compose.yml`:**

```yaml
services:
  web-member:
    environment:
      - API_URL=http://opd-api-dev:4000/api  # Add this line
    ports:
      - "3002:3000"
```

**Why this works:**
- ✅ Uses Docker internal network
- ✅ `opd-api-dev` is the container hostname
- ✅ No `localhost` confusion

---

### Solution 3: Add API Route Logging

**Update `next.config.js` to debug:**

```javascript
async rewrites() {
  const apiUrl = process.env.API_URL ?
    `${process.env.API_URL}/:path*` :
    'http://localhost:4000/api/:path*';

  console.log('========================================');
  console.log('Next.js API Rewrites Configuration:');
  console.log('API_URL env:', process.env.API_URL);
  console.log('Final API URL:', apiUrl);
  console.log('========================================');

  return [
    {
      source: '/api/:path*',
      destination: apiUrl,
    },
  ];
}
```

---

## Current Status

### What's Working ✅
- API server running on `localhost:4000`
- Schema changes deployed (clinic fields optional)
- Frontend code properly sends all fields
- DTO validation accepts new fields

### What's Broken ❌
- Docker container can't reach API at `localhost:4000`
- Requests going to `localhost:3002/api` instead of proxied to `localhost:4000/api`
- 500 Internal Server Error on appointment creation

---

## Immediate Action Required

### Option A: Quick Fix (5 minutes)
```bash
# Kill Docker container
docker-compose down web-member

# Use local dev server
cd web-member
PORT=3005 npm run dev

# Access at http://localhost:3005
```

### Option B: Proper Fix (15 minutes)
1. Update `docker-compose.yml` with `API_URL` environment variable
2. Restart containers: `docker-compose down && docker-compose up`
3. Test on `http://localhost:3002`

---

## Verification Steps

After applying fix:

1. **Check Next.js logs for API URL:**
   ```
   Look for: "API URL for rewrites: http://..."
   ```

2. **Test appointment creation:**
   - Go through online consultation flow
   - Click "Confirm Booking"
   - Check browser Network tab:
     - Should show: `POST http://localhost:XXXX/api/appointments`
     - Should proxy to: `http://localhost:4000/api/appointments`
     - Should get: `201 Created` response

3. **Verify in MongoDB:**
   ```bash
   docker exec opd-mongo-dev mongosh -u admin -p admin123 \
     --authenticationDatabase admin opd_wallet \
     --eval "db.appointments.find({appointmentType: 'ONLINE'}).pretty()"
   ```

---

## Summary

**Problem:** API routing misconfiguration in Docker
**Impact:** Cannot create online consultation appointments
**Severity:** High (blocks feature completely)
**Effort to Fix:** Low (5-15 minutes)
**Recommended:** Use local dev server (PORT=3005) for development