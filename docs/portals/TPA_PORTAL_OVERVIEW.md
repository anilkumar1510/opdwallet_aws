# TPA Portal Overview

> **Part of TPA Portal Documentation Suite**
>
> Related Documents:
> - [TPA Workflows](./TPA_WORKFLOWS.md) - Complete workflow processes
> - [TPA Decision Trees](./TPA_DECISION_TREES.md) - Decision logic and trees
> - [TPA Best Practices](./TPA_BEST_PRACTICES.md) - Guidelines and best practices

---

## Table of Contents
1. [Overview](#overview)
2. [Access and Roles](#access-and-roles)
3. [Claim Status Flow](#claim-status-flow)
4. [API Endpoints](#api-endpoints)
5. [Database Integration](#database-integration)
6. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)

---

## Overview

The TPA (Third-Party Administrator) Portal is a specialized interface designed for insurance claim processing and management. TPAs act as intermediaries between healthcare providers, members, and insurance companies to efficiently process and adjudicate insurance claims.

**Portal URL**: `/tpa` ✨ **LIVE** - Dedicated Standalone Portal (v6.4)

**Architecture Update**: The TPA Portal is now a separate, dedicated portal with its own routing, authentication, and layout. Previously nested under `/admin/tpa`, it now operates independently at `/tpa` with enhanced navigation:

- **Dashboard**: `/tpa` - Overview and metrics
- **All Claims**: `/tpa/claims` - Complete claims listing
- **Unassigned Claims**: `/tpa/claims/unassigned` - New dedicated view
- **Assigned Claims**: `/tpa/claims/assigned` - New dedicated view
- **Analytics**: `/tpa/analytics` - Reports and insights
- **Member Management**: `/tpa/users` - User administration

**Primary Functions**:
- Review and process member insurance claims
- Assign claims to TPA users for review
- Approve, reject, or request additional documentation
- Track claim processing metrics and analytics
- Manage workload distribution among TPA users

**Business Value**:
- Streamlines claim processing workflow
- Ensures proper claim adjudication
- Reduces processing time through efficient assignment
- Provides transparency in claim status
- Enables data-driven decision making through analytics

---

## Access and Roles

The TPA Portal operates with a role-based access control (RBAC) system with two distinct roles:

### TPA_ADMIN

**Responsibilities**:
- Assign claims to TPA users
- Reassign claims when necessary
- Monitor workload distribution
- View analytics and performance metrics
- Manage TPA user accounts
- Oversee claim processing operations

**Permissions**:
- Full access to all TPA portal features
- View unassigned claims queue
- Assign/reassign claims to TPA users
- Access analytics dashboard
- View all claims across all TPA users
- Manage team workload balancing

### TPA_USER

**Responsibilities**:
- Review assigned claims
- Approve or reject claims
- Request additional documentation
- Process claims within SLA timeframes
- Update claim status and add review notes

**Permissions**:
- View only assigned claims
- Update claim status
- Approve/reject claims
- Request additional documents
- Add review notes and comments
- No access to assignment functions
- No access to analytics dashboard

---

## Claim Status Flow

### Status Transition Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLAIM LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────┘

    [Member Submits Claim]
              ↓
    ┌──────────────────┐
    │   SUBMITTED      │ ← New claim enters system
    │   UNASSIGNED     │
    └──────────────────┘
              ↓
         [TPA_ADMIN assigns to TPA_USER]
              ↓
    ┌──────────────────┐
    │    ASSIGNED      │ ← Claim assigned to TPA user
    └──────────────────┘
              ↓
         [TPA_USER begins review]
              ↓
    ┌──────────────────┐
    │  UNDER_REVIEW    │ ← Active review in progress
    └──────────────────┘
              ↓
         [Review Complete - Three Paths]
              ↓
    ┌─────────────────────────────────────────────────┐
    │                                                   │
    ↓                       ↓                           ↓
┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│   APPROVED   │   │PARTIALLY_APPROVED│   │ DOCUMENTS_REQUIRED   │
└──────────────┘   └──────────────────┘   └──────────────────────┘
    │                       │                          │
    │                       │                          │
    ↓                       ↓                          ↓
┌──────────────────┐  ┌──────────────────┐   [Member resubmits]
│ PAYMENT_PENDING  │  │ PAYMENT_PENDING  │           │
└──────────────────┘  └──────────────────┘           │
    │                       │                          │
    │                       │                          ↓
    ↓                       ↓                   ┌──────────────┐
┌────────────────────┐ ┌────────────────────┐ │  SUBMITTED   │
│PAYMENT_PROCESSING  │ │PAYMENT_PROCESSING  │ └──────────────┘
└────────────────────┘ └────────────────────┘        │
    │                       │                          │
    │                       │                          └──→ [Back to review cycle]
    ↓                       ↓
┌────────────────────┐ ┌────────────────────┐
│PAYMENT_COMPLETED   │ │PAYMENT_COMPLETED   │
└────────────────────┘ └────────────────────┘


         Alternative Path: Rejection
              ↓
    ┌──────────────────┐
    │    REJECTED      │ ← Claim denied
    └──────────────────┘
              ↓
    [Member can appeal - may return to SUBMITTED]
```

### Status Definitions

| Status | Description | Triggered By | Next Possible Status |
|--------|-------------|--------------|---------------------|
| **SUBMITTED** | Initial claim submission | Member | ASSIGNED |
| **UNASSIGNED** | Awaiting TPA assignment | System | ASSIGNED |
| **ASSIGNED** | Assigned to TPA user | TPA_ADMIN | UNDER_REVIEW |
| **UNDER_REVIEW** | Active review in progress | TPA_USER | APPROVED, PARTIALLY_APPROVED, REJECTED, DOCUMENTS_REQUIRED |
| **DOCUMENTS_REQUIRED** | Additional docs needed | TPA_USER | SUBMITTED (on resubmission) |
| **APPROVED** | Full amount approved | TPA_USER | PAYMENT_PENDING (automatic) |
| **PARTIALLY_APPROVED** | Partial amount approved | TPA_USER | PAYMENT_PENDING (automatic) |
| **REJECTED** | Claim denied | TPA_USER | Terminal (or SUBMITTED on appeal) |
| **CANCELLED** | Claim cancelled | Member/Admin | Terminal |
| **RESUBMISSION_REQUIRED** | Requires resubmission | TPA_USER | SUBMITTED (on resubmission) |
| **PAYMENT_PENDING** | Awaiting payment processing | System (auto on approval) | PAYMENT_PROCESSING |
| **PAYMENT_PROCESSING** | Payment in progress | Finance Team | PAYMENT_COMPLETED |
| **PAYMENT_COMPLETED** | Payment disbursed | Finance Team | Terminal |

### Status Rules

**Business Rules**:
1. Only TPA_ADMIN can move claims from UNASSIGNED to ASSIGNED
2. Only TPA_USER can move claims from UNDER_REVIEW to final decision
3. DOCUMENTS_REQUIRED claims return to SUBMITTED on resubmission
4. Resubmitted claims should be reassigned to same TPA user when possible
5. Payment statuses (PAYMENT_*) are managed by finance team
6. REJECTED and PAYMENT_COMPLETED are terminal statuses
7. Status changes must be logged with timestamp and user

**Validation Rules**:
- Cannot skip status steps (e.g., SUBMITTED cannot go directly to APPROVED)
- Cannot reverse certain statuses (e.g., PAYMENT_COMPLETED cannot revert)
- Status changes require appropriate role permissions
- All status changes must include reason/notes

---

## API Endpoints

### Complete API Reference (12 Endpoints)

#### 1. Get All Claims (Filtered by Role)

```
GET /api/tpa/claims
```

**Authorization**: TPA_ADMIN, TPA_USER

**Query Parameters**:
- `status`: Filter by claim status
- `assignedTo`: Filter by assigned user ID (TPA_ADMIN only)
- `startDate`: Filter by submission date (from)
- `endDate`: Filter by submission date (to)
- `minAmount`: Filter by minimum claim amount
- `maxAmount`: Filter by maximum claim amount
- `page`: Pagination page number
- `limit`: Results per page

**Response**:
```json
{
  "success": true,
  "data": {
    "claims": [
      {
        "claimId": "CLM-2024-001234",
        "memberId": "MEM-001",
        "memberName": "John Doe",
        "claimAmount": 5000,
        "approvedAmount": 4500,
        "status": "UNDER_REVIEW",
        "assignedTo": "USR-TPA-001",
        "assignedToName": "Jane Smith",
        "submittedAt": "2024-01-15T10:30:00Z",
        "assignedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

**Role-Based Filtering**:
- **TPA_ADMIN**: Returns all claims
- **TPA_USER**: Returns only claims assigned to requesting user

---

#### 2. Get Unassigned Claims (TPA_ADMIN Only)

```
GET /api/tpa/claims/unassigned
```

**Authorization**: TPA_ADMIN only

**Query Parameters**:
- `sortBy`: Sort criteria (submittedAt, claimAmount, priority)
- `order`: Sort order (asc, desc)
- `page`: Pagination page number
- `limit`: Results per page

**Response**:
```json
{
  "success": true,
  "data": {
    "unassignedClaims": [
      {
        "claimId": "CLM-2024-001235",
        "memberId": "MEM-002",
        "memberName": "Alice Johnson",
        "claimAmount": 7500,
        "submittedAt": "2024-01-16T09:15:00Z",
        "priority": "HIGH",
        "claimType": "HOSPITALIZATION"
      }
    ],
    "count": 45
  }
}
```

---

#### 3. Get Claim Details

```
GET /api/tpa/claims/:claimId
```

**Authorization**: TPA_ADMIN, TPA_USER (must be assigned to claim)

**Response**:
```json
{
  "success": true,
  "data": {
    "claim": {
      "claimId": "CLM-2024-001234",
      "memberId": "MEM-001",
      "memberName": "John Doe",
      "policyNumber": "POL-2024-12345",
      "claimAmount": 5000,
      "approvedAmount": 4500,
      "status": "UNDER_REVIEW",
      "assignedTo": "USR-TPA-001",
      "assignedToName": "Jane Smith",
      "assignedBy": "USR-ADMIN-001",
      "assignedAt": "2024-01-15T11:00:00Z",
      "submittedAt": "2024-01-15T10:30:00Z",
      "serviceDate": "2024-01-10",
      "providerName": "City Hospital",
      "diagnosisCodes": ["A09", "R51"],
      "documents": [
        {
          "documentId": "DOC-001",
          "documentType": "HOSPITAL_BILL",
          "fileName": "bill.pdf",
          "uploadedAt": "2024-01-15T10:30:00Z"
        }
      ],
      "reviewHistory": [
        {
          "action": "ASSIGNED",
          "performedBy": "USR-ADMIN-001",
          "performedByName": "Admin User",
          "timestamp": "2024-01-15T11:00:00Z",
          "notes": "Assigned to Jane for review"
        }
      ]
    }
  }
}
```

---

#### 4. Assign Claim (TPA_ADMIN Only)

```
POST /api/tpa/claims/:claimId/assign
```

**Authorization**: TPA_ADMIN only

**Request Body**:
```json
{
  "assignedTo": "507f1f77bcf86cd799439011",
  "notes": "Assigning to specialist for high-value claim review"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Claim assigned successfully",
  "data": {
    "claimId": "CLM-2024-001235",
    "assignedTo": "USR-TPA-001",
    "assignedToName": "Jane Smith",
    "assignedBy": "USR-ADMIN-001",
    "assignedAt": "2024-01-16T10:00:00Z",
    "status": "ASSIGNED"
  }
}
```

---

#### 5. Reassign Claim (TPA_ADMIN Only)

```
POST /api/tpa/claims/:claimId/reassign
```

**Authorization**: TPA_ADMIN only

**Request Body**:
```json
{
  "assignedTo": "507f1f77bcf86cd799439012",
  "reason": "Original assignee on medical leave"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Claim reassigned successfully",
  "data": {
    "claimId": "CLM-2024-001235",
    "previousAssignee": "USR-TPA-001",
    "newAssignee": "USR-TPA-002",
    "newAssigneeName": "Bob Wilson",
    "reassignedBy": "USR-ADMIN-001",
    "reassignedAt": "2024-01-16T14:00:00Z",
    "reassignmentReason": "Original assignee on medical leave"
  }
}
```

---

#### 6. Update Claim Status

```
PATCH /api/tpa/claims/:claimId/status
```

**Authorization**: TPA_USER (assigned to claim), TPA_ADMIN

**Request Body**:
```json
{
  "status": "UNDER_REVIEW",
  "notes": "Started review process, verifying documents"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Claim status updated successfully",
  "data": {
    "claimId": "CLM-2024-001235",
    "previousStatus": "ASSIGNED",
    "newStatus": "UNDER_REVIEW",
    "updatedBy": "USR-TPA-002",
    "updatedAt": "2024-01-16T15:00:00Z"
  }
}
```

---

#### 7. Approve Claim

```
POST /api/tpa/claims/:claimId/approve
```

**Authorization**: TPA_USER (assigned to claim), TPA_ADMIN

**Request Body**:
```json
{
  "approvedAmount": 4500,
  "approvalReason": "Treatment covered, but room rent exceeds policy limit. Applied room rent sublimit of Rs. 2000/day.",
  "isPartial": true,
  "notes": "Room charges: ₹2000/day approved (claimed ₹3000/day). Doctor consultation: ₹2000 fully approved."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Claim approved successfully",
  "data": {
    "claimId": "CLM-2024-001235",
    "status": "PARTIALLY_APPROVED",
    "claimedAmount": 5000,
    "approvedAmount": 4500,
    "approvedBy": "USR-TPA-002",
    "approvedByName": "Bob Wilson",
    "approvedAt": "2024-01-16T16:00:00Z",
    "approvalReason": "Treatment covered, but room rent exceeds policy limit. Applied room rent sublimit of Rs. 2000/day."
  }
}
```

---

#### 8. Reject Claim

```
POST /api/tpa/claims/:claimId/reject
```

**Authorization**: TPA_USER (assigned to claim), TPA_ADMIN

**Request Body**:
```json
{
  "rejectionReason": "Pre-authorization not obtained for planned hospitalization. Policy requires 48-hour advance intimation for planned procedures.",
  "notes": "Reviewed policy clause 4.2 - Pre-Authorization Requirements. Member can appeal within 30 days."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Claim rejected",
  "data": {
    "claimId": "CLM-2024-001235",
    "status": "REJECTED",
    "rejectedBy": "USR-TPA-002",
    "rejectedByName": "Bob Wilson",
    "rejectedAt": "2024-01-16T16:30:00Z",
    "rejectionReason": "Pre-authorization not obtained for planned hospitalization. Policy requires 48-hour advance intimation for planned procedures."
  }
}
```

---

#### 9. Request Additional Documents

```
POST /api/tpa/claims/:claimId/request-documents
```

**Authorization**: TPA_USER (assigned to claim), TPA_ADMIN

**Request Body**:
```json
{
  "documentsRequiredReason": "Original bill does not show detailed charges and discharge summary is needed to verify medical necessity",
  "requiredDocuments": [
    "Itemized hospital bill with service-wise breakdown",
    "Complete discharge summary with diagnosis and treatment details",
    "Original prescription from treating doctor"
  ],
  "notes": "Please submit all documents in PDF format within 7 days. Ensure bills are clear and legible."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Document request sent to member",
  "data": {
    "claimId": "CLM-2024-001235",
    "status": "DOCUMENTS_REQUIRED",
    "documentsRequired": true,
    "documentsRequiredReason": "Original bill does not show detailed charges and discharge summary is needed to verify medical necessity",
    "requiredDocuments": [
      "Itemized hospital bill with service-wise breakdown",
      "Complete discharge summary with diagnosis and treatment details",
      "Original prescription from treating doctor"
    ],
    "requestedBy": "USR-TPA-002",
    "requestedByName": "Bob Wilson",
    "requestedAt": "2024-01-16T17:00:00Z"
  }
}
```

---

#### 10. Get Analytics Summary (TPA_ADMIN Only)

```
GET /api/tpa/analytics/summary
```

**Authorization**: TPA_ADMIN only

**Query Parameters**:
- `startDate`: Analytics period start date
- `endDate`: Analytics period end date
- `groupBy`: Grouping criteria (day, week, month)

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "claimsStatistics": {
      "totalReceived": 450,
      "totalProcessed": 380,
      "pendingAssignment": 25,
      "underReview": 45,
      "completed": 380
    },
    "processingMetrics": {
      "averageProcessingTime": "2.5 days",
      "slaComplianceRate": "94%",
      "firstPassApprovalRate": "78%"
    },
    "approvalMetrics": {
      "totalClaimedAmount": 2250000,
      "totalApprovedAmount": 1950000,
      "approvalRate": "86.7%",
      "averageApprovedAmount": 5132
    },
    "statusDistribution": {
      "APPROVED": 280,
      "PARTIALLY_APPROVED": 65,
      "REJECTED": 35,
      "DOCUMENTS_REQUIRED": 45,
      "UNDER_REVIEW": 25
    },
    "userWorkload": {
      "totalActiveUsers": 8,
      "averageClaimsPerUser": 56,
      "topPerformer": {
        "userId": "USR-TPA-001",
        "name": "Jane Smith",
        "claimsCompleted": 95
      }
    }
  }
}
```

---

#### 11. Get TPA Users Workload (TPA_ADMIN Only)

```
GET /api/tpa/users
```

**Authorization**: TPA_ADMIN only

**Query Parameters**:
- `sortBy`: Sort criteria (name, workload, completionRate)
- `order`: Sort order (asc, desc)

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "USR-TPA-001",
        "name": "Jane Smith",
        "email": "jane.smith@tpa.com",
        "currentWorkload": {
          "assignedClaims": 12,
          "underReview": 8,
          "awaitingAction": 4
        },
        "performance": {
          "claimsCompletedThisMonth": 45,
          "averageResolutionTime": "2.1 days",
          "approvalRate": "88%",
          "slaComplianceRate": "96%"
        },
        "capacityStatus": "MODERATE"
      },
      {
        "userId": "USR-TPA-002",
        "name": "Bob Wilson",
        "email": "bob.wilson@tpa.com",
        "currentWorkload": {
          "assignedClaims": 18,
          "underReview": 12,
          "awaitingAction": 6
        },
        "performance": {
          "claimsCompletedThisMonth": 38,
          "averageResolutionTime": "3.2 days",
          "approvalRate": "82%",
          "slaComplianceRate": "91%"
        },
        "capacityStatus": "HIGH"
      }
    ],
    "totalUsers": 8
  }
}
```

---

#### 12. Get Recent Activity

```
GET /api/tpa/recent-activity
```

**Authorization**: TPA_ADMIN, TPA_USER

**Query Parameters**:
- `limit`: Number of activity entries to return (default: 10)

**Description**: Retrieves recent claim status changes and activities across all claims, providing a real-time activity feed for the TPA dashboard.

**Response**:
```json
{
  "success": true,
  "message": "Recent activity retrieved successfully",
  "data": {
    "activities": [
      {
        "id": "507f1f77bcf86cd799439011-2024-01-16T15:30:00Z",
        "claimId": "CLM-2024-001234",
        "action": "Claim approved",
        "actor": "Jane Smith",
        "actorRole": "TPA_USER",
        "timestamp": "2024-01-16T15:30:00Z",
        "status": "APPROVED"
      },
      {
        "id": "507f1f77bcf86cd799439012-2024-01-16T14:20:00Z",
        "claimId": "CLM-2024-001235",
        "action": "Documents requested",
        "actor": "Bob Wilson",
        "actorRole": "TPA_USER",
        "timestamp": "2024-01-16T14:20:00Z",
        "status": "DOCUMENTS_REQUIRED"
      },
      {
        "id": "507f1f77bcf86cd799439013-2024-01-16T13:10:00Z",
        "claimId": "CLM-2024-001236",
        "action": "Claim assigned",
        "actor": "Admin User",
        "actorRole": "TPA_ADMIN",
        "timestamp": "2024-01-16T13:10:00Z",
        "status": "ASSIGNED"
      }
    ],
    "total": 3
  }
}
```

**Use Cases**:
- Dashboard activity feed
- Real-time monitoring of claim processing
- Audit trail visibility
- Team activity overview
- Quick status change tracking

---

## Database Integration

### Collection: `memberclaims`

The TPA portal integrates with the `memberclaims` collection in MongoDB, extending it with TPA-specific fields.

#### TPA-Specific Fields

##### Assignment Fields

```javascript
{
  // Assignment Information
  assignedTo: {
    type: String,
    description: "User ID of TPA user assigned to review claim"
  },
  assignedToName: {
    type: String,
    description: "Full name of assigned TPA user for display"
  },
  assignedBy: {
    type: String,
    description: "User ID of TPA admin who assigned the claim"
  },
  assignedAt: {
    type: Date,
    description: "Timestamp when claim was assigned"
  }
}
```

##### Reassignment History

```javascript
{
  reassignmentHistory: [
    {
      previousAssignee: {
        type: String,
        description: "User ID of previous TPA user"
      },
      previousAssigneeName: {
        type: String,
        description: "Name of previous assignee"
      },
      newAssignee: {
        type: String,
        description: "User ID of new TPA user"
      },
      newAssigneeName: {
        type: String,
        description: "Name of new assignee"
      },
      reassignedBy: {
        type: String,
        description: "User ID of admin who performed reassignment"
      },
      reassignedByName: {
        type: String,
        description: "Name of admin who reassigned"
      },
      reason: {
        type: String,
        description: "Reason for reassignment"
      },
      reassignedAt: {
        type: Date,
        description: "Timestamp of reassignment"
      }
    }
  ]
}
```

##### Review Information

```javascript
{
  // Review Details
  reviewedByUser: {
    type: String,
    description: "User ID of TPA user who reviewed the claim"
  },
  reviewedByName: {
    type: String,
    description: "Full name of reviewing TPA user"
  },
  reviewNotes: {
    type: String,
    description: "Current review notes and comments"
  },
  reviewStartedAt: {
    type: Date,
    description: "When review process began"
  },
  reviewCompletedAt: {
    type: Date,
    description: "When review was completed"
  }
}
```

##### Review History

```javascript
{
  reviewHistory: [
    {
      action: {
        type: String,
        enum: ['ASSIGNED', 'REVIEW_STARTED', 'STATUS_UPDATED', 'DOCUMENTS_REQUESTED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'],
        description: "Type of action performed"
      },
      performedBy: {
        type: String,
        description: "User ID of person who performed action"
      },
      performedByName: {
        type: String,
        description: "Name of person who performed action"
      },
      performedByRole: {
        type: String,
        enum: ['TPA_ADMIN', 'TPA_USER'],
        description: "Role of person who performed action"
      },
      previousStatus: {
        type: String,
        description: "Claim status before action"
      },
      newStatus: {
        type: String,
        description: "Claim status after action"
      },
      notes: {
        type: String,
        description: "Notes or comments about the action"
      },
      timestamp: {
        type: Date,
        description: "When action was performed"
      },
      metadata: {
        type: Object,
        description: "Additional action-specific data"
      }
    }
  ]
}
```

##### Document Request Fields

```javascript
{
  documentsRequired: {
    type: Boolean,
    default: false,
    description: "Flag indicating if additional documents are required"
  },
  documentsRequiredReason: {
    type: String,
    description: "Reason why additional documents are required"
  },
  documentsRequiredAt: {
    type: Date,
    description: "When documents were requested"
  },
  documentsRequiredBy: {
    type: Types.ObjectId,
    ref: 'User',
    description: "User ID of TPA user who requested documents"
  },
  requiredDocumentsList: {
    type: [String],
    description: "Array of required document descriptions (simple strings)"
  }
}
```

##### Approval Fields

```javascript
{
  approvalReason: {
    type: String,
    description: "Detailed reason for approval or partial approval"
  },
  approvedBy: {
    type: Types.ObjectId,
    ref: 'User',
    description: "User ID of TPA user who approved"
  },
  approvedByName: {
    type: String,
    description: "Name of approving TPA user"
  },
  approvedAt: {
    type: Date,
    description: "Timestamp of approval"
  },
  approvedAmount: {
    type: Number,
    description: "Approved amount (can be full or partial)"
  }
}
```

**Note**: Approval type (full vs partial) is determined by comparing `approvedAmount` with `billAmount`. When a claim is approved, the status automatically transitions to `PAYMENT_PENDING`.

##### Rejection Fields

```javascript
{
  rejectionReason: {
    type: String,
    description: "Detailed reason for claim rejection"
  },
  rejectedBy: {
    type: Types.ObjectId,
    ref: 'User',
    description: "User ID of TPA user who rejected"
  },
  rejectedByName: {
    type: String,
    description: "Name of rejecting TPA user"
  },
  rejectedAt: {
    type: Date,
    description: "Timestamp of rejection"
  },
  rejectedAmount: {
    type: Number,
    description: "Amount that was rejected"
  }
}
```

**Note**: Additional details such as policy clause references and appeal information can be included in the `rejectionReason` or in the optional `notes` field of the RejectClaimDto.

### Database Indexes

**Recommended Indexes for TPA Operations**:

```javascript
// Index for assigned claims lookup
db.memberclaims.createIndex({ assignedTo: 1, status: 1 });

// Index for unassigned claims queue
db.memberclaims.createIndex({ status: 1, submittedAt: -1 });

// Index for claim status and assignment
db.memberclaims.createIndex({ status: 1, assignedAt: 1 });

// Index for analytics queries
db.memberclaims.createIndex({ assignedAt: 1, reviewCompletedAt: 1 });

// Index for workload queries
db.memberclaims.createIndex({ assignedTo: 1, reviewCompletedAt: 1 });
```

---

## Data Transfer Objects (DTOs)

### 1. AssignClaimDto

```typescript
class AssignClaimDto {
  @IsMongoId()
  assignedTo: string; // User ID of TPA user

  @IsOptional()
  @IsString()
  notes?: string; // Optional notes about assignment
}
```

**Validation Rules**:
- `assignedTo` must be valid MongoDB ObjectId
- `assignedTo` must be valid TPA_USER role user ID
- `assignedTo` cannot be the same as current assignee
- User must have active status

---

### 2. ReassignClaimDto

```typescript
class ReassignClaimDto {
  @IsMongoId()
  assignedTo: string; // User ID of new TPA user

  @IsString()
  reason: string; // Reason for reassignment
}
```

**Validation Rules**:
- `assignedTo` must be valid MongoDB ObjectId
- `assignedTo` must be different from current assignee
- `assignedTo` must be valid TPA_USER
- `reason` is mandatory

---

### 3. UpdateStatusDto

```typescript
class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'])
  status: string; // New claim status

  @IsString()
  @IsNotEmpty()
  notes: string; // Mandatory notes for status change

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>; // Additional status-specific data
}
```

**Validation Rules**:
- Status must be valid enum value
- Status transition must follow business rules
- `notes` min length: 10 characters, max: 1000 characters
- User must have permission for status change

---

### 4. ApproveClaimDto

```typescript
class ApproveClaimDto {
  @IsNumber()
  @Min(0)
  approvedAmount: number; // Approved amount for the claim

  @IsString()
  approvalReason: string; // Reason for approval or partial approval

  @IsBoolean()
  isPartial: boolean; // Whether this is a partial approval

  @IsOptional()
  @IsString()
  notes?: string; // Optional internal notes
}
```

**Validation Rules**:
- `approvedAmount` cannot exceed `claimedAmount`
- `approvedAmount` must be greater than or equal to 0
- `approvalReason` is mandatory
- When approved, claim automatically transitions to `PAYMENT_PENDING` status

---

### 5. RejectClaimDto

```typescript
class RejectClaimDto {
  @IsString()
  rejectionReason: string; // Reason for rejection

  @IsOptional()
  @IsString()
  notes?: string; // Optional internal notes
}
```

**Validation Rules**:
- `rejectionReason` is mandatory
- Clear explanation required for member understanding

---

### 6. RequestDocumentsDto

```typescript
class RequestDocumentsDto {
  @IsString()
  documentsRequiredReason: string; // Reason why additional documents are required

  @IsArray()
  @IsString({ each: true })
  requiredDocuments: string[]; // List of required documents

  @IsOptional()
  @IsString()
  notes?: string; // Optional internal notes
}
```

**Validation Rules**:
- `documentsRequiredReason` is mandatory
- `requiredDocuments` must be an array of strings
- At least one document should be specified in the array

**Common Document Types** (examples for the string array):
- `'Original Invoice'`
- `'Prescription Copy'`
- `'Lab Report'`
- `'Discharge Summary'`
- `'Doctor's Consultation Notes'`
- `'X-ray/CT Scan Reports'`
- `'Pharmacy Bills'`
- `'Referral Letter'`

---

## Glossary

**TPA (Third-Party Administrator)**: Independent organization that processes insurance claims on behalf of insurance companies.

**Pre-authorization**: Advance approval required for certain planned procedures or high-value treatments.

**Copay**: Fixed percentage or amount paid by the insured member for covered services.

**Deductible**: Amount the insured must pay before insurance coverage begins.

**Sublimit**: Maximum amount payable for specific services within the overall policy limit.

**Medical Necessity**: Services or supplies that are appropriate and necessary for the diagnosis or treatment of a medical condition.

**Fee Schedule**: Predetermined list of charges for specific medical services.

**Network Provider**: Healthcare providers who have agreements with the insurance company.

**Claim Adjudication**: The process of reviewing and evaluating a claim to determine payment.

**SLA (Service Level Agreement)**: Agreed-upon performance standards for claim processing.

---

## Contact and Support

**For TPA Users**:
- Technical Support: tpa-support@opdwallet.com
- Medical Queries: medical-team@opdwallet.com
- Policy Questions: policy-help@opdwallet.com

**For TPA Admins**:
- Operations Support: tpa-ops@opdwallet.com
- System Issues: it-support@opdwallet.com

**Emergency Escalation**:
- 24/7 Hotline: 1800-XXX-XXXX
- Emergency Email: urgent@opdwallet.com

---

**Document Version**: 1.0
**Last Updated**: 2025-10-05
**Next Review**: 2025-11-05

---
