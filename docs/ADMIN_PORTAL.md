# Admin Portal Documentation

## Pages

### Main Dashboard & Auth
- **/admin** - Main dashboard showing system overview with quick access to key functions
- **/admin/login** - Login page for admin users

### User Management
- **/admin/users** - List all users with search and filters
- **/admin/users/new** - Create new admin, operations, TPA, or finance users
- **/admin/users/[id]** - View and edit user details

### Policy Management
- **/admin/policies** - View all insurance policies
- **/admin/policies/new** - Create new insurance policy
- **/admin/policies/[id]** - View policy details
- **/admin/policies/[id]/assignments** - Assign policy to corporate users
- **/admin/policies/[id]/plan-config** - Configure plan benefits and wallet categories
- **/admin/policies/[id]/plan-config/[version]** - View specific version of plan configuration

### Master Data
- **/admin/categories** - Manage service categories like consultation, pharmacy, diagnostics
- **/admin/services** - Manage service types and their pricing
- **/admin/masters** - Manage master data like relationships and corporate user groups

### Operations Portal
- **/admin/operations** - Operations team dashboard
- **/admin/operations/members** - Search and manage member accounts
- **/admin/operations/members/[id]** - View member details and top-up wallet
- **/admin/operations/appointments** - View all appointments across the system
- **/admin/operations/clinics** - Manage clinic locations
- **/admin/operations/clinics/new** - Add new clinic
- **/admin/operations/clinics/[id]** - Edit clinic details
- **/admin/operations/doctors** - Manage doctor profiles
- **/admin/operations/doctors/new** - Add new doctor to the system
- **/admin/operations/doctors/[id]** - Edit doctor details and upload photo
- **/admin/operations/doctors/[id]/schedules** - Manage doctor schedules and time slots
- **/admin/operations/lab/orders** - View all lab test orders
- **/admin/operations/lab/prescriptions** - View uploaded lab prescriptions
- **/admin/operations/lab/prescriptions/[id]/digitize** - Convert prescription image to cart with test items

### Lab Management
- **/admin/lab** - Lab diagnostics management dashboard
- **/admin/lab/services** - Manage lab test catalog
- **/admin/lab/vendors** - Manage lab service providers
- **/admin/lab/vendors/[vendorId]/pricing** - Set vendor pricing for each test
- **/admin/lab/vendors/[vendorId]/slots** - Manage vendor availability time slots

### TPA (Third Party Administrator)
- **/admin/tpa** - TPA dashboard showing claim statistics
- **/admin/tpa/analytics** - View claim analytics and reports
- **/admin/tpa/users** - Manage TPA users and view their workload
- **/admin/tpa/claims** - View all claims in the system
- **/admin/tpa/claims/assigned** - View claims assigned to TPA users
- **/admin/tpa/claims/unassigned** - View unassigned claims awaiting assignment
- **/admin/tpa/claims/[claimId]** - Review claim details and approve, reject, or request more documents

### Finance
- **/admin/finance** - Finance team dashboard
- **/admin/finance/payments/pending** - View approved claims that need payment processing
- **/admin/finance/payments/history** - View completed payment history

## API Endpoints

### Authentication
- **POST /api/auth/login** - Login with email and password to get authentication token
- **POST /api/auth/logout** - Logout user and clear session
- **GET /api/auth/me** - Get currently logged-in user's profile information

### User Management
- **GET /api/users** - Get list of all users with optional filters for role, status, and search term
- **POST /api/users** - Create new user account (admin, operations, TPA, or finance role)
- **GET /api/users/:id** - Get details of a specific user by ID
- **PUT /api/users/:id** - Update user information like name, email, phone, or role
- **DELETE /api/users/:id** - Delete user account from system
- **POST /api/users/:id/reset-password** - Reset or set password for a user
- **GET /api/users/:id/family** - Get family members and dependents of a user

### Policy Management
- **GET /api/policies** - Get all insurance policies in the system
- **POST /api/policies** - Create new insurance policy with corporate details
- **GET /api/policies/:id** - Get details of specific policy by ID
- **PUT /api/policies/:id** - Update policy information
- **DELETE /api/policies/:id** - Delete policy if it's not assigned to any users
- **POST /api/policies/:id/assign** - Assign policy to one or more users

### Plan Configuration
- **POST /api/policies/:policyId/plan-config** - Create plan configuration with wallet categories and limits
- **GET /api/policies/:policyId/plan-configs** - Get all plan configurations for a policy
- **PUT /api/plan-configs/:id** - Update plan configuration settings
- **GET /api/plan-configs/:id** - Get details of a specific plan configuration version

### Assignments
- **GET /api/assignments** - Get policy assignments for users
- **POST /api/assignments** - Assign policy to users with start and end dates
- **PUT /api/assignments/:id** - Update assignment details like effective dates

### Operations - Member Management
- **GET /api/operations/members/search** - Search members by name, email, phone, or member ID
- **GET /api/operations/members/:id** - Get member details with wallet balance and policy information
- **POST /api/operations/members/:id/wallet/topup** - Add money to member's wallet for specific category

### Doctor Management
- **GET /api/doctors** - Get all doctors with filters for specialty and clinic location
- **POST /api/doctors** - Create new doctor profile with personal and professional details
- **PUT /api/doctors/:id** - Update doctor information
- **POST /api/doctors/:id/photo** - Upload doctor's profile photo
- **PUT /api/doctors/:id/status** - Activate or deactivate doctor account
- **POST /api/doctors/:id/set-password** - Set login password for doctor
- **GET /api/doctors/:id/slots** - Get doctor's available time slots

### Clinic Management
- **GET /api/clinics** - Get all clinic locations
- **POST /api/clinics** - Add new clinic location with address and contact details
- **PUT /api/clinics/:id** - Update clinic information
- **PUT /api/clinics/:id/status** - Activate or deactivate clinic
- **DELETE /api/clinics/:id** - Delete clinic from system

### Doctor Slots & Scheduling
- **POST /api/doctor-slots** - Create slot configuration for doctor's schedule
- **GET /api/doctor-slots/by-clinic/:clinicId** - Get all slots for a clinic
- **GET /api/doctor-slots/by-doctor/:doctorId** - Get all slots for a doctor
- **PUT /api/doctor-slots/:id** - Update slot configuration like timing or days
- **POST /api/doctor-slots/:id/block-date** - Block specific date when doctor is unavailable
- **POST /api/doctor-slots/:id/unblock-date** - Unblock previously blocked date
- **GET /api/doctor-slots/:id/generate** - Generate bookable time slots for a date range

### Appointments
- **GET /api/appointments** - Get all appointments with filters for date, doctor, status
- **GET /api/appointments/:id** - Get details of specific appointment
- **PUT /api/appointments/:id/confirm** - Confirm pending appointment
- **PUT /api/appointments/:id/cancel** - Cancel appointment

### Lab Management
- **GET /api/lab/services** - Get all lab tests in the catalog
- **POST /api/lab/services** - Add new lab test to catalog
- **PUT /api/lab/services/:id** - Update lab test details or base pricing
- **GET /api/lab/vendors** - Get all lab vendors/providers
- **POST /api/lab/vendors** - Add new lab vendor to system
- **PUT /api/lab/vendors/:id** - Update vendor details like name, address, contact
- **POST /api/lab/vendors/:vendorId/pricing** - Set vendor's pricing for specific lab tests
- **GET /api/lab/vendors/:vendorId/pricing** - Get vendor's test pricing
- **POST /api/lab/vendors/:vendorId/slots** - Add availability time slots for vendor
- **GET /api/lab/vendors/:vendorId/slots** - Get vendor's available time slots
- **GET /api/lab/orders** - Get all lab orders with filters
- **GET /api/lab/prescriptions** - Get all uploaded lab prescriptions
- **GET /api/lab/prescriptions/:id** - Get prescription details
- **POST /api/lab/prescriptions/:id/digitize** - Convert prescription to cart by adding test items

### TPA Management
- **GET /api/tpa/claims** - Get all claims (admins see all, TPA users see assigned claims only)
- **GET /api/tpa/claims/unassigned** - Get claims that haven't been assigned to any TPA user
- **GET /api/tpa/claims/:id** - Get full details of a claim including documents
- **POST /api/tpa/claims/:id/assign** - Assign claim to a TPA user for processing
- **PUT /api/tpa/claims/:id/reassign** - Reassign claim to different TPA user
- **PUT /api/tpa/claims/:id/status** - Update claim processing status
- **POST /api/tpa/claims/:id/approve** - Approve claim with approved amount
- **POST /api/tpa/claims/:id/reject** - Reject claim with reason
- **POST /api/tpa/claims/:id/request-documents** - Ask member to submit additional documents
- **GET /api/tpa/analytics** - Get TPA analytics like total claims, pending, approved amounts
- **GET /api/tpa/users** - Get all TPA users with their workload statistics
- **GET /api/tpa/activity** - Get recent claim activity and actions

### Finance
- **GET /api/finance/payments/pending** - Get approved claims waiting for payment
- **GET /api/finance/payments/:id** - Get claim details for payment processing
- **POST /api/finance/payments/:id/complete** - Complete payment and record transaction details
- **GET /api/finance/payments/history** - Get payment history with date and status filters
- **GET /api/finance/analytics** - Get finance analytics like total paid, pending amount

### Categories & Services
- **GET /api/categories** - Get all service categories
- **POST /api/categories** - Create new category like consultation, pharmacy, diagnostics
- **PUT /api/categories/:id** - Update category name or details
- **GET /api/services** - Get all service types
- **POST /api/services** - Create new service type under a category
- **PUT /api/services/:id** - Update service type details

### Specialties
- **GET /api/specialties** - Get all medical specialties
- **POST /api/specialties** - Add new medical specialty
- **PUT /api/specialties/:id** - Update specialty name or details
- **PUT /api/specialties/:id/toggle** - Activate or deactivate specialty
- **DELETE /api/specialties/:id** - Delete specialty from system
