# Member Portal API Endpoints

This document lists all API endpoints used by the Member Portal (web-member).

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Member login with credentials |
| POST | /auth/logout | Member logout |
| GET | /auth/me | Get current member information |

---

## Member Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/profile | Get member profile with family |
| GET | /member/family | Get family members |
| PATCH | /member/profile | Update member profile |
| GET | /member/addresses | Get member addresses |
| POST | /member/addresses | Create member address |
| PATCH | /member/addresses/:addressId/default | Set default address |
| DELETE | /member/addresses/:addressId | Delete member address |

---

## Policy & Benefits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /assignments/my-policy | Get current user's policy with copay details |
| GET | /member/benefits/:categoryId/services | Get allowed services for category |
| GET | /member/benefits/:categoryId/specialties | Get allowed specialties |
| GET | /member/benefits/:categoryId/lab-services | Get allowed lab service categories |

---

## Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallet/transactions | Get wallet transactions with pagination |
| GET | /wallet/balance | Get wallet balance |

---

## Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /appointments | Create new appointment |
| POST | /appointments/validate-booking | Validate booking and get payment breakdown with service limits |
| GET | /appointments/user/:userId | Get appointments for specific user |
| GET | /appointments/user/:userId/ongoing | Get ongoing appointments for user |
| GET | /appointments/:appointmentId | Get appointment details |
| PATCH | /appointments/:appointmentId/user-cancel | Member cancels appointment |

---

## Doctors & Specialties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /doctors | Get all doctors with filters |
| GET | /doctors/:doctorId/slots | Get doctor slots by clinic/date |
| GET | /doctors/:doctorId | Get doctor details |
| GET | /specialties | Get all active specialties |

---

## Video Consultations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /video-consultations/join | Join video consultation (member) |
| GET | /video-consultations/:consultationId/status | Get consultation status |
| GET | /video-consultations/patient/history | Get patient's consultation history |

---

## Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/claims/available-categories | Get available claim categories based on member's policy |
| POST | /member/claims | Create new claim with documents |
| POST | /member/claims/:claimId/submit | Submit claim |
| GET | /member/claims | Get claims with pagination |
| GET | /member/claims/summary | Get claims summary |
| GET | /member/claims/:claimId/timeline | Get claim timeline |
| GET | /member/claims/:claimId/tpa-notes | Get TPA notes for claim |
| GET | /member/claims/:id | Get claim by ID |
| GET | /member/claims/claim/:claimId | Get claim by claim ID |
| PATCH | /member/claims/:id | Update claim |
| POST | /member/claims/:claimId/documents | Add documents to claim |
| DELETE | /member/claims/:claimId/documents/:documentId | Delete document from claim |
| DELETE | /member/claims/:id | Delete claim |
| GET | /member/claims/files/:userId/:filename | Download claim document |
| POST | /member/claims/:claimId/resubmit-documents | Resubmit documents after rejection |
| PATCH | /member/claims/:claimId/cancel | Cancel claim |

---

## Lab Tests (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /member/lab/prescriptions/upload | Upload prescription |
| GET | /member/lab/prescriptions | Get user prescriptions with order status and lab tests (enhanced: includes hasOrder, orderCount, labTests from source prescription) |
| GET | /member/lab/prescriptions/:id | Get prescription details |
| POST | /member/lab/prescriptions/submit-existing | Submit existing health record prescription for lab services |
| GET | /member/lab/carts | Get active carts for user |
| GET | /member/lab/carts/:cartId | Get cart by ID |
| GET | /member/lab/carts/:cartId/vendors | Get vendors for cart |
| DELETE | /member/lab/carts/:cartId | Delete cart |
| GET | /member/lab/vendors/available | Get available vendors by pincode |
| GET | /member/lab/vendors/:vendorId/pricing | Get vendor pricing |
| GET | /member/lab/vendors/:vendorId/slots | Get available slots |
| POST | /member/lab/orders | Create order with payment processing (supports wallet debit and transaction creation) |
| GET | /member/lab/orders | Get user orders |
| GET | /member/lab/orders/:orderId | Get order details |

### Lab Tests Flow & ID Mapping

**Complete Lab Test Journey:**

1. **Prescription Upload** → Creates `LabPrescription` with `prescriptionId` (e.g., PRES-1234567890-ABC123)
   - Status: `UPLOADED`
   - Endpoint: `POST /member/lab/prescriptions/upload`
   - Returns: `{ prescriptionId, fileName, uploadedAt, status: 'UPLOADED' }`
   - At this stage: `hasOrder: false`, `orderCount: 0`

2. **Pending Review State** (Visible in Bookings → Lab Tab)
   - Prescriptions with `hasOrder: false` appear with status **"Pending review and cart creation"**
   - Endpoint: `GET /member/lab/prescriptions` (filter for `hasOrder === false`)
   - User waits for operations team to digitize and create cart

3. **Cart Creation** (Operations Portal) → Creates `LabCart` with `cartId`
   - Status: `ACTIVE`
   - Cart is linked to the prescription via `prescriptionId`
   - Endpoint: `GET /member/lab/carts` (returns carts linked to user's prescriptions)
   - Visible in Bookings → Lab Tab as "Payment Pending" or cart status

4. **Vendor Selection & Slot Booking** → User selects vendor and time slot
   - Endpoints:
     - `GET /member/lab/carts/:cartId/vendors`
     - `GET /member/lab/vendors/:vendorId/slots`

5. **Order Creation** → Creates `LabOrder` with `orderId` (e.g., ORD-1234567890-XYZ456)
   - Payment is processed (wallet debit, transaction creation)
   - Endpoint: `POST /member/lab/orders`
   - Order is linked to prescription via `prescriptionId` field in LabOrder
   - Returns: `{ orderId, prescriptionId, cartId, items, vendorName, collectionDate, collectionTime, finalAmount }`
   - At this stage: Prescription's `hasOrder: true`, `orderCount: 1`

6. **Order Tracking** → User can view order in Bookings → Lab Tab
   - Endpoint: `GET /member/lab/orders`
   - Shows as "Paid" with full order details

**ID Relationships:**
```
LabPrescription (prescriptionId)
    ↓
LabCart (cartId, references prescriptionId)
    ↓
LabOrder (orderId, references prescriptionId + cartId)
    ↓
Transaction (references orderId for payment tracking)
```

**Key Fields for Frontend:**
- **GET /member/lab/prescriptions** response includes:
  - `hasOrder` (boolean): Whether order exists for this prescription
  - `orderCount` (number): Number of orders created from this prescription
  - `labTests` (array): Structured lab tests if from digital prescription
  - `prescriptionId` (string): Unique prescription identifier

- **GET /member/lab/orders** response includes:
  - `orderId` (string): Unique order identifier for tracking
  - `prescriptionId` (ObjectId): Link back to original prescription
  - `cartId` (string): Link to cart used for this order
  - `items` (array): Lab tests/services in the order

**Bookings Display Logic:**
- **Pending Prescriptions** (hasOrder: false): Display with "Pending review and cart creation" badge
- **Active Carts**: Display with "Payment Pending" or cart status
- **Paid Orders**: Display with "Paid" badge and full order details

**Recent Prescriptions Limit:**
- `/member/lab-tests` page shows maximum 2 most recent prescriptions (changed from 5)

---

## Diagnostics (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /member/diagnostics/prescriptions/upload | Upload diagnostic prescription |
| POST | /member/diagnostics/prescriptions/submit-existing | Submit existing health record prescription for diagnostics |
| GET | /member/diagnostics/prescriptions | Get user diagnostic prescriptions with order status (enhanced: includes hasOrder, orderCount) |
| GET | /member/diagnostics/prescriptions/:id | Get diagnostic prescription details |
| GET | /member/diagnostics/carts | Get diagnostic carts for user |
| GET | /member/diagnostics/carts/:cartId | Get diagnostic cart by ID |
| GET | /member/diagnostics/carts/:cartId/vendors/:vendorId/pricing | Get vendor pricing for cart items |
| GET | /member/diagnostics/vendors/:vendorId/slots | Get available slots for diagnostic vendor |
| POST | /member/diagnostics/orders | Create diagnostic order |
| GET | /member/diagnostics/orders | Get user diagnostic orders |
| GET | /member/diagnostics/orders/:id | Get diagnostic order details |
| POST | /member/diagnostics/orders/:id/cancel | Cancel diagnostic order |
| GET | /member/diagnostics/orders/:id/reports | Get diagnostic order reports |

### ⚠️ CRITICAL: Data Separation Between Lab and Diagnostics

**IMPORTANT**: Lab and Diagnostics use completely separate database collections and API endpoints:

- **Lab Tests**:
  - Collection: `lab_prescriptions`, `lab_carts`, `lab_orders`
  - API Prefix: `/api/member/lab/*`
  - Upload Endpoint: `POST /api/member/lab/prescriptions/upload`

- **Diagnostics**:
  - Collection: `diagnostic_prescriptions`, `diagnostic_carts`, `diagnostic_orders`
  - API Prefix: `/api/member/diagnostics/*`
  - Upload Endpoint: `POST /api/member/diagnostics/prescriptions/upload`

**Frontend Pages Must Use Correct Endpoints**:
- `/member/lab-tests/upload` → POST to `/api/member/lab/prescriptions/upload`
- `/member/diagnostics/upload` → POST to `/api/member/diagnostics/prescriptions/upload`
- `/member/bookings` Lab tab → GET from `/api/member/lab/*`
- `/member/bookings` Diagnostics tab → GET from `/api/member/diagnostics/*`

**Bugs Fixed (2026-01-02)**:
1. **Frontend Endpoint Issue**:
   - Issue: Diagnostics upload page was incorrectly posting to lab endpoint
   - Fixed: Line 274 in `/member/diagnostics/upload/page.tsx` corrected to use `/api/member/diagnostics/prescriptions/upload`

2. **Backend DTO Validation Issue**:
   - Issue: Diagnostic upload endpoint was failing with "Internal server error" due to missing DTO validation
   - Root Cause: Controller was using inline type without proper validation, and `prescriptionDate` type mismatch (string vs Date)
   - Fixed:
     - Created `/api/src/modules/diagnostics/dto/upload-prescription.dto.ts` with proper validation decorators
     - Updated controller to use `UploadDiagnosticPrescriptionDto` and convert `prescriptionDate` string to Date object
     - Now matches the pattern used in lab upload endpoint

3. **Backend File Upload Configuration Missing**:
   - Issue: Mongoose validation error - "fileName: Path `fileName` is required., filePath: Path `filePath` is required."
   - Root Cause: DiagnosticsModule was missing MulterModule configuration for file uploads
   - Fixed:
     - Added MulterModule.register() to `/api/src/modules/diagnostics/diagnostics.module.ts`
     - Configured diskStorage with upload path: `./uploads/diagnostic-prescriptions`
     - Added file validation (JPEG, PNG, PDF only, max 10MB)
     - Now matches the configuration used in lab module

4. **Upload Directory Not Created**:
   - Issue: ENOENT error - "no such file or directory, open 'uploads/diagnostic-prescriptions/...'"
   - Root Cause: Upload directories didn't exist in Docker container
   - Fixed:
     - Updated `docker-compose.yml` line 59 to create directories on container startup
     - Created local directories: `api/uploads/diagnostic-prescriptions` and `api/uploads/diagnostic-reports`
     - Added .gitkeep files to track empty directories in git
     - Directories now created automatically when container starts

---

### Diagnostics Flow & ID Mapping

**Complete Diagnostics Journey:**

1. **Prescription Upload** → Creates `DiagnosticPrescription` with `prescriptionId` (e.g., DIAG-PRES-1234567890-ABC123)
   - Status: `UPLOADED`
   - Endpoint: `POST /member/diagnostics/prescriptions/upload`
   - Returns: `{ prescriptionId, fileName, uploadedAt, status: 'UPLOADED' }`
   - At this stage: `hasOrder: false`, `orderCount: 0`

2. **Pending Review State** (Visible in Bookings → Diagnostics Tab)
   - Prescriptions with `hasOrder: false` appear with status **"Pending review and cart creation"**
   - Endpoint: `GET /member/diagnostics/prescriptions` (filter for `hasOrder === false`)
   - User waits for operations team to digitize and create cart

3. **Cart Creation** (Operations Portal) → Creates `DiagnosticCart` with `cartId`
   - Status: `ACTIVE`
   - Cart is linked to the prescription via `prescriptionId`
   - Endpoint: `GET /member/diagnostics/carts` (returns carts linked to user's prescriptions)

4. **Vendor Selection & Slot Booking** → User selects vendor and time slot
   - Endpoints:
     - `GET /member/diagnostics/carts/:cartId/vendors/:vendorId/pricing`
     - `GET /member/diagnostics/vendors/:vendorId/slots`

5. **Order Creation** → Creates `DiagnosticOrder` with `orderId` (e.g., DIAG-ORD-1234567890-XYZ456)
   - Payment is processed (wallet debit, transaction creation)
   - Endpoint: `POST /member/diagnostics/orders`
   - Order is linked to prescription via `prescriptionId` field in DiagnosticOrder
   - Returns: `{ orderId, prescriptionId, cartId, items, vendorName, collectionDate, collectionTime, finalAmount }`
   - At this stage: Prescription's `hasOrder: true`, `orderCount: 1`

6. **Order Tracking** → User can view order in Bookings → Diagnostics Tab
   - Endpoint: `GET /member/diagnostics/orders`
   - Shows as "Paid" with full order details

**ID Relationships:**
```
DiagnosticPrescription (prescriptionId)
    ↓
DiagnosticCart (cartId, references prescriptionId)
    ↓
DiagnosticOrder (orderId, references prescriptionId + cartId)
    ↓
Transaction (references orderId for payment tracking)
```

**Key Fields for Frontend:**
- **GET /member/diagnostics/prescriptions** response includes:
  - `hasOrder` (boolean): Whether order exists for this prescription
  - `orderCount` (number): Number of orders created from this prescription
  - `prescriptionId` (string): Unique prescription identifier

- **GET /member/diagnostics/orders** response includes:
  - `orderId` (string): Unique order identifier for tracking
  - `prescriptionId` (ObjectId): Link back to original prescription
  - `cartId` (string): Link to cart used for this order
  - `items` (array): Diagnostic tests/services in the order

**Bookings Display Logic:**
- **Pending Prescriptions** (hasOrder: false): Display with "Pending review and cart creation" badge
- **Active Carts**: Display with "Payment Pending" or cart status
- **Paid Orders**: Display with "Paid" badge and full order details

**Recent Prescriptions Limit:**
- `/member/diagnostics` page shows maximum 2 most recent prescriptions (changed from 5)

---

## Prescriptions (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/prescriptions | Get member's PDF prescriptions (filters out prescriptions already used for lab bookings) |
| GET | /member/prescriptions/:prescriptionId | Get prescription details |
| GET | /member/prescriptions/:prescriptionId/download | Download prescription |

---

## Digital Prescriptions (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/digital-prescriptions | Get member's digital prescriptions (filters out prescriptions already used for lab bookings) |
| GET | /member/digital-prescriptions/:prescriptionId | Get digital prescription details |
| GET | /member/digital-prescriptions/:prescriptionId/download-pdf | Download prescription PDF |

---

## Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /transactions | Get user transaction history with filters |
| GET | /transactions/summary | Get transaction summary statistics |
| GET | /transactions/:transactionId | Get transaction details by ID |

---

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /payments | Get user payment history with filters |
| GET | /payments/:paymentId | Get payment details by ID |
| POST | /payments | Create new payment request |

---

## Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /location/reverse-geocode | Reverse geocode coordinates to address |
| GET | /location/geocode | Forward geocode address query to coordinates |
| GET | /location/autocomplete | Location autocomplete search |

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | Get user notifications with filters |
| GET | /notifications/unread-count | Get unread notification count |
| PATCH | /notifications/:id/read | Mark notification as read |
| PATCH | /notifications/mark-all-read | Mark all notifications as read |

---

## Clinics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /clinics | Get all clinics with filters |
| GET | /clinics/:clinicId | Get clinic by ID |

---

## Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | Get all categories |

---

## Dental Bookings (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/benefits/CAT006/services | Get dental services assigned to member based on policy |
| GET | /dental-bookings/clinics?serviceCode=:code&pincode=:pincode | Get clinics offering specific dental service by pincode/city |
| GET | /dental-bookings/slots?clinicId=:id&date=:date | Get available time slots for clinic on specific date |
| POST | /dental-bookings/validate | Pre-validate booking and return payment breakdown |
| POST | /dental-bookings | Create dental booking with payment processing |
| GET | /dental-bookings/user/:userId | Get all dental bookings for user |
| GET | /dental-bookings/:bookingId | Get single dental booking details |
| PUT | /dental-bookings/:bookingId/cancel | Cancel dental booking and process refund (24 hours before appointment) |
| GET | /dental-bookings/:bookingId/invoice | Download invoice PDF for completed booking |

**Dental Booking Flow:**
1. Get assigned dental services from policy (CAT006 category)
2. Search clinics by pincode offering selected service
3. Select patient (self or family member)
4. View available slots and select date/time
5. Validate booking to get payment breakdown
6. Confirm booking with payment processing
7. View bookings in member portal
8. Download invoice after booking completion

**Payment Scenarios:**
- **Wallet Only**: Sufficient balance, no copay → Debit wallet immediately, status: CONFIRMED
- **Wallet + Copay**: Sufficient balance, copay required → Debit wallet for insurance portion, create payment request for copay, status: PENDING_PAYMENT
- **Insufficient Balance**: Create payment request for shortfall + copay, status: PENDING_PAYMENT

**Validate Booking Request:**
```json
{
  "patientId": "member-or-family-member-id",
  "serviceCode": "DEN001",
  "clinicId": "CLN-001",
  "appointmentDate": "2025-12-20",
  "appointmentTime": "09:00",
  "slotId": "slot-configuration-id"
}
```

**Validate Booking Response:**
```json
{
  "billAmount": 5000,
  "insuranceEligibleAmount": 5000,
  "insurancePayment": 4000,
  "excessAmount": 1000,
  "copayAmount": 500,
  "totalMemberPayment": 1500,
  "walletDebitAmount": 4000,
  "breakdown": { "detailed payment calculation" }
}
```

**Notes:**
- Dental services availability depends on member's policy coverage (CAT006)
- Payment calculation includes copay based on relationship and service transaction limits
- Wallet deductions tracked with categoryCode: 'CAT006'
- Bookings require available slot capacity (prevents double booking)
- Cancellation allowed up to 24 hours before appointment, processes refund to wallet
- Invoice generated automatically when booking is completed by operations
- All bookings create transaction summary records for audit trail
- Invoice includes payment breakdown, service details, and clinic information

---

## Vision Bookings (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/benefits/CAT007/services | Get vision services assigned to member based on policy |
| GET | /vision-bookings/clinics?serviceCode=:code&pincode=:pincode | Get clinics offering specific vision service by pincode/city |
| GET | /vision-bookings/slots?clinicId=:id&date=:date | Get available time slots for clinic on specific date |
| POST | /vision-bookings | Create vision booking (no payment processing at booking time) |
| POST | /vision-bookings/validate | Validate booking and get payment breakdown (used before payment) |
| POST | /vision-bookings/:bookingId/process-payment | Process payment for booking with generated bill |
| GET | /vision-bookings/user/:userId | Get all vision bookings for user |
| GET | /vision-bookings/:bookingId | Get single vision booking details |
| GET | /vision-bookings/:bookingId/invoice | Download invoice for completed booking |
| PUT | /vision-bookings/:bookingId/cancel | Cancel vision booking |

**Vision Booking Flow:**
1. Get assigned vision services from policy (CAT007 category)
2. Search clinics by pincode offering selected service
3. Select patient (self or family member)
4. View available slots and select date/time
5. Confirm booking (NO payment processing at this stage)
6. View bookings in member portal
7. Operations team confirms booking
8. **Operations team generates bill** with manually entered service cost
9. Member views and pays bill using wallet + copay
10. System auto-generates invoice after payment completion
11. Member downloads invoice

**Key Differences from Dental Bookings:**
- **Two-step payment**: Booking created without payment, bill generated later by operations
- **Manual pricing**: Operations admin manually enters service cost when generating bill
- **Delayed payment**: Member pays only after operations generates the bill
- **Same payment breakdown**: Uses wallet debit + copay calculation like dental bookings

**Booking Status Flow:**
```
PENDING_CONFIRMATION (created by member, paymentStatus='PENDING')
  ↓ (ops confirms)
CONFIRMED (billGenerated=false)
  ↓ (ops generates bill with service cost)
CONFIRMED (billGenerated=true, paymentStatus='PENDING')
  ↓ (member pays bill)
CONFIRMED (paymentStatus='COMPLETED', invoiceGenerated=true)
  ↓ (appointment completed)
COMPLETED

OR cancellation:
PENDING_CONFIRMATION/CONFIRMED (no bill) → CANCELLED (no refund needed)
CONFIRMED (bill generated, paid) → CANCELLED (refund processed)

OR no show:
CONFIRMED → NO_SHOW
```

**Create Booking Request:**
```json
{
  "patientId": "member-or-family-member-id",
  "clinicId": "CLN-001",
  "serviceCode": "VIS001",
  "serviceName": "Eye Consultation",
  "slotId": "slot-configuration-id",
  "price": 500,
  "appointmentDate": "2025-12-20",
  "appointmentTime": "10:00"
}
```

**Create Booking Response:**
```json
{
  "bookingId": "VIS-BOOK-1734567890-abc123",
  "status": "PENDING_CONFIRMATION",
  "paymentStatus": "PENDING",
  "appointmentDate": "2025-12-20",
  "appointmentTime": "10:00",
  "message": "Booking created successfully. Our operations team will confirm your appointment shortly."
}
```

**Notes:**
- Vision services availability depends on member's policy coverage (CAT007)
- Bookings require available slot capacity (prevents double booking)
- Cancellation allowed before appointment date (refund if payment completed)
- All bookings visible in member portal under "Vision" tab
- Category: CAT007 (Vision Care)
- Uses vision service slots created in operations portal
- **Payment processing**: Two-step process
  1. Operations confirms booking and generates bill with manual service cost
  2. Member pays using wallet + copay (similar to dental bookings)
  3. Invoice auto-generated after payment completion
- **Bill generation**: Operations admin manually enters actual service cost
- Member can view and pay bill from bookings page once bill is generated
- Invoice download available after payment completion

---

**Total Endpoints: ~97**
