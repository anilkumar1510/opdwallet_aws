# OPD WALLET - DATA SCHEMA AND CREDENTIALS DOCUMENTATION

**Document Version:** 2.0
**Last Updated:** 2025-09-27
**Database:** MongoDB (opd_wallet)
**Total Collections:** 15

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
**Total Collections:** 15
**Total Documents:** ~45 (excluding empty collections)

### Current Data Distribution

| Collection | Document Count | Status |
|-----------|----------------|--------|
| users | 3 | Active |
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
| doctors | 4 | Active |
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
**Document Count:** 3
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
**Document Count:** 4
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  doctorId: string,         // REQUIRED, UNIQUE
  name: string,             // REQUIRED
  profilePhoto?: string,
  qualifications: string,   // REQUIRED
  specializations: string[],
  specialtyId: string,      // REQUIRED
  experienceYears: number,  // REQUIRED
  clinics: Array<{
    clinicId: string,
    name: string,
    address: string,
    city?: string,
    state?: string,
    pincode?: string,
    location?: { latitude: number; longitude: number },
    distanceKm?: number,
    consultationFee: number
  }>,
  consultationFee: number,
  cashlessAvailable: boolean,
  insuranceAccepted?: string[],
  requiresConfirmation: boolean,
  allowDirectBooking: boolean,
  availableSlots?: Array<{ date: string; slots: string[] }>,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```typescript
{ specialtyId: 1, isActive: 1 }
{ doctorId: 1 }
{ 'clinics.city': 1 }
```

---

### 15. appointments

**Collection Name:** `appointments`
**Purpose:** Store appointment bookings with status tracking and payment information
**Document Count:** 0 (Empty)
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  appointmentId: string,        // REQUIRED, UNIQUE
  appointmentNumber: string,    // REQUIRED
  userId: ObjectId,             // REQUIRED, REF: 'User'
  patientName: string,
  patientId: string,
  doctorId: string,
  doctorName: string,
  specialty: string,
  clinicId: string,
  clinicName: string,
  clinicAddress: string,
  appointmentType: string,      // ENUM: 'IN_CLINIC', 'ONLINE'
  appointmentDate: string,      // YYYY-MM-DD
  timeSlot: string,
  consultationFee: number,
  status: string,               // ENUM: 'PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
  requestedAt?: Date,
  confirmedAt?: Date,
  paymentStatus: string,        // ENUM: 'PENDING', 'PAID', 'FREE'
  amountPaid: number,
  coveredByInsurance: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```typescript
{ userId: 1, status: 1 }
{ appointmentId: 1 }
{ appointmentNumber: 1 }
{ doctorId: 1, appointmentDate: 1 }
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

**Document Version:** 2.0
**Last Updated:** 2025-09-27
**For Questions:** Contact development team