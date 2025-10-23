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
- **POST /api/doctors/login** - Login using doctor ID and password
- **POST /api/auth/logout** - Logout doctor and clear session
- **GET /api/auth/me** - Get currently logged-in doctor's profile

### Doctor Appointments
- **GET /api/doctors/appointments/counts** - Get appointment counts for a date range
- **GET /api/doctors/appointments/today** - Get today's appointments for the logged-in doctor
- **GET /api/doctors/appointments/by-date** - Get appointments for a specific date
- **GET /api/doctors/appointments/upcoming** - Get all upcoming appointments
- **GET /api/appointments/:id** - Get detailed appointment information
- **PUT /api/appointments/:id/complete** - Mark appointment as completed after consultation
- **PUT /api/appointments/:id/confirm** - Confirm pending appointment

### Video Consultations
- **POST /api/video-consultations/:appointmentId/start** - Start video consultation session
- **POST /api/video-consultations/:appointmentId/end** - End consultation and add notes
- **GET /api/video-consultations/:appointmentId/status** - Get current consultation status
- **GET /api/video-consultations/history** - Get doctor's consultation history

### Prescriptions
- **POST /api/prescriptions/upload** - Upload prescription PDF for an appointment
- **GET /api/prescriptions** - Get all prescriptions uploaded by the doctor
- **GET /api/prescriptions/:id** - Get prescription details
- **GET /api/prescriptions/:id/download** - Download prescription file
- **DELETE /api/prescriptions/:id** - Delete prescription
