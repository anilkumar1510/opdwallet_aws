# 02_DATA_SCHEMA_AND_CREDENTIALS.md
**Last Updated: September 19, 2025**
**Current State: Development Environment**

## 🚨 SECURITY NOTICE & COMPLIANCE REQUIREMENTS

### Current Development Configuration
- **MongoDB**: Running with basic authentication
- **Passwords**: Using bcrypt with 12 rounds
- **JWT Secret**: Environment variable (change in production)
- **Connection**: mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin
- **Validation**: DTOs with class-validator + Nest ValidationPipe (whitelist/transform)
- **Audit Logging**: Active with 2-year TTL retention
- **Cookie Security**: COOKIE_SECURE=false (HTTP deployment)
- **Rate Limiting**: Configured with 10000 requests/min (development)

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
  "global": "10000 requests per minute per IP",
  "auth": "5 login attempts per 15 min"
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

## MongoDB Collections (Current Snapshot: September 19, 2025)

### Database Statistics
- **Total Collections**: 13
- **Total Documents**: ~30 (development data)
- **Database**: opd_wallet

### 1. users
Primary collection for all system users (admins and members).
**Document Count**: 3

```javascript
{
  _id: ObjectId("68cc3a36e5f6ccacb3e7e4a8"),
  userId: "USR-2025-0001",          // Unique user identifier - immutable
  uhid: "UHID001",                  // Universal Health ID - unique
  memberId: "MEM001",               // Unique member ID
  employeeId: "EMP001",             // Employee ID (optional)

  // Relationship tracking
  relationship: "SELF",             // "SELF" | "SPOUSE" | "SON" | "DAUGHTER" | "MOTHER" | "FATHER"

  // Personal information
  name: {
    firstName: "Super",
    lastName: "Admin",
    fullName: "Super Admin"
  },
  email: "admin@opdwallet.com",    // Unique, lowercase
  phone: "+919999999999",           // Unique
  dob: "1980-01-01T00:00:00.000Z",
  gender: "MALE",                   // "MALE" | "FEMALE" | "OTHER"

  // Address
  address: {
    line1: "123 Admin Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
  },

  // Authentication & Authorization
  role: "SUPER_ADMIN",              // "SUPER_ADMIN" | "ADMIN" | "TPA" | "OPS" | "MEMBER"
  status: "ACTIVE",                 // "ACTIVE" | "INACTIVE"
  passwordHash: "$2b$12$...",      // Bcrypt hashed
  mustChangePassword: false,

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`: unique
- `uhid`: unique
- `memberId`: unique
- `employeeId`: unique, sparse
- `email`: unique
- `phone`: unique
- `primaryMemberId, relationship`: compound index

### 2. policies
Healthcare policies that can be assigned to members.
**Document Count**: 1

```javascript
{
  _id: ObjectId("68cc3a36e5f6ccacb3e7e4ad"),
  policyNumber: "POL-2025-0001",    // Unique, auto-generated
  name: "Standard OPD Policy 2025",
  description: "Standard outpatient department policy...",

  // Ownership
  ownerPayer: "CORPORATE",          // "CORPORATE" | "INSURER" | "HYBRID"

  // Status & Validity
  status: "ACTIVE",                 // "DRAFT" | "ACTIVE" | "INACTIVE" | "EXPIRED"
  effectiveFrom: "2025-01-01T00:00:00.000Z",
  effectiveTo: "2025-12-31T00:00:00.000Z",

  // Version tracking
  currentPlanVersion: 1,

  // Metadata
  createdBy: "68cc3a36e5f6ccacb3e7e4a8",
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `policyNumber`: unique
- `status, effectiveFrom`: compound index

### 3. planVersions
Plan versions for policies with lifecycle management.
**Document Count**: 13

```javascript
{
  _id: ObjectId("68cbc500ac9f7cf9c245ce7d"),
  policyId: "68ca9705a49ab4810eab699a",
  planVersion: 1,
  status: "PUBLISHED",              // "DRAFT" | "PUBLISHED"

  effectiveFrom: "2025-01-01T00:00:00.000Z",
  effectiveTo: "2025-12-31T00:00:00.000Z",

  publishedAt: "2025-09-18T08:38:24.496Z",
  publishedBy: "SYSTEM",
  createdBy: "SYSTEM",

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `policyId, planVersion`: unique compound index
- `status, effectiveFrom`: compound index

### 4. userPolicyAssignments
Links users to policies with specific terms.
**Document Count**: 2

```javascript
{
  _id: "68cc3a37e5f6ccacb3e7e4b9",
  userId: "68cc3a37e5f6ccacb3e7e4b0",
  policyId: "68cc3a36e5f6ccacb3e7e4ad",
  status: "ACTIVE",                 // "ACTIVE" | "ENDED"

  effectiveFrom: "2025-01-01T00:00:00.000Z",

  assignedBy: "68cc3a36e5f6ccacb3e7e4a8",
  notes: "Initial assignment for employee",
  assignedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId, status`: compound index
- `policyId, status`: compound index
- `userId, policyId, effectiveFrom`: compound index

### 5. benefitComponents
Configures enabled OPD benefit components per plan version.
**Document Count**: 1

```javascript
{
  _id: ObjectId("68cc3f1fb3d9de611cce0e82"),
  planVersion: 1,
  policyId: "68cc3a36e5f6ccacb3e7e4ad",

  components: {
    consultation: {
      enabled: true,
      annualAmountLimit: 5000,
      visitsLimit: 1
    },
    pharmacy: {
      enabled: true,
      annualAmountLimit: 9,
      rxRequired: true
    },
    diagnostics: {
      enabled: true,
      annualAmountLimit: 5500,
      rxRequired: true
    },
    ahc: { enabled: false },
    vaccination: { enabled: false },
    dental: { enabled: false },
    vision: { enabled: false },
    wellness: { enabled: false }
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `policyId, planVersion`: unique compound index

### 6. walletRules
Wallet configuration for payment rules and limits.
**Document Count**: 1

```javascript
{
  _id: ObjectId("68ccfddcb3d9de611cce3aa3"),
  policyId: "68cc3a36e5f6ccacb3e7e4ad",
  planVersion: 1,

  copay: {
    mode: "PERCENT",               // "PERCENT" | "FIXED"
    value: 50
  },

  partialPaymentEnabled: false,
  topUpAllowed: false,

  // Optional fields
  totalAnnualAmount: Number,       // Optional
  perClaimLimit: Number,           // Optional
  carryForward: {
    enabled: Boolean,
    percent: Number,                // 0-100
    months: Number                  // Duration
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `policyId, planVersion`: unique compound index

### 7. policy_rules
Legacy policy rules with wallet limits per category.
**Document Count**: 1

```javascript
{
  _id: ObjectId("68caebede92d3ce29d58d6a3"),
  ruleCode: "RULE001",              // Auto-generated
  ruleName: "Rule1",
  description: "xcvcxvxc",
  totalWalletAmount: 10000,

  categoryLimits: [
    { categoryName: "Consultation Services", walletLimit: 5000 },
    { categoryName: "Diagnostic Services", walletLimit: 4000 },
    { categoryName: "Pharmacy", walletLimit: 0 },
    // ... 9 more categories
  ],

  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `ruleCode`: unique

### 8. policy_rule_mappings
Maps policy rules to policies (currently empty).
**Document Count**: 0

```javascript
{
  _id: ObjectId,
  policyId: ObjectId,
  ruleId: ObjectId,
  mappedAt: Date,
  mappedBy: String
}
```

### 9. category_master
Master list of healthcare service categories.
**Document Count**: 12

```javascript
{
  _id: ObjectId("68cae94d5f2575199512610f"),
  categoryId: "CAT001",             // Pattern: CAT###
  name: "Consultation Services",
  description: "Doctor consultations including general and specialist visits",
  isActive: true,
  displayOrder: 1,
  createdAt: Date,
  updatedAt: Date,
  createdBy: "system"
}
```

**Sample Categories:**
- CAT001: Consultation Services
- CAT002: Diagnostic Services
- CAT003: Pharmacy
- CAT004: Medical Procedures
- CAT005: Preventive Care
- CAT006: Emergency Services
- CAT007: Wellness Programs
- CAT008: Dental Services
- CAT009: Vision Care
- CAT010: Maternity Services
- CAT011: Rehabilitation
- CAT012: Other Services

**Indexes:**
- `categoryId`: unique

### 10. service_master
Master list of healthcare services.
**Document Count**: 14

```javascript
{
  _id: ObjectId("68cad270393c1194bb7fbdc3"),
  code: "CON001",                   // Domain-specific code
  name: "General Consultation",
  description: "General physician consultation for routine check-ups",
  category: "CONSULTATION",
  isActive: true,
  coveragePercentage: 100,
  copayAmount: 0,
  requiresPreAuth: false,
  requiresReferral: false,
  priceRange: {
    min: 500,
    max: 1500
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: "system",
  requiredDocuments: [],
  waitingPeriodDays: 0
}
```

**Sample Services:**
- CON001: General Consultation
- CON002: Specialist Consultation
- DIAG001: Basic Blood Tests
- DIAG002: X-Ray
- DIAG003: MRI Scan
- PHAR001: Generic Medicines
- PHAR002: Branded Medicines
- PREV001: Annual Health Checkup
- PREV002: Vaccination
- DENT001: Dental Consultation
- DENT002: Dental Procedures
- VIS001: Eye Examination
- VIS002: Glasses/Lenses
- WELL001: Gym Membership

**Indexes:**
- `code`: unique

### 11. benefitCoverageMatrix
Maps categories and services to plan versions (currently empty).
**Document Count**: 0

```javascript
{
  _id: ObjectId,
  policyId: ObjectId,
  planVersion: Number,
  coverageItems: [{
    categoryId: String,
    serviceCode: String,
    enabled: Boolean,
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `policyId, planVersion`: unique compound index

### 12. counters
Auto-increment counters for IDs.
**Document Count**: 2

```javascript
{
  _id: "user",
  seq: 3                            // Current sequence number
}
```

**Counter Types:**
- user: For USR-2025-#### generation
- policy: For POL-2025-#### generation

### 13. auditLogs
Immutable audit trail for all admin actions.
**Document Count**: 7

```javascript
{
  _id: ObjectId("68cbc500ac9f7cf9c245ce80"),
  userId: "SYSTEM",
  userEmail: "system@opdwallet.com",
  userRole: "SYSTEM",
  action: "POLICY_VERSION_INIT",   // Action type
  resource: "policies",             // Resource type
  resourceId: "68ca9705a49ab4810eab699a",

  after: {
    currentPlanVersion: 1,
    planVersion: 1
  },

  description: "Initialized plan version 1 for policy POL-2025-0001",
  isSystemAction: true,
  createdAt: Date
}
```

**Indexes:**
- `createdAt`: TTL index with 2-year expiry (63072000 seconds)

**Audit Actions Tracked:**
- USER_CREATE, USER_UPDATE, USER_DELETE
- POLICY_CREATE, POLICY_UPDATE, POLICY_VERSION_INIT
- ASSIGNMENT_CREATE, ASSIGNMENT_UPDATE, ASSIGNMENT_END
- PLAN_VERSION_CREATE, PLAN_VERSION_PUBLISH
- BENEFIT_CONFIG_UPDATE, WALLET_RULES_UPDATE
- LOGIN, LOGOUT, PASSWORD_CHANGE

## Environment Variables

### Development (docker-compose.yml)
```yaml
# API Service
NODE_ENV: development
MONGODB_URI: mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin
JWT_SECRET: dev_jwt_secret_change_in_production
COOKIE_NAME: opd_session
COOKIE_SECURE: false                # For HTTP deployment
PORT: 4000

# Web Services
NEXT_PUBLIC_API_URL: http://localhost:4000/api
API_URL: http://opd-api:4000/api

# MongoDB Service
MONGO_INITDB_ROOT_USERNAME: admin
MONGO_INITDB_ROOT_PASSWORD: admin123
MONGO_INITDB_DATABASE: opd_wallet
```

### Production (Required - Use Secrets Manager)
```yaml
# API Service
NODE_ENV: production
MONGODB_URI: [FROM_SECRETS_MANAGER]
JWT_SECRET: [FROM_SECRETS_MANAGER]
COOKIE_NAME: opd_session
COOKIE_SECURE: true                 # HTTPS only
COOKIE_DOMAIN: .yourdomain.com
PORT: 4000

# Security
RATE_LIMIT_WINDOW: 900000           # 15 minutes
RATE_LIMIT_GLOBAL: 100              # Per IP
RATE_LIMIT_AUTH: 5                  # Login attempts

# AWS
AWS_REGION: eu-north-1
AWS_S3_BUCKET: opd-wallet-uploads
AWS_SECRETS_MANAGER_REGION: eu-north-1
```

## External Service Endpoints

### Current (Development)
- **API Base**: http://localhost:4000/api
- **Admin Portal**: http://localhost:3001
- **Member Portal**: http://localhost:3002
- **MongoDB**: mongodb://localhost:27017

### AWS EC2 (Current Deployment)
- **API Base**: http://51.20.125.246/api
- **Admin Portal**: http://51.20.125.246/admin
- **Member Portal**: http://51.20.125.246
- **MongoDB**: Internal Docker network

### Future Integrations (Planned)
- **SMS Gateway**: TBD (Twilio/AWS SNS)
- **Email Service**: TBD (SendGrid/AWS SES)
- **Payment Gateway**: TBD (Razorpay/Stripe)
- **Hospital APIs**: Custom integrations per partner
- **Insurance APIs**: IRDAI compliant endpoints

## Data Migration Scripts

### Initial Seed Data
```javascript
// Location: api/src/database/seeds/initial-seed.ts
// Creates:
// - 1 Super Admin user
// - 1 Active Policy
// - 2 Test Members
// - Sample categories and services
```

### Migration Versioning
```javascript
// Location: api/src/database/migrations/
// Format: YYYYMMDD_description.ts
// Example: 20250917_add_plan_versions.ts
```

## Backup & Recovery

### Current State
- **Backup Strategy**: None (CRITICAL GAP)
- **Data Volume**: Docker volume (mongo-data)
- **Recovery**: Manual from development data

### Production Requirements
- **Backup Frequency**: Daily automated backups
- **Retention**: 30 days rolling
- **Storage**: AWS S3 with lifecycle policies
- **RPO**: 24 hours
- **RTO**: 4 hours
- **Testing**: Monthly recovery drills

## Performance Monitoring

### Key Metrics to Track
- **API Response Time**: Target < 200ms p95
- **Database Query Time**: Target < 50ms p95
- **Collection Sizes**: Monitor growth rate
- **Index Usage**: Ensure 100% index coverage
- **Connection Pool**: Monitor active connections

### Query Optimization Examples
```javascript
// Slow query log analysis
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(5).sort({ ts: -1 })

// Index usage stats
db.users.aggregate([{ $indexStats: {} }])

// Collection statistics
db.users.stats()
```

## Compliance & Audit Requirements

### Data Retention
- **User Data**: Retain until account deletion + 90 days
- **Audit Logs**: 2 years (automatic TTL)
- **Claims Data**: 7 years (regulatory requirement)
- **Transaction Data**: 7 years (financial records)

### Access Control Matrix
| Collection | Super Admin | Admin | TPA | OPS | Member |
|------------|------------|-------|-----|-----|--------|
| users | CRUD | CRU | R | R | Own |
| policies | CRUD | CRUD | R | R | R |
| assignments | CRUD | CRUD | R | R | Own |
| claims | CRUD | CRU | CRU | R | Own |
| transactions | R | R | R | R | Own |
| auditLogs | R | - | - | - | - |

## Security Checklist

### Completed
- [x] Basic MongoDB authentication
- [x] Password hashing with bcrypt
- [x] JWT implementation
- [x] Role-based access control
- [x] Input validation with DTOs
- [x] Audit logging implementation
- [x] Rate limiting configuration

### Pending for Production
- [ ] MongoDB encryption at rest
- [ ] TLS/SSL for all connections
- [ ] Secrets management integration
- [ ] Database backup strategy
- [ ] Query performance optimization
- [ ] Security headers implementation
- [ ] HIPAA compliance validation
- [ ] Penetration testing
- [ ] Disaster recovery plan