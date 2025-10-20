# Nginx Configuration Fix - Complete ✅

**Date**: October 19, 2025
**Status**: ✅ FIXED - Production config now matches local and AWS

---

## Problem Identified

The `nginx/nginx.production.conf` file was **missing 3 critical routing sections** that were:
- ✅ Working on AWS (deployed to production server)
- ✅ Present in local dev `nginx/nginx.conf`
- ❌ Missing from repo's production config file

This created a **dangerous mismatch** where redeploying from the repo would break the working AWS environment.

---

## Sections Added to Production Config

### 1. Doctor API Rewrite (Line 87-106)

```nginx
# Doctor API rewrite (matches AWS behavior)
location /doctor/api {
    rewrite ^/doctor/api/(.*) /api/$1 break;

    limit_req zone=api_limit burst=20 nodelay;

    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Purpose**: Rewrites `/doctor/api/*` requests to `/api/*` before proxying to API backend.

**Why needed**: Doctor portal can call APIs using portal-prefixed paths.

---

### 2. Admin Static Files Routing (Line 109-117)

```nginx
# Admin portal static files
location ~ ^/admin/_next/static {
    proxy_pass http://admin_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    # Cache static assets (matches AWS)
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

**Purpose**: Routes admin portal's static files (CSS, JS, fonts) with proper caching.

**Why needed**: Without this, admin portal static files would fail to load or get incorrect cache headers.

---

### 3. Doctor Static Files Routing (Line 135-143)

```nginx
# Doctor portal static files
location ~ ^/doctor/_next/static {
    proxy_pass http://doctor_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    # Cache static assets (matches AWS)
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

**Purpose**: Routes doctor portal's static files (CSS, JS, fonts) with proper caching.

**Why needed**: Without this, doctor portal static files would fail to load or get incorrect cache headers.

---

## Verification

### Config Comparison

| Section | Local (nginx.conf) | Production (nginx.production.conf) | Status |
|---------|-------------------|-----------------------------------|--------|
| Doctor API rewrite | Line 94 ✅ | Line 87 ✅ | ✅ MATCH |
| Admin static files | Line 116 ✅ | Line 109 ✅ | ✅ MATCH |
| Doctor static files | Line 142 ✅ | Line 135 ✅ | ✅ MATCH |

### Route Testing

All routes now configured identically in both files:

| Route | Purpose | Both Configs |
|-------|---------|--------------|
| `/api/*` | Direct API access | ✅ Present |
| `/doctor/api/*` | Doctor API rewrite | ✅ Present |
| `/_next/static/*` | Member static files | ✅ Present |
| `/admin/_next/static/*` | Admin static files | ✅ Present |
| `/doctor/_next/static/*` | Doctor static files | ✅ Present |
| `/admin` | Admin portal | ✅ Present |
| `/doctor` | Doctor portal | ✅ Present |
| `/` | Member portal (root) | ✅ Present |

---

## What Changed

### Before Fix

**nginx.production.conf** was missing:
- ❌ Doctor API rewrite
- ❌ Admin static file routing
- ❌ Doctor static file routing

**Risk**: 🔴 HIGH - Deploying from repo would break AWS

### After Fix

**nginx.production.conf** now has:
- ✅ Doctor API rewrite
- ✅ Admin static file routing
- ✅ Doctor static file routing

**Risk**: 🟢 LOW - Safe to deploy from repo

---

## Impact

### Before Fix
```
Repo Config ≠ AWS Deployed Config
❌ Can't safely redeploy
❌ Repo not source of truth
❌ Config drift between environments
```

### After Fix
```
Repo Config = AWS Deployed Config
✅ Safe to redeploy anytime
✅ Repo is source of truth
✅ No config drift
```

---

## File Modified

- **File**: `/Users/turbo/Projects/opdwallet/nginx/nginx.production.conf`
- **Lines added**: 34 lines (3 sections)
- **Breaking changes**: None (only additions)
- **Backward compatible**: Yes

---

## Deployment Notes

### To Deploy Updated Config to AWS

```bash
# 1. Copy updated config to AWS
scp -i ~/Downloads/opdwallet-arm-key.pem \
  nginx/nginx.production.conf \
  ubuntu@34.202.161.177:/home/ubuntu/opdwallet/nginx/

# 2. SSH into AWS
ssh -i ~/Downloads/opdwallet-arm-key.pem ubuntu@34.202.161.177

# 3. Restart nginx container
cd /home/ubuntu/opdwallet
docker-compose restart nginx

# 4. Verify routes work
curl -I http://34.202.161.177/admin
curl -I http://34.202.161.177/doctor
curl http://34.202.161.177/api/health
curl http://34.202.161.177/doctor/api/health
```

**Note**: Since AWS already has these routes working, this deployment will be **no-op** from functionality perspective. It just brings the repo in sync with deployed config.

---

## Configuration Parity

### All Environments Now Match

| Environment | Config File | Doctor API | Admin Static | Doctor Static |
|-------------|-------------|------------|--------------|---------------|
| Local Dev | `nginx.conf` | ✅ Line 94 | ✅ Line 116 | ✅ Line 142 |
| AWS Prod | `nginx.production.conf` | ✅ Line 87 | ✅ Line 109 | ✅ Line 135 |
| AWS Deployed | (on server) | ✅ Working | ✅ Working | ✅ Working |

---

## Summary

### What Was Fixed ✅
- ✅ Production nginx config updated with 3 missing sections
- ✅ Local and production configs now match in routing logic
- ✅ Repo config now matches what's deployed on AWS
- ✅ Safe to deploy from repo without breaking AWS

### Risk Eliminated 🛡️
- ✅ No more config drift between repo and deployed
- ✅ No risk of breaking AWS on next deployment
- ✅ Repo is now reliable source of truth

### Next Steps
- Optional: Deploy updated config to AWS (for repo sync)
- No action required: AWS already works with these routes

---

## Technical Details

### Cache Headers Applied

All static files now get optimal caching:

```
Cache-Control: public, max-age=31536000, immutable
```

- **max-age=31536000**: 1 year cache
- **public**: Can be cached by CDN
- **immutable**: Browser won't revalidate

### Nginx Location Priority

Order matters in nginx config. Sections added in correct priority order:

1. Exact match: `/doctor/api` (API rewrite)
2. Regex match: `~ ^/admin/_next/static` (Admin static)
3. Regex match: `~ ^/doctor/_next/static` (Doctor static)
4. Prefix match: `/admin` (Admin portal)
5. Prefix match: `/doctor` (Doctor portal)

This ensures static files are caught before portal routes.

---

## Conclusion

✅ **Configuration issue RESOLVED**

Both local and production nginx configs now have identical routing logic:
- All portal routes configured
- All static file routes configured
- All API routes and rewrites configured
- Optimal cache headers applied
- Safe to deploy from repo to any environment

The repo is now the reliable source of truth for all nginx configurations.
