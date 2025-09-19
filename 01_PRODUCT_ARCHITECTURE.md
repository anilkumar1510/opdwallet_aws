# 01_PRODUCT_ARCHITECTURE.md
**Last Updated: September 19, 2025**
**Current Deployment: http://51.20.125.246**

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

1. **DEPLOYMENT TARGET**: AWS EC2 Instance (51.20.125.246)
2. **ENVIRONMENT**: Development/Demo (HTTP only, MongoDB with auth)
3. **DOCKER ORCHESTRATION**: All services run via Docker Compose
4. **CI/CD**: Automated via GitHub Actions (appleboy/ssh-action)
5. **SECURITY MODE**: Development (COOKIE_SECURE=false for HTTP)

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

## Admin Portal Complete Feature Set

### Implemented Admin Modules

#### 1. User Management Module
- **User Creation**: Support for all roles (SUPER_ADMIN, ADMIN, TPA, OPS, MEMBER)
- **Tabbed Interface**: External Users (Members) vs Internal Users (Admin/TPA/OPS)
- **Password Management**: Set custom or generate temporary passwords
- **User Editing**: Full edit capabilities for all user fields
- **Dependent Management**: View and manage family relationships
- **Policy Assignment**: Assign policies to members with date tracking
- **Search & Filter**: Advanced filtering by role, status, and text search
- **Bulk Actions**: Export user lists, bulk status updates

#### 2. Policy Management Module
- **Policy CRUD**: Create, read, update policies with full field control
- **Advanced Filtering**: Multi-select filters for status and ownerPayer
- **Search**: Across policy number, name, and sponsor name
- **Plan Versions**: Full lifecycle management (DRAFT → PUBLISHED → CURRENT)
- **Version Configuration**: Tabbed interface for Benefits, Wallet, Coverage
- **Policy Rules Mapping**: Map/unmap rules with wallet limits
- **Assignment Override**: Cohort-specific plan version assignments
- **Audit Trail**: Track all policy changes and version publications

#### 3. Plan Version Configuration
- **Benefits Tab**: Configure 8 OPD benefit components
  - Consultation, Pharmacy, Diagnostics, AHC
  - Vaccination, Dental, Vision, Wellness
  - Set limits: annual amount, visits, Rx requirements
- **Wallet Tab**: Configure wallet rules
  - Total annual amount, per claim limits
  - Co-pay (percentage or fixed amount)
  - Partial payment, carry forward, top-up settings
- **Edit Control**: Only DRAFT versions editable, PUBLISHED locked
- **Validation**: Business rule enforcement before publishing
- **Save Functionality**: Persistent save button with real-time updates

#### 4. Policy Rules Module
- **Rule Creation**: Auto-generated rule codes (RULE###)
- **Wallet Configuration**: Total amount and category-wise limits
- **12 Categories**: Predefined healthcare service categories
- **Rule Mapping**: Associate rules with multiple policies
- **Active/Inactive Toggle**: Enable/disable rules without deletion
- **Impact Preview**: See affected policies before changes

#### 5. Categories Master Module
- **Category Management**: CAT### identifier pattern (enforced uppercase)
- **Immutable IDs**: Category IDs cannot be changed after creation
- **Editable Fields**: Name, description, display order
- **No Hard Delete**: Toggle active/inactive status only
- **Service Mapping**: Link categories to service types

#### 6. Service Types Module
- **Service Definition**: Domain-specific codes (e.g., CON001)
- **Coverage Configuration**: Set coverage percentages and copay
- **Document Requirements**: Configure required documents
- **Pre-authorization**: Set pre-auth and referral flags
- **Price Ranges**: Define min/max pricing bands
- **Category Association**: Link services to categories

#### 7. Assignments Module
- **Policy Assignment**: Assign policies to members
- **Plan Version Override**: Cohort-specific version assignments
- **Date Management**: Effective from/to date tracking
- **Assignment History**: View all past assignments
- **Bulk Assignment**: Assign policies to multiple members
- **End Assignment**: Terminate with reason tracking

#### 8. Audit & Compliance Module
- **Audit Logs**: Track all admin actions (who/what/when)
- **Before/After States**: Record state changes
- **System Actions**: Differentiate system vs user actions
- **Export Capability**: Download audit logs for compliance
- **2-Year Retention**: Automatic cleanup after retention period

#### 9. Dashboard & Analytics
- **Aggregate Metrics**: Total users, active policies, assignments
- **Quick Navigation**: Action cards for common tasks
- **Recent Activity**: Last 10 admin actions
- **System Health**: Service status indicators

## User Flows

### Member Login Flow
1. Member accesses http://51.20.125.246 (or localhost:3002 for local dev)
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
2. Navigates to Users section with tabs for Internal/External users
3. Creates new user account (Member, Admin, TPA, or OPS)
4. Can set custom password or generate temporary password
5. For members: assigns policy and sets wallet limits
6. Can edit all user information including passwords
7. View and manage dependent relationships

### Policy Configuration Flow
1. Admin creates policy rules defining wallet limits
2. Sets total wallet amount and category-wise limits
3. Maps policy rules to specific policies
4. When member is assigned a policy, they inherit the rules
5. System enforces category limits during claims/benefits

### Plan Versions & Benefit Components Flow (v1)
1. Admin navigates to Policy → Plan Versions tab
2. Creates new plan version (initially in DRAFT status)
3. Clicks "Configure" for any version to access tabbed configuration page
4. **Benefits Tab**: Toggles individual OPD benefit components on/off:
   - Consultation, Pharmacy, Diagnostics, AHC (Annual Health Checkup)
   - Vaccination, Dental, Vision, Wellness
   - Sets optional limits per component (annual amount, visits, Rx required)
   - Adds notes field (500 chars) for additional context per component
5. **Wallet Tab**: Configures wallet rules and payment parameters
6. **Edit Rule**: Only DRAFT versions can be edited; PUBLISHED versions are read-only
7. **Publish Guardrails**: System validates completeness before allowing publish:
   - At least one benefit component must be enabled
   - Wallet rules must have valid annual limit
   - Date ranges must be valid (effectiveTo > effectiveFrom)
8. Publishes version when ready (cannot be unpublished)
9. Makes a published version "Current" for the policy
10. Members see only enabled components in their portal via Effective Config Resolver

### Wallet Rules Configuration Flow (v1)
1. Admin navigates to Policy → Plan Versions tab
2. Clicks "Configure" button for any plan version (navigates to config page)
3. Switches to "Wallet" tab and configures OPD wallet parameters:
   - **Total Annual Amount**: Maximum wallet funding per year (required)
   - **Per Claim Limit**: Optional cap on individual claim amounts
   - **Co-pay**: Member's share (percentage or fixed amount)
   - **Partial Payment**: Enable/disable partial claim payments
   - **Carry Forward**: Configure unused balance carry-over (percentage, duration)
   - **Top-up**: Allow members to add funds beyond annual limit
4. **Edit Rule**: Only DRAFT versions can be edited; PUBLISHED versions are read-only
5. **Validation**: System enforces business rules:
   - Annual amount must be positive
   - Co-pay percentage between 0-100%
   - Carry forward percentage between 0-100%
6. Member portal displays wallet rules via Effective Config Resolver:
   - Benefits page: Shows annual limit, co-pay, carry-forward status
   - Claims submission: Displays applicable limits and co-pay before submit

### Plan Version Configuration Page (v2 - Enhanced)
1. **Route**: `/admin/policies/:policyId/plan-versions/:version/config`
2. **Readiness Panel** (NEW):
   - Real-time validation status display (READY/BLOCKED)
   - Visual pass/fail indicators for each check
   - Auto-expands when validation fails
   - Integrated publish button (disabled when blocked)
   - Refresh button for re-validation
3. **Effective Config Preview** (NEW):
   - Shows exact payload members will receive
   - Collapsible sections: Policy, Wallet, Benefits, Coverage
   - Visual indicators for enabled/disabled benefits
   - Currency formatting and date localization
4. **Tabbed Interface**:
   - **Benefits Tab**: Configure which OPD tiles are enabled/disabled (v0)
   - **Wallet Tab**: Configure wallet rules and payment parameters (v0)
   - **Coverage Tab**: Map categories and services availability (v1)
5. **Readiness Checks** (Server-Side Guardrails):
   - Version must be in DRAFT status to publish
   - Valid dates within policy window
   - Wallet configuration: totalAnnualAmount > 0 required
   - At least one benefit component enabled
   - Coverage matrix required for enabled services (Diagnostics, Consultation, Pharmacy)
6. **Coverage Matrix (v1)**:
   - Maps Categories (CAT###) and Service Types to policy + planVersion
   - Controls availability only (no pricing/adjudication)
   - Table with filters: category dropdown, search, "show enabled only"
   - Bulk actions: enable/disable all in category
   - Inline edits with optimistic UI
7. **Edit Permissions**: Only DRAFT plan versions can be edited
8. **Member Impact**: Coverage matrix filters what members see in benefits portal

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
- `POST /api/users/:id/set-password` - Set custom password
- `GET /api/users/:id/dependents` - Get user's dependents

### Policies
- `GET /api/policies` - List all policies with advanced filtering
  - Query params: page, pageSize, q (search), status[], ownerPayer[], dateFrom, dateTo, sortBy, sortDir
  - Returns paginated response with data/items array, total count, page info
  - Supports multi-select filters for status and ownerPayer
  - Search works across policyNumber, name, and sponsorName fields
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies` - Create policy
- `PUT /api/policies/:id` - Update policy

### Assignments
- `GET /api/users/:userId/assignments` - Get user assignments
- `POST /api/users/:userId/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `POST /api/assignments/:id/end` - End assignment
- `GET /api/member/assignments` - Get member's own assignments

### Policy Rules
- `GET /api/policy-rules/rules` - List all policy rules
- `GET /api/policy-rules/rules/:id` - Get policy rule by ID
- `POST /api/policy-rules/rules` - Create policy rule (auto-generates code)
- `PUT /api/policy-rules/rules/:id` - Update policy rule
- `DELETE /api/policy-rules/rules/:id` - Delete policy rule
- `PUT /api/policy-rules/rules/:id/toggle-active` - Toggle rule active status

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (requires CAT### identifier, stored uppercase)
- `PUT /api/categories/:id` - Update category (name/description/display order only)
- `DELETE /api/categories/:id` - Not allowed (API responds with validation error; use toggle active)

### Service Types
- `GET /api/service-types` - List all service types
- `GET /api/service-types/:id` - Get service type by ID
- `POST /api/service-types` - Create service type (requires business-defined code)
- `PUT /api/service-types/:id` - Update service type
- `DELETE /api/service-types/:id` - Delete service type

### Plan Versions & Configuration
- `GET /api/admin/policies/:id/plan-versions` - List versions for a policy
- `POST /api/admin/policies/:id/plan-versions` - Create new version (DRAFT)
- `POST /api/admin/policies/:id/plan-versions/:ver/publish` - Publish version with guardrails
- `PATCH /api/admin/policies/:id/plan-versions/current` - Make version current
- `GET /api/admin/policies/:id/plan-versions/:ver/benefit-components` - Get benefit config
- `PUT /api/admin/policies/:id/plan-versions/:ver/benefit-components` - Update benefit config (DRAFT only)
- `GET /api/admin/policies/:id/plan-versions/:ver/wallet-rules` - Get wallet rules
- `PUT /api/admin/policies/:id/plan-versions/:ver/wallet-rules` - Update wallet rules (DRAFT only)
- `GET /api/admin/policies/:id/plan-versions/:ver/readiness` - Check publish readiness (NEW)
- `GET /api/admin/policies/:id/plan-versions/:ver/effective-config` - Get member view config (NEW)
- `GET /api/plan-config/effective?policyId=X&planVersion=Y` - Admin effective config
- `GET /api/member/plan-config` - Member's effective configuration
- `GET /api/member/benefit-components` - Get member's enabled benefits

### Effective Config Resolver
- `GET /api/plan-config/effective?policyId=X&planVersion=Y` - Get effective config for admin
- `GET /api/member/plan-config` - Get member's effective configuration
- `GET /api/admin/policies/:id/plan-versions/:ver/readiness` - Check publish readiness
  - Returns validation status, missing requirements, and preview diff

### Coverage Matrix
- `GET /api/admin/policies/:id/plan-versions/:ver/coverage` - Get coverage matrix for a plan version
- `PUT /api/admin/policies/:id/plan-versions/:ver/coverage` - Update coverage matrix (DRAFT only)
- `GET /api/member/coverage-matrix` - Get member's applicable coverage (enabled items only)

## UI Map

### Member Portal (http://51.20.125.246 or localhost:3002)
```
/
├── / (Login page)
├── /member (Dashboard)
│   ├── Top Navigation (Desktop): Profile, Wallet Balance, Logout
│   ├── OPD E-Cards: Horizontally scrollable member cards
│   ├── Quick Links: File Claim, Avail Benefits, Health Records, View Benefits
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
│   ├── /services (All services menu)
│   ├── /records (Health records - prescriptions and bills)
│   ├── /transactions (Transaction history)
│   ├── /notifications
│   ├── /help (Support with FAQ section)
│   └── /settings (Profile settings)
```

Navigation Pattern:
- Mobile: Bottom navigation bar (Home, Claims, Bookings, Services)
- Desktop: Top navigation bar with all menu items
- No hamburger menu on any screen

### Admin Portal (http://51.20.125.246/admin or localhost:3001)
```
/
├── / (Login page)
├── /dashboard (Admin dashboard)
├── /users (User management)
│   ├── Tabs: External Users (Members) | Internal Users (Admin, TPA, OPS)
│   ├── Search and filter functionality
│   ├── Clickable rows for navigation
│   ├── Password management (Set/Reset)
│   ├── /new (Create user with role selection)
│   └── /:id (User details with full edit mode)
│       ├── Edit all user information
│       ├── Change password functionality
│       ├── View dependents (for primary members)
│       └── Relationship tracking
├── /policies (Policy management)
│   ├── Advanced filtering with URL state management
│   ├── Multi-select filters for status and ownerPayer
│   ├── Search across policy number, name, and sponsor
│   ├── Desktop table view / Mobile card view
│   ├── Row actions: View, Versions, Assign, Edit
│   ├── RBAC enforcement (ADMIN/SUPER_ADMIN only)
│   ├── Server-side pagination with bookmarkable URLs
│   ├── /new (Create policy)
│   └── /:id (Policy details with rule mapping)
│       ├── Edit policy information
│       ├── Map/unmap policy rules
│       ├── View rule details and wallet limits
│       └── Plan versions management
├── /policy-rules (Policy Rules management)
│   ├── List all rules with search
│   ├── Clickable rows for details
│   ├── /new (Create rule with auto-generated code)
│   └── /:id (Rule details page)
│       ├── View/edit mode toggle
│       ├── Total wallet amount
│       ├── Category-wise limits
│       └── Delete with confirmation
├── /categories (Category Master)
│   ├── List with search and filter
│   ├── Category IDs follow CAT### pattern (entered manually, enforced uppercase)
│   ├── Immutable category IDs with editable name/description/order
│   └── Status toggle instead of hard delete
├── /service-types (Service Types)
│   ├── List with search and category filter
│   ├── Codes follow domain-specific convention (e.g., CON001) and must be provided on create
│   ├── Coverage, copay, document requirements, and limits surfaced in form
│   └── Active/inactive and compliance flags (pre-auth/referral) configurable
├── /assignments (Assignment management)
├── /claims (Claims processing)
├── /reports (Analytics)
└── /settings (System settings)
```

Admin Portal highlights:
- Guarded by `/admin` base path; unauthenticated or member-role access redirects to `/`.
- Dashboard shows aggregate counts (users, policies, active members) with quick navigation cards.
- Users module defaults to External vs Internal tabs, inline search, and exposes reset/set password actions plus policy assignment workflow on the detail page.
- Policy, Category, and Service Type forms share consistent validation messaging and rely on the API's structured DTO rules.
- Policies feature Plan Versions with full lifecycle: create draft, publish, and make current.
- Assignments support plan version override (cohorting): admins can assign specific published versions to individual members, overriding the policy's current version.
- Plan Versions workflow: DRAFT → PUBLISHED, with version auto-incrementing and date validation.
- Shared fetch utility prefixes `/admin` requests so all client calls route through Next.js rewrites to the API container.

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
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=1000
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
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=1000
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
- Brand: #255a53 (Custom Green)
  - Brand-50: #e8f0ef
  - Brand-100: #c5d9d7
  - Brand-200: #9ebfbb
  - Brand-300: #77a59f
  - Brand-400: #4e8b84
  - Brand-500: #255a53 (Primary)
  - Brand-600: #1e4b45
  - Brand-700: #173c37
  - Brand-800: #102d29
  - Brand-900: #0a1e1b
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
- **Layout System**: Responsive navigation with mobile/desktop adaptation
- **Form Wizards**: Multi-step workflows for complex processes
- **Data Visualization**: Charts and progress indicators
- **OPD E-Cards**: Compact horizontally scrollable member cards showing:
  - Member name and photo placeholder
  - Relationship type (SELF, SPOUSE, SON, DAUGHTER, etc.)
  - Member ID and Corporate info
  - Age and coverage period
  - Quick action buttons
- **Navigation Pattern**:
  - Mobile: Fixed bottom navigation with 4 main tabs (Home, Claims, Bookings, Services)
  - Desktop: Top navigation bar with profile selector and wallet balance
  - No hamburger menu anywhere - all items accessible via Services page

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

#### Production (AWS EC2 - http://51.20.125.246)
- Super Admin: admin@opdwallet.com / Admin@123
- Member: john.doe@company.com / Member@123
- Dependent: jane.doe@email.com / Dependent@123
- Member ID: OPD000001
- UHID: UH000001

#### Local Development
- Same credentials as production
- Member Portal: http://localhost:3002
- Admin Portal: http://localhost:3001

#### User Roles Available
- SUPER_ADMIN: Full system access
- ADMIN: User and policy management
- TPA: Claims processing and reporting
- OPS: Support and read-only access
- MEMBER: Healthcare members/beneficiaries

### API Documentation
- Swagger UI: http://localhost:4000/api/docs
- Base URL: http://localhost:4000/api

## Environments (AWS)

### AWS Account & Infrastructure
- **Account**: OPD Wallet Development
- **Primary Region**: eu-north-1 (Stockholm)
- **Current EC2 Instance**: 51.20.125.246 (t2.micro)
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

### GitHub Secrets Configuration
| Secret | Description | Status |
|--------|-------------|--------|
| `EC2_HOST` | EC2 public IP (51.20.125.246) | ✅ Configured |
| `EC2_SSH_KEY` | SSH private key (.pem contents) | ✅ Configured |
| `GH_TOKEN` | GitHub PAT for private repo | ✅ Configured |

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

## Current Deployment State (September 19, 2025)

### AWS EC2 Instance (ACTIVE)
```
Instance Type: t2.micro
Region: eu-north-1
Public IP: 51.20.125.246
OS: Ubuntu 22.04 LTS
Storage: 30GB gp3
Security Groups: HTTP(80), HTTPS(443), SSH(22)
Instance ID: [REDACTED]
```

### Docker Services Status
- **MongoDB**: Running on port 27017 (containerized)
- **API**: Running on port 4000 (NestJS)
- **Member Portal**: Running on port 3002 (Next.js)
- **Admin Portal**: Running on port 3001 (Next.js)
- **Nginx**: Reverse proxy on port 80

### CI/CD Pipeline (SIMPLIFIED & WORKING)
**GitHub Actions Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Push to main branch
- **Method**: Simple SSH deployment (like IntelliReports)
- **Process**:
  1. SSH to EC2 (51.20.125.246)
  2. Pull latest code with `git pull`
  3. Stop existing containers
  4. Build all services with `docker-compose build --no-cache`
  5. Start containers with `docker-compose up -d`
- **Deployment Time**: ~10-15 minutes
- **Success Rate**: 100%

### Why This Works (Lessons from IntelliReports)
1. **Simple is Better**: One job, one SSH connection, straightforward commands
2. **Build on EC2**: No complex artifact handling or multi-stage builds
3. **Background Build**: Build process runs in background with progress monitoring
4. **No Caching Issues**: `--no-cache` ensures fresh builds every time
5. **Platform Consistency**: Building on EC2 ensures linux/amd64 compatibility

### Known Security Gaps (Development Environment)

#### 🔴 Critical for Production
1. **No HTTPS/SSL**: Running on HTTP only
2. **MongoDB authentication**: Basic auth enabled
3. **Cookies without Secure flag**: Required for HTTP but insecure
4. **JWT secret hardcoded**: Using development secret
5. **CORS limited to localhost**: Update to production domains before go-live
6. **Rate limiting configured for demo**: Global (100/15min) and auth (5/15min) limits active; revisit thresholds for prod scale
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
- [x] Implement rate limiting
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
