# Member Portal Documentation

## Pages

### Landing & Dashboard
- **/** - Public landing page with information about OPD Wallet services
- **/member** - Member dashboard showing OPD cards, wallet balance, and quick access to services

### Profile & Settings
- **/member/profile** - View and update personal information like name, email, phone
- **/member/settings** - Account settings and preferences
- **/member/family** - View all family members covered under the policy
- **/member/family/add** - Add new dependent family member

### Wallet & Transactions
- **/member/wallet** - View wallet balance broken down by category (consultation, pharmacy, diagnostics)
- **/member/transactions** - View history of all wallet transactions with filters

### Benefits
- **/member/benefits** - View all available health benefits under the policy

### Appointments (In-Clinic)
- **/member/appointments** - Appointment booking homepage
- **/member/appointments/specialties** - Select medical specialty for appointment
- **/member/appointments/doctors** - Browse and select doctor based on specialty
- **/member/appointments/select-patient** - Choose which family member needs the appointment
- **/member/appointments/select-slot** - Pick date and time slot from doctor's availability
- **/member/appointments/confirm** - Review and confirm appointment with payment option
- **/member/bookings** - View all booked appointments (upcoming and past)
- **/member/bookings/new** - Quick create new appointment

### Online Consultation
- **/member/online-consult** - Online video consultation homepage
- **/member/online-consult/specialties** - Select medical specialty for online consultation
- **/member/online-consult/doctors** - Browse doctors available for online consultation
- **/member/online-consult/confirm** - Confirm online consultation booking
- **/member/consultations/[appointmentId]** - Join and participate in video consultation session

### Health Records
- **/member/health-records** - View all prescriptions and medical records from past consultations

### Lab Tests
- **/member/lab-tests** - Lab diagnostics homepage
- **/member/lab-tests/upload** - Upload prescription photo to order lab tests
- **/member/lab-tests/cart/[id]** - Review lab test cart created from prescription
- **/member/lab-tests/cart/[id]/vendor/[vendorId]** - Select lab vendor and pick time slot for sample collection
- **/member/lab-tests/orders** - View all lab test orders (pending, completed, cancelled)
- **/member/lab-tests/orders/[orderId]** - View detailed lab order status and information

### Claims & Reimbursements
- **/member/claims** - View all submitted reimbursement claims
- **/member/claims/new** - Submit new claim with bill upload and details
- **/member/claims/[id]** - View claim status, timeline, and TPA notes

### Orders & Payments
- **/member/orders** - View all orders and transactions
- **/member/orders/[transactionId]** - View detailed order information
- **/member/payments/[paymentId]** - View payment details and receipt

### Services
- **/member/services** - Browse all available healthcare services

## API Endpoints

### Authentication
- **POST /api/auth/login** - Login with email and password to access member account
- **POST /api/auth/logout** - Logout and clear session
- **GET /api/auth/me** - Get current logged-in member's profile

### Member Profile
- **GET /api/member/profile** - Get complete member profile with family members and policy details
- **GET /api/member/family** - Get list of family members and dependents
- **PUT /api/member/profile** - Update profile information like email and mobile number

### Wallet
- **GET /api/wallet/balance** - Get wallet balance for logged-in member or specific family member (supports userId query parameter)
- **GET /api/wallet/transactions** - Get wallet transaction history with limit

### Appointments
- **POST /api/appointments** - Create new appointment booking
- **GET /api/appointments** - Get member's appointments with filters for type (in-clinic or online)
- **GET /api/appointments/ongoing** - Get currently active appointments
- **GET /api/appointments/:id** - Get detailed information about specific appointment
- **PATCH /api/appointments/:id/cancel** - Cancel an appointment

### Doctors & Clinics
- **GET /api/doctors** - Get all doctors with filters for specialty and location
- **GET /api/doctors/:id** - Get detailed doctor profile
- **GET /api/doctors/:id/slots** - Get doctor's available time slots for a date and clinic
- **GET /api/clinics** - Get all clinic locations

### Specialties
- **GET /api/specialties** - Get all active medical specialties for selection

### Video Consultations
- **POST /api/video-consultations/:appointmentId/start** - Start video consultation as doctor
- **POST /api/video-consultations/:appointmentId/join** - Join video consultation as member
- **POST /api/video-consultations/:appointmentId/end** - End consultation session
- **GET /api/video-consultations/:appointmentId/status** - Get current status of consultation
- **GET /api/video-consultations/history** - Get patient's past consultation history

### Prescriptions
- **GET /api/prescriptions** - Get all prescriptions issued by doctors for the member
- **GET /api/prescriptions/:id** - Get prescription details
- **GET /api/prescriptions/:id/download** - Download prescription as PDF

### Lab Tests
- **POST /api/member/lab/prescriptions/upload** - Upload prescription image for lab tests
- **GET /api/member/lab/prescriptions** - Get all uploaded lab prescriptions
- **GET /api/member/lab/prescriptions/:id** - Get prescription details with status
- **GET /api/member/lab/carts/active** - Get active lab test shopping carts
- **GET /api/member/lab/carts/:id** - Get cart details with test items
- **DELETE /api/member/lab/carts/:id** - Delete cart
- **GET /api/member/lab/vendors/available** - Get lab vendors available in member's area (supports pincode query parameter)
- **GET /api/member/lab/vendors/:vendorId/pricing** - Get vendor's pricing for tests
- **GET /api/member/lab/vendors/:vendorId/slots** - Get vendor's available time slots for sample collection
- **POST /api/member/lab/orders** - Create lab order from cart
- **GET /api/member/lab/orders** - Get member's lab orders
- **GET /api/member/lab/orders/:id** - Get detailed lab order information

### Claims & Reimbursements
- **POST /api/claims** - Submit new reimbursement claim with bill and documents
- **GET /api/claims** - Get all claims submitted by logged-in member
- **GET /api/claims/summary** - Get claims summary with counts and amounts
- **GET /api/claims/:id** - Get full claim details including status and documents
- **GET /api/claims/:id/timeline** - Get claim processing timeline
- **GET /api/claims/:claimId/tpa-notes** - Get TPA notes and comments on claim
- **PUT /api/claims/:id** - Update claim information
- **POST /api/claims/:id/documents** - Add more documents to existing claim
- **DELETE /api/claims/:id/documents/:docId** - Remove document from claim
- **POST /api/claims/:claimId/resubmit-documents** - Resubmit documents after TPA requests more information
- **PATCH /api/claims/:claimId/cancel** - Cancel submitted claim
- **GET /api/claims/:id/documents/:docId/download** - Download claim document

### Payments
- **GET /api/payments/:id** - Get payment details
- **GET /api/payments/history** - Get payment history with filters
- **GET /api/payments/summary** - Get payment summary statistics
- **POST /api/payments/:id/mark-paid** - Mark payment as completed
- **POST /api/payments/:id/cancel** - Cancel pending payment

### Services
- **GET /api/services** - Get all available healthcare services
- **GET /api/services/by-category/:categoryId** - Get services filtered by category
