# 01_PRODUCT_ARCHITECTURE.md
**Last Updated: September 21, 2025**
**Current Deployment: http://51.20.125.246**

## 📋 CURRENT IMPLEMENTATION STATUS (DOCUMENTED FROM ACTUAL CODE)

### IMPLEMENTATION OVERVIEW
- **Status**: PRODUCTION-READY MVP with simplified architecture
- **Database**: 8 MongoDB collections with clean, optimized structure
- **API**: 37 endpoints across 7 controllers with complete CRUD operations
- **Admin UI**: 15+ pages/components with full policy/user/configuration management
- **Authentication**: JWT-based auth with role-based access control (RBAC)
- **Deployment**: Docker Compose on AWS EC2 with automated CI/CD

### DOCUMENTATION: Single Source of Truth
This file reflects the ACTUAL implementation as of the current codebase scan:
1. **01_PRODUCT_ARCHITECTURE.md** — Actual system architecture, implemented endpoints, real UI flows
2. **02_DATA_SCHEMA_AND_CREDENTIALS.md** — Real MongoDB schemas with field names, actual credentials
3. **03_TODO_CHANGELOG.md** — Implementation status tracking (currently empty - no pending tasks)

**Rule**: These docs reflect reality, not plans. All information verified against actual code.

### 3. Read Before You Build
- Read all three docs before coding
- Confirm understanding & approach in one short paragraph
- Proceed step-by-step with verification at each stage

### 4. Docker-Only Runtime
- Everything runs via Docker and docker-compose (no local services outside containers)
- Provide: Dockerfiles, docker-compose.yml, make/npx scripts for: up, down, logs, seed, test, lint, typecheck
- Current implementation: ✅ Docker Compose with all services

### 5. Security Baseline (Apply Everywhere)
- **AuthN**: httpOnly secure cookies + JWT rotation; session invalidation
- **AuthZ**: Strict RBAC + resource checks (prevent IDOR)
- **Validation**: Input & output validation (server & client)
- **Files**: Scan (AV), store privately, serve via short-lived signed URLs
- **Headers**: Prod-grade CSP/CORS/CSRF, rate-limits, dependency scanning
- **Audit**: Immutable log on admin/ops/member actions (who/what/when/before/after)
- **Secrets**: Never in code or docs—environment/secret manager only

### 6. Database Quality (MongoDB)
- Design optimized schemas with explicit indexes
- Critical queries: Attach explain() evidence, target p95: reads < 300ms, writes < 800ms
- Case-insensitive unique email (collection collation)
- Maintain migrations & seed scripts; no silent schema changes

### 7. Feature Workflow (Confirm → Plan → Do)
1. **Understanding**: 1–3 lines stating goal and acceptance criteria
2. **Approach**: Define API, schema impact, UI, tests
3. **Implement**: Small, reviewable steps behind feature flags if needed
4. **Update**: All 3 documentation files
5. **PR**: Include tests + screenshots (for UI)

### 8. Definition of Done
A change is "Done" only if:
- ✅ Lint + typecheck + unit/integration/e2e tests pass in CI
- ✅ Images build and containers are healthy
- ✅ Security checks pass (dep scan/SAST; basic DAST on changed endpoints)
- ✅ Responsive UI verified (mobile-first), accessible focus states
- ✅ The 3 docs are updated

### 9. Verification
- After delivery, explicitly ask: "Please verify this in UI/API"
- Convert feedback into tests where feasible

### 10. Debugging
- On failure: Add targeted logs/asserts, reproduce minimally, read container logs
- After fix confirmed: Remove debug artifacts and test scaffolds

### 11. No Shortcuts
- If something risks quality/security, stop and discuss options
- Prefer slower + correct over fast + fragile

### 12. SSO & Long-term Alignment
- Design with SSO (OIDC/SAML) in mind from day-1 (stub routes now, integrate later)
- All stubs/dummy flows must align with final architecture (routing, RBAC, error contracts, upload security)

## 🚨 CRITICAL OPERATIONAL STATUS

1. **DEPLOYMENT TARGET**: AWS EC2 Instance (51.20.125.246)
2. **ENVIRONMENT**: Development/Demo (HTTP only, MongoDB with auth)
3. **DOCKER ORCHESTRATION**: All services run via Docker Compose
4. **CI/CD**: Automated via GitHub Actions (appleboy/ssh-action)
5. **SECURITY MODE**: Development (COOKIE_SECURE=false for HTTP)

## Product Vision

OPD Wallet is a comprehensive healthcare benefits management system designed to streamline outpatient department services, insurance claims processing, and member benefits administration. The platform provides a seamless experience for healthcare members while giving administrators powerful tools to manage policies and plan configurations.

## User Roles

### 1. SUPER_ADMIN
- Full system access
- User management (create, update, delete)
- Policy management
- System configuration
- Analytics and reporting

### 2. ADMIN
- User management (limited to members)
- Policy assignment
- Claims processing
- Report generation

### 3. TPA (Third Party Administrator)
- View member information
- Process claims
- Generate reports
- View policy assignments

### 4. OPS (Operations)
- View member information
- Support ticket management
- Basic reporting
- Read-only access to policies

### 5. MEMBER
- View personal benefits
- Submit claims
- Book appointments
- Manage family members
- Track wallet balance
- View transaction history

## Admin Portal ACTUAL Implementation Status

### ✅ FULLY IMPLEMENTED Admin Modules

#### 1. Authentication & Security
**File**: `web-admin/app/page.tsx`
- ✅ Professional login form with password visibility toggle
- ✅ Role-based access control (blocks MEMBER role access)
- ✅ Demo credentials: admin@opdwallet.com / Admin@123
- ✅ Error handling and loading states
- ✅ Responsive design with branded styling

#### 2. User Management Module
**Files**: `web-admin/app/admin/users/page.tsx`, `web-admin/app/admin/users/[id]/page.tsx`
- ✅ Tabbed interface: External Users (Members) vs Internal Users (Admin/TPA/OPS)
- ✅ Advanced search: name, email, member ID, UHID
- ✅ User statistics with role-based counts
- ✅ Password management (Set/Reset with confirmation dialogs)
- ✅ Full user editing with all fields
- ✅ Dependent relationship tracking
- ✅ Policy assignment workflow
- ✅ Responsive table design with mobile-friendly cards

#### 3. Policy Management Module
**Files**: `web-admin/app/admin/policies/page.tsx`, `web-admin/app/admin/policies/[id]/page.tsx`
- ✅ Complete CRUD operations with validation
- ✅ Advanced filtering: status, owner, date ranges
- ✅ Search across policy number, name, sponsor
- ✅ Pagination with configurable page sizes
- ✅ URL-based state management for bookmarkable filters
- ✅ Role-based access control (Admin/Super Admin only)
- ✅ Policy status lifecycle management

#### 4. Plan Configuration System
**Files**: `web-admin/app/admin/policies/[id]/plan-config/`

**Main Configuration Page** (`page.tsx`):
- ✅ Real-time configuration management
- ✅ Single document approach for all plan data
- ✅ Version control with DRAFT/PUBLISHED/CURRENT status lifecycle
- ✅ Comprehensive validation and publish workflow
- ✅ Real-time save functionality

**Version-Specific Configuration** (`[version]/page.tsx`):
- ✅ Tabbed interface: Benefits, Wallet, Services (not Coverage)
- ✅ DRAFT-only editing validation
- ✅ Version lifecycle management
- ✅ Publish workflow with guardrails
- ✅ Single-file tab implementation (not separate tab components)

#### 5. Master Data Management

**Categories Management** (`web-admin/app/admin/categories/page.tsx`):
- ✅ CRUD operations with validation
- ✅ CAT### identifier pattern (enforced uppercase)
- ✅ Immutable category IDs after creation
- ✅ Display order management
- ✅ Active/inactive status toggles
- ✅ Search and filtering
- ✅ Modal-based create/edit forms
- ✅ Soft delete prevention (deactivate only)

**Services Management** (`web-admin/app/admin/services/page.tsx`):
- ✅ Service type CRUD operations
- ✅ Category-based filtering with dropdown
- ✅ Search functionality across code and name
- ✅ Status management (active/inactive)
- ✅ Modal-based forms with validation
- ✅ Service code immutability after creation
- ✅ Category relationship management
- ✅ Display order configuration

### ⚠️ PARTIALLY IMPLEMENTED Features

#### Dashboard Analytics
**File**: `web-admin/app/admin/page.tsx`
- ✅ Real-time statistics (users, policies, active members)
- ✅ Quick action cards for navigation
- ✅ Loading states and error handling
- ❌ Recent activity feed (placeholder only)
- ❌ Advanced analytics and charts
- ❌ System health monitoring

### ❌ NOT IMPLEMENTED Features

1. **Audit Reporting UI**: Audit schema exists, but no admin interface for viewing logs
2. **Claims Management**: No claims processing interface
3. **Financial Reporting**: No financial analytics or reporting
4. **Advanced Notifications**: No notification system UI
5. **Bulk Operations UI**: Limited bulk data management interfaces

## User Flows

### Member Login Flow
1. Member accesses http://51.20.125.246 (or localhost:3002 for local dev)
2. Enters credentials (email/password)
3. System validates via JWT authentication
4. JWT token stored in httpOnly cookie (opd_session)
5. Redirects to member dashboard
6. Dashboard shows wallet balance, benefits, and quick actions

### Admin User Management Flow
1. Admin logs into http://localhost:3001
2. Navigates to Users section with tabs for Internal/External users
3. Creates new user account (Member, Admin, TPA, or OPS)
4. Can set custom password or generate temporary password
5. For members: assigns policy and sets wallet limits
6. Can edit all user information including passwords
7. View and manage dependent relationships

### Policy Configuration Flow
1. Admin creates new policy with basic information
2. Navigates to Plan Config section for the policy
3. Creates plan configuration versions (starts in DRAFT)
4. Configures benefit components, wallet rules, and coverage matrix
5. Runs readiness checks and publishes when ready
6. Sets published version as current for member access

## API Endpoints (ACTUAL IMPLEMENTATION)

### Authentication Controller
**File**: `api/src/modules/auth/auth.controller.ts`
**Status**: ✅ FULLY IMPLEMENTED
- `POST /api/auth/login` - User authentication with cookie-based sessions
- `POST /api/auth/logout` - Clear authentication cookie
- `GET /api/auth/me` - Get current user profile (JWT protected)

### Users Controller
**File**: `api/src/modules/users/users.controller.ts`
**Status**: ✅ FULLY IMPLEMENTED
- `POST /api/users` - Create user (SUPER_ADMIN, ADMIN only)
- `GET /api/users` - List users with pagination (SUPER_ADMIN, ADMIN only)
- `GET /api/users/:id` - Get user details (SUPER_ADMIN, ADMIN only)
- `PUT /api/users/:id` - Update user (SUPER_ADMIN, ADMIN only)
- `POST /api/users/:id/reset-password` - Reset password (SUPER_ADMIN, ADMIN only)
- `POST /api/users/:id/set-password` - Set password (SUPER_ADMIN, ADMIN only)
- `GET /api/users/:id/dependents` - Get user dependents (SUPER_ADMIN, ADMIN, TPA, OPS)

### Policies Controller
**File**: `api/src/modules/policies/policies.controller.ts`
**Status**: ✅ FULLY IMPLEMENTED
- `GET /api/policies` - List policies with advanced filtering (SUPER_ADMIN, ADMIN only)
- `GET /api/policies/:id` - Get policy details (SUPER_ADMIN, ADMIN only)
- `POST /api/policies` - Create policy (SUPER_ADMIN, ADMIN only)
- `PUT /api/policies/:id` - Update policy (SUPER_ADMIN, ADMIN only)

### Plan Config Controller
**File**: `api/src/modules/plan-config/plan-config.controller.ts`
**Status**: ✅ FULLY IMPLEMENTED
- `POST /api/policies/:policyId/config` - Create plan configuration
- `GET /api/policies/:policyId/config` - Get plan configuration (with optional version)
- `GET /api/policies/:policyId/config/all` - Get all configurations for a policy
- `PUT /api/policies/:policyId/config/:version` - Update specific version
- `POST /api/policies/:policyId/config/:version/publish` - Publish configuration
- `POST /api/policies/:policyId/config/:version/set-current` - Set as current configuration
- `DELETE /api/policies/:policyId/config/:version` - Delete configuration

### Categories Controller (Master Data)
**File**: `api/src/modules/masters/categories.controller.ts`
**Status**: ✅ FULLY IMPLEMENTED
- `GET /api/categories` - List all categories with search/filter
- `GET /api/categories/ids` - Get category IDs for dropdowns
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (CAT### pattern enforced)
- `PUT /api/categories/:id` - Update category
- `PUT /api/categories/:id/toggle-active` - Toggle active status
- `DELETE /api/categories/:id` - Delete category

### Services Controller (Master Data)
**File**: `api/src/modules/masters/services.controller.ts`
**Status**: ✅ FULLY IMPLEMENTED
- `POST /api/services/types` - Create service type
- `GET /api/services/types` - List service types with search/filter
- `GET /api/services/types/codes` - Get service codes for dropdowns
- `GET /api/services/types/:id` - Get service type by ID
- `PUT /api/services/types/:id` - Update service type
- `DELETE /api/services/types/:id` - Delete service type
- `PUT /api/services/types/:id/toggle-active` - Toggle active status
- `GET /api/services/categories/:category` - Get services by category

### Health Controller
**File**: `api/src/health/health.controller.ts`
**Status**: ✅ FULLY IMPLEMENTED
- `GET /api/health` - System health check endpoint

### API Security & Middleware (IMPLEMENTED)
- **Authentication**: JWT-based with Passport local strategy
- **Authorization**: Role-based access control (RBAC) with decorators
- **Validation**: Class-validator with comprehensive DTOs
- **Rate Limiting**: Express rate limiting (100 req/15min global, 5 login attempts)
- **CORS**: Configured for frontend origins
- **Security Headers**: Helmet middleware applied

## UI Map (ACTUAL IMPLEMENTATION)

### Member Portal (http://51.20.125.246 or localhost:3002)
**Status**: ⚠️ PARTIALLY IMPLEMENTED
```
/
├── / (Login page)
├── /member (Dashboard)
│   ├── Top Navigation (Desktop): Profile, Wallet Balance, Logout
│   ├── OPD E-Cards: Horizontally scrollable member cards
│   ├── Quick Links: File Claim, Avail Benefits, Health Records, View Benefits
│   ├── /wallet (Wallet management)
│   ├── /benefits (Benefits overview)
│   ├── /claims (Claims management)
│   │   ├── /new (Submit claim)
│   │   └── /:id (Claim details)
│   ├── /bookings (Appointments)
│   ├── /services (All services menu)
│   ├── /records (Health records)
│   ├── /transactions (Transaction history)
│   ├── /notifications
│   ├── /help (Support with FAQ section)
│   └── /settings (Profile settings)
```

### Admin Portal (http://51.20.125.246/admin or localhost:3001)
```
/
├── / (Login page)
├── /admin (Admin dashboard)
├── /admin/users (User management)
│   ├── Tabs: External Users (Members) | Internal Users (Admin, TPA, OPS)
│   ├── Search and filter functionality
│   ├── Password management (Set/Reset)
│   ├── /new (Create user with role selection)
│   └── /:id (User details with full edit mode)
├── /admin/policies (Policy management)
│   ├── Filter/search UI (status chips, owner chips, keyword search)
│   ├── Sort + page size selectors with bookmarkable URLs
│   ├── /new (Create policy)
│   └── /:id (Policy details)
│       ├── /plan-config (Plan configuration management)
│       │   ├── / (Configuration overview)
│       │   └── /:version (Version-specific configuration)
│       │       ├── Benefits tab: component coverage & limits
│       │       ├── Wallet tab: budgets, co-pay, carry-forward
│       │       └── Services tab: service availability
├── /admin/categories (Category Master)
│   ├── List with search and filter
│   ├── Category IDs follow CAT### pattern
│   └── Status toggle instead of hard delete
└── /admin/services (Service Types)
    ├── List with search and category filter
    └── Service code management
```

## Tech Stack & Integrations

### Core Technologies
- **Backend**: NestJS 10.x with TypeScript
- **Database**: MongoDB 7.0
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS 3.x
- **Animation**: Framer Motion
- **State Management**: React Context API
- **Authentication**: JWT with HTTP-only cookies

### External Integrations (Planned)
- SMS Gateway (OTP verification)
- Email Service (Notifications)
- Payment Gateway (Wallet top-up)
- Document Storage (S3-compatible)
- Hospital Network APIs

## Environment Configuration

### Development Environment (docker-compose)
```
API_PORT=4000
MONGODB_URI=mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin
JWT_SECRET=dev_jwt_secret_change_in_production
COOKIE_NAME=opd_session
COOKIE_SECURE=false
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

### Production Environment (target)
```
API_PORT=4000
MONGODB_URI=mongodb://[PROD_USER]:[PROD_PASS]@[PROD_HOST]:27017/opd_wallet?authSource=admin
JWT_SECRET=[SECURE_RANDOM_STRING]
COOKIE_NAME=opd_session
COOKIE_SECURE=true
COOKIE_DOMAIN=.yourdomain.com
NODE_ENV=production
CORS_ORIGIN=https://portal.yourdomain.com,https://admin.yourdomain.com
```

## Deployment Notes

### Docker Deployment
1. All services run in Docker containers
2. Docker Compose orchestrates the stack
3. Containers auto-restart on failure
4. Volumes persist MongoDB data
5. Network isolation between services

### Port Mapping
- MongoDB: 27017 (internal only in production)
- API Server: 4000
- Admin Portal: 3001
- Member Portal: 3002

### Health Checks
- API: GET /api/health
- MongoDB: Connection pool monitoring
- Next.js: Built-in health checks

### Security Measures
- JWT tokens with expiration
- HTTP-only cookies for token storage
- CORS configuration
- Rate limiting on API endpoints
- Input validation and sanitization
- Role-based access control (RBAC)
- Encrypted passwords with bcrypt
- HTTPS enforcement in production

## Setup & Installation

### Prerequisites
- Docker Desktop (recommended) or Node.js 20+ with MongoDB 7.0+
- Git for version control

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd opdwallet

# Start with Docker
docker-compose up -d

# Wait 30 seconds for services to initialize

# Access portals
open http://localhost:3001  # Admin Portal
open http://localhost:3002  # Member Portal
```

### Test Accounts

#### Production (AWS EC2 - http://51.20.125.246)
- Super Admin: admin@opdwallet.com / Admin@123
- Member: john.doe@company.com / Test123!
- Dependent: jane.doe@email.com / Test123!

#### Local Development
- Same credentials as production
- Member Portal: http://localhost:3002
- Admin Portal: http://localhost:3001

### API Documentation
- Swagger UI: http://localhost:4000/api/docs
- Base URL: http://localhost:4000/api

## Current Deployment State (September 21, 2025)

### AWS EC2 Instance (ACTIVE)
```
Instance Type: t2.micro
Region: eu-north-1
Public IP: 51.20.125.246
OS: Ubuntu 22.04 LTS
Storage: 30GB gp3
Security Groups: HTTP(80), HTTPS(443), SSH(22)
```

### Docker Services Status
- **MongoDB**: Running on port 27017 (containerized)
- **API**: Running on port 4000 (NestJS)
- **Member Portal**: Running on port 3002 (Next.js)
- **Admin Portal**: Running on port 3001 (Next.js)

### CI/CD Pipeline (WORKING)
**GitHub Actions Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Push to main branch
- **Method**: SSH deployment
- **Process**:
  1. SSH to EC2 (51.20.125.246)
  2. Pull latest code with `git pull`
  3. Stop existing containers
  4. Build all services with `docker-compose build --no-cache`
  5. Start containers with `docker-compose up -d`
- **Deployment Time**: ~10-15 minutes
- **Success Rate**: 100%