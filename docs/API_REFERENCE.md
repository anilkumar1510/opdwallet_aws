# OPD Wallet - API Reference

**Last Updated:** January 2025
**API Version:** v1
**Base URL:** `http://localhost:4000` (Development)

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints by Portal](#api-endpoints-by-portal)
4. [Common Patterns](#common-patterns)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Overview

The OPD Wallet platform exposes REST APIs across multiple portals for different user types:

| Portal | User Type | Base Path | Port (Dev) | Documentation |
|--------|-----------|-----------|------------|---------------|
| **Member Portal** | Patients/Employees (MEMBER) | `/api` | 3002 | [Member API Endpoints](./LATEST_API_ENDPOINTS_MEMBER.md) |
| **Admin Portal** | Platform Admins (SUPER_ADMIN, ADMIN) | `/api` | 3001 | [Admin API Endpoints](./LATEST_API_ENDPOINTS_ADMIN.md) |
| **Doctor Portal** | Healthcare Providers (DOCTOR) | `/api` | 3003 | [Doctor API Endpoints](./LATEST_API_ENDPOINTS_DOCTOR.md) |
| **TPA Portal** | Claim Processors (TPA_ADMIN, TPA_USER) | `/api` | 3004 | [TPA API Endpoints](./LATEST_API_ENDPOINTS_TPA.md) |
| **Operations Portal** | Operations Team (OPS) | `/api` | 3005 | [Operations API Endpoints](./LATEST_API_ENDPOINTS_OPERATIONS.md) |
| **Finance Portal** | Finance Team (FINANCE_USER) | `/api` | 3006 | [Finance API Endpoints](./LATEST_API_ENDPOINTS_FINANCE.md) |

**Backend API Server:** `http://localhost:4000` (serves all portals)

---

## Authentication

### Authentication Methods

All API endpoints require authentication via JWT tokens stored in HTTP-only cookies.

#### Login Endpoints

| Portal | Endpoint | Roles Accepted | Cookie Path |
|--------|----------|----------------|-------------|
| Member | `POST /api/auth/login` | MEMBER | `/` |
| Admin | `POST /api/auth/login` | SUPER_ADMIN, ADMIN | `/admin` |
| Doctor | `POST /api/doctor/auth/login` | DOCTOR | `/doctor` |
| TPA | `POST /api/auth/login` | TPA_ADMIN, TPA_USER | `/tpa` |
| Operations | `POST /api/auth/login` | OPS | `/operations` |
| Finance | `POST /api/auth/login` | FINANCE_USER | `/finance` |

#### Authentication Flow

1. **Login Request:**
   ```json
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Login Response:**
   ```json
   {
     "success": true,
     "data": {
       "user": {
         "id": "user_id",
         "email": "user@example.com",
         "role": "MEMBER",
         "name": "John Doe"
       },
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```

3. **Authenticated Request:**
   ```
   GET /api/member/profile
   Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Get Current User

All portals support fetching the current authenticated user:

```
GET /api/auth/me
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "MEMBER",
    "name": "John Doe",
    "phone": "+91-9876543210"
  }
}
```

#### Logout

```
POST /api/auth/logout
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## API Endpoints by Portal

### Member Portal APIs

**Total Endpoints:** ~80
**User Type:** Patients/Employees (MEMBER role)
**Full Documentation:** [LATEST_API_ENDPOINTS_MEMBER.md](./LATEST_API_ENDPOINTS_MEMBER.md)

**Key Features:**
- Wallet management and balance checking
- Doctor consultation booking (in-clinic and online video)
- Appointment management and cancellation
- Digital prescription viewing and download
- Lab test ordering and report viewing
- Pharmacy services (planned)
- Claims submission and tracking
- Profile and family member management

**Major Endpoint Categories:**
- Authentication (`/api/auth/*`)
- Member Profile (`/api/member/*`)
- Wallet (`/api/wallet/*`)
- Appointments (`/api/appointments/*`)
- Doctors & Clinics (`/api/doctors/*`, `/api/clinics/*`)
- Video Consultations (`/api/video-consultations/*`)
- Prescriptions (`/api/prescriptions/*`, `/api/member/digital-prescriptions/*`)
- Lab Tests (`/api/member/lab/*`)
- Claims (`/api/member/claims/*`)
- Payments (`/api/payments/*`)

---

### Admin Portal APIs

**Total Endpoints:** ~90
**User Type:** Platform Administrators (SUPER_ADMIN, ADMIN roles)
**Full Documentation:** [LATEST_API_ENDPOINTS_ADMIN.md](./LATEST_API_ENDPOINTS_ADMIN.md)

**Key Features:**
- User management (internal users and members)
- Policy creation and configuration
- Plan configuration with wallet categories
- Assignment management (assign policies to users)
- Corporate User Group (CUG) management
- Service category and specialty management
- Doctor and clinic onboarding
- Lab service management
- TPA claim review and approval
- Finance payment processing

**Major Endpoint Categories:**
- Authentication (`/api/auth/*`)
- User Management (`/api/users/*`, `/api/members/*`, `/api/internal-users/*`)
- Policy Management (`/api/policies/*`)
- Plan Configuration (`/api/policies/:policyId/config/*`)
- Assignments (`/api/assignments/*`)
- Categories & Services (`/api/categories/*`, `/api/services/*`)
- CUG Management (`/api/cugs/*`)
- Specialties (`/api/specialties/*`)
- Operations (`/api/ops/*`)
- Doctor Management (`/api/doctors/*`)
- Clinic Management (`/api/clinics/*`)
- Lab Management (`/api/admin/lab/*`)
- TPA (`/api/tpa/*`)
- Finance (`/api/finance/*`)

---

### Doctor Portal APIs

**Total Endpoints:** ~25
**User Type:** Healthcare Providers (DOCTOR role)
**Full Documentation:** [LATEST_API_ENDPOINTS_DOCTOR.md](./LATEST_API_ENDPOINTS_DOCTOR.md)

**Key Features:**
- Appointment viewing and management
- Video consultation hosting (Daily.co integration)
- Digital prescription creation with medicine/lab test database
- Prescription PDF upload
- Patient consultation history
- Appointment completion and notes

**Major Endpoint Categories:**
- Doctor Authentication (`/api/doctor/auth/*`)
- Doctor Appointments (`/api/doctor/appointments/*`)
- Video Consultations (`/api/video-consultations/*`)
- Prescriptions (`/api/prescriptions/*`, `/api/doctor/digital-prescriptions/*`)
- Medicine Search (`/api/medicines/search`)
- Diagnosis & Symptoms (`/api/diagnoses/*`, `/api/symptoms/*`)

---

### TPA Portal APIs

**Total Endpoints:** ~15
**User Type:** Claim Processors (TPA_ADMIN, TPA_USER roles)
**Full Documentation:** [LATEST_API_ENDPOINTS_TPA.md](./LATEST_API_ENDPOINTS_TPA.md)

**Key Features:**
- Claim queue management
- Claim assignment to TPA users
- Claim review and document verification
- Claim approval/rejection with reasons
- Request additional documents from members
- Analytics and workload tracking

**Major Endpoint Categories:**
- TPA Claims (`/api/tpa/claims/*`)
- TPA Analytics (`/api/tpa/analytics/*`)
- TPA Users (`/api/tpa/users`)

**Claim Status Workflow:**
```
PENDING → UNDER_REVIEW → APPROVED/REJECTED/PENDING_DOCUMENTS
```

---

### Operations Portal APIs

**Total Endpoints:** ~104
**User Type:** Operations Team (OPS role)
**Full Documentation:** [LATEST_API_ENDPOINTS_OPERATIONS.md](./LATEST_API_ENDPOINTS_OPERATIONS.md)

**Key Features:**
- Member search and wallet top-up
- Doctor and clinic management
- Doctor scheduling and slot management
- Dental and vision service clinic configuration
- Lab prescription digitization
- Diagnostic order management
- Booking management (dental, vision appointments)

**Major Endpoint Categories:**
- Operations Members (`/api/ops/members/*`)
- Appointments (`/api/appointments/*`)
- Doctors (`/api/doctors/*`)
- Doctor Slots (`/api/doctor-slots/*`)
- Clinics (`/api/clinics/*`)
- Dental Services (`/api/ops/dental-services/*`)
- Vision Services (`/api/ops/vision-services/*`)
- Dental Bookings (`/api/admin/dental-bookings/*`)
- Vision Bookings (`/api/admin/vision-bookings/*`)
- Lab Operations (`/api/ops/lab/*`)
- Diagnostics Operations (`/api/ops/diagnostics/*`)

---

### Finance Portal APIs

**Total Endpoints:** ~9
**User Type:** Finance Team (FINANCE_USER role)
**Full Documentation:** [LATEST_API_ENDPOINTS_FINANCE.md](./LATEST_API_ENDPOINTS_FINANCE.md)

**Key Features:**
- View pending payments (approved claims)
- Complete payment processing
- Payment history tracking
- Finance analytics and summaries

**Major Endpoint Categories:**
- Finance Claims (`/api/finance/claims/*`)
- Finance Payments (`/api/finance/payments/*`)
- Finance Analytics (`/api/finance/analytics/*`)

**Payment Workflow:**
```
Approved Claim → Pending Payment → Payment Completed → Member Notified
```

---

## Common Patterns

### Standard Response Format

All API endpoints follow a consistent response format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional error details
  }
}
```

### Pagination

List endpoints support pagination with standard parameters:

**Request:**
```
GET /api/endpoint?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Filtering and Search

Many endpoints support filtering and search:

**Common Query Parameters:**
- `search` or `searchTerm` - Text search
- `status` - Filter by status
- `dateFrom`, `dateTo` - Date range filtering
- `clinicId`, `doctorId`, `userId` - Entity filtering

**Example:**
```
GET /api/appointments?status=CONFIRMED&dateFrom=2025-01-01&dateTo=2025-01-31&clinicId=clinic123
```

### File Uploads

File upload endpoints accept `multipart/form-data`:

**Example (Prescription Upload):**
```
POST /api/prescriptions/upload
Content-Type: multipart/form-data

appointmentId: "appt_123"
file: [prescription.pdf]
notes: "Follow-up prescription"
```

### Date and Time Format

- **Dates:** `YYYY-MM-DD` (ISO 8601)
- **Times:** `HH:mm` (24-hour format)
- **Timestamps:** ISO 8601 with timezone (e.g., `2025-01-15T10:30:00+05:30`)

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `AUTH_REQUIRED` | Authentication token missing |
| `INVALID_TOKEN` | Token expired or invalid |
| `INSUFFICIENT_PERMISSIONS` | User doesn't have required role |
| `INVALID_CREDENTIALS` | Login failed |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `VALIDATION_ERROR` | Request validation failed |
| `INSUFFICIENT_BALANCE` | Wallet balance too low |
| `SLOT_NOT_AVAILABLE` | Appointment slot already booked |
| `DUPLICATE_ENTRY` | Resource already exists |

---

## Rate Limiting

Currently, no rate limiting is enforced. Future versions may implement:

- **Per-user rate limits:** 100 requests per minute
- **Global rate limits:** 10,000 requests per minute
- **File upload limits:** 5 uploads per minute per user

---

## Additional Documentation

- **Policy Services API:** [API_REFERENCE_POLICY_SERVICES.md](./API_REFERENCE_POLICY_SERVICES.md)
- **Project Overview:** [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
- **Database Schema:** [DATABASE_AND_CONFIG.md](./DATABASE_AND_CONFIG.md)
- **Testing Guide:** [PORTAL_TESTING_GUIDE.md](./PORTAL_TESTING_GUIDE.md)

---

## Support

For API support and bug reports:
- **Email:** dev@opdwallet.com
- **Internal Documentation:** See `/docs` folder in repository

---

**Document Version:** 1.0
**Last Reviewed:** January 2025
**Next Review:** April 2025
