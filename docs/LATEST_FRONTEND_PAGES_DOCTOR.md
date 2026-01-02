# Doctor Portal Frontend Pages

This document lists all frontend pages/routes in the Doctor Portal (web-doctor).

---

## Authentication

| Path | Description |
|------|-------------|
| / | Root page (redirects to login) |
| /login | Doctor portal login page with email/password authentication |

---

## Dashboard

| Path | Description |
|------|-------------|
| /doctorview | Main doctor dashboard with today's appointments and statistics |

---

## Appointments

| Path | Description |
|------|-------------|
| /doctorview/appointments | View and manage all upcoming appointments |
| /doctorview/appointments/[appointmentId] | Comprehensive appointment view with patient health records, consultation notes editor, and prescription writer |

---

## Video Consultations

| Path | Description |
|------|-------------|
| /doctorview/consultations/[appointmentId] | Start and manage video consultation session |

---

## Prescriptions

| Path | Description |
|------|-------------|
| /doctorview/prescriptions | View all prescriptions (digital and uploaded) |
| /doctorview/prescriptions/[prescriptionId] | View prescription details with download option |

---

## Profile & Settings

| Path | Description |
|------|-------------|
| /doctorview/profile | Doctor profile management with signature upload (mandatory for prescriptions) |

---

## Calendar Management

| Path | Description |
|------|-------------|
| /doctorview/calendar | Manage unavailability periods (vacation, conferences, emergencies) |

---

**Total Pages: 10**

## Recent Enhancements (Phase 3)

### Appointment Detail Page
The appointment detail page now includes:
- **Patient Health Records**: Collapsible section showing patient's complete medical history including allergies, chronic conditions, current medications, and past prescriptions
- **Consultation Notes Editor**: Comprehensive clinical documentation form with:
  - Chief complaint and history of present illness
  - Clinical findings (general, systemic, local examination)
  - Provisional diagnosis and investigations ordered
  - Treatment plan and follow-up instructions
  - Private notes (doctor-only, not shared with patient)
- **Prescription Writer**: Enhanced digital prescription form with:
  - Template selector for quick prescription creation
  - Save as template functionality
  - Vitals input with auto-BMI calculation
  - Allergies management
  - MCI-compliant format

### Profile Page
- Upload doctor signature (PNG/JPG, max 500KB)
- Preview uploaded signature
- Signature required for creating digital prescriptions (MCI compliance)

### Calendar Page
- Create unavailability periods with type (vacation, conference, emergency, etc.)
- All-day or time-specific unavailability
- Recurrence patterns support
- Automatic slot filtering during unavailable periods
