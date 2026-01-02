# Doctor Portal Documentation

## Pages

### Dashboard & Auth
- **/doctor** - Redirects to login or dashboard based on authentication status
- **/doctor/login** - Doctor login page using doctor ID and password
- **/doctorview** - Doctor dashboard showing today's appointments and statistics

### Appointments
- **/doctorview/appointments** - View all appointments with calendar view
- **/doctorview/appointments/[appointmentId]** - View detailed appointment information

### Video Consultations
- **/doctorview/consultations/[appointmentId]** - Conduct video consultation with patient

### Prescriptions
- **/doctorview/prescriptions** - View all prescriptions (both digital and uploaded PDF)
- **/doctorview/prescriptions/[prescriptionId]** - View detailed prescription with medicines, lab tests, and instructions

### Profile & Settings
- **/doctorview/profile** - Doctor profile with signature upload (mandatory for MCI-compliant prescriptions)

### Calendar Management
- **/doctorview/calendar** - Manage doctor unavailability periods (vacation, conferences, emergencies)

## API Endpoints

### Doctor Authentication
- **POST /api/doctor/auth/login** - Login using doctor ID and password
- **POST /api/doctor/auth/logout** - Logout doctor and clear session
- **GET /api/doctor/auth/profile** - Get currently logged-in doctor's profile
- **POST /api/doctor/auth/profile/signature** - Upload doctor signature (PNG/JPG, max 500KB, required for prescriptions)
- **GET /api/doctor/auth/profile/signature/status** - Get signature upload status and preview URL
- **DELETE /api/doctor/auth/profile/signature** - Delete uploaded signature

### Doctor Appointments
- **GET /api/doctor/appointments/counts** - Get appointment counts for a date range
- **GET /api/doctor/appointments/today** - Get today's appointments for the logged-in doctor
- **GET /api/doctor/appointments/date/:date** - Get appointments for a specific date
- **GET /api/doctor/appointments/upcoming** - Get all upcoming appointments
- **GET /api/doctor/appointments/:appointmentId** - Get detailed appointment information (supports both MongoDB _id and appointmentId)
- **PATCH /api/doctor/appointments/:appointmentId/complete** - Mark appointment as completed after consultation
- **PATCH /api/doctor/appointments/:appointmentId/confirm** - Confirm pending appointment

### Video Consultations
- **POST /api/video-consultations/start** - Start video consultation session (creates Daily.co room in ap-south-1 region)
- **POST /api/video-consultations/:consultationId/end** - End consultation and add notes
- **GET /api/video-consultations/:consultationId/status** - Get current consultation status
- **GET /api/video-consultations/doctor/history** - Get doctor's consultation history with pagination

### Prescriptions (PDF Upload)
- **POST /api/prescriptions/upload** - Upload prescription PDF for an appointment
- **GET /api/prescriptions** - Get all prescriptions (both digital and PDF) created by the doctor
- **GET /api/prescriptions/:prescriptionId** - Get prescription details (supports both types)
- **GET /api/prescriptions/:prescriptionId/download** - Download prescription file
- **DELETE /api/prescriptions/:prescriptionId** - Delete prescription

### Digital Prescriptions
- **POST /api/doctor/digital-prescriptions** - Create new digital prescription with medicines, lab tests, diagnoses, symptoms, and instructions
- **GET /api/doctor/digital-prescriptions** - Get all digital prescriptions created by doctor with pagination
- **GET /api/doctor/digital-prescriptions/:prescriptionId** - Get specific digital prescription details
- **PATCH /api/doctor/digital-prescriptions/:prescriptionId** - Update digital prescription
- **POST /api/doctor/digital-prescriptions/:prescriptionId/generate-pdf** - Generate PDF from digital prescription
- **GET /api/doctor/digital-prescriptions/:prescriptionId/download-pdf** - Download generated PDF
- **DELETE /api/doctor/digital-prescriptions/:prescriptionId** - Delete digital prescription

### Medicine Search
- **GET /api/medicines/search** - Search Indian medicine database by name with autocomplete (15,000+ medicines, minimum 2 characters, limit 20 results)

### Diagnosis Search
- **GET /api/diagnoses/search** - Search diagnosis database with autocomplete support (500+ diagnoses with ICD-10 codes, minimum 2 characters)
- **GET /api/diagnoses/categories** - Get all diagnosis categories (Infectious, Chronic, Respiratory, Cardiovascular, etc.)

### Symptoms Search
- **GET /api/symptoms/search** - Search symptoms database with autocomplete support (200+ symptoms, minimum 2 characters)
- **GET /api/symptoms/categories** - Get all symptom categories (General, Respiratory, Gastrointestinal, Cardiovascular, etc.)

### Patient Health Records
- **GET /api/doctor/health-records/:patientId** - Get patient's complete health records including allergies, chronic conditions, current medications, past prescriptions, and consultation history

### Calendar Unavailability Management
- **POST /api/doctor/unavailability** - Create unavailability period (vacation, conference, emergency, etc.)
- **GET /api/doctor/unavailability** - Get all unavailability periods for the doctor
- **GET /api/doctor/unavailability/:unavailabilityId** - Get specific unavailability details
- **PATCH /api/doctor/unavailability/:unavailabilityId** - Update unavailability period
- **DELETE /api/doctor/unavailability/:unavailabilityId** - Delete unavailability period

### Prescription Templates
- **POST /api/doctor/prescription-templates** - Create reusable prescription template
- **GET /api/doctor/prescription-templates** - Get all templates created by doctor
- **GET /api/doctor/prescription-templates/:templateId** - Get specific template details
- **PATCH /api/doctor/prescription-templates/:templateId** - Update template
- **DELETE /api/doctor/prescription-templates/:templateId** - Delete template
- **POST /api/doctor/prescription-templates/:templateId/use** - Increment template usage count

### Consultation Notes
- **POST /api/doctor/consultation-notes** - Create consultation note for appointment
- **GET /api/doctor/consultation-notes** - Get all consultation notes (with pagination)
- **GET /api/doctor/consultation-notes/:noteId** - Get specific consultation note
- **GET /api/doctor/consultation-notes/appointment/:appointmentId** - Get note for specific appointment
- **GET /api/doctor/consultation-notes/patient/:patientId** - Get all notes for a patient
- **PATCH /api/doctor/consultation-notes/:noteId** - Update consultation note
- **DELETE /api/doctor/consultation-notes/:noteId** - Delete consultation note
- **POST /api/doctor/consultation-notes/:noteId/link-prescription** - Link prescription to consultation note

## Recent Enhancements (Phase 3)

### MCI-Compliant Prescriptions
- **Doctor Signature**: Mandatory signature upload for creating digital prescriptions
- **Patient Vitals**: Input vitals (BP, temperature, pulse, weight, height) with auto-BMI calculation
- **Allergy Management**: Dedicated allergy section with drug, food, and other allergies
- **Enhanced PDF**: Prescription PDFs now include vitals, allergies (highlighted), and doctor signature

### Patient Health Records Access
- Doctors can view complete patient medical history before consultations
- Includes allergies (critical alerts), chronic conditions, current medications
- Shows past prescriptions and consultation history
- Helps doctors make informed treatment decisions

### Consultation Notes
- Comprehensive clinical documentation system
- Structured fields: chief complaint, history of present illness, clinical findings
- Provisional diagnosis, investigations ordered, treatment plan
- Follow-up instructions with date scheduling
- Private notes section (doctor-only, not shared with patient)
- Automatic linking with created prescriptions

### Prescription Templates
- Save frequently used prescriptions as reusable templates
- Quick-load templates to populate prescription forms
- Track usage statistics (usage count, last used date)
- Supports medicines, lab tests, diagnoses, and instructions

### Calendar Unavailability
- Mark unavailability periods (vacation, conference, emergency, sick leave, personal, other)
- All-day or time-specific unavailability
- Recurrence pattern support (none, daily, weekly, monthly)
- Automatic slot filtering during unavailable periods
- Prevents patient bookings during doctor's unavailable times
