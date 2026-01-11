# Operations Portal Frontend Pages

This document lists all frontend pages/routes in the Operations Portal (web-operations) for operational management.

**Portal URL:** `/operations`
**Port (dev):** 3005
**Roles:** OPS

---

## Authentication

| Path | Description |
|------|-------------|
| /login | Operations portal login page with role validation (OPS only) |

---

## Dashboard

| Path | Description |
|------|-------------|
| /operations | Operations dashboard with key metrics and activity overview |

---

## Member Management

| Path | Description |
|------|-------------|
| /operations/members | Search and browse all members with pagination |
| /operations/members/[id] | Comprehensive member profile with wallet details and topup functionality |

---

## Appointment Management

| Path | Description |
|------|-------------|
| /operations/appointments | View and manage all appointments with filtering and status updates |

---

## Doctor Management

| Path | Description |
|------|-------------|
| /operations/doctors | Manage doctor profiles with activation/deactivation |
| /operations/doctors/new | Create new doctor profile with specialization |
| /operations/doctors/[id] | Edit existing doctor profile details |
| /operations/doctors/[id]/schedules | Manage doctor appointment schedules and slot configurations |

---

## Clinic Management

| Path | Description |
|------|-------------|
| /operations/clinics | Manage clinic information with filters |
| /operations/clinics/new | Create new clinic with location and operating hours |
| /operations/clinics/[id] | Edit existing clinic details and status |

---

## Dental Services

| Path | Description |
|------|-------------|
| /operations/dental-services | Manage dental services at clinic level with pricing configuration (clinic details accessed via modals/drawers, not separate routes) |

---

## Vision Services

| Path | Description |
|------|-------------|
| /operations/vision-services | Manage vision services at clinic level - no pricing (clinic details accessed via modals/drawers, not separate routes) |

---

## Prescriptions Management (Unified)

| Path | Description |
|------|-------------|
| /operations/prescriptions | Unified prescriptions page with tab-based navigation (Lab + Diagnostic)<br>- Query params: `?tab=lab\|diagnostic`, `?status=UPLOADED\|DIGITIZED\|DELAYED`<br>- Features: View/preview prescriptions, filter by status, digitize workflow<br>- PDF and image support in preview modal<br>- "Digitize" button hidden for DIGITIZED prescriptions |
| /operations/lab/prescriptions/[id]/digitize | Digitize lab prescription: search tests, select vendors, create cart |
| /operations/diagnostics/prescriptions/[id]/digitize | Digitize diagnostic prescription: search services, select vendors, create cart |

---

## Orders Management (Unified)

| Path | Description |
|------|-------------|
| /operations/orders | Unified orders page with tab-based navigation (Lab + Diagnostic + AHC)<br>- Query params: `?tab=lab\|diagnostic\|ahc`, `?status=PLACED\|CONFIRMED\|COMPLETED`<br>- Features: Confirm orders, upload reports via modal, track status<br>- Lab workflow: PLACED → CONFIRMED → SAMPLE_COLLECTED → COMPLETED<br>- Diagnostic workflow: PLACED → CONFIRMED → COMPLETED (skips sample collection)<br>- **AHC workflow: PLACED → CONFIRMED → COMPLETED (dual report upload)**<br>- Report upload modal supports PDF and images |

**AHC Tab Features:**
- Display all AHC orders with patient name, package name, lab/diagnostic vendor names
- Status filter dropdown with AHC-specific statuses:
  - `PLACED` (Pending Collection)
  - `CONFIRMED` (Collection Complete)
  - `LAB_COMPLETED` (Lab report uploaded)
  - `DIAGNOSTIC_COMPLETED` (Diagnostic report uploaded)
  - `COMPLETED` (All reports uploaded)
  - `CANCELLED` (Order cancelled)
- Action buttons:
  - **Mark Collection Complete** (for PLACED status) - Changes status to CONFIRMED
  - **Upload Reports** (for CONFIRMED status) - Opens dual upload modal
  - **Cancel Order** (for PLACED status) - Cancel with reason
  - **View Details** (eye icon) - View order details in modal
- **Dual Report Upload Modal:**
  - Single modal with two file upload fields
  - Lab report upload (conditional - only if package has lab tests)
  - Diagnostic report upload (conditional - only if package has diagnostic tests)
  - At least one report required if both available
  - Auto-upload both reports in single API call
  - Order auto-completes when all required reports uploaded
- Order details modal shows:
  - Package information with test lists
  - Lab vendor details and test items (if applicable)
  - Diagnostic vendor details and test items (if applicable)
  - Payment breakdown
  - Booking details (dates, times, collection type)
  - Collection address for home collection

**AHC vs Lab/Diagnostic Orders:**
| Feature | Lab Orders | Diagnostic Orders | AHC Orders |
|---------|-----------|------------------|------------|
| Report Upload | Single file (lab report) | Single file (diagnostic report) | Dual file (lab + diagnostic) |
| Sample Collection | Yes (SAMPLE_COLLECTED status) | No | No |
| Home Collection | Yes | Yes | Yes (lab only) |
| Status Flow | 4 steps | 3 steps | 3 steps |
| Modal Type | Single upload | Single upload | Dual upload |
| Vendor Display | One vendor | One vendor | Two vendors (lab + diagnostic) |

---

**Total Pages: 18**

**Key Features:**
- Independent authentication with `/operations` cookie path
- OPS role-only access control
- Comprehensive member management with wallet topup
- Doctor and clinic lifecycle management
- Dental service pricing configuration per clinic
- Vision service management (operations-only booking)
- **Unified tab-based interface** for Lab and Diagnostic prescriptions/orders
- Prescription digitization workflow with test/service selection
- Order management with status-based workflows
- **Report upload via modal** supporting PDF and images
- **Prescription preview modal** supporting PDF and images
- Status filtering for prescriptions (UPLOADED, DIGITIZED, DELAYED)
- Conditional action buttons based on prescription/order status
- Different workflows for Lab (sample collection) vs Diagnostic (direct report upload)
- Appointment confirmation and cancellation workflows
- Real-time booking status updates

**Recent Updates:**
- Consolidated separate Lab/Diagnostic pages into unified Prescriptions and Orders pages
- Added tab-based navigation to reduce navigation complexity
- Implemented report upload modal instead of separate pages
- Enhanced PDF support in prescription preview modal
- Fixed report URL routing with proper `/api/` prefix
- Added status filtering support for prescription queries
- Conditional display of "Digitize" button (hidden for DIGITIZED prescriptions)
- **Added AHC (Annual Health Check) tab to Orders page**
- **Implemented dual report upload modal for AHC orders (lab + diagnostic in single request)**
- **Dynamic display of vendor information based on package type (lab-only, diagnostic-only, or both)**
- **AHC-specific status workflow with auto-completion when all reports uploaded**
