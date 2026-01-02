# Changelog

All notable changes to the OPD Wallet Doctor Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 3 Doctor Portal Enhancements

#### MCI-Compliant Prescription Features
- **Doctor Signature Management**
  - Upload signature (PNG/JPG, max 500KB) in profile settings
  - Signature required for creating digital prescriptions (MCI compliance)
  - Preview and delete signature functionality
  - Signature automatically embedded in prescription PDFs

- **Patient Vitals Input**
  - Comprehensive vitals form: Blood Pressure, Temperature, Pulse, Respiratory Rate, Oxygen Saturation
  - Weight and Height inputs with automatic BMI calculation
  - Vitals displayed on prescription PDFs

- **Allergy Management**
  - Dedicated allergy section with categorization (Drug, Food, Other)
  - Visual warning indicators on prescriptions
  - Critical allergy alerts highlighted in red on PDFs

- **Enhanced PDF Generation**
  - MCI-compliant prescription format
  - Includes patient vitals and allergy warnings
  - Doctor signature embedded at bottom
  - Clinic information in header
  - Professional layout with clear sections

#### Patient Health Records Access
- **Comprehensive Patient History Viewer**
  - Collapsible patient health records section on appointment page
  - Displays known allergies with critical alert styling
  - Shows chronic conditions and current medications
  - Past prescriptions list (up to 10 recent)
  - Consultation history timeline
  - Helps doctors make informed treatment decisions

#### Consultation Notes System
- **Clinical Documentation**
  - Chief complaint and history of present illness fields
  - Clinical findings section (general, systemic, local examination)
  - Provisional diagnosis input
  - Investigations ordered (multi-select management)
  - Treatment plan and follow-up instructions
  - Next follow-up date scheduling
  - Additional notes for patient sharing

- **Private Notes**
  - Secure doctor-only notes section
  - Not shared with patients
  - Helps maintain internal clinical observations

- **Auto-save Functionality**
  - Automatic note creation and updates
  - Linked to specific appointments
  - Automatic prescription linking

#### Prescription Templates
- **Template Management**
  - Save frequently used prescriptions as reusable templates
  - Template selector on prescription form
  - Quick-load functionality to populate forms
  - Usage tracking (count and last used date)
  - Templates include medicines, lab tests, diagnosis, and instructions
  - Easy template creation with name and description

- **Template Analytics**
  - Track how many times each template is used
  - Display last used date
  - Sort templates by usage for quick access

#### Calendar Unavailability Management
- **Unavailability Periods**
  - Mark time off for vacation, conferences, emergencies, sick leave, personal reasons
  - All-day or time-specific unavailability options
  - Recurrence pattern support (none, daily, weekly, monthly)
  - Visual calendar management interface
  - Color-coded unavailability types

- **Automatic Slot Filtering**
  - Appointment slots automatically hidden during unavailable periods
  - Prevents patient bookings when doctor is unavailable
  - Integration with existing slot generation system

#### New Pages
- `/doctorview/profile` - Doctor profile management with signature upload
- `/doctorview/calendar` - Calendar unavailability management

#### Backend API Endpoints

**Doctor Authentication:**
- `POST /auth/doctor/profile/signature` - Upload signature
- `GET /auth/doctor/profile/signature/status` - Get signature status
- `DELETE /auth/doctor/profile/signature` - Delete signature

**Patient Health Records:**
- `GET /doctor/health-records/:patientId` - Get complete patient health records

**Calendar Unavailability:**
- `POST /doctor/unavailability` - Create unavailability period
- `GET /doctor/unavailability` - List all unavailability periods
- `GET /doctor/unavailability/:id` - Get unavailability details
- `PATCH /doctor/unavailability/:id` - Update unavailability
- `DELETE /doctor/unavailability/:id` - Delete unavailability

**Prescription Templates:**
- `POST /doctor/prescription-templates` - Create template
- `GET /doctor/prescription-templates` - List all templates
- `GET /doctor/prescription-templates/:id` - Get template details
- `PATCH /doctor/prescription-templates/:id` - Update template
- `DELETE /doctor/prescription-templates/:id` - Delete template
- `POST /doctor/prescription-templates/:id/use` - Increment usage count

**Consultation Notes:**
- `POST /doctor/consultation-notes` - Create consultation note
- `GET /doctor/consultation-notes` - List all notes (paginated)
- `GET /doctor/consultation-notes/:id` - Get note details
- `GET /doctor/consultation-notes/appointment/:appointmentId` - Get note by appointment
- `GET /doctor/consultation-notes/patient/:patientId` - Get patient notes
- `PATCH /doctor/consultation-notes/:id` - Update note
- `DELETE /doctor/consultation-notes/:id` - Delete note
- `POST /doctor/consultation-notes/:id/link-prescription` - Link prescription

#### Database Schemas Added
- `DoctorUnavailability` - Calendar unavailability periods
- `PrescriptionTemplate` - Reusable prescription templates
- `ConsultationNote` - Clinical consultation documentation

#### Frontend Components Added
- `SignatureUpload.tsx` - Signature upload and management
- `VitalsInput.tsx` - Patient vitals input with auto-BMI
- `AllergiesInput.tsx` - Allergy management
- `UnavailabilityModal.tsx` - Calendar unavailability form
- `TemplateSelector.tsx` - Prescription template selector
- `ConsultationNoteEditor.tsx` - Clinical notes editor
- `PatientHealthRecords.tsx` - Patient history viewer

### Changed

#### Enhanced Components
- `DigitalPrescriptionWriter.tsx` - Integrated vitals, allergies, and template functionality
- `DoctorNavigation.tsx` - Added Profile and Calendar navigation items
- `appointment/[appointmentId]/page.tsx` - Integrated patient health records and consultation notes
- `pdf-generation.service.ts` - Enhanced with vitals, allergies, and signature support

#### Database Updates
- `Doctor` schema - Added signature fields (signatureImage, signatureUploadedAt, hasValidSignature)
- `DigitalPrescription` schema - Added vitals and allergies subdocuments

### Security
- Signature validation before prescription creation (MCI compliance)
- Private notes section secured from patient access
- Doctor-patient relationship verification for health records access

### Documentation
- Updated `LATEST_API_ENDPOINTS_DOCTOR.md` with 25+ new endpoints
- Updated `LATEST_FRONTEND_PAGES_DOCTOR.md` with new pages and features
- Updated `DOCTOR_PORTAL.md` with comprehensive feature documentation

---

## Notes

### Testing Status
- ✅ Backend compilation successful
- ✅ Frontend compilation successful
- ⚠️ Browser testing identified authentication configuration issue (demo credentials need database seeding)

### Known Issues
- Demo doctor account needs to be seeded in database for testing
- Backend API server needs to be running for full functionality

### Migration Requirements
None - All changes are backward compatible. Existing prescriptions will continue to work. New fields are optional.

### Deployment Checklist
- [ ] Ensure backend API is running
- [ ] Seed demo doctor account in database
- [ ] Create uploads/signatures directory with write permissions
- [ ] Verify signature upload works (500KB limit, PNG/JPG only)
- [ ] Test prescription PDF generation includes signature
- [ ] Verify slot filtering works with unavailability periods
