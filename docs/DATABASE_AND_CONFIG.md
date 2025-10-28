# Database & Configuration Documentation

## Infrastructure Overview

**OPD Wallet** is a complete healthcare platform for managing OPD (Out Patient Department) insurance benefits. It provides digital wallets for members, appointment booking, video consultations, lab test ordering, and reimbursement claim processing.

### System Architecture

The system runs on **AWS EC2** using Docker containers with these components:

1. **Nginx Reverse Proxy** - Single entry point that handles SSL and routes traffic
2. **MongoDB Database** - Stores all application data
3. **NestJS API Backend** - Handles all business logic
4. **3 Next.js Web Portals** - Admin, Member, and Doctor interfaces

All services communicate through an internal Docker network. Only Nginx is exposed to the internet on ports 80 (HTTP) and 443 (HTTPS).

### Technology Stack

- **Backend**: NestJS (Node.js framework)
- **Frontend**: Next.js (React framework)
- **Database**: MongoDB 7.0
- **Reverse Proxy**: Nginx
- **Deployment**: Docker & Docker Compose
- **Video Calls**: Daily.co (migrated from Jitsi Meet)
  - Region: ap-south-1 (India/Asia-South) for optimal performance
  - Features: Screen sharing, chat, cloud recording, max 2 participants
- **Authentication**: JWT tokens with httpOnly cookies
- **PDF Generation**: PDFKit for generating prescription PDFs
- **Medical Data**:
  - 15,000+ Indian medicines database with autocomplete
  - 500+ common diagnoses with ICD-10 codes
  - 200+ symptoms categorized by body systems

---

## Database Information

**Database Name**: `opd_wallet`

**Connection Details**:
- Host: opd-mongo-prod (Docker container name)
- Port: 27017 (internal)
- Username: admin
- Connection String: `mongodb://admin:admin123@opd-mongo-prod:27017/opd_wallet?authSource=admin`

**Important**: The database name `opd_wallet` must be used consistently across all services and configurations.

---

## MongoDB Collections

### Core Collections
- **users** - All users including members, admins, doctors, TPA users, and finance users with authentication details
- **policies** - Insurance policies for corporate clients with coverage details
- **plan_configs** - Plan configurations that define wallet categories, limits, and copay percentages for each policy
- **userPolicyAssignments** - Links users to their policies with effective start and end dates

### Wallet & Financial
- **user_wallets** - Member wallet balances organized by service categories (consultation, pharmacy, diagnostics)
- **wallet_transactions** - Complete history of all wallet debits and credits with category tracking
- **payments** - Payment records for appointments and services with transaction IDs
- **transaction_summary** - Summary records of transactions for reporting

### Healthcare Providers
- **doctors** - Doctor profiles with specialties, qualifications, and contact information
- **clinics** - Physical clinic locations with addresses and facilities
- **doctor_slots** - Doctor availability schedules defining when doctors are available at which clinics
- **specialty_master** - Medical specialties catalog like cardiology, dermatology, orthopedics

### Appointments & Consultations
- **appointments** - All appointment bookings for both in-clinic visits and online consultations
- **video_consultations** - Video consultation sessions with join URLs and status tracking
- **doctor_prescriptions** - Prescriptions uploaded by doctors after consultations

### Lab Diagnostics
- **lab_services** - Catalog of all available lab tests with base pricing
- **lab_vendors** - Lab service providers with locations and contact details
- **lab_vendor_pricing** - Vendor-specific pricing for each lab test
- **lab_vendor_slots** - Vendor availability schedules for sample collection
- **lab_prescriptions** - Prescriptions uploaded by members for lab test ordering
- **lab_carts** - Shopping carts containing lab tests to be ordered
- **lab_orders** - Lab test orders with vendor assignment and collection slot

### Claims & Reimbursements
- **memberclaims** - Reimbursement claims submitted by members with documents and processing status

### Master Data
- **service_master** - Service types catalog like general consultation, specialist consultation
- **category_master** - Service categories like OPD consultation, pharmacy, diagnostics
- **relationship_masters** - Family relationship types like spouse, child, parent
- **cug_master** - Corporate User Group definitions for companies

### Digital Prescription System
- **digital_prescriptions** - Digital prescriptions created by doctors with structured medicine, lab test, diagnosis, and symptom data
- **medicine_database** - Comprehensive Indian medicine database (15,000+ medicines) with generic names, brand names, and compositions
- **diagnosis_database** - Diagnosis database with ICD-10 codes and categories (500+ diagnoses) for autocomplete
- **symptom_database** - Symptoms database categorized by body systems (200+ symptoms) for prescription writing

### System
- **notifications** - System notifications sent to users
- **auditLogs** - Audit trail of all admin actions for compliance
- **counters** - Auto-increment counters for generating sequential IDs

**Total Collections**: 34

---

## AWS Deployment Configuration

### Server Details
- **Provider**: Amazon Web Services (AWS)
- **Service**: EC2 Instance
- **IP Address**: 34.202.161.177
- **Domain**: eliktron.com
- **Operating System**: Ubuntu Linux

### URLs
- **Admin Portal**: https://eliktron.com/admin
- **Member Portal**: https://eliktron.com/ (root)
- **Doctor Portal**: https://eliktron.com/doctor
- **API Backend**: https://eliktron.com/api

### SSL Configuration
- **Certificate Provider**: Let's Encrypt (free SSL certificates)
- **Certificate Location**: `/etc/letsencrypt/live/eliktron.com/`
- **Certificate Files**:
  - Full Chain: `/etc/letsencrypt/live/eliktron.com/fullchain.pem`
  - Private Key: `/etc/letsencrypt/live/eliktron.com/privkey.pem`
- **SSL Protocols**: TLS 1.2 and TLS 1.3
- **Auto Renewal**: Let's Encrypt certificates auto-renew every 90 days
- **HTTP to HTTPS**: All HTTP traffic is automatically redirected to HTTPS

### Docker Containers

**Production containers** (defined in docker-compose.production.yml):

1. **opd-nginx-prod** - Nginx reverse proxy
   - Ports: 80 (HTTP), 443 (HTTPS)
   - Handles SSL termination and request routing

2. **opd-mongo-prod** - MongoDB database
   - Port: 27017 (internal only)
   - Volume: opdwallet_aws_mongo-data-prod (persistent storage)

3. **opd-api-prod** - NestJS API backend
   - Port: 4000 (internal only)
   - Environment: production

4. **opd-web-admin-prod** - Admin portal (Next.js)
   - Port: 3000 (internal only)
   - Base path: /admin

5. **opd-web-member-prod** - Member portal (Next.js)
   - Port: 3000 (internal only)
   - Base path: / (root)

6. **opd-web-doctor-prod** - Doctor portal (Next.js)
   - Port: 3000 (internal only)
   - Base path: /doctor
   - Note: All web portals use port 3000 internally for consistency

### Network Configuration

**Rate Limiting** (configured in Nginx):
- API endpoints: 100 requests/second per IP
- Portal pages: 200 requests/second per IP

**File Upload Limits**:
- Maximum file size: 20MB (for prescriptions, bills, documents)

**Timeouts**:
- Proxy connect: 60 seconds
- Proxy send: 60 seconds
- Proxy read: 60 seconds

### Environment Variables

**API Backend** (.env.production):
- `NODE_ENV=production`
- `MONGODB_URI=mongodb://admin:admin123@opd-mongo-prod:27017/opd_wallet?authSource=admin`
- `PORT=4000`
- `JWT_SECRET=[generated secret key]`
- `GOOGLE_MAPS_API_KEY=[API key for location services]`
- `DAILY_API_KEY=[Daily.co API key for video consultations]`

**Web Portals**:
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=/api` (browser-side calls)
- `API_URL=http://opd-api-prod:4000/api` (server-side calls)

### Security Configuration

**HTTPS Enforcement**: All HTTP requests are automatically redirected to HTTPS

**Security Headers** (added by Nginx):
- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

**Cookie Security**:
- Domain: eliktron.com
- HttpOnly: true (prevents JavaScript access)
- Secure: true (HTTPS only in production)
- SameSite: strict

**Authentication**: JWT tokens stored in httpOnly cookies with 7-day expiration

### Backup & Storage

**Database Persistence**:
- Volume name: opdwallet_aws_mongo-data-prod
- Location: /var/lib/docker/volumes/
- Type: Docker named volume (survives container restarts)

**File Uploads**:
- Prescriptions: `/api/uploads/prescriptions/`
- Claims: `/api/uploads/claims/`
- Doctor photos: `/api/uploads/doctors/`

### Monitoring

**Nginx Logs**:
- Access log: `/var/log/nginx/access.log`
- Error log: `/var/log/nginx/error.log`

**Health Check Endpoint**:
- URL: https://eliktron.com/health
- Returns: "healthy" (200 OK)

### Performance Optimization

**Gzip Compression**: Enabled for text files, CSS, JavaScript, JSON (minimum 1KB)

**Static Asset Caching**:
- Next.js static files: 1 year cache (immutable)
- Other static files: 30 days cache

**Connection Optimization**:
- Sendfile: enabled
- TCP no-push: enabled
- TCP no-delay: enabled
- Keepalive timeout: 65 seconds

---

## Deployment Commands

**Start all services**:
```bash
docker-compose -f docker-compose.production.yml up -d
```

**Stop all services**:
```bash
docker-compose -f docker-compose.production.yml down
```

**View logs**:
```bash
docker-compose -f docker-compose.production.yml logs -f [container_name]
```

**Restart specific service**:
```bash
docker restart [container_name]
```
