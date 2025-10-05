# OPERATIONS PORTAL - Complete Documentation

**Last Updated**: October 5, 2025
**Portal URL**: http://51.20.125.246/operations
**Access Roles**: OPS, ADMIN, SUPER_ADMIN
**Version**: 1.0

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Access & Authentication](#access--authentication)
3. [Navigation Structure](#navigation-structure)
4. [Dashboard](#dashboard)
5. [Doctors Management](#doctors-management)
6. [Clinics Management](#clinics-management)
7. [Appointments Management](#appointments-management)
8. [Lab Diagnostics Module](#lab-diagnostics-module)
   - [Prescription Digitization Queue](#prescription-digitization-queue)
   - [Lab Orders Management](#lab-orders-management)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Workflows & Step-by-Step Guides](#workflows--step-by-step-guides)
11. [Frontend Pages Reference](#frontend-pages-reference)

---

## OVERVIEW

### What is the Operations Portal?

The Operations Portal is a unified administrative interface designed for the operations team (OPS role) to manage day-to-day operational tasks in the OPD Wallet system. It consolidates critical workflows including doctor management, appointment coordination, and lab diagnostic order processing into a single, streamlined portal.

### Who Uses It?

**Primary Users:**
- **OPS Team**: Operations staff responsible for daily administrative tasks
- **ADMIN**: Administrators with elevated access
- **SUPER_ADMIN**: System administrators with full access

### Key Capabilities

The Operations Portal provides the following core functionalities:

1. **Doctor & Clinic Management**: View and manage doctor profiles, clinics, and scheduling
2. **Appointment Coordination**: View, confirm, and manage patient appointments
3. **Lab Prescription Digitization**: Process uploaded prescriptions and create lab test carts
4. **Lab Order Management**: Track and manage lab orders from confirmation to report delivery
5. **Operational Dashboard**: Real-time overview of pending tasks and system status

### Portal Location

- **URL**: `/operations` (unified portal)
- **Base URL**: http://51.20.125.246/operations
- **Hosted On**: Admin portal container (Port 3001)
- **Architecture**: Next.js 15 (App Router)

---

## ACCESS & AUTHENTICATION

### Role-Based Access Control

The Operations Portal implements role-based access control (RBAC) to ensure secure and appropriate access:

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **OPS** | Operations | Full access to all operations features |
| **ADMIN** | Administrative | Full access + user management |
| **SUPER_ADMIN** | System-Wide | Full access + system configuration |

### Authentication Flow

```
1. User Login
   ↓
   Navigate to: /operations
   ↓
2. JWT Token Validation
   - Cookie: opd_session
   - Expiry: 7 days
   - Algorithm: RS256
   ↓
3. Role Check
   - Allowed roles: OPS, ADMIN, SUPER_ADMIN
   - Redirect if unauthorized
   ↓
4. Portal Access Granted
   - Load dashboard
   - Show navigation menu
   - Display assigned tasks
```

### Access Requirements

**Required Credentials:**
- Valid user account with OPS, ADMIN, or SUPER_ADMIN role
- Active status (not disabled/inactive)
- Valid JWT token (auto-renewed on activity)

**Session Management:**
- Session duration: 7 days
- Auto-logout on token expiry
- Secure HTTP-only cookies
- SameSite: Lax (production: Strict)

---

## NAVIGATION STRUCTURE

The Operations Portal features a unified navigation sidebar with the following sections:

```
┌─────────────────────────────────────────────────┐
│              Operations Portal                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  📊 Dashboard                                    │
│     └─> /operations                              │
│                                                  │
│  👨‍⚕️ Doctors Management                           │
│     ├─> /operations/doctors                      │
│     └─> /operations/doctors/[id]                 │
│                                                  │
│  🏥 Clinics Management                           │
│     ├─> /operations/clinics                      │
│     └─> /operations/clinics/[id]                 │
│                                                  │
│  📅 Appointments                                 │
│     ├─> /operations/appointments                 │
│     └─> /operations/appointments/[id]            │
│                                                  │
│  🧪 Lab Diagnostics                              │
│     ├─> Prescription Queue                       │
│     │   ├─> /operations/lab/prescriptions        │
│     │   └─> /operations/lab/prescriptions/[id]/digitize │
│     │                                             │
│     └─> Lab Orders                               │
│         ├─> /operations/lab/orders               │
│         └─> /operations/lab/orders/[id]          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Navigation Highlights

- **Responsive Design**: Collapsible sidebar for mobile and tablet
- **Active State Indicators**: Highlights current section
- **Badge Notifications**: Shows pending counts for prescription queue and orders
- **Quick Actions**: Direct access to common tasks from navigation

---

## DASHBOARD

**Route**: `/operations`
**File**: `/web-admin/app/operations/page.tsx`

### Dashboard Overview

The Operations Portal dashboard provides a real-time overview of operational metrics and pending tasks.

### Key Metrics Displayed

```
┌──────────────────────────────────────────────────────────┐
│                   Operations Dashboard                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  📋 Pending Prescriptions                                │
│  ├─ Awaiting Digitization: 12                            │
│  ├─ Delayed (>24h): 3                                    │
│  └─ Total Queue: 15                                      │
│                                                           │
│  📦 Lab Orders                                            │
│  ├─ Pending Confirmation: 8                              │
│  ├─ Sample Collection Due: 5                             │
│  ├─ Reports Pending Upload: 7                            │
│  └─ Total Active Orders: 20                              │
│                                                           │
│  📅 Appointments                                          │
│  ├─ Pending Confirmation: 14                             │
│  ├─ Today's Appointments: 25                             │
│  └─ Upcoming (7 days): 87                                │
│                                                           │
│  👨‍⚕️ Doctors & Clinics                                    │
│  ├─ Active Doctors: 6                                    │
│  ├─ Active Clinics: 5                                    │
│  └─ Doctor Slots: 18                                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Quick Actions

The dashboard provides quick action buttons for common tasks:

- **Process Next Prescription** → Navigate to oldest pending prescription
- **View Pending Confirmations** → Filter appointments needing confirmation
- **Upload Lab Reports** → Jump to orders awaiting reports
- **Manage Doctors** → Access doctor management

---

## DOCTORS MANAGEMENT

**Route**: `/operations/doctors`
**API Base**: `/api/doctors`

### Overview

The Doctors Management module allows operations staff to view, create, update, and manage doctor profiles, including their clinic locations, specializations, and availability schedules.

### Features

- **Doctor Profiles**: Complete doctor information with qualifications and experience
- **Multi-Clinic Support**: Manage doctors practicing at multiple clinic locations
- **Specialization Management**: Link doctors to medical specialties
- **Availability Control**: Set online/offline consultation availability
- **Status Management**: Activate/deactivate doctor profiles

### Doctor List View

**Route**: `/operations/doctors`

```
┌─────────────────────────────────────────────────────────────┐
│  Doctors Management                         [+ Add Doctor]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Search: [____________]    Specialty: [All ▼]  Status: [All ▼] │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Dr. Vikas Mittal                                       │ │
│  │ General Physician • 16 years exp • ⭐ 4.7 (156)       │ │
│  │ MBBS, MD                                               │ │
│  │ 📍 Manipal Hospital, Dwarka                           │ │
│  │ 💰 ₹1,000 • 🟢 Online • 🏥 In-Clinic                 │ │
│  │ [View] [Edit] [Deactivate]                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Dr. Priya Sharma                                       │ │
│  │ Dermatologist • 12 years exp • ⭐ 4.8 (234)           │ │
│  │ MBBS, MD (Dermatology)                                │ │
│  │ 📍 Fortis Hospital, Vasant Kunj                       │ │
│  │ 💰 ₹1,200 • 🟢 Online Only                           │ │
│  │ [View] [Edit] [Deactivate]                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Previous] Page 1 of 3 [Next]                              │
└─────────────────────────────────────────────────────────────┘
```

### Doctor Detail View

**Route**: `/operations/doctors/[doctorId]`

Shows comprehensive doctor information including:

- Personal Information: Name, qualifications, specializations
- Contact Details: Phone, email, registration number
- Professional Details: Experience, rating, review count
- Languages: Array of languages spoken
- Clinic Locations: All associated clinics with addresses and fees
- Availability Settings: Online/offline consultation flags
- Insurance: Accepted insurance providers
- Booking Settings: Direct booking vs confirmation required

### API Endpoints for Doctors

```
GET    /api/doctors                      # List all doctors with filters
GET    /api/doctors/:doctorId            # Get doctor details by ID
POST   /api/doctors                      # Create new doctor
PUT    /api/doctors/:doctorId            # Update doctor
PATCH  /api/doctors/:doctorId/activate   # Activate doctor
PATCH  /api/doctors/:doctorId/deactivate # Deactivate doctor
```

**Query Parameters:**
- `specialtyId`: Filter by medical specialty
- `city`: Filter by clinic city
- `availableOnline`: Filter doctors offering online consultations
- `availableOffline`: Filter doctors offering in-clinic consultations

### Creating/Editing a Doctor

**Fields Required:**

**Basic Information:**
- Doctor ID (auto-generated)
- Full Name
- Qualifications (e.g., "MBBS, MD")
- Specializations (array)
- Specialty ID (links to specialty_master)

**Contact Information:**
- Phone number (optional)
- Email address (optional)
- Medical registration number (optional)

**Professional Details:**
- Years of experience
- Languages spoken (array, optional)
- Rating (auto-calculated)
- Review count (auto-calculated)

**Clinic Locations (at least one required):**
```javascript
{
  clinicId: "CLINIC001",
  name: "Manipal Hospital",
  address: "Sector 6, Dwarka, New Delhi",
  city: "Delhi (NCR)",
  state: "Delhi",
  pincode: "110075",
  location: {
    latitude: 28.5921,
    longitude: 77.046
  },
  consultationFee: 1000
}
```

**Availability Settings:**
- Available Online (boolean, default: true)
- Available Offline (boolean, default: true)
- Cashless Available (boolean, default: true)
- Insurance Accepted (array of providers)
- Requires Confirmation (boolean, default: false)
- Allow Direct Booking (boolean, default: true)

---

## CLINICS MANAGEMENT

**Route**: `/operations/clinics`
**API Base**: `/api/clinics`

### Overview

The Clinics Management module provides functionality to manage hospital and clinic locations where doctors provide consultations.

### Features

- **Clinic Profiles**: Complete clinic information with operating hours
- **Location Management**: Geo-coordinates for distance calculations
- **Operating Hours**: Day-wise schedule configuration
- **Facilities Tracking**: List of available services and facilities
- **Status Management**: Activate/deactivate clinic profiles

### Clinic List View

```
┌─────────────────────────────────────────────────────────────┐
│  Clinics Management                         [+ Add Clinic]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Search: [____________]    City: [All ▼]  Status: [Active ▼] │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Manipal Hospital Dwarka                                │ │
│  │ 📍 Sector 6, Dwarka, New Delhi - 110075               │ │
│  │ 📞 +91-11-45801234                                     │ │
│  │ 🕐 Mon-Fri: 08:00-20:00 | Sat-Sun: 09:00-18:00       │ │
│  │ 🏥 Emergency • ICU • Laboratory • Pharmacy            │ │
│  │ [View] [Edit] [Deactivate]                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints for Clinics

```
GET    /api/clinics                      # List all clinics
GET    /api/clinics/:clinicId            # Get clinic details
POST   /api/clinics                      # Create new clinic
PUT    /api/clinics/:clinicId            # Update clinic
PATCH  /api/clinics/:clinicId/activate   # Activate clinic
PATCH  /api/clinics/:clinicId/deactivate # Deactivate clinic
DELETE /api/clinics/:clinicId            # Delete clinic
```

### Clinic Schema

**Required Fields:**
- Clinic ID (unique identifier)
- Name
- Address (full street address)
- City

**Optional Fields:**
- State
- Pincode
- Phone
- Email
- Location (latitude, longitude)
- Operating Hours (by day of week)
- Facilities (array of services)

**Operating Hours Format:**
```javascript
{
  "Monday": {
    "open": "08:00",
    "close": "20:00",
    "isClosed": false
  },
  "Tuesday": {
    "open": "08:00",
    "close": "20:00",
    "isClosed": false
  },
  // ... for each day
  "Sunday": {
    "open": "09:00",
    "close": "14:00",
    "isClosed": false
  }
}
```

---

## APPOINTMENTS MANAGEMENT

**Route**: `/operations/appointments`
**API Base**: `/api/appointments`

### Overview

The Appointments Management module allows operations staff to view all appointments, confirm pending bookings, and manage appointment statuses.

### Features

- **Appointment Queue**: View all pending confirmations
- **Status Management**: Confirm or cancel appointments
- **Filter & Search**: By status, type, date, doctor, or patient
- **Appointment Details**: Complete information including patient and clinic
- **Bulk Actions**: Process multiple confirmations

### Appointments List View

```
┌─────────────────────────────────────────────────────────────────┐
│  Appointments Management                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: [Pending ▼]  Type: [All ▼]  Date: [Today ▼]           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🟡 PENDING CONFIRMATION                                   │  │
│  │ APT-20251005-0012                                         │  │
│  │ Patient: John Doe (Self)                                  │  │
│  │ Doctor: Dr. Vikas Mittal (General Physician)             │  │
│  │ Date: Oct 10, 2025 • 10:00 AM                            │  │
│  │ Type: IN_CLINIC • Manipal Hospital, Dwarka               │  │
│  │ Fee: ₹1,000 • Insurance: Yes                             │  │
│  │ [Confirm] [Cancel] [View Details]                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🟢 CONFIRMED                                              │  │
│  │ APT-20251005-0013                                         │  │
│  │ Patient: Jane Smith (Spouse)                              │  │
│  │ Doctor: Dr. Priya Sharma (Dermatologist)                 │  │
│  │ Date: Oct 8, 2025 • 03:00 PM                             │  │
│  │ Type: ONLINE • Video Call: +91-9876543210                │  │
│  │ Fee: ₹800 • Insurance: Yes                               │  │
│  │ [View Details] [Cancel]                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Appointment Statuses

| Status | Description | Available Actions |
|--------|-------------|------------------|
| **PENDING_CONFIRMATION** | Awaiting confirmation | Confirm, Cancel |
| **CONFIRMED** | Appointment confirmed | Cancel, Mark Complete |
| **COMPLETED** | Appointment finished | View only |
| **CANCELLED** | Appointment cancelled | View only |

### API Endpoints for Appointments

```
GET    /api/appointments                         # Get all appointments
GET    /api/appointments/user/:userId            # Get user's appointments
GET    /api/appointments/:appointmentId          # Get appointment details
PATCH  /api/appointments/:appointmentId/confirm  # Confirm appointment
PATCH  /api/appointments/:appointmentId/cancel   # Cancel appointment
```

**Query Parameters:**
- `status`: Filter by appointment status
- `type`: Filter by appointment type (IN_CLINIC, ONLINE)
- `date`: Filter by appointment date
- `doctorId`: Filter by doctor

### Appointment Types

**IN_CLINIC Appointments:**
- Requires: Clinic details (ID, name, address)
- Shows: Physical location, directions
- Payment: At clinic or via insurance

**ONLINE Appointments:**
- Requires: Contact number, call preference (VOICE/VIDEO/BOTH)
- Optional: Clinic details
- Payment: Online or via insurance

---

## LAB DIAGNOSTICS MODULE

The Lab Diagnostics module manages the complete workflow from prescription upload to lab report delivery. It consists of two main workflows:

1. **Prescription Digitization Queue** - Process uploaded prescriptions
2. **Lab Orders Management** - Manage lab test orders and reports

---

### PRESCRIPTION DIGITIZATION QUEUE

**Route**: `/operations/lab/prescriptions`
**API Base**: `/api/ops/lab/prescriptions`

#### Overview

The Prescription Digitization Queue allows operations staff to process prescriptions uploaded by members. Staff digitize prescriptions by creating lab test carts with appropriate test items.

#### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         Lab Prescription Digitization Workflow               │
└─────────────────────────────────────────────────────────────┘

   Member Portal                Operations Portal
   ─────────────                ─────────────────

1. Upload Prescription
   │
   ├─> Image/PDF uploaded
   │   with patient details
   │
   └─> Status: UPLOADED
               │
               ▼
        2. Appears in OPS Queue
           (/operations/lab/prescriptions)
               │
               ▼
        3. OPS Opens Prescription
           - View uploaded images
           - See patient details
           - Check test requirements
               │
               ▼
        4. Digitize Prescription
           (/prescriptions/[id]/digitize)
           │
           ├─> Add test items to cart
           ├─> Select lab provider
           ├─> Set quantities
           ├─> Calculate pricing
           └─> Status: DIGITIZED
               │
               ▼
        5. Create Lab Order
           - Cart → Order conversion
           - Generate order ID
           - Assign to lab
           - Status: ORDER_CREATED
               │
               ▼
           Member receives order
           in Lab Orders section
```

#### Prescription Queue View

**Route**: `/operations/lab/prescriptions`
**Page**: `/web-admin/app/operations/lab/prescriptions/page.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  Lab Prescription Queue                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Status: [Uploaded ▼]  Date: [All Time ▼]  Sort: [Oldest ▼] │
│                                                               │
│  📋 Showing 15 pending prescriptions                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔴 URGENT - Uploaded 28 hours ago                      │  │
│  │ PRX-20251005-001                                        │  │
│  │ Patient: John Doe (UHID: UH001)                        │  │
│  │ Uploaded: Oct 3, 2025 10:30 AM                         │  │
│  │ Prescription Type: Blood Tests                          │  │
│  │ Files: 2 images (prescription.jpg, report.jpg)         │  │
│  │ [Digitize Now] [View Files] [Mark Delayed]            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🟡 Uploaded 12 hours ago                               │  │
│  │ PRX-20251005-002                                        │  │
│  │ Patient: Jane Smith (UHID: UH002)                      │  │
│  │ Uploaded: Oct 4, 2025 02:15 PM                         │  │
│  │ Prescription Type: Diagnostic Tests                     │  │
│  │ Files: 1 PDF (prescription.pdf)                        │  │
│  │ [Digitize Now] [View Files]                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  [Previous] Page 1 of 3 [Next]                               │
└──────────────────────────────────────────────────────────────┘
```

#### Prescription Digitization Page

**Route**: `/operations/lab/prescriptions/[id]/digitize`
**Page**: `/web-admin/app/operations/lab/prescriptions/[id]/digitize/page.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│  Digitize Prescription: PRX-20251005-001                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐  ┌────────────────────────────────────┐ │
│  │  Prescription      │  │  Patient Information                │ │
│  │  Preview           │  │                                     │ │
│  │                    │  │  Name: John Doe                    │ │
│  │  [Image Viewer]    │  │  UHID: UH001                       │ │
│  │                    │  │  Member ID: MEM001                 │ │
│  │  prescription.jpg  │  │  Contact: +91-9876543210           │ │
│  │                    │  │  Uploaded: Oct 3, 2025 10:30 AM    │ │
│  │  [← Prev] [Next →] │  │                                     │ │
│  │                    │  │  Prescription Type: Blood Tests     │ │
│  └────────────────────┘  │  Doctor: Dr. Amit Kumar            │ │
│                          └────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Create Test Cart                                         │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  Lab Provider: [Apollo Diagnostics ▼]                    │   │
│  │                                                           │   │
│  │  Test Items:                                              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Complete Blood Count (CBC)                         │  │   │
│  │  │ Qty: [1 ▼]  Price: ₹450  [Remove]                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Lipid Profile                                      │  │   │
│  │  │ Qty: [1 ▼]  Price: ₹800  [Remove]                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  [+ Add Test Item]                                        │   │
│  │                                                           │   │
│  │  ────────────────────────────────────────────────────    │   │
│  │  Subtotal: ₹1,250                                         │   │
│  │  Discount: ₹0                                             │   │
│  │  ────────────────────────────────────────────────────    │   │
│  │  Total Amount: ₹1,250                                     │   │
│  │                                                           │   │
│  │  Notes: [Optional notes for lab or patient]              │   │
│  │                                                           │   │
│  │  [Save as Draft] [Create Order]                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### API Endpoints for Prescriptions

```
GET    /api/ops/lab/prescriptions/queue             # Get prescription queue
       Query params: ?status=UPLOADED|DIGITIZED|DELAYED

GET    /api/ops/lab/prescriptions/:id               # Get prescription details
       Returns: Prescription data, files, patient info

POST   /api/ops/lab/prescriptions/:id/digitize      # Digitize prescription
       Body: {
         labProviderId: string,
         testItems: [
           {
             testId: string,
             testName: string,
             quantity: number,
             price: number
           }
         ],
         totalAmount: number,
         notes?: string
       }

PATCH  /api/ops/lab/prescriptions/:id/status        # Update prescription status
       Body: {
         status: 'UPLOADED' | 'DIGITIZED' | 'DELAYED' | 'ORDER_CREATED',
         notes?: string
       }
```

#### Prescription Status Flow

```
UPLOADED → In digitization queue
    │
    ├─> DIGITIZED → Cart created, ready for order
    │
    ├─> DELAYED → Marked for follow-up (>24h delay)
    │
    └─> ORDER_CREATED → Lab order generated
```

#### Step-by-Step: Digitizing a Prescription

**Step 1: Access Prescription Queue**
1. Navigate to `/operations/lab/prescriptions`
2. View list of uploaded prescriptions
3. Filter by status if needed (default: UPLOADED)
4. Click "Digitize Now" on a prescription

**Step 2: Review Prescription**
1. View uploaded prescription images/PDFs
2. Verify patient information (Name, UHID, Contact)
3. Note prescription type and doctor details
4. Use image viewer to zoom and navigate multiple files

**Step 3: Create Test Cart**
1. Select lab provider from dropdown
2. Click "+ Add Test Item"
3. Search and select required tests
4. Set quantity for each test (usually 1)
5. Verify pricing for each item
6. Review calculated total

**Step 4: Add Notes (Optional)**
1. Add special instructions for lab
2. Note any patient-specific requirements
3. Mention collection preferences

**Step 5: Complete Digitization**
1. Click "Save as Draft" to save progress, OR
2. Click "Create Order" to generate lab order
3. System creates order with status: PENDING_CONFIRMATION
4. Prescription status updated to: ORDER_CREATED
5. Member receives notification of order

**Step 6: Handle Delays**
1. If prescription cannot be processed within 24 hours
2. Click "Mark Delayed"
3. Add reason for delay in notes
4. Prescription remains in queue with DELAYED status
5. Priority flag helps identify for follow-up

---

### LAB ORDERS MANAGEMENT

**Route**: `/operations/lab/orders`
**API Base**: `/api/ops/lab/orders`

#### Overview

The Lab Orders Management module handles the complete lifecycle of lab diagnostic orders from confirmation to report delivery.

#### Order Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Lab Order Management Workflow                   │
└─────────────────────────────────────────────────────────────┘

     Digitization              Operations Portal
     ────────────              ─────────────────

1. Order Created (from cart)
        │
        └─> Status: PENDING_CONFIRMATION
                    │
                    ▼
            2. OPS Confirms Order
               (/operations/lab/orders)
               │
               ├─> Verify test items
               ├─> Confirm lab provider
               ├─> Set collection date
               └─> Status: CONFIRMED
                           │
                           ▼
                   Member receives confirmation
                   Sample collection scheduled
                           │
                           ▼
            3. Sample Collection
               │
               ├─> Mark as SAMPLE_COLLECTED
               ├─> Enter collection date/time
               ├─> Add technician notes
               └─> Status: SAMPLE_COLLECTED
                           │
                           ▼
                   Lab processes sample
                   (External lab workflow)
                           │
                           ▼
            4. Upload Lab Report
               (/orders/[id])
               │
               ├─> Upload PDF/images
               ├─> Verify report details
               ├─> Add lab comments
               └─> Status: REPORT_UPLOADED
                           │
                           ▼
            5. Complete Order
               │
               ├─> Notify member
               ├─> Make report available
               └─> Status: COMPLETED
                           │
                           ▼
                   Member views/downloads report
```

#### Lab Orders List View

**Route**: `/operations/lab/orders`
**Page**: `/web-admin/app/operations/lab/orders/page.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│  Lab Orders Management                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Status: [All ▼]  Date: [Last 7 Days ▼]  Lab: [All Providers ▼] │
│                                                                   │
│  Tabs: [Pending Confirmation (8)] [Sample Collection (5)]        │
│        [Report Upload (7)] [Completed] [All]                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🟡 PENDING CONFIRMATION                                     │  │
│  │ ORD-20251005-0045                                           │  │
│  │ Patient: John Doe (UHID: UH001)                            │  │
│  │ Lab: Apollo Diagnostics                                     │  │
│  │ Tests: CBC, Lipid Profile (2 items)                        │  │
│  │ Amount: ₹1,250                                              │  │
│  │ Created: Oct 5, 2025 09:15 AM                              │  │
│  │ [Confirm Order] [View Details] [Cancel]                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔵 CONFIRMED - Sample Collection Due                        │  │
│  │ ORD-20251005-0042                                           │  │
│  │ Patient: Jane Smith (UHID: UH002)                          │  │
│  │ Lab: Dr. Lal PathLabs                                      │  │
│  │ Tests: Thyroid Profile (1 item)                            │  │
│  │ Amount: ₹650                                                │  │
│  │ Collection Date: Oct 7, 2025 07:00 AM                      │  │
│  │ [Mark Collected] [View Details] [Reschedule]              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🟢 SAMPLE COLLECTED - Report Pending                        │  │
│  │ ORD-20251003-0038                                           │  │
│  │ Patient: Robert Johnson (UHID: UH003)                      │  │
│  │ Lab: Metropolis Healthcare                                  │  │
│  │ Tests: HbA1c, Fasting Blood Sugar (2 items)               │  │
│  │ Amount: ₹950                                                │  │
│  │ Collected: Oct 4, 2025 08:30 AM                            │  │
│  │ [Upload Report] [View Details]                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Order Detail View

**Route**: `/operations/lab/orders/[orderId]`

```
┌──────────────────────────────────────────────────────────────────┐
│  Lab Order: ORD-20251005-0045                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐│
│  │ Patient Info        │  │  Order Details                     ││
│  │                     │  │                                     ││
│  │ Name: John Doe      │  │  Status: CONFIRMED                 ││
│  │ UHID: UH001         │  │  Order ID: ORD-20251005-0045       ││
│  │ Member: MEM001      │  │  Created: Oct 5, 2025 09:15 AM    ││
│  │ Contact:            │  │  Confirmed: Oct 5, 2025 10:00 AM  ││
│  │ +91-9876543210      │  │                                     ││
│  │                     │  │  Lab Provider: Apollo Diagnostics  ││
│  │ Address:            │  │  Amount: ₹1,250                    ││
│  │ 123 Main St         │  │  Payment: Insurance Covered        ││
│  │ Mumbai, MH 400001   │  │                                     ││
│  └─────────────────────┘  │  Collection: Oct 7, 2025 07:00 AM ││
│                            └────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Test Items                                                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ 1. Complete Blood Count (CBC)              ₹450          │   │
│  │    Quantity: 1 | Test Code: CBC001                       │   │
│  │                                                           │   │
│  │ 2. Lipid Profile                           ₹800          │   │
│  │    Quantity: 1 | Test Code: LIP001                       │   │
│  │                                                           │   │
│  │    Subtotal:                               ₹1,250        │   │
│  │    Discount:                               ₹0            │   │
│  │    ─────────────────────────────────────────────────     │   │
│  │    Total:                                  ₹1,250        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Order Timeline                                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ✅ Order Created        Oct 5, 2025 09:15 AM            │   │
│  │ ✅ Order Confirmed      Oct 5, 2025 10:00 AM            │   │
│  │ 🔵 Sample Collection    Scheduled: Oct 7, 2025 07:00 AM │   │
│  │ ⏳ Report Upload        Pending                          │   │
│  │ ⏳ Order Complete       Pending                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [Mark Sample Collected] [Upload Report] [Cancel Order]          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### API Endpoints for Lab Orders

```
GET    /api/ops/lab/orders                        # Get all lab orders
       Query params: ?status=PENDING_CONFIRMATION|CONFIRMED|SAMPLE_COLLECTED|...

GET    /api/ops/lab/orders/:orderId               # Get order details

PATCH  /api/ops/lab/orders/:orderId/confirm       # Confirm lab order
       Body: {
         collectionDate: Date,
         collectionTime: string,
         labNotes?: string
       }

PATCH  /api/ops/lab/orders/:orderId/collect       # Mark sample collected
       Body: {
         collectedAt: Date,
         technicianName?: string,
         collectionNotes?: string
       }

POST   /api/ops/lab/orders/:orderId/reports/upload # Upload lab report
       Content-Type: multipart/form-data
       Body: {
         reportFile: File (PDF/Image),
         reportDate: Date,
         comments?: string
       }

PATCH  /api/ops/lab/orders/:orderId/complete      # Complete order
       Body: {
         completionNotes?: string
       }

PATCH  /api/ops/lab/orders/:orderId/status        # Update order status
       Body: {
         status: OrderStatus,
         notes?: string
       }
```

#### Order Status Flow

```
PENDING_CONFIRMATION
        │
        ├─> Confirm order
        │   Set collection date
        ▼
    CONFIRMED
        │
        ├─> Mark sample collected
        │   Enter collection details
        ▼
SAMPLE_COLLECTED
        │
        ├─> Upload lab report
        │   Attach PDF/images
        ▼
REPORT_UPLOADED
        │
        ├─> Complete order
        │   Notify member
        ▼
    COMPLETED
```

#### Step-by-Step: Processing a Lab Order

**WORKFLOW 1: Confirm Order**

1. Navigate to `/operations/lab/orders`
2. Filter for "Pending Confirmation" tab
3. Select an order to review
4. Verify:
   - Patient information is correct
   - Test items match prescription
   - Lab provider is appropriate
   - Pricing is accurate
5. Click "Confirm Order"
6. Set collection date and time
7. Add lab notes if needed
8. Submit confirmation
9. Order status → CONFIRMED
10. Member receives confirmation notification

**WORKFLOW 2: Mark Sample Collected**

1. Navigate to "Sample Collection" tab
2. Find order with upcoming/past collection date
3. Click "Mark Collected"
4. Enter collection details:
   - Actual collection date/time
   - Technician name (optional)
   - Collection notes (optional)
5. Submit sample collection
6. Order status → SAMPLE_COLLECTED
7. System starts tracking report upload timeline

**WORKFLOW 3: Upload Lab Report**

1. Navigate to "Report Upload" tab
2. Find order with collected sample
3. Click "Upload Report"
4. Upload report file:
   - Accepted formats: PDF, JPEG, PNG
   - Max size: 10MB
5. Enter report details:
   - Report date
   - Lab comments (optional)
6. Preview uploaded report
7. Submit report upload
8. Order status → REPORT_UPLOADED
9. Member receives notification

**WORKFLOW 4: Complete Order**

1. Open order with uploaded report
2. Verify report is correct and complete
3. Click "Complete Order"
4. Add completion notes (optional)
5. Confirm completion
6. Order status → COMPLETED
7. Member can now view/download report
8. Order archived in completed orders

#### Handling Delays

**Sample Collection Delays:**
- If sample not collected on scheduled date
- Click "Reschedule" on order
- Select new collection date
- Add reason for delay
- Notify member of new schedule

**Report Upload Delays:**
- Orders in SAMPLE_COLLECTED >48h highlighted
- Use filters to find delayed reports
- Follow up with lab provider
- Update member on expected timeline
- Mark order with delay notes

---

## API ENDPOINTS REFERENCE

### Complete Operations Portal API Endpoints

#### Doctors Management
```
GET    /api/doctors                      # List all doctors
GET    /api/doctors/:doctorId            # Get doctor by ID
POST   /api/doctors                      # Create new doctor (ADMIN only)
PUT    /api/doctors/:doctorId            # Update doctor (ADMIN only)
PATCH  /api/doctors/:doctorId/activate   # Activate doctor (ADMIN only)
PATCH  /api/doctors/:doctorId/deactivate # Deactivate doctor (ADMIN only)
```

#### Clinics Management
```
GET    /api/clinics                      # List all clinics
GET    /api/clinics/:clinicId            # Get clinic by ID
POST   /api/clinics                      # Create new clinic (ADMIN only)
PUT    /api/clinics/:clinicId            # Update clinic (ADMIN only)
PATCH  /api/clinics/:clinicId/activate   # Activate clinic (ADMIN only)
PATCH  /api/clinics/:clinicId/deactivate # Deactivate clinic (ADMIN only)
DELETE /api/clinics/:clinicId            # Delete clinic (ADMIN only)
```

#### Doctor Slots
```
GET    /api/doctor-slots                         # List all slots
GET    /api/doctor-slots/doctor/:doctorId        # Get doctor's slots
GET    /api/doctor-slots/clinic/:clinicId        # Get clinic's slots
GET    /api/doctor-slots/doctor/:doctorId/day/:dayOfWeek  # Get specific day slots
GET    /api/doctor-slots/:slotId                 # Get slot by ID
POST   /api/doctor-slots                         # Create slot (ADMIN only)
PUT    /api/doctor-slots/:slotId                 # Update slot (ADMIN only)
PATCH  /api/doctor-slots/:slotId/activate        # Activate slot
PATCH  /api/doctor-slots/:slotId/deactivate      # Deactivate slot
DELETE /api/doctor-slots/:slotId                 # Delete slot (ADMIN only)
```

#### Appointments
```
GET    /api/appointments                         # Get all appointments
GET    /api/appointments/user/:userId            # Get user's appointments
GET    /api/appointments/:appointmentId          # Get appointment by ID
PATCH  /api/appointments/:appointmentId/confirm  # Confirm appointment
PATCH  /api/appointments/:appointmentId/cancel   # Cancel appointment
```

#### Lab Prescriptions (Operations)
```
GET    /api/ops/lab/prescriptions/queue          # Get prescription queue
       Query: ?status=UPLOADED|DIGITIZED|DELAYED

GET    /api/ops/lab/prescriptions/:id            # Get prescription details

POST   /api/ops/lab/prescriptions/:id/digitize   # Digitize prescription
       Body: { labProviderId, testItems[], totalAmount, notes }

PATCH  /api/ops/lab/prescriptions/:id/status     # Update status
       Body: { status, notes }
```

#### Lab Orders (Operations)
```
GET    /api/ops/lab/orders                       # Get all orders
       Query: ?status=PENDING_CONFIRMATION|CONFIRMED|...

GET    /api/ops/lab/orders/:orderId              # Get order details

PATCH  /api/ops/lab/orders/:orderId/confirm      # Confirm order
       Body: { collectionDate, collectionTime, labNotes }

PATCH  /api/ops/lab/orders/:orderId/collect      # Mark sample collected
       Body: { collectedAt, technicianName, collectionNotes }

POST   /api/ops/lab/orders/:orderId/reports/upload # Upload report
       Body: FormData with reportFile, reportDate, comments

PATCH  /api/ops/lab/orders/:orderId/complete     # Complete order
       Body: { completionNotes }

PATCH  /api/ops/lab/orders/:orderId/status       # Update status
       Body: { status, notes }
```

---

## WORKFLOWS & STEP-BY-STEP GUIDES

### Complete Lab Diagnostics Workflow

**FROM MEMBER UPLOAD TO REPORT DELIVERY**

```
┌──────────────────────────────────────────────────────────────────┐
│     Complete Lab Diagnostics Workflow (End-to-End)               │
└──────────────────────────────────────────────────────────────────┘

DAY 0: Member Upload
──────────────────────
Member Portal → Lab Tests → Upload Prescription
- Member uploads prescription images/PDF
- Selects patient (self/dependent)
- Adds symptoms/notes
- Submits prescription
→ Status: UPLOADED
→ Appears in OPS prescription queue

DAY 0: OPS Digitization (Target: <4 hours)
────────────────────────────────────────────
Operations Portal → Lab → Prescriptions Queue
- OPS staff opens prescription
- Views uploaded files
- Reviews patient details
- Clicks "Digitize Now"

Digitization Page:
- Selects lab provider
- Adds test items to cart:
  * CBC - ₹450
  * Lipid Profile - ₹800
- Sets quantities
- Reviews total: ₹1,250
- Adds notes
- Clicks "Create Order"
→ Status: ORDER_CREATED
→ Lab order generated: ORD-20251005-0045

DAY 0-1: OPS Order Confirmation (Target: <24 hours)
──────────────────────────────────────────────────────
Operations Portal → Lab → Orders → Pending Confirmation
- OPS reviews order details
- Verifies test items
- Confirms lab provider
- Sets collection date: Oct 7, 2025 07:00 AM
- Adds lab notes
- Clicks "Confirm Order"
→ Status: CONFIRMED
→ Member receives SMS/email with collection details
→ Member sees order in "Lab Orders" section

DAY 1-2: Sample Collection
─────────────────────────────
Lab Technician Visit or Member Visit to Lab:
- Sample collected at home/lab
- Lab technician/OPS marks collection

Operations Portal → Lab → Orders → Collection Due
- Find order: ORD-20251005-0045
- Click "Mark Collected"
- Enter collection details:
  * Collection time: Oct 7, 2025 07:15 AM
  * Technician: Mr. Sharma
  * Notes: "All samples collected successfully"
- Submit
→ Status: SAMPLE_COLLECTED
→ Member receives confirmation

DAY 2-5: Lab Processing (External)
─────────────────────────────────────
Lab processes samples and generates report
(No system interaction during this time)

DAY 5: Report Upload
───────────────────────
Lab emails report to OPS team or provides access

Operations Portal → Lab → Orders → Report Upload
- Find order: ORD-20251005-0045
- Click "Upload Report"
- Select PDF file from computer
- Enter report date: Oct 8, 2025
- Add lab comments (if any)
- Preview uploaded report
- Submit
→ Status: REPORT_UPLOADED
→ Member receives notification: "Your lab report is ready"

DAY 5: Order Completion
────────────────────────
Operations Portal → Lab → Orders
- Open order: ORD-20251005-0045
- Review uploaded report
- Verify all details correct
- Click "Complete Order"
- Add completion notes
- Submit
→ Status: COMPLETED
→ Member can view/download report in portal

Member Portal:
- Member logs in
- Navigates to Lab Tests → My Orders
- Finds order: ORD-20251005-0045
- Status shows: "Completed"
- Clicks "View Report"
- Downloads PDF: report_ORD-20251005-0045.pdf
- Can share with doctor or keep for records
```

### Quick Reference: Common Tasks

**Task 1: Process Next Pending Prescription**
```
1. Go to /operations/lab/prescriptions
2. Click first item in queue (oldest first)
3. Review prescription images
4. Click "Digitize Now"
5. Add test items → Create Order
Time: 5-10 minutes
```

**Task 2: Confirm Batch of Orders**
```
1. Go to /operations/lab/orders
2. Filter: Pending Confirmation
3. For each order:
   - Review details
   - Set collection date
   - Confirm
4. Process 10-15 orders
Time: 15-20 minutes
```

**Task 3: Upload Reports for Ready Orders**
```
1. Go to /operations/lab/orders
2. Filter: Report Upload tab
3. For each order:
   - Upload PDF
   - Verify content
   - Complete order
4. Process 5-10 reports
Time: 10-15 minutes
```

**Task 4: Handle Delayed Prescriptions**
```
1. Dashboard shows: "Delayed: 3"
2. Go to Prescriptions Queue
3. Filter: Delayed (>24h)
4. For each:
   - Check delay reason
   - Contact member if needed
   - Digitize or escalate
Time: 20-30 minutes
```

---

## FRONTEND PAGES REFERENCE

### Complete Page Structure

```
/web-admin/app/operations/
│
├── layout.tsx                          # Operations portal layout with navigation
├── page.tsx                            # Dashboard (landing page)
│
├── doctors/
│   ├── page.tsx                        # Doctors list
│   └── [doctorId]/
│       └── page.tsx                    # Doctor details/edit
│
├── clinics/
│   ├── page.tsx                        # Clinics list
│   └── [clinicId]/
│       └── page.tsx                    # Clinic details/edit
│
├── appointments/
│   ├── page.tsx                        # Appointments list
│   └── [appointmentId]/
│       └── page.tsx                    # Appointment details
│
└── lab/
    ├── prescriptions/
    │   ├── page.tsx                    # Prescription queue
    │   └── [id]/
    │       └── digitize/
    │           └── page.tsx            # Digitization interface
    │
    └── orders/
        ├── page.tsx                    # Lab orders list
        └── [orderId]/
            └── page.tsx                # Order details & management
```

### Key Components

**Layout Component**: `/web-admin/app/operations/layout.tsx`
- Provides unified navigation sidebar
- Shows notification badges
- Manages authentication state
- Responsive design with mobile menu

**Dashboard Component**: `/web-admin/app/operations/page.tsx`
- Displays key metrics and counts
- Shows pending task summary
- Provides quick action buttons
- Links to all major sections

---

## TROUBLESHOOTING & FAQS

### Common Issues

**Issue 1: Prescription Not Appearing in Queue**
- **Check**: Prescription status is UPLOADED
- **Verify**: No database connectivity issues
- **Solution**: Refresh page, check filters

**Issue 2: Cannot Upload Lab Report**
- **Check**: File format (PDF, JPEG, PNG only)
- **Check**: File size (<10MB)
- **Solution**: Compress file or convert format

**Issue 3: Order Confirmation Fails**
- **Check**: Collection date is in future
- **Check**: All required fields filled
- **Solution**: Review form validation errors

### FAQs

**Q: How long should prescription digitization take?**
A: Target is <4 hours from upload. Urgent prescriptions should be processed within 2 hours.

**Q: What if lab report is not ready on time?**
A: Add delay notes, communicate with member, follow up with lab provider.

**Q: Can I edit an order after confirmation?**
A: Only ADMIN/SUPER_ADMIN can modify confirmed orders. Contact admin if changes needed.

**Q: How do I handle prescription with unclear tests?**
A: Contact member for clarification, or mark as DELAYED with notes explaining the issue.

**Q: What's the SLA for each stage?**
A:
- Digitization: <4 hours
- Order confirmation: <24 hours
- Sample collection: As scheduled
- Report upload: <24 hours after receiving from lab
- Order completion: <2 hours after report upload

---

## APPENDIX

### Database Collections Used

**Lab-Related Collections** (8 total):
1. `lab_prescriptions` - Uploaded prescriptions
2. `lab_carts` - Digitized test carts
3. `lab_orders` - Active lab orders
4. `lab_test_masters` - Available lab tests
5. `lab_providers` - Lab service providers
6. `lab_reports` - Uploaded reports metadata
7. `lab_transactions` - Payment transactions
8. `lab_audit_logs` - Lab workflow audit trail

**Other Referenced Collections**:
- `users` - Patient information
- `doctors` - Doctor profiles
- `clinics` - Clinic locations
- `appointments` - Appointment bookings
- `doctor_slots` - Doctor availability

### Status Enums

**Prescription Status:**
```typescript
enum PrescriptionStatus {
  UPLOADED = 'UPLOADED',
  DIGITIZED = 'DIGITIZED',
  DELAYED = 'DELAYED',
  ORDER_CREATED = 'ORDER_CREATED'
}
```

**Order Status:**
```typescript
enum OrderStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  REPORT_UPLOADED = 'REPORT_UPLOADED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

### Access URLs

**Development**:
- Operations Portal: http://localhost:3001/operations
- API Base: http://localhost:4000/api

**Production**:
- Operations Portal: http://51.20.125.246/operations
- API Base: http://51.20.125.246/api

---

**Document Maintained By**: Development Team
**For Support**: Contact OPS Manager or System Administrator
**Last Audit**: October 5, 2025
**Next Review**: Bi-weekly or after major updates

---

## CHANGE LOG

### Version 1.0 - October 5, 2025
- Initial documentation created
- Documented complete lab diagnostics workflow
- Added all API endpoints
- Included step-by-step guides
- Added troubleshooting section
