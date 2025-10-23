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
- **/doctorview/prescriptions** - View all prescriptions uploaded by the doctor

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
- **GET /api/doctor/appointments/:appointmentId** - Get detailed appointment information
- **PATCH /api/appointments/:appointmentId/complete** - Mark appointment as completed after consultation
- **PATCH /api/appointments/:appointmentId/confirm** - Confirm pending appointment

### Video Consultations
- **POST /api/video-consultations/:appointmentId/start** - Start video consultation session
- **POST /api/video-consultations/:appointmentId/end** - End consultation and add notes
- **GET /api/video-consultations/:appointmentId/status** - Get current consultation status
- **GET /api/video-consultations/history** - Get doctor's consultation history

### Prescriptions
- **POST /api/prescriptions/upload** - Upload prescription PDF for an appointment
- **GET /api/prescriptions** - Get all prescriptions uploaded by the doctor
- **GET /api/prescriptions/:prescriptionId** - Get prescription details
- **GET /api/prescriptions/:prescriptionId/download** - Download prescription file
- **DELETE /api/prescriptions/:prescriptionId** - Delete prescription
