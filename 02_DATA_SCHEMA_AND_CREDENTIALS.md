# OPD WALLET - DATA SCHEMA AND CREDENTIALS DOCUMENTATION

**Document Version:** 2.2
**Last Updated:** September 28, 2025 (Evening Update)
**Database:** MongoDB (opd_wallet)
**Total Collections:** 17

---

## TABLE OF CONTENTS

1. [Database Overview](#database-overview)
2. [Collections Summary](#collections-summary)
3. [Complete Schema Definitions](#complete-schema-definitions)
   - [users](#1-users)
   - [policies](#2-policies)
   - [plan_configs](#3-plan_configs)
   - [userPolicyAssignments](#4-userpolicyassignments)
   - [category_master](#5-category_master)
   - [service_master](#6-service_master)
   - [relationship_masters](#7-relationship_masters)
   - [cug_master](#8-cug_master)
   - [counters](#9-counters)
   - [user_wallets](#10-user_wallets)
   - [wallet_transactions](#11-wallet_transactions)
   - [auditLogs](#12-auditlogs)
   - [specialty_master](#13-specialty_master)
   - [doctors](#14-doctors)
   - [appointments](#15-appointments)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Data Integrity Rules](#data-integrity-rules)
6. [Indexes & Performance](#indexes--performance)
7. [Sample Queries](#sample-queries)
8. [Credentials & Connection](#credentials--connection)
9. [Migration Notes](#migration-notes)

---

## DATABASE OVERVIEW

**Database Name:** `opd_wallet`
**Authentication:** MongoDB Admin Auth
**Total Collections:** 17
**Total Documents:** 66 (actual count)

### Current Data Distribution

| Collection | Document Count | Status |
|-----------|----------------|--------|
| users | 4 | Active |
| policies | 1 | Active |
| plan_configs | 1 | Active |
| userPolicyAssignments | 0 | Empty |
| category_master | 4 | Active |
| service_master | 4 | Active |
| relationship_masters | 5 | Active |
| cug_master | 8 | Active |
| counters | 2 | Active |
| user_wallets | 0 | Empty |
| wallet_transactions | 0 | Empty |
| auditLogs | 0 | Empty |
| specialty_master | 9 | Active |
| doctors | 6 | Active |
| clinics | 5 | Active |
| doctor_slots | 17 | Active |
| appointments | 0 | Empty |

---

## COLLECTIONS SUMMARY

### Core Collections
- **users** - User accounts (employees, members, dependents, admins)
- **policies** - Insurance policy definitions
- **plan_configs** - Policy plan configurations with benefits and wallet rules

### Assignment & Wallet Collections
- **userPolicyAssignments** - Links users to policies
- **user_wallets** - User wallet balances per policy
- **wallet_transactions** - All wallet transactions history

### Master Data Collections
- **category_master** - Service categories (Consultation, Pharmacy, etc.)
- **service_master** - Services within categories
- **relationship_masters** - Family relationship types
- **cug_master** - Corporate User Groups
- **specialty_master** - Medical specialties

### Healthcare Collections
- **doctors** - Doctor profiles with clinics and availability
- **appointments** - Appointment bookings

### System Collections
- **counters** - Auto-increment counters for IDs
- **auditLogs** - Audit trail with TTL (2 years retention)

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
  relationship: RelationshipType,   // REQUIRED, DEFAULT: 'SELF' - Relationship to primary member
  primaryMemberId?: string,         // REQUIRED if relationship !== 'SELF' - References userId
  name: {                          // REQUIRED - Name object
    firstName: string,              // REQUIRED
    lastName: string,               // REQUIRED
    fullName?: string               // AUTO-GENERATED in pre-save hook
  },
  email: string,                    // REQUIRED, UNIQUE, lowercase
  phone: string,                    // REQUIRED, UNIQUE
  dob?: Date,                       // OPTIONAL - Date of birth
  gender?: string,                  // OPTIONAL, ENUM: ['MALE', 'FEMALE', 'OTHER']
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
  effectiveFrom: Date,              // REQUIRED, DEFAULT: now() - Assignment start date
  effectiveTo?: Date,               // OPTIONAL - Assignment end date
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
5. **effectiveTo** - If present, must be after effectiveFrom
6. **planVersionOverride** - If present, must be a valid version number for the policy

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

### 5. category_master

**Collection Name:** `category_master`
**Purpose:** Master data for service categories (Consultation, Pharmacy, Diagnostics, etc.)
**Document Count:** 4
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  categoryId: string,               // REQUIRED, UNIQUE, UPPERCASE, indexed - Category identifier
  code: string,                     // REQUIRED, UNIQUE, UPPERCASE - Category code
  name: string,                     // REQUIRED - Category display name
  isActive: boolean,                // DEFAULT: true - Is category active
  displayOrder: number,             // REQUIRED - Sort order for display
  description?: string,             // OPTIONAL - Category description
  isAvailableOnline?: boolean,      // DEFAULT: false - Available for online services
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ categoryId: 1 }, { unique: true }           // Unique index
{ code: 1 }, { unique: true }                 // Unique index
{ isActive: 1, displayOrder: 1 }              // Compound index for listing
```

#### Validation Rules

1. **categoryId** - Must be unique, uppercase, immutable
2. **code** - Must be unique, uppercase
3. **displayOrder** - Required, used for sorting in UI

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("674d8e123abc456789012350"),
    "categoryId": "CAT-CONS",
    "code": "CONSULTATION",
    "name": "Consultation",
    "isActive": true,
    "displayOrder": 1,
    "description": "Doctor consultations - general and specialist",
    "isAvailableOnline": true,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012351"),
    "categoryId": "CAT-PHARM",
    "code": "PHARMACY",
    "name": "Pharmacy",
    "isActive": true,
    "displayOrder": 2,
    "description": "Medicine and pharmaceutical products",
    "isAvailableOnline": true,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012352"),
    "categoryId": "CAT-DIAG",
    "code": "DIAGNOSTICS",
    "name": "Diagnostics",
    "isActive": true,
    "displayOrder": 3,
    "description": "Lab tests and diagnostic procedures",
    "isAvailableOnline": false,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012353"),
    "categoryId": "CAT-DENT",
    "code": "DENTAL",
    "name": "Dental",
    "isActive": true,
    "displayOrder": 4,
    "description": "Dental care and procedures",
    "isAvailableOnline": false,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  }
]
```

---

### 6. service_master

**Collection Name:** `service_master`
**Purpose:** Master data for services within categories with pricing and coverage rules
**Document Count:** 4
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  code: string,                     // REQUIRED, UNIQUE, UPPERCASE, indexed - Service code
  name: string,                     // REQUIRED - Service name
  description?: string,             // OPTIONAL - Service description
  category: string,                 // REQUIRED, UPPERCASE - Category code (from category_master)
  isActive: boolean,                // DEFAULT: true - Is service active
  coveragePercentage: number,       // DEFAULT: 100 - Coverage percentage (0-100)
  copayAmount: number,              // DEFAULT: 0 - Fixed co-payment amount
  requiresPreAuth: boolean,         // DEFAULT: false - Requires pre-authorization
  requiresReferral: boolean,        // DEFAULT: false - Requires doctor referral
  priceRange?: {                    // OPTIONAL - Price range
    min: number,
    max: number
  },
  annualLimit?: number,             // OPTIONAL - Annual limit for this service
  waitingPeriodDays: number,        // DEFAULT: 0 - Waiting period in days
  requiredDocuments: string[],      // DEFAULT: [] - Required document types
  createdBy?: string,               // OPTIONAL - userId of creator
  updatedBy?: string,               // OPTIONAL - userId of last updater
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ code: 1 }, { unique: true }                 // Unique index
{ category: 1, isActive: 1 }                  // Compound index for category queries
```

#### Validation Rules

1. **code** - Must be unique, uppercase
2. **category** - Must match a valid category code from category_master
3. **coveragePercentage** - Should be 0-100
4. **copayAmount** - Should be >= 0
5. **priceRange.max** - If present, must be >= priceRange.min
6. **annualLimit** - If present, should be > 0

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("674d8e123abc456789012360"),
    "code": "CONS-GP",
    "name": "General Physician Consultation",
    "description": "Consultation with a general physician",
    "category": "CONSULTATION",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 0,
    "requiresPreAuth": false,
    "requiresReferral": false,
    "priceRange": {
      "min": 300,
      "max": 800
    },
    "annualLimit": 10000,
    "waitingPeriodDays": 0,
    "requiredDocuments": [],
    "createdBy": "USR001",
    "updatedBy": "USR001",
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012361"),
    "code": "CONS-SPEC",
    "name": "Specialist Consultation",
    "description": "Consultation with a medical specialist",
    "category": "CONSULTATION",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 100,
    "requiresPreAuth": false,
    "requiresReferral": true,
    "priceRange": {
      "min": 800,
      "max": 2000
    },
    "annualLimit": 20000,
    "waitingPeriodDays": 0,
    "requiredDocuments": ["REFERRAL"],
    "createdBy": "USR001",
    "updatedBy": "USR001",
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012362"),
    "code": "PHARM-GEN",
    "name": "Generic Medicines",
    "description": "Generic pharmaceutical products",
    "category": "PHARMACY",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 0,
    "requiresPreAuth": false,
    "requiresReferral": false,
    "annualLimit": 15000,
    "waitingPeriodDays": 0,
    "requiredDocuments": ["PRESCRIPTION"],
    "createdBy": "USR001",
    "updatedBy": "USR001",
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012363"),
    "code": "DIAG-BLOOD",
    "name": "Blood Tests",
    "description": "Basic blood work and pathology tests",
    "category": "DIAGNOSTICS",
    "isActive": true,
    "coveragePercentage": 100,
    "copayAmount": 50,
    "requiresPreAuth": false,
    "requiresReferral": false,
    "priceRange": {
      "min": 200,
      "max": 1500
    },
    "annualLimit": 8000,
    "waitingPeriodDays": 0,
    "requiredDocuments": ["PRESCRIPTION"],
    "createdBy": "USR001",
    "updatedBy": "USR001",
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  }
]
```

---

### 7. relationship_masters

**Collection Name:** `relationship_masters`
**Purpose:** Master data for family relationship types
**Document Count:** 5
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  relationshipCode: string,         // REQUIRED, UNIQUE, UPPERCASE - Relationship code
  relationshipName: string,         // REQUIRED - Internal relationship name
  displayName: string,              // REQUIRED - Display name for UI
  description?: string,             // OPTIONAL - Relationship description
  isActive: boolean,                // DEFAULT: true - Is relationship active
  sortOrder: number,                // DEFAULT: 1 - Display sort order
  createdBy?: string,               // OPTIONAL - userId of creator
  updatedBy?: string,               // OPTIONAL - userId of last updater
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ relationshipCode: 1 }                       // Single field index
{ isActive: 1, sortOrder: 1 }                 // Compound index for listing
```

#### Validation Rules

1. **relationshipCode** - Must be unique, uppercase
2. **sortOrder** - Used for ordering in dropdowns/UI

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("674d8e123abc456789012370"),
    "relationshipCode": "SELF",
    "relationshipName": "Self",
    "displayName": "Self",
    "description": "Primary policy holder",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012371"),
    "relationshipCode": "SPOUSE",
    "relationshipName": "Spouse",
    "displayName": "Spouse",
    "description": "Husband or Wife",
    "isActive": true,
    "sortOrder": 2,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012372"),
    "relationshipCode": "CHILD",
    "relationshipName": "Child",
    "displayName": "Child",
    "description": "Son or Daughter",
    "isActive": true,
    "sortOrder": 3,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012373"),
    "relationshipCode": "FATHER",
    "relationshipName": "Father",
    "displayName": "Father",
    "description": "Father",
    "isActive": true,
    "sortOrder": 4,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012374"),
    "relationshipCode": "MOTHER",
    "relationshipName": "Mother",
    "displayName": "Mother",
    "description": "Mother",
    "isActive": true,
    "sortOrder": 5,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  }
]
```

---

### 8. cug_master

**Collection Name:** `cug_master`
**Purpose:** Corporate User Group master data for enterprise/organization management
**Document Count:** 8
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  cugId: string,                    // REQUIRED, UNIQUE, UPPERCASE, indexed - CUG identifier
  code: string,                     // REQUIRED, UNIQUE, UPPERCASE - CUG code
  name: string,                     // REQUIRED - CUG display name
  isActive: boolean,                // DEFAULT: true - Is CUG active
  displayOrder: number,             // REQUIRED - Sort order for display
  description?: string,             // OPTIONAL - CUG description
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ cugId: 1 }, { unique: true }                // Unique index
{ code: 1 }, { unique: true }                 // Unique index
{ isActive: 1, displayOrder: 1 }              // Compound index for listing
```

#### Validation Rules

1. **cugId** - Must be unique, uppercase
2. **code** - Must be unique, uppercase
3. **displayOrder** - Required, used for sorting in UI

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("674d8e123abc456789012380"),
    "cugId": "CUG-TECH-001",
    "code": "TECHCORP",
    "name": "Tech Corp India",
    "isActive": true,
    "displayOrder": 1,
    "description": "Technology Corporation",
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012381"),
    "cugId": "CUG-FIN-001",
    "code": "FINBANK",
    "name": "Financial Bank Ltd",
    "isActive": true,
    "displayOrder": 2,
    "description": "Financial Services Bank",
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  }
]
```

---

### 9. counters

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

### 10. user_wallets

**Collection Name:** `user_wallets`
**Purpose:** Store user wallet balances with category-wise breakdown
**Document Count:** 0 (Empty)
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                                // MongoDB auto-generated
  userId: ObjectId,                             // REQUIRED, REF: 'User', indexed
  policyAssignmentId: ObjectId,                 // REQUIRED, REF: 'UserPolicyAssignment', indexed
  totalBalance: {                               // REQUIRED
    allocated: number,                          // DEFAULT: 0 - Total allocated amount
    current: number,                            // DEFAULT: 0 - Current available balance
    consumed: number,                           // DEFAULT: 0 - Total consumed/spent
    lastUpdated: Date                           // DEFAULT: now() - Last update timestamp
  },
  categoryBalances: Array<{                     // DEFAULT: [] - Array of category balances
    categoryCode: string,
    categoryName: string,
    allocated: number,
    current: number,
    consumed: number,
    isUnlimited: boolean,
    lastTransaction: Date
  }>,
  policyYear: string,                           // REQUIRED - Policy year identifier
  effectiveFrom: Date,                          // REQUIRED - Wallet validity start
  effectiveTo: Date,                            // REQUIRED - Wallet validity end
  isActive: boolean,                            // DEFAULT: true - Is wallet active
  createdAt: Date,                              // AUTO - Timestamp
  updatedAt: Date                               // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ userId: 1, policyAssignmentId: 1 }, { unique: true }
{ userId: 1, isActive: 1 }
{ effectiveFrom: 1, effectiveTo: 1 }
```

---

### 11. wallet_transactions

**Collection Name:** `wallet_transactions`
**Purpose:** Complete audit trail of all wallet transactions with before/after balances
**Document Count:** 0 (Empty)
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  userWalletId: ObjectId,
  transactionId: string,
  type: string,  // ENUM: 'DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT', 'INITIALIZATION'
  amount: number,
  categoryCode?: string,
  previousBalance: { total: number; category?: number },
  newBalance: { total: number; category?: number },
  serviceType?: string,
  serviceProvider?: string,
  bookingId?: ObjectId,
  notes?: string,
  processedBy?: ObjectId,
  processedAt: Date,
  isReversed: boolean,
  reversalTransactionId?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```typescript
{ userId: 1, createdAt: -1 }
{ userWalletId: 1, createdAt: -1 }
{ transactionId: 1 }, { unique: true }
{ type: 1, createdAt: -1 }
{ bookingId: 1 }
```

---

### 12. auditLogs

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
{ createdAt: 1 }, { expires: 63072000 }  // TTL index
```

---

### 13. specialty_master

**Collection Name:** `specialty_master`
**Purpose:** Master data for medical specialties used in doctor classification
**Document Count:** 9
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  specialtyId: string,      // REQUIRED, UNIQUE
  code: string,             // REQUIRED, UNIQUE
  name: string,             // REQUIRED
  description?: string,
  icon?: string,
  isActive: boolean,        // DEFAULT: true
  displayOrder?: number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```typescript
{ isActive: 1, displayOrder: 1 }
{ code: 1 }
```

---

### 14. doctors

**Collection Name:** `doctors`
**Purpose:** Doctor profiles with clinic locations, specializations, and availability
**Document Count:** 6
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  doctorId: string,         // REQUIRED, UNIQUE - Doctor identifier
  name: string,             // REQUIRED - Doctor's full name
  profilePhoto?: string,    // OPTIONAL - Profile photo URL
  qualifications: string,   // REQUIRED - Educational qualifications (e.g., "MBBS, MD")
  specializations: string[], // REQUIRED - Array of specialization areas
  specialtyId: string,      // REQUIRED - References specialty_master.specialtyId
  phone?: string,           // OPTIONAL - Contact phone number
  email?: string,           // OPTIONAL - Contact email address
  registrationNumber?: string, // OPTIONAL - Medical registration number
  languages?: string[],     // OPTIONAL - Languages spoken by doctor
  specialty: string,        // REQUIRED - Specialty name (from specialty_master)
  experienceYears: number,  // REQUIRED - Years of experience
  rating: number,           // DEFAULT: 0 - Doctor rating (0-5)
  reviewCount: number,      // DEFAULT: 0 - Number of reviews
  clinics: Array<{          // REQUIRED - Array of clinic locations
    clinicId: string,       // REQUIRED - Clinic identifier
    name: string,           // REQUIRED - Clinic name
    address: string,        // REQUIRED - Clinic address
    city?: string,          // OPTIONAL - City name
    state?: string,         // OPTIONAL - State name
    pincode?: string,       // OPTIONAL - Postal code
    location?: {            // OPTIONAL - Geo-coordinates
      latitude: number,
      longitude: number
    },
    distanceKm?: number,    // OPTIONAL - Distance from user location
    consultationFee: number // REQUIRED - Consultation fee at this clinic
  }>,
  consultationFee: number,  // REQUIRED - Base consultation fee
  cashlessAvailable: boolean, // DEFAULT: true - Cashless payment available
  insuranceAccepted?: string[], // OPTIONAL - Array of accepted insurance providers
  requiresConfirmation: boolean, // DEFAULT: false - Appointment requires confirmation
  allowDirectBooking: boolean,   // DEFAULT: true - Allow direct booking without confirmation
  availableSlots?: Array<{  // OPTIONAL - Available appointment slots
    date: string,           // Date in YYYY-MM-DD format
    slots: string[]         // Array of time slots (e.g., "09:00 AM")
  }>,
  availableOnline: boolean, // DEFAULT: true - Available for online consultations
  availableOffline: boolean,// DEFAULT: true - Available for in-clinic consultations
  isActive: boolean,        // DEFAULT: true - Is doctor profile active
  createdAt: Date,          // AUTO - Creation timestamp
  updatedAt: Date           // AUTO - Last update timestamp
}
```

#### Indexes

```typescript
{ doctorId: 1 }                            // Single field index
{ specialtyId: 1, isActive: 1 }            // Compound index for specialty queries
{ 'clinics.city': 1 }                      // Index on clinic city for location filtering
```

#### Validation Rules

1. **doctorId** - Must be unique, used for doctor identification
2. **specialtyId** - Must reference a valid specialty from specialty_master
3. **specialty** - Should match the name from specialty_master
4. **consultationFee** - Must be >= 0 (both at doctor and clinic level)
5. **clinics** - At least one clinic location required
6. **rating** - Should be between 0 and 5
7. **availableSlots** - Dates should be in YYYY-MM-DD format, times in 12-hour format

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("68d8ab8e6cd3c49c7e4f87fe"),
    "doctorId": "DOC001",
    "name": "Dr. Vikas Mittal",
    "profilePhoto": "",
    "qualifications": "MBBS, MD",
    "specializations": [
      "Pulmonary Medicine",
      "Tuberculosis & Respiratory Diseases",
      "Pulmonary Medicine, Fellow"
    ],
    "specialtyId": "SPEC001",
    "specialty": "General Physician",
    "experienceYears": 16,
    "rating": 4.7,
    "reviewCount": 156,
    "clinics": [
      {
        "clinicId": "CLINIC001",
        "name": "Manipal Hospital",
        "address": "Sector 6, Dwarka, New Delhi",
        "city": "Delhi (NCR)",
        "state": "Delhi",
        "pincode": "110075",
        "location": {
          "latitude": 28.5921,
          "longitude": 77.046
        },
        "distanceKm": 12.67,
        "consultationFee": 1000
      }
    ],
    "consultationFee": 1000,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": true,
    "allowDirectBooking": false,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
      },
      {
        "date": "2025-09-29",
        "slots": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
      }
    ],
    "availableOnline": true,
    "availableOffline": true,
    "isActive": true,
    "createdAt": ISODate("2025-09-27T00:00:00Z"),
    "updatedAt": ISODate("2025-09-27T00:00:00Z")
  },
  {
    "_id": ObjectId("68d8ab8e6cd3c49c7e4f8800"),
    "doctorId": "DOC003",
    "name": "Dr. Priya Sharma",
    "profilePhoto": "",
    "qualifications": "MBBS, MD (Dermatology)",
    "specializations": ["Dermatology", "Cosmetology", "Hair Transplant"],
    "specialtyId": "SPEC004",
    "specialty": "Dermatologist",
    "experienceYears": 12,
    "rating": 4.8,
    "reviewCount": 234,
    "clinics": [
      {
        "clinicId": "CLINIC003",
        "name": "Fortis Hospital",
        "address": "Vasant Kunj, New Delhi",
        "city": "Delhi (NCR)",
        "state": "Delhi",
        "pincode": "110070",
        "location": {
          "latitude": 28.5167,
          "longitude": 77.1598
        },
        "distanceKm": 8.5,
        "consultationFee": 1200
      }
    ],
    "consultationFee": 1200,
    "cashlessAvailable": true,
    "insuranceAccepted": ["MCLTech"],
    "requiresConfirmation": false,
    "allowDirectBooking": true,
    "availableSlots": [
      {
        "date": "2025-09-28",
        "slots": ["09:30 AM", "10:30 AM", "11:30 AM", "03:00 PM", "04:00 PM"]
      }
    ],
    "availableOnline": true,
    "availableOffline": false,
    "isActive": true,
    "createdAt": ISODate("2025-09-27T00:00:00Z"),
    "updatedAt": ISODate("2025-09-27T00:00:00Z")
  }
]
```

---

### 15. clinics

**Collection Name:** `clinics`
**Purpose:** Store clinic/hospital locations with operating hours and contact information
**Document Count:** 5
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  clinicId: string,                 // REQUIRED, UNIQUE - Clinic identifier (e.g., "CLINIC001")
  name: string,                     // REQUIRED - Clinic/hospital name
  address: string,                  // REQUIRED - Full clinic address
  city: string,                     // REQUIRED - City name
  state?: string,                   // OPTIONAL - State name
  pincode?: string,                 // OPTIONAL - Postal code
  phone?: string,                   // OPTIONAL - Contact phone number
  email?: string,                   // OPTIONAL - Contact email address
  location?: {                      // OPTIONAL - Geo-coordinates
    latitude: number,
    longitude: number
  },
  operatingHours?: {                // OPTIONAL - Operating hours by day
    [day: string]: {                // Day name (e.g., "Monday", "Tuesday")
      open: string,                 // Opening time (e.g., "09:00")
      close: string,                // Closing time (e.g., "18:00")
      isClosed: boolean             // Whether clinic is closed on this day
    }
  },
  facilities?: string[],            // OPTIONAL - Available facilities/services
  isActive: boolean,                // DEFAULT: true - Is clinic active
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ clinicId: 1 }, { unique: true }             // Unique index
{ city: 1, isActive: 1 }                      // Compound index for location queries
```

#### Validation Rules

1. **clinicId** - Must be unique across all clinics
2. **name** - Required, clinic/hospital name
3. **address** - Required, full street address
4. **city** - Required for location-based filtering
5. **operatingHours** - Optional, but if provided must have valid time formats

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012500"),
  "clinicId": "CLINIC001",
  "name": "Manipal Hospital Dwarka",
  "address": "Sector 6, Dwarka, New Delhi",
  "city": "Delhi (NCR)",
  "state": "Delhi",
  "pincode": "110075",
  "phone": "+91-11-45801234",
  "email": "dwarka@manipalhospitals.com",
  "location": {
    "latitude": 28.5921,
    "longitude": 77.046
  },
  "operatingHours": {
    "Monday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Tuesday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Wednesday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Thursday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Friday": { "open": "08:00", "close": "20:00", "isClosed": false },
    "Saturday": { "open": "09:00", "close": "18:00", "isClosed": false },
    "Sunday": { "open": "09:00", "close": "14:00", "isClosed": false }
  },
  "facilities": ["Emergency", "ICU", "Laboratory", "Pharmacy", "Radiology"],
  "isActive": true,
  "createdAt": ISODate("2025-09-28T00:00:00Z"),
  "updatedAt": ISODate("2025-09-28T00:00:00Z")
}
```

---

### 16. doctor_slots

**Collection Name:** `doctor_slots`
**Purpose:** Store weekly recurring time slots for doctor availability at specific clinics
**Document Count:** 17
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  doctorId: string,                 // REQUIRED - References doctors.doctorId
  clinicId: string,                 // REQUIRED - References clinics.clinicId
  dayOfWeek: string,                // REQUIRED - Day name (e.g., "Monday", "Tuesday")
  startTime: string,                // REQUIRED - Start time (e.g., "09:00")
  endTime: string,                  // REQUIRED - End time (e.g., "10:00")
  slotDuration: number,             // DEFAULT: 30 - Duration in minutes
  maxPatients: number,              // DEFAULT: 1 - Maximum patients per slot
  isActive: boolean,                // DEFAULT: true - Is slot active
  consultationFee: number,          // REQUIRED - Consultation fee for this slot
  consultationType: string,         // REQUIRED, ENUM: ['IN_CLINIC', 'ONLINE', 'BOTH']
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Enums

**ConsultationType:**
```typescript
enum ConsultationType {
  IN_CLINIC = 'IN_CLINIC',      // In-person clinic consultation
  ONLINE = 'ONLINE',            // Online/telemedicine consultation
  BOTH = 'BOTH'                 // Both in-clinic and online available
}
```

#### Indexes

```typescript
{ doctorId: 1, clinicId: 1, dayOfWeek: 1 }   // Compound index for slot queries
{ isActive: 1 }                               // Single field index for active slots
```

#### Validation Rules

1. **doctorId** - Must reference a valid doctor from doctors collection
2. **clinicId** - Must reference a valid clinic from clinics collection
3. **dayOfWeek** - Must be a valid day name (Monday-Sunday)
4. **startTime/endTime** - Must be valid time format (HH:MM)
5. **endTime** - Must be after startTime
6. **consultationType** - Must be one of the defined enum values

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012600"),
  "doctorId": "DOC001",
  "clinicId": "CLINIC001",
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "10:00",
  "slotDuration": 30,
  "maxPatients": 1,
  "isActive": true,
  "consultationFee": 1000,
  "consultationType": "IN_CLINIC",
  "createdAt": ISODate("2025-09-28T00:00:00Z"),
  "updatedAt": ISODate("2025-09-28T00:00:00Z")
}
```

---

### 17. appointments

**Collection Name:** `appointments`
**Purpose:** Store appointment bookings with status tracking and payment information
**Document Count:** 0 (collection reset, data deleted)
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  appointmentId: string,        // REQUIRED, UNIQUE
  appointmentNumber: string,    // REQUIRED
  userId: ObjectId,             // REQUIRED, REF: 'User'
  patientName: string,          // REQUIRED
  patientId: string,            // REQUIRED
  doctorId: string,             // REQUIRED
  slotId?: ObjectId,            // OPTIONAL, REF: 'DoctorSlot' - Links to doctor_slots collection
  doctorName: string,           // REQUIRED
  specialty: string,            // REQUIRED
  clinicId?: string,            // OPTIONAL - Required for IN_CLINIC, not required for ONLINE appointments
  clinicName?: string,          // OPTIONAL - Required for IN_CLINIC, not required for ONLINE appointments
  clinicAddress?: string,       // OPTIONAL - Required for IN_CLINIC, not required for ONLINE appointments
  appointmentType: string,      // REQUIRED, ENUM: 'IN_CLINIC', 'ONLINE'
  appointmentDate: string,      // REQUIRED, Format: YYYY-MM-DD
  timeSlot: string,             // REQUIRED
  consultationFee: number,      // REQUIRED
  status: string,               // REQUIRED, ENUM: 'PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', DEFAULT: 'PENDING_CONFIRMATION'
  requestedAt?: Date,
  confirmedAt?: Date,
  paymentStatus: string,        // REQUIRED, ENUM: 'PENDING', 'PAID', 'FREE', DEFAULT: 'PENDING'
  amountPaid: number,           // DEFAULT: 0
  coveredByInsurance: boolean,  // DEFAULT: true
  contactNumber?: string,       // OPTIONAL - Contact for appointment (required for ONLINE appointments)
  callPreference?: string,      // OPTIONAL, ENUM: 'VOICE', 'VIDEO', 'BOTH' - Required for ONLINE appointments
  createdAt: Date,              // AUTO - Timestamp
  updatedAt: Date               // AUTO - Timestamp
}
```

#### Enums

**AppointmentType:**
```typescript
enum AppointmentType {
  IN_CLINIC = 'IN_CLINIC',      // In-person clinic appointment
  ONLINE = 'ONLINE'             // Online/teleconsultation appointment
}
```

**AppointmentStatus:**
```typescript
enum AppointmentStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',  // Awaiting confirmation
  CONFIRMED = 'CONFIRMED',                        // Confirmed appointment
  COMPLETED = 'COMPLETED',                        // Appointment completed
  CANCELLED = 'CANCELLED'                         // Appointment cancelled
}
```

**PaymentStatus:**
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',          // Payment pending
  PAID = 'PAID',                // Payment completed
  FREE = 'FREE'                 // Free/complimentary appointment
}
```

**CallPreference:**
```typescript
enum CallPreference {
  VOICE = 'VOICE',              // Voice call only
  VIDEO = 'VIDEO',              // Video call only
  BOTH = 'BOTH'                 // Both voice and video supported
}
```

#### Indexes

```typescript
{ userId: 1, status: 1 }                      // Compound index for user queries
{ appointmentId: 1 }                          // Single field index
{ appointmentNumber: 1 }                      // Single field index
{ doctorId: 1, appointmentDate: 1 }          // Compound index for doctor schedule
```

#### Validation Rules

1. **appointmentId** - Must be unique across all appointments
2. **appointmentType** - Must be either 'IN_CLINIC' or 'ONLINE'
3. **For IN_CLINIC appointments:**
   - clinicId, clinicName, and clinicAddress are typically provided
4. **For ONLINE appointments:**
   - contactNumber is required
   - callPreference is required (VOICE, VIDEO, or BOTH)
   - clinicId, clinicName, and clinicAddress are optional
5. **appointmentDate** - Must be in YYYY-MM-DD format
6. **status** - Must be one of the defined enum values
7. **paymentStatus** - Must be one of the defined enum values

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("68d9f5e66cd3c49c7e4f8801"),
    "appointmentId": "APT-001",
    "appointmentNumber": "APT20250928001",
    "userId": ObjectId("674d8e123abc456789012345"),
    "patientName": "John Doe",
    "patientId": "USR001",
    "doctorId": "DOC001",
    "doctorName": "Dr. Vikas Mittal",
    "specialty": "General Physician",
    "clinicId": "CLINIC001",
    "clinicName": "Manipal Hospital",
    "clinicAddress": "Sector 6, Dwarka, New Delhi",
    "appointmentType": "IN_CLINIC",
    "appointmentDate": "2025-09-30",
    "timeSlot": "10:00 AM",
    "consultationFee": 1000,
    "status": "CONFIRMED",
    "requestedAt": ISODate("2025-09-28T10:00:00Z"),
    "confirmedAt": ISODate("2025-09-28T10:30:00Z"),
    "paymentStatus": "PAID",
    "amountPaid": 1000,
    "coveredByInsurance": true,
    "createdAt": ISODate("2025-09-28T10:00:00Z"),
    "updatedAt": ISODate("2025-09-28T10:30:00Z")
  },
  {
    "_id": ObjectId("68d9f5e66cd3c49c7e4f8802"),
    "appointmentId": "APT-002",
    "appointmentNumber": "APT20250928002",
    "userId": ObjectId("674d8e123abc456789012345"),
    "patientName": "Jane Smith",
    "patientId": "USR002",
    "doctorId": "DOC003",
    "doctorName": "Dr. Priya Sharma",
    "specialty": "Dermatologist",
    "appointmentType": "ONLINE",
    "appointmentDate": "2025-09-29",
    "timeSlot": "03:00 PM",
    "consultationFee": 800,
    "status": "PENDING_CONFIRMATION",
    "requestedAt": ISODate("2025-09-28T11:00:00Z"),
    "paymentStatus": "PENDING",
    "amountPaid": 0,
    "coveredByInsurance": true,
    "contactNumber": "+919876543210",
    "callPreference": "VIDEO",
    "createdAt": ISODate("2025-09-28T11:00:00Z"),
    "updatedAt": ISODate("2025-09-28T11:00:00Z")
  },
  {
    "_id": ObjectId("68d9f5e66cd3c49c7e4f8803"),
    "appointmentId": "APT-003",
    "appointmentNumber": "APT20250928003",
    "userId": ObjectId("674d8e123abc456789012346"),
    "patientName": "Robert Johnson",
    "patientId": "USR003",
    "doctorId": "DOC002",
    "doctorName": "Dr. Amit Kumar",
    "specialty": "Cardiologist",
    "appointmentType": "ONLINE",
    "appointmentDate": "2025-10-01",
    "timeSlot": "11:00 AM",
    "consultationFee": 1500,
    "status": "CONFIRMED",
    "requestedAt": ISODate("2025-09-28T09:00:00Z"),
    "confirmedAt": ISODate("2025-09-28T09:15:00Z"),
    "paymentStatus": "PAID",
    "amountPaid": 1500,
    "coveredByInsurance": true,
    "contactNumber": "+919123456789",
    "callPreference": "BOTH",
    "createdAt": ISODate("2025-09-28T09:00:00Z"),
    "updatedAt": ISODate("2025-09-28T09:15:00Z")
  }
]
```

---

## RELATIONSHIPS & FOREIGN KEYS

### Key Relationships

```
users._id ← userPolicyAssignments.userId
policies._id ← plan_configs.policyId
policies._id ← userPolicyAssignments.policyId
userPolicyAssignments._id ← user_wallets.policyAssignmentId
user_wallets._id ← wallet_transactions.userWalletId
users._id ← appointments.userId
specialty_master.specialtyId ← doctors.specialtyId
category_master.code ← service_master.category
```

---

## DATA INTEGRITY RULES

1. **User Relationships:** primaryMemberId must reference a valid user with relationship='SELF'
2. **Policy Lifecycle:** DRAFT → ACTIVE → (INACTIVE or EXPIRED)
3. **Plan Versions:** Only one isCurrent=true per policyId
4. **Wallet Balance:** allocated = current + consumed (always maintained)
5. **Transaction Atomicity:** Balance updates and transaction records must be atomic
6. **Audit Immutability:** Audit logs should never be updated or deleted manually
7. **TTL Enforcement:** auditLogs automatically deleted after 2 years

---

## INDEXES & PERFORMANCE

All collections have appropriate indexes for query performance. Key considerations:
- Unique indexes enforce data integrity
- Compound indexes support complex queries
- Sparse indexes for optional fields (e.g., employeeId)
- TTL index for automatic audit log cleanup

---

## SAMPLE QUERIES

### Find active users
```javascript
db.users.find({ status: "ACTIVE" })
```

### Find current plan config for a policy
```javascript
db.plan_configs.findOne({ policyId: ObjectId("..."), isCurrent: true })
```

### Get user's wallet transactions
```javascript
db.wallet_transactions.find({ userId: ObjectId("...") }).sort({ createdAt: -1 })
```

### Find doctors by specialty
```javascript
db.doctors.find({ specialtyId: "SPEC-GP", isActive: true })
```

---

## CREDENTIALS & CONNECTION

### MongoDB Connection

**Connection String:**
```
mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin
```

**Database:** `opd_wallet`
**Username:** `admin`
**Password:** `admin123` (CHANGE IN PRODUCTION)

### Environment Variables

```bash
MONGODB_URI=mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin123
MONGO_INITDB_DATABASE=opd_wallet
NODE_ENV=development
PORT=4000
JWT_SECRET=change_me_in_production_use_strong_secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

---

## MIGRATION NOTES

### Schema Evolution Strategy

1. **Adding Fields:** Add optional fields, use defaults, run migration if needed
2. **Modifying Fields:** Create migration script, test thoroughly
3. **Renaming Fields:** Add new field, migrate data, deprecate old field
4. **Adding Indexes:** Build in background to avoid blocking

### Pending Migrations

None currently identified

---

**Document Version:** 2.2
**Last Updated:** September 28, 2025 (Evening Update)
**For Questions:** Contact development team

---

## RECENT CHANGES (Version 2.2)

### 2025-09-28 Evening Updates

1. **Database Expansion** - Collections increased from 15 to 17
   - Total documents increased from 44 to 66
   - Added clinics collection with 5 clinic locations
   - Added doctor_slots collection with 17 weekly recurring slots

2. **Clinics Module** - NEW
   - Complete clinic/hospital management system
   - Operating hours configuration by day of week
   - Location coordinates for distance calculations
   - Contact information and facilities tracking
   - 5 clinics configured with full details

3. **Doctor Slots Module** - NEW
   - Weekly recurring slot scheduling system
   - Links doctors to specific clinics with time slots
   - Supports IN_CLINIC, ONLINE, and BOTH consultation types
   - Configurable slot duration and patient capacity
   - 17 slots configured across different doctors and clinics

4. **Doctors Collection** - Enhanced
   - Document count increased from 4 to 6 doctors
   - Added phone, email, registrationNumber fields
   - Added languages array for multilingual support
   - Enhanced schema documentation with new fields

5. **Users Collection** - Updated
   - Document count increased from 3 to 4
   - Added new OPS (Operations) user role
   - Enhanced user management capabilities

6. **Appointments Collection** - Schema Enhancement
   - Added slotId field linking to doctor_slots collection
   - Enables slot-based booking and availability management
   - Collection reset (0 documents) for fresh start with new architecture

7. **Slot-Based Scheduling Architecture**
   - Appointments now integrate with doctor_slots for availability
   - Weekly recurring slots enable consistent scheduling
   - Clinic-specific slots support multi-location doctors
   - Consultation type flexibility (in-clinic vs online)

## RECENT CHANGES (Version 2.1)

### 2025-09-28 Updates

1. **Appointments Collection** - Updated from 0 to 3 documents
   - Added support for both IN_CLINIC and ONLINE appointment types
   - ONLINE appointments require contactNumber and callPreference fields
   - Clinic details (clinicId, clinicName, clinicAddress) are optional for ONLINE appointments
   - Added comprehensive enum definitions for AppointmentType, AppointmentStatus, PaymentStatus, and CallPreference
   - Added sample data showing both IN_CLINIC and ONLINE appointment examples

2. **Doctors Collection** - Enhanced schema documentation
   - Added availableOnline and availableOffline boolean fields (both default: true)
   - These fields control whether a doctor is available for online consultations and/or in-clinic appointments
   - Updated sample data to reflect these new fields

3. **Total Document Count** - Updated from ~45 to exact count of 44 documents

4. **Documentation Improvements**
   - Added detailed validation rules for appointments
   - Enhanced field descriptions with appointment-type-specific requirements
   - Added realistic sample data with proper ObjectId references and timestamps