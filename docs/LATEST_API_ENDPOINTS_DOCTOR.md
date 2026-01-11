# Doctor Portal API Endpoints

This document lists all API endpoints used by the Doctor Portal (web-doctor).

---

## Doctor Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/doctor/login | Doctor login with credentials |
| POST | /auth/doctor/logout | Doctor logout |
| GET | /auth/doctor/profile | Get doctor profile |
| PATCH | /auth/doctor/profile | Update doctor profile |
| POST | /auth/doctor/profile/signature | Upload doctor signature (PNG/JPG, max 500KB) |
| GET | /auth/doctor/profile/signature | Get doctor signature image (returns image file) |
| GET | /auth/doctor/profile/signature/status | Get signature upload status |
| DELETE | /auth/doctor/profile/signature | Delete uploaded signature |

---

## Doctor Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /doctor/appointments/counts | Get appointment counts by date |
| GET | /doctor/appointments/today | Get today's appointments |
| GET | /doctor/appointments/date/:date | Get appointments by date |
| GET | /doctor/appointments/upcoming | Get upcoming appointments |
| GET | /doctor/appointments/:appointmentId | Get appointment details |
| PATCH | /doctor/appointments/:appointmentId/complete | Mark appointment complete |
| PATCH | /doctor/appointments/:appointmentId/confirm | Confirm appointment |

---

## Digital Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor/digital-prescriptions | Create digital prescription |
| PATCH | /doctor/digital-prescriptions/:prescriptionId | Update digital prescription |
| GET | /doctor/digital-prescriptions | Get doctor's digital prescriptions |
| GET | /doctor/digital-prescriptions/:prescriptionId | Get prescription details |
| POST | /doctor/digital-prescriptions/:prescriptionId/generate-pdf | Generate prescription PDF |
| GET | /doctor/digital-prescriptions/:prescriptionId/signature | Get prescription's stored doctor signature |
| GET | /doctor/digital-prescriptions/:prescriptionId/download-pdf | Download prescription PDF |
| DELETE | /doctor/digital-prescriptions/:prescriptionId | Delete prescription |

---

## Uploaded Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor/prescriptions/upload | Upload prescription file |
| GET | /doctor/prescriptions | Get doctor's uploaded prescriptions |
| GET | /doctor/prescriptions/:prescriptionId | Get prescription details |
| GET | /doctor/prescriptions/:prescriptionId/download | Download prescription file |
| DELETE | /doctor/prescriptions/:prescriptionId | Delete prescription |

---

## Video Consultations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /video-consultations/start | Start video consultation (doctor) |
| POST | /video-consultations/:consultationId/end | End consultation |
| GET | /video-consultations/:consultationId/status | Get consultation status |
| GET | /video-consultations/doctor/history | Get doctor's consultation history |

---

## Patient Health Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /doctor/appointments/patients/:patientId/health-records | Get patient's complete health records (allergies, chronic conditions, medications, prescriptions, consultation history) |

---

## Calendar Unavailability Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor/calendar/unavailability | Create unavailability period |
| GET | /doctor/calendar/unavailability | Get all unavailability periods |
| GET | /doctor/calendar/unavailability/upcoming | Get upcoming unavailability periods |
| GET | /doctor/calendar/unavailability/:unavailabilityId | Get unavailability details |
| PATCH | /doctor/calendar/unavailability/:unavailabilityId | Update unavailability period |
| DELETE | /doctor/calendar/unavailability/:unavailabilityId | Delete unavailability period |
| GET | /doctor/calendar/unavailable-dates | Get unavailable dates for a date range |
| GET | /doctor/calendar/check-availability | Check doctor availability for specific date/time |

---

## Prescription Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor/prescription-templates | Create prescription template |
| GET | /doctor/prescription-templates | Get all templates |
| GET | /doctor/prescription-templates/:templateId | Get template details |
| PATCH | /doctor/prescription-templates/:templateId | Update template |
| DELETE | /doctor/prescription-templates/:templateId | Delete template |
| POST | /doctor/prescription-templates/:templateId/use | Increment template usage count |

---

## Consultation Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor/consultation-notes | Create consultation note |
| GET | /doctor/consultation-notes | Get all consultation notes (with pagination) |
| GET | /doctor/consultation-notes/:noteId | Get note details |
| GET | /doctor/consultation-notes/appointment/:appointmentId | Get note by appointment |
| GET | /doctor/consultation-notes/patient/:patientId | Get all notes for a patient |
| PATCH | /doctor/consultation-notes/:noteId | Update consultation note |
| DELETE | /doctor/consultation-notes/:noteId | Delete consultation note |
| POST | /doctor/consultation-notes/:noteId/link-prescription | Link prescription to consultation note |

---

## Medical Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /medicines/search | Search medicines by query |
| GET | /diagnoses/search | Search diagnoses by query |
| GET | /diagnoses/categories | Get diagnosis categories |
| GET | /symptoms/search | Search symptoms by query |
| GET | /symptoms/categories | Get symptom categories |

---

## Appointments (Read-only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /appointments/:appointmentId | Get appointment details |

---

**Total Endpoints: ~55**

## Recent Additions (Phase 3)

### Signature Management
- Doctor signature upload is now mandatory for creating digital prescriptions (MCI compliance)
- Supports PNG/JPG formats with 500KB size limit

### Patient Health Records
- Doctors can access complete patient medical history before consultation
- Includes allergies, chronic conditions, current medications, and past prescriptions

### Calendar Unavailability
- Doctors can mark unavailability periods (vacation, conference, emergency, etc.)
- Supports all-day or time-specific unavailability
- Automatically filters slots during unavailable periods

### Prescription Templates
- Save frequently used prescriptions as reusable templates
- Track template usage count and last used date
- Quick-load templates to populate prescription forms

### Consultation Notes
- Comprehensive clinical documentation during consultations
- Includes chief complaint, history, clinical findings, diagnosis, investigations
- Separate private notes section (doctor-only)
- Automatic linking with prescriptions
