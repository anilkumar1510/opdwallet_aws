# 02_DATA_SCHEMA_AND_CREDENTIALS.md
**Last Updated: September 17, 2025**
**Current State: Development Environment**

## 🚨 SECURITY NOTICE & COMPLIANCE REQUIREMENTS

### Current Development Configuration
- **MongoDB**: Running with basic authentication
- **Passwords**: Using bcrypt with 10 rounds
- **JWT Secret**: Environment variable (change in production)
- **Connection**: mongodb://opd-mongodb:27017/opd_wallet
- **Validation**: Basic DTOs with class-validator
- **Audit Logging**: Not implemented
- **Cookie Security**: COOKIE_SECURE=false (HTTP deployment)

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
  - Retention: 2 years minimum
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

// Rate limiting
{
  "global": "100 req/min per IP",
  "auth": "5 login attempts per 15 min",
  "api": "1000 req/hour per user"
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

## MongoDB Collections

### 1. users
Primary collection for all system users (admins and members).

```javascript
{
  _id: ObjectId,
  userId: String,           // Unique user identifier (e.g., "USR000001") - immutable
  uhid: String,             // Universal Health ID - unique
  memberId: String,         // Unique member ID (e.g., "OPD000001")
  employeeId: String,       // Employee ID (optional, for employees)

  // Relationship tracking
  relationship: String,     // "SELF" | "SPOUSE" | "CHILD" | "PARENT" | "OTHER"
  primaryMemberId: String,  // For dependents, links to primary member

  // Personal information
  name: {
    firstName: String,      // Required
    lastName: String,       // Required
    fullName: String        // Auto-generated: firstName + lastName
  },
  email: String,            // Unique, lowercase
  phone: String,            // Unique
  dob: Date,                // Date of birth
  gender: String,           // "MALE" | "FEMALE" | "OTHER"

  // Address
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String
  },

  // Authentication & Authorization
  passwordHash: String,     // Bcrypt hashed password
  role: String,             // "SUPER_ADMIN" | "ADMIN" | "TPA" | "OPS" | "MEMBER"
  status: String,           // "ACTIVE" | "INACTIVE" | "SUSPENDED"
  mustChangePassword: Boolean,

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,        // User ID who created this record
  updatedBy: String         // User ID who last updated
}
```

**Indexes:**
- `email`: unique, case-insensitive
- `phone`: unique
- `uhid`: unique
- `memberId`: unique
- `employeeId`: unique, sparse
- `userId`: unique
- `primaryMemberId, relationship`: compound index
- `role`: for filtering internal vs external users

### 2. policies
Healthcare policies that can be assigned to members.

```javascript
{
  _id: ObjectId,
  policyNumber: String,     // Unique policy number (e.g., "POL000001") - immutable
  name: String,             // Policy name
  description: String,      // Policy description
  status: String,           // "DRAFT" | "ACTIVE" | "INACTIVE" | "EXPIRED"

  // Validity period
  effectiveFrom: Date,      // Policy start date
  effectiveTo: Date,        // Policy end date (optional)

  // Policy details
  ownerPayer: String,       // Organization/entity paying for the policy

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,        // User ID who created
  updatedBy: String         // User ID who last updated
}
```

**Indexes:**
- `policyNumber`: unique
- `status, effectiveFrom`: compound index

### 3. userPolicyAssignments (assignments)
Links users to policies with specific terms.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // Reference to users._id
  policyId: ObjectId,       // Reference to policies._id
  status: String,           // "ACTIVE" | "INACTIVE" | "EXPIRED" | "TERMINATED"

  // Assignment period
  effectiveFrom: Date,      // Assignment start date (defaults to now)
  effectiveTo: Date,        // Assignment end date (optional)

  // Assignment metadata
  assignedAt: Date,         // When the assignment was created
  assignedBy: String,       // User ID who created the assignment
  notes: String,            // Optional notes about the assignment

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId, status`: compound index
- `policyId, status`: compound index
- `userId, policyId, effectiveFrom`: compound index

### 4. claims
Insurance claims submitted by members.

```javascript
{
  _id: ObjectId,
  claimId: String,          // Unique claim ID (e.g., "CLM000001")
  userId: ObjectId,         // Reference to users._id
  assignmentId: ObjectId,   // Reference to assignments._id
  type: String,             // "OPD" | "IPD" | "PHARMACY" | "DIAGNOSTIC"
  status: String,           // "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID"

  // Claim details
  claimDate: Date,
  serviceDate: Date,
  provider: {
    name: String,
    type: String,           // "HOSPITAL" | "CLINIC" | "PHARMACY" | "LAB"
    id: String
  },

  // Financial details
  claimAmount: Number,
  approvedAmount: Number,
  copayAmount: Number,
  paidAmount: Number,

  // Documents
  documents: [{
    type: String,           // "PRESCRIPTION" | "INVOICE" | "REPORT"
    url: String,
    uploadedAt: Date
  }],

  // Processing
  submittedAt: Date,
  reviewedBy: ObjectId,
  reviewedAt: Date,
  reviewNotes: String,
  paymentDate: Date,
  paymentReference: String,

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `claimId`: unique
- `userId, status`: compound index
- `assignmentId`: for assignment queries
- `serviceDate`: for date range queries

### 5. transactions
Wallet transactions and payment history.

```javascript
{
  _id: ObjectId,
  transactionId: String,    // Unique transaction ID
  userId: ObjectId,         // Reference to users._id
  assignmentId: ObjectId,   // Reference to assignments._id
  type: String,             // "CREDIT" | "DEBIT"
  category: String,         // "TOPUP" | "CLAIM" | "REFUND" | "ADJUSTMENT"

  // Transaction details
  amount: Number,
  balanceBefore: Number,
  balanceAfter: Number,

  // Reference
  referenceType: String,    // "CLAIM" | "MANUAL" | "SYSTEM"
  referenceId: ObjectId,    // ID of related entity
  description: String,

  // Metadata
  createdAt: Date,
  createdBy: ObjectId
}
```

**Indexes:**
- `transactionId`: unique
- `userId, createdAt`: compound index
- `assignmentId`: for assignment queries

### 6. appointments
Booking and appointment management.

```javascript
{
  _id: ObjectId,
  appointmentId: String,    // Unique appointment ID
  userId: ObjectId,         // Reference to users._id
  providerId: String,       // Provider/Doctor ID
  status: String,           // "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

  // Appointment details
  appointmentDate: Date,
  appointmentTime: String,
  duration: Number,         // Minutes
  type: String,             // "CONSULTATION" | "FOLLOWUP" | "DIAGNOSTIC"

  // Provider details
  provider: {
    name: String,
    specialization: String,
    location: String,
    phone: String
  },

  // Booking details
  bookedAt: Date,
  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,

  // Notes
  symptoms: String,
  notes: String,
  prescription: String,

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `appointmentId`: unique
- `userId, appointmentDate`: compound index
- `status`: for filtering
- `providerId`: for provider queries

### 7. counters
Auto-increment counters for IDs.

```javascript
{
  _id: String,              // Counter name (e.g., "userId", "claimId")
  seq: Number               // Current sequence number
}
```

## Configuration Keys

### Current Development Configuration (ACTIVE)
```bash
# Database (NO AUTH - DEVELOPMENT ONLY)
MONGODB_URI=mongodb://opd-mongodb:27017/opd_wallet
MONGODB_DATABASE=opd_wallet

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
COOKIE_NAME=opd_session
COOKIE_DOMAIN=
COOKIE_SECURE=false  # MUST BE true in production
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax
COOKIE_MAX_AGE=604800000

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=2h

# Server
PORT=4000
NODE_ENV=development  # MUST BE production for live

# CORS
CORS_ORIGIN=*  # DANGEROUS - restrict in production
```

### Production Configuration (REQUIRED)
```bash
# Database (WITH AUTH)
MONGODB_URI=mongodb://username:password@host:27017/opd_wallet?authSource=admin
MONGODB_DATABASE=opd_wallet

# Authentication
JWT_SECRET=[GENERATE_SECURE_256_BIT_KEY]
JWT_EXPIRY=1h  # Shorter for production
COOKIE_NAME=opd_session
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict
COOKIE_MAX_AGE=3600000  # 1 hour

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=3
LOCK_TIME=24h

# Server
PORT=4000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com

# Email (Placeholder)
SMTP_HOST=[SMTP_HOST]
SMTP_PORT=587
SMTP_USER=[SMTP_USER]
SMTP_PASS=[SMTP_PASSWORD]
FROM_EMAIL=noreply@opdwallet.com

# SMS (Placeholder)
SMS_API_KEY=[SMS_API_KEY]
SMS_SENDER_ID=OPDWLT

# Storage (Placeholder)
S3_BUCKET=[BUCKET_NAME]
S3_REGION=[AWS_REGION]
S3_ACCESS_KEY=[AWS_ACCESS_KEY]
S3_SECRET_KEY=[AWS_SECRET_KEY]

# External APIs (Placeholder)
PAYMENT_GATEWAY_KEY=[PAYMENT_KEY]
PAYMENT_GATEWAY_SECRET=[PAYMENT_SECRET]
```

### Web Applications (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.opdwallet.com
API_URL=http://api:4000/api

# App Configuration
NEXT_PUBLIC_APP_NAME=OPD Wallet
NEXT_PUBLIC_APP_URL=https://opdwallet.com

# Analytics (Placeholder)
NEXT_PUBLIC_GA_ID=[GOOGLE_ANALYTICS_ID]
NEXT_PUBLIC_GTM_ID=[GOOGLE_TAG_MANAGER_ID]

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Migration Notes

### Database Migrations
1. Always backup database before migrations
2. Run migrations in staging environment first
3. Use MongoDB transactions for data consistency
4. Version control migration scripts

### Schema Changes
1. Add new fields as optional initially
2. Backfill data using scripts
3. Make fields required after data migration
4. Update indexes after schema changes

### Data Seeding

#### Current Active Seed Data (September 2025)
```javascript
// Production-ready seed script creates the following users:
[
  {
    userId: "USR000001",
    uhid: "UH000001",
    memberId: "OPD000001",
    employeeId: "EMP001",
    email: "admin@opdwallet.com",
    password: "Admin@123",  // For reference only
    role: "SUPER_ADMIN",
    relationship: "SELF",
    name: {
      firstName: "Admin",
      lastName: "User",
      fullName: "Admin User"
    },
    phone: "+91 9876543210",
    status: "ACTIVE"
  },
  {
    userId: "USR000002",
    uhid: "UH000002",
    memberId: "OPD000002",
    employeeId: "EMP002",
    email: "john.doe@company.com",
    password: "Member@123",  // For reference only
    role: "MEMBER",
    relationship: "SELF",
    name: {
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe"
    },
    phone: "+91 9876543211",
    status: "ACTIVE",
    gender: "MALE",
    dob: new Date("1985-01-15")
  },
  {
    userId: "USR000003",
    uhid: "UH000003",
    memberId: "OPD000003",
    email: "jane.doe@email.com",
    password: "Dependent@123",  // For reference only
    role: "MEMBER",
    relationship: "SPOUSE",
    primaryMemberId: "OPD000002",
    name: {
      firstName: "Jane",
      lastName: "Doe",
      fullName: "Jane Doe"
    },
    phone: "+91 9876543212",
    status: "ACTIVE",
    gender: "FEMALE",
    dob: new Date("1987-03-20")
  }
]

// Test Policy
{
  policyNumber: "POL000001",
  name: "Standard OPD Plan",
  description: "Basic OPD coverage for employees",
  status: "ACTIVE",
  effectiveFrom: new Date("2025-01-01"),
  effectiveTo: new Date("2025-12-31"),
  ownerPayer: "Company ABC Ltd"
}

// Test Assignment
{
  userId: ObjectId("member_user_id"),
  policyId: ObjectId("policy_id"),
  status: "ACTIVE",
  effectiveFrom: new Date(),
  assignedBy: "admin_user_id"
}
```

## External Service Endpoints

### Payment Gateway (Placeholder)
- Production: https://api.payment-provider.com/v1
- Sandbox: https://sandbox.payment-provider.com/v1

### SMS Gateway (Placeholder)
- API: https://sms-provider.com/api/v2
- Webhook: https://api.opdwallet.com/webhooks/sms

### Email Service (Placeholder)
- SMTP: smtp.email-provider.com:587
- API: https://api.email-provider.com/v3

### Document Storage (Placeholder)
- S3: https://s3.region.amazonaws.com/bucket-name
- CDN: https://cdn.opdwallet.com

## CI/CD Credentials & Configuration

### GitHub Secrets (Required for Deployment)
```yaml
EC2_HOST: 51.20.125.246          # EC2 public IP
EC2_SSH_KEY: <.pem file contents> # SSH private key
GH_TOKEN: ghp_xxxxx               # GitHub PAT with repo access
```

### EC2 Environment (.env.production)
```bash
# Database
MONGO_DATABASE=opd_wallet

# Authentication
JWT_SECRET=your-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
COOKIE_NAME=opd_session
COOKIE_SECURE=false  # HTTP deployment
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax
COOKIE_MAX_AGE=604800000

# API Configuration
PUBLIC_API_URL=http://51.20.125.246/api
NODE_ENV=production
```

## Security Notes

1. **Never commit real credentials** - Use environment variables
2. **Rotate secrets regularly** - Quarterly for production
3. **Use different credentials per environment** - Dev/Staging/Prod
4. **Implement secret management** - Use AWS Secrets Manager or similar
5. **Audit credential access** - Log all credential usage
6. **Encrypt sensitive data** - PII and payment information
7. **Use VPN/Private networks** - For database access
8. **Implement API rate limiting** - Prevent abuse

## API Authentication Examples

### Login Request
```bash
# Admin Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opdwallet.com","password":"Admin@123"}' \
  -c cookies.txt

# Member Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@company.com","password":"Member@123"}' \
  -c cookies.txt
```

### Authenticated Request
```bash
curl http://localhost:4000/api/auth/me \
  -b cookies.txt
```

### User Management (Admin Only)
```bash
# Create Member
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "new.member@company.com",
    "password": "NewMember@123",
    "role": "MEMBER",
    "uhid": "UH000004",
    "memberId": "OPD000004",
    "employeeId": "EMP004",
    "relationship": "SELF",
    "name": {
      "firstName": "New",
      "lastName": "Member"
    },
    "phone": "+1234567890"
  }'

# Create TPA User
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "tpa@opdwallet.com",
    "password": "TPA@123",
    "role": "TPA",
    "uhid": "UH000005",
    "memberId": "OPD000005",
    "name": {
      "firstName": "TPA",
      "lastName": "User"
    },
    "phone": "+1234567891"
  }'

# Set Custom Password
curl -X POST http://localhost:4000/api/users/:id/set-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"password": "CustomPassword@123"}'

# Reset Password (generates temporary)
curl -X POST http://localhost:4000/api/users/:id/reset-password \
  -b cookies.txt

# Get User with Dependents
curl http://localhost:4000/api/users/:id/dependents \
  -b cookies.txt
```