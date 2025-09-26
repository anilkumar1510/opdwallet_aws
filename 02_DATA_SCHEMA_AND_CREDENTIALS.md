# OPD Wallet Database Schema & Credentials

**Last Updated**: September 24, 2025
**Database**: MongoDB `opd_wallet`
**Collections**: 12 collections (9 active, 3 empty)
**Total Documents**: 28 documents
**Status**: PRODUCTION-READY WITH COMPREHENSIVE SCHEMAS

## Database Connection

```javascript
// Development/Production Connection
mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin

// Connection String Breakdown
Host: localhost:27017
Database: opd_wallet
Username: admin
Password: admin123 ⚠️ SECURITY RISK - Change in production
AuthSource: admin
```

## Collection Overview & Statistics

| Collection | Documents | Status | Primary Purpose |
|------------|-----------|---------|-----------------|
| `users` | 3 | Active | User management and authentication |
| `policies` | 1 | Active | Insurance policy definitions |
| `plan_configs` | 3 | Active | Policy configuration versions |
| `userPolicyAssignments` | 4 | Active | User-policy relationships |
| `category_master` | 3 | Active | Service categories |
| `service_master` | 4 | Active | Available medical services |
| `relationship_masters` | 5 | Active | Family relationship definitions |
| `counters` | 2 | Active | Auto-increment sequences |
| `cug_master` | 8 | Active | Corporate user groups |
| `user_wallets` | 0 | Empty | User wallet balances (not implemented) |
| `wallet_transactions` | 0 | Empty | Wallet transaction history (not implemented) |
| `auditLogs` | 0 | Empty | System audit trail (not functioning) |

## Detailed Schema Definitions

### 1. USERS Collection
**Purpose**: Core user management with authentication and profile data
**Document Count**: 3 (1 Super Admin, 2 Members)

```javascript
{
  _id: ObjectId("unique_identifier"),
  userId: String,              // Auto-generated: "USR-2025-XXXX"
  uhid: String,               // Unique Health ID
  memberId: String,           // Member identifier: "MEM001", "MEM002"
  employeeId: String,         // Employee ID (optional)
  relationship: String,       // References relationship_masters.relationshipCode
  primaryMemberId: String,    // For dependents, references primary member's memberId

  // Personal Information
  name: {
    firstName: String,        // Required
    lastName: String,         // Required
    fullName: String,         // Auto-generated: firstName + lastName
    _id: ObjectId            // Mongoose sub-document ID
  },

  // Contact Information
  email: String,              // Unique, used for login
  phone: String,              // Contact number

  // Demographics
  dob: Date,                  // Date of birth
  gender: String,             // "MALE" | "FEMALE"

  // Address Information
  address: {
    line1: String,            // Primary address line
    line2: String,            // Secondary address line (optional)
    city: String,             // City name
    state: String,            // State name
    pincode: String,          // Postal code
    _id: ObjectId            // Mongoose sub-document ID
  },

  // System Fields
  role: String,              // "SUPER_ADMIN" | "MEMBER"
  status: String,            // "ACTIVE" | "INACTIVE"
  passwordHash: String,      // bcrypt hash (12 rounds)
  mustChangePassword: Boolean, // Force password change flag

  // Timestamps
  createdAt: Date,           // Record creation timestamp
  updatedAt: Date,           // Last modification timestamp
  __v: Number               // Mongoose version key
}
```

**Indexes**:
- `_id_` (Primary key)
- `userId_1` (Unique user identifier)
- `uhid_1` (Unique health ID lookup)
- `memberId_1` (Member lookup)
- `email_1` (Login lookup)
- `phone_1` (Contact lookup)

**Sample Data** (sensitive data masked):
```javascript
// Super Admin
{
  userId: "USR-2025-0001",
  role: "SUPER_ADMIN",
  email: "admin@opdwallet.com",
  name: { firstName: "Super", lastName: "Admin" }
}

// Primary Member
{
  userId: "USR-2025-0002",
  memberId: "MEM002",
  relationship: "REL001", // Self
  role: "MEMBER"
}

// Dependent Member
{
  userId: "USR-2025-0003",
  memberId: "MEM003",
  primaryMemberId: "MEM002",
  relationship: "REL002", // Spouse
  role: "MEMBER"
}
```

### 2. POLICIES Collection
**Purpose**: Master insurance policy definitions
**Document Count**: 1

```javascript
{
  _id: ObjectId("unique_identifier"),
  policyNumber: String,       // Auto-generated: "POL-2025-XXXX"
  name: String,              // Policy display name
  description: String,        // Policy description
  ownerPayer: String,        // "INSURER" | "EMPLOYER" | "INDIVIDUAL"
  status: String,            // "ACTIVE" | "INACTIVE" | "EXPIRED"
  effectiveFrom: Date,       // Policy start date
  effectiveTo: Date,         // Policy end date (null for ongoing)

  // Audit Fields
  createdBy: ObjectId,       // References users._id
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

**Indexes**:
- `_id_` (Primary key)
- `policyNumber_1` (Unique policy identifier)

**Current Data**:
```javascript
{
  policyNumber: "POL-2025-0003",
  name: "Comprehensive Health Policy",
  ownerPayer: "INSURER",
  status: "ACTIVE"
}
```

### 3. PLAN_CONFIGS Collection
**Purpose**: Versioned policy configurations with benefits and wallet rules
**Document Count**: 3 (versions for the active policy)

```javascript
{
  _id: ObjectId("unique_identifier"),
  policyId: ObjectId,         // References policies._id
  version: Number,           // Version number (1, 2, 3...)
  status: String,            // "DRAFT" | "PUBLISHED" | "ARCHIVED"
  isCurrent: Boolean,        // True for the active version

  // Benefits Configuration by Category
  benefits: {
    "CAT001": {              // Consult category
      enabled: Boolean,      // Category enabled/disabled
      annualLimit: Number    // Annual limit amount
    },
    "CAT002": {              // Pharmacy category
      enabled: Boolean,
      annualLimit: Number
    },
    "CAT003": {              // Labs category
      enabled: Boolean,
      annualLimit: Number
    }
  },

  // Wallet Configuration
  wallet: {
    totalAnnualAmount: Number,    // Total annual wallet amount
    perClaimLimit: Number,        // Maximum per claim limit
    copay: {
      mode: String,              // "PERCENT" | "FIXED"
      value: Number              // Copay percentage or fixed amount
    },
    partialPaymentEnabled: Boolean,
    carryForward: {
      enabled: Boolean,          // Allow balance carry forward
      percent: Number,           // Percentage to carry forward
      months: Number            // Carry forward period in months
    },
    topUpAllowed: Boolean        // Allow wallet top-up
  },

  // Covered Relationships
  coveredRelationships: [String], // Array of relationship codes

  // Relationship-specific Overrides
  memberConfigs: {
    "REL002": {                 // Spouse-specific config
      inheritFromPrimary: Boolean,
      benefits: Object,         // Override benefits structure
      wallet: Object,           // Override wallet structure
      enabledServices: Object   // Override service enablement
    }
  },

  // Service Enablement by Service Code
  enabledServices: {
    "CON001": { enabled: Boolean }, // General Physician
    "CON002": { enabled: Boolean }, // Gynecologist
    "CON003": { enabled: Boolean }, // Pharmacy
    "CON004": { enabled: Boolean }  // Labs
  },

  // Audit Fields
  createdBy: ObjectId,
  updatedBy: ObjectId,
  publishedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date,
  __v: Number
}
```

### 4. USER_POLICY_ASSIGNMENTS Collection
**Purpose**: Links users to policies with effective periods
**Document Count**: 4 (2 active, 2 orphaned)

```javascript
{
  _id: ObjectId("unique_identifier"),
  assignmentId: String,       // Auto-generated: "ASG-[timestamp]-[random]"
  userId: ObjectId,          // ⚠️ References users._id (data type inconsistency)
  policyId: ObjectId,        // References policies._id
  effectiveFrom: Date,       // Assignment start date
  effectiveTo: Date,         // Assignment end date (null for active)
  isActive: Boolean,         // Assignment status

  // Audit Fields
  createdBy: ObjectId,       // References users._id
  updatedBy: ObjectId,       // References users._id (optional)
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

**⚠️ Data Integrity Issues**:
- 2 assignments reference non-existent policy `68cea00fe4701dcd411b138a`
- userId field uses ObjectId but should reference users.userId string

### 5. CATEGORY_MASTER Collection
**Purpose**: Medical service categories for organizing services
**Document Count**: 3

```javascript
{
  _id: ObjectId("unique_identifier"),
  categoryId: String,         // "CAT001", "CAT002", "CAT003"
  code: String,              // Same as categoryId (duplicate field)
  name: String,              // Display name
  description: String,        // Category description
  isActive: Boolean,         // Active status
  displayOrder: Number,      // Sort order for UI
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

**Master Data**:
```javascript
[
  { categoryId: "CAT001", name: "Consult", displayOrder: 1 },
  { categoryId: "CAT002", name: "Pharmacy", displayOrder: 2 },
  { categoryId: "CAT003", name: "Labs", displayOrder: 3 }
]
```

### 6. SERVICE_MASTER Collection
**Purpose**: Available medical services with coverage details
**Document Count**: 4

```javascript
{
  _id: ObjectId("unique_identifier"),
  code: String,              // Unique service code: "CON001", "CON002", etc.
  name: String,              // Service display name
  description: String,        // Service description
  category: String,          // References category_master.categoryId
  isActive: Boolean,         // Service availability

  // Coverage Details
  coveragePercentage: Number,    // Coverage percentage (0-100)
  copayAmount: Number,           // Fixed copay amount
  requiresPreAuth: Boolean,      // Pre-authorization required
  requiresReferral: Boolean,     // Referral required
  waitingPeriodDays: Number,     // Waiting period in days
  requiredDocuments: [String],   // Required document types

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

**Service Data**:
```javascript
[
  { code: "CON001", name: "General Physician", category: "CAT001" },
  { code: "CON002", name: "Gynecologist", category: "CAT001" },
  { code: "CON003", name: "Pharmacy", category: "CAT002" },
  { code: "CON004", name: "Labs", category: "CAT003" }
]
```

### 7. RELATIONSHIP_MASTERS Collection
**Purpose**: Family relationship definitions for policy coverage
**Document Count**: 5

```javascript
{
  _id: ObjectId("unique_identifier"),
  relationshipCode: String,   // "REL001", "REL002", etc.
  relationshipName: String,   // "Self", "Spouse", "Child", etc.
  displayName: String,        // UI display name
  description: String,        // Relationship description
  isActive: Boolean,         // Relationship status
  sortOrder: Number,         // Display sort order
  createdAt: Date,
  updatedAt: Date
}
```

**Relationship Data**:
```javascript
[
  { relationshipCode: "REL001", relationshipName: "Self", sortOrder: 1 },
  { relationshipCode: "REL002", relationshipName: "Spouse", sortOrder: 2 },
  { relationshipCode: "REL003", relationshipName: "Child", sortOrder: 3 },
  { relationshipCode: "REL004", relationshipName: "Father", sortOrder: 4 },
  { relationshipCode: "REL005", relationshipName: "Mother", sortOrder: 5 }
]
```

### 8. COUNTERS Collection
**Purpose**: Auto-increment sequences for generating unique IDs
**Document Count**: 2

```javascript
{
  _id: String,               // Counter name: "user", "policy"
  seq: Number,               // Current sequence number
  __v: Number               // Mongoose version key
}
```

**Current Sequences**:
```javascript
[
  { _id: "user", seq: 3 },    // Next user: USR-2025-0004
  { _id: "policy", seq: 3 }   // Next policy: POL-2025-0004
]
```

### 9. CUG_MASTER Collection
**Purpose**: Corporate User Groups for enterprise customers
**Document Count**: 8

```javascript
{
  _id: ObjectId("unique_identifier"),
  cugId: String,             // "CUG001", "CUG002", etc.
  code: String,              // Company code: "GOOGLE", "MICROSOFT", etc.
  name: String,              // Full company name
  description: String,        // Company description
  isActive: Boolean,         // CUG status
  displayOrder: Number,      // Sort order for UI
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

**Corporate Data**: Google, Microsoft, Amazon, Apple, Meta, Netflix, Tesla, IBM

### 10. USER_WALLETS Collection (Empty - Not Implemented)
**Purpose**: User wallet balances and policy-specific limits
**Document Count**: 0

**Expected Schema**:
```javascript
{
  _id: ObjectId("unique_identifier"),
  userId: String,                    // References users.userId
  policyAssignmentId: ObjectId,      // References userPolicyAssignments._id
  isActive: Boolean,                 // Wallet active status
  effectiveFrom: Date,               // Wallet validity start
  effectiveTo: Date,                 // Wallet validity end
  totalBalance: Number,              // Current wallet balance
  allocatedAmount: Number,           // Originally allocated amount
  utilizedAmount: Number,            // Amount utilized to date
  categoryBalances: Object,          // Category-wise balances
  createdAt: Date,
  updatedAt: Date
}
```

### 11. WALLET_TRANSACTIONS Collection (Empty - Not Implemented)
**Purpose**: Complete history of wallet transactions
**Document Count**: 0

**Expected Schema**:
```javascript
{
  _id: ObjectId("unique_identifier"),
  userId: String,                    // References users.userId
  userWalletId: ObjectId,           // References user_wallets._id
  transactionId: String,            // Unique transaction identifier
  type: String,                     // "CREDIT" | "DEBIT" | "REFUND" | "TOPUP"
  amount: Number,                   // Transaction amount
  balanceBefore: Number,            // Wallet balance before transaction
  balanceAfter: Number,             // Wallet balance after transaction
  bookingId: String,                // Related booking/claim ID
  serviceCode: String,              // Service availed
  description: String,              // Transaction description
  createdAt: Date
}
```

### 12. AUDIT_LOGS Collection (Empty - Not Functioning)
**Purpose**: System audit trail for compliance
**Document Count**: 0

**Expected Schema**:
```javascript
{
  _id: ObjectId("unique_identifier"),
  userId: ObjectId,                 // User who performed action
  action: String,                   // Action type: "CREATE", "UPDATE", "DELETE"
  entity: String,                   // Entity type: "USER", "POLICY", etc.
  entityId: String,                 // ID of the affected entity
  oldValues: Object,                // Previous values
  newValues: Object,                // New values
  ipAddress: String,                // Client IP address
  userAgent: String,                // Client user agent
  createdAt: Date                   // Action timestamp
}
```

## Collection Relationships & Foreign Keys

### Active Relationships
```
users._id ← userPolicyAssignments.userId (⚠️ Type mismatch)
users._id ← userPolicyAssignments.createdBy
users._id ← userPolicyAssignments.updatedBy

policies._id ← userPolicyAssignments.policyId
policies._id ← plan_configs.policyId

users._id ← plan_configs.createdBy
users._id ← plan_configs.updatedBy
users._id ← plan_configs.publishedBy

category_master.categoryId ← service_master.category
relationship_masters.relationshipCode ← users.relationship
users.memberId ← users.primaryMemberId (family relationships)
```

### Expected Relationships (Empty Collections)
```
userPolicyAssignments._id ← user_wallets.policyAssignmentId
user_wallets._id ← wallet_transactions.userWalletId
users.userId ← user_wallets.userId
users.userId ← wallet_transactions.userId
```

## Data Integrity Issues & Recommendations

### Critical Issues ⚠️

1. **Orphaned Policy References** (HIGH PRIORITY)
   - 2 `userPolicyAssignments` reference deleted policy `68cea00fe4701dcd411b138a`
   - 2 `plan_configs` reference deleted policy `68cea00fe4701dcd411b138a`

2. **Data Type Inconsistency** (HIGH PRIORITY)
   - `userPolicyAssignments.userId` uses ObjectId format
   - Should reference `users.userId` (string) consistently

3. **Missing Implementations** (MEDIUM PRIORITY)
   - Audit logging not functioning
   - Wallet management not implemented
   - Transaction tracking missing

### Security Issues 🚨

1. **Database Credentials**
   ```
   Username: admin
   Password: admin123 ⚠️ WEAK/DEFAULT PASSWORD
   ```

2. **Production Configuration**
   - MongoDB runs without authentication in production
   - No SSL/TLS encryption
   - Hardcoded credentials in source code

### Immediate Actions Required

1. **Data Cleanup**:
   - Remove orphaned userPolicyAssignments and plan_configs
   - Fix userId reference type consistency
   - Clean up unused master data

2. **Security Fixes**:
   - Generate strong database credentials
   - Enable MongoDB authentication in production
   - Remove hardcoded credentials from code
   - Implement SSL/TLS encryption

3. **Feature Implementation**:
   - Enable audit logging functionality
   - Implement user wallet management
   - Add transaction tracking

## API Integration Points

### Authentication
- `users` collection for login validation
- Email/password authentication
- Role-based access control

### Policy Management
- `policies` → `plan_configs` → `userPolicyAssignments` flow
- Version control for policy configurations
- Family member coverage through relationship mappings

### Master Data
- Service categories and services for UI dropdowns
- Relationship definitions for family coverage
- Corporate groups for enterprise features

### Wallet System (Planned)
- Policy assignment → wallet creation
- Transaction tracking for claims
- Balance management and reporting

---

**Document Version**: 4.0
**Last Database Analysis**: September 24, 2025
**Next Review**: Monthly or when schema changes occur
**Critical Security Review**: IMMEDIATE - Production credentials exposed