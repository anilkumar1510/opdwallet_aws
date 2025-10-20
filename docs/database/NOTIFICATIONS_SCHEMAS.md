# OPD WALLET - NOTIFICATIONS SCHEMAS

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**Database:** MongoDB (opd_wallet)

> **Quick Navigation:**
> - [Database Overview](./DATABASE_OVERVIEW.md) - Complete database structure and relationships
> - [Core Schemas](./CORE_SCHEMAS.md) - Core system collections
> - [Master Data Schemas](./MASTER_DATA_SCHEMAS.md) - Master data collections
> - [Healthcare Schemas](./HEALTHCARE_SCHEMAS.md) - Healthcare-related collections
> - [Wallet & Claims Schemas](./WALLET_CLAIMS_SCHEMAS.md) - Wallet and claims management
> - [Lab Diagnostics Schemas](./LAB_DIAGNOSTICS_SCHEMAS.md) - Lab services and orders

---

## TABLE OF CONTENTS

1. [notifications](#1-notifications)

---

## COMPLETE SCHEMA DEFINITIONS

### 1. notifications

**Collection Name:** `notifications`
**Purpose:** System notifications for claims, assignments, and status updates
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                   // REQUIRED, REF: 'User'
  type: string,                       // REQUIRED, ENUM: Notification types
  title: string,                      // REQUIRED
  message: string,                    // REQUIRED
  claimId: ObjectId,                  // OPTIONAL, REF: 'MemberClaim'
  claimNumber: string,
  priority: string,                   // ENUM: LOW, MEDIUM, HIGH, URGENT, DEFAULT: MEDIUM
  isRead: boolean,                    // DEFAULT: false
  readAt: Date,
  metadata: {
    oldStatus: string,
    newStatus: string,
    actionBy: string,
    amount: number,
    documentsRequested: string[],
    [key: string]: any                // Additional dynamic fields
  },
  actionUrl: string,
  isActive: boolean,                  // DEFAULT: true
  createdAt: Date,
  updatedAt: Date
}
```

#### Enums

**NotificationType:**
```typescript
enum NotificationType {
  CLAIM_ASSIGNED = 'CLAIM_ASSIGNED',
  CLAIM_STATUS_CHANGED = 'CLAIM_STATUS_CHANGED',
  DOCUMENTS_REQUESTED = 'DOCUMENTS_REQUESTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  CLAIM_UNDER_REVIEW = 'CLAIM_UNDER_REVIEW'
}
```

**NotificationPriority:**
```typescript
enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
```

#### Indexes

```typescript
{ userId: 1, createdAt: -1 }                  // Compound index for user notifications
{ userId: 1, isRead: 1 }                      // Compound index for unread queries
{ userId: 1, type: 1 }                        // Compound index for type filtering
```

#### Validation Rules

1. **userId** - Must reference a valid User document
2. **type** - Must be one of the defined enum values
3. **priority** - Must be one of the defined enum values
4. **claimId** - If present, must reference a valid MemberClaim document

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012710"),
  "userId": ObjectId("674d8e123abc456789012380"),
  "type": "CLAIM_ASSIGNED",
  "title": "New Claim Assigned",
  "message": "Claim CLM-20251005-0001 has been assigned to you for review",
  "claimId": ObjectId("674d8e123abc456789012700"),
  "claimNumber": "CLM-20251005-0001",
  "priority": "MEDIUM",
  "isRead": false,
  "metadata": {
    "actionBy": "TPA Admin",
    "amount": 5000
  },
  "actionUrl": "/tpa/claims/CLM-20251005-0001",
  "isActive": true,
  "createdAt": ISODate("2025-10-05T11:00:00Z"),
  "updatedAt": ISODate("2025-10-05T11:00:00Z")
}
```


**Document Version:** 3.3
**Last Updated:** October 15, 2025
**For Questions:** Contact development team
