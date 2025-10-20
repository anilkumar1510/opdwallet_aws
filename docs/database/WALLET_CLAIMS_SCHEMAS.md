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

### 3. memberclaims

**Collection Name:** `memberclaims`
**Purpose:** Complete claims/reimbursement management with TPA integration
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

**Status:** NEW - Complete TPA integration with assignment, review, and document workflows

#### Schema Definition

```typescript
{
  _id: ObjectId,
  claimId: string,                    // REQUIRED, UNIQUE - "CLM-YYYYMMDD-####"
  userId: ObjectId,                   // REQUIRED, REF: 'User'
  memberName: string,                 // REQUIRED
  memberId: string,
  patientName: string,
  relationToMember: string,           // DEFAULT: 'SELF'
  claimType: string,                  // ENUM: 'REIMBURSEMENT', 'CASHLESS_PREAUTH'
  category: string,                   // ENUM: CONSULTATION, DIAGNOSTICS, PHARMACY, etc.
  treatmentDate: Date,                // REQUIRED
  providerName: string,               // REQUIRED
  providerLocation: string,
  billAmount: number,                 // REQUIRED
  billNumber: string,
  treatmentDescription: string,

  // Document storage
  documents: Array<{
    fileName: string,
    originalName: string,
    fileType: string,
    fileSize: number,
    filePath: string,
    uploadedAt: Date,
    documentType: string              // ENUM: INVOICE, PRESCRIPTION, REPORT, DISCHARGE_SUMMARY, OTHER
  }>,

  // Claim processing
  status: string,                     // ENUM: Complex workflow status (see enums)
  approvedAmount: number,
  copayAmount: number,
  deductibleAmount: number,
  reimbursableAmount: number,

  // Payment details
  paymentStatus: string,              // ENUM: PENDING, APPROVED, PROCESSING, COMPLETED, PAID, FAILED
  paymentDate: Date,
  paymentReferenceNumber: string,
  paymentMode: string,

  // Processing information
  submittedAt: Date,
  reviewedBy: string,
  reviewedAt: Date,
  reviewComments: string,
  rejectionReason: string,
  internalNotes: string,

  // TPA Assignment Fields
  assignedTo: ObjectId,               // REF: 'User' (TPA_USER)
  assignedToName: string,
  assignedBy: ObjectId,               // REF: 'User' (TPA_ADMIN)
  assignedByName: string,
  assignedAt: Date,
  reassignmentHistory: Array<{
    previousAssignee: ObjectId,
    previousAssigneeName: string,
    newAssignee: ObjectId,
    newAssigneeName: string,
    reassignedBy: ObjectId,
    reassignedByName: string,
    reassignedAt: Date,
    reason: string
  }>,

  // TPA Review Fields
  reviewedByUser: ObjectId,           // REF: 'User'
  reviewedByName: string,
  reviewNotes: string,
  reviewHistory: Array<{
    reviewedBy: ObjectId,
    reviewedByName: string,
    reviewedAt: Date,
    action: string,
    notes: string,
    previousStatus: string,
    newStatus: string
  }>,

  // Documents Required Flow
  documentsRequired: boolean,         // DEFAULT: false
  documentsRequiredReason: string,
  documentsRequiredAt: Date,
  documentsRequiredBy: ObjectId,      // REF: 'User'
  requiredDocumentsList: string[],

  // Approval/Rejection Fields
  approvalReason: string,
  approvedBy: ObjectId,               // REF: 'User'
  approvedByName: string,
  approvedAt: Date,
  rejectedBy: ObjectId,               // REF: 'User'
  rejectedByName: string,
  rejectedAt: Date,
  rejectedAmount: number,

  // Payment Tracking
  paidAmount: number,
  paidBy: ObjectId,                   // REF: 'User'
  paidByName: string,
  paymentNotes: string,
  paymentProcessedAt: Date,

  // Status history
  statusHistory: Array<{
    status: string,
    changedBy: ObjectId,
    changedByName: string,
    changedByRole: string,
    changedAt: Date,
    reason: string,
    notes: string
  }>,

  // Policy and wallet information
  policyId: ObjectId,                 // REF: 'Policy'
  policyNumber: string,
  assignmentId: ObjectId,             // REF: 'UserPolicyAssignment'
  walletTransactionId: ObjectId,      // REF: 'WalletTransaction'

  // Cancellation Fields
  cancellationReason: string,
  cancelledAt: Date,

  // Additional metadata
  corporateName: string,
  isUrgent: boolean,                  // DEFAULT: false
  requiresPreAuth: boolean,           // DEFAULT: false
  preAuthNumber: string,
  isActive: boolean,                  // DEFAULT: true
  createdBy: string,                  // REQUIRED - userId of submitter (for dependent claims)
  updatedBy: string,

  createdAt: Date,
  updatedAt: Date
}
```

#### Enums

**ClaimType:**
```typescript
enum ClaimType {
  REIMBURSEMENT = 'REIMBURSEMENT',
  CASHLESS_PREAUTH = 'CASHLESS_PREAUTH'
}
```

**ClaimCategory:**
```typescript
enum ClaimCategory {
  CONSULTATION = 'CONSULTATION',
  DIAGNOSTICS = 'DIAGNOSTICS',
  PHARMACY = 'PHARMACY',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  WELLNESS = 'WELLNESS',
  IPD = 'IPD',
  OPD = 'OPD'
}
```

**ClaimStatus:**
```typescript
enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  RESUBMISSION_REQUIRED = 'RESUBMISSION_REQUIRED'
}
```

**PaymentStatus:**
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  FAILED = 'FAILED'
}
```

#### Indexes

```typescript
{ claimId: 1 }                                // Single field index
{ userId: 1, status: 1 }                      // Compound index for user queries
{ status: 1, createdAt: -1 }                  // Compound index for status queries
{ policyId: 1 }                               // Single field index
{ treatmentDate: -1 }                         // Single field index
{ submittedAt: -1 }                           // Single field index
// TPA indexes
{ assignedTo: 1, status: 1 }                  // Compound index for TPA user queries
{ assignedBy: 1 }                             // Single field index
{ assignedAt: -1 }                            // Single field index
{ status: 1, assignedTo: 1 }                  // Compound index for workload queries
// Payment indexes
{ paymentStatus: 1, status: 1 }               // Compound index for payment queries
{ paidBy: 1 }                                 // Single field index
{ paymentProcessedAt: -1 }                    // Single field index
```

#### Validation Rules

1. **claimId** - Must be unique, format "CLM-YYYYMMDD-####"
2. **claimType** - Must be one of the defined enum values
3. **category** - Must be one of the defined enum values
4. **status** - Must be one of the defined enum values (workflow enforced)
5. **paymentStatus** - Must be one of the defined enum values
6. **billAmount** - Must be > 0
7. **documents.documentType** - Must be one of: INVOICE, PRESCRIPTION, REPORT, DISCHARGE_SUMMARY, OTHER
8. **TPA Assignment** - assignedTo must reference a TPA_USER role
9. **reassignmentHistory** - Automatically tracked when claim is reassigned
10. **reviewHistory** - Automatically tracked on status changes
11. **createdBy** - Required field tracking the submitter (different from userId for dependent claims)
12. **userId** - The claim owner (may be different from createdBy for dependent claims)
13. **Cancellation** - Can only cancel claims in DRAFT, SUBMITTED, UNASSIGNED, ASSIGNED, UNDER_REVIEW, DOCUMENTS_REQUIRED, or RESUBMISSION_REQUIRED status

#### Sample Data Example

```json
{
  "_id": ObjectId("674d8e123abc456789012700"),
  "claimId": "CLM-20251005-0001",
  "userId": ObjectId("674d8e123abc456789012345"),
  "memberName": "John Doe",
  "memberId": "MEM001",
  "patientName": "John Doe",
  "relationToMember": "SELF",
  "claimType": "REIMBURSEMENT",
  "category": "CONSULTATION",
  "treatmentDate": ISODate("2025-10-01T00:00:00Z"),
  "providerName": "Apollo Hospital",
  "providerLocation": "Delhi",
  "billAmount": 5000,
  "billNumber": "INV-2025-001",
  "treatmentDescription": "General physician consultation",
  "documents": [
    {
      "fileName": "invoice_1728123456.pdf",
      "originalName": "invoice.pdf",
      "fileType": "application/pdf",
      "fileSize": 245678,
      "filePath": "./uploads/claims/USR001/invoice_1728123456.pdf",
      "uploadedAt": ISODate("2025-10-05T10:00:00Z"),
      "documentType": "INVOICE"
    }
  ],
  "status": "ASSIGNED",
  "approvedAmount": 4500,
  "copayAmount": 500,
  "deductibleAmount": 0,
  "reimbursableAmount": 4500,
  "paymentStatus": "PENDING",
  "submittedAt": ISODate("2025-10-05T10:00:00Z"),
  "assignedTo": ObjectId("674d8e123abc456789012380"),
  "assignedToName": "TPA User 1",
  "assignedBy": ObjectId("674d8e123abc456789012381"),
  "assignedByName": "TPA Admin",
  "assignedAt": ISODate("2025-10-05T11:00:00Z"),
  "reassignmentHistory": [],
  "reviewHistory": [],
  "documentsRequired": false,
  "requiredDocumentsList": [],
  "statusHistory": [
    {
      "status": "SUBMITTED",
      "changedBy": ObjectId("674d8e123abc456789012345"),
      "changedByName": "John Doe",
      "changedByRole": "MEMBER",
      "changedAt": ISODate("2025-10-05T10:00:00Z"),
      "notes": "Claim submitted"
    },
    {
      "status": "ASSIGNED",
      "changedBy": ObjectId("674d8e123abc456789012381"),
      "changedByName": "TPA Admin",
      "changedByRole": "TPA_ADMIN",
      "changedAt": ISODate("2025-10-05T11:00:00Z"),
      "notes": "Assigned to TPA User 1"
    }
  ],
  "policyId": ObjectId("674d8e123abc456789012346"),
  "policyNumber": "POL-2025-001",
  "isUrgent": false,
  "requiresPreAuth": false,
  "isActive": true,
  "createdAt": ISODate("2025-10-05T10:00:00Z"),
  "updatedAt": ISODate("2025-10-05T11:00:00Z")
}
```

---

### 4. payments

**Collection Name:** `payments`
**Purpose:** Track all payment transactions for services (appointments, claims, lab orders, pharmacy, wallet top-ups)
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  paymentId: string,                // REQUIRED, UNIQUE - Payment identifier (e.g., "PAY-20250116-0001")
  userId: ObjectId,                 // REQUIRED, REF: 'User', INDEX - References users._id
  amount: number,                   // REQUIRED - Payment amount
  paymentType: string,              // REQUIRED, ENUM: PaymentType - Type of payment
  status: string,                   // ENUM: PaymentStatus, DEFAULT: 'PENDING', INDEX - Payment status

  // Service linkage
  serviceType: string,              // ENUM: ServiceType - What service this payment is for
  serviceId: ObjectId,              // Service-specific ID (appointment._id, claim._id, etc.)
  serviceReferenceId: string,       // Human-readable reference (APT-001, CLM-001, etc.)
  description: string,              // Payment description

  // Payment gateway fields
  paymentMethod: string,            // DEFAULT: 'DUMMY_GATEWAY' - Payment method used
  transactionId: string,            // External transaction ID from payment gateway
  paidAt: Date,                     // Payment completion timestamp
  markedAsPaidBy: ObjectId,         // REF: 'User' - User who marked payment as paid

  // Metadata
  notes: string,                    // Additional notes
  failureReason: string,            // Reason if payment failed
  isActive: boolean,                // DEFAULT: true - Is payment record active

  createdAt: Date,                  // AUTO - Creation timestamp
  updatedAt: Date                   // AUTO - Last update timestamp
}
```

#### Enums

**PaymentType:**
```typescript
enum PaymentType {
  COPAY = 'COPAY',                      // Co-payment (patient pays portion)
  OUT_OF_POCKET = 'OUT_OF_POCKET',      // Full out-of-pocket payment
  FULL_PAYMENT = 'FULL_PAYMENT',        // Complete payment for service
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',  // Partial payment
  TOP_UP = 'TOP_UP'                     // Wallet top-up payment
}
```

**PaymentStatus:**
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',         // Payment initiated but not completed
  COMPLETED = 'COMPLETED',     // Payment successfully completed
  FAILED = 'FAILED',          // Payment failed
  CANCELLED = 'CANCELLED'      // Payment cancelled
}
```

**ServiceType:**
```typescript
enum ServiceType {
  APPOINTMENT = 'APPOINTMENT',       // Doctor appointment payment
  CLAIM = 'CLAIM',                  // Claim/reimbursement payment
  LAB_ORDER = 'LAB_ORDER',          // Lab diagnostic test payment
  PHARMACY = 'PHARMACY',            // Pharmacy/medicine payment
  WALLET_TOPUP = 'WALLET_TOPUP'     // Wallet balance top-up
}
```

#### Indexes

```typescript
{ paymentId: 1 }, { unique: true }              // Unique payment ID
{ userId: 1, createdAt: -1 }                    // User's payment history
{ serviceType: 1, serviceId: 1 }                // Service-based queries
{ status: 1, createdAt: -1 }                    // Status-based queries
```

#### Validation Rules

1. **paymentId** - Must be unique across all payments, format "PAY-YYYYMMDD-####"
2. **userId** - Must reference a valid User document
3. **amount** - Must be > 0
4. **paymentType** - Must be one of the defined enum values
5. **status** - Must be one of the defined enum values
6. **serviceType** - Must be one of the defined enum values if provided
7. **serviceId** - Required if serviceType is provided
8. **paymentMethod** - Defaults to 'DUMMY_GATEWAY' for development

#### Sample Data Example

```json
{
  "_id": ObjectId("679d8e123abc456789012800"),
  "paymentId": "PAY-20250116-0001",
  "userId": ObjectId("68ce7f937ca7c61fde313123"),
  "amount": 200,
  "paymentType": "COPAY",
  "status": "COMPLETED",
  "serviceType": "APPOINTMENT",
  "serviceId": ObjectId("68ce7f937ca7c61fde313def"),
  "serviceReferenceId": "APT-20250116-0001",
  "description": "Co-payment for Dr. Sharma consultation",
  "paymentMethod": "DUMMY_GATEWAY",
  "transactionId": "TXN-DUMMY-20250116-001",
  "paidAt": ISODate("2025-01-16T10:30:00Z"),
  "markedAsPaidBy": ObjectId("68ce7f937ca7c61fde313456"),
  "notes": "Payment processed via dummy gateway",
  "isActive": true,
  "createdAt": ISODate("2025-01-16T10:30:00Z"),
  "updatedAt": ISODate("2025-01-16T10:30:00Z")
}
```

---

### 5. transaction_summaries

**Collection Name:** `transaction_summaries`
**Purpose:** Comprehensive transaction summaries showing payment breakdown (wallet vs self-paid) for services
**Document Count:** Variable
**Timestamps:** Yes (createdAt, updatedAt)

#### Schema Definition

```typescript
{
  _id: ObjectId,
  transactionId: string,            // REQUIRED, UNIQUE - Transaction identifier (e.g., "TXN-20250116-0001")
  userId: ObjectId,                 // REQUIRED, REF: 'User', INDEX - References users._id

  // Service details
  serviceType: string,              // REQUIRED, ENUM: TransactionServiceType, INDEX - Type of service
  serviceId: ObjectId,              // REQUIRED - Reference to service document
  serviceReferenceId: string,       // REQUIRED - Human-readable reference (APT-001, CLM-001)
  serviceName: string,              // REQUIRED - Service description
  serviceDate: Date,                // REQUIRED - When service is/was scheduled

  // Payment breakdown
  totalAmount: number,              // REQUIRED - Total service cost
  walletAmount: number,             // DEFAULT: 0 - Amount paid from wallet
  selfPaidAmount: number,           // DEFAULT: 0 - Amount paid out-of-pocket
  copayAmount: number,              // DEFAULT: 0 - Co-payment amount if applicable

  // Payment method and references
  paymentMethod: string,            // REQUIRED, ENUM: PaymentMethod - How payment was made
  paymentId: ObjectId,              // REF: 'Payment' - Link to payment record if self-paid

  // Category information
  categoryCode: string,             // Category code for wallet debit
  categoryName: string,             // Category name (Consultation, Diagnostics, etc.)

  // Status tracking
  status: string,                   // ENUM: TransactionStatus, DEFAULT: 'PENDING_PAYMENT', INDEX
  completedAt: Date,                // Transaction completion timestamp
  refundedAt: Date,                 // Refund timestamp if applicable
  cancelledAt: Date,                // Cancellation timestamp if applicable

  // Additional metadata
  description: string,              // Transaction description
  notes: string,                    // Additional notes

  // Wallet transaction references
  walletTransactionIds: [ObjectId], // REF: 'WalletTransaction' - Related wallet transactions

  // Refund information
  refundAmount: number,             // Refund amount if applicable
  refundReason: string,             // Reason for refund

  isActive: boolean,                // DEFAULT: true - Is transaction active
  createdAt: Date,                  // AUTO - Creation timestamp
  updatedAt: Date                   // AUTO - Last update timestamp
}
```

#### Enums

**TransactionServiceType:**
```typescript
enum TransactionServiceType {
  APPOINTMENT = 'APPOINTMENT',     // Doctor appointment
  CLAIM = 'CLAIM',                // Insurance claim
  LAB_ORDER = 'LAB_ORDER',        // Lab diagnostic test
  PHARMACY = 'PHARMACY'            // Pharmacy/medicine purchase
}
```

**TransactionStatus:**
```typescript
enum TransactionStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',   // Payment pending
  COMPLETED = 'COMPLETED',               // Transaction completed
  FAILED = 'FAILED',                     // Transaction failed
  REFUNDED = 'REFUNDED',                 // Transaction refunded
  CANCELLED = 'CANCELLED'                // Transaction cancelled
}
```

**PaymentMethod:**
```typescript
enum PaymentMethod {
  WALLET_ONLY = 'WALLET_ONLY',           // Fully paid from wallet
  COPAY = 'COPAY',                       // Co-payment (wallet + self-paid)
  OUT_OF_POCKET = 'OUT_OF_POCKET',       // Fully out-of-pocket
  PARTIAL = 'PARTIAL',                   // Partial payment (wallet + self-paid)
  FULL_PAYMENT = 'FULL_PAYMENT'          // Full payment without wallet
}
```

#### Indexes

```typescript
{ transactionId: 1 }, { unique: true }          // Unique transaction ID
{ userId: 1, createdAt: -1 }                    // User's transaction history
{ serviceType: 1, serviceId: 1 }                // Service-based queries
{ status: 1 }                                   // Status-based queries
{ paymentMethod: 1 }                            // Payment method queries
{ serviceDate: -1 }                             // Date-based queries
```

#### Validation Rules

1. **transactionId** - Must be unique across all transactions, format "TXN-YYYYMMDD-####"
2. **userId** - Must reference a valid User document
3. **serviceType** - Must be one of the defined enum values
4. **serviceId** - Must reference a valid service document
5. **totalAmount** - Must be > 0
6. **walletAmount + selfPaidAmount** - Should equal totalAmount (with copayAmount tracked separately)
7. **paymentMethod** - Must be one of the defined enum values
8. **status** - Must be one of the defined enum values

#### Sample Data Example

```json
{
  "_id": ObjectId("679d8e123abc456789012900"),
  "transactionId": "TXN-20250116-0001",
  "userId": ObjectId("68ce7f937ca7c61fde313123"),
  "serviceType": "APPOINTMENT",
  "serviceId": ObjectId("68ce7f937ca7c61fde313def"),
  "serviceReferenceId": "APT-20250116-0001",
  "serviceName": "Dr. Sharma Consultation - General Medicine",
  "serviceDate": ISODate("2025-01-20T10:00:00Z"),
  "totalAmount": 1000,
  "walletAmount": 800,
  "selfPaidAmount": 200,
  "copayAmount": 200,
  "paymentMethod": "COPAY",
  "paymentId": ObjectId("679d8e123abc456789012800"),
  "categoryCode": "CAT001",
  "categoryName": "Consultation",
  "status": "COMPLETED",
  "completedAt": ISODate("2025-01-16T10:30:00Z"),
  "description": "Doctor consultation with co-payment",
  "notes": "80% covered by wallet, 20% co-pay",
  "walletTransactionIds": [ObjectId("679d8e123abc456789012850")],
  "isActive": true,
  "createdAt": ISODate("2025-01-16T10:30:00Z"),
  "updatedAt": ISODate("2025-01-16T10:30:00Z")
}
```

---

**Document Version:** 3.3
**Last Updated:** October 15, 2025
**For Questions:** Contact development team
