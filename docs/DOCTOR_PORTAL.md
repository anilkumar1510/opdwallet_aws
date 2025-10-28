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

## API Endpoints

### Doctor Authentication
- **POST /api/doctor/auth/login** - Login using doctor ID and password
- **POST /api/doctor/auth/logout** - Logout doctor and clear session
- **GET /api/doctor/auth/profile** - Get currently logged-in doctor's profile

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
