# OPD WALLET - MASTER DATA SCHEMAS

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**Database:** MongoDB (opd_wallet)

> **Quick Navigation:**
> - [Database Overview](./DATABASE_OVERVIEW.md) - Complete database structure and relationships
> - [Core Schemas](./CORE_SCHEMAS.md) - Core system collections
> - [Healthcare Schemas](./HEALTHCARE_SCHEMAS.md) - Healthcare-related collections
> - [Wallet & Claims Schemas](./WALLET_CLAIMS_SCHEMAS.md) - Wallet and claims management
> - [Lab Diagnostics Schemas](./LAB_DIAGNOSTICS_SCHEMAS.md) - Lab services and orders
> - [Notifications Schemas](./NOTIFICATIONS_SCHEMAS.md) - Notification system

---

## TABLE OF CONTENTS

1. [category_master](#1-category_master)
2. [service_master](#2-service_master)
3. [relationship_masters](#3-relationship_masters)
4. [cug_master](#4-cug_master)
5. [specialty_master](#5-specialty_master)

---

## COMPLETE SCHEMA DEFINITIONS

### 1. category_master

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

### 2. service_master

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

### 3. relationship_masters

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

### 4. cug_master

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

### 5. specialty_master

**Collection Name:** `specialty_master`
**Purpose:** Master data for medical specialties used in doctor classification
**Document Count:** 9
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated
  specialtyId: string,              // REQUIRED, UNIQUE - Specialty identifier
  code: string,                     // REQUIRED, UNIQUE - Specialty code
  name: string,                     // REQUIRED - Specialty name
  description?: string,             // OPTIONAL - Specialty description
  icon?: string,                    // OPTIONAL - Icon identifier for UI
  isActive: boolean,                // DEFAULT: true - Is specialty active
  displayOrder?: number,            // OPTIONAL - Sort order for display
  createdAt: Date,                  // AUTO - Timestamp
  updatedAt: Date                   // AUTO - Timestamp
}
```

#### Indexes

```typescript
{ isActive: 1, displayOrder: 1 }              // Compound index for listing
{ code: 1 }                                   // Single field index
{ specialtyId: 1 }, { unique: true }          // Unique index
```

#### Validation Rules

1. **specialtyId** - Must be unique
2. **code** - Must be unique
3. **name** - Required, used for display

#### Sample Data Examples

```json
[
  {
    "_id": ObjectId("674d8e123abc456789012390"),
    "specialtyId": "SPEC-GP",
    "code": "GENERAL_PHYSICIAN",
    "name": "General Physician",
    "description": "Primary care physician for general health concerns",
    "icon": "stethoscope",
    "isActive": true,
    "displayOrder": 1,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012391"),
    "specialtyId": "SPEC-CARDIO",
    "code": "CARDIOLOGY",
    "name": "Cardiologist",
    "description": "Heart and cardiovascular system specialist",
    "icon": "heart",
    "isActive": true,
    "displayOrder": 2,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012392"),
    "specialtyId": "SPEC-DERMA",
    "code": "DERMATOLOGY",
    "name": "Dermatologist",
    "description": "Skin, hair, and nail specialist",
    "icon": "skin",
    "isActive": true,
    "displayOrder": 3,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012393"),
    "specialtyId": "SPEC-ORTHO",
    "code": "ORTHOPEDICS",
    "name": "Orthopedist",
    "description": "Bone, joint, and muscle specialist",
    "icon": "bone",
    "isActive": true,
    "displayOrder": 4,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  },
  {
    "_id": ObjectId("674d8e123abc456789012394"),
    "specialtyId": "SPEC-PEDIA",
    "code": "PEDIATRICS",
    "name": "Pediatrician",
    "description": "Children's health specialist",
    "icon": "baby",
    "isActive": true,
    "displayOrder": 5,
    "createdAt": ISODate("2025-01-01T00:00:00Z"),
    "updatedAt": ISODate("2025-01-01T00:00:00Z")
  }
]
```

---

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**For Questions:** Contact development team
