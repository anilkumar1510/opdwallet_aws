# Member Portal Frontend Pages

This document lists all frontend pages/routes in the Member Portal (web-member).

---

## Authentication

| Path | Description |
|------|-------------|
| / | Member login page with email/password authentication |

---

## Dashboard

| Path | Description |
|------|-------------|
| /member | Main member dashboard with OPD cards, wallet balance, and quick actions. Includes mobile-responsive profile dropdown menu in top navigation with user info, profile switching, services access, and logout functionality. |

---

## Profile & Settings

| Path | Description |
|------|-------------|
| /member/profile | Edit member personal information and view dependents |
| /member/settings | Account settings, notifications, and preferences |

---

## Family Management

| Path | Description |
|------|-------------|
| /member/family | List all family members covered under policy |
| /member/family/add | Multi-step form to add new family member |

---

## Benefits & Policy

| Path | Description |
|------|-------------|
| /member/benefits | Comprehensive benefits overview with usage tracking |
| /member/policy-details/[policyId] | View detailed policy information |

---

## Wallet & Transactions

| Path | Description |
|------|-------------|
| /member/wallet | Detailed wallet balance with category breakdown |
| /member/transactions | Complete transaction history with filters and analytics overview. Includes mobile-responsive analytics charts (Transaction Volume bar chart, 7-Day Trend chart, Category Split pie chart, Balance Trend line chart) with horizontal scroll on mobile and grid layout on desktop. |
| /member/orders | View all orders and transaction history |
| /member/orders/[transactionId] | View specific order details |

---

## In-Clinic Appointments

| Path | Description |
|------|-------------|
| /member/appointments | List all in-clinic appointments |
| /member/appointments/specialties | Browse specialties for in-clinic booking |
| /member/appointments/doctors | Select doctor with location filters |
| /member/appointments/select-patient | Select family member for appointment |
| /member/appointments/select-slot | Select date and time slot |
| /member/appointments/confirm | Review and confirm appointment with payment |

---

## Online Consultations

| Path | Description |
|------|-------------|
| /member/online-consult | List all online consultations |
| /member/online-consult/specialties | Browse specialties for online consultation |
| /member/online-consult/doctors | Select doctor for online consultation |
| /member/online-consult/confirm | Review and confirm online consultation |

---

## Consultations & Prescriptions

| Path | Description |
|------|-------------|
| /member/consultations/[appointmentId] | View consultation details and prescriptions |
| /member/health-records | Access prescriptions and medical documents |

---

## Claims

| Path | Description |
|------|-------------|
| /member/claims | View all submitted claims with status tracking |
| /member/claims/new | Multi-step claim filing form with document upload |
| /member/claims/[id] | View detailed claim information |

---

## Lab Tests

| Path | Description |
|------|-------------|
| /member/lab-tests | View lab test prescriptions and orders with enhanced UI (shows upload time, lab tests included, order status badges) |
| /member/lab-tests/upload | Upload lab test prescription |
| /member/lab-tests/cart/[id] | View and edit lab test cart |
| /member/lab-tests/cart/[id]/vendor/[vendorId] | Select lab vendor for tests |
| /member/lab-tests/booking/[cartId] | Complete lab test booking with 3-step wizard (vendor selection, slot booking, payment processing) |
| /member/lab-tests/orders | View all lab test orders |
| /member/lab-tests/orders/[orderId] | View lab test order details |

**Lab Booking Flow:**
1. **Step 1 - Vendor Selection**: Choose from assigned vendors with detailed pricing breakdown for each test
2. **Step 2 - Slot Selection**: Select collection type (Home Collection with charges or Lab Visit), appointment date, and available time slot
3. **Step 3 - Payment**: Review booking summary, validate order, and complete payment with insurance calculation and wallet deduction
4. **Confirmation**: Display booking success with order ID and appointment details

---

## Diagnostic Services

| Path | Description |
|------|-------------|
| /member/diagnostics | View diagnostic test prescriptions and orders with enhanced UI (separate from lab tests) |
| /member/diagnostics/upload | Upload diagnostic test prescription |
| /member/diagnostics/cart/[id] | View and edit diagnostic test cart |
| /member/diagnostics/cart/[id]/vendor/[vendorId] | Select diagnostic center/vendor |
| /member/diagnostics/orders | View all diagnostic test orders |
| /member/diagnostics/orders/[orderId] | View diagnostic test order details |

**Note:** Diagnostics is a separate service from Lab Tests with its own vendors, pricing, and workflows

---

## Health & Wellness

| Path | Description |
|------|-------------|
| /member/wellness | Wellness services page with AHC package display and booking |
| /member/dental | Dental care services (coming soon) |
| /member/vision | Eye care and vision services (coming soon) |
| /member/pharmacy | Medicine ordering service (coming soon) |

---

## AHC (Annual Health Check) Booking

| Path | Description |
|------|-------------|
| /member/ahc/booking | Lab vendor selection for AHC package (Step 1 for packages with lab tests) |
| /member/ahc/booking/diagnostic | Diagnostic vendor selection for AHC package (Step 1 for diagnostic-only, Step 2 for full packages) |
| /member/ahc/booking/payment | Payment summary and booking confirmation (Final step) |

**AHC Booking Flow:**
1. **Wellness Page** (`/member/wellness`)
   - Display AHC package assigned to member's policy
   - Show eligibility status (once-per-policy-year)
   - "Book your annual health check today" button
   - Warning if already booked this year with link to existing order

2. **Navigation Based on Package Type:**
   - **Lab-only package:** Wellness → Lab Booking → Payment
   - **Diagnostic-only package:** Wellness → Diagnostic Booking → Payment
   - **Full package (both):** Wellness → Lab Booking → Diagnostic Booking → Payment

3. **Lab Vendor Selection** (`/member/ahc/booking`)
   - Display AHC package summary with test counts
   - List eligible lab vendors by pincode
   - Collection type selection (Home Collection or Center Visit)
   - Home collection address form (if home collection selected)
   - Date and time slot selection
   - Navigate to diagnostic booking (if package has diagnostic tests) or payment

4. **Diagnostic Vendor Selection** (`/member/ahc/booking/diagnostic`)
   - Display lab booking summary (if previous step completed)
   - List eligible diagnostic vendors by pincode
   - Date and time slot selection
   - Always center visit (no home collection for diagnostics)
   - Step indicator adjusts based on package type:
     - "Step 1 of 2" for diagnostic-only packages
     - "Step 2 of 3" for full packages

5. **Payment Summary** (`/member/ahc/booking/payment`)
   - Complete booking summary (lab and/or diagnostic)
   - Test list with vendor details
   - Collection/appointment date and time
   - Address for home collection (if applicable)
   - Payment breakdown with global copay calculation
   - PaymentProcessor component integration
   - After payment success, order created and user redirected to bookings

**Key Features:**
- Dynamic navigation based on package contents
- Conditional display of lab/diagnostic sections
- Auto-expand sections when reports available
- Download reports when uploaded by operations
- Payment integration with global policy copay
- No service transaction limits applied
- SessionStorage for booking flow state management

**Components:**
- `AHCPackageCard` - Package display on wellness page
- `VendorSelectionCard` - Vendor selection with pricing
- `AHCSlotSelector` - Date and time slot picker
- `AHCBookingSummary` - Booking review with pricing
- `AHCOrderCard` - Order display in bookings page
- `PaymentProcessor` - Payment handling (extended for AHC)

---

## Bookings

| Path | Description |
|------|-------------|
| /member/bookings | Multi-tab view for doctors, lab, diagnostic, dental, vision, and AHC bookings (supports tab navigation via ?tab=ahc query parameter) |
| /member/bookings/new | Multi-step booking wizard |
| /member/services | Directory of all available services |

**Bookings Tabs:**
1. **Doctors** - In-clinic and online consultation appointments
2. **Lab** - Lab test orders and prescriptions
3. **Diagnostic** - Diagnostic test orders (separate from lab)
4. **Dental** - Dental service bookings
5. **Vision** - Vision care bookings
6. **Pharmacy** - Medicine orders (coming soon)
7. **AHC** - Annual Health Check orders with report downloads

**AHC Tab Features:**
- Display all AHC orders with status badges
- Collapsible lab and diagnostic test sections
- "Report Available" badges when reports uploaded
- Auto-expand sections when reports available
- View/download lab and diagnostic reports
- Show booking details (vendor, date, time, collection type)
- Payment summary with breakdown
- Conditional display (only show lab section if package has lab tests, same for diagnostic)

---

## Payments

| Path | Description |
|------|-------------|
| /member/payments/[paymentId] | View payment details |

---

**Total Pages: ~52**

**Recent Updates:**
- Added AHC (Annual Health Check) booking flow with 3 pages
- Updated wellness page with AHC package display
- Added AHC tab to bookings page
- Extended PaymentProcessor for AHC service type
