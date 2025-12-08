# Admin Portal Documentation

## Pages

### Main Dashboard & Auth
- **/admin** - Main dashboard showing system overview with quick access to key functions
- **/admin/login** - Login page for admin users

### User Management
- **/admin/users** - List all users with search and filters
- **/admin/users/new** - Create new admin, operations, TPA, or finance users
- **/admin/users/[id]** - View and edit user details, assign policies with searchable primary member selection for dependents

### Policy Management
- **/admin/policies** - View all insurance policies
- **/admin/policies/new** - Create new insurance policy
- **/admin/policies/[id]** - View policy details
- **/admin/policies/[id]/assignments** - Assign policy to corporate users
- **/admin/policies/[id]/plan-config** - Configure plan benefits and wallet categories
- **/admin/policies/[id]/plan-config/[version]** - View specific version of plan configuration

### Master Data
- **/admin/categories** - Manage service categories like consultation, pharmacy, diagnostics
- **/admin/services** - Configure category-specialty mappings and lab service assignments by category (specialties for In-Clinic/Online, RADIOLOGY/ENDOSCOPY for Diagnostic, PATHOLOGY/CARDIOLOGY/OTHER for Laboratory)
- **/admin/cugs** - Manage Corporate User Groups (CUG) with company details and employee counts
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
- **POST /api/users/:id/set-password** - Set password for a user
- **GET /api/users/:id/dependents** - Get family members and dependents of a user
- **GET /api/users/:id/assignments** - Get policy assignments for a specific user
- **GET /api/users/:id/addresses** - Get all addresses for a user
- **POST /api/users/:id/addresses** - Create a new address for a user
- **PATCH /api/users/:id/addresses/:addressId/default** - Set an address as default
- **DELETE /api/users/:id/addresses/:addressId** - Delete an address

### Policy Management
- **GET /api/policies** - Get all insurance policies in the system
- **POST /api/policies** - Create new insurance policy with corporate details and optional corporateName
- **GET /api/policies/:id** - Get details of specific policy by ID
- **GET /api/policies/:id/current** - Get policy with current active configuration for members (now populates corporateName from user's assigned CUG)
- **PUT /api/policies/:id** - Update policy information including corporateName
- **DELETE /api/policies/:id** - Delete policy if it's not assigned to any users
- **POST /api/policies/:id/assign** - Assign policy to one or more users

### Plan Configuration
- **POST /api/policies/:policyId/config** - Create plan configuration with wallet categories and limits
- **GET /api/policies/:policyId/config/all** - Get all plan configurations for a policy
- **GET /api/policies/:policyId/config/:version** - Get details of a specific plan configuration version
- **PUT /api/policies/:policyId/config/:version** - Update plan configuration settings
- **POST /api/policies/:policyId/config/:version/publish** - Publish plan configuration
- **POST /api/policies/:policyId/config/:version/set-current** - Set configuration as current
- **DELETE /api/policies/:policyId/config/:version** - Delete plan configuration

### Assignments
- **GET /api/assignments** - Get policy assignments for users
- **POST /api/assignments** - Assign policy to users with start and end dates
- **PUT /api/assignments/:id** - Update assignment details like effective dates
- **GET /api/assignments/my-policy** - Get current user policy configuration with copay details (MEMBER role)
- **GET /api/assignments/search-primary-members** - Search primary members (SELF/REL001) assigned to a policy by Member ID, Name, Employee ID, or UHID (used in AssignPolicyModal autocomplete)
- **DELETE /api/assignments/:assignmentId** - Remove assignment (deactivate)
- **DELETE /api/assignments/user/:userId/policy/:policyId** - Unassign policy from user

### Operations - Member Management
- **GET /api/ops/members/search** - Search members by name, email, phone, or member ID
- **GET /api/ops/members/:id** - Get member details with wallet balance and policy information
- **POST /api/ops/members/:id/wallet/topup** - Add money to member's wallet for specific category

### Doctor Management
- **GET /api/doctors** - Get all doctors with filters for specialty and clinic location
- **POST /api/doctors** - Create new doctor profile with personal and professional details
- **PUT /api/doctors/:id** - Update doctor information
- **POST /api/doctors/:id/photo** - Upload doctor's profile photo
- **PATCH /api/doctors/:doctorId/activate** - Activate doctor account
- **PATCH /api/doctors/:doctorId/deactivate** - Deactivate doctor account
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
- **GET /api/doctor-slots/clinic/:clinicId** - Get all slots for a clinic
- **PUT /api/doctor-slots/:id** - Update slot configuration like timing or days
- **PATCH /api/doctor-slots/:id/block-date** - Block specific date when doctor is unavailable
- **PATCH /api/doctor-slots/:id/unblock-date** - Unblock previously blocked date
- **GET /api/doctor-slots/:slotId/generate/:date** - Generate bookable time slots for a specific date

### Appointments
- **GET /api/appointments** - Get all appointments with filters for date, doctor, status
- **GET /api/appointments/:id** - Get details of specific appointment
- **PATCH /api/appointments/:id/confirm** - Confirm pending appointment
- **PATCH /api/appointments/:id/cancel** - Cancel appointment

### Lab Management
- **GET /api/admin/lab/services** - Get all lab tests in the catalog
- **POST /api/admin/lab/services** - Add new lab test to catalog
- **PUT /api/admin/lab/services/:id** - Update lab test details or base pricing
- **GET /api/admin/lab/vendors** - Get all lab vendors/providers
- **POST /api/admin/lab/vendors** - Add new lab vendor to system
- **PUT /api/admin/lab/vendors/:id** - Update vendor details like name, address, contact
- **POST /api/admin/lab/vendors/:vendorId/pricing** - Set vendor's pricing for specific lab tests
- **GET /api/admin/lab/vendors/:vendorId/pricing** - Get vendor's test pricing
- **POST /api/admin/lab/vendors/:vendorId/slots** - Add availability time slots for vendor
- **GET /api/admin/lab/vendors/:vendorId/slots** - Get vendor's available time slots
- **GET /api/admin/lab/orders** - Get all lab orders with filters
- **GET /api/admin/lab/prescriptions** - Get all uploaded lab prescriptions
- **GET /api/admin/lab/prescriptions/:id** - Get prescription details
- **POST /api/admin/lab/prescriptions/:id/digitize** - Convert prescription to cart by adding test items

### TPA Management
- **GET /api/tpa/claims** - Get all claims (admins see all, TPA users see assigned claims only)
- **GET /api/tpa/claims/unassigned** - Get claims that haven't been assigned to any TPA user
- **GET /api/tpa/claims/:id** - Get full details of a claim including documents
- **POST /api/tpa/claims/:id/assign** - Assign claim to a TPA user for processing
- **POST /api/tpa/claims/:id/reassign** - Reassign claim to different TPA user
- **PATCH /api/tpa/claims/:id/status** - Update claim processing status
- **POST /api/tpa/claims/:id/approve** - Approve claim with approved amount
- **POST /api/tpa/claims/:id/reject** - Reject claim with reason
- **POST /api/tpa/claims/:id/request-documents** - Ask member to submit additional documents
- **GET /api/tpa/analytics/summary** - Get TPA analytics like total claims, pending, approved amounts
- **GET /api/tpa/users** - Get all TPA users with their workload statistics
- **GET /api/tpa/recent-activity** - Get recent claim activity and actions

### Finance
- **GET /api/finance/claims/pending** - Get approved claims waiting for payment
- **GET /api/finance/claims/:claimId** - Get claim details for payment processing
- **POST /api/finance/claims/:claimId/complete-payment** - Complete payment and record transaction details
- **GET /api/finance/payment-history** - Get payment history with date and status filters
- **GET /api/finance/analytics/summary** - Get finance analytics like total paid, pending amount

### Categories & Services
- **GET /api/categories** - Get all service categories
- **POST /api/categories** - Create new category like consultation, pharmacy, diagnostics
- **PUT /api/categories/:id** - Update category name or details
- **GET /api/categories/:categoryId/specialties** - Get all specialties with mapping status for a category (CAT001 or CAT005)
- **PUT /api/categories/:categoryId/specialties/:specialtyId/toggle** - Toggle specialty mapping for a category (enable/disable specialty for that category)
- **GET /api/categories/:categoryId/lab-services?categories=RADIOLOGY,ENDOSCOPY** - Get lab services with mapping status for a category (CAT003 for Diagnostic, CAT004 for Laboratory). Optional query param 'categories' filters by lab service categories (comma-separated)
- **PUT /api/categories/:categoryId/lab-services/:labServiceId/toggle** - Toggle lab service mapping for a category (enable/disable lab service for that category)
- **GET /api/services** - Get all service types
- **POST /api/services** - Create new service type under a category
- **PUT /api/services/:id** - Update service type details

### Specialties
- **GET /api/specialties** - Get all medical specialties
- **POST /api/specialties** - Add new medical specialty
- **PUT /api/specialties/:id** - Update specialty name or details
- **PUT /api/specialties/:id/toggle** - Activate or deactivate specialty
- **DELETE /api/specialties/:id** - Delete specialty from system

### Corporate User Groups (CUG)
- **GET /api/cugs** - Get all Corporate User Groups with search and filters
- **POST /api/cugs** - Create new CUG with company name, ID, code, and employee count
- **GET /api/cugs/active** - Get all active CUGs for dropdown selection in user forms
- **PUT /api/cugs/:id** - Update CUG details including company information
- **PUT /api/cugs/:id/toggle-active** - Activate or deactivate CUG
- **DELETE /api/cugs/:id** - Delete CUG from system
