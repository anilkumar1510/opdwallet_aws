# AWS Deep Analysis - Current Production Configuration

**AWS IP**: 34.202.161.177
**Analysis Date**: October 19, 2025
**Status**: CRITICAL ISSUES FOUND

---

## Executive Summary

🔴 **CRITICAL**: Admin portal static files (CSS/JS) are returning 404 errors
🟢 **WORKING**: Member portal, Doctor portal, and API all functional
🟡 **ISSUE**: `/admin/api/*` routes returning Internal Server Error (500)

---

## 1. Current AWS Configuration

### A. Access URLs (All Working via Nginx)

| Portal | URL | Status | Notes |
|--------|-----|--------|-------|
| Member | `http://34.202.161.177/` | ✅ Working | Root path, no basePath |
| Admin | `http://34.202.161.177/admin` | ⚠️ Partial | HTML loads but CSS/JS 404 |
| Doctor | `http://34.202.161.177/doctor` | ✅ Working | Full working with basePath |
| API | `http://34.202.161.177/api` | ✅ Working | All endpoints responding |

### B. Nginx Configuration

**Current Setup on AWS:**
- Server: `nginx/1.29.2`
- Port: 80
- Routing: Working for all portals
- Security headers: Applied correctly
- Static file caching: Enabled

### C. Next.js Build Configuration (from HTML Response)

#### Member Portal
```json
"assetPrefix": ""
"basePath": (none)
```
**Static files**: `/_next/static/...` ✅ Working

#### Admin Portal
```json
"p": "/admin"  (basePath)
```
**Static files**: `/admin/_next/static/...` ❌ 404 Not Found

#### Doctor Portal
```json
"assetPrefix": "/doctor"
"basePath": "/doctor"
```
**Static files**: `/doctor/_next/static/...` ✅ Working

---

## 2. CRITICAL ISSUES FOUND

### Issue #1: Admin Portal Static Files Returning 404

**Problem**:
```bash
curl -I http://34.202.161.177/admin/_next/static/css/9c8b7276594f7b35.css
→ HTTP/1.1 404 Not Found
```

**Expected**: CSS file should be served
**Actual**: 404 Not Found from nginx

**Root Cause Analysis**:
1. Admin portal HTML references: `/admin/_next/static/css/...`
2. Nginx is NOT correctly proxying `/admin/_next/*` requests
3. Doctor portal works because it has both `basePath` AND `assetPrefix` set

**Impact**:
- Admin portal loads HTML but NO styling or JavaScript
- Portal appears broken/unstyled to users
- JavaScript functionality not working

---

### Issue #2: /admin/api/* Routes Failing

**Problem**:
```bash
curl http://34.202.161.177/admin/api/users/me
→ Internal Server Error (500)
```

**Expected**: Should route to API at `/api/users/me`
**Actual**: Internal Server Error

**Root Cause**:
- Admin portal makes API calls to `/admin/api/*` (because of basePath)
- Nginx needs to rewrite `/admin/api/*` → `/api/*`
- Currently not configured correctly

**Impact**:
- Admin portal cannot make ANY API calls
- Portal is completely non-functional
- Users cannot login or perform any actions

---

## 3. WORKING Configurations

### Doctor Portal (✅ Perfect Example)

**Why it works**:
1. `basePath: '/doctor'` in `next.config.js`
2. Static files correctly served at `/doctor/_next/static/...`
3. API calls work (likely using absolute paths `/api/*`)
4. Nginx correctly proxies all `/doctor/*` requests

**HTML Evidence**:
```html
<link rel="stylesheet" href="/doctor/_next/static/css/50560bbba57ad38e.css"/>
<script src="/doctor/_next/static/chunks/webpack-d97b570eeb583637.js"></script>
```

**Static File Test**:
```bash
curl -I http://34.202.161.177/doctor/_next/static/css/50560bbba57ad38e.css
→ HTTP/1.1 200 OK  ✅
```

---

## 4. Comparison: Working vs Broken

| Aspect | Doctor (✅ Working) | Admin (❌ Broken) |
|--------|---------------------|-------------------|
| basePath | `/doctor` | `/admin` |
| Static files | `/doctor/_next/...` ✅ 200 | `/admin/_next/...` ❌ 404 |
| HTML loads | ✅ Yes | ✅ Yes |
| CSS loads | ✅ Yes | ❌ No (404) |
| JS loads | ✅ Yes | ❌ No (404) |
| API calls | ✅ Works | ❌ 500 Error |

---

## 5. Required Nginx Configuration (Inferred)

### Current AWS Nginx Must Have:

**For Doctor Portal (Working)**:
```nginx
location /doctor {
    proxy_pass http://doctor_backend;  # Port 3003
    # Includes both HTML and static files
}
```

**For Admin Portal (Broken - Missing)**:
```nginx
location /admin {
    proxy_pass http://admin_backend;  # Port 3001
    # This works for HTML but NOT for static files
}

# MISSING: Static file handling for /admin/_next
location ~ ^/admin/_next {
    proxy_pass http://admin_backend;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**For API** (Also needs fixing):
```nginx
location /admin/api {
    # SHOULD rewrite to /api and pass to API backend
    rewrite ^/admin/api/(.*) /api/$1 break;
    proxy_pass http://api_backend;
}
```

---

## 6. Environment Variables on AWS (Inferred)

Based on HTML responses and working configuration:

### Member Portal
```bash
NEXT_PUBLIC_API_URL=/api  # Relative path works
```

### Admin Portal
```bash
NEXT_PUBLIC_API_URL=/api  # Should be relative, not /admin/api
# OR needs nginx rewrite
```

### Doctor Portal
```bash
NEXT_PUBLIC_API_URL=/api  # Direct API access
```

---

## 7. Container Configuration on AWS

**Running Containers** (Nginx confirmed):
- nginx (port 80) - Entry point
- API backend (internal port 4000)
- Admin portal (internal port 3001)
- Member portal (internal port 3000)
- Doctor portal (internal port 3003)

**Evidence**: Nginx server header `nginx/1.29.2` confirms reverse proxy is active

---

## 8. Routing Flow Analysis

### ✅ WORKING: Member Portal
```
Browser → http://34.202.161.177/
         ↓
    Nginx (port 80)
         ↓
    Member Backend (port 3000)
         ↓
    Static files: /_next/static/...
```

### ✅ WORKING: Doctor Portal
```
Browser → http://34.202.161.177/doctor
         ↓
    Nginx (port 80) → /doctor location
         ↓
    Doctor Backend (port 3003)
         ↓
    Static files: /doctor/_next/static/... ✅
```

### ❌ BROKEN: Admin Portal
```
Browser → http://34.202.161.177/admin
         ↓
    Nginx (port 80) → /admin location
         ↓
    Admin Backend (port 3001) → HTML ✅
         ↓
    Static files: /admin/_next/static/... ❌ 404
    (Nginx not routing these correctly)
```

---

## 9. API Call Flow

### ✅ Direct API Calls
```
Browser → http://34.202.161.177/api/health
         ↓
    Nginx → /api location
         ↓
    API Backend (port 4000) ✅
```

### ❌ Admin API Calls
```
Browser → http://34.202.161.177/admin/api/users/me
         ↓
    Nginx → ??? (No route configured)
         ↓
    500 Internal Server Error ❌
```

---

## 10. What Needs to Match on Local

To make local EXACTLY like AWS, we need:

1. **Nginx as entry point** (port 8080 local, 80 AWS)
2. **Same routing issues** - Admin portal static files must work
3. **Same basePath configs** - Already correct locally
4. **API routing** - Handle `/admin/api/*` and `/doctor/api/*`

---

## 11. Recommended Fixes for BOTH Environments

### A. Nginx Configuration Updates

**Add to both local and AWS nginx configs**:

```nginx
# Admin portal static files (CRITICAL FIX)
location ~ ^/admin/_next {
    proxy_pass http://admin_backend;
    proxy_http_version 1.1;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Admin portal API calls (rewrite to /api)
location ~ ^/admin/api/(.*) {
    proxy_pass http://api_backend/api/$1$is_args$args;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

# Doctor portal API calls (rewrite to /api)
location ~ ^/doctor/api/(.*) {
    proxy_pass http://api_backend/api/$1$is_args$args;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

### B. Next.js Config (Admin Portal)

**Possible fix in `web-admin/next.config.js`**:
```javascript
const nextConfig = {
  basePath: '/admin',
  assetPrefix: '/admin',  // ADD THIS
  // ... rest of config
}
```

---

## 12. Testing Checklist

After fixes applied, verify:

- [ ] `http://34.202.161.177/admin` - HTML loads
- [ ] `http://34.202.161.177/admin/_next/static/css/*` - CSS loads (200)
- [ ] `http://34.202.161.177/admin/_next/static/chunks/*` - JS loads (200)
- [ ] Admin portal displays WITH styling
- [ ] Admin portal JavaScript works
- [ ] Login functionality works
- [ ] API calls from admin portal work
- [ ] Same tests pass on local at `http://localhost:8080/admin`

---

## 13. Files to Update

1. **`nginx/nginx.conf`** - Add admin static file routes + API rewrites
2. **`nginx/nginx.production.conf`** - Same changes for AWS
3. **`web-admin/next.config.js`** - Add `assetPrefix: '/admin'`
4. Test and deploy

---

**Priority**: CRITICAL - Admin portal is completely broken on AWS
**ETA to Fix**: 30 minutes with proper nginx config updates
**Risk**: Low - Only adding missing routes, not changing existing working ones
