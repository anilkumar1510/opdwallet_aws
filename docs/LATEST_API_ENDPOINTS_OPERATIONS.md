# Operations Portal API Endpoints

This document lists all API endpoints used by the Operations Portal (web-operations) for operational management.

**Portal URL:** `/operations`
**Port (dev):** 3005
**Roles:** OPS

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | User login with credentials (OPS role validation) |
| POST | /auth/logout | User logout |
| GET | /auth/me | Get current user information |

---

## Operations - Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/members/dashboard/stats | Get operations dashboard statistics |
| GET | /ops/members/search | Search members with pagination |
| GET | /ops/members/:id | Get member details with wallet/policy |
| POST | /ops/members/:id/wallet/topup | Top-up member wallet |

---

## Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /appointments | Create new appointment |
| GET | /appointments | Get all appointments with filters (admin) |
| GET | /appointments/user/:userId | Get appointments for specific user |
| GET | /appointments/:appointmentId | Get appointment details |
| PATCH | /appointments/:appointmentId/confirm | Confirm appointment |
| PATCH | /appointments/:appointmentId/cancel | Cancel appointment |

---

## Doctors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /doctors | Get all doctors with filters |
| GET | /doctors/:doctorId | Get doctor details |
| GET | /doctors/:doctorId/slots | Get doctor slots by clinic/date |
| POST | /doctors | Create new doctor |
| POST | /doctors/:doctorId/photo | Upload doctor photo |
| PUT | /doctors/:doctorId | Update doctor |
| PATCH | /doctors/:doctorId/activate | Activate doctor |
| PATCH | /doctors/:doctorId/deactivate | Deactivate doctor |
| POST | /doctors/:doctorId/set-password | Set doctor password |

---

## Doctor Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor-slots | Create slot configuration |
| GET | /doctor-slots | Get all slot configurations |
| GET | /doctor-slots/clinic/:clinicId | Get slots by clinic |
| GET | /doctor-slots/:slotId | Get slot configuration by ID |
| GET | /doctor-slots/:slotId/generate/:date | Generate time slots for date |
| PUT | /doctor-slots/:slotId | Update slot configuration |
| PATCH | /doctor-slots/:slotId/activate | Activate slot configuration |
| PATCH | /doctor-slots/:slotId/deactivate | Deactivate slot configuration |
| PATCH | /doctor-slots/:slotId/block-date | Block date for slots |
| PATCH | /doctor-slots/:slotId/unblock-date | Unblock date for slots |
| DELETE | /doctor-slots/:slotId | Delete slot configuration |

---

## Clinics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /clinics | Create new clinic |
| GET | /clinics | Get all clinics with filters |
| GET | /clinics/:clinicId | Get clinic by ID |
| PUT | /clinics/:clinicId | Update clinic |
| PATCH | /clinics/:clinicId/activate | Activate clinic |
| PATCH | /clinics/:clinicId/deactivate | Deactivate clinic |
| DELETE | /clinics/:clinicId | Delete clinic |

---

## Operations - Dental Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/dental-services/clinics | Get all clinics with dental service status |
| PUT | /ops/dental-services/clinics/:clinicId/toggle | Toggle dental services enabled/disabled at clinic level |
| GET | /ops/dental-services/clinics/:clinicId/services | Get all dental services for a clinic with pricing |
| PUT | /ops/dental-services/clinics/:clinicId/services/:serviceCode/toggle | Toggle service enabled/disabled for a clinic |
| PATCH | /ops/dental-services/clinics/:clinicId/services/:serviceCode/price | Update price for a service at a clinic |
| PUT | /ops/dental-services/clinics/:clinicId/services/bulk | Bulk update services (enable/disable and set prices) |
| GET | /ops/dental-services/clinics/:clinicId/services/:serviceCode/pricing | Get pricing details for a specific service at a clinic |
| DELETE | /ops/dental-services/clinics/:clinicId/services/:serviceCode | Delete pricing record (disables service and removes pricing) |
| POST | /ops/dental-services/clinics/:clinicId/slots | Create time slots for dental services at a clinic |
| GET | /ops/dental-services/clinics/:clinicId/slots | Get all time slots for a clinic |
| DELETE | /ops/dental-services/slots/:slotId | Delete a specific time slot |

**Notes:**
- All endpoints require authentication (JWT token via cookie)
- Access restricted to SUPER_ADMIN, ADMIN, and OPS roles
- **Clinic-level toggle must be enabled before individual services can be enabled**
- Disabling clinic-level toggle automatically disables all individual services
- Service codes are automatically converted to uppercase
- Prices must be positive numbers (>= 0)
- Services must be enabled before setting prices
- Category CAT006 (Dental Services) is hardcoded for all operations
- **Dental service slots can only be created for clinics with dental services enabled**
- Slot creation supports multiple dates in a single request
- Past dates are not allowed for slot creation
- Slot duration options: 15, 30, 45, 60 minutes (default: 30 minutes)
- Default max appointments per slot: 10

---

## Operations - Vision Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/vision-services/clinics | Get all clinics with vision service status |
| PUT | /ops/vision-services/clinics/:clinicId/toggle | Toggle vision services enabled/disabled at clinic level |
| GET | /ops/vision-services/clinics/:clinicId/services | Get all vision services for a clinic (no pricing) |
| PUT | /ops/vision-services/clinics/:clinicId/services/:serviceCode/toggle | Toggle service enabled/disabled for a clinic |
| POST | /ops/vision-services/clinics/:clinicId/slots | Create time slots for vision services at a clinic |
| GET | /ops/vision-services/clinics/:clinicId/slots | Get all time slots for a clinic |
| DELETE | /ops/vision-services/slots/:slotId | Delete a specific time slot |

**Key Differences from Dental Services:**
- Category: CAT007 (Vision Care)
- Marker service code: `VISION_SERVICES_ENABLED`
- **No pricing functionality**: No price fields or pricing endpoints
- **Operations-only**: No member booking module
- Slot ID prefix: `VSLOT` instead of `DSLOT`

**Notes:**
- All endpoints require authentication (JWT token via cookie)
- Access restricted to SUPER_ADMIN, ADMIN, and OPS roles
- **Clinic-level toggle must be enabled before individual services can be enabled**
- Disabling clinic-level toggle automatically disables all individual services
- Service codes are automatically converted to uppercase
- Category CAT007 (Vision Services) is hardcoded for all operations
- **Vision service slots can only be created for clinics with vision services enabled**
- Slot creation supports multiple dates in a single request
- Past dates are not allowed for slot creation
- Slot duration options: 15, 30, 45, 60 minutes (default: 30 minutes)
- Default max appointments per slot: 10
- Uses existing vision services from service_master collection (VIS001, VIS002, etc.)

---

## Operations - Dental Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dental-bookings | List all dental bookings with filters (status, clinic, service, date range, search) |
| PATCH | /admin/dental-bookings/:bookingId/confirm | Confirm pending dental booking |
| PATCH | /admin/dental-bookings/:bookingId/admin-cancel | Cancel booking with refund (admin action) |
| PATCH | /admin/dental-bookings/:bookingId/reschedule | Reschedule booking to different slot |
| PATCH | /admin/dental-bookings/:bookingId/no-show | Mark booking as no-show (appointment time must have passed) |
| PATCH | /admin/dental-bookings/:bookingId/complete | Mark booking as completed and generate invoice |
| GET | /admin/dental-bookings/:bookingId/invoice | Download invoice PDF for completed booking |

**Query Parameters for GET /admin/dental-bookings:**
- `status`: Filter by booking status (PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- `clinicId`: Filter by clinic
- `serviceCode`: Filter by dental service code
- `dateFrom`: Filter bookings from date (YYYY-MM-DD)
- `dateTo`: Filter bookings to date (YYYY-MM-DD)
- `searchTerm`: Search by patient name or booking ID
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Reschedule Body:**
```json
{
  "slotId": "slot-configuration-id",
  "appointmentDate": "YYYY-MM-DD",
  "appointmentTime": "HH:mm",
  "reason": "Reason for rescheduling"
}
```

**Notes:**
- All endpoints require authentication (JWT token via cookie)
- Access restricted to SUPER_ADMIN, ADMIN, and OPS roles
- Booking status workflow: PENDING_CONFIRMATION → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW
- Admin cancellation automatically processes wallet refund
- Rescheduling validates new slot availability before updating
- No-show requires appointment time to have passed (validates in IST timezone)
- Completing booking automatically generates PDF invoice
- Bookings are linked to dental service slots (prevents double booking)
- Payment breakdown includes copay calculation and service transaction limits
- All bookings create transaction summary records for audit trail

---

## Operations - Vision Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/vision-bookings | List all vision bookings with filters (status, clinic, service, date range, search) |
| PATCH | /admin/vision-bookings/:bookingId/confirm | Confirm pending vision booking |
| PATCH | /admin/vision-bookings/:bookingId/generate-bill | Generate bill for confirmed booking (admin sets service price) |
| PATCH | /admin/vision-bookings/:bookingId/admin-cancel | Cancel booking with reason (admin action) |
| PATCH | /admin/vision-bookings/:bookingId/no-show | Mark booking as no-show (appointment time must have passed) |
| PATCH | /admin/vision-bookings/:bookingId/complete | Mark booking as completed |

**Query Parameters for GET /admin/vision-bookings:**
- `status`: Filter by booking status (PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- `clinicId`: Filter by clinic
- `serviceCode`: Filter by vision service code
- `dateFrom`: Filter bookings from date (YYYY-MM-DD)
- `dateTo`: Filter bookings to date (YYYY-MM-DD)
- `searchTerm`: Search by patient name or booking ID
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Bill Generation Workflow:**
1. Member books vision appointment → Status: PENDING_CONFIRMATION, paymentStatus: PENDING
2. Admin confirms booking → Status: CONFIRMED
3. Admin generates bill with manual service cost entry → billGenerated: true
4. Member views and pays bill → paymentStatus: COMPLETED
5. System auto-generates invoice → invoiceGenerated: true

**Notes:**
- All endpoints require authentication (JWT token via cookie)
- Access restricted to SUPER_ADMIN, ADMIN, and OPS roles
- Booking status workflow: PENDING_CONFIRMATION → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW
- Bill generation is a separate step after confirmation (admin manually sets service price)
- Bill must be generated before member can make payment
- Admin cancellation updates status only (no refund processing if no payment was taken)
- No-show requires appointment time to have passed
- Bookings are linked to vision service slots (prevents double booking)
- Category: CAT007 (Vision Care)

---

## Lab Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/lab/prescriptions/queue | Get pending prescriptions queue |
| GET | /ops/lab/prescriptions/:id | Get prescription by ID |
| POST | /ops/lab/prescriptions/:id/eligible-vendors | Get eligible vendors for prescription |
| POST | /ops/lab/prescriptions/:id/digitize | Digitize prescription and create cart |
| PATCH | /ops/lab/prescriptions/:id/status | Update prescription status |
| GET | /ops/lab/orders | Get all lab orders with filters |
| GET | /ops/lab/orders/:orderId | Get order by ID |
| PATCH | /ops/lab/orders/:orderId/status | Update order status |
| PATCH | /ops/lab/orders/:orderId/confirm | Confirm order |
| PATCH | /ops/lab/orders/:orderId/collect | Mark sample collected |
| POST | /ops/lab/orders/:orderId/reports/upload | Upload test report |
| PATCH | /ops/lab/orders/:orderId/complete | Complete order |

---

## Diagnostics Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/diagnostics/prescriptions/queue | Get diagnostic prescription queue (filtered by status) |
| GET | /ops/diagnostics/prescriptions/:id | Get diagnostic prescription by ID |
| PATCH | /ops/diagnostics/prescriptions/:id/status | Update diagnostic prescription status |
| POST | /ops/diagnostics/prescriptions/:id/delay | Mark diagnostic prescription as delayed with reason |
| POST | /ops/diagnostics/prescriptions/:id/digitize | Digitize diagnostic prescription and create cart |
| PATCH | /ops/diagnostics/carts/:cartId/display | Display cart to member for review |
| GET | /ops/diagnostics/orders | Get all diagnostic orders with filters |
| GET | /ops/diagnostics/orders/:id | Get diagnostic order by ID |
| PATCH | /ops/diagnostics/orders/:id/status | Update diagnostic order status |
| POST | /ops/diagnostics/orders/:id/cancel | Cancel diagnostic order |
| POST | /ops/diagnostics/orders/:id/report | Upload diagnostic test report |

---

## AHC (Annual Health Check) - Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/ahc/orders | Get all AHC orders with optional status filter |
| GET | /ops/ahc/orders/:orderId | Get specific AHC order details |
| PATCH | /ops/ahc/orders/:orderId/complete-collection | Mark collection complete (PLACED → CONFIRMED) |
| POST | /ops/ahc/orders/:orderId/reports/upload | Upload lab and/or diagnostic reports (dual upload in single request) |
| POST | /ops/ahc/orders/:orderId/reports/upload-lab | Upload only lab report (alternative endpoint) |
| POST | /ops/ahc/orders/:orderId/reports/upload-diagnostic | Upload only diagnostic report (alternative endpoint) |
| POST | /ops/ahc/orders/:orderId/cancel | Cancel AHC order with reason |
| PATCH | /ops/ahc/orders/:orderId/status | Update order status (manual override) |

**AHC Operations Flow:**
1. View all AHC orders in operations portal (AHC tab)
2. Filter orders by status (PLACED, CONFIRMED, COMPLETED, CANCELLED)
3. Mark collection as complete when lab/diagnostic tests collected
4. Upload reports (lab and diagnostic can be uploaded together or separately)
5. Order automatically moves to COMPLETED when all required reports uploaded

**Report Upload:**
- **Dual upload endpoint:** `/ops/ahc/orders/:orderId/reports/upload`
  - Accepts both `labReport` and `diagnosticReport` in single request
  - At least one file must be provided
  - Both files optional in single request
- **Alternative endpoints:**
  - `/ops/ahc/orders/:orderId/reports/upload-lab` - Only lab report
  - `/ops/ahc/orders/:orderId/reports/upload-diagnostic` - Only diagnostic report
- **File types:** PDF, JPG, JPEG, PNG
- **Max size:** 10MB per file
- **Storage:** `./uploads/ahc-reports/lab/` and `./uploads/ahc-reports/diagnostic/`

**Order Status:**
- `PLACED` - Order created, pending collection
- `CONFIRMED` - Collection complete, awaiting reports
- `LAB_COMPLETED` - Lab report uploaded (if package has lab tests)
- `DIAGNOSTIC_COMPLETED` - Diagnostic report uploaded (if package has diagnostic tests)
- `COMPLETED` - All required reports uploaded
- `CANCELLED` - Order cancelled

**UI Features:**
- AHC tab in orders page with status filters
- Patient name, package name, vendor names displayed
- "Mark collection complete" button for PLACED orders
- Dual report upload modal for CONFIRMED orders
- Conditional upload fields based on package contents
- Report download for viewing uploaded reports
- Cancel order with reason (before collection)

**Key Notes:**
- Orders displayed with lab and diagnostic vendor names
- Single modal for uploading both reports (not separate modals)
- Upload button only visible after collection marked complete
- Order auto-completes when all required reports uploaded
- Supports lab-only, diagnostic-only, or full packages
- Report metadata includes fileName, originalName, filePath, uploadedAt, uploadedBy

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Check health status and database connectivity |

---

**Total Endpoints: ~112**

**Access Control:**
- Login page validates OPS role only
- Non-operations users are logged out immediately
- Independent session management via `/operations` cookie path
