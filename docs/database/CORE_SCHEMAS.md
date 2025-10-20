# OPD WALLET - CORE SCHEMAS

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**Database:** MongoDB (opd_wallet)

> **Quick Navigation:**
> - [Database Overview](./DATABASE_OVERVIEW.md) - Complete database structure and relationships
> - [Master Data Schemas](./MASTER_DATA_SCHEMAS.md) - Master data collections
> - [Healthcare Schemas](./HEALTHCARE_SCHEMAS.md) - Healthcare-related collections
> - [Wallet & Claims Schemas](./WALLET_CLAIMS_SCHEMAS.md) - Wallet and claims management
> - [Lab Diagnostics Schemas](./LAB_DIAGNOSTICS_SCHEMAS.md) - Lab services and orders
> - [Notifications Schemas](./NOTIFICATIONS_SCHEMAS.md) - Notification system

---

## TABLE OF CONTENTS

1. [users](#1-users)
2. [policies](#2-policies)
3. [plan_configs](#3-plan_configs)
4. [userPolicyAssignments](#4-userpolicyassignments)
5. [counters](#5-counters)
6. [auditLogs](#6-auditlogs)

---

## COMPLETE SCHEMA DEFINITIONS

### 1. users

**Collection Name:** `users`
**Purpose:** Core user management for all system users including admins, employees, members, and dependents
**Document Count:** 4 (includes new OPS user)
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  userId: string,                   // REQUIRED, UNIQUE, IMMUTABLE - System-generated user ID
  uhid: string,                     // REQUIRED, UNIQUE - Universal Health ID
  memberId: string,                 // REQUIRED, UNIQUE - Member identification number
  employeeId?: string,              // OPTIONAL, UNIQUE (sparse) - For employees
  relationship: string,             // REQUIRED - Relationship code (e.g., 'REL001', 'REL002') ✨ CHANGED (v3.2)
  primaryMemberId?: string,         // REQUIRED if relationship !== 'SELF' and !== 'REL001' - References memberId
  name: {                          // REQUIRED - Name object
    firstName: string,              // REQUIRED
    lastName: string,               // REQUIRED
    fullName?: string               // AUTO-GENERATED in pre-save hook
  },
  email: string,                    // REQUIRED, UNIQUE, lowercase
  phone: string,                    // REQUIRED, UNIQUE
  dob?: Date,                       // OPTIONAL - Date of birth
  gender?: string,                  // OPTIONAL, ENUM: ['MALE', 'FEMALE', 'OTHER']
  bloodGroup?: string,              // OPTIONAL, ENUM: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] ✨ NEW (v3.2)
  corporateName?: string,           // OPTIONAL - Corporate affiliation
  address?: {                       // OPTIONAL - Address object
    line1: string,
    line2?: string,
    city: string,
    state: string,
    pincode: string
  },
  role: UserRole,                   // REQUIRED, DEFAULT: 'MEMBER' - User role
  status: UserStatus,               // REQUIRED, DEFAULT: 'ACTIVE' - Account status
  passwordHash: string,             // REQUIRED - Bcrypt hashed password
  mustChangePassword: boolean,      // DEFAULT: false - Force password change flag
  createdBy?: string,               // OPTIONAL - userId of creator
  updatedBy?: string,               // OPTIONAL - userId of last updater
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Enums

**UserRole:**
```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',    // Full system access
  ADMIN = 'ADMIN',                // Administrative access
  TPA = 'TPA',                    // Third Party Administrator
  OPS = 'OPS',                    // Operations team
  MEMBER = 'MEMBER'               // Regular member/user
}
```

**UserStatus:**
```typescript
enum UserStatus {
  ACTIVE = 'ACTIVE',              // Active user
  INACTIVE = 'INACTIVE'           // Inactive/disabled user
}
```

**RelationshipType:**
```typescript
enum RelationshipType {
  SELF = 'SELF',                  // Primary member
  SPOUSE = 'SPOUSE',              // Spouse
  CHILD = 'CHILD',                // Child
  MOTHER = 'MOTHER',              // Mother
  FATHER = 'FATHER',              // Father
  OTHER = 'OTHER'                 // Other relationship
}
```

#### Indexes

```typescript
{ email: 1 }                                  // Single field index
{ phone: 1 }                                  // Single field index
{ uhid: 1 }                                   // Single field index
{ memberId: 1 }                               // Single field index
{ employeeId: 1 }, { sparse: true }          // Sparse index (only for employees)
{ userId: 1 }                                 // Single field index
{ primaryMemberId: 1, relationship: 1 }      // Compound index for dependents
```

#### Validation Rules

1. **userId** - Immutable after creation
2. **uhid** - Must be unique across all users
3. **memberId** - Must be unique across all users
4. **employeeId** - Must be unique when present (sparse index)
5. **primaryMemberId** - Required when relationship is not 'SELF'
6. **email** - Must be valid email, converted to lowercase
7. **phone** - Must be unique
8. **name.fullName** - Auto-generated from firstName and lastName in pre-save hook
9. **passwordHash** - Must be bcrypt hashed (minimum 12 rounds as per .env)

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012345"),
  "userId": "USR001",
  "uhid": "UH001",
  "memberId": "MEM001",
  "employeeId": "EMP001",
  "relationship": "SELF",
  "name": {
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe"
  },
  "email": "john.doe@example.com",
  "phone": "+919876543210",
  "dob": ISODate("1990-01-15T00:00:00Z"),
  "gender": "MALE",
  "corporateName": "Tech Corp India",
  "address": {
    "line1": "123 Main Street",
    "line2": "Apartment 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "role": "MEMBER",
  "status": "ACTIVE",
  "passwordHash": "$2b$12$...",
  "mustChangePassword": false,
  "createdAt": ISODate("2025-01-01T10:00:00Z"),
  "updatedAt": ISODate("2025-01-01T10:00:00Z")
}
```

---

### 2. policies

**Collection Name:** `policies`
**Purpose:** Define insurance policies with coverage details and validity periods
**Document Count:** 1
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  policyNumber: string,             // REQUIRED, UNIQUE, IMMUTABLE - Policy identifier
  name: string,                     // REQUIRED, MIN: 3, MAX: 80, trimmed - Policy name
  description?: string,             // OPTIONAL - Policy description
  ownerPayer: OwnerPayerType,      // REQUIRED - Who owns/pays for the policy
  sponsorName?: string,             // OPTIONAL - Sponsor organization name
  status: PolicyStatus,             // REQUIRED, DEFAULT: 'DRAFT' - Policy status
  effectiveFrom: Date,              // REQUIRED - Policy start date
  effectiveTo?: Date,               // OPTIONAL - Policy end date
  createdBy?: string,               // OPTIONAL - userId of creator
  updatedBy?: string,               // OPTIONAL - userId of last updater
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Enums

**PolicyStatus:**
```typescript
enum PolicyStatus {
  DRAFT = 'DRAFT',                  // Policy being configured
  ACTIVE = 'ACTIVE',                // Active policy
  INACTIVE = 'INACTIVE',            // Inactive policy
  EXPIRED = 'EXPIRED'               // Expired policy
}
```

**OwnerPayerType:**
```typescript
enum OwnerPayerType {
  CORPORATE = 'CORPORATE',          // Corporate-funded policy
  INSURER = 'INSURER',              // Insurance company policy
  HYBRID = 'HYBRID'                 // Mixed funding model
}
```

#### Indexes

```typescript
{ policyNumber: 1 }                           // Unique index
{ status: 1, effectiveFrom: 1 }              // Compound index for active policy queries
```

#### Validation Rules

1. **policyNumber** - Must be unique and immutable
2. **name** - Length between 3-80 characters, whitespace trimmed
3. **effectiveFrom** - Required, must be valid date
4. **effectiveTo** - If present, must be after effectiveFrom
5. **ownerPayer** - Must be one of the defined enum values

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012346"),
  "policyNumber": "POL-2025-001",
  "name": "Corporate OPD Benefit Plan 2025",
  "description": "Comprehensive OPD coverage for employees and dependents",
  "ownerPayer": "CORPORATE",
  "sponsorName": "Tech Corp India",
  "status": "ACTIVE",
  "effectiveFrom": ISODate("2025-01-01T00:00:00Z"),
  "effectiveTo": ISODate("2025-12-31T23:59:59Z"),
  "createdBy": "USR001",
  "updatedBy": "USR001",
  "createdAt": ISODate("2024-12-15T10:00:00Z"),
  "updatedAt": ISODate("2024-12-15T10:00:00Z")
}
```

---

### 3. plan_configs

**Collection Name:** `plan_configs`
**Purpose:** Store versioned plan configurations with benefits, wallet rules, and relationship-specific settings
**Document Count:** 1
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                                // MongoDB auto-generated
  policyId: ObjectId,                           // REQUIRED, REF: 'Policy', indexed - Reference to policy
  version: number,                              // REQUIRED, DEFAULT: 1 - Configuration version
  status: string,                               // REQUIRED, DEFAULT: 'DRAFT', ENUM: ['DRAFT', 'PUBLISHED']
  isCurrent: boolean,                           // DEFAULT: false - Is this the current active version

  // Benefits Configuration (Policy-level defaults)
  benefits: {
    consultation?: {
      enabled: boolean,
      annualLimit?: number,                     // Annual monetary limit
      visitLimit?: number,                      // Number of visits per year
      notes?: string,
      onlineEnabled?: boolean,
      offlineEnabled?: boolean,
      vasEnabled?: boolean                      // Value Added Services
    },
    pharmacy?: {
      enabled: boolean,
      annualLimit?: number,
      rxRequired?: boolean,                     // Prescription required
      notes?: string,
      onlineEnabled?: boolean,
      offlineEnabled?: boolean,
      vasEnabled?: boolean
    },
    diagnostics?: {
      enabled: boolean,
      annualLimit?: number,
      rxRequired?: boolean,
      notes?: string,
      onlineEnabled?: boolean,
      offlineEnabled?: boolean,
      vasEnabled?: boolean
    },
    dental?: {
      enabled: boolean,
      annualLimit?: number,
      notes?: string,
      onlineEnabled?: boolean,
      offlineEnabled?: boolean,
      vasEnabled?: boolean
    },
    vision?: {
      enabled: boolean,
      annualLimit?: number,
      notes?: string,
      onlineEnabled?: boolean,
      offlineEnabled?: boolean,
      vasEnabled?: boolean
    },
    wellness?: {
      enabled: boolean,
      annualLimit?: number,
      notes?: string,
      onlineEnabled?: boolean,
      offlineEnabled?: boolean,
      vasEnabled?: boolean
    }
  },

  // Wallet Configuration (Policy-level defaults)
  wallet: {
    totalAnnualAmount?: number,                 // Total wallet amount per year
    perClaimLimit?: number,                     // Maximum per claim
    copay?: {                                   // Co-payment configuration
      mode: 'PERCENT' | 'AMOUNT',              // Percentage or fixed amount
      value: number
    },
    partialPaymentEnabled?: boolean,            // Allow partial payments
    carryForward?: {
      enabled: boolean,
      percent?: number,                         // Percentage to carry forward
      months?: number                           // Validity in months
    },
    topUpAllowed?: boolean                      // Allow wallet top-ups
  },

  // Covered Relationships
  coveredRelationships: string[],               // DEFAULT: ['SELF'] - Array of relationship codes

  // Member-specific Configurations (overrides by relationship)
  memberConfigs: {
    [relationshipCode: string]: {               // Key is RelationshipType (SELF, SPOUSE, etc.)
      benefits?: {                              // Same structure as benefits above
        consultation?: { /* same as above */ },
        pharmacy?: { /* same as above */ },
        diagnostics?: { /* same as above */ },
        dental?: { /* same as above */ },
        vision?: { /* same as above */ },
        wellness?: { /* same as above */ }
      },
      wallet?: {                                // Relationship-specific wallet config
        totalAnnualAmount?: number,
        perClaimLimit?: number,
        copay?: { mode: 'PERCENT' | 'AMOUNT'; value: number },
        partialPaymentEnabled?: boolean,
        carryForward?: { enabled: boolean; percent?: number; months?: number },
        topUpAllowed?: boolean,
        isFloater?: boolean,                    // Shared wallet across relationships
        floaterSharedWith?: string[]            // Relationships sharing this wallet
      },
      inheritFromPrimary?: boolean              // Inherit benefits from SELF
    }
  },

  createdBy?: string,                           // userId of creator
  updatedBy?: string,                           // userId of last updater
  publishedBy?: string,                         // userId who published
  publishedAt?: Date,                           // Publication timestamp
  createdAt: Date,                              // AUTO - Timestamp
  updatedAt: Date                               // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ policyId: 1, version: 1 }, { unique: true }  // Compound unique index
{ policyId: 1 }                                 // Single field index
```

#### Validation Rules

1. **policyId** - Must reference a valid Policy document
2. **version** - Must be unique per policyId
3. **status** - Only 'DRAFT' or 'PUBLISHED'
4. **isCurrent** - Only one plan config per policy should have isCurrent=true
5. **coveredRelationships** - Must contain valid RelationshipType values
6. **memberConfigs keys** - Must be valid RelationshipType values
7. **copay.mode** - Must be either 'PERCENT' or 'AMOUNT'
8. **carryForward.percent** - If present, should be 0-100
9. **annualLimit** - All monetary values should be >= 0

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012347"),
  "policyId": ObjectId("674d8e123abc456789012346"),
  "version": 1,
  "status": "PUBLISHED",
  "isCurrent": true,
  "benefits": {
    "consultation": {
      "enabled": true,
      "annualLimit": 50000,
      "visitLimit": 10,
      "notes": "Includes general physician and specialist consultations",
      "onlineEnabled": true,
      "offlineEnabled": true,
      "vasEnabled": false
    },
    "pharmacy": {
      "enabled": true,
      "annualLimit": 30000,
      "rxRequired": true,
      "notes": "Valid prescription required",
      "onlineEnabled": true,
      "offlineEnabled": true,
      "vasEnabled": true
    },
    "diagnostics": {
      "enabled": true,
      "annualLimit": 25000,
      "rxRequired": false,
      "onlineEnabled": true,
      "offlineEnabled": true,
      "vasEnabled": false
    }
  },
  "wallet": {
    "totalAnnualAmount": 100000,
    "perClaimLimit": 10000,
    "copay": {
      "mode": "PERCENT",
      "value": 10
    },
    "partialPaymentEnabled": true,
    "carryForward": {
      "enabled": true,
      "percent": 50,
      "months": 3
    },
    "topUpAllowed": false
  },
  "coveredRelationships": ["SELF", "SPOUSE", "CHILD"],
  "memberConfigs": {
    "SELF": {
      "wallet": {
        "totalAnnualAmount": 100000,
        "isFloater": false
      },
      "inheritFromPrimary": false
    },
    "SPOUSE": {
      "wallet": {
        "totalAnnualAmount": 80000,
        "isFloater": true,
        "floaterSharedWith": ["SPOUSE", "CHILD"]
      },
      "inheritFromPrimary": true
    },
    "CHILD": {
      "wallet": {
        "isFloater": true,
        "floaterSharedWith": ["SPOUSE", "CHILD"]
      },
      "inheritFromPrimary": true
    }
  },
  "createdBy": "USR001",
  "updatedBy": "USR001",
  "publishedBy": "USR001",
  "publishedAt": ISODate("2025-01-01T00:00:00Z"),
  "createdAt": ISODate("2024-12-20T10:00:00Z"),
  "updatedAt": ISODate("2025-01-01T00:00:00Z")
}
```

---

### 4. userPolicyAssignments

**Collection Name:** `userPolicyAssignments`
**Purpose:** Link users to policies with effective dates and optional plan version overrides
**Document Count:** 0 (Empty)
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  assignmentId: string,             // REQUIRED, UNIQUE - System-generated assignment ID
  userId: ObjectId,                 // REQUIRED, REF: 'User' - User reference
  policyId: ObjectId,               // REQUIRED, REF: 'Policy' - Policy reference
  effectiveFrom: Date,              // REQUIRED - Assignment start date (must be explicit)
  effectiveTo: Date,                // REQUIRED - Assignment end date (wallet validity depends on this)
  planVersionOverride?: number,     // OPTIONAL - Override to specific plan version
  isActive: boolean,                // DEFAULT: true - Is assignment active
  relationshipId?: string,          // OPTIONAL - Relationship identifier
  primaryMemberId?: string,         // OPTIONAL - For dependents, primary member's userId
  planConfigId?: ObjectId,          // OPTIONAL, REF: 'PlanConfig' - Specific plan config reference
  createdBy?: string,               // OPTIONAL - userId of creator
  updatedBy?: string,               // OPTIONAL - userId of last updater
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ userId: 1, isActive: 1 }                    // Compound index for user queries
{ policyId: 1, isActive: 1 }                  // Compound index for policy queries
{ assignmentId: 1 }, { unique: true }         // Unique index
```

#### Validation Rules

1. **assignmentId** - Must be unique
2. **userId** - Must reference a valid User document
3. **policyId** - Must reference a valid Policy document
4. **planConfigId** - If present, must reference a valid PlanConfig document
5. **effectiveFrom** - Required, must be a valid date (no default)
6. **effectiveTo** - Required, must be after effectiveFrom
7. **planVersionOverride** - If present, must be a valid version number for the policy

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012348"),
  "assignmentId": "ASGN-001",
  "userId": ObjectId("674d8e123abc456789012345"),
  "policyId": ObjectId("674d8e123abc456789012346"),
  "planConfigId": ObjectId("674d8e123abc456789012347"),
  "effectiveFrom": ISODate("2025-01-01T00:00:00Z"),
  "effectiveTo": ISODate("2025-12-31T23:59:59Z"),
  "planVersionOverride": null,
  "isActive": true,
  "relationshipId": "SELF",
  "primaryMemberId": null,
  "createdBy": "USR001",
  "updatedBy": "USR001",
  "createdAt": ISODate("2025-01-01T10:00:00Z"),
  "updatedAt": ISODate("2025-01-01T10:00:00Z")
}
```

---

### 5. counters

**Collection Name:** `counters`
**Purpose:** Auto-increment counter sequences for generating unique IDs
**Document Count:** 2
**Timestamps:** No

#### Schema Definition

```typescript
{
  _id: string,                      // REQUIRED, UNIQUE - Counter name/identifier
  seq: number                       // REQUIRED, DEFAULT: 0 - Current sequence number
}
```

#### Validation Rules

1. **_id** - Must be unique, used as counter name
2. **seq** - Monotonically increasing integer

#### Sample Data Examples

```json
[
  {
    "_id": "userId",
    "seq": 3
  },
  {
    "_id": "assignmentId",
    "seq": 0
  }
]
```

---

### 6. auditLogs

**Collection Name:** `auditLogs`
**Purpose:** Complete audit trail of all system actions with automatic 2-year data retention
**Document Count:** 0 (Empty)
**Timestamps:** createdAt only

#### Schema Definition

```typescript
{
  _id: ObjectId,
  userId: string,
  userEmail: string,
  userRole: string,
  action: string,  // ENUM: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, AUTH_FAILURE, etc.
  resource: string,
  resourceId?: ObjectId,
  before?: Record<string, any>,
  after?: Record<string, any>,
  metadata?: {
    ip?: string,
    userAgent?: string,
    method?: string,
    path?: string,
    statusCode?: number,
    duration?: number
  },
  description?: string,
  isSystemAction: boolean,
  createdAt: Date  // TTL: 2 years (63072000 seconds)
}
```

#### Indexes

```typescript
{ createdAt: 1 }, { expireAfterSeconds: 63072000 }  // TTL index (2 years)
{ userId: 1, createdAt: -1 }                        // User audit trail
{ action: 1, createdAt: -1 }                        // Action-based queries
{ resource: 1, resourceId: 1, createdAt: -1 }      // Resource audit trail
```

#### Validation Rules

1. **userId** - Required for user actions (optional for system actions)
2. **action** - Must be a valid action enum
3. **resource** - Must identify the affected resource type
4. **createdAt** - Automatically set, used for TTL expiration
5. **TTL** - Records automatically deleted after 2 years (63072000 seconds)

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012349"),
  "userId": "USR001",
  "userEmail": "john.doe@example.com",
  "userRole": "MEMBER",
  "action": "UPDATE",
  "resource": "users",
  "resourceId": ObjectId("674d8e123abc456789012345"),
  "before": {
    "phone": "+919876543210"
  },
  "after": {
    "phone": "+919876543211"
  },
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "method": "PUT",
    "path": "/api/users/USR001",
    "statusCode": 200,
    "duration": 45
  },
  "description": "User updated their phone number",
  "isSystemAction": false,
  "createdAt": ISODate("2025-01-15T14:30:00Z")
}
```

---

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**For Questions:** Contact development team
