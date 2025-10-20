# OPD Wallet - Complete API Reference

> **Part of Product Architecture Documentation**
> See [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) for system overview, [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for backend details

**Last Updated**: October 18, 2025
**Base URL**: `http://51.20.125.246/api` (Production)
**Total Endpoints**: 100+
**API Version**: 6.8

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Management](#user-management)
3. [Policy & Configuration](#policy--configuration)
4. [Master Data](#master-data)
5. [Healthcare Services](#healthcare-services)
6. [Appointments & Consultations](#appointments--consultations)
7. [Claims & Reimbursements](#claims--reimbursements)
8. [Lab Diagnostics](#lab-diagnostics)
9. [TPA Operations](#tpa-operations)
10. [Payments & Transactions](#payments--transactions)
11. [Notifications](#notifications)
12. [Utility Endpoints](#utility-endpoints)

---

## Authentication Endpoints

### `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/logout` | Logout and clear session | Yes |
| GET | `/api/auth/me` | Get current user profile | Yes |
| POST | `/api/auth/doctor/login` | Doctor portal login | No |
| POST | `/api/auth/doctor/logout` | Doctor logout | Yes (Doctor) |
| GET | `/api/auth/doctor/profile` | Get doctor profile | Yes (Doctor) |
| PATCH | `/api/auth/doctor/profile` | Update doctor profile | Yes (Doctor) |

**Login Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Login Response**:
```json
{
  "user": {
    "userId": "MEM001",
    "email": "user@example.com",
    "role": "MEMBER",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Login successful"
}
```

---

## User Management

### `/api/users`

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/users` | Create new user | SUPER_ADMIN, ADMIN |
| GET | `/api/users` | List all users (paginated) | SUPER_ADMIN, ADMIN, OPS |
| GET | `/api/users/:id` | Get user by ID | SUPER_ADMIN, ADMIN, OPS |
| PUT | `/api/users/:id` | Update user | SUPER_ADMIN, ADMIN |
| DELETE | `/api/users/:id` | Delete user | SUPER_ADMIN |
| POST | `/api/users/:id/reset-password` | Reset user password | SUPER_ADMIN, ADMIN |
| POST | `/api/users/:id/set-password` | Set new password | SUPER_ADMIN, ADMIN |
| GET | `/api/users/:id/dependents` | Get user with dependents | SUPER_ADMIN, ADMIN, MEMBER |
| GET | `/api/users/:id/assignments` | Get user's policy assignments | SUPER_ADMIN, ADMIN, MEMBER |

**Create User Request**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "9876543210",
  "role": "MEMBER",
  "relationship": "REL001",
  "primaryMemberId": "MEM001"
}
```

---

## Policy & Configuration

### Policies (`/api/policies`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/policies` | Create new policy | SUPER_ADMIN, ADMIN |
| GET | `/api/policies` | List all policies | SUPER_ADMIN, ADMIN, TPA, OPS |
| GET | `/api/policies/:id` | Get policy by ID | SUPER_ADMIN, ADMIN, TPA, OPS |
| PUT | `/api/policies/:id` | Update policy | SUPER_ADMIN, ADMIN |
| DELETE | `/api/policies/:id` | Delete policy (if not assigned) | SUPER_ADMIN |

### Policy Assignments (`/api/assignments`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| POST | `/api/assignments` | Assign policy to user | Auto wallet initialization |
| GET | `/api/assignments` | List all assignments | - |
| GET | `/api/assignments/policy/:policyId` | Get assignments for policy | - |
| GET | `/api/assignments/search-primary-members` | Search primary members | Autocomplete support |
| DELETE | `/api/assignments/:assignmentId` | Deactivate assignment | Auto wallet deletion |
| DELETE | `/api/assignments/user/:userId/policy/:policyId` | Unassign policy | - |

**Assign Policy Request**:
```json
{
  "userId": "673ae8da20a0e1d0e8f27c01",
  "policyId": "6743ae1820a0e1d0e8f27d15",
  "relationshipId": "REL002",
  "primaryMemberId": "MEM001",
  "effectiveFrom": "2025-01-01",
  "effectiveTo": "2025-12-31"
}
```

### Plan Configuration (`/api/policies/:policyId/config`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:policyId/config` | Create new plan config |
| GET | `/:policyId/config` | Get config (current/specific) |
| GET | `/:policyId/config/all` | Get all configs for policy |
| PUT | `/:policyId/config/:version` | Update config (DRAFT only) |
| POST | `/:policyId/config/:version/publish` | Publish config |
| POST | `/:policyId/config/:version/set-current` | Set as current |
| DELETE | `/:policyId/config/:version` | Delete config |

---

## Master Data

### Categories (`/api/categories`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/categories` | Create category |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/ids` | Get all category IDs |
| GET | `/api/categories/:id` | Get category by ID |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| PUT | `/api/categories/:id/toggle-active` | Toggle active status |

### Services (`/api/services`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/services/types` | Create service type |
| GET | `/api/services/types` | List service types |
| GET | `/api/services/types/codes` | Get all service codes |
| GET | `/api/services/types/:id` | Get service type by ID |
| PUT | `/api/services/types/:id` | Update service type |
| DELETE | `/api/services/types/:id` | Delete service type |
| PUT | `/api/services/types/:id/toggle-active` | Toggle active |
| GET | `/api/services/categories/:category` | Get by category |

### Relationships (`/api/relationships`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/relationships` | Get active relationships |
| GET | `/api/relationships/all` | Get all (including inactive) |
| GET | `/api/relationships/:id` | Get specific relationship |
| POST | `/api/relationships` | Create new relationship |
| PUT | `/api/relationships/:id` | Update relationship |
| DELETE | `/api/relationships/:id` | Delete relationship (SUPER_ADMIN only) |
| PATCH | `/api/relationships/:id/toggle-active` | Toggle active status |

### CUG Master (`/api/cugs`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cugs` | Create CUG |
| GET | `/api/cugs` | List CUGs |
| GET | `/api/cugs/active` | List active CUGs |
| GET | `/api/cugs/:id` | Get CUG by ID |
| PUT | `/api/cugs/:id` | Update CUG |
| PATCH | `/api/cugs/:id/toggle-active` | Toggle active status |
| DELETE | `/api/cugs/:id` | Delete CUG |
| POST | `/api/cugs/seed` | Seed default CUGs |

---

## Healthcare Services

### Specialties (`/api/specialties`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/specialties` | List all specialties |
| GET | `/api/specialties/:specialtyId` | Get specialty by ID |

### Doctors (`/api/doctors`)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/api/doctors` | List all doctors | specialtyId, city, availableOnline, availableOffline |
| GET | `/api/doctors/:doctorId` | Get doctor by ID with clinic details | - |
| POST | `/api/doctors` | Create new doctor | - |
| PUT | `/api/doctors/:doctorId` | Update doctor details | - |
| PATCH | `/api/doctors/:doctorId/activate` | Activate doctor | - |
| PATCH | `/api/doctors/:doctorId/deactivate` | Deactivate doctor | - |

### Clinics (`/api/clinics`)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/api/clinics` | List all clinics | city, state, search, isActive, page, limit |
| GET | `/api/clinics/:clinicId` | Get clinic details by ID | - |
| POST | `/api/clinics` | Create new clinic | - |
| PUT | `/api/clinics/:clinicId` | Update clinic details | - |
| PATCH | `/api/clinics/:clinicId/activate` | Activate clinic | - |
| PATCH | `/api/clinics/:clinicId/deactivate` | Deactivate clinic | - |
| DELETE | `/api/clinics/:clinicId` | Delete clinic | - |

### Doctor Slots (`/api/doctor-slots`)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/api/doctor-slots` | List all slots | doctorId, clinicId, dayOfWeek, consultationType, isActive |
| GET | `/api/doctor-slots/doctor/:doctorId` | Get all slots for doctor | - |
| GET | `/api/doctor-slots/clinic/:clinicId` | Get all slots for clinic | - |
| GET | `/api/doctor-slots/doctor/:doctorId/day/:dayOfWeek` | Get doctor slots for specific day | - |
| GET | `/api/doctor-slots/:slotId` | Get slot by ID | - |
| GET | `/api/doctor-slots/:slotId/generate/:date` | Generate specific date slot | - |
| POST | `/api/doctor-slots` | Create new slot | - |
| PUT | `/api/doctor-slots/:slotId` | Update slot | - |
| PATCH | `/api/doctor-slots/:slotId/activate` | Activate slot | - |
| PATCH | `/api/doctor-slots/:slotId/deactivate` | Deactivate slot | - |
| PATCH | `/api/doctor-slots/:slotId/block-date` | Block slot for specific date | - |
| PATCH | `/api/doctor-slots/:slotId/unblock-date` | Unblock slot for specific date | - |
| DELETE | `/api/doctor-slots/:slotId` | Delete slot | - |

---

## Appointments & Consultations

### Appointments (`/api/appointments`)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| POST | `/api/appointments` | Create appointment (IN_CLINIC/ONLINE) | - |
| GET | `/api/appointments` | Get all appointments | - |
| GET | `/api/appointments/user/:userId` | Get user's appointments | type (IN_CLINIC/ONLINE) |
| GET | `/api/appointments/user/:userId/ongoing` | Get ongoing appointments | - |
| GET | `/api/appointments/:appointmentId` | Get appointment details | - |
| PATCH | `/api/appointments/:appointmentId/confirm` | Confirm appointment | - |
| PATCH | `/api/appointments/:appointmentId/cancel` | Cancel appointment | - |

**Create Appointment Request (IN_CLINIC)**:
```json
{
  "doctorId": "DOC001",
  "doctorName": "Dr. Sharma",
  "specialty": "Cardiology",
  "clinicId": "CLI001",
  "clinicName": "Apollo Hospital",
  "clinicAddress": "123 Main St",
  "patientName": "John Doe",
  "patientId": "SELF",
  "appointmentType": "IN_CLINIC",
  "appointmentDate": "2025-01-20",
  "timeSlot": "10:00 AM - 10:30 AM",
  "consultationFee": 500,
  "useWallet": true
}
```

**Create Appointment Request (ONLINE)**:
```json
{
  "doctorId": "DOC001",
  "doctorName": "Dr. Sharma",
  "specialty": "Cardiology",
  "patientName": "John Doe",
  "patientId": "SELF",
  "appointmentType": "ONLINE",
  "appointmentDate": "2025-01-20",
  "timeSlot": "Immediate",
  "contactNumber": "9876543210",
  "callPreference": "VIDEO",
  "consultationFee": 300,
  "useWallet": true
}
```

### Doctor Portal - Appointments (`/api/doctor/appointments`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/doctor/appointments/counts` | Get appointment counts by date | DOCTOR |
| GET | `/api/doctor/appointments/today` | Get today's appointments | DOCTOR |
| GET | `/api/doctor/appointments/date/:date` | Get appointments for specific date | DOCTOR |
| GET | `/api/doctor/appointments/upcoming` | Get upcoming appointments (paginated) | DOCTOR |
| GET | `/api/doctor/appointments/:appointmentId` | Get appointment details | DOCTOR |
| PATCH | `/api/doctor/appointments/:appointmentId/complete` | Mark appointment as completed | DOCTOR |
| PATCH | `/api/doctor/appointments/:appointmentId/confirm` | Confirm pending appointment | DOCTOR |

### Doctor Portal - Prescriptions (`/api/doctor/prescriptions`)

| Method | Endpoint | Description | File Upload |
|--------|----------|-------------|-------------|
| POST | `/api/doctor/prescriptions/upload` | Upload prescription for appointment | PDF, JPEG, PNG (10MB max) |
| GET | `/api/doctor/prescriptions` | List doctor's uploaded prescriptions | - |
| GET | `/api/doctor/prescriptions/:prescriptionId` | Get prescription details | - |
| DELETE | `/api/doctor/prescriptions/:prescriptionId` | Delete prescription | - |

### Video Consultations (`/api/video-consultations`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/video-consultations/start` | Start video consultation | DOCTOR |
| POST | `/api/video-consultations/join` | Join video consultation | MEMBER |
| POST | `/api/video-consultations/:id/end` | End consultation | DOCTOR |
| GET | `/api/video-consultations/:id/status` | Get consultation status | DOCTOR, MEMBER |
| GET | `/api/video-consultations/doctor/history` | Get doctor's consultation history | DOCTOR |
| GET | `/api/video-consultations/patient/history` | Get patient's consultation history | MEMBER |

---

## Claims & Reimbursements

### Member Claims (`/api/member/claims`)

| Method | Endpoint | Description | File Upload |
|--------|----------|-------------|-------------|
| POST | `/api/member/claims` | Create new claim | 20 files max, 15MB each |
| POST | `/api/member/claims/:claimId/submit` | Submit claim for processing | - |
| GET | `/api/member/claims` | List user's claims (paginated) | - |
| GET | `/api/member/claims/summary` | Get user's claims summary | - |
| GET | `/api/member/claims/:claimId/timeline` | Get claim timeline/history | - |
| GET | `/api/member/claims/:claimId/tpa-notes` | Get TPA notes for member | - |
| GET | `/api/member/claims/:id` | Get claim by MongoDB ID | - |
| GET | `/api/member/claims/claim/:claimId` | Get claim by claimId | - |
| PATCH | `/api/member/claims/:id` | Update claim details | - |
| PATCH | `/api/member/claims/:claimId/cancel` | Cancel claim | Auto wallet refund |
| POST | `/api/member/claims/:claimId/documents` | Add documents to claim | - |
| POST | `/api/member/claims/:claimId/resubmit-documents` | Resubmit documents | - |
| DELETE | `/api/member/claims/:claimId/documents/:documentId` | Remove document | - |
| DELETE | `/api/member/claims/:id` | Delete claim | - |
| GET | `/api/member/claims/files/:userId/:filename` | Download claim file | - |

**Create Claim Request**:
```json
{
  "claimType": "REIMBURSEMENT",
  "serviceType": "Consultation",
  "serviceDate": "2025-01-15",
  "serviceProvider": "Apollo Hospital",
  "claimAmount": 2000,
  "description": "Cardiac consultation and tests",
  "categoryId": "CAT001"
}
```

**Claim Status Flow**:
```
DRAFT → SUBMITTED → UNASSIGNED → ASSIGNED → UNDER_REVIEW
  ↓
DOCUMENTS_REQUIRED (optional) → RESUBMISSION_REQUIRED (loop)
  ↓
APPROVED / PARTIALLY_APPROVED / REJECTED
  ↓
PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_COMPLETED
  ↓
CANCELLED (with wallet refund)
```

---

## Lab Diagnostics

### Member APIs (`/api/lab/member`)

| Method | Endpoint | Description | File Upload |
|--------|----------|-------------|-------------|
| POST | `/api/lab/member/prescriptions` | Upload lab prescription | JPEG, PNG, PDF (10MB max) |
| GET | `/api/lab/member/prescriptions` | List user's prescriptions | - |
| GET | `/api/lab/member/prescriptions/:prescriptionId` | Get prescription details | - |
| GET | `/api/lab/member/orders` | List user's lab orders | - |
| GET | `/api/lab/member/orders/:orderId` | Get order details | - |
| GET | `/api/lab/member/reports/:orderId` | Get lab report | - |

### Admin APIs (`/api/lab/admin`)

**Lab Test Master Management**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lab/admin/tests` | Create lab test |
| GET | `/api/lab/admin/tests` | List all lab tests |
| GET | `/api/lab/admin/tests/:testId` | Get test details |
| PUT | `/api/lab/admin/tests/:testId` | Update lab test |
| DELETE | `/api/lab/admin/tests/:testId` | Delete lab test |

**Lab Package Management**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lab/admin/packages` | Create lab package |
| GET | `/api/lab/admin/packages` | List all packages |
| GET | `/api/lab/admin/packages/:packageId` | Get package details |
| PUT | `/api/lab/admin/packages/:packageId` | Update package |
| DELETE | `/api/lab/admin/packages/:packageId` | Delete package |

**Lab Partner Management**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lab/admin/partners` | Create lab partner |
| GET | `/api/lab/admin/partners` | List all partners |
| GET | `/api/lab/admin/partners/:partnerId` | Get partner details |
| PUT | `/api/lab/admin/partners/:partnerId` | Update partner |
| PATCH | `/api/lab/admin/partners/:partnerId/activate` | Activate partner |
| PATCH | `/api/lab/admin/partners/:partnerId/deactivate` | Deactivate partner |

### Operations APIs (`/api/lab/ops`)

**Prescription Queue Management**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab/ops/prescriptions/queue` | Get pending prescriptions queue |
| GET | `/api/lab/ops/prescriptions/:prescriptionId` | Get prescription for digitization |
| POST | `/api/lab/ops/prescriptions/:prescriptionId/digitize` | Digitize prescription tests |

**Order Management**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab/ops/orders` | List all orders with filters |
| GET | `/api/lab/ops/orders/:orderId` | Get order details |
| POST | `/api/lab/ops/orders` | Create order from prescription |
| PUT | `/api/lab/ops/orders/:orderId` | Update order details |
| PATCH | `/api/lab/ops/orders/:orderId/assign-partner` | Assign order to partner |
| PATCH | `/api/lab/ops/orders/:orderId/confirm` | Confirm order |
| PATCH | `/api/lab/ops/orders/:orderId/collect-sample` | Mark sample collected |
| PATCH | `/api/lab/ops/orders/:orderId/processing` | Mark as processing |
| PATCH | `/api/lab/ops/orders/:orderId/cancel` | Cancel order |

**Report Management**:
| Method | Endpoint | Description | File Upload |
|--------|----------|-------------|-------------|
| POST | `/api/lab/ops/orders/:orderId/report` | Upload lab report | PDF, JPEG, PNG (15MB max) |
| GET | `/api/lab/ops/reports` | List all reports | - |
| GET | `/api/lab/ops/reports/:reportId` | Get report details | - |
| PUT | `/api/lab/ops/reports/:reportId` | Update report | - |
| GET | `/api/lab/ops/reports/download/:reportId` | Download report file | - |

**Analytics**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab/ops/analytics/prescriptions-stats` | Prescription statistics |
| GET | `/api/lab/ops/analytics/orders-stats` | Order statistics |
| GET | `/api/lab/ops/analytics/partner-performance` | Partner performance |
| GET | `/api/lab/ops/analytics/revenue` | Revenue analytics |
| GET | `/api/lab/ops/analytics/turnaround-time` | TAT analysis |

---

## TPA Operations

### TPA APIs (`/api/tpa`)

**Claim Assignment**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tpa/claims/assign` | Assign claims to TPA user (bulk) |
| GET | `/api/tpa/claims/assigned` | Get assigned claims |
| GET | `/api/tpa/claims/assigned/:claimId` | Get assigned claim details |

**Claim Review**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/tpa/claims/:claimId/review` | Start reviewing claim |
| PATCH | `/api/tpa/claims/:claimId/approve` | Approve claim |
| PATCH | `/api/tpa/claims/:claimId/partial-approve` | Partially approve claim |
| PATCH | `/api/tpa/claims/:claimId/reject` | Reject claim |
| PATCH | `/api/tpa/claims/:claimId/request-resubmission` | Request document resubmission |

**Analytics**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tpa/analytics/summary` | TPA dashboard summary |
| GET | `/api/tpa/analytics/claims-by-status` | Claims breakdown by status |
| GET | `/api/tpa/analytics/reviewer-performance` | Individual TPA performance |

---

## Payments & Transactions

### Payments (`/api/payments`)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/api/payments/:paymentId` | Get payment details by ID | - |
| GET | `/api/payments` | Get user payment history | status, serviceType, limit, skip |
| GET | `/api/payments/summary/stats` | Get payment summary statistics | - |
| POST | `/api/payments/:paymentId/mark-paid` | Mark payment as paid (dummy gateway) | - |
| POST | `/api/payments/:paymentId/cancel` | Cancel a payment | - |

### Transactions (`/api/transactions`)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/api/transactions` | Get user transaction history | serviceType, paymentMethod, status, dateFrom, dateTo, limit, skip |
| GET | `/api/transactions/summary` | Get transaction summary statistics | - |
| GET | `/api/transactions/:transactionId` | Get transaction details by ID | - |

**Transaction Summary Response**:
```json
{
  "totalTransactions": 45,
  "totalSpent": 25000,
  "totalFromWallet": 20000,
  "totalSelfPaid": 5000,
  "totalCopay": 5000,
  "byServiceType": {
    "APPOINTMENT": { "count": 20, "amount": 15000 },
    "LAB_ORDER": { "count": 15, "amount": 8000 },
    "CLAIM": { "count": 10, "amount": 2000 }
  },
  "byPaymentMethod": {
    "WALLET_ONLY": 30,
    "COPAY": 10,
    "OUT_OF_POCKET": 5
  }
}
```

---

## Notifications

### Notifications APIs (`/api/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user's notifications |
| GET | `/api/notifications/unread` | Get unread notifications count |
| PATCH | `/api/notifications/:notificationId/read` | Mark notification as read |
| PATCH | `/api/notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/notifications/:notificationId` | Delete notification |

**Notification Types**:
- `CLAIM_SUBMITTED`: Claim submitted successfully
- `CLAIM_APPROVED`: Claim approved
- `CLAIM_REJECTED`: Claim rejected
- `CLAIM_RESUBMISSION_REQUIRED`: Documents need resubmission
- `APPOINTMENT_CONFIRMED`: Appointment confirmed
- `APPOINTMENT_CANCELLED`: Appointment cancelled
- `LAB_ORDER_CREATED`: Lab order created
- `LAB_REPORT_READY`: Lab report available
- `WALLET_CREDITED`: Wallet balance credited
- `SYSTEM_ANNOUNCEMENT`: System-wide announcements

---

## Utility Endpoints

### Member Portal (`/api/member`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/member/profile` | Get member profile with family |
| GET | `/api/member/family` | Get family members |
| PATCH | `/api/member/profile` | Update member profile (email/mobile) |

### Finance (`/api/finance`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/finance/process-payment` | Process claim payment (foundation) |

### Migration/Admin Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/migration/spouse-coverage` | Migrate spouse coverage data |
| POST | `/api/admin/migrate-invalid-services` | Migrate/fix invalid service data |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Basic health check |

---

## Missing Endpoints (UI exists, no backend)

```
❌ /api/wallet/*                    # Wallet operations (schema ready, service exists)
❌ /api/health-records/*            # Health records management (not started)
```

---

## API Response Standards

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "timestamp": "2025-01-16T10:30:00Z",
  "path": "/api/users",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Common HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid request data/validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists/duplicate |
| 500 | Internal Server Error | Server-side error |

---

## Authentication

All endpoints (except `/api/auth/login` and `/api/auth/doctor/login`) require authentication via HTTP-only cookie named `opd_session`.

**Cookie Details**:
- Name: `opd_session` (users) or `doctor_session` (doctors)
- HTTP-Only: true
- Secure: true (production)
- SameSite: Lax
- Max-Age: 7 days

---

**Document Maintained By**: Development Team
**Last Updated**: October 18, 2025
**Version**: 6.8
