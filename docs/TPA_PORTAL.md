# TPA Portal Documentation

## Table of Contents
1. [Overview](#overview)
2. [Access and Roles](#access-and-roles)
3. [Claim Assignment Workflow](#claim-assignment-workflow)
4. [Claim Review Workflow](#claim-review-workflow)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Claim Status Flow](#claim-status-flow)
7. [API Endpoints](#api-endpoints)
8. [Database Integration](#database-integration)
9. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
10. [Workflow Diagrams](#workflow-diagrams)
11. [Decision Trees](#decision-trees)
12. [SLAs and Performance Metrics](#slas-and-performance-metrics)
13. [Best Practices](#best-practices)

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

## Claim Assignment Workflow

### Overview
The claim assignment workflow ensures efficient distribution of claims to TPA users for review and processing.

### Process Flow

#### 1. View Unassigned Claims Queue (TPA_ADMIN only)

**Endpoint**: `GET /api/tpa/claims/unassigned`

The unassigned claims queue displays all claims with status `SUBMITTED` or `UNASSIGNED` that require TPA review.

**Queue Features**:
- Filter by claim type, amount, submission date
- Sort by priority, age, claim amount
- Bulk selection for mass assignment
- Member information preview
- Claim details quick view

#### 2. Assign Claims to TPA Users

**Endpoint**: `POST /api/tpa/claims/:claimId/assign`

**Assignment Criteria**:
- Current workload of TPA users
- Specialization or expertise area
- Historical performance metrics
- Geographic region (if applicable)
- Claim complexity level

**Assignment Process**:
1. Select claim(s) from unassigned queue
2. Choose TPA user from available list
3. Add optional assignment notes
4. Confirm assignment
5. System updates claim status to `ASSIGNED`
6. TPA user receives notification

**Data Captured**:
- `assignedTo`: User ID of assigned TPA user
- `assignedToName`: Full name of assigned TPA user
- `assignedBy`: User ID of TPA admin who assigned
- `assignedAt`: Timestamp of assignment

#### 3. Reassign Claims

**Endpoint**: `POST /api/tpa/claims/:claimId/reassign`

**Reassignment Scenarios**:
- TPA user unavailable (sick leave, vacation)
- Workload rebalancing
- Specialized expertise required
- Performance issues
- Conflict of interest

**Reassignment Process**:
1. Select assigned claim
2. Provide reassignment reason
3. Choose new TPA user
4. Add reassignment notes
5. Confirm reassignment
6. System logs reassignment history
7. Both old and new users receive notifications

**History Tracking**:
- All reassignments stored in `reassignmentHistory[]` array
- Each entry includes:
  - Previous assignee
  - New assignee
  - Reassignment reason
  - Reassigned by (admin)
  - Timestamp

#### 4. Workload Balancing

**Endpoint**: `GET /api/tpa/users`

**Balancing Strategy**:
- Real-time view of each TPA user's workload
- Active claims count per user
- Average processing time per user
- Claims by status distribution
- Suggested assignments based on capacity

**Workload Metrics**:
- Total assigned claims
- Claims under review
- Claims completed (last 7/30 days)
- Average resolution time
- Current capacity status (Available/Moderate/High/Overloaded)

---

## Claim Review Workflow

### Overview
The claim review workflow guides TPA users through the process of evaluating and adjudicating insurance claims.

### Process Flow

#### 1. Review Claim Details

**Endpoint**: `GET /api/tpa/claims/:claimId`

**Information Available**:
- **Member Information**: Name, policy number, coverage details
- **Provider Information**: Hospital/clinic name, provider ID
- **Claim Details**: Service date, diagnosis codes, treatment details
- **Financial Information**: Claimed amount, eligible amount, copay/deductible
- **Supporting Documents**: Bills, prescriptions, diagnostic reports

**Review Checklist**:
- [ ] Verify member eligibility and active coverage
- [ ] Confirm service date within policy period
- [ ] Validate provider network status
- [ ] Check diagnosis codes and medical necessity
- [ ] Review claimed amounts against fee schedules
- [ ] Verify all required documents are present
- [ ] Ensure no duplicate claims exist
- [ ] Check policy exclusions and limitations

#### 2. View Uploaded Documents

**Document Types**:
- Hospital/clinic bills
- Prescription receipts
- Diagnostic test reports
- Doctor consultation notes
- Discharge summaries
- Referral letters
- Pre-authorization documents

**Document Verification**:
- Check document authenticity
- Verify dates match claim submission
- Ensure amounts are consistent
- Validate provider signatures/stamps
- Cross-reference with claim details

#### 3. Update Claim Status

**Endpoint**: `PATCH /api/tpa/claims/:claimId/status`

**Available Status Updates**:
- `UNDER_REVIEW`: Mark claim as actively being reviewed
- `DOCUMENTS_REQUIRED`: Need additional documentation
- `APPROVED`: Claim approved for payment
- `PARTIALLY_APPROVED`: Partial amount approved
- `REJECTED`: Claim denied

#### 4. Three Claim Outcomes

##### A. Approve Claim (Full or Partial)

**Endpoint**: `POST /api/tpa/claims/:claimId/approve`

**Approval Types**:

**Full Approval**:
- Entire claimed amount is approved
- All services deemed medically necessary
- All documents verified
- Within policy coverage limits

**Partial Approval**:
- Some services not covered
- Amount exceeds fee schedule
- Copay/deductible adjustments
- Policy sublimits applied

**Required Information**:
- Approved amount
- Approval reason/notes
- Line-item breakdown (if partial)
- Benefit calculation details
- Payment authorization

**Data Captured**:
- `approvedBy`: User ID of approving TPA user
- `approvedByName`: Full name of approving user
- `approvedAt`: Timestamp of approval
- `approvalReason`: Detailed approval notes
- `approvedAmount`: Final approved amount

**Next Steps**:
- Claim moves to `PAYMENT_PENDING` status
- Finance team notified for payment processing
- Member receives approval notification
- Provider receives payment notification (if applicable)

##### B. Reject Claim

**Endpoint**: `POST /api/tpa/claims/:claimId/reject`

**Common Rejection Reasons**:
- Policy expired or inactive at service date
- Service not covered under policy
- Pre-authorization not obtained
- Provider not in network (for network policies)
- Claim submitted beyond filing limit
- Duplicate claim
- Medical necessity not established
- Fraudulent claim

**Required Information**:
- Rejection reason code
- Detailed rejection explanation
- Policy clause reference
- Alternative options (if any)
- Appeal process information

**Data Captured**:
- `rejectedBy`: User ID of rejecting TPA user
- `rejectedByName`: Full name of rejecting user
- `rejectedAt`: Timestamp of rejection
- `rejectionReason`: Detailed rejection notes
- `rejectionCode`: Standard rejection code

**Communication**:
- Member receives rejection notification with reason
- Clear explanation of rejection basis
- Information on appeal process
- Next steps and alternative options

##### C. Request Additional Documents

**Endpoint**: `POST /api/tpa/claims/:claimId/request-documents`

**Document Request Scenarios**:
- Missing mandatory documents
- Unclear or illegible documents
- Incomplete information
- Need for additional medical evidence
- Supporting documents for high-value claims

**Required Information**:
- List of specific documents needed
- Reason for each document request
- Deadline for submission
- Format requirements
- Submission instructions

**Data Captured**:
- `documentsRequired`: Boolean flag
- `requiredDocumentsList[]`: Array of required documents with:
  - Document type
  - Document description
  - Reason for request
  - Mandatory/optional flag
  - Submission deadline

**Process**:
1. TPA user identifies missing/insufficient documents
2. Creates detailed document request list
3. Sets submission deadline (typically 7-15 days)
4. Submits request
5. Claim status changes to `DOCUMENTS_REQUIRED`
6. Member receives notification with document list
7. Member resubmits with additional documents
8. Claim returns to `SUBMITTED` status
9. Reassigned to same TPA user (preferred) or queue

**Review History**:
All review actions stored in `reviewHistory[]`:
- Action taken (approved/rejected/documents requested)
- Review notes
- Reviewed by user
- Timestamp
- Previous and new status

---

## Analytics Dashboard

**Access**: TPA_ADMIN role only

**Endpoint**: `GET /api/tpa/analytics/summary`

### Key Metrics

#### 1. Claims Statistics

**Volume Metrics**:
- Total claims received (daily/weekly/monthly)
- Claims processed (daily/weekly/monthly)
- Claims pending assignment
- Claims under review
- Claims completed

**Trend Analysis**:
- Claims volume trends over time
- Peak submission periods
- Seasonal patterns
- Growth rate

#### 2. Processing Metrics

**Efficiency Indicators**:
- Average claim processing time
- Processing time by claim type
- Processing time by TPA user
- SLA compliance rate
- First-pass approval rate

**Status Distribution**:
- Claims by status (pie chart)
- Status transition timeline
- Bottleneck identification
- Aging analysis (claims by age brackets)

#### 3. TPA User Workload

**Individual Performance**:
- Claims assigned per user
- Claims completed per user
- Average resolution time per user
- Approval/rejection ratio per user
- Document request frequency per user

**Team Overview**:
- Total active TPA users
- Current workload distribution (bar chart)
- Capacity utilization
- Productivity rankings
- Performance trends

#### 4. Approval Rates

**Financial Metrics**:
- Total claimed amount
- Total approved amount
- Total rejected amount
- Average approved amount per claim
- Approval rate percentage

**Decision Analysis**:
- Approval rate by claim type
- Rejection reasons breakdown
- Partial approval frequency
- Document request rate
- Appeal success rate

**Quality Metrics**:
- Claim accuracy rate
- Rework percentage
- Fraud detection rate
- Member satisfaction scores

### Dashboard Features

**Filters**:
- Date range selector
- Claim type filter
- TPA user filter
- Status filter
- Amount range filter

**Visualizations**:
- Interactive charts and graphs
- Real-time data updates
- Export to PDF/Excel
- Customizable widgets
- Drill-down capabilities

**Alerts and Notifications**:
- SLA breach warnings
- High-value claim alerts
- Unusual pattern detection
- Workload imbalance notifications
- Performance anomalies

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
| **APPROVED** | Full amount approved | TPA_USER | PAYMENT_PENDING |
| **PARTIALLY_APPROVED** | Partial amount approved | TPA_USER | PAYMENT_PENDING |
| **REJECTED** | Claim denied | TPA_USER | Terminal (or SUBMITTED on appeal) |
| **PAYMENT_PENDING** | Awaiting payment processing | System | PAYMENT_PROCESSING |
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

### Complete API Reference (11 Endpoints)

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
  "assignedTo": "USR-TPA-001",
  "assignmentNotes": "Assigning to specialist for high-value claim review"
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
  "newAssignee": "USR-TPA-002",
  "reassignmentReason": "Original assignee on medical leave",
  "reassignmentNotes": "Urgent claim, reassigning to available user"
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
  "approvalType": "PARTIAL",
  "approvedAmount": 4500,
  "approvalReason": "Treatment covered, but room rent exceeds policy limit. Applied room rent sublimit of Rs. 2000/day.",
  "lineItemBreakdown": [
    {
      "service": "Room Charges",
      "claimedAmount": 3000,
      "approvedAmount": 2000,
      "reason": "Policy sublimit: Rs. 2000/day"
    },
    {
      "service": "Doctor Consultation",
      "claimedAmount": 2000,
      "approvedAmount": 2000,
      "reason": "Fully covered"
    }
  ]
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
  "rejectionCode": "PRE_AUTH_NOT_OBTAINED",
  "rejectionReason": "Pre-authorization not obtained for planned hospitalization as per policy clause 4.2. Policy requires 48-hour advance intimation for planned procedures.",
  "policyClauseReference": "Section 4.2 - Pre-Authorization Requirements",
  "appealInformation": "Member can appeal within 30 days with valid justification"
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
    "rejectionCode": "PRE_AUTH_NOT_OBTAINED",
    "rejectionReason": "Pre-authorization not obtained for planned hospitalization as per policy clause 4.2. Policy requires 48-hour advance intimation for planned procedures."
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
  "requiredDocumentsList": [
    {
      "documentType": "DETAILED_BILL",
      "description": "Itemized hospital bill with service-wise breakdown",
      "reason": "Original bill does not show detailed charges",
      "mandatory": true
    },
    {
      "documentType": "DISCHARGE_SUMMARY",
      "description": "Complete discharge summary with diagnosis and treatment details",
      "reason": "Required to verify medical necessity",
      "mandatory": true
    },
    {
      "documentType": "PRESCRIPTION",
      "description": "Original prescription from treating doctor",
      "reason": "To verify prescribed medications",
      "mandatory": false
    }
  ],
  "submissionDeadline": "2024-01-30T23:59:59Z",
  "requestNotes": "Please submit all documents in PDF format. Ensure bills are clear and legible."
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
    "requiredDocumentsCount": 3,
    "submissionDeadline": "2024-01-30T23:59:59Z",
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
      reassignmentReason: {
        type: String,
        description: "Reason for reassignment"
      },
      reassignmentNotes: {
        type: String,
        description: "Additional notes about reassignment"
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
  requiredDocumentsList: [
    {
      documentType: {
        type: String,
        description: "Type of document required"
      },
      description: {
        type: String,
        description: "Detailed description of required document"
      },
      reason: {
        type: String,
        description: "Why this document is required"
      },
      mandatory: {
        type: Boolean,
        description: "Whether document is mandatory"
      },
      received: {
        type: Boolean,
        default: false,
        description: "Whether document has been received"
      },
      receivedAt: {
        type: Date,
        description: "When document was received"
      }
    }
  ],
  documentRequestDate: {
    type: Date,
    description: "When documents were requested"
  },
  documentSubmissionDeadline: {
    type: Date,
    description: "Deadline for document submission"
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
    type: String,
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
  approvalType: {
    type: String,
    enum: ['FULL', 'PARTIAL'],
    description: "Type of approval"
  },
  lineItemBreakdown: [
    {
      service: {
        type: String,
        description: "Service or treatment description"
      },
      claimedAmount: {
        type: Number,
        description: "Amount claimed for this service"
      },
      approvedAmount: {
        type: Number,
        description: "Amount approved for this service"
      },
      reason: {
        type: String,
        description: "Reason for approval or adjustment"
      }
    }
  ]
}
```

##### Rejection Fields

```javascript
{
  rejectionReason: {
    type: String,
    description: "Detailed reason for claim rejection"
  },
  rejectionCode: {
    type: String,
    description: "Standard rejection code"
  },
  rejectedBy: {
    type: String,
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
  policyClauseReference: {
    type: String,
    description: "Policy clause justifying rejection"
  },
  appealInformation: {
    type: String,
    description: "Information about appeal process"
  },
  appealDeadline: {
    type: Date,
    description: "Last date for filing appeal"
  }
}
```

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
  @IsString()
  @IsNotEmpty()
  assignedTo: string; // User ID of TPA user

  @IsString()
  @IsOptional()
  assignmentNotes?: string; // Optional notes about assignment

  @IsString()
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; // Assignment priority
}
```

**Validation Rules**:
- `assignedTo` must be valid TPA_USER role user ID
- `assignedTo` cannot be the same as current assignee
- User must have active status
- `assignmentNotes` max length: 500 characters

---

### 2. ReassignClaimDto

```typescript
class ReassignClaimDto {
  @IsString()
  @IsNotEmpty()
  newAssignee: string; // User ID of new TPA user

  @IsString()
  @IsNotEmpty()
  reassignmentReason: string; // Mandatory reason for reassignment

  @IsString()
  @IsOptional()
  reassignmentNotes?: string; // Optional additional notes

  @IsBoolean()
  @IsOptional()
  notifyPreviousAssignee?: boolean; // Whether to notify previous assignee
}
```

**Validation Rules**:
- `newAssignee` must be different from current assignee
- `newAssignee` must be valid TPA_USER
- `reassignmentReason` is mandatory, min length: 10 characters
- `reassignmentNotes` max length: 500 characters

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
class LineItemDto {
  @IsString()
  @IsNotEmpty()
  service: string; // Service description

  @IsNumber()
  @Min(0)
  claimedAmount: number; // Claimed amount for service

  @IsNumber()
  @Min(0)
  approvedAmount: number; // Approved amount for service

  @IsString()
  @IsNotEmpty()
  reason: string; // Reason for approval/adjustment
}

class ApproveClaimDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['FULL', 'PARTIAL'])
  approvalType: string; // Type of approval

  @IsNumber()
  @Min(0)
  approvedAmount: number; // Total approved amount

  @IsString()
  @IsNotEmpty()
  approvalReason: string; // Detailed approval reason

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  @IsOptional()
  lineItemBreakdown?: LineItemDto[]; // Line-by-line breakdown

  @IsString()
  @IsOptional()
  paymentInstructions?: string; // Special payment instructions
}
```

**Validation Rules**:
- `approvedAmount` cannot exceed `claimedAmount`
- For PARTIAL approval, `lineItemBreakdown` is recommended
- Sum of line items must equal `approvedAmount`
- `approvalReason` min length: 20 characters
- Each line item's `approvedAmount` cannot exceed its `claimedAmount`

---

### 5. RejectClaimDto

```typescript
class RejectClaimDto {
  @IsString()
  @IsNotEmpty()
  rejectionCode: string; // Standard rejection code

  @IsString()
  @IsNotEmpty()
  rejectionReason: string; // Detailed rejection explanation

  @IsString()
  @IsOptional()
  policyClauseReference?: string; // Policy clause reference

  @IsString()
  @IsOptional()
  appealInformation?: string; // Appeal process information

  @IsDate()
  @IsOptional()
  appealDeadline?: Date; // Last date for appeal

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alternativeOptions?: string[]; // Alternative options for member
}
```

**Validation Rules**:
- `rejectionCode` must be from predefined list
- `rejectionReason` min length: 50 characters (must be detailed)
- `appealDeadline` must be future date
- Clear explanation required for member understanding

**Common Rejection Codes**:
- `PRE_AUTH_NOT_OBTAINED`: Pre-authorization not obtained
- `POLICY_EXPIRED`: Policy was not active at service date
- `SERVICE_NOT_COVERED`: Service not covered under policy
- `PROVIDER_NOT_IN_NETWORK`: Out-of-network provider
- `CLAIM_FILING_LIMIT_EXCEEDED`: Filed beyond time limit
- `DUPLICATE_CLAIM`: Duplicate claim submission
- `MEDICAL_NECESSITY_NOT_ESTABLISHED`: Medical necessity not proven
- `FRAUDULENT_CLAIM`: Suspected fraud

---

### 6. RequestDocumentsDto

```typescript
class RequiredDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentType: string; // Type of document

  @IsString()
  @IsNotEmpty()
  description: string; // Detailed description

  @IsString()
  @IsNotEmpty()
  reason: string; // Why document is needed

  @IsBoolean()
  mandatory: boolean; // Whether document is mandatory
}

class RequestDocumentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredDocumentDto)
  @ArrayMinSize(1)
  requiredDocumentsList: RequiredDocumentDto[]; // List of required documents

  @IsDate()
  @IsNotEmpty()
  submissionDeadline: Date; // Deadline for submission

  @IsString()
  @IsOptional()
  requestNotes?: string; // Additional instructions

  @IsString()
  @IsOptional()
  submissionMethod?: string; // How to submit (upload, email, etc.)

  @IsBoolean()
  @IsOptional()
  urgentRequest?: boolean; // Whether request is urgent
}
```

**Validation Rules**:
- At least one document must be required
- `submissionDeadline` must be future date (typically 7-15 days)
- Each document must have clear description and reason
- `requestNotes` should include submission instructions

**Common Document Types**:
- `DETAILED_BILL`: Itemized hospital bill
- `DISCHARGE_SUMMARY`: Discharge summary
- `PRESCRIPTION`: Doctor's prescription
- `LAB_REPORTS`: Laboratory test reports
- `DIAGNOSTIC_REPORTS`: X-ray, CT scan, MRI reports
- `DOCTOR_NOTES`: Consultation notes
- `PRE_AUTH_LETTER`: Pre-authorization letter
- `REFERRAL_LETTER`: Referral from primary doctor
- `PHARMACY_BILLS`: Medicine purchase bills
- `ORIGINAL_DOCUMENTS`: Original bills/receipts

---

## Workflow Diagrams

### 1. Complete Claim Processing Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CLAIM PROCESSING WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

    START: Member Submits Claim
              ↓
    ┌──────────────────────────┐
    │   Claim Enters System    │
    │   Status: SUBMITTED      │
    └──────────────────────────┘
              ↓
    ┌──────────────────────────┐
    │  Automatic Validation    │
    │  - Policy active?        │
    │  - Mandatory docs?       │
    │  - Duplicate check       │
    └──────────────────────────┘
              ↓
         ┌────┴────┐
         │ Valid?  │
         └────┬────┘
              │
    ┌─────────┴─────────┐
    │                   │
   NO                  YES
    │                   │
    ↓                   ↓
┌─────────┐    ┌──────────────────┐
│ Auto    │    │ TPA Admin Queue  │
│ Reject  │    │ Status:UNASSIGNED│
└─────────┘    └──────────────────┘
                       ↓
              ┌──────────────────┐
              │  TPA_ADMIN       │
              │  Reviews Queue   │
              └──────────────────┘
                       ↓
              ┌──────────────────┐
              │  Assigns Claim   │
              │  to TPA_USER     │
              │  Status: ASSIGNED│
              └──────────────────┘
                       ↓
              ┌──────────────────────┐
              │  TPA_USER Notified   │
              │  Claim in Dashboard  │
              └──────────────────────┘
                       ↓
              ┌──────────────────────┐
              │  TPA_USER Begins     │
              │  Review              │
              │  Status:UNDER_REVIEW │
              └──────────────────────┘
                       ↓
              ┌──────────────────────┐
              │  Document Review     │
              │  - Bills             │
              │  - Medical records   │
              │  - Prescriptions     │
              └──────────────────────┘
                       ↓
              ┌──────────────────────┐
              │  Eligibility Check   │
              │  - Coverage active   │
              │  - Service covered   │
              │  - Provider network  │
              └──────────────────────┘
                       ↓
         ┌─────────────┴─────────────┐
         │ All Documents Available?  │
         └─────────────┬─────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
          NO                      YES
           │                       │
           ↓                       ↓
    ┌─────────────────┐   ┌──────────────────┐
    │ Request Docs    │   │ Complete Review  │
    │ Status:         │   │                  │
    │ DOCS_REQUIRED   │   └──────────────────┘
    └─────────────────┘            ↓
           ↓                ┌──────────────┐
    ┌─────────────────┐    │ Medical      │
    │ Member Notified │    │ Necessity &  │
    │ Deadline: 15d   │    │ Policy Terms │
    └─────────────────┘    └──────────────┘
           ↓                       ↓
    ┌─────────────────┐    ┌──────────────┐
    │ Member Submits  │    │ Amount       │
    │ Documents       │    │ Calculation  │
    └─────────────────┘    └──────────────┘
           ↓                       ↓
           └───────────┬───────────┘
                       ↓
              ┌─────────────────┐
              │ Final Decision  │
              └─────────────────┘
                       ↓
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
   ┌─────────┐  ┌──────────┐  ┌─────────────┐
   │ APPROVE │  │ PARTIAL  │  │   REJECT    │
   │ (Full)  │  │ APPROVE  │  │             │
   └─────────┘  └──────────┘  └─────────────┘
        │              │              │
        └──────────────┴──────────────┘
                       ↓
              ┌─────────────────┐
              │ Member Notified │
              │ with Details    │
              └─────────────────┘
                       ↓
        ┌──────────────┴──────────────┐
        │                             │
        ↓                             ↓
   ┌─────────┐              ┌──────────────┐
   │ Rejected│              │ PAYMENT      │
   │ (End)   │              │ PENDING      │
   └─────────┘              └──────────────┘
                                   ↓
                          ┌──────────────┐
                          │ Finance Team │
                          │ Processes    │
                          └──────────────┘
                                   ↓
                          ┌──────────────┐
                          │ PAYMENT      │
                          │ PROCESSING   │
                          └──────────────┘
                                   ↓
                          ┌──────────────┐
                          │ PAYMENT      │
                          │ COMPLETED    │
                          └──────────────┘
                                   ↓
                                  END
```

---

### 2. TPA User Assignment Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              TPA USER ASSIGNMENT WORKFLOW                    │
└─────────────────────────────────────────────────────────────┘

         START: New Claim in System
                    ↓
         ┌──────────────────────┐
         │ Unassigned Claims    │
         │ Queue (TPA_ADMIN)    │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ TPA_ADMIN Reviews:   │
         │ - Claim complexity   │
         │ - Claim amount       │
         │ - Special expertise  │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Check TPA User       │
         │ Workload Status      │
         │ (via API)            │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ View Available Users │
         │ with Capacity:       │
         │ - Available (0-10)   │
         │ - Moderate (11-15)   │
         │ - High (16-20)       │
         │ - Overloaded (>20)   │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Assignment Factors:  │
         │ 1. Current workload  │
         │ 2. Expertise area    │
         │ 3. Performance       │
         │ 4. Availability      │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Select TPA User      │
         │ Add Assignment Notes │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ System Updates:      │
         │ - assignedTo         │
         │ - assignedToName     │
         │ - assignedBy         │
         │ - assignedAt         │
         │ - status: ASSIGNED   │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Notifications Sent:  │
         │ - Email to TPA User  │
         │ - Dashboard update   │
         │ - Mobile push        │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ TPA User Receives    │
         │ Claim in Dashboard   │
         └──────────────────────┘
                    ↓
              Assignment Complete


    ┌─────────────────────────────────────┐
    │    REASSIGNMENT SCENARIO            │
    └─────────────────────────────────────┘

         Trigger: Need to Reassign
                    ↓
         ┌──────────────────────┐
         │ Reassignment Reasons:│
         │ - User unavailable   │
         │ - Workload balance   │
         │ - Expertise needed   │
         │ - Performance issue  │
         │ - Conflict interest  │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ TPA_ADMIN Initiates  │
         │ Reassignment         │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Provide:             │
         │ - New assignee       │
         │ - Reason (mandatory) │
         │ - Notes (optional)   │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ System Logs:         │
         │ - Reassignment entry │
         │ - in history array   │
         │ - Previous assignee  │
         │ - New assignee       │
         │ - Reason & timestamp │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Notifications:       │
         │ - Old assignee       │
         │ - New assignee       │
         │ - Update dashboards  │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ New TPA User         │
         │ Begins Review        │
         └──────────────────────┘
                    ↓
              Reassignment Complete
```

---

### 3. Document Request and Resubmission Flow

```
┌─────────────────────────────────────────────────────────────┐
│         DOCUMENT REQUEST & RESUBMISSION WORKFLOW             │
└─────────────────────────────────────────────────────────────┘

         During Claim Review
                ↓
     ┌──────────────────────┐
     │ TPA User Identifies  │
     │ Missing/Insufficient │
     │ Documentation        │
     └──────────────────────┘
                ↓
     ┌──────────────────────┐
     │ Create Document      │
     │ Request List:        │
     │ - Document type      │
     │ - Description        │
     │ - Reason needed      │
     │ - Mandatory/Optional │
     └──────────────────────┘
                ↓
     ┌──────────────────────┐
     │ Set Submission       │
     │ Deadline             │
     │ (typically 7-15 days)│
     └──────────────────────┘
                ↓
     ┌──────────────────────┐
     │ Add Request Notes &  │
     │ Submission           │
     │ Instructions         │
     └──────────────────────┘
                ↓
     ┌──────────────────────┐
     │ Submit Request       │
     │ Status:              │
     │ DOCUMENTS_REQUIRED   │
     └──────────────────────┘
                ↓
     ┌──────────────────────┐
     │ System Updates:      │
     │ - documentsRequired  │
     │ - requiredDocs list  │
     │ - deadline           │
     │ - request date       │
     └──────────────────────┘
                ↓
     ┌──────────────────────┐
     │ Member Notification: │
     │ - Email with list    │
     │ - SMS reminder       │
     │ - Portal notification│
     └──────────────────────┘
                ↓
     ┌──────────────────────┐
     │ Member Reviews       │
     │ Required Documents   │
     └──────────────────────┘
                ↓
        ┌──────┴──────┐
        │ Decision    │
        └──────┬──────┘
               │
     ┌─────────┴─────────┐
     │                   │
     ↓                   ↓
┌──────────┐      ┌─────────────┐
│ Submits  │      │ Misses      │
│ Docs     │      │ Deadline    │
└──────────┘      └─────────────┘
     │                   │
     ↓                   ↓
┌──────────┐      ┌─────────────┐
│ Member   │      │ Auto Reject │
│ Uploads  │      │ or Extension│
│ Documents│      │ Request     │
└──────────┘      └─────────────┘
     ↓
┌──────────────────────┐
│ Status: SUBMITTED    │
│ (returns to queue)   │
└──────────────────────┘
     ↓
┌──────────────────────┐
│ Preferably Reassign  │
│ to Same TPA User     │
│ (maintain context)   │
└──────────────────────┘
     ↓
┌──────────────────────┐
│ TPA User Notified    │
│ "Documents Received" │
└──────────────────────┘
     ↓
┌──────────────────────┐
│ Resume Review        │
│ - Check new docs     │
│ - Verify completeness│
└──────────────────────┘
     ↓
   ┌─────┴─────┐
   │ Complete? │
   └─────┬─────┘
         │
   ┌─────┴─────┐
   │           │
  YES         NO
   │           │
   ↓           ↓
┌────────┐  ┌──────────────┐
│Process │  │Request More  │
│to      │  │Documents     │
│Decision│  │(with limit)  │
└────────┘  └──────────────┘
   ↓               │
  END              └──→ Back to Document Request
```

---

## Decision Trees

### 1. Claim Approval Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│              CLAIM APPROVAL DECISION TREE                    │
└─────────────────────────────────────────────────────────────┘

                    START: Review Claim
                            ↓
            ┌───────────────────────────────┐
            │ Is policy active on service   │
            │ date?                         │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Policy Expired)
            ┌───────────────────────────────┐
            │ Is service covered under      │
            │ policy?                       │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Service Not Covered)
            ┌───────────────────────────────┐
            │ Was pre-authorization         │
            │ required and obtained?        │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Pre-auth Not Obtained)
            ┌───────────────────────────────┐
            │ Is provider in network        │
            │ (if applicable)?              │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → Check Policy
                    ↓               ↓
                    ↓          Out-of-network covered?
                    ↓               ↓
                    ↓          YES ← ┘ → NO → REJECT
            ┌───────────────────────────────┐
            │ Is medical necessity          │
            │ established?                  │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Medical Necessity)
            ┌───────────────────────────────┐
            │ Are all required documents    │
            │ present and valid?            │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REQUEST DOCUMENTS
                    ↓
            ┌───────────────────────────────┐
            │ Is this a duplicate claim?    │
            └───────────────────────────────┘
                    ↓           ↓
                   NO           YES → REJECT
                    ↓               (Reason: Duplicate)
            ┌───────────────────────────────┐
            │ Filed within time limit?      │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Filing Limit)
            ┌───────────────────────────────┐
            │ Calculate Eligible Amount:    │
            │ - Apply deductible            │
            │ - Apply copay                 │
            │ - Check sublimits             │
            │ - Verify against fee schedule │
            └───────────────────────────────┘
                    ↓
            ┌───────────────────────────────┐
            │ Compare Claimed vs Eligible   │
            └───────────────────────────────┘
                    ↓
            ┌───────────┴───────────┐
            │                       │
            ↓                       ↓
    ┌──────────────┐      ┌──────────────────┐
    │ Claimed ≤    │      │ Claimed >        │
    │ Eligible     │      │ Eligible         │
    └──────────────┘      └──────────────────┘
            ↓                       ↓
    ┌──────────────┐      ┌──────────────────┐
    │ FULL         │      │ PARTIAL APPROVAL │
    │ APPROVAL     │      │ - Approve eligible│
    │              │      │ - Explain diff   │
    │ Approve full │      │ - Line breakdown │
    │ claimed amt  │      └──────────────────┘
    └──────────────┘
            ↓
            └───────────────┬───────────────┘
                            ↓
                    ┌───────────────┐
                    │ Document      │
                    │ approval with │
                    │ detailed notes│
                    └───────────────┘
                            ↓
                    ┌───────────────┐
                    │ Update status │
                    │ to APPROVED/  │
                    │ PARTIAL_APPR  │
                    └───────────────┘
                            ↓
                           END
```

---

### 2. Document Completeness Check Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│         DOCUMENT COMPLETENESS CHECK DECISION TREE            │
└─────────────────────────────────────────────────────────────┘

                START: Document Review
                            ↓
                ┌───────────────────────┐
                │ Hospital/Clinic Bill  │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Mark Required
                        ↓
                ┌───────────────────────┐
                │ Bill shows:           │
                │ - Patient name?       │
                │ - Service date?       │
                │ - Itemized charges?   │
                │ - Provider stamp?     │
                └───────────────────────┘
                        ↓           ↓
                  All Present      Missing → Request
                        ↓               Detailed Bill
                        ↓
                ┌───────────────────────┐
                │ For Hospitalization:  │
                │ Discharge Summary     │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Mark Required
                        ↓               (if applicable)
                        ↓
                ┌───────────────────────┐
                │ Discharge Summary has:│
                │ - Diagnosis?          │
                │ - Treatment details?  │
                │ - Doctor signature?   │
                └───────────────────────┘
                        ↓           ↓
                  Complete       Incomplete → Request
                        ↓               Complete Summary
                        ↓
                ┌───────────────────────┐
                │ Prescriptions         │
                │ (if medication claim) │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Mark Required
                        ↓
                ┌───────────────────────┐
                │ Prescription shows:   │
                │ - Doctor name?        │
                │ - Medicine names?     │
                │ - Dosage?             │
                │ - Date?               │
                └───────────────────────┘
                        ↓           ↓
                  Complete       Incomplete → Request
                        ↓               Clear Prescription
                        ↓
                ┌───────────────────────┐
                │ Diagnostic Reports    │
                │ (if tests done)       │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Request
                        ↓               Lab Reports
                        ↓
                ┌───────────────────────┐
                │ For High-Value Claims:│
                │ (>₹50,000)            │
                │ Additional docs needed│
                └───────────────────────┘
                        ↓
                ┌───────────────────────┐
                │ - Medical records?    │
                │ - Consultation notes? │
                │ - Investigation rpts? │
                └───────────────────────┘
                        ↓           ↓
                  All Present      Missing → Request
                        ↓               Additional Docs
                        ↓
                ┌───────────────────────┐
                │ Document Quality Check│
                └───────────────────────┘
                        ↓
                ┌───────────────────────┐
                │ - Legible?            │
                │ - Clear scans?        │
                │ - Complete pages?     │
                │ - Not tampered?       │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Request
                        ↓               Better Quality
                        ↓
            ┌───────────┴───────────┐
            │ Any Documents         │
            │ Required?             │
            └───────────┬───────────┘
                        │
                ┌───────┴───────┐
                │               │
               YES              NO
                │               │
                ↓               ↓
        ┌──────────────┐  ┌────────────┐
        │ Send Request │  │ Proceed to │
        │ to Member    │  │ Eligibility│
        │ with:        │  │ Check      │
        │ - Doc list   │  └────────────┘
        │ - Reasons    │        ↓
        │ - Deadline   │       END
        │ Status:      │
        │ DOCS_REQD    │
        └──────────────┘
                ↓
               END
```

---

### 3. Claim Priority Assignment Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│          CLAIM PRIORITY ASSIGNMENT DECISION TREE             │
└─────────────────────────────────────────────────────────────┘

            START: New Claim Assessment
                        ↓
            ┌───────────────────────┐
            │ Claim Amount?         │
            └───────────────────────┘
                        ↓
            ┌───────────┴───────────┐
            │                       │
            ↓                       ↓
    ┌──────────────┐      ┌──────────────┐
    │ > ₹1,00,000  │      │ ≤ ₹1,00,000  │
    │ HIGH VALUE   │      │              │
    └──────────────┘      └──────────────┘
            │                       │
            ↓                       ↓
    ┌──────────────┐      ┌───────────────────┐
    │ Priority:    │      │ Check Claim Age   │
    │ HIGH         │      └───────────────────┘
    └──────────────┘                ↓
            │              ┌─────────┴─────────┐
            │              │                   │
            │              ↓                   ↓
            │      ┌──────────────┐    ┌──────────────┐
            │      │ > 5 days old │    │ ≤ 5 days old │
            │      └──────────────┘    └──────────────┘
            │              │                   │
            │              ↓                   ↓
            │      ┌──────────────┐    ┌──────────────┐
            │      │ Priority:    │    │ Check Type   │
            │      │ MEDIUM       │    └──────────────┘
            │      └──────────────┘            ↓
            │              │          ┌────────┴────────┐
            │              │          │                 │
            │              │          ↓                 ↓
            │              │  ┌──────────────┐  ┌─────────────┐
            │              │  │ Emergency/   │  │ Regular OPD │
            │              │  │ Accident     │  │ Consultation│
            │              │  └──────────────┘  └─────────────┘
            │              │          │                 │
            │              │          ↓                 ↓
            │              │  ┌──────────────┐  ┌─────────────┐
            │              │  │ Priority:    │  │ Priority:   │
            │              │  │ MEDIUM       │  │ LOW         │
            │              │  └──────────────┘  └─────────────┘
            │              │          │                 │
            └──────────────┴──────────┴─────────────────┘
                                      ↓
            ┌─────────────────────────────────────┐
            │ Additional Priority Escalators:     │
            │ - Member VIP status                 │
            │ - Corporate priority client         │
            │ - Repeat submission (docs added)    │
            │ - Near SLA breach                   │
            │ - Medical emergency case            │
            │ - Complaint escalation              │
            └─────────────────────────────────────┘
                                      ↓
            ┌─────────────────────────────────────┐
            │ Final Priority Determination        │
            └─────────────────────────────────────┘
                                      ↓
            ┌─────────┬───────────┬───────────┐
            │         │           │           │
            ↓         ↓           ↓           ↓
      ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
      │ URGENT  │ │ HIGH   │ │ MEDIUM │ │ LOW    │
      │ (SLA:   │ │ (SLA:  │ │ (SLA:  │ │ (SLA:  │
      │ 24 hrs) │ │ 48 hrs)│ │ 72 hrs)│ │ 5 days)│
      └─────────┘ └────────┘ └────────┘ └────────┘
            │         │           │           │
            └─────────┴───────────┴───────────┘
                                  ↓
            ┌─────────────────────────────────────┐
            │ Assign to TPA User based on:       │
            │ 1. Priority level                   │
            │ 2. Current workload                 │
            │ 3. Expertise                        │
            │ 4. Performance history              │
            └─────────────────────────────────────┘
                                  ↓
                                 END
```

---

## SLAs and Performance Metrics

### Service Level Agreements (SLAs)

#### 1. Claim Assignment SLAs

| Priority | Assignment SLA | Target |
|----------|---------------|--------|
| **URGENT** | Within 2 hours | 100% |
| **HIGH** | Within 4 hours | 95% |
| **MEDIUM** | Within 8 hours | 90% |
| **LOW** | Within 24 hours | 85% |

**Measurement**: Time from claim submission to TPA user assignment

---

#### 2. Claim Review SLAs

| Priority | Review Completion SLA | Target |
|----------|----------------------|--------|
| **URGENT** | Within 24 hours | 95% |
| **HIGH** | Within 48 hours (2 days) | 90% |
| **MEDIUM** | Within 72 hours (3 days) | 85% |
| **LOW** | Within 5 business days | 80% |

**Measurement**: Time from assignment to final decision (approve/reject/docs required)

**Exclusions**: Time spent waiting for documents from member

---

#### 3. Document Request SLAs

| Metric | SLA | Target |
|--------|-----|--------|
| Document request creation | Within 24 hours of identifying need | 100% |
| Member submission deadline | 7-15 days from request | Standard |
| Review after resubmission | Within 24 hours | 95% |

---

#### 4. Overall Processing SLAs

| Claim Type | End-to-End SLA | Target |
|------------|---------------|--------|
| **Simple OPD** | 3 business days | 85% |
| **Standard Hospitalization** | 7 business days | 80% |
| **Complex/High Value** | 15 business days | 75% |

**End-to-End**: From claim submission to payment completion

---

### Performance Metrics

#### 1. Efficiency Metrics

**Average Handling Time (AHT)**:
- Target: < 2 hours per claim
- Measurement: Time spent actively reviewing each claim
- Industry Benchmark: 1.5-3 hours

**First Contact Resolution (FCR)**:
- Target: > 75%
- Measurement: Claims processed without requesting additional documents
- Industry Benchmark: 70-80%

**Processing Velocity**:
- Target: 25-30 claims per TPA user per week
- Measurement: Number of claims completed per user
- Industry Benchmark: 20-35 claims/week

---

#### 2. Quality Metrics

**Approval Accuracy Rate**:
- Target: > 95%
- Measurement: % of approvals that don't require revision
- Monitoring: Audit random sample of approved claims

**Rejection Validity Rate**:
- Target: > 98%
- Measurement: % of rejections upheld on appeal
- Industry Benchmark: > 95%

**Document Request Efficiency**:
- Target: < 15% of claims
- Measurement: % of claims requiring document requests
- Lower is better (indicates thorough initial submissions)

---

#### 3. Customer Satisfaction Metrics

**Member Satisfaction Score (CSAT)**:
- Target: > 4.0/5.0
- Measurement: Post-claim survey rating
- Industry Benchmark: 3.8-4.2

**Net Promoter Score (NPS)**:
- Target: > 40
- Measurement: Likelihood to recommend (0-10 scale)
- Industry Benchmark: 30-50 for insurance

**Complaint Rate**:
- Target: < 3%
- Measurement: % of claims with formal complaints
- Industry Benchmark: < 5%

---

#### 4. Financial Metrics

**Approval Rate**:
- Target: 80-85%
- Measurement: % of claims approved (full + partial)
- Too high or too low indicates issues

**Average Approved Amount Ratio**:
- Target: 85-90% of claimed amount
- Measurement: Approved amount / Claimed amount
- Industry Benchmark: 80-90%

**Leakage Prevention**:
- Target: > 95% fraud detection
- Measurement: % of fraudulent claims identified
- High-value metric for cost control

---

#### 5. Operational Metrics

**Workload Balance Score**:
- Target: < 20% variance across TPA users
- Measurement: Standard deviation of claims per user
- Lower indicates better distribution

**Reassignment Rate**:
- Target: < 10%
- Measurement: % of claims reassigned after initial assignment
- Lower is better (indicates good initial assignment)

**SLA Breach Rate**:
- Target: < 5%
- Measurement: % of claims exceeding SLA timeframes
- Critical for service quality

---

### Performance Monitoring

#### Daily Monitoring

```
┌─────────────────────────────────────────────┐
│        DAILY PERFORMANCE DASHBOARD          │
├─────────────────────────────────────────────┤
│ Claims in Queue:                         25 │
│ Claims Assigned Today:                   48 │
│ Claims Completed Today:                  52 │
│ Average Processing Time:            2.3 hrs │
│ SLA Compliance:                        94% ✓│
│ Claims Approaching SLA Breach:            3 │
├─────────────────────────────────────────────┤
│ Top Performer:          Jane Smith (12)     │
│ Needs Support:          Bob Wilson (High)   │
└─────────────────────────────────────────────┘
```

#### Weekly Review

- Review SLA compliance by priority level
- Analyze approval/rejection ratios
- Identify bottlenecks in workflow
- Review workload distribution
- Assess document request patterns
- Check for process improvements

#### Monthly Analysis

- Comprehensive performance reports
- Trend analysis (month-over-month)
- TPA user performance reviews
- Member satisfaction analysis
- Financial impact assessment
- Process optimization recommendations

---

## Best Practices

### 1. Claim Assignment Best Practices

#### For TPA Admins

**Balanced Workload Distribution**:
- Monitor real-time workload dashboard
- Avoid overloading high performers
- Distribute complex claims evenly
- Consider user availability (PTO, training)
- Balance urgent and routine claims

**Smart Assignment Strategy**:
- Match claim complexity to user expertise
- Assign similar claims to same user for efficiency
- Consider geographic/provider familiarity
- Use specialization (orthopedic, cardiac, etc.)
- Rotate learning opportunities to junior users

**Priority Management**:
- Assign urgent claims immediately
- Clear backlog before new assignments
- Escalate aging claims
- Fast-track VIP/corporate clients
- Address near-SLA-breach claims first

**Communication**:
- Add clear assignment notes
- Flag special requirements
- Provide context for complex cases
- Use internal chat for urgent clarifications
- Document all assignment decisions

---

### 2. Claim Review Best Practices

#### For TPA Users

**Systematic Review Process**:
1. **Initial Assessment (5 min)**:
   - Verify policy status
   - Check basic eligibility
   - Review claim amount
   - Identify red flags

2. **Document Verification (15-30 min)**:
   - Cross-check all documents
   - Verify dates and amounts
   - Check signatures and stamps
   - Look for inconsistencies
   - Validate against claim form

3. **Eligibility Analysis (15-20 min)**:
   - Review policy terms
   - Check coverage limits
   - Apply deductibles/copays
   - Verify sublimits
   - Calculate eligible amount

4. **Medical Necessity Review (10-20 min)**:
   - Assess diagnosis codes
   - Review treatment protocols
   - Check medical guidelines
   - Verify appropriate care level
   - Consult medical team if needed

5. **Final Decision (10-15 min)**:
   - Determine outcome
   - Calculate final amount
   - Document detailed reasoning
   - Prepare member communication
   - Update claim status

**Documentation Standards**:
- Write clear, detailed notes
- Use professional language
- Reference specific policy clauses
- Explain calculations explicitly
- Document all decisions thoroughly
- Maintain audit trail

**Quality Checks**:
- Double-check calculations
- Verify policy references
- Review communication clarity
- Ensure compliance with guidelines
- Validate against similar claims
- Peer review for high-value claims

---

### 3. Communication Best Practices

#### Member Communication

**Approval Notifications**:
- Congratulate on approval
- Clearly state approved amount
- Break down calculation if partial
- Explain payment timeline
- Provide contact for queries
- Use simple, jargon-free language

**Rejection Notifications**:
- Express empathy
- Clearly explain reason
- Reference policy clause
- Provide appeal process details
- Offer alternative options
- Include contact information
- Maintain professional tone

**Document Requests**:
- Be specific about what's needed
- Explain why each document is required
- Provide clear submission instructions
- Set reasonable deadlines
- Offer help if needed
- Use checklists for clarity
- Follow up with reminders

---

### 4. Efficiency Best Practices

**Time Management**:
- Process similar claims in batches
- Use templates for common scenarios
- Set time blocks for focused review
- Minimize distractions
- Prioritize high-priority claims
- Take breaks to maintain accuracy

**Technology Utilization**:
- Use keyboard shortcuts
- Leverage auto-calculation tools
- Utilize quick-view features
- Use saved filters and views
- Bookmark common references
- Use dual monitors if available

**Knowledge Management**:
- Maintain personal reference notes
- Create decision templates
- Build FAQ library
- Share learnings with team
- Stay updated on policy changes
- Attend training sessions

---

### 5. Quality Assurance Best Practices

**Self-Audit**:
- Review 10% of own decisions
- Track personal error rate
- Identify improvement areas
- Seek feedback proactively
- Learn from mistakes
- Maintain quality log

**Peer Review**:
- Participate in peer reviews
- Share complex cases
- Discuss difficult decisions
- Learn from colleagues
- Provide constructive feedback
- Build team knowledge

**Compliance**:
- Follow all policies strictly
- Maintain confidentiality
- Avoid conflicts of interest
- Report suspicious claims
- Document all irregularities
- Escalate concerns appropriately

---

### 6. Fraud Detection Best Practices

**Red Flags to Watch**:
- Duplicate claims with minor variations
- Unusually high amounts for routine procedures
- Multiple claims on same date
- Claims just below policy limits
- Altered or tampered documents
- Inconsistent information across documents
- Provider-patient relationship concerns
- Rushed submissions near policy expiry
- Similar claims from different members

**Investigation Process**:
1. Document all suspicious indicators
2. Cross-reference with claims database
3. Verify provider credentials
4. Check member history
5. Request additional documentation
6. Consult fraud prevention team
7. Escalate to senior management
8. Follow legal procedures if confirmed

**Prevention**:
- Stay alert to patterns
- Use data analytics tools
- Maintain fraud database
- Share intelligence with team
- Regular training on fraud types
- Collaborate with industry peers
- Report to regulatory authorities

---

### 7. Continuous Improvement Best Practices

**Personal Development**:
- Track own metrics
- Set improvement goals
- Learn from top performers
- Take relevant courses
- Stay updated on industry trends
- Obtain certifications
- Participate in workshops

**Process Improvement**:
- Suggest workflow enhancements
- Identify bottlenecks
- Share efficiency tips
- Document best practices
- Contribute to knowledge base
- Participate in kaizen sessions
- Test new approaches

**Team Collaboration**:
- Share insights in team meetings
- Mentor junior team members
- Participate in problem-solving
- Build positive team culture
- Celebrate team successes
- Support colleagues during peak times
- Foster open communication

---

### 8. Stress Management Best Practices

**Workload Management**:
- Don't overcommit
- Ask for help when needed
- Take regular breaks
- Maintain work-life balance
- Use time off appropriately
- Communicate capacity limits
- Prioritize self-care

**Difficult Decisions**:
- Consult senior reviewers
- Use clinical advisory team
- Don't rush complex cases
- Document reasoning thoroughly
- Seek second opinions
- Follow escalation procedures
- Trust your training and judgment

**Member Interactions**:
- Remain professional always
- Don't take complaints personally
- Empathize with member concerns
- Maintain boundaries
- Escalate hostile situations
- Seek support from management
- Practice active listening

---

## Appendix

### Common Rejection Codes Reference

| Code | Description | Policy Action |
|------|-------------|---------------|
| R001 | Policy expired/inactive | Verify policy dates |
| R002 | Service not covered | Check policy schedule |
| R003 | Pre-authorization not obtained | Verify pre-auth requirement |
| R004 | Out-of-network provider | Check network status |
| R005 | Filing limit exceeded | Verify filing deadline |
| R006 | Duplicate claim | Check claim history |
| R007 | Medical necessity not established | Review medical records |
| R008 | Waiting period not completed | Check policy start date |
| R009 | Pre-existing condition exclusion | Review medical history |
| R010 | Policy limit exceeded | Check annual/lifetime limits |
| R011 | Fraudulent claim | Investigate and report |
| R012 | Incomplete documentation | Request missing documents |

### Approval Calculation Example

```
Original Claimed Amount:              ₹50,000

Policy Details:
- Deductible (annual):                ₹2,000 (already met)
- Copay:                              10%
- Room Rent Limit:                    ₹2,000/day
- Policy Coverage:                     90% after copay

Calculation:
─────────────────────────────────────────────
Line Item Breakdown:

1. Room Charges (5 days × ₹3,000)     ₹15,000
   Eligible (5 days × ₹2,000)         ₹10,000
   Adjustment:                         ₹5,000 (Sublimit)

2. Doctor Consultation                ₹8,000
   Eligible:                          ₹8,000
   Adjustment:                        ₹0

3. Medicines                          ₹12,000
   Eligible:                          ₹12,000
   Adjustment:                        ₹0

4. Diagnostic Tests                   ₹10,000
   Eligible:                          ₹10,000
   Adjustment:                        ₹0

5. Nursing Charges                    ₹5,000
   Eligible:                          ₹5,000
   Adjustment:                        ₹0

─────────────────────────────────────────────
Total Claimed:                        ₹50,000
Total Eligible:                       ₹45,000
Less: Copay (10%):                    ₹4,500
─────────────────────────────────────────────
APPROVED AMOUNT:                      ₹40,500

Approval Type:                        PARTIAL
Reason:                              Room rent exceeds policy
                                     sublimit of ₹2,000/day
```

### Escalation Matrix

| Issue | First Contact | Second Contact | Final Escalation |
|-------|--------------|----------------|------------------|
| Complex medical decision | Senior TPA User | Medical Advisor | Chief Medical Officer |
| High-value claim (>₹5L) | TPA Admin | Operations Manager | Claims Director |
| Suspected fraud | TPA Admin | Fraud Prevention | Legal Team |
| Member complaint | TPA User | TPA Admin | Customer Service Head |
| SLA breach risk | TPA User | TPA Admin | Operations Manager |
| System/technical issue | TPA User | IT Support | IT Manager |
| Policy interpretation | Senior TPA User | Underwriting Team | Legal/Compliance |

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
