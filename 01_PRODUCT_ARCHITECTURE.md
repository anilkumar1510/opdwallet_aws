# 01_PRODUCT_ARCHITECTURE.md
**Last Updated: September 15, 2025**
**Current Deployment: http://13.60.210.156**

## 📋 PROJECT OPERATING RULES (DO NOT DEVIATE)

### 1. Mode
- **Engineering Excellence**: Ship clean, optimized, professional code as a top-tier engineer
- **Security by Default**: Apply OWASP ASVS/Top-10, least privilege, secrets hygiene, strict validation, audit trails
- **Clarity First**: If unclear or blocked, pause and ask—no guessing, no hacks

### 2. Documentation: Single Source of Truth
Maintain these three files at repo root (update after EVERY change):
1. **01_PRODUCT_ARCHITECTURE.md** — Vision, roles, flows, endpoints, UI map, integrations, environments (AWS), deployment notes, ADRs
2. **02_DATA_SCHEMA_AND_CREDENTIALS.md** — MongoDB collections, indexes, sample docs, migrations, config keys (placeholders only), external endpoints
3. **03_TODO_CHANGELOG.md** — Task list, decisions, dated changelog (what/why/when/by whom)

**Rule**: Any PR that changes code MUST update these docs. No exceptions.

### 3. Read Before You Build
- Read all three docs (and ADRs) before coding
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

1. **DEPLOYMENT TARGET**: AWS EC2 Instance (13.60.210.156)
2. **ENVIRONMENT**: Development/Demo (HTTP only, no auth on MongoDB)
3. **DOCKER ORCHESTRATION**: All services run via Docker Compose
4. **CI/CD**: Manual deployment via SSH (GitHub Actions pending)
5. **SECURITY MODE**: Development (cookies without Secure flag)

## Product Vision

OPD Wallet is a comprehensive healthcare benefits management system designed to streamline outpatient department services, insurance claims processing, and member benefits administration. The platform provides a seamless experience for healthcare members while giving administrators powerful tools to manage policies and assignments.

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

### 3. MEMBER
- View personal benefits
- Submit claims
- Book appointments
- Manage family members
- Track wallet balance
- View transaction history

## User Flows

### Member Login Flow
1. Member accesses http://13.60.210.156 (or localhost:3002 for local dev)
2. Enters credentials (email/password)
3. System validates via JWT authentication
4. JWT token stored in httpOnly cookie (opd_session)
5. Redirects to member dashboard
6. Dashboard shows wallet balance, benefits, and quick actions

### Claim Submission Flow
1. Member clicks "File Claim" from dashboard
2. Selects claim type (OPD/IPD/Pharmacy)
3. Fills claim details and uploads documents
4. Submits for approval
5. Receives claim reference number
6. Tracks status in claims section

### Admin User Management Flow
1. Admin logs into http://localhost:3001
2. Navigates to Users section
3. Creates new member account
4. Assigns policy to member
5. Sets wallet limits and benefits
6. Member receives activation email

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/reset-password` - Reset password

### Policies
- `GET /api/policies` - List all policies
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies` - Create policy
- `PUT /api/policies/:id` - Update policy

### Assignments
- `GET /api/users/:userId/assignments` - Get user assignments
- `POST /api/users/:userId/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `POST /api/assignments/:id/end` - End assignment
- `GET /api/member/assignments` - Get member's own assignments

## UI Map

### Member Portal (http://localhost:3002)
```
/
├── / (Login page)
├── /member (Dashboard)
│   ├── /wallet (Wallet management)
│   ├── /benefits (Benefits overview)
│   │   ├── /opd
│   │   ├── /ipd
│   │   ├── /diagnostics
│   │   ├── /pharmacy
│   │   ├── /dental
│   │   ├── /vision
│   │   ├── /wellness
│   │   └── /mental-health
│   ├── /claims (Claims management)
│   │   ├── /new (Submit claim)
│   │   └── /:id (Claim details)
│   ├── /bookings (Appointments)
│   │   ├── /new (Book appointment)
│   │   └── /:id (Booking details)
│   ├── /family (Family members)
│   │   └── /add (Add member)
│   ├── /records (Medical records)
│   ├── /transactions (Transaction history)
│   ├── /notifications
│   ├── /help (Support)
│   └── /settings (Profile settings)
```

### Admin Portal (http://localhost:3001)
```
/
├── / (Login page)
├── /dashboard (Admin dashboard)
├── /users (User management)
│   ├── /new (Create user)
│   └── /:id (User details)
├── /policies (Policy management)
│   ├── /new (Create policy)
│   └── /:id (Policy details)
├── /assignments (Assignment management)
├── /claims (Claims processing)
├── /reports (Analytics)
└── /settings (System settings)
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

### Development Environment
```
API_URL=http://localhost:4000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin
JWT_SECRET=dev_jwt_secret_change_in_production
COOKIE_NAME=opd_session
NODE_ENV=development
```

### Production Environment
```
API_URL=https://api.opdwallet.com
MONGODB_URI=mongodb://[PROD_USER]:[PROD_PASS]@[PROD_HOST]:27017/opd_wallet?authSource=admin
JWT_SECRET=[SECURE_RANDOM_STRING]
COOKIE_NAME=opd_session_prod
NODE_ENV=production
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
- API: GET /health
- MongoDB: Connection pool monitoring
- Next.js: Built-in health checks

### Scaling Considerations
- API server can be horizontally scaled
- MongoDB replica set for high availability
- CDN for static assets
- Redis for session management (future)
- Load balancer for traffic distribution

### Security Measures
- JWT tokens with expiration
- HTTP-only cookies for token storage
- CORS configuration
- Rate limiting on API endpoints
- Input validation and sanitization
- Role-based access control (RBAC)
- Encrypted passwords with bcrypt
- HTTPS enforcement in production

## Mobile-First Design System

### Design Tokens
```
Colors:
- Brand: #0F766E (Teal)
- Ink: #0F172A (Dark), #64748B (Light)
- Surface: #FFFFFF (Primary), #F8FAFC (Alt)
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444

Typography:
- Font: System font stack
- Headers: Bold, responsive sizing
- Body: Regular, 16px base

Spacing:
- Base unit: 4px
- Page padding: 16px (mobile), 32px (desktop)

Breakpoints:
- Mobile: < 768px (sm: 640px)
- Tablet: 768px - 1024px (md: 768px, lg: 1024px)
- Desktop: > 1024px (xl: 1280px, 2xl: 1536px)
```

### Component Architecture
- **Reusable Components**: Card, StatusBadge, LoadingSpinner, ResponsiveWrapper, BottomNavigation
- **Layout System**: Responsive sidebar navigation with mobile support
- **Form Wizards**: Multi-step workflows for complex processes
- **Data Visualization**: Charts and progress indicators
- **Navigation Pattern**:
  - Mobile: Fixed bottom navigation with 4 main tabs (Home, Claims, Bookings, Services)
  - Desktop: Full sidebar navigation with all menu items
  - Hamburger menu on mobile contains additional items (Wallet, Records, Family, etc.)

### Responsive Design Implementation
- **Mobile-First Approach**: All components designed for mobile then enhanced for desktop
- **No Horizontal Scroll**: Content always fits within viewport width
- **Touch Targets**: Minimum 44px height/width for all interactive elements
- **Text Scaling**: Dynamic font sizes using clamp() for optimal readability
- **Grid Layouts**: Adaptive columns (1 → 2 → 3 → 4) based on screen size
- **Table Handling**: Horizontal scroll for tables on mobile with sticky headers
- **Button Groups**: Stack vertically on mobile, horizontal on desktop
- **Content Padding**: 16px mobile, 24px tablet, 32px desktop
- **Image Optimization**: Responsive images with Next.js Image component
- **Overflow Prevention**: Word-wrap and truncation for long text

### Progressive Web App Features
- Offline support with service workers
- Add to home screen capability
- Push notifications
- Background sync
- Responsive images with Next.js Image

## Performance Targets
- Lighthouse score: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)

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

#### Production (AWS EC2 - http://13.60.210.156)
- Member: member@test.com / Test123!
- Admin: admin@test.com / Test123!
- Member ID: OPD000001
- UHID: UH000001

#### Local Development
- Same credentials as production
- Member Portal: http://localhost:3002
- Admin Portal: http://localhost:3001

### API Documentation
- Swagger UI: http://localhost:4000/api/docs
- Base URL: http://localhost:4000/api

## Environments (AWS)

### AWS Account & Infrastructure
- **Account**: OPD Wallet Development (placeholder-account-id)
- **Primary Region**: eu-north-1 (Stockholm)
- **Disaster Recovery Region**: eu-west-1 (Ireland) - planned

### Runtime Configuration
- **API Server**: EC2 t3.small (current) → ECS Fargate (planned)
- **Frontend**: EC2 via Nginx (current) → CloudFront + S3 (planned)
- **Load Balancer**: None (current) → Application Load Balancer (planned)

### Networking
- **VPC**: Default VPC (development)
- **Subnets**: Public subnet only (current) → Public + Private subnets (production)
- **Security Groups**:
  - Current: All ports open to 0.0.0.0/0 (INSECURE)
  - Target: Least privilege with specific port/IP restrictions
- **NAT Gateway**: Not configured (planned for private subnets)

### Data Layer
- **MongoDB**: Self-managed on EC2 (current) → MongoDB Atlas or DocumentDB (planned)
- **Backup Policy**:
  - Current: None (CRITICAL GAP)
  - Target: Daily snapshots, 30-day retention
  - RPO: 24 hours, RTO: 4 hours

### Storage
- **S3 Buckets**:
  - `opd-wallet-uploads-dev` (planned): Member documents, prescriptions
  - `opd-wallet-backups-dev` (planned): Database backups
  - `opd-wallet-static-dev` (planned): Frontend assets
- **Encryption**: AES-256 (planned)
- **Lifecycle**: 90-day archive for documents
- **Access**: Pre-signed URLs with 15-minute expiry

### CI/CD Pipeline
- **Current**: Manual SSH deployment
- **Target**: GitHub Actions → ECR → ECS deployment
- **Container Registry**: Amazon ECR (planned)
- **Secrets Management**:
  - Current: Hardcoded in docker-compose
  - Target: AWS Secrets Manager or Systems Manager Parameter Store

### Observability
- **Logging**:
  - Current: Docker container logs only
  - Target: CloudWatch Logs with 30-day retention
- **Metrics**: CloudWatch metrics for EC2, ECS, RDS
- **Alarms**:
  - API 5xx errors > 1% (planned)
  - Response time p95 > 1s (planned)
  - Container health checks (planned)
- **Tracing**: AWS X-Ray (planned)

### DNS & TLS
- **Domain**: opdwallet.com (to be registered)
- **DNS**: Route53 hosted zone (planned)
- **SSL Certificates**: AWS Certificate Manager (planned)
- **TLS Version**: 1.2+ only

### Access Management
- **IAM Roles**:
  - EC2 instance role with minimal permissions
  - ECS task roles for service-specific access
  - Lambda execution roles (if applicable)
- **Break-glass Process**: Root account MFA, documented escalation
- **SSH Access**: Key-based only (opdwallet-server.pem)

## Current Deployment State (September 2025)

### AWS EC2 Instance (ACTIVE)
```
Instance Type: t3.small
Region: eu-north-1
Public IP: 13.60.210.156
OS: Ubuntu 24.04 LTS
Storage: 30GB gp3
Security Groups: HTTP(80), HTTPS(443), SSH(22) - All open to 0.0.0.0/0
Instance ID: [REDACTED]
```

### Docker Services Status
- **MongoDB**: Running without authentication (development mode)
- **API**: Running on port 4000 (NestJS)
- **Member Portal**: Running on port 3002 (Next.js)
- **Admin Portal**: Running on port 3001 (Next.js)
- **Nginx**: Reverse proxy on port 80

### Known Security Gaps (Development Environment)

#### 🔴 Critical for Production
1. **No HTTPS/SSL**: Running on HTTP only
2. **MongoDB without authentication**: No username/password required
3. **Cookies without Secure flag**: Required for HTTP but insecure
4. **JWT secret hardcoded**: Using development secret
5. **CORS allowing all origins**: Set to "*" for development
6. **No rate limiting implemented**: API vulnerable to abuse
7. **Secrets in docker-compose**: Should use secrets management

#### 🟡 Important Improvements
1. **No backup strategy**: MongoDB data not backed up
2. **No monitoring/logging**: No centralized logging system
3. **No health checks alerts**: Services can fail silently
4. **Default ports exposed**: MongoDB port should be closed
5. **No firewall rules**: Beyond AWS security groups
6. **No input sanitization**: XSS/SQL injection risks

### Production Migration Checklist

#### Phase 1: Security Hardening
- [ ] Configure SSL certificates (Let's Encrypt or AWS Certificate Manager)
- [ ] Enable HTTPS on Nginx
- [ ] Set NODE_ENV=production
- [ ] Enable COOKIE_SECURE=true
- [ ] Configure MongoDB authentication
- [ ] Use environment-specific secrets
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization

#### Phase 2: Infrastructure
- [ ] Set up domain name
- [ ] Configure CloudFlare or AWS WAF
- [ ] Implement backup strategy
- [ ] Set up monitoring (CloudWatch, Datadog, etc.)
- [ ] Configure log aggregation
- [ ] Set up CI/CD pipeline properly
- [ ] Implement blue-green deployment

#### Phase 3: Application Security
- [ ] Implement CSRF protection
- [ ] Add request signing for sensitive operations
- [ ] Implement audit logging
- [ ] Add 2FA for admin accounts
- [ ] Regular security scanning
- [ ] Dependency vulnerability scanning

### Current Cookie Configuration

```javascript
// Development (Current)
{
  httpOnly: true,
  secure: false,      // Allows HTTP
  sameSite: 'lax',
  maxAge: 604800000,  // 7 days
  domain: '',         // Browser handles
  path: '/'
}

// Production (Required)
{
  httpOnly: true,
  secure: true,       // HTTPS only
  sameSite: 'strict',
  maxAge: 3600000,    // 1 hour
  domain: '.yourdomain.com',
  path: '/'
}
```