# Operations Platform Implementation Plan
## New Sub-Platform for Doctor and Appointment Management

**Date:** 2025-09-28
**Prepared by:** Claude Code
**Objective:** Design and implement a dedicated operations platform (`/operations`) for managing doctors and appointments

---

## Executive Summary

This document outlines the comprehensive plan to build a new **Operations Platform** - a third sub-platform alongside the existing Admin (`/admin`) and Member portals. This platform will serve operations staff (role: `OPS`) who need to manage doctors, their schedules/clinics, and handle appointment confirmations.

**Key Deliverables:**
1. New Next.js application at `/operations` route
2. Doctor management interface with CRUD operations
3. Appointment management with confirmation workflow
4. Role-based access control for OPS users
5. Integration with existing doctor and appointment APIs

**Estimated Effort:** 2-3 days for complete implementation

---

## 1. Current System Analysis

### 1.1 Existing Data Models

#### **Doctor Schema** (`doctor.schema.ts:48`)
```typescript
Collection: 'doctors'
Fields:
  - doctorId: string (unique)
  - name: string
  - profilePhoto?: string
  - qualifications: string
  - specializations: string[]
  - specialtyId: string (FK to specialty_master)
  - specialty: string
  - experienceYears: number
  - rating: number (default: 0)
  - reviewCount: number (default: 0)

  // Clinics (embedded array)
  - clinics: ClinicLocation[] {
      clinicId: string
      name: string
      address: string
      city: string
      state: string
      pincode: string
      location: { latitude, longitude }
      distanceKm: number
      consultationFee: number
    }

  - consultationFee: number
  - cashlessAvailable: boolean
  - insuranceAccepted: string[]
  - requiresConfirmation: boolean
  - allowDirectBooking: boolean

  // Slots (embedded array)
  - availableSlots: TimeSlot[] {
      date: string (YYYY-MM-DD)
      slots: string[] (e.g., "09:00 AM", "10:30 AM")
    }

  - availableOnline: boolean
  - availableOffline: boolean
  - isActive: boolean

Indexes:
  - specialtyId + isActive
  - doctorId
  - clinics.city
```

#### **Specialty Schema** (`specialty.schema.ts:6`)
```typescript
Collection: 'specialty_master'
Fields:
  - specialtyId: string (unique, e.g., "SP001")
  - code: string (unique)
  - name: string (e.g., "Cardiology")
  - description?: string
  - icon?: string
  - isActive: boolean
  - displayOrder?: number

Indexes:
  - isActive + displayOrder
  - code

Current Data: Multiple specialties exist in DB
```

#### **Appointment Schema** (`appointment.schema.ts:30`)
```typescript
Collection: 'appointments'
Fields:
  - appointmentId: string (unique)
  - appointmentNumber: string
  - userId: ObjectId (ref: 'User')
  - patientName: string
  - patientId: string
  - doctorId: string
  - doctorName: string
  - specialty: string
  - clinicId?: string
  - clinicName?: string
  - clinicAddress?: string
  - appointmentType: 'IN_CLINIC' | 'ONLINE'
  - appointmentDate: string (YYYY-MM-DD)
  - timeSlot: string (e.g., "09:00 AM")
  - consultationFee: number

  // Status Workflow
  - status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  - requestedAt?: Date
  - confirmedAt?: Date

  // Payment
  - paymentStatus: 'PENDING' | 'PAID' | 'FREE'
  - amountPaid: number (default: 0)
  - coveredByInsurance: boolean

  // Contact
  - contactNumber?: string
  - callPreference?: 'VOICE' | 'VIDEO' | 'BOTH'

Indexes:
  - userId + status
  - appointmentId
  - appointmentNumber
  - doctorId + appointmentDate

Current Data: 3 appointments exist in DB
                4 doctors exist in DB
```

### 1.2 Existing API Endpoints

**Doctors API** (assumed from service analysis):
- `GET /api/doctors` - List all doctors with filters (specialtyId, city, search, type)
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors` - Create new doctor (assumed)
- `PUT /api/doctors/:id` - Update doctor (assumed)
- `DELETE /api/doctors/:id` - Delete/deactivate doctor (assumed)

**Specialties API** (assumed):
- `GET /api/specialties` - List all active specialties

**Appointments API** (assumed):
- `GET /api/appointments` - List appointments with filters
- `GET /api/appointments/:id` - Get appointment details
- `PATCH /api/appointments/:id/confirm` - Confirm appointment (TO BE CREATED)
- `PATCH /api/appointments/:id/cancel` - Cancel appointment (assumed)

### 1.3 User Roles

**Current Roles** (`roles.enum.ts:1`):
```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // System admin
  ADMIN = 'ADMIN',              // Admin portal access
  TPA = 'TPA',                  // Third-party admin
  OPS = 'OPS',                  // Operations (NEW TARGET ROLE)
  MEMBER = 'MEMBER'             // External members
}
```

**Target Role:** `OPS` - Operations staff who manage doctors and appointments

---

## 2. Requirements Analysis

### 2.1 Functional Requirements

#### **FR-1: Operations Platform Structure**
- **FR-1.1:** Platform accessible at `/operations` route
- **FR-1.2:** Similar UI/UX to admin portal for consistency
- **FR-1.3:** Authentication required (OPS role only)
- **FR-1.4:** Dashboard with two main tabs: "Doctors" and "Appointments"

#### **FR-2: Doctor Management (Tab 1)**
- **FR-2.1:** List all doctors with pagination
- **FR-2.2:** Filters:
  - Specialty dropdown (from specialty_master)
  - Search by doctor name
  - Status filter (Active/Inactive)
- **FR-2.3:** Display doctor cards/table with:
  - Name, photo, qualifications
  - Specialty and experience
  - Number of clinics
  - Active status
- **FR-2.4:** CRUD Operations:
  - **Create:** Add new doctor with all fields
  - **Read:** View doctor detail page
  - **Update:** Edit doctor info, clinics, slots
  - **Delete:** Deactivate doctor (soft delete)
- **FR-2.5:** Clinic Management:
  - Add/edit/remove clinic locations
  - Set consultation fees per clinic
  - Manage clinic details (address, city, etc.)
- **FR-2.6:** Slot Management:
  - Add/edit/remove time slots per date
  - Bulk slot creation for multiple dates
  - Visual calendar view

#### **FR-3: Appointment Management (Tab 2)**
- **FR-3.1:** List appointments with filters:
  - Status filter (PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED)
  - Date range picker
  - Doctor filter
  - Specialty filter
  - Appointment type (ONLINE/IN_CLINIC)
- **FR-3.2:** Default view: Show only active appointments (not past)
- **FR-3.3:** Toggle to show "Old Appointments" (past appointment date/time)
- **FR-3.4:** Display appointment cards/table with:
  - Appointment number
  - Patient name
  - Doctor name and specialty
  - Date and time slot
  - Status badge
  - Appointment type badge
- **FR-3.5:** Appointment Actions:
  - **Confirm:** Change status from PENDING_CONFIRMATION → CONFIRMED
  - **View Details:** Full appointment information
  - **Cancel:** Change status to CANCELLED (if needed)
- **FR-3.6:** Real-time sync: Confirmed appointments reflect immediately on member portal

#### **FR-4: User Creation in Admin Portal**
- **FR-4.1:** Update user creation form to show role as dropdown
- **FR-4.2:** Role options:
  - Member (external users)
  - Admin (admin portal access)
  - Operations (operations portal access)
- **FR-4.3:** Backend validation: Map frontend labels to enum values
  - "Member" → `MEMBER`
  - "Admin" → `ADMIN` or `SUPER_ADMIN`
  - "Operations" → `OPS`
- **FR-4.4:** Prevent spelling mistakes with controlled dropdown

### 2.2 Non-Functional Requirements

#### **NFR-1: Security**
- Role-based access control (only OPS role can access `/operations`)
- JWT token validation
- CSRF protection

#### **NFR-2: Performance**
- Page load time < 2 seconds
- Appointment list should handle 1000+ records with pagination
- Doctor list should handle 500+ doctors

#### **NFR-3: Usability**
- Consistent UI with admin portal
- Mobile-responsive design
- Intuitive navigation

#### **NFR-4: Data Integrity**
- Appointment confirmation updates status atomically
- Optimistic UI updates with rollback on failure
- Data validation on both frontend and backend

---

## 3. Technical Architecture

### 3.1 Frontend Architecture

#### **Directory Structure**
```
web-admin/
├── app/
│   ├── operations/              # NEW: Operations platform root
│   │   ├── layout.tsx           # Operations layout (auth + nav)
│   │   ├── page.tsx             # Dashboard with tabs
│   │   ├── doctors/
│   │   │   ├── page.tsx         # Doctors list
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create doctor form
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # Doctor detail/edit
│   │   │       └── edit/
│   │   │           └── page.tsx # Edit doctor form
│   │   └── appointments/
│   │       ├── page.tsx         # Appointments list
│   │       └── [id]/
│   │           └── page.tsx     # Appointment detail
│   └── admin/                   # Existing admin platform
│       ├── users/
│       │   └── new/
│       │       └── page.tsx     # MODIFY: Add role dropdown
├── lib/
│   └── api/
│       ├── doctors.ts           # NEW: Doctor API client
│       ├── appointments.ts      # NEW: Appointment API client
│       └── specialties.ts       # NEW: Specialty API client
└── components/
    └── operations/              # NEW: Operations-specific components
        ├── DoctorCard.tsx
        ├── DoctorForm.tsx
        ├── ClinicForm.tsx
        ├── SlotManager.tsx
        ├── AppointmentCard.tsx
        └── AppointmentFilters.tsx
```

#### **Routing Strategy**
```
/operations                      → Dashboard (Doctors & Appointments tabs)
/operations/doctors              → Doctor list
/operations/doctors/new          → Create doctor form
/operations/doctors/:id          → Doctor detail view
/operations/doctors/:id/edit     → Edit doctor form
/operations/appointments         → Appointment list
/operations/appointments/:id     → Appointment detail
```

#### **Authentication Flow**
```typescript
// operations/layout.tsx
useEffect(() => {
  const checkAuth = async () => {
    const response = await apiFetch('/api/auth/me')
    const user = await response.json()

    // Check if user has OPS role
    if (user.role !== 'OPS') {
      router.push('/') // Redirect to login
    }
  }
  checkAuth()
}, [])
```

### 3.2 Backend Architecture

#### **Required API Endpoints**

**Doctors Module** (may already exist, needs verification):
```typescript
// GET /api/doctors
// Query params: specialtyId, city, search, type, page, limit
export class QueryDoctorsDto {
  specialtyId?: string;
  city?: string;
  search?: string;
  type?: 'ONLINE' | 'OFFLINE';
  page?: number;
  limit?: number;
}

// POST /api/doctors
// Create new doctor
export class CreateDoctorDto {
  name: string;
  qualifications: string;
  specializations: string[];
  specialtyId: string;
  experienceYears: number;
  clinics: ClinicLocationDto[];
  consultationFee: number;
  availableSlots?: TimeSlotDto[];
  availableOnline?: boolean;
  availableOffline?: boolean;
}

// PUT /api/doctors/:id
// Update doctor
export class UpdateDoctorDto {
  // Same fields as Create, all optional
}

// PATCH /api/doctors/:id/activate
// Activate doctor (set isActive = true)

// PATCH /api/doctors/:id/deactivate
// Deactivate doctor (set isActive = false)

// PATCH /api/doctors/:id/clinics
// Update clinics array
export class UpdateClinicsDto {
  clinics: ClinicLocationDto[];
}

// PATCH /api/doctors/:id/slots
// Update available slots
export class UpdateSlotsDto {
  availableSlots: TimeSlotDto[];
}
```

**Appointments Module**:
```typescript
// GET /api/appointments
// Query params: status, dateFrom, dateTo, doctorId, specialtyId, type, page, limit
export class QueryAppointmentsDto {
  status?: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
  doctorId?: string;
  specialtyId?: string;
  type?: 'IN_CLINIC' | 'ONLINE';
  includeOld?: boolean; // Include past appointments
  page?: number;
  limit?: number;
}

// PATCH /api/appointments/:id/confirm ✨ NEW ENDPOINT
// Confirm pending appointment
@Patch(':id/confirm')
@Roles(UserRole.OPS, UserRole.ADMIN)
async confirmAppointment(@Param('id') id: string) {
  return this.appointmentsService.confirmAppointment(id);
}

// Service method:
async confirmAppointment(appointmentId: string) {
  const appointment = await this.appointmentModel.findOne({ appointmentId });

  if (!appointment) {
    throw new NotFoundException('Appointment not found');
  }

  if (appointment.status !== 'PENDING_CONFIRMATION') {
    throw new BadRequestException('Only pending appointments can be confirmed');
  }

  appointment.status = 'CONFIRMED';
  appointment.confirmedAt = new Date();
  await appointment.save();

  return appointment;
}

// PATCH /api/appointments/:id/cancel
// Cancel appointment
async cancelAppointment(appointmentId: string, reason?: string) {
  // Similar logic for cancellation
}
```

**Specialties Module** (may already exist):
```typescript
// GET /api/specialties
// Get all active specialties
@Get()
async findAll() {
  return this.specialtiesService.findAll({ isActive: true });
}
```

#### **Guards and Decorators**

**Update RolesGuard** to allow OPS access:
```typescript
// Already exists, just needs to check for OPS role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
```

---

## 4. Implementation Roadmap

### Phase 1: Backend API Setup (Day 1 - Morning)

**Tasks:**
1. ✅ **Verify existing API endpoints**
   - Check if doctor CRUD endpoints exist
   - Check if appointment endpoints exist
   - Test with Postman/curl

2. 🔨 **Create missing endpoints** (if needed)
   - `POST /api/doctors` - Create doctor
   - `PUT /api/doctors/:id` - Update doctor
   - `PATCH /api/doctors/:id/clinics` - Update clinics
   - `PATCH /api/doctors/:id/slots` - Update slots
   - `PATCH /api/doctors/:id/activate` - Activate doctor
   - `PATCH /api/doctors/:id/deactivate` - Deactivate doctor

3. 🆕 **Create appointment confirmation endpoint**
   - Location: `/api/src/modules/appointments/appointments.controller.ts`
   - Add `@Patch(':id/confirm')` method
   - Implement `confirmAppointment()` service method
   - Add role guard: `@Roles(UserRole.OPS, UserRole.ADMIN)`

4. ✅ **Verify specialty API**
   - Ensure `GET /api/specialties` returns active specialties

5. 🧪 **Test all endpoints**
   - Use Postman collection
   - Verify data format
   - Test error cases

**Estimated Time:** 3-4 hours

---

### Phase 2: Admin Portal Role Dropdown (Day 1 - Afternoon)

**Tasks:**
1. 📝 **Update user creation form**
   - File: `/web-admin/app/admin/users/new/page.tsx`
   - Replace role text input with dropdown/select
   - Options:
     ```typescript
     const roleOptions = [
       { value: 'MEMBER', label: 'Member (External User)' },
       { value: 'ADMIN', label: 'Admin' },
       { value: 'OPS', label: 'Operations' }
     ]
     ```

2. 🎨 **Style dropdown**
   - Use existing UI component library
   - Match admin portal design

3. ✅ **Test user creation**
   - Create OPS user from admin portal
   - Verify role is saved correctly in DB
   - Test login with OPS credentials

**Estimated Time:** 1-2 hours

---

### Phase 3: Operations Platform Structure (Day 1 - Afternoon)

**Tasks:**
1. 📁 **Create directory structure**
   ```bash
   mkdir -p web-admin/app/operations/{doctors,appointments}/{new,[id]}
   mkdir -p web-admin/lib/api
   mkdir -p web-admin/components/operations
   ```

2. 🔐 **Create operations layout**
   - File: `/web-admin/app/operations/layout.tsx`
   - Copy structure from `admin/layout.tsx`
   - Update branding: "OPD Wallet Operations"
   - Add navigation items:
     - Dashboard
     - Doctors
     - Appointments
   - Implement auth check for OPS role

3. 🏠 **Create dashboard page**
   - File: `/web-admin/app/operations/page.tsx`
   - Tab component with two tabs:
     - "Doctors" tab
     - "Appointments" tab
   - Default to "Doctors" tab

4. 🎨 **Style operations platform**
   - Use same styles as admin portal
   - Ensure consistent branding
   - Responsive design

**Estimated Time:** 2-3 hours

---

### Phase 4: Doctors Tab Implementation (Day 2 - Morning)

**Tasks:**
1. 📡 **Create Doctor API client**
   - File: `/web-admin/lib/api/doctors.ts`
   - Methods:
     ```typescript
     export const doctorsApi = {
       getAll: (query: QueryDoctorsDto) => apiFetch('/api/doctors', {params: query}),
       getOne: (id: string) => apiFetch(`/api/doctors/${id}`),
       create: (data: CreateDoctorDto) => apiFetch('/api/doctors', {method: 'POST', body: data}),
       update: (id: string, data: UpdateDoctorDto) => apiFetch(`/api/doctors/${id}`, {method: 'PUT', body: data}),
       updateClinics: (id: string, clinics: ClinicLocationDto[]) => apiFetch(`/api/doctors/${id}/clinics`, {method: 'PATCH', body: {clinics}}),
       updateSlots: (id: string, slots: TimeSlotDto[]) => apiFetch(`/api/doctors/${id}/slots`, {method: 'PATCH', body: {availableSlots: slots}}),
       activate: (id: string) => apiFetch(`/api/doctors/${id}/activate`, {method: 'PATCH'}),
       deactivate: (id: string) => apiFetch(`/api/doctors/${id}/deactivate`, {method: 'PATCH'})
     }
     ```

2. 🏥 **Create doctors list page**
   - File: `/web-admin/app/operations/doctors/page.tsx`
   - Fetch doctors with filters
   - Display in grid/table format
   - Show: name, photo, specialty, experience, clinics count, status
   - Add "Create Doctor" button
   - Implement filters:
     - Specialty dropdown (from specialties API)
     - Search input (name)
     - Status toggle (Active/Inactive)
   - Pagination

3. 🆕 **Create doctor form page**
   - File: `/web-admin/app/operations/doctors/new/page.tsx`
   - Form fields:
     - Basic info: name, qualifications, experience
     - Specialty dropdown (from API)
     - Specializations (multi-input)
     - Consultation fee
     - Online/Offline availability toggles
     - Clinics section (add multiple)
     - Slots section (add multiple dates/times)
   - Validation
   - Submit to API

4. 📋 **Create doctor detail/edit page**
   - File: `/web-admin/app/operations/doctors/[id]/page.tsx`
   - Display doctor info
   - Edit mode toggle
   - Sections:
     - Basic Information (editable)
     - Clinics Management (add/edit/remove)
     - Slot Management (calendar view)
   - Activate/Deactivate button

5. 🏗️ **Create reusable components**
   - `DoctorCard.tsx` - Display doctor in grid
   - `DoctorForm.tsx` - Form for create/edit
   - `ClinicForm.tsx` - Form for clinic details
   - `SlotManager.tsx` - Calendar/time slot picker

**Estimated Time:** 4-5 hours

---

### Phase 5: Appointments Tab Implementation (Day 2 - Afternoon)

**Tasks:**
1. 📡 **Create Appointment API client**
   - File: `/web-admin/lib/api/appointments.ts`
   - Methods:
     ```typescript
     export const appointmentsApi = {
       getAll: (query: QueryAppointmentsDto) => apiFetch('/api/appointments', {params: query}),
       getOne: (id: string) => apiFetch(`/api/appointments/${id}`),
       confirm: (id: string) => apiFetch(`/api/appointments/${id}/confirm`, {method: 'PATCH'}),
       cancel: (id: string, reason?: string) => apiFetch(`/api/appointments/${id}/cancel`, {method: 'PATCH', body: {reason}})
     }
     ```

2. 📅 **Create appointments list page**
   - File: `/web-admin/app/operations/appointments/page.tsx`
   - Fetch appointments with filters
   - Default: Show only future appointments (appointmentDate >= today)
   - Toggle: "Show Old Appointments" (includes past appointments)
   - Display in table format
   - Columns: Appt #, Patient, Doctor, Specialty, Date, Time, Type, Status
   - Status badges with colors:
     - PENDING_CONFIRMATION: Yellow
     - CONFIRMED: Green
     - COMPLETED: Blue
     - CANCELLED: Red
   - Actions column:
     - "Confirm" button (for PENDING_CONFIRMATION only)
     - "View Details" link
   - Implement filters:
     - Status dropdown
     - Date range picker
     - Doctor dropdown
     - Specialty dropdown
     - Type dropdown (IN_CLINIC/ONLINE)
   - Pagination

3. ✅ **Implement confirm action**
   - onClick handler for "Confirm" button
   - Confirmation modal: "Are you sure you want to confirm this appointment?"
   - Call `appointmentsApi.confirm(id)`
   - Optimistic UI update
   - Show success notification
   - Reload list to reflect changes

4. 📋 **Create appointment detail page**
   - File: `/web-admin/app/operations/appointments/[id]/page.tsx`
   - Display full appointment details:
     - Patient info
     - Doctor info
     - Clinic info (if IN_CLINIC)
     - Date and time
     - Status history
     - Payment status
     - Contact details
   - Action buttons:
     - Confirm (if pending)
     - Cancel
     - Back to list

5. 🏗️ **Create reusable components**
   - `AppointmentCard.tsx` - Display appointment row
   - `AppointmentFilters.tsx` - Filter section
   - `StatusBadge.tsx` - Status indicator
   - `ConfirmationModal.tsx` - Confirm dialog

**Estimated Time:** 4-5 hours

---

### Phase 6: Integration and Testing (Day 3)

**Tasks:**
1. 🧪 **End-to-end testing**
   - Create OPS user from admin portal
   - Login with OPS credentials
   - Access `/operations` platform
   - Test doctor CRUD operations
   - Test appointment confirmation
   - Verify updates reflect on member portal

2. 🔒 **Security testing**
   - Verify role-based access (OPS can access, MEMBER cannot)
   - Test JWT expiration
   - Test CSRF protection

3. 📱 **Responsiveness testing**
   - Test on mobile devices
   - Test on tablets
   - Test on desktop

4. 🐛 **Bug fixes**
   - Fix any issues found during testing
   - Refine UI/UX

5. 📝 **Documentation**
   - Update README with operations platform info
   - Document API endpoints
   - Create user guide for operations staff

**Estimated Time:** 6-8 hours

---

## 5. Detailed Component Specifications

### 5.1 Operations Layout Component

**File:** `/web-admin/app/operations/layout.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await apiFetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()

        // Check if user has OPS role
        if (userData.role !== 'OPS') {
          alert('Access denied. Operations role required.')
          router.push('/')
          return
        }

        setUser(userData)
      } else {
        router.push('/')
        return
      }
    } catch (error) {
      router.push('/')
      return
    }
    setLoading(false)
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/operations',
      current: pathname === '/operations'
    },
    {
      name: 'Doctors',
      path: '/operations/doctors',
      current: pathname.startsWith('/operations/doctors')
    },
    {
      name: 'Appointments',
      path: '/operations/appointments',
      current: pathname.startsWith('/operations/appointments')
    },
  ]

  if (loading) {
    return <div className="loading-spinner">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="header">
        {/* Similar structure to admin layout */}
        <h1>OPD Wallet Operations</h1>
        {/* Navigation items */}
        {/* User menu with logout */}
      </nav>
      <main className="content-container">
        {children}
      </main>
    </div>
  )
}
```

---

### 5.2 Doctors List Page

**File:** `/web-admin/app/operations/doctors/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { doctorsApi } from '@/lib/api/doctors'
import { specialtiesApi } from '@/lib/api/specialties'
import { DoctorCard } from '@/components/operations/DoctorCard'

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  useEffect(() => {
    fetchData()
  }, [specialtyFilter, searchFilter, statusFilter])

  const fetchData = async () => {
    setLoading(true)

    // Fetch doctors with filters
    const doctorsResponse = await doctorsApi.getAll({
      specialtyId: specialtyFilter || undefined,
      search: searchFilter || undefined,
      isActive: statusFilter === 'active' ? true : false
    })
    const doctorsData = await doctorsResponse.json()
    setDoctors(doctorsData)

    // Fetch specialties for filter dropdown
    const specialtiesResponse = await specialtiesApi.getAll()
    const specialtiesData = await specialtiesResponse.json()
    setSpecialties(specialtiesData)

    setLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2>Doctor Management</h2>
        <button onClick={() => router.push('/operations/doctors/new')}>
          + Add Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
          <option value="">All Specialties</option>
          {specialties.map(s => (
            <option key={s.specialtyId} value={s.specialtyId}>{s.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search doctors..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="doctors-grid">
          {doctors.map(doctor => (
            <DoctorCard key={doctor.doctorId} doctor={doctor} onUpdate={fetchData} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 5.3 Appointments List Page

**File:** `/web-admin/app/operations/appointments/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { appointmentsApi } from '@/lib/api/appointments'
import { AppointmentCard } from '@/components/operations/AppointmentCard'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, showOld, dateFrom, dateTo])

  const fetchAppointments = async () => {
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    const response = await appointmentsApi.getAll({
      status: statusFilter || undefined,
      dateFrom: showOld ? undefined : today, // If not showing old, start from today
      dateTo: dateTo || undefined,
      includeOld: showOld
    })

    const data = await response.json()
    setAppointments(data.data || [])
    setLoading(false)
  }

  const handleConfirm = async (appointmentId: string) => {
    if (confirm('Are you sure you want to confirm this appointment?')) {
      try {
        await appointmentsApi.confirm(appointmentId)
        alert('Appointment confirmed successfully!')
        fetchAppointments() // Reload list
      } catch (error) {
        alert('Failed to confirm appointment')
      }
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>Appointment Management</h2>
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={showOld}
            onChange={(e) => setShowOld(e.target.checked)}
          />
          Show Old Appointments
        </label>

        <input
          type="date"
          placeholder="Date From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />

        <input
          type="date"
          placeholder="Date To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      {/* Appointments Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Appt #</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appt => (
              <AppointmentCard
                key={appt.appointmentId}
                appointment={appt}
                onConfirm={() => handleConfirm(appt.appointmentId)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

---

## 6. Database Considerations

### 6.1 Current Data State

**Existing Data:**
- 4 doctors in `doctors` collection
- 3 appointments in `appointments` collection
- Multiple specialties in `specialty_master` collection
- 1 SUPER_ADMIN user
- 2 MEMBER users

### 6.2 Data Migration

**No migration needed** - All schemas already support required functionality.

**However, create test OPS user:**
```javascript
db.users.insertOne({
  userId: "USR004",
  uhid: "UH004",
  memberId: "MEM004",
  employeeId: "EMP001",
  relationship: "REL001",
  name: {
    firstName: "Operations",
    lastName: "User",
    fullName: "Operations User"
  },
  email: "ops@opdwallet.com",
  phone: "+919999999999",
  role: "OPS",
  status: "ACTIVE",
  passwordHash: "<bcrypt hash of 'password123'>",
  mustChangePassword: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 7. API Endpoints Summary

### 7.1 Existing Endpoints (To Verify)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/doctors` | List doctors with filters | ✅ Exists |
| GET | `/api/doctors/:id` | Get doctor details | ❓ Check |
| POST | `/api/doctors` | Create doctor | ❓ Check |
| PUT | `/api/doctors/:id` | Update doctor | ❓ Check |
| GET | `/api/specialties` | List specialties | ❓ Check |
| GET | `/api/appointments` | List appointments | ❓ Check |
| GET | `/api/appointments/:id` | Get appointment details | ❓ Check |

### 7.2 New Endpoints (To Create)

| Method | Endpoint | Description | Priority |
|--------|----------|-------------|----------|
| PATCH | `/api/doctors/:id/clinics` | Update clinics | MEDIUM |
| PATCH | `/api/doctors/:id/slots` | Update slots | MEDIUM |
| PATCH | `/api/doctors/:id/activate` | Activate doctor | LOW |
| PATCH | `/api/doctors/:id/deactivate` | Deactivate doctor | LOW |
| PATCH | `/api/appointments/:id/confirm` | **Confirm appointment** | **HIGH** |
| PATCH | `/api/appointments/:id/cancel` | Cancel appointment | MEDIUM |

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Backend:**
- Test appointment confirmation service method
- Test role guard for OPS access
- Test doctor CRUD operations

**Frontend:**
- Test doctor list component
- Test appointment list component
- Test filter functionality

### 8.2 Integration Tests

- Test complete doctor creation flow
- Test appointment confirmation flow
- Test role-based access control

### 8.3 Manual Testing Checklist

**Authentication:**
- [ ] OPS user can login and access `/operations`
- [ ] MEMBER user cannot access `/operations` (redirected)
- [ ] ADMIN user cannot access `/operations` (unless explicitly allowed)
- [ ] Session timeout works correctly

**Doctors Management:**
- [ ] Can view list of doctors
- [ ] Can filter by specialty, search, status
- [ ] Can create new doctor with all fields
- [ ] Can edit doctor information
- [ ] Can add/edit/remove clinics
- [ ] Can add/edit/remove slots
- [ ] Can activate/deactivate doctor

**Appointments Management:**
- [ ] Can view list of appointments
- [ ] Can filter by status, date, doctor, specialty
- [ ] Old appointments are hidden by default
- [ ] Toggle shows old appointments
- [ ] Can confirm pending appointments
- [ ] Confirmed appointments show "CONFIRMED" status
- [ ] Status updates reflect on member portal immediately

**UI/UX:**
- [ ] Consistent styling with admin portal
- [ ] Responsive on mobile, tablet, desktop
- [ ] Loading states displayed correctly
- [ ] Error messages displayed clearly
- [ ] Success notifications shown

---

## 9. Deployment Plan

### 9.1 Pre-Deployment Checklist

- [ ] All API endpoints tested
- [ ] Frontend components tested
- [ ] Role-based access verified
- [ ] Database backup taken
- [ ] Documentation updated

### 9.2 Deployment Steps

1. **Backend Deployment:**
   ```bash
   cd api
   npm run build
   npm run start:prod
   ```

2. **Frontend Deployment:**
   ```bash
   cd web-admin
   npm run build
   # Deploy to hosting platform
   ```

3. **Create OPS User:**
   - Use admin portal to create first OPS user
   - OR: Run MongoDB script to insert OPS user

4. **Verification:**
   - Login with OPS credentials
   - Access `/operations` platform
   - Test all features

### 9.3 Rollback Plan

If issues occur:
1. Revert backend deployment
2. Revert frontend deployment
3. No database rollback needed (new collection-agnostic)

---

## 10. Success Criteria

**Platform Launch:**
- ✅ Operations platform accessible at `/operations`
- ✅ OPS users can login and access platform
- ✅ Non-OPS users are denied access

**Doctor Management:**
- ✅ Can view, create, edit, delete doctors
- ✅ Can manage clinics and slots
- ✅ Filters work correctly

**Appointment Management:**
- ✅ Can view appointments with filters
- ✅ Can confirm pending appointments
- ✅ Status updates sync with member portal
- ✅ Old appointments toggle works

**User Experience:**
- ✅ UI is consistent and intuitive
- ✅ Performance meets requirements (<2s load time)
- ✅ Mobile responsive

**Security:**
- ✅ Role-based access enforced
- ✅ JWT authentication working
- ✅ No unauthorized access possible

---

## 11. Future Enhancements

**Phase 2 (Post-Launch):**
1. **Bulk Operations:**
   - Bulk slot creation for multiple doctors
   - Bulk appointment confirmation

2. **Analytics Dashboard:**
   - Appointment statistics
   - Doctor performance metrics
   - Cancellation rates

3. **Notifications:**
   - Email notifications on appointment confirmation
   - SMS notifications to patients
   - Push notifications to member app

4. **Advanced Scheduling:**
   - Recurring slot templates
   - Holiday management
   - Auto-confirmation rules

5. **Doctor Onboarding:**
   - Multi-step wizard for doctor creation
   - Document upload (certificates, etc.)
   - Profile verification workflow

---

## 12. Conclusion

This implementation plan provides a comprehensive roadmap for building the Operations Platform. The platform will:

1. **Empower operations staff** with dedicated tools for managing doctors and appointments
2. **Improve efficiency** through streamlined workflows and intuitive UI
3. **Enhance user experience** by enabling faster appointment confirmations
4. **Maintain security** through role-based access control
5. **Ensure scalability** with pagination and optimized queries

**Estimated Total Effort:** 2-3 days (16-24 hours)

**Recommended Approach:** Follow phases sequentially, with thorough testing at each stage.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1: Backend API setup
3. Iterate through phases with continuous testing
4. Deploy to staging for UAT
5. Production deployment after approval

---

**End of Implementation Plan**