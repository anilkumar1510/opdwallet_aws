# Operations Portal Frontend Pages

This document lists all frontend pages/routes in the Operations Portal (web-operations) for operational management.

**Portal URL:** `/operations`
**Port (dev):** 3005
**Roles:** OPS

---

## Authentication

| Path | Description |
|------|-------------|
| /operations/login | Operations portal login page with role validation (OPS only) |

---

## Dashboard

| Path | Description |
|------|-------------|
| /operations | Operations dashboard with key metrics and activity overview |

---

## Member Management

| Path | Description |
|------|-------------|
| /operations/members | Search and browse all members with pagination |
| /operations/members/[id] | Comprehensive member profile with wallet details and topup functionality |

---

## Appointment Management

| Path | Description |
|------|-------------|
| /operations/appointments | View and manage all appointments with filtering and status updates |

---

## Doctor Management

| Path | Description |
|------|-------------|
| /operations/doctors | Manage doctor profiles with activation/deactivation |
| /operations/doctors/new | Create new doctor profile with specialization |
| /operations/doctors/[id] | Edit existing doctor profile details |
| /operations/doctors/[id]/schedules | Manage doctor appointment schedules and slot configurations |

---

## Clinic Management

| Path | Description |
|------|-------------|
| /operations/clinics | Manage clinic information with filters |
| /operations/clinics/new | Create new clinic with location and operating hours |
| /operations/clinics/[id] | Edit existing clinic details and status |

---

## Dental Services

| Path | Description |
|------|-------------|
| /operations/dental-services | Manage dental services at clinic level with pricing configuration |
| /operations/dental-services/[clinicId] | Configure dental services and pricing for specific clinic |

---

## Vision Services

| Path | Description |
|------|-------------|
| /operations/vision-services | Manage vision services at clinic level (no pricing) |
| /operations/vision-services/[clinicId] | Configure vision services for specific clinic |

---

## Lab Management

| Path | Description |
|------|-------------|
| /operations/lab/prescriptions | Browse lab prescriptions for digitization |
| /operations/lab/prescriptions/[id]/digitize | Digitize individual prescription and create cart |
| /operations/lab/orders | Manage lab orders and track status through workflow |

---

**Total Pages: 18**

**Key Features:**
- Independent authentication with `/operations` cookie path
- OPS role-only access control
- Comprehensive member management with wallet topup
- Doctor and clinic lifecycle management
- Dental service pricing configuration per clinic
- Vision service management (operations-only booking)
- Lab prescription digitization and order tracking
- Appointment confirmation and cancellation workflows
- Real-time booking status updates
