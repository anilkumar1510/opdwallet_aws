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
| GET | /member/lab/carts/active | Get active carts for user |
| POST | /member/lab/orders/validate | Validate order and get payment breakdown |

---

## Diagnostics (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /member/diagnostics/prescriptions/upload | Upload diagnostic prescription |
| POST | /member/diagnostics/prescriptions/submit-existing | Submit existing health record prescription for diagnostics |
| GET | /member/diagnostics/prescriptions | Get user diagnostic prescriptions |
| GET | /member/diagnostics/prescriptions/:id | Get diagnostic prescription details |
| GET | /member/diagnostics/carts | Get diagnostic carts for user |
| GET | /member/diagnostics/carts/:cartId | Get diagnostic cart by ID |
| GET | /member/diagnostics/carts/:cartId/vendors | Get eligible vendors for cart items |
| GET | /member/diagnostics/carts/:cartId/vendors/:vendorId/pricing | Get vendor pricing for cart items |
| GET | /member/diagnostics/vendors/:vendorId/slots | Get available slots for diagnostic vendor |
| POST | /member/diagnostics/orders | Create diagnostic order |
| GET | /member/diagnostics/orders | Get user diagnostic orders |
| GET | /member/diagnostics/orders/:id | Get diagnostic order details |
| POST | /member/diagnostics/orders/:id/cancel | Cancel diagnostic order |
| GET | /member/diagnostics/orders/:id/reports | Get diagnostic order reports |
| POST | /member/diagnostics/orders/validate | Validate diagnostic order and get payment breakdown |

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
| GET | /member/digital-prescriptions/:prescriptionId/signature | Get prescription doctor signature |

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
| GET | /payments/summary/stats | Get payment summary statistics |
| POST | /payments | Create new payment request |
| POST | /payments/:paymentId/mark-paid | Mark payment as paid |
| POST | /payments/:paymentId/cancel | Cancel a payment |

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
| DELETE | /notifications/:id | Delete notification |

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

## AHC (Annual Health Check) - Member

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/ahc/package | Get AHC package assigned to member's policy |
| GET | /member/ahc/eligibility | Check if member can book AHC this policy year (once-per-year validation) |
| GET | /member/ahc/vendors/lab | Get eligible lab vendors for AHC package (by pincode) |
| GET | /member/ahc/vendors/diagnostic | Get eligible diagnostic vendors for AHC package (by pincode) |
| POST | /member/ahc/orders/validate | Validate AHC order and calculate payment breakdown (uses global copay, no service limits) |
| POST | /member/ahc/orders | Create AHC order after payment success (supports lab-only, diagnostic-only, or both) |
| GET | /member/ahc/orders | Get member's AHC orders (supports viewingUserId for family members) |
| GET | /member/ahc/orders/:orderId | Get specific AHC order details |
| GET | /member/ahc/reports/:orderId/lab | Download lab report (if uploaded) |
| GET | /member/ahc/reports/:orderId/diagnostic | Download diagnostic report (if uploaded) |

**AHC Booking Flow:**
1. Get AHC package assigned to member's policy
2. Check eligibility (once-per-year booking limit per policy year)
3. **If package has lab tests:**
   - Get eligible lab vendors by pincode
   - Select vendor, collection type (home/center), slot
4. **If package has diagnostic tests:**
   - Get eligible diagnostic vendors by pincode
   - Select vendor and slot (always center visit)
5. Validate order to get payment breakdown
6. Process payment using PaymentProcessor
7. Create AHC order (debits wallet, creates transaction)
8. View orders and download reports when uploaded

**Payment Calculation:**
- Uses **global policy copay** (NOT category-specific copay)
- **NO service transaction limits** applied to AHC
- Payment breakdown: Total amount - Wallet deduction = Copay (member pays)
- Wallet debit category: `CAT008` (Wellness)

**Order Status Flow:**
```
PLACED (pending collection)
  ↓
CONFIRMED (collection complete)
  ↓
COMPLETED (all reports uploaded)

OR → CANCELLED (can cancel before collection)
```

**Package Types Supported:**
- Lab-only packages (no diagnostic tests)
- Diagnostic-only packages (no lab tests)
- Full packages (both lab and diagnostic tests)

**Key Features:**
- Once-per-policy-year booking limit enforced
- Direct vendor selection (no cart creation)
- Home collection available for lab tests
- Diagnostic tests always center visit
- Dual report upload (lab and diagnostic in single request)
- Reports downloadable from member portal
- Transaction history tracked with `AHC_ORDER` service type

**Notes:**
- Eligibility checked based on policy year (calculated from assignment effectiveFrom)
- Vendors must support ALL services in the package to be eligible
- Payment processed before order creation (paymentAlreadyProcessed flag)
- Slots booked only if vendor and booking data provided
- Reports stored in `./uploads/ahc-reports/lab/` and `./uploads/ahc-reports/diagnostic/`

---

**Total Endpoints: ~107**
