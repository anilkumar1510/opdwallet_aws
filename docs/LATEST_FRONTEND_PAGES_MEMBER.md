# Member Portal Frontend Pages

This document lists all frontend pages/routes in the Member Portal (web-member).

**Redis Caching:** The Member Portal benefits from server-side Redis caching that significantly improves page load times and reduces database load. See `REDIS_CACHING.md` for comprehensive caching architecture and `LATEST_API_ENDPOINTS_MEMBER.md` for API-level cache details.

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

### Redis Caching Performance

**Home Page Optimization:** The `/member` dashboard is heavily optimized with Redis caching, significantly reducing database queries and improving response times.

**API Calls Made:**
1. **GET /api/member/profile** - Member profile with family, assignments, benefits
2. **GET /api/wallet/balance** - Wallet balance with category breakdown

**Caching Details:**

| Data | Cache Key | TTL | Hit Rate | Performance Gain |
|------|-----------|-----|----------|------------------|
| **Member Profile** | `member:profile:{userId}` | 10 minutes | 80-90% | 300-500ms → 50-100ms |
| **Wallet Balance** | `wallet:balance:{userId}` | 5 minutes | 70-80% | 200-300ms → 30-50ms |
| **Plan Config** | `plan:config:{policyId}` | 30 minutes | 95%+ | 100-200ms → 10-20ms |
| **Category Masters** | `category:masters:active` | 60 minutes | 98%+ | 50-100ms → 5-10ms |

**Database Impact:**
- **Before Caching:** 9-12 database queries per home page load
- **After Caching (Cache Hit):** 0 database queries
- **After Caching (Cache Miss):** 9-12 database queries + Redis SET operations
- **Overall Reduction:** 80-90% fewer database queries

**Response Time Improvements:**
- **Profile API:** 300-500ms → 50-100ms (70-80% faster)
- **Wallet API:** 200-300ms → 30-50ms (80-85% faster)
- **Total Page Load:** 800ms-1.2s → 300-500ms (60-75% faster)

**Cache Invalidation:**

The cache is automatically invalidated when data changes:

1. **Profile Updates** (`/member/profile` edit)
   - Invalidates: `member:profile:{userId}`

2. **Wallet Transactions** (appointments, claims, payments)
   - Invalidates: `wallet:balance:{userId}`
   - Cascade: Floater family members also invalidated

3. **Policy Changes** (admin portal assignments/unassignments)
   - Invalidates: `member:profile:{userId}` + `wallet:balance:{userId}`
   - Cascade: Entire floater family invalidated

4. **Plan Config Updates** (admin portal config changes)
   - Invalidates: `plan:config:{policyId}`
   - Cascade: All member profiles using this policy

**User Experience:**
- **First Load (Cache Miss):** Slightly slower as cache is populated (300-500ms)
- **Subsequent Loads (Cache Hit):** Very fast (50-100ms) for 5-10 minutes
- **After Data Change:** Cache invalidated, next load repopulates cache with fresh data
- **Seamless Updates:** Admin changes (policy assignment/unassignment) reflected immediately due to cache invalidation

**Monitoring:**

Cache performance can be monitored via API logs:
```bash
# Watch cache hits/misses
docker logs opd-api-dev -f | grep "CACHE"

# Example output:
# [CACHE HIT] member:profile:6960ed35cfa3c189f7556949
# [CACHE HIT] wallet:balance:6960ed35cfa3c189f7556949
# [CACHE MISS] member:profile:6960ed35cfa3c189f7556950
```

**Configuration:**

Cache TTLs are configurable via environment variables:
- `CACHE_TTL_PROFILE=600` (10 minutes)
- `CACHE_TTL_WALLET=300` (5 minutes)
- `CACHE_TTL_PLAN_CONFIG=1800` (30 minutes)
- `CACHE_TTL_CATEGORIES=3600` (60 minutes)

**Related Documentation:**
- Comprehensive caching architecture: `REDIS_CACHING.md`
- API endpoint cache details: `LATEST_API_ENDPOINTS_MEMBER.md`
- Redis configuration: `api/src/config/configuration.ts`

---

## Profile & Settings

| Path | Description |
|------|-------------|
| /member/profile | Edit member personal information and view dependents |
| /member/settings | Account settings, notifications, and preferences |

**Caching:** Profile data is cached with 10-minute TTL. When profile is updated via this page, cache is automatically invalidated to show changes immediately.

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

**Caching:**
- **Benefits Data:** Derived from member profile cache (10-minute TTL) and plan configuration cache (30-minute TTL)
- **Plan Configuration:** Heavily cached as it rarely changes (30-minute TTL, 95%+ hit rate)
- **Cache Invalidation:** When admin updates plan configuration, all affected member profiles are invalidated
- **Performance:** Benefits page loads 60-70% faster due to cached plan configurations

**Admin Changes:** When an admin updates policy benefits or plan configuration, changes are reflected within 30 minutes due to TTL, or immediately if cache is explicitly invalidated.

---

## Wallet & Transactions

| Path | Description |
|------|-------------|
| /member/wallet | Detailed wallet balance with category breakdown |
| /member/transactions | Complete transaction history with filters and analytics overview. Includes mobile-responsive analytics charts (Transaction Volume bar chart, 7-Day Trend chart, Category Split pie chart, Balance Trend line chart) with horizontal scroll on mobile and grid layout on desktop. |
| /member/orders | View all orders and transaction history |
| /member/orders/[transactionId] | View specific order details |

**Caching:**
- **Wallet Balance** (`/member/wallet`): Cached with 5-minute TTL due to medium volatility
- **Cache Invalidation:** Automatically invalidated on any wallet transaction (debit/credit)
  - Appointment bookings
  - Claim settlements
  - Payment processing
  - Lab/diagnostic test bookings
  - Admin-initiated transactions
- **Floater Wallets:** When a floater wallet is debited/credited, cache for entire family (primary + dependents) is invalidated
- **Transaction History** (`/member/transactions`): Not cached as it's read from transaction logs

**Performance:** Initial wallet load may take 200-300ms (cache miss), subsequent loads complete in 30-50ms (cache hit) for up to 5 minutes.

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
| /member/diagnostics/booking/[cartId] | Complete diagnostic booking with vendor, slot selection, and payment |
| /member/diagnostics/orders | View all diagnostic test orders |
| /member/diagnostics/orders/[orderId] | View diagnostic test order details |

**Note:** Diagnostics is a separate service from Lab Tests with its own vendors, pricing, and workflows

---

## Dental Services

| Path | Description |
|------|-------------|
| /member/dental | Dental services landing with service selection |
| /member/dental/clinics | Browse clinics offering dental services |
| /member/dental/select-patient | Select family member for dental appointment |
| /member/dental/select-slot | Select date and time slot for dental service |
| /member/dental/confirm | Review and confirm dental booking with payment |

---

## Vision Services

| Path | Description |
|------|-------------|
| /member/vision | Vision care services landing |
| /member/vision/clinics | Browse clinics offering vision services |
| /member/vision/select-patient | Select family member for vision appointment |
| /member/vision/select-slot | Select date and time slot for vision service |
| /member/vision/confirm | Review and confirm vision booking |
| /member/vision/payment/[bookingId] | Complete payment for vision booking |

---

## Health & Wellness

| Path | Description |
|------|-------------|
| /member/wellness | Wellness services page with AHC package display and booking |
| /member/health-checkup | Health checkup services and preventive care |
| /member/helpline | 24/7 helpline and support services |
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

**Total Pages: 64**

**Recent Updates:**
- Added AHC (Annual Health Check) booking flow with 3 pages
- Updated wellness page with AHC package display
- Added AHC tab to bookings page
- Extended PaymentProcessor for AHC service type
