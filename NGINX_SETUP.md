# OPD Wallet - Nginx Reverse Proxy Setup

**Last Updated**: October 19, 2025

## Overview

All environments (local development and AWS production) now use **identical nginx reverse proxy configuration** for consistent routing across all services.

### Single Entry Point Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (Port 80/8080)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │     /      │  │   /admin   │  │  /doctor   │  │   /api  ││
│  │  (Member)  │  │   (Admin)  │  │  (Doctor)  │  │  (API)  ││
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └────┬────┘
│         │                │                │              │
│         ▼                ▼                ▼              ▼
│  web-member-dev   web-admin-dev    web-doctor-dev   api-dev
│    (port 3000)      (port 3000)      (port 3003)   (port 4000)
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Access URLs

### Local Development
- **Nginx Entry**: http://localhost:8080
- **Member Portal**: http://localhost:8080/
- **Admin Portal**: http://localhost:8080/admin
- **Doctor Portal**: http://localhost:8080/doctor
- **API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/health

### AWS Production
- **Nginx Entry**: http://your-domain.com
- **Member Portal**: http://your-domain.com/
- **Admin Portal**: http://your-domain.com/admin
- **Doctor Portal**: http://your-domain.com/doctor
- **API**: http://your-domain.com/api
- **Health Check**: http://your-domain.com/health

---

## Configuration Files

### Nginx Configs

| File | Environment | Container Names |
|------|-------------|-----------------|
| `nginx/nginx.conf` | Local Development | opd-*-dev |
| `nginx/nginx.production.conf` | AWS Production | opd-*-prod |

### Docker Compose Files

| File | Environment | Nginx Port |
|------|-------------|------------|
| `docker-compose.yml` | Local Development | 8080→80 |
| `docker-compose.production.yml` | AWS Production | 80→80 |

### Next.js Base Paths

| Portal | basePath | Served At |
|--------|----------|-----------|
| Member | (none) | `/` |
| Admin | `/admin` | `/admin` |
| Doctor | `/doctor` | `/doctor` |

---

## Starting Services

### Local Development

```bash
# Start all services with nginx
docker-compose up -d

# Check nginx logs
docker logs opd-nginx-dev -f

# Verify all services are running
docker-compose ps

# Access the application
open http://localhost:8080
```

### AWS Production

```bash
# Deploy using production compose
docker-compose -f docker-compose.production.yml up -d

# Check nginx logs
docker logs opd-nginx-prod -f

# Verify all services
docker-compose -f docker-compose.production.yml ps
```

---

## Direct Port Access (Debug Mode)

For debugging, services are still accessible on their direct ports:

### Local Development
- API: http://localhost:4000
- Admin: http://localhost:3001
- Member: http://localhost:3002
- Doctor: http://localhost:3003
- MongoDB: localhost:27017

**Note**: In production, direct ports are NOT exposed externally (only within Docker network).

---

## Environment Variables

### Browser API Calls (Client-Side)

These use `NEXT_PUBLIC_API_URL`:

**Local**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

**Production**:
```bash
NEXT_PUBLIC_API_URL=/api  # Relative path works with any domain
```

### Server-Side API Calls

These use `API_URL` (internal Docker network):

**Local**:
```bash
API_URL=http://opd-api-dev:4000/api
```

**Production**:
```bash
API_URL=http://opd-api-prod:4000/api
```

---

## Nginx Features

### Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limiting
- API endpoints: 10 requests/second (burst: 20)
- Web portals: 30 requests/second (burst: 50)

### Caching
- Static assets (_next): 1 year
- Favicon, robots.txt: 30 days
- Gzip compression enabled

### Timeouts
- Connect: 60s
- Send: 60s
- Read: 60s

---

## Troubleshooting

### 502 Bad Gateway

**Cause**: Backend service not running

```bash
# Check if all services are up
docker-compose ps

# Restart specific service
docker-compose restart web-admin

# Check service logs
docker logs opd-web-admin-dev
```

### 404 Not Found

**Cause**: Incorrect basePath or nginx routing

```bash
# Verify nginx config syntax
docker exec opd-nginx-dev nginx -t

# Reload nginx
docker exec opd-nginx-dev nginx -s reload

# Check nginx error logs
docker logs opd-nginx-dev | grep error
```

### Slow Response Times

```bash
# Check nginx access logs for timing
docker logs opd-nginx-dev | tail -100

# Check backend service health
curl http://localhost:8080/health
curl http://localhost:8080/api/health
```

---

## Deployment Checklist

When deploying to AWS, ensure:

- [ ] `docker-compose.production.yml` uses `nginx/nginx.production.conf`
- [ ] All container names use `-prod` suffix
- [ ] `NEXT_PUBLIC_API_URL=/api` (relative path)
- [ ] `API_URL` uses production container names
- [ ] Port 80 is open in AWS security group
- [ ] No external ports exposed except nginx (port 80)

---

## Migration Notes

### Before (Old Setup)
- ❌ Different configs for local vs AWS
- ❌ Direct port access (3001, 3002, 3003, 4000)
- ❌ Inconsistent API URLs
- ❌ basePath confusion

### After (New Setup)
- ✅ Identical nginx setup local & AWS
- ✅ Single entry point (port 8080 local, 80 AWS)
- ✅ Consistent routing and base paths
- ✅ Same code works everywhere

---

## Files Modified

1. `nginx/nginx.conf` - Updated container names for local dev
2. `nginx/nginx.production.conf` - Created for production
3. `docker-compose.yml` - Added nginx service
4. `docker-compose.production.yml` - Added nginx, updated all configs
5. `web-admin/next.config.js` - basePath='/admin' ✅
6. `web-doctor/next.config.js` - basePath='/doctor' ✅
7. `web-member/next.config.js` - No basePath (root) ✅

---

## Support

For issues with nginx setup:
1. Check nginx logs: `docker logs opd-nginx-dev -f`
2. Verify config syntax: `docker exec opd-nginx-dev nginx -t`
3. Restart nginx: `docker-compose restart nginx`
4. Check backend health: Visit http://localhost:8080/health
