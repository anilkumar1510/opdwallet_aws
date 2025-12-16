# Admin Portal API Endpoints

This document lists all API endpoints used by the Admin Portal (web-admin), including Admin, Operations, TPA, and Finance modules.

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | User login with credentials |
| POST | /auth/logout | User logout |
| GET | /auth/me | Get current user information |

---

## Users Management

### Members (External Users)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /members | Create new member (external user) |
| GET | /members | Get all members with pagination/filters |
| GET | /members/:id | Get member by ID |
| PUT | /members/:id | Update member |
| DELETE | /members/:id | Delete member |
| POST | /members/:id/reset-password | Reset member password |
| POST | /members/:id/set-password | Set member password |
| GET | /members/:id/dependents | Get member dependents (family members) |
| GET | /members/:id/assignments | Get member policy assignments |
| GET | /members/:id/addresses | Get member addresses |
| POST | /members/:id/addresses | Create member address |
| PATCH | /members/:id/addresses/:addressId/default | Set default address |
| DELETE | /members/:id/addresses/:addressId | Delete address |

### Internal Users (Staff)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /internal-users | Create new internal user (staff) |
| GET | /internal-users | Get all internal users with pagination/filters |
| GET | /internal-users/:id | Get internal user by ID |
| PUT | /internal-users/:id | Update internal user |
| POST | /internal-users/:id/reset-password | Reset internal user password |
| POST | /internal-users/:id/set-password | Set internal user password |

### Unified Users (Deprecated - for backward compatibility)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /users | Get all users (checks both collections) | ⚠️ Deprecated - use /members or /internal-users |
| GET | /users/:id | Get user by ID (checks both collections) | ⚠️ Deprecated - use /members/:id or /internal-users/:id |

---

## Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /policies | Create new policy |
| GET | /policies | Get all policies with pagination/filters |
| GET | /policies/:id | Get policy by ID |
| GET | /policies/:id/current | Get policy with current configuration |
| PUT | /policies/:id | Update policy |
| DELETE | /policies/:id | Delete policy |

---

## Plan Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /policies/:policyId/config | Create new plan configuration |
| GET | /policies/:policyId/config | Get plan configuration with version |
| GET | /policies/:policyId/config/all | Get all plan configurations for policy |
| PUT | /policies/:policyId/config/:version | Update plan configuration |
| POST | /policies/:policyId/config/:version/publish | Publish plan configuration |
| POST | /policies/:policyId/config/:version/set-current | Set configuration as current |
| DELETE | /policies/:policyId/config/:version | Delete plan configuration |
| GET | /admin/categories/:categoryId/available-services | Get available services for category |
| PATCH | /policies/:policyId/config/:version/services/:categoryId | Update service configuration |

---

## Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /assignments | Assign policy to user |
| GET | /assignments | Get all assignments with pagination |
| GET | /assignments/policy/:policyId | Get assignments for specific policy |
| GET | /assignments/search-primary-members | Search primary members assigned to policy |
| DELETE | /assignments/:assignmentId | Remove/deactivate assignment |
| DELETE | /assignments/user/:userId/policy/:policyId | Unassign policy from user |

---

## Operations - Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/members/dashboard/stats | Get operations dashboard statistics |
| GET | /ops/members/search | Search members with pagination |
| GET | /ops/members/:id | Get member details with wallet/policy |
| POST | /ops/members/:id/wallet/topup | Top-up member wallet |

---

## Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /appointments | Create new appointment |
| GET | /appointments | Get all appointments with filters (admin) |
| GET | /appointments/user/:userId | Get appointments for specific user |
| GET | /appointments/:appointmentId | Get appointment details |
| PATCH | /appointments/:appointmentId/confirm | Confirm appointment |
| PATCH | /appointments/:appointmentId/cancel | Cancel appointment |

---

## Doctors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /doctors | Get all doctors with filters |
| GET | /doctors/:doctorId | Get doctor details |
| GET | /doctors/:doctorId/slots | Get doctor slots by clinic/date |
| POST | /doctors | Create new doctor |
| POST | /doctors/:doctorId/photo | Upload doctor photo |
| PUT | /doctors/:doctorId | Update doctor |
| PATCH | /doctors/:doctorId/activate | Activate doctor |
| PATCH | /doctors/:doctorId/deactivate | Deactivate doctor |
| POST | /doctors/:doctorId/set-password | Set doctor password |

---

## Doctor Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor-slots | Create slot configuration |
| GET | /doctor-slots | Get all slot configurations |
| GET | /doctor-slots/clinic/:clinicId | Get slots by clinic |
| GET | /doctor-slots/:slotId | Get slot configuration by ID |
| GET | /doctor-slots/:slotId/generate/:date | Generate time slots for date |
| PUT | /doctor-slots/:slotId | Update slot configuration |
| PATCH | /doctor-slots/:slotId/activate | Activate slot configuration |
| PATCH | /doctor-slots/:slotId/deactivate | Deactivate slot configuration |
| PATCH | /doctor-slots/:slotId/block-date | Block date for slots |
| PATCH | /doctor-slots/:slotId/unblock-date | Unblock date for slots |
| DELETE | /doctor-slots/:slotId | Delete slot configuration |

---

## Clinics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /clinics | Create new clinic |
| GET | /clinics | Get all clinics with filters |
| GET | /clinics/:clinicId | Get clinic by ID |
| PUT | /clinics/:clinicId | Update clinic |
| PATCH | /clinics/:clinicId/activate | Activate clinic |
| PATCH | /clinics/:clinicId/deactivate | Deactivate clinic |
| DELETE | /clinics/:clinicId | Delete clinic |

---

## Operations - Dental Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/dental-services/clinics | Get all clinics with dental service status |
| PUT | /ops/dental-services/clinics/:clinicId/toggle | Toggle dental services enabled/disabled at clinic level |
| GET | /ops/dental-services/clinics/:clinicId/services | Get all dental services for a clinic with pricing |
| PUT | /ops/dental-services/clinics/:clinicId/services/:serviceCode/toggle | Toggle service enabled/disabled for a clinic |
| PATCH | /ops/dental-services/clinics/:clinicId/services/:serviceCode/price | Update price for a service at a clinic |
| PUT | /ops/dental-services/clinics/:clinicId/services/bulk | Bulk update services (enable/disable and set prices) |
| GET | /ops/dental-services/clinics/:clinicId/services/:serviceCode/pricing | Get pricing details for a specific service at a clinic |
| DELETE | /ops/dental-services/clinics/:clinicId/services/:serviceCode | Delete pricing record (disables service and removes pricing) |
| POST | /ops/dental-services/clinics/:clinicId/slots | Create time slots for dental services at a clinic |
| GET | /ops/dental-services/clinics/:clinicId/slots | Get all time slots for a clinic |
| DELETE | /ops/dental-services/slots/:slotId | Delete a specific time slot |

**Notes:**
- All endpoints require authentication (JWT token via cookie)
- Access restricted to SUPER_ADMIN, ADMIN, and OPS roles
- **Clinic-level toggle must be enabled before individual services can be enabled**
- Disabling clinic-level toggle automatically disables all individual services
- Service codes are automatically converted to uppercase
- Prices must be positive numbers (>= 0)
- Services must be enabled before setting prices
- Category CAT006 (Dental Services) is hardcoded for all operations
- **Dental service slots can only be created for clinics with dental services enabled**
- Slot creation supports multiple dates in a single request
- Past dates are not allowed for slot creation
- Slot duration options: 15, 30, 45, 60 minutes (default: 30 minutes)
- Default max appointments per slot: 10

---

## Operations - Dental Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /dental/admin/appointments | Get all dental appointments with filters |
| PATCH | /dental/admin/appointments/:appointmentId/confirm | Confirm dental appointment |
| PATCH | /dental/admin/appointments/:appointmentId/cancel | Cancel dental appointment |
| PATCH | /dental/admin/appointments/:appointmentId/reschedule | Reschedule dental appointment |
| PATCH | /dental/admin/appointments/:appointmentId/mark-completed | Mark dental appointment as completed |
| PATCH | /dental/admin/appointments/:appointmentId/mark-no-show | Mark dental appointment as no-show |

**Notes:**
- All endpoints require authentication (JWT token via cookie)
- Access restricted to SUPER_ADMIN, ADMIN, and OPS roles
- Cancellation triggers wallet refund to member
- Appointment status workflow: PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW

---

## Specialties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /specialties | Get all active specialties |
| GET | /specialties/all | Get all specialties including inactive |
| GET | /specialties/:specialtyId | Get specialty by ID |
| POST | /specialties | Create new specialty |
| PUT | /specialties/:id | Update specialty |
| PATCH | /specialties/:id/toggle-active | Toggle specialty active status |
| DELETE | /specialties/:id | Delete specialty |

---

## Lab Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/lab/services | Create lab service |
| GET | /admin/lab/services | Get all lab services with filters |
| GET | /admin/lab/services/:id | Get lab service by ID |
| PATCH | /admin/lab/services/:id | Update lab service |
| DELETE | /admin/lab/services/:id | Deactivate lab service |
| POST | /admin/lab/vendors | Create lab vendor |
| GET | /admin/lab/vendors | Get all vendors |
| GET | /admin/lab/vendors/:id | Get vendor by ID |
| PATCH | /admin/lab/vendors/:id | Update vendor |
| POST | /admin/lab/vendors/:vendorId/pricing | Create vendor pricing |
| GET | /admin/lab/vendors/:vendorId/pricing | Get vendor pricing |
| PATCH | /admin/lab/vendors/:vendorId/pricing/:serviceId | Update vendor pricing |
| POST | /admin/lab/vendors/:vendorId/slots | Create vendor slots |
| GET | /admin/lab/vendors/:vendorId/slots | Get available slots |

---

## Lab Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ops/lab/prescriptions/queue | Get pending prescriptions queue |
| GET | /ops/lab/prescriptions/:id | Get prescription by ID |
| POST | /ops/lab/prescriptions/:id/eligible-vendors | Get eligible vendors for prescription |
| POST | /ops/lab/prescriptions/:id/digitize | Digitize prescription and create cart |
| PATCH | /ops/lab/prescriptions/:id/status | Update prescription status |
| GET | /ops/lab/orders | Get all lab orders with filters |
| GET | /ops/lab/orders/:orderId | Get order by ID |
| PATCH | /ops/lab/orders/:orderId/status | Update order status |
| PATCH | /ops/lab/orders/:orderId/confirm | Confirm order |
| PATCH | /ops/lab/orders/:orderId/collect | Mark sample collected |
| POST | /ops/lab/orders/:orderId/reports/upload | Upload test report |
| PATCH | /ops/lab/orders/:orderId/complete | Complete order |

---

## TPA (Claims Processing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tpa/claims | Get claims (filtered by role) |
| GET | /tpa/claims/unassigned | Get unassigned claims (admin only) |
| GET | /tpa/claims/:claimId | Get claim details |
| POST | /tpa/claims/:claimId/assign | Assign claim to TPA user |
| POST | /tpa/claims/:claimId/reassign | Reassign claim to different user |
| PATCH | /tpa/claims/:claimId/status | Update claim status |
| POST | /tpa/claims/:claimId/approve | Approve claim (full/partial) |
| POST | /tpa/claims/:claimId/reject | Reject claim |
| POST | /tpa/claims/:claimId/request-documents | Request documents from member |
| GET | /tpa/analytics/summary | Get TPA analytics summary |
| GET | /tpa/users | Get TPA users with workload |
| GET | /tpa/recent-activity | Get recent activity |

---

## Finance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /finance/claims/pending | Get pending payments (approved claims) |
| GET | /finance/claims/:claimId | Get claim details for payment |
| POST | /finance/claims/:claimId/complete-payment | Complete payment for claim |
| GET | /finance/payments/history | Get payment history |
| GET | /finance/analytics/summary | Get finance analytics summary |

---

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /payments | Get user payment history with filters |
| GET | /payments/:paymentId | Get payment details by ID |
| GET | /payments/summary/stats | Get payment summary statistics |
| POST | /payments | Create new payment request |
| POST | /payments/:paymentId/mark-paid | Mark payment as paid |
| POST | /payments/:paymentId/cancel | Cancel a payment |

---

## Masters - Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /categories | Create new category |
| GET | /categories | Get all categories with pagination |
| GET | /categories/ids | Get all category IDs |
| GET | /categories/:id | Get category by ID |
| PUT | /categories/:id | Update category |
| DELETE | /categories/:id | Delete category |
| PUT | /categories/:id/toggle-active | Toggle category status |
| POST | /categories/upsert-predefined | Upsert predefined categories (production-safe) |

---

## Masters - CUGs (Corporate User Groups)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /cugs | Create new CUG |
| GET | /cugs | Get all CUGs with pagination |
| GET | /cugs/active | Get all active CUGs |
| GET | /cugs/:id | Get CUG by ID |
| PUT | /cugs/:id | Update CUG |
| PATCH | /cugs/:id/toggle-active | Toggle CUG active status |
| DELETE | /cugs/:id | Delete CUG |
| POST | /cugs/seed | Seed default CUGs |

---

## Masters - Relationships

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /relationships | Get all active relationships |
| GET | /relationships/all | Get all relationships including inactive |
| GET | /relationships/:id | Get relationship by ID |
| POST | /relationships | Create new relationship |
| PUT | /relationships/:id | Update relationship |
| DELETE | /relationships/:id | Delete relationship |
| PATCH | /relationships/:id/toggle-active | Toggle relationship status |

---

## Masters - Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /services/types | Create service type |
| GET | /services/types | Get all service types with pagination |
| GET | /services/types/codes | Get all service codes |
| GET | /services/types/:id | Get service type by ID |
| PUT | /services/types/:id | Update service type |
| DELETE | /services/types/:id | Delete service type |
| PUT | /services/types/:id/toggle-active | Toggle service type status |
| GET | /services/categories/:category | Get services by category |

---

## Masters - Category Mappings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories/:categoryId/specialties | Get specialties with mapping status |
| PUT | /categories/:categoryId/specialties/:specialtyId/toggle | Toggle specialty mapping |
| GET | /categories/:categoryId/lab-services | Get lab services with mapping status |
| PUT | /categories/:categoryId/lab-services/:labServiceId/toggle | Toggle lab service mapping |

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | Get user notifications with filters |
| GET | /notifications/unread-count | Get unread count |
| PATCH | /notifications/:id/read | Mark notification as read |
| PATCH | /notifications/mark-all-read | Mark all as read |
| DELETE | /notifications/:id | Delete notification |

---

## Video Consultations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /video-consultations/start | Start video consultation (doctor) |
| POST | /video-consultations/join | Join video consultation (member) |
| POST | /video-consultations/:consultationId/end | End consultation |
| GET | /video-consultations/:consultationId/status | Get consultation status |
| GET | /video-consultations/doctor/history | Get doctor's consultation history |
| GET | /video-consultations/patient/history | Get patient's consultation history |

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Check health status and database connectivity |

---

## Migration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /migration/spouse-coverage | Migrate plan configs for spouse coverage |
| POST | /migration/service-transaction-limits | Migrate plan configs to add serviceTransactionLimits field |
| POST | /admin/migrate-invalid-services | Migrate invalid service categories |

---

**Total Endpoints: ~152**
