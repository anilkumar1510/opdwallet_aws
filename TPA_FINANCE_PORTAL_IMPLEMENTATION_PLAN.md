# TPA & FINANCE PORTAL IMPLEMENTATION PLAN

**Document Version:** 1.0
**Created:** October 3, 2025
**Project:** OPD Wallet - TPA & Finance Module
**Status:** Planning Phase

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Claim Workflow & States](#claim-workflow--states)
4. [Database Schema Changes](#database-schema-changes)
5. [Backend API Implementation](#backend-api-implementation)
6. [Frontend Portal Implementation](#frontend-portal-implementation)
7. [Analytics & Reporting](#analytics--reporting)
8. [Implementation Phases](#implementation-phases)
9. [Technical Specifications](#technical-specifications)
10. [Testing Strategy](#testing-strategy)

---

## OVERVIEW

### Purpose
Implement a comprehensive Third-Party Administrator (TPA) portal and Finance portal to manage the complete lifecycle of member claims from submission through payment.

### Key Features
- **TPA Portal**: Claim assignment, review, approval/rejection workflow
- **Finance Portal**: Payment tracking and completion
- **Analytics Dashboard**: Real-time claims statistics and trends
- **Multi-role Access**: TPA Admin, TPA User, Finance User

### Goals
1. Enable efficient claim processing workflow
2. Provide transparency in claim status
3. Track financial obligations and payments
4. Generate actionable analytics for decision-making

---

## USER ROLES & PERMISSIONS

### Role Hierarchy

```
SUPER_ADMIN (Existing)
    ├── Full system access
    └── Can do everything

ADMIN (Existing)
    ├── Full system access
    └── Same permissions as SUPER_ADMIN

TPA_ADMIN (New)
    ├── Full TPA portal access
    ├── Assign claims to TPA users
    ├── View all claims (assigned and unassigned)
    ├── Take action on any claim
    ├── View TPA analytics
    └── Manage TPA users (optional)

TPA_USER (New)
    ├── View assigned claims only
    ├── Approve/Reject/Partially Approve claims
    ├── Request additional documents
    ├── Update claim status
    ├── Add review notes
    └── View personal performance metrics

FINANCE_USER (New)
    ├── View approved claims pending payment
    ├── Mark payments as complete
    ├── Add payment reference details
    ├── View payment analytics
    └── Export payment reports

MEMBER (Existing)
    ├── Submit claims
    ├── View claim status
    ├── Resubmit claims with additional documents
    └── View claim history
```

### Permission Matrix

| Action | SUPER_ADMIN | ADMIN | TPA_ADMIN | TPA_USER | FINANCE_USER | MEMBER |
|--------|-------------|-------|-----------|----------|--------------|--------|
| Submit Claim | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| View All Claims | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Assigned Claims | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign Claims | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve/Reject Claims | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Request Documents | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Approved Claims | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Process Payments | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| View TPA Analytics | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Finance Analytics | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## CLAIM WORKFLOW & STATES

### Claim Status Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLAIM LIFECYCLE WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

1. DRAFT (Member Portal)
   ↓ Member saves claim

2. SUBMITTED (Member Portal)
   ↓ Member submits claim
   Status: "Claim submitted and under processing"

3. UNASSIGNED (TPA Portal)
   ↓ Waiting for TPA Admin to assign
   Visible to: TPA_ADMIN only

4. ASSIGNED (TPA Portal)
   ↓ TPA Admin assigns to TPA User
   Visible to: Assigned TPA_USER + TPA_ADMIN
   Assigned to: Specific TPA User
   Assigned at: Timestamp

5. UNDER_REVIEW (TPA Portal)
   ↓ TPA User is actively reviewing
   TPA User can:
   - View all claim details
   - View uploaded documents
   - Add internal notes
   - Change status

6a. DOCUMENTS_REQUIRED (TPA Portal → Member Portal)
    ↓ TPA User requests more documents
    Member receives notification
    Status: "Additional documents required"
    Reason: Required by TPA User
    Member can: Resubmit with documents
    ↓ On resubmission → Back to ASSIGNED

6b. APPROVED (TPA Portal)
    ↓ TPA User approves claim (full amount)
    Fields:
    - approvedAmount: Full claim amount
    - approvalReason: Text explanation
    - approvedBy: TPA User ID
    - approvedAt: Timestamp
    Status: "Claim approved - Payment pending"
    ↓ Automatically moves to Finance Portal

6c. PARTIALLY_APPROVED (TPA Portal)
    ↓ TPA User approves partial amount
    Fields:
    - approvedAmount: Partial amount (< claimAmount)
    - rejectedAmount: Remaining amount
    - approvalReason: Why partial approval
    - approvedBy: TPA User ID
    - approvedAt: Timestamp
    Status: "Claim partially approved - Payment pending"
    ↓ Automatically moves to Finance Portal

6d. REJECTED (TPA Portal)
    ↓ TPA User rejects claim
    Fields:
    - rejectionReason: Detailed explanation
    - rejectedBy: TPA User ID
    - rejectedAt: Timestamp
    Status: "Claim rejected"
    Workflow ends

7. PAYMENT_PENDING (Finance Portal)
   ↓ Approved/Partially Approved claims
   Visible to: FINANCE_USER
   Finance User can:
   - View claim details
   - View approved amount
   - Add payment reference
   - Mark payment complete

8. PAYMENT_PROCESSING (Finance Portal)
   ↓ Finance User initiates payment
   Status: "Payment being processed"

9. PAYMENT_COMPLETED (Finance Portal)
   ↓ Finance User confirms payment
   Fields:
   - paymentMode: Bank Transfer, Check, UPI, etc.
   - paymentReferenceNumber: Transaction/Check number
   - paymentDate: Date of payment
   - paidAmount: Amount paid
   - paidBy: Finance User ID
   Status: "Payment completed"
   Workflow ends
```

### State Transition Rules

| From State | To State | Who Can Transition | Required Fields |
|------------|----------|-------------------|-----------------|
| SUBMITTED | UNASSIGNED | System (auto) | - |
| UNASSIGNED | ASSIGNED | TPA_ADMIN | assignedTo |
| ASSIGNED | UNDER_REVIEW | TPA_USER | - |
| UNDER_REVIEW | DOCUMENTS_REQUIRED | TPA_USER | documentsRequiredReason |
| DOCUMENTS_REQUIRED | ASSIGNED | Member (resubmit) | Additional documents |
| UNDER_REVIEW | APPROVED | TPA_USER | approvedAmount, approvalReason |
| UNDER_REVIEW | PARTIALLY_APPROVED | TPA_USER | approvedAmount, rejectedAmount, approvalReason |
| UNDER_REVIEW | REJECTED | TPA_USER | rejectionReason |
| APPROVED | PAYMENT_PENDING | System (auto) | - |
| PARTIALLY_APPROVED | PAYMENT_PENDING | System (auto) | - |
| PAYMENT_PENDING | PAYMENT_PROCESSING | FINANCE_USER | - |
| PAYMENT_PROCESSING | PAYMENT_COMPLETED | FINANCE_USER | paymentMode, paymentReferenceNumber, paymentDate, paidAmount |

### Additional Statuses (Edge Cases)

```
CANCELLED (Member Portal)
↓ Member cancels claim before TPA review
Allowed when: Status is DRAFT, SUBMITTED, or UNASSIGNED
Cannot cancel after: ASSIGNED

REASSIGNED (TPA Portal)
↓ TPA Admin reassigns claim to different TPA User
Previous assignment logged in history
New TPA User receives notification
```

---

## DATABASE SCHEMA CHANGES

### 1. Update `users` Collection

**Add New Roles to UserRole Enum:**

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // Existing
  ADMIN = 'ADMIN',                 // Existing
  TPA = 'TPA',                     // Existing
  OPS = 'OPS',                     // Existing
  MEMBER = 'MEMBER',               // Existing
  TPA_ADMIN = 'TPA_ADMIN',         // NEW
  TPA_USER = 'TPA_USER',           // NEW
  FINANCE_USER = 'FINANCE_USER'    // NEW
}
```

**Add TPA-specific fields (optional):**

```typescript
{
  // ... existing user fields
  tpaOrganization?: string,        // TPA company name
  tpaEmployeeId?: string,          // TPA employee ID
  department?: string,             // Finance, Claims Processing, etc.
  workload?: number,               // Current number of assigned claims (for TPA_USER)
}
```

### 2. Update `memberclaims` Collection

**Add Assignment & Review Fields:**

```typescript
// TPA Assignment
assignedTo?: ObjectId,              // REF: User (TPA_USER)
assignedToName?: string,            // TPA User name (denormalized)
assignedBy?: ObjectId,              // REF: User (TPA_ADMIN)
assignedByName?: string,            // TPA Admin name (denormalized)
assignedAt?: Date,                  // Assignment timestamp
reassignmentHistory?: Array<{       // Track reassignments
  previousAssignee: ObjectId,
  newAssignee: ObjectId,
  reassignedBy: ObjectId,
  reassignedAt: Date,
  reason?: string
}>,

// TPA Review
reviewedBy?: ObjectId,              // REF: User (TPA_USER) - Enhanced
reviewedByName?: string,            // TPA User name (denormalized)
reviewedAt?: Date,                  // Already exists
reviewNotes?: string,               // Already exists - Internal TPA notes
reviewHistory?: Array<{             // Track all review actions
  reviewedBy: ObjectId,
  reviewedAt: Date,
  action: string,                   // ASSIGNED, APPROVED, REJECTED, etc.
  notes?: string,
  previousStatus?: string,
  newStatus: string
}>,

// Documents Required
documentsRequired?: boolean,        // Flag for additional docs needed
documentsRequiredReason?: string,   // Why documents are needed
documentsRequiredAt?: Date,         // When requested
documentsRequiredBy?: ObjectId,     // Who requested

// Approval Fields (enhance existing)
approvedAmount?: number,            // Already exists
rejectedAmount?: number,            // Already exists
approvalReason?: string,            // NEW - Why approved
approvedBy?: ObjectId,              // NEW - TPA User who approved
approvedByName?: string,            // NEW - TPA User name
approvedAt?: Date,                  // NEW - Approval timestamp

// Rejection Fields (enhance existing)
rejectionReason?: string,           // Already exists
rejectedBy?: ObjectId,              // NEW - TPA User who rejected
rejectedByName?: string,            // NEW - TPA User name
rejectedAt?: Date,                  // NEW - Rejection timestamp

// Payment Tracking (enhance existing)
paymentStatus?: PaymentStatus,      // Already exists - PENDING, PROCESSING, COMPLETED, FAILED
paymentMode?: string,               // NEW - Bank Transfer, Check, UPI, etc.
paymentReferenceNumber?: string,    // NEW - Transaction/Check number
paymentDate?: Date,                 // Already exists
paidAmount?: number,                // NEW - Actual amount paid (may differ from approved)
paidBy?: ObjectId,                  // NEW - Finance User who processed payment
paidByName?: string,                // NEW - Finance User name
paymentNotes?: string,              // NEW - Payment processing notes
paymentProcessedAt?: Date,          // NEW - When payment was marked complete

// Status Enhancement
status: ClaimStatus,                // Update enum with new statuses
statusHistory: Array<{              // NEW - Track all status changes
  status: ClaimStatus,
  changedBy: ObjectId,
  changedByRole: UserRole,
  changedAt: Date,
  reason?: string,
  notes?: string
}>
```

**Update ClaimStatus Enum:**

```typescript
enum ClaimStatus {
  DRAFT = 'DRAFT',                              // Existing
  SUBMITTED = 'SUBMITTED',                      // Existing
  UNASSIGNED = 'UNASSIGNED',                    // NEW - Waiting for TPA assignment
  ASSIGNED = 'ASSIGNED',                        // NEW - Assigned to TPA User
  UNDER_REVIEW = 'UNDER_REVIEW',                // Existing
  DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',    // NEW - TPA needs more documents
  APPROVED = 'APPROVED',                        // Existing
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',    // Existing
  REJECTED = 'REJECTED',                        // Existing
  CANCELLED = 'CANCELLED',                      // Existing
  PAYMENT_PENDING = 'PAYMENT_PENDING',          // NEW - Approved, awaiting payment
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',    // NEW - Payment being processed
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',      // NEW - Payment done
  RESUBMISSION_REQUIRED = 'RESUBMISSION_REQUIRED' // Existing (renamed from DOCUMENTS_REQUIRED)
}
```

**Update PaymentStatus Enum:**

```typescript
enum PaymentStatus {
  PENDING = 'PENDING',              // Existing - Awaiting TPA approval
  APPROVED = 'APPROVED',            // NEW - TPA approved, awaiting finance
  PROCESSING = 'PROCESSING',        // Existing - Finance processing
  COMPLETED = 'COMPLETED',          // Existing - Payment done
  FAILED = 'FAILED'                 // Existing - Payment failed
}
```

### 3. Create `tpa_analytics` Collection (Optional - for caching)

```typescript
{
  _id: ObjectId,
  date: Date,                       // Analytics date (for daily snapshots)
  period: string,                   // 'daily', 'weekly', 'monthly'

  // Claim Counts
  totalClaims: number,              // Total claims in system
  unassignedClaims: number,         // Claims waiting assignment
  assignedClaims: number,           // Claims assigned to TPA users
  underReviewClaims: number,        // Claims being reviewed
  approvedClaims: number,           // Fully approved claims
  partiallyApprovedClaims: number,  // Partially approved claims
  rejectedClaims: number,           // Rejected claims
  documentsRequiredClaims: number,  // Claims needing documents

  // Financial Metrics
  totalClaimedAmount: number,       // Sum of all claim amounts
  totalApprovedAmount: number,      // Sum of approved amounts
  totalRejectedAmount: number,      // Sum of rejected amounts
  totalPaidAmount: number,          // Sum of payments completed
  pendingPaymentAmount: number,     // Approved but not paid

  // Performance Metrics
  avgProcessingTime: number,        // Average hours from submit to decision
  avgApprovalRate: number,          // Percentage of approved claims
  avgRejectionRate: number,         // Percentage of rejected claims

  // By TPA User (array)
  userStats: Array<{
    userId: ObjectId,
    userName: string,
    assignedCount: number,          // Claims currently assigned
    reviewedCount: number,          // Claims reviewed (all time)
    approvedCount: number,          // Claims approved
    rejectedCount: number,          // Claims rejected
    avgProcessingTime: number,      // Average time to review
  }>,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```typescript
{ date: -1 }                        // Latest analytics first
{ period: 1, date: -1 }             // Filter by period
```

---

## BACKEND API IMPLEMENTATION

### Module Structure

```
api/src/modules/
├── tpa/                            # TPA Portal Module
│   ├── tpa.module.ts
│   ├── tpa.controller.ts
│   ├── tpa.service.ts
│   ├── dto/
│   │   ├── assign-claim.dto.ts
│   │   ├── review-claim.dto.ts
│   │   ├── approve-claim.dto.ts
│   │   ├── reject-claim.dto.ts
│   │   └── request-documents.dto.ts
│   └── interfaces/
│       └── tpa-analytics.interface.ts
│
├── finance/                        # Finance Portal Module
│   ├── finance.module.ts
│   ├── finance.controller.ts
│   ├── finance.service.ts
│   ├── dto/
│   │   ├── process-payment.dto.ts
│   │   └── complete-payment.dto.ts
│   └── interfaces/
│       └── finance-analytics.interface.ts
│
└── memberclaims/                   # Enhance existing module
    ├── memberclaims.module.ts      # Update with TPA/Finance imports
    ├── memberclaims.controller.ts  # Add TPA/Finance endpoints
    ├── memberclaims.service.ts     # Add workflow methods
    └── ... (existing files)
```

### TPA API Endpoints

#### 1. Claims Management

```typescript
// GET /api/tpa/claims
// Get all claims (TPA_ADMIN) or assigned claims (TPA_USER)
// Query params: status, assignedTo, fromDate, toDate, page, limit
{
  claims: Claim[],
  total: number,
  page: number,
  totalPages: number,
  unassignedCount: number,      // Only for TPA_ADMIN
  assignedCount: number
}

// GET /api/tpa/claims/unassigned
// Get unassigned claims (TPA_ADMIN only)
// Query params: fromDate, toDate, page, limit
{
  claims: Claim[],
  total: number,
  page: number,
  totalPages: number
}

// GET /api/tpa/claims/:claimId
// Get claim details
// Access: TPA_ADMIN or assigned TPA_USER
{
  claim: Claim,
  assignmentHistory: Assignment[],
  statusHistory: StatusChange[],
  documents: Document[]
}

// POST /api/tpa/claims/:claimId/assign
// Assign claim to TPA User (TPA_ADMIN only)
// Body: { assignedTo: userId, notes?: string }
{
  claim: Claim,
  message: "Claim assigned successfully"
}

// POST /api/tpa/claims/:claimId/reassign
// Reassign claim to different TPA User (TPA_ADMIN only)
// Body: { assignedTo: userId, reason: string }
{
  claim: Claim,
  message: "Claim reassigned successfully"
}
```

#### 2. Claim Review Actions

```typescript
// PATCH /api/tpa/claims/:claimId/status
// Update claim status (TPA_USER for assigned claims)
// Body: { status: ClaimStatus, notes?: string }
{
  claim: Claim,
  message: "Claim status updated"
}

// POST /api/tpa/claims/:claimId/approve
// Approve claim (full or partial)
// Body: {
//   approvedAmount: number,
//   approvalReason: string,
//   isPartial: boolean,
//   notes?: string
// }
{
  claim: Claim,
  message: "Claim approved successfully"
}

// POST /api/tpa/claims/:claimId/reject
// Reject claim
// Body: {
//   rejectionReason: string,
//   notes?: string
// }
{
  claim: Claim,
  message: "Claim rejected"
}

// POST /api/tpa/claims/:claimId/request-documents
// Request additional documents from member
// Body: {
//   documentsRequiredReason: string,
//   requiredDocuments: string[],  // List of needed documents
//   notes?: string
// }
{
  claim: Claim,
  message: "Documents requested from member"
}

// POST /api/tpa/claims/:claimId/notes
// Add internal review notes
// Body: { notes: string }
{
  claim: Claim,
  message: "Notes added successfully"
}
```

#### 3. TPA Analytics

```typescript
// GET /api/tpa/analytics/summary
// Get TPA dashboard summary
// Query params: fromDate, toDate
{
  summary: {
    totalClaims: number,
    unassignedClaims: number,
    assignedClaims: number,
    underReviewClaims: number,
    approvedClaims: number,
    partiallyApprovedClaims: number,
    rejectedClaims: number,
    documentsRequiredClaims: number,
    totalClaimedAmount: number,
    totalApprovedAmount: number,
    totalRejectedAmount: number,
    avgProcessingTime: number,
    approvalRate: number,
    rejectionRate: number
  },
  period: { fromDate: Date, toDate: Date }
}

// GET /api/tpa/analytics/by-status
// Claims grouped by status with counts and amounts
// Query params: fromDate, toDate
{
  byStatus: [
    {
      status: ClaimStatus,
      count: number,
      totalAmount: number,
      avgAmount: number
    }
  ]
}

// GET /api/tpa/analytics/by-user
// Performance metrics by TPA User (TPA_ADMIN only)
// Query params: fromDate, toDate
{
  byUser: [
    {
      userId: ObjectId,
      userName: string,
      assignedCount: number,
      reviewedCount: number,
      approvedCount: number,
      rejectedCount: number,
      avgProcessingTime: number,
      approvalRate: number
    }
  ]
}

// GET /api/tpa/analytics/trends
// Time-series data for charts
// Query params: period (daily/weekly/monthly), fromDate, toDate
{
  trends: [
    {
      date: Date,
      submitted: number,
      approved: number,
      rejected: number,
      totalAmount: number,
      approvedAmount: number
    }
  ]
}

// GET /api/tpa/analytics/export
// Export claims data to CSV/Excel
// Query params: format (csv/excel), fromDate, toDate, status
// Response: File download
```

#### 4. TPA User Management

```typescript
// GET /api/tpa/users
// Get all TPA users (TPA_ADMIN only)
{
  users: [
    {
      userId: ObjectId,
      userName: string,
      email: string,
      role: UserRole,
      currentWorkload: number,      // Active assigned claims
      totalReviewed: number,
      approvalRate: number,
      isActive: boolean
    }
  ]
}

// GET /api/tpa/users/:userId/workload
// Get TPA user's current workload
{
  userId: ObjectId,
  userName: string,
  assignedClaims: Claim[],
  workloadCount: number,
  stats: {
    underReview: number,
    approved: number,
    rejected: number,
    documentsRequired: number
  }
}
```

### Finance API Endpoints

#### 1. Payment Management

```typescript
// GET /api/finance/claims/pending
// Get approved claims pending payment
// Query params: fromDate, toDate, page, limit, sortBy
{
  claims: Claim[],
  total: number,
  page: number,
  totalPages: number,
  totalPendingAmount: number
}

// GET /api/finance/claims/:claimId
// Get claim details for payment processing
{
  claim: Claim,
  member: {
    userId: ObjectId,
    name: string,
    email: string,
    phone: string,
    bankDetails?: {
      accountNumber: string,
      ifscCode: string,
      accountHolderName: string,
      bankName: string
    }
  },
  approvalDetails: {
    approvedBy: string,
    approvedAt: Date,
    approvalReason: string,
    approvedAmount: number
  }
}

// POST /api/finance/claims/:claimId/process-payment
// Mark payment as processing
// Body: { notes?: string }
{
  claim: Claim,
  message: "Payment processing initiated"
}

// POST /api/finance/claims/:claimId/complete-payment
// Mark payment as completed
// Body: {
//   paymentMode: string,            // Bank Transfer, Check, UPI, etc.
//   paymentReferenceNumber: string,
//   paymentDate: Date,
//   paidAmount: number,
//   paymentNotes?: string
// }
{
  claim: Claim,
  payment: {
    paymentMode: string,
    paymentReferenceNumber: string,
    paymentDate: Date,
    paidAmount: number,
    paidBy: string,
    paymentCompletedAt: Date
  },
  message: "Payment completed successfully"
}

// POST /api/finance/claims/:claimId/payment-failed
// Mark payment as failed
// Body: { failureReason: string, notes?: string }
{
  claim: Claim,
  message: "Payment marked as failed"
}
```

#### 2. Finance Analytics

```typescript
// GET /api/finance/analytics/summary
// Get finance dashboard summary
// Query params: fromDate, toDate
{
  summary: {
    pendingPaymentCount: number,
    pendingPaymentAmount: number,
    processingPaymentCount: number,
    processingPaymentAmount: number,
    completedPaymentCount: number,
    completedPaymentAmount: number,
    failedPaymentCount: number,
    failedPaymentAmount: number,
    totalPaidToday: number,
    totalPaidThisWeek: number,
    totalPaidThisMonth: number
  },
  period: { fromDate: Date, toDate: Date }
}

// GET /api/finance/analytics/by-date
// Payments grouped by date
// Query params: fromDate, toDate, groupBy (day/week/month)
{
  byDate: [
    {
      date: Date,
      count: number,
      totalAmount: number,
      avgAmount: number
    }
  ]
}

// GET /api/finance/analytics/by-payment-mode
// Payments grouped by payment mode
// Query params: fromDate, toDate
{
  byPaymentMode: [
    {
      paymentMode: string,
      count: number,
      totalAmount: number,
      percentage: number
    }
  ]
}

// GET /api/finance/analytics/export
// Export payment data to CSV/Excel
// Query params: format (csv/excel), fromDate, toDate, status
// Response: File download
```

### Enhanced Member Claims API

```typescript
// Add to existing /api/member/claims endpoints:

// GET /api/member/claims/:claimId/status-timeline
// Get detailed status timeline for transparency
{
  claimId: string,
  currentStatus: ClaimStatus,
  timeline: [
    {
      status: ClaimStatus,
      timestamp: Date,
      actor: string,           // Who changed the status
      actorRole: UserRole,
      notes?: string,
      reason?: string
    }
  ]
}

// POST /api/member/claims/:claimId/resubmit-documents
// Resubmit claim with additional documents
// (When status is DOCUMENTS_REQUIRED)
// Body: FormData with files
{
  claim: Claim,
  message: "Documents resubmitted successfully"
}

// GET /api/member/claims/:claimId/tpa-notes
// Get TPA review notes visible to member (filtered)
{
  claimId: string,
  publicNotes: [
    {
      note: string,
      addedBy: string,
      addedAt: Date,
      type: string         // APPROVAL, REJECTION, DOCUMENTS_REQUIRED
    }
  ]
}
```

---

## FRONTEND PORTAL IMPLEMENTATION

### Portal Structure

```
web-admin/                          # Extend existing admin portal
├── app/
│   └── admin/
│       ├── tpa/                    # NEW - TPA Section
│       │   ├── page.tsx            # TPA Dashboard
│       │   ├── claims/
│       │   │   ├── page.tsx        # Claims list
│       │   │   ├── unassigned/
│       │   │   │   └── page.tsx    # Unassigned claims (TPA_ADMIN)
│       │   │   ├── assigned/
│       │   │   │   └── page.tsx    # My assigned claims (TPA_USER)
│       │   │   └── [claimId]/
│       │   │       └── page.tsx    # Claim detail & review
│       │   ├── analytics/
│       │   │   └── page.tsx        # TPA Analytics dashboard
│       │   └── users/
│       │       └── page.tsx        # TPA Users management (TPA_ADMIN)
│       │
│       └── finance/                # NEW - Finance Section
│           ├── page.tsx            # Finance Dashboard
│           ├── payments/
│           │   ├── pending/
│           │   │   └── page.tsx    # Pending payments
│           │   ├── processing/
│           │   │   └── page.tsx    # In-process payments
│           │   ├── completed/
│           │   │   └── page.tsx    # Completed payments
│           │   └── [claimId]/
│           │       └── page.tsx    # Payment detail & processing
│           └── analytics/
│               └── page.tsx        # Finance Analytics dashboard

└── components/
    ├── tpa/                        # NEW - TPA Components
    │   ├── ClaimAssignmentModal.tsx
    │   ├── ClaimReviewPanel.tsx
    │   ├── ApprovalModal.tsx
    │   ├── RejectionModal.tsx
    │   ├── DocumentsRequestModal.tsx
    │   ├── TPAAnalyticsCharts.tsx
    │   └── TPAUserWorkloadCard.tsx
    │
    └── finance/                    # NEW - Finance Components
        ├── PaymentProcessingModal.tsx
        ├── PaymentCompletionForm.tsx
        ├── PaymentHistoryTable.tsx
        └── FinanceAnalyticsCharts.tsx
```

### TPA Portal Pages

#### 1. TPA Dashboard (`/admin/tpa`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  TPA Dashboard                                              │
├─────────────────────────────────────────────────────────────┤
│  Quick Stats Cards                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Unassigned│ │ Assigned │ │Under Rev.│ │ Approved │      │
│  │    12    │ │    45    │ │    18    │ │   123    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Rejected │ │Docs Req. │ │Pending $ │ │ Paid $   │      │
│  │    23    │ │     8    │ │ ₹45,000  │ │ ₹1.2M    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  Recent Activity                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CLM-001 assigned to Rahul Kumar        2 mins ago   │  │
│  │ CLM-002 approved by Priya Shah         5 mins ago   │  │
│  │ CLM-003 documents requested            10 mins ago  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Claims Requiring Attention                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Table of claims needing assignment/review]          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time statistics
- Quick access to unassigned claims (TPA_ADMIN)
- My assigned claims (TPA_USER)
- Recent activity feed
- Alerts for claims pending >24 hours

#### 2. Claims List (`/admin/tpa/claims`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  All Claims                                    [+ Filters]   │
├─────────────────────────────────────────────────────────────┤
│  Search: [___________]  Status: [All ▼]  Assigned: [All ▼] │
│  Date Range: [From] - [To]            [Export CSV]          │
├─────────────────────────────────────────────────────────────┤
│  Claim ID  │ Patient │ Amount │ Status      │ Assigned To  │
│────────────┼─────────┼────────┼─────────────┼──────────────│
│  CLM-001   │ John D. │ ₹2,500 │ Assigned    │ Rahul K.     │
│  CLM-002   │ Jane S. │ ₹5,000 │ Under Rev.  │ Priya S.     │
│  CLM-003   │ Bob J.  │ ₹3,200 │ Unassigned  │ -            │
│            │         │        │             │    [Assign]  │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Advanced filters (status, assigned user, date range)
- Bulk assignment (TPA_ADMIN)
- Quick assign button for unassigned claims
- Export functionality
- Pagination

#### 3. Claim Detail & Review (`/admin/tpa/claims/[claimId]`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Claim CLM-20251003-0001          Status: [Assigned ▼]      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌──────────────────────┐ │
│  │ Claim Information           │  │ Assignment Info      │ │
│  │                             │  │                      │ │
│  │ Patient: John Doe           │  │ Assigned to: You     │ │
│  │ Claim Type: Reimbursement   │  │ Assigned on: Oct 3   │ │
│  │ Treatment Date: Oct 1, 2025 │  │ Assigned by: Admin   │ │
│  │ Claimed Amount: ₹5,000      │  │ Due Date: Oct 10     │ │
│  │ Provider: Apollo Hospital   │  └──────────────────────┘ │
│  │ Category: Consultation      │                           │
│  │                             │  ┌──────────────────────┐ │
│  │ Description:                │  │ Member Details       │ │
│  │ Cardiac consultation        │  │                      │ │
│  └─────────────────────────────┘  │ Name: John Doe       │ │
│                                    │ ID: MEM-001          │ │
│  ┌─────────────────────────────┐  │ Phone: +91-XXXXX     │ │
│  │ Uploaded Documents (3)      │  │ Email: john@...      │ │
│  │                             │  └──────────────────────┘ │
│  │ [📄] Invoice.pdf            │                           │
│  │ [📄] Prescription.pdf       │                           │
│  │ [📄] Medical_Report.pdf     │                           │
│  │ [👁️ View] [⬇️ Download All] │                           │
│  └─────────────────────────────┘                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Status History                                       │   │
│  │                                                      │   │
│  │ • Submitted by Member          Oct 3, 10:00 AM      │   │
│  │ • Assigned to Rahul Kumar      Oct 3, 10:15 AM      │   │
│  │ • Under Review                 Oct 3, 11:00 AM      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Review Notes (Internal)                              │   │
│  │ [_______________________________________________]     │   │
│  │ [Add Note]                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Actions:                                                    │
│  [✅ Approve] [❌ Reject] [📄 Request Documents] [← Back]  │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Complete claim details
- Document viewer/downloader
- Status timeline
- Internal notes section
- Action buttons:
  - **Approve**: Opens approval modal
  - **Reject**: Opens rejection modal
  - **Request Documents**: Opens document request modal
  - **Reassign**: Transfer to another TPA user (admin only)

#### 4. Approval Modal

```
┌─────────────────────────────────────────┐
│  Approve Claim CLM-20251003-0001        │
├─────────────────────────────────────────┤
│                                         │
│  Claimed Amount:      ₹5,000            │
│                                         │
│  Approval Type:                         │
│  ( ) Full Approval                      │
│  (•) Partial Approval                   │
│                                         │
│  Approved Amount:                       │
│  [₹ 4,500____________]                  │
│                                         │
│  Rejected Amount:                       │
│  ₹500 (auto-calculated)                 │
│                                         │
│  Approval Reason: (Required)            │
│  [______________________________]       │
│  [______________________________]       │
│                                         │
│  Internal Notes: (Optional)             │
│  [______________________________]       │
│                                         │
│  [ Cancel ]          [ Approve Claim ]  │
└─────────────────────────────────────────┘
```

#### 5. TPA Analytics (`/admin/tpa/analytics`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  TPA Analytics                     Period: [Last 30 Days ▼] │
├─────────────────────────────────────────────────────────────┤
│  Summary Cards                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Total Clm │ │Approval  │ │Rejection │ │Avg Time  │      │
│  │   245    │ │  Rate    │ │  Rate    │ │ to Review│      │
│  │          │ │   78%    │ │   15%    │ │  2.3 hrs │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  Claims by Status (Chart)                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         [Pie/Bar Chart showing claim distribution]   │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Claims Trend (Chart)                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         [Line chart: Submitted vs Approved/Rejected] │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Amount Analysis (Chart)                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         [Bar chart: Claimed vs Approved vs Paid]     │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  TPA User Performance (Table) - Admin Only                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ User      │ Assigned │ Reviewed │ Approved │ Avg Time│  │
│  ├───────────┼──────────┼──────────┼──────────┼─────────┤  │
│  │ Rahul K.  │    45    │   120    │   95     │  2.1h   │  │
│  │ Priya S.  │    38    │   110    │   88     │  1.9h   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Export Report]                                            │
└─────────────────────────────────────────────────────────────┘
```

**Chart Libraries:**
- Recharts or Chart.js for visualizations
- Date range picker for filtering
- Export to PDF/Excel

### Finance Portal Pages

#### 1. Finance Dashboard (`/admin/finance`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Finance Dashboard                                          │
├─────────────────────────────────────────────────────────────┤
│  Payment Summary                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Pending  │ │Processing│ │Completed │ │  Failed  │      │
│  │  ₹45K    │ │  ₹12K    │ │  ₹1.2M   │ │  ₹2K     │      │
│  │  (15)    │ │   (3)    │ │  (245)   │ │  (2)     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  Today's Payments: ₹85,000    This Week: ₹4,25,000          │
│  This Month: ₹18,50,000       Total Paid: ₹1,20,00,000      │
│                                                              │
│  Pending Payments (Require Action)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Table of approved claims awaiting payment]          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Pending Payments (`/admin/finance/payments/pending`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Pending Payments                          Total: ₹45,000    │
├─────────────────────────────────────────────────────────────┤
│  Search: [___________]  Sort: [Date ▼]  Filter: [All ▼]    │
├─────────────────────────────────────────────────────────────┤
│  Claim ID │ Member  │ Approved  │ Approved │ Days  │ Action │
│           │         │ Amount    │ Date     │Pending│        │
│───────────┼─────────┼───────────┼──────────┼───────┼────────│
│  CLM-001  │ John D. │  ₹5,000   │ Oct 1    │  2    │[Pay]   │
│  CLM-002  │ Jane S. │  ₹8,500   │ Oct 2    │  1    │[Pay]   │
│  CLM-003  │ Bob J.  │  ₹12,000  │ Sep 30   │  3    │[Pay]   │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Payment Processing Modal

```
┌─────────────────────────────────────────┐
│  Process Payment - CLM-20251003-0001    │
├─────────────────────────────────────────┤
│                                         │
│  Member Details:                        │
│  Name: John Doe                         │
│  Member ID: MEM-001                     │
│  Email: john@example.com                │
│  Phone: +91-9876543210                  │
│                                         │
│  Bank Details:                          │
│  Account: XXXX-XXXX-1234                │
│  IFSC: HDFC0001234                      │
│  Bank: HDFC Bank                        │
│                                         │
│  Approved Amount: ₹5,000                │
│                                         │
│  Payment Mode: (Required)               │
│  ( ) Bank Transfer                      │
│  ( ) Check                              │
│  ( ) UPI                                │
│  ( ) Cash                               │
│                                         │
│  Payment Reference Number: (Required)   │
│  [____________________________]         │
│                                         │
│  Payment Date: (Required)               │
│  [Oct 3, 2025 ▼]                        │
│                                         │
│  Amount to Pay: (Required)              │
│  [₹ 5,000_____________]                 │
│                                         │
│  Payment Notes: (Optional)              │
│  [______________________________]       │
│                                         │
│  [ Cancel ]    [ Complete Payment ]     │
└─────────────────────────────────────────┘
```

#### 4. Finance Analytics (`/admin/finance/analytics`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Finance Analytics               Period: [Last 30 Days ▼]   │
├─────────────────────────────────────────────────────────────┤
│  Payment Trends (Chart)                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         [Line chart: Daily payment volumes]          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Payment Modes Distribution (Chart)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         [Pie chart: Bank Transfer 60%, UPI 30%...]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Top Claims by Amount (Table)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Claim ID  │ Member    │ Amount   │ Paid On │ Mode   │  │
│  ├───────────┼───────────┼──────────┼─────────┼────────┤  │
│  │ CLM-045   │ Robert J. │ ₹25,000  │ Oct 1   │ NEFT   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Export Report]                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ANALYTICS & REPORTING

### TPA Analytics Metrics

#### 1. Dashboard KPIs

**Claim Volume Metrics:**
- Total claims received (period)
- Unassigned claims (current)
- Assigned claims (current)
- Under review claims (current)
- Approved claims (period)
- Rejected claims (period)
- Documents required claims (current)
- Cancelled claims (period)

**Financial Metrics:**
- Total claimed amount (period)
- Total approved amount (period)
- Total rejected amount (period)
- Approval rate (%)
- Average claim amount
- Average approved amount

**Performance Metrics:**
- Average processing time (hours/days)
- SLA compliance rate (%)
- Claims processed per day
- Claims pending > 24 hours
- Claims pending > 48 hours
- Claims pending > 7 days

**TPA User Metrics (Admin only):**
- Claims assigned per user
- Claims reviewed per user
- Approval rate by user
- Rejection rate by user
- Average review time by user
- Workload distribution

#### 2. Trend Charts

**Time Series Data:**
- Daily claim submissions (line chart)
- Daily approvals vs rejections (stacked bar chart)
- Processing time trend (line chart)
- Amount trends: claimed vs approved (dual-axis chart)

**Distribution Charts:**
- Claims by status (pie/donut chart)
- Claims by category (bar chart)
- Approval rate by category (bar chart)
- Claims by amount range (histogram)

#### 3. Export Capabilities

**CSV/Excel Export Fields:**
- Claim ID
- Submission Date
- Member Name & ID
- Category
- Provider Name
- Claimed Amount
- Approved Amount
- Rejected Amount
- Status
- Assigned To
- Reviewed By
- Processing Time
- Approval/Rejection Reason
- Documents Count
- Current Status
- Last Updated

### Finance Analytics Metrics

#### 1. Dashboard KPIs

**Payment Status Metrics:**
- Pending payment count & amount
- Processing payment count & amount
- Completed payment count & amount
- Failed payment count & amount
- Total paid (period)

**Timeline Metrics:**
- Payments completed today
- Payments completed this week
- Payments completed this month
- Payments completed this year
- Average time from approval to payment

**Payment Mode Breakdown:**
- Bank Transfer (count & amount)
- UPI (count & amount)
- Check (count & amount)
- Cash (count & amount)
- Other (count & amount)

#### 2. Charts & Visualizations

**Payment Trends:**
- Daily payment completions (line chart)
- Payment volumes by week/month (bar chart)
- Payment modes distribution (pie chart)
- Average payment amount trend (line chart)

**Aging Analysis:**
- Payments pending 0-7 days
- Payments pending 7-14 days
- Payments pending 14-30 days
- Payments pending >30 days (aging report)

#### 3. Export Capabilities

**CSV/Excel Export Fields:**
- Claim ID
- Member Name & ID
- Approved Amount
- Paid Amount
- Approval Date
- Payment Date
- Payment Mode
- Payment Reference Number
- Processed By
- Days to Payment
- Status
- Payment Notes

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)

**Backend:**
1. Update user roles enum (TPA_ADMIN, TPA_USER, FINANCE_USER)
2. Enhance memberclaims schema with TPA/Finance fields
3. Add status enum updates
4. Create database migration scripts
5. Add new indexes for performance

**Frontend:**
1. Create basic TPA portal structure
2. Create basic Finance portal structure
3. Update admin sidebar with TPA/Finance links
4. Create reusable components (modals, forms)

**Testing:**
1. Test role-based access
2. Test schema updates
3. Verify backward compatibility

**Deliverables:**
- ✅ Updated database schema
- ✅ New user roles functional
- ✅ Basic portal structure
- ✅ Migration scripts

### Phase 2: TPA Core Functionality (Week 3-4)

**Backend:**
1. Create TPA module, controller, service
2. Implement claim assignment endpoints
3. Implement claim review endpoints (approve/reject/request docs)
4. Implement status update logic
5. Add assignment history tracking
6. Add status history tracking

**Frontend:**
1. Build TPA dashboard with statistics
2. Build claims list page (all, unassigned, assigned)
3. Build claim detail/review page
4. Build approval/rejection modals
5. Build document request modal
6. Build assignment modal (admin)

**Testing:**
1. Test claim assignment workflow
2. Test approval/rejection flow
3. Test document request flow
4. Test TPA user permissions
5. Test TPA admin permissions

**Deliverables:**
- ✅ TPA claim assignment functional
- ✅ TPA claim review functional
- ✅ All claim actions working
- ✅ Complete TPA dashboard

### Phase 3: Finance Portal (Week 5)

**Backend:**
1. Create Finance module, controller, service
2. Implement pending payments endpoint
3. Implement payment processing endpoint
4. Implement payment completion endpoint
5. Add payment tracking fields
6. Add payment history

**Frontend:**
1. Build Finance dashboard
2. Build pending payments list
3. Build payment processing modal
4. Build payment completion form
5. Build payment history view

**Testing:**
1. Test payment workflow end-to-end
2. Test payment status updates
3. Test finance user permissions
4. Test payment data accuracy

**Deliverables:**
- ✅ Finance portal functional
- ✅ Payment workflow complete
- ✅ Payment tracking accurate

### Phase 4: Analytics & Reporting (Week 6)

**Backend:**
1. Implement TPA analytics endpoints
2. Implement Finance analytics endpoints
3. Add aggregation queries for statistics
4. Implement export functionality (CSV/Excel)
5. Add caching for analytics (optional)

**Frontend:**
1. Build TPA analytics dashboard with charts
2. Build Finance analytics dashboard
3. Integrate chart libraries (Recharts/Chart.js)
4. Add date range filters
5. Add export buttons
6. Build performance metrics views

**Testing:**
1. Test analytics calculations
2. Test chart rendering
3. Test export functionality
4. Test date filtering
5. Performance testing for large datasets

**Deliverables:**
- ✅ TPA analytics fully functional
- ✅ Finance analytics fully functional
- ✅ Export features working
- ✅ Charts and visualizations complete

### Phase 5: Integration & Member Experience (Week 7)

**Backend:**
1. Add notification system for claim status changes
2. Add email notifications (optional)
3. Enhance member claims API for transparency
4. Add document resubmission endpoint

**Frontend:**
1. Update member portal claim status display
2. Add status timeline for members
3. Add document resubmission UI
4. Add TPA review notes (filtered) display
5. Update claim list with new statuses

**Testing:**
1. Test end-to-end workflow (member → TPA → finance)
2. Test notifications
3. Test member resubmission flow
4. Test status transparency

**Deliverables:**
- ✅ Complete end-to-end workflow
- ✅ Member status transparency
- ✅ Notification system
- ✅ Document resubmission functional

### Phase 6: Polish & Optimization (Week 8)

**Backend:**
1. Add validation and error handling
2. Optimize database queries
3. Add rate limiting
4. Add audit logging for TPA/Finance actions
5. Security review

**Frontend:**
1. UI/UX polish and consistency
2. Add loading states and error handling
3. Add success/error notifications
4. Responsive design fixes
5. Accessibility improvements

**Testing:**
1. Comprehensive integration testing
2. User acceptance testing
3. Performance testing
4. Security testing
5. Load testing

**Documentation:**
1. API documentation (Swagger)
2. User guides (TPA, Finance)
3. Admin documentation
4. Deployment guide

**Deliverables:**
- ✅ Production-ready system
- ✅ Complete documentation
- ✅ All tests passing
- ✅ Performance optimized

---

## TECHNICAL SPECIFICATIONS

### Security Requirements

1. **Authentication:**
   - JWT-based authentication (existing)
   - Role-based access control (RBAC)
   - Session management

2. **Authorization:**
   - Route guards for TPA/Finance portals
   - API endpoint protection by role
   - Field-level access control (e.g., only assigned TPA user can review)

3. **Data Security:**
   - Sensitive claim data encryption
   - Audit logging for all TPA/Finance actions
   - PII protection (member bank details, etc.)

4. **Compliance:**
   - HIPAA-like considerations for medical data
   - Data retention policies
   - Right to information (member can view claim history)

### Performance Requirements

1. **Response Times:**
   - API response < 500ms for list endpoints
   - API response < 200ms for single claim fetch
   - Analytics calculations < 2 seconds
   - Export generation < 5 seconds

2. **Scalability:**
   - Support 1000+ concurrent TPA users
   - Handle 10,000+ claims per month
   - Analytics for 1M+ historical claims

3. **Database:**
   - Proper indexing on assignment, status, dates
   - Query optimization for analytics
   - Consider caching for frequently accessed data

### Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Mobile Responsiveness

- TPA Portal: Tablet-friendly (landscape orientation)
- Finance Portal: Desktop-optimized
- Member Portal: Fully mobile-responsive (existing)

---

## TESTING STRATEGY

### Unit Testing

**Backend (NestJS + Jest):**
```typescript
// Example test structure
describe('TPAService', () => {
  describe('assignClaim', () => {
    it('should assign claim to TPA user successfully')
    it('should throw error if claim already assigned')
    it('should throw error if user is not TPA_USER role')
    it('should update claim status to ASSIGNED')
    it('should create assignment history entry')
  })

  describe('approveClaim', () => {
    it('should approve claim with full amount')
    it('should partially approve claim with reason')
    it('should throw error if not assigned to requesting user')
    it('should update status to PAYMENT_PENDING')
    it('should create status history entry')
  })
})
```

**Frontend (React Testing Library):**
```typescript
// Example test structure
describe('ClaimReviewPanel', () => {
  it('renders claim details correctly')
  it('shows approve/reject buttons for assigned claims')
  it('hides action buttons for other users claims')
  it('opens approval modal on approve click')
  it('submits approval with correct data')
  it('shows success message after approval')
})
```

### Integration Testing

**API Integration Tests:**
```typescript
describe('TPA Claim Workflow Integration', () => {
  it('should complete full workflow: submit → assign → approve → payment')
  it('should handle reassignment correctly')
  it('should prevent unauthorized access to claims')
  it('should track all status changes in history')
})
```

**Database Integration:**
```typescript
describe('Database Integrity', () => {
  it('should maintain referential integrity for assignments')
  it('should update workload count on assignment')
  it('should create audit logs for all actions')
  it('should enforce unique constraints')
})
```

### End-to-End Testing (Cypress/Playwright)

```typescript
describe('Member to Payment E2E Flow', () => {
  it('Member submits claim → TPA assigns → TPA approves → Finance pays', () => {
    // Member submits claim
    cy.login('member@test.com', 'password')
    cy.visit('/member/claims/new')
    cy.fillClaimForm({ ... })
    cy.submitClaim()
    cy.getClaimId().as('claimId')

    // TPA Admin assigns
    cy.login('tpa-admin@test.com', 'password')
    cy.visit('/admin/tpa/claims')
    cy.get('@claimId').then(id => {
      cy.assignClaim(id, 'tpa-user@test.com')
    })

    // TPA User approves
    cy.login('tpa-user@test.com', 'password')
    cy.visit('/admin/tpa/claims')
    cy.get('@claimId').then(id => {
      cy.openClaim(id)
      cy.approveClaim(5000, 'Claim verified and approved')
    })

    // Finance processes payment
    cy.login('finance@test.com', 'password')
    cy.visit('/admin/finance/payments/pending')
    cy.get('@claimId').then(id => {
      cy.processPayment(id, {
        mode: 'Bank Transfer',
        reference: 'TXN123456',
        amount: 5000
      })
    })

    // Verify final status
    cy.get('@claimId').then(id => {
      cy.verifyClaim(id, {
        status: 'PAYMENT_COMPLETED',
        paidAmount: 5000
      })
    })
  })
})
```

### User Acceptance Testing (UAT)

**Test Scenarios:**
1. TPA Admin assigns 50 claims to different TPA users
2. TPA User reviews and approves/rejects 20 claims
3. TPA User requests documents for 5 claims
4. Finance User processes 30 payments
5. Member views claim status and timeline
6. TPA Admin views analytics and exports report
7. Finance User views payment analytics

**Acceptance Criteria:**
- All workflows complete without errors
- Data accuracy verified at each step
- Performance meets requirements
- UI is intuitive and easy to use
- No security vulnerabilities found

---

## RISK MITIGATION

### Identified Risks

1. **Data Inconsistency Risk**
   - Risk: Status updates may fail partially
   - Mitigation: Use database transactions for multi-step updates
   - Mitigation: Add data consistency validation scripts

2. **Performance Risk**
   - Risk: Analytics queries may be slow with large datasets
   - Mitigation: Implement caching layer (Redis)
   - Mitigation: Add database indexes
   - Mitigation: Use pagination for all lists

3. **Security Risk**
   - Risk: Unauthorized access to claims
   - Mitigation: Strict role-based access control
   - Mitigation: Field-level authorization checks
   - Mitigation: Comprehensive audit logging

4. **User Experience Risk**
   - Risk: Complex workflow may confuse users
   - Mitigation: Clear status indicators
   - Mitigation: Comprehensive user guide
   - Mitigation: In-app tooltips and help text

5. **Integration Risk**
   - Risk: Breaking existing member claims functionality
   - Mitigation: Backward compatibility testing
   - Mitigation: Feature flags for gradual rollout
   - Mitigation: Comprehensive regression testing

---

## SUCCESS METRICS

### KPIs for Measuring Success

1. **Operational Efficiency:**
   - Average claim processing time < 48 hours
   - TPA user productivity > 20 claims/day
   - Claim assignment time < 2 hours
   - Payment processing time < 24 hours after approval

2. **Quality Metrics:**
   - Approval accuracy > 95%
   - Document resubmission rate < 10%
   - Payment error rate < 1%
   - SLA compliance > 98%

3. **User Satisfaction:**
   - TPA user satisfaction score > 4/5
   - Finance user satisfaction score > 4/5
   - Member satisfaction with transparency > 4/5
   - System uptime > 99.9%

4. **Business Impact:**
   - Claim processing cost reduction > 30%
   - Time to payment reduction > 50%
   - Manual errors reduction > 80%
   - Audit trail completeness = 100%

---

## APPENDIX

### A. Sample Data for Testing

**TPA Users:**
```javascript
{
  email: "tpa-admin@opdwallet.com",
  role: "TPA_ADMIN",
  name: { firstName: "Rajesh", lastName: "Kumar" },
  tpaOrganization: "HealthCare TPA Ltd"
}

{
  email: "tpa-user1@opdwallet.com",
  role: "TPA_USER",
  name: { firstName: "Priya", lastName: "Sharma" },
  tpaOrganization: "HealthCare TPA Ltd"
}
```

**Finance Users:**
```javascript
{
  email: "finance@opdwallet.com",
  role: "FINANCE_USER",
  name: { firstName: "Amit", lastName: "Patel" },
  department: "Finance"
}
```

### B. Database Migration Script Template

```javascript
// Migration: Add TPA/Finance fields to memberclaims
db.memberclaims.updateMany(
  {},
  {
    $set: {
      assignedTo: null,
      assignedBy: null,
      assignedAt: null,
      reassignmentHistory: [],
      reviewHistory: [],
      statusHistory: [],
      documentsRequired: false,
      approvalReason: null,
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedByName: null,
      rejectedAt: null,
      paymentMode: null,
      paymentReferenceNumber: null,
      paidAmount: null,
      paidBy: null,
      paidByName: null,
      paymentProcessedAt: null
    }
  }
)

// Update existing statuses to new enum
db.memberclaims.updateMany(
  { status: "SUBMITTED" },
  { $set: { status: "UNASSIGNED" } }
)
```

### C. API Rate Limiting

```typescript
// Rate limits by role
const rateLimits = {
  TPA_ADMIN: '1000 requests/hour',
  TPA_USER: '500 requests/hour',
  FINANCE_USER: '500 requests/hour'
}
```

### D. Notification Templates

**Claim Assigned (Email to TPA User):**
```
Subject: New Claim Assigned - CLM-XXXXX

Hi [TPA User Name],

A new claim has been assigned to you:

Claim ID: CLM-XXXXX
Member: [Member Name]
Amount: ₹[Amount]
Submitted: [Date]

Please review and take action within 48 hours.

[View Claim Button]
```

**Documents Required (Email to Member):**
```
Subject: Additional Documents Required - CLM-XXXXX

Hi [Member Name],

Your claim CLM-XXXXX requires additional documents:

Reason: [TPA Reason]

Required Documents:
- [Document 1]
- [Document 2]

Please resubmit with the required documents.

[Resubmit Claim Button]
```

**Payment Completed (Email to Member):**
```
Subject: Payment Completed - CLM-XXXXX

Hi [Member Name],

Great news! Your claim payment has been completed.

Claim ID: CLM-XXXXX
Approved Amount: ₹[Amount]
Paid Amount: ₹[Amount]
Payment Mode: [Mode]
Reference: [Reference Number]
Payment Date: [Date]

The amount will be credited to your registered bank account within 3-5 business days.

[View Claim Details Button]
```

---

**End of Document**

**Version:** 1.0
**Created:** October 3, 2025
**Status:** ✅ Ready for Review & Implementation
**Next Steps:** Approval → Phase 1 Implementation
