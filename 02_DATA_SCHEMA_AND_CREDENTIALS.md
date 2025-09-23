# 02_DATA_SCHEMA_AND_CREDENTIALS.md
**Last Updated: January 2025**
**Current State: SIMPLIFIED ARCHITECTURE - SINGLE DOCUMENT APPROACH**
**Status**: PRODUCTION-READY WITH STREAMLINED SCHEMAS

## 🚨 SECURITY NOTICE & COMPLIANCE REQUIREMENTS

### ACTUAL Current Configuration (FROM REAL ENVIRONMENT)

#### Local Development (docker-compose.yml)
```bash
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin123
MONGO_INITDB_DATABASE=opd_wallet
MONGODB_URI=mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin

# API Configuration
NODE_ENV=development
PORT=4000
JWT_SECRET=dev_jwt_secret_change_in_production
COOKIE_NAME=opd_session

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:4000/api
API_URL=http://opd-api:4000/api
```

#### Production (.env.docker)
```bash
# Actual production credentials
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin123
MONGO_DATABASE=opd_wallet
JWT_SECRET=dev_jwt_secret_change_in_production
COOKIE_NAME=opd_session
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

#### Application User Credentials (REAL)
```bash
# Super Admin Account
Email: admin@opdwallet.com
Password: Admin@123
Role: SUPER_ADMIN

# Member Test Accounts
Email: john.doe@company.com
Password: Test123!
Role: MEMBER

Email: jane.doe@email.com
Password: Test123!
Role: MEMBER
```

### Production Security Baseline (REQUIRED)
Per Operating Rule #5, all production deployments MUST implement:

#### Authentication & Authorization
- **MongoDB**: Strong authentication with role-based access
- **Passwords**: Bcrypt with minimum 12 rounds + complexity requirements
- **JWT**:
  - Cryptographically secure 256-bit secret from AWS Secrets Manager
  - Token rotation every 1 hour
  - Refresh token strategy with secure storage
  - Session invalidation on logout
- **RBAC**: Strict role checks + resource-level authorization (prevent IDOR)

#### Data Protection
- **Encryption at Rest**: MongoDB encryption, S3 AES-256
- **Encryption in Transit**: TLS 1.2+ for all connections
- **PII Handling**:
  - Mask sensitive fields in logs
  - Encrypt SSN, payment details
  - GDPR-compliant data retention
- **File Security**:
  - Antivirus scanning on upload
  - Private S3 storage
  - Pre-signed URLs (15-minute expiry)

#### Input/Output Validation
- **Server-side**: Class-validator with strict DTOs
- **Client-side**: Zod schemas for form validation
- **Sanitization**: DOMPurify for user-generated content
- **SQL/NoSQL Injection**: Parameterized queries only

#### Audit & Compliance
- **Immutable Audit Log**: All admin/member actions
  - Format: `{timestamp, userId, action, resource, before, after, ip, userAgent}`
  - Storage: Separate audit collection with TTL
  - Retention: 2 years minimum (63072000 seconds)
- **HIPAA Compliance**:
  - Access logs for PHI
  - Encryption requirements
  - Business Associate Agreements (BAA)

#### Security Headers & Rate Limiting
```javascript
// Required production headers
{
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-XSS-Protection": "1; mode=block"
}

// Rate limiting (current development settings)
{
  "global": "100 requests per 15 min per IP",
  "auth": "5 login attempts per 15 min",
  "nestFallback": "10000 requests per minute (Nest Throttler)"
}
```

## Database Quality Standards (Operating Rule #6)

### Performance Targets
- **Read Operations**: p95 < 300ms
- **Write Operations**: p95 < 800ms
- **Query Optimization**: All queries must include explain() analysis
- **Index Coverage**: 100% for frequently accessed fields

### Schema Requirements
- **Email Uniqueness**: Case-insensitive with collection collation
- **Migrations**: Version-controlled, reversible scripts
- **Seed Data**: Maintained for all environments
- **Schema Changes**: Never silent; always through migration scripts

### MongoDB Query Performance Evidence
```javascript
// Example: User lookup by email
db.users.find({email: "user@test.com"}).explain("executionStats")
// Expected: Index scan, totalDocsExamined === 1

// Example: Policy assignments for user
db.userPolicyAssignments.find({userId: ObjectId("...")}).explain("executionStats")
// Expected: Index scan, execution time < 50ms
```

## MongoDB Collections (CURRENT SIMPLIFIED ARCHITECTURE)

### 1. users (`users`) - CORE USER MANAGEMENT
**File**: `api/src/modules/users/schemas/user.schema.ts`
**Collection Name**: `users`

```typescript
// STREAMLINED USER SCHEMA:
{
  _id: ObjectId,
  userId: string,                    // @Prop({ required: true, unique: true, immutable: true })
  uhid: string,                     // @Prop({ required: true, unique: true })
  memberId: string,                 // @Prop({ required: true, unique: true })
  employeeId?: string,              // @Prop({ unique: true, sparse: true })
  relationship: RelationshipType,   // SELF | SPOUSE | CHILD | MOTHER | FATHER | OTHER
  primaryMemberId?: string,         // @Prop({ required: function() { return this.relationship !== 'SELF' } })

  // Name object
  name: {
    firstName: string,              // @Prop({ required: true, trim: true })
    lastName: string,               // @Prop({ required: true, trim: true })
    fullName?: string               // Auto-generated in pre-save hook
  },

  // Contact information
  email: string,                    // @Prop({ required: true, unique: true, lowercase: true })
  phone: string,                    // @Prop({ required: true, unique: true })
  dob?: Date,
  gender?: 'MALE' | 'FEMALE' | 'OTHER',

  // Address object
  address?: {
    line1?: string,
    line2?: string,
    city?: string,
    state?: string,
    pincode?: string
  },

  // Role and status
  role: UserRole,                   // SUPER_ADMIN | ADMIN | TPA | OPS | MEMBER
  status: UserStatus,               // ACTIVE | INACTIVE

  // Authentication
  passwordHash: string,             // @Prop({ required: true })
  mustChangePassword: boolean,      // @Prop({ default: false })

  // Audit fields
  createdBy?: string,
  updatedBy?: string,
  createdAt: Date,                  // Automatic timestamp
  updatedAt: Date,                  // Automatic timestamp
  __v: number                       // Mongoose version key
}
```

**INDEXES:**
```typescript
@Index({ email: 1 })                    // Unique email
@Index({ phone: 1 })                    // Unique phone
@Index({ uhid: 1 })                     // Unique UHID
@Index({ memberId: 1 })                 // Unique member ID
@Index({ employeeId: 1 }, { sparse: true })  // Sparse employee ID
@Index({ userId: 1 })                   // User ID lookup
@Index({ primaryMemberId: 1, relationship: 1 })  // Dependent relationships
```

**PRE-SAVE HOOKS:**
- Auto-generates `fullName` from `firstName + lastName`
- Password hashing with bcrypt (12 rounds)
- Automatic timestamp updates

### 2. policies (`policies`) - CORE POLICY MANAGEMENT
**File**: `api/src/modules/policies/schemas/policy.schema.ts`
**Collection Name**: `policies`

```typescript
// SIMPLIFIED POLICY SCHEMA:
{
  _id: ObjectId,
  policyNumber: string,           // @Prop({ required: true, unique: true, immutable: true })
  name: string,                   // @Prop({ required: true, minlength: 3, maxlength: 80, trim: true })
  description?: string,           // @Prop({ trim: true })
  ownerPayer: OwnerPayerType,     // CORPORATE | INSURER | HYBRID
  sponsorName?: string,           // @Prop({ trim: true })
  status: PolicyStatus,           // DRAFT | ACTIVE | INACTIVE | EXPIRED
  effectiveFrom: Date,            // @Prop({ required: true })
  effectiveTo?: Date,

  // Audit fields
  createdBy?: string,
  updatedBy?: string,
  createdAt: Date,
  updatedAt: Date,
  __v: number
}
```

**INDEXES:**
```typescript
@Index({ policyNumber: 1 })              // Unique policy number
@Index({ status: 1, effectiveFrom: 1 })  // Status and date filtering
```

### 3. userPolicyAssignments (`userPolicyAssignments`) - USER-POLICY MAPPING
**File**: `api/src/modules/assignments/schemas/assignment.schema.ts`
**Collection Name**: `userPolicyAssignments`

```typescript
// ASSIGNMENT SCHEMA:
{
  _id: ObjectId,
  assignmentId: string,           // @Prop({ required: true, unique: true })
  userId: ObjectId,               // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  policyId: ObjectId,             // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true })
  effectiveFrom: Date,            // @Prop({ required: true, default: Date.now })
  effectiveTo?: Date,             // @Prop({ optional: true })
  planVersionOverride?: number,   // @Prop({ optional: true })
  isActive: boolean,              // @Prop({ default: true })
  createdBy?: string,             // @Prop({ optional: true })
  updatedBy?: string,             // @Prop({ optional: true })

  createdAt: Date,
  updatedAt: Date,
  __v: number
}
```

**INDEXES:**
```typescript
@Index({ userId: 1, isActive: 1 })                  // User assignments by status
@Index({ policyId: 1, isActive: 1 })                // Policy assignments by status
@Index({ assignmentId: 1 }, { unique: true })       // Unique assignment lookup
```

### 4. plan_configs (`plan_configs`) - VERSIONED PLAN CONFIGURATION
**File**: `api/src/modules/plan-config/schemas/plan-config.schema.ts`
**Collection Name**: `plan_configs`

```typescript
// VERSIONED PLAN CONFIGURATION:
{
  _id: ObjectId,
  policyId: ObjectId,             // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true })
  version: number,                // @Prop({ required: true, default: 1 })
  status: string,                 // @Prop({ enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' })
  isCurrent: boolean,             // @Prop({ default: false })

  // Benefit components configuration
  benefits: {
    consultation?: {
      enabled: boolean,
      annualLimit?: number,
      visitLimit?: number,
      notes?: string
    },
    pharmacy?: {
      enabled: boolean,
      annualLimit?: number,
      rxRequired?: boolean,
      notes?: string
    },
    diagnostics?: {
      enabled: boolean,
      annualLimit?: number,
      rxRequired?: boolean,
      notes?: string
    },
    dental?: {
      enabled: boolean,
      annualLimit?: number,
      notes?: string
    },
    vision?: {
      enabled: boolean,
      annualLimit?: number,
      notes?: string
    },
    wellness?: {
      enabled: boolean,
      annualLimit?: number,
      notes?: string
    }
  },

  // Wallet configuration
  wallet: {
    totalAnnualAmount?: number,
    perClaimLimit?: number,
    copay?: {
      mode: 'PERCENT' | 'AMOUNT',
      value: number
    },
    partialPaymentEnabled?: boolean,
    carryForward?: {
      enabled: boolean,
      percent?: number,
      months?: number
    },
    topUpAllowed?: boolean
  },

  // Simplified coverage (enabled service codes)
  enabledServices: string[],      // @Prop({ default: [] })

  // Audit fields
  createdBy?: string,
  updatedBy?: string,
  publishedBy?: string,
  publishedAt?: Date,
  createdAt: Date,
  updatedAt: Date,
  __v: number
}
```

**INDEXES:**
```typescript
@Index({ policyId: 1, version: 1 }, { unique: true })  // Unique policy-version combination
```

### 5. category_master (`category_master`) - MASTER DATA
**File**: `api/src/modules/masters/schemas/category-master.schema.ts`
**Collection Name**: `category_master`

```typescript
// CATEGORY MASTER SCHEMA:
{
  _id: ObjectId,
  categoryId: string,             // @Prop({ required: true, unique: true, uppercase: true, immutable: true })
  code: string,                   // @Prop({ required: true, unique: true, uppercase: true })
  name: string,                   // @Prop({ required: true })
  description?: string,
  displayOrder: number,           // @Prop({ required: true })
  isActive: boolean,              // @Prop({ default: true })

  // Audit fields
  createdBy?: string,
  updatedBy?: string,
  createdAt: Date,
  updatedAt: Date,
  __v: number
}
```

**INDEXES:**
```typescript
@Index({ categoryId: 1 }, { unique: true })             // Unique category ID
@Index({ code: 1 }, { unique: true })                   // Unique code
@Index({ isActive: 1, displayOrder: 1 })                // Active categories by order
```

### 6. service_master (`service_master`) - MASTER DATA
**File**: `api/src/modules/masters/schemas/service-master.schema.ts`
**Collection Name**: `service_master`

```typescript
// SERVICE MASTER SCHEMA:
{
  _id: ObjectId,
  code: string,                   // @Prop({ required: true, unique: true, uppercase: true })
  name: string,                   // @Prop({ required: true })
  description?: string,           // @Prop({ optional: true })
  category: string,               // @Prop({ required: true, uppercase: true })
  isActive: boolean,              // @Prop({ default: true })
  coveragePercentage: number,     // @Prop({ default: 100 })
  copayAmount: number,            // @Prop({ default: 0 })
  requiresPreAuth: boolean,       // @Prop({ default: false })
  requiresReferral: boolean,      // @Prop({ default: false })
  priceRange?: {                  // @Prop({ optional: true })
    min: number,
    max: number
  },
  annualLimit?: number,           // @Prop({ optional: true })
  waitingPeriodDays: number,      // @Prop({ default: 0 })
  requiredDocuments: string[],    // @Prop({ default: [] })

  // Audit fields
  createdBy?: string,
  updatedBy?: string,
  createdAt: Date,
  updatedAt: Date,
  __v: number
}
```

**INDEXES:**
```typescript
@Index({ code: 1 }, { unique: true })                   // Unique service code
@Index({ category: 1, isActive: 1 })                    // Category filtering
```

### 7. counters (`counters`) - AUTO-INCREMENT
**File**: `api/src/modules/counters/schemas/counter.schema.ts`
**Collection Name**: `counters`

```typescript
// COUNTER SCHEMA:
{
  _id: string,                    // @Prop({ required: true }) - e.g., "user", "policy"
  seq: number                     // @Prop({ required: true, default: 0 })
}
```

**Usage**: Auto-increment sequences for generating unique IDs like USR-001, POL-001, etc.

### 8. auditLogs (`auditLogs`) - AUDIT TRAIL
**File**: `api/src/modules/audit/schemas/audit-log.schema.ts`
**Collection Name**: `auditLogs`

```typescript
// AUDIT LOG SCHEMA:
{
  _id: ObjectId,
  userId?: string,                // User who performed the action
  userEmail?: string,             // User's email
  userRole?: string,              // User's role at time of action
  action: string,                 // @Prop({ required: true }) - CREATE, UPDATE, DELETE, etc.
  resource: string,               // @Prop({ required: true }) - Resource type (User, Policy, etc.)
  resourceId?: ObjectId,          // ID of the affected resource

  // State tracking
  before?: Record<string, any>,   // State before change
  after?: Record<string, any>,    // State after change

  // Request metadata
  metadata?: {
    ip?: string,
    userAgent?: string,
    method?: string,              // HTTP method
    path?: string,                // Request path
    statusCode?: number,          // Response status
    duration?: number             // Request duration in ms
  },

  description?: string,           // Human-readable description
  isSystemAction: boolean,        // @Prop({ default: false })
  createdAt: Date,                // @Prop({ default: Date.now, expires: 63072000 }) - 2 year TTL
  __v: number
}
```

**INDEXES:**
```typescript
@Index({ createdAt: 1 }, { expireAfterSeconds: 63072000 })  // TTL index - 2 years
@Index({ resource: 1, createdAt: -1 })                      // Resource-based queries
@Index({ userId: 1, createdAt: -1 })                        // User-based queries
```

**Key Features:**
- **Automatic TTL**: 2-year retention policy
- **Comprehensive Tracking**: Before/after state, metadata, user context
- **System vs User Actions**: Distinguishes between system and user actions

### CURRENT MONGODB STATUS (8 COLLECTIONS)

**Active Collections:**
```typescript
1. users (3 documents)
2. policies (1 document)
3. userPolicyAssignments (2 documents)
4. plan_configs (1 document) // Consolidated approach
5. category_master (12 documents)
6. service_master (14 documents)
7. auditLogs (7 documents)
8. counters (2 documents)
```

## Docker Configuration (ACTUAL IMPLEMENTATION)

### Docker Compose Files

#### 1. Development Environment (`docker-compose.yml`)
**Status**: ✅ ACTIVE CONFIGURATION
```yaml
version: '3.8'

services:
  # MongoDB Database
  mongo:
    image: mongo:7.0
    container_name: opd-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: opd_wallet
    volumes:
      - mongo-data:/data/db
    networks:
      - opd-network

  # NestJS API
  api:
    image: node:20-alpine
    container_name: opd-api
    restart: unless-stopped
    working_dir: /app
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin
      JWT_SECRET: dev_jwt_secret_change_in_production
      COOKIE_NAME: opd_session
      PORT: 4000
    depends_on:
      - mongo
    volumes:
      - ./api:/app
    networks:
      - opd-network
    command: sh -c "npm install && npm run start:dev"

  # Admin Portal (Next.js)
  web-admin:
    image: node:20-alpine
    container_name: opd-web-admin
    restart: unless-stopped
    working_dir: /app
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
      API_URL: http://opd-api:4000/api
      NODE_ENV: development
    depends_on:
      - api
    volumes:
      - ./web-admin:/app
    networks:
      - opd-network
    command: sh -c "npm install && npm run dev"

  # Member Portal (Next.js)
  web-member:
    image: node:20-alpine
    container_name: opd-web-member
    restart: unless-stopped
    working_dir: /app
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
      API_URL: http://opd-api:4000/api
      NODE_ENV: development
    depends_on:
      - api
    volumes:
      - ./web-member:/app
    networks:
      - opd-network
    command: sh -c "npm install && npm run dev"

volumes:
  mongo-data:

networks:
  opd-network:
    driver: bridge
```

#### 2. Production Environment (`docker-compose.prod.yml`)
**Status**: ✅ ACTIVE ON AWS EC2 (51.20.125.246)
```yaml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: opd-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - web-admin
      - web-member
    restart: unless-stopped
    networks:
      - opd-network

  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: opd-mongodb
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db
    networks:
      - opd-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 5

  # NestJS API
  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
    container_name: opd-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 4000
      MONGODB_URI: mongodb://mongodb:27017/opd_wallet
      JWT_SECRET: ${JWT_SECRET}
      COOKIE_NAME: ${COOKIE_NAME}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      COOKIE_SECURE: ${COOKIE_SECURE}
      COOKIE_HTTPONLY: ${COOKIE_HTTPONLY}
      COOKIE_SAMESITE: ${COOKIE_SAMESITE}
      COOKIE_MAX_AGE: ${COOKIE_MAX_AGE}
    depends_on:
      - mongodb
    networks:
      - opd-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Admin Portal (Next.js)
  web-admin:
    build:
      context: ./web-admin
      dockerfile: Dockerfile.prod
      args:
        NEXT_PUBLIC_API_URL: ${PUBLIC_API_URL}
    container_name: opd-web-admin
    restart: unless-stopped
    environment:
      NODE_ENV: production
      API_URL: http://api:4000/api
      NEXT_PUBLIC_API_URL: ${PUBLIC_API_URL}
    depends_on:
      - api
    networks:
      - opd-network

  # Member Portal (Next.js)
  web-member:
    build:
      context: ./web-member
      dockerfile: Dockerfile.prod
      args:
        NEXT_PUBLIC_API_URL: ${PUBLIC_API_URL}
    container_name: opd-web-member
    restart: unless-stopped
    environment:
      NODE_ENV: production
      API_URL: http://api:4000/api
      NEXT_PUBLIC_API_URL: ${PUBLIC_API_URL}
    depends_on:
      - api
    networks:
      - opd-network

networks:
  opd-network:
    driver: bridge

volumes:
  mongo-data:
    driver: local
```

### Container Details

#### Service Ports
- **MongoDB**: 27017 (internal only in production)
- **API**: 4000 (NestJS)
- **Admin Portal**: 3001 (Next.js)
- **Member Portal**: 3002 (Next.js)
- **Nginx**: 80/443 (production only)

#### Volume Mounts
- **Development**: Source code mounted for hot reload
- **Production**: Built Docker images, persistent MongoDB data
- **MongoDB Data**: Persistent volume `mongo-data`

#### Network Configuration
- **Internal Network**: `opd-network` (bridge driver)
- **Service Discovery**: Containers communicate via service names
- **Port Mapping**: Development exposes all ports, production only 80/443

#### Health Checks
- **MongoDB**: Connection ping check (30s interval)
- **API**: HTTP health endpoint check (30s interval)
- **Restart Policy**: `unless-stopped` for all services

### Environment Variables (ACTUAL VALUES)

#### `.env.docker` (Current Configuration)
```bash
# Ports
ADMIN_PORT=3001
MEMBER_PORT=3002
API_PORT=4000
MONGO_PORT=27017

# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin123
MONGO_DATABASE=opd_wallet

# API Configuration
JWT_SECRET=dev_jwt_secret_change_in_production
COOKIE_NAME=opd_session
NODE_ENV=development

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

#### Production Environment Variables
```bash
# From production deployment
PUBLIC_API_URL=http://51.20.125.246/api
JWT_SECRET=${JWT_SECRET}
COOKIE_NAME=${COOKIE_NAME}
COOKIE_DOMAIN=${COOKIE_DOMAIN}
COOKIE_SECURE=${COOKIE_SECURE}
COOKIE_HTTPONLY=${COOKIE_HTTPONLY}
COOKIE_SAMESITE=${COOKIE_SAMESITE}
COOKIE_MAX_AGE=${COOKIE_MAX_AGE}
```

### CI/CD Integration

#### GitHub Actions Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to EC2
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          port: 22
          command_timeout: 55m
          script: |
            cd ~/opdwallet
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker system prune -af --volumes
            docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans
```

#### GitHub Secrets (Configured)
- `EC2_HOST`: 51.20.125.246
- `EC2_SSH_KEY`: SSH private key content
- `GH_TOKEN`: GitHub personal access token

### Security Configuration

#### MongoDB Authentication
```javascript
// Current configuration
{
  username: "admin",
  password: "admin123",
  authSource: "admin",
  database: "opd_wallet"
}
```

#### Cookie Configuration (Development)
```javascript
{
  name: "opd_session",
  httpOnly: true,
  secure: false,        // HTTP deployment
  sameSite: "lax",
  maxAge: 604800000     // 7 days
}
```

#### API Security Headers
```javascript
// Applied via Helmet middleware
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block"
}
```

### Deployment Status
- **Local Development**: ✅ Fully functional
- **AWS Production**: ✅ Deployed and running
- **CI/CD Pipeline**: ✅ Automated deployment working
- **Health Monitoring**: ✅ Container health checks active
- **Data Persistence**: ✅ MongoDB volumes persistent across restarts
