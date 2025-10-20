# OPD WALLET - WALLET & CLAIMS SCHEMAS

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**Database:** MongoDB (opd_wallet)

> **Quick Navigation:**
> - [Database Overview](./DATABASE_OVERVIEW.md) - Complete database structure and relationships
> - [Core Schemas](./CORE_SCHEMAS.md) - Core system collections
> - [Master Data Schemas](./MASTER_DATA_SCHEMAS.md) - Master data collections
> - [Healthcare Schemas](./HEALTHCARE_SCHEMAS.md) - Healthcare-related collections
> - [Lab Diagnostics Schemas](./LAB_DIAGNOSTICS_SCHEMAS.md) - Lab services and orders
> - [Notifications Schemas](./NOTIFICATIONS_SCHEMAS.md) - Notification system

---

## TABLE OF CONTENTS

1. [user_wallets](#1-user_wallets)
2. [wallet_transactions](#2-wallet_transactions)
3. [memberclaims](#3-memberclaims)
4. [payments](#4-payments)
5. [transaction_summaries](#5-transaction_summaries)

---

## COMPLETE SCHEMA DEFINITIONS

### 1. user_wallets

**Collection Name:** `user_wallets`
**Purpose:** Store user wallet balances with category-wise breakdown
**Document Count:** Auto (Populated automatically on policy assignment)
**Timestamps:** Yes (createdAt, updatedAt)
**Creation:** Automatic via `WalletService.initializeWalletFromPolicy()` when policy assigned
**Deletion:** Automatic via `WalletService.deleteWalletByAssignment()` when assignment removed

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

#### Validation Rules

1. **userId** - Must reference a valid User document
2. **policyAssignmentId** - Must reference a valid UserPolicyAssignment document
3. **totalBalance.allocated** - Should equal sum of all category allocations
4. **totalBalance.current + totalBalance.consumed** - Should equal totalBalance.allocated
5. **effectiveFrom** - Required, must be valid date
6. **effectiveTo** - Required, must be after effectiveFrom

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012600"),
  "userId": ObjectId("674d8e123abc456789012345"),
  "policyAssignmentId": ObjectId("674d8e123abc456789012348"),
  "totalBalance": {
    "allocated": 100000,
    "current": 75000,
    "consumed": 25000,
    "lastUpdated": ISODate("2025-10-15T10:00:00Z")
  },
  "categoryBalances": [
    {
      "categoryCode": "CAT-CONS",
      "categoryName": "Consultation",
      "allocated": 50000,
      "current": 38000,
      "consumed": 12000,
      "isUnlimited": false,
      "lastTransaction": ISODate("2025-10-15T10:00:00Z")
    },
    {
      "categoryCode": "CAT-PHARM",
      "categoryName": "Pharmacy",
      "allocated": 30000,
      "current": 22000,
      "consumed": 8000,
      "isUnlimited": false,
      "lastTransaction": ISODate("2025-10-10T14:30:00Z")
    },
    {
      "categoryCode": "CAT-DIAG",
      "categoryName": "Diagnostics",
      "allocated": 20000,
      "current": 15000,
      "consumed": 5000,
      "isUnlimited": false,
      "lastTransaction": ISODate("2025-10-05T11:20:00Z")
    }
  ],
  "policyYear": "2025",
  "effectiveFrom": ISODate("2025-01-01T00:00:00Z"),
  "effectiveTo": ISODate("2025-12-31T23:59:59Z"),
  "isActive": true,
  "createdAt": ISODate("2025-01-01T00:00:00Z"),
  "updatedAt": ISODate("2025-10-15T10:00:00Z")
}
```

---

### 2. wallet_transactions

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

#### Enums

**TransactionType:**
```typescript
enum TransactionType {
  DEBIT = 'DEBIT',                 // Deduct from wallet
  CREDIT = 'CREDIT',               // Add to wallet
  REFUND = 'REFUND',               // Refund transaction
  ADJUSTMENT = 'ADJUSTMENT',       // Manual adjustment
  INITIALIZATION = 'INITIALIZATION' // Initial wallet creation
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

#### Validation Rules

1. **transactionId** - Must be unique
2. **userId** - Must reference a valid User document
3. **userWalletId** - Must reference a valid UserWallet document
4. **amount** - Must be > 0
5. **type** - Must be one of the defined enum values
6. **previousBalance + newBalance** - Must maintain ledger integrity

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012620"),
  "userId": ObjectId("674d8e123abc456789012345"),
  "userWalletId": ObjectId("674d8e123abc456789012600"),
  "transactionId": "WTX-20251015-001",
  "type": "DEBIT",
  "amount": 1000,
  "categoryCode": "CAT-CONS",
  "previousBalance": {
    "total": 76000,
    "category": 39000
  },
  "newBalance": {
    "total": 75000,
    "category": 38000
  },
  "serviceType": "APPOINTMENT",
  "serviceProvider": "Dr. Vikas Mittal - Manipal Hospital",
  "bookingId": ObjectId("68d9f5e66cd3c49c7e4f8801"),
  "notes": "Consultation fee payment",
  "processedBy": ObjectId("674d8e123abc456789012345"),
  "processedAt": ISODate("2025-10-15T10:00:00Z"),
  "isReversed": false,
  "createdAt": ISODate("2025-10-15T10:00:00Z"),
  "updatedAt": ISODate("2025-10-15T10:00:00Z")
}
```

---

