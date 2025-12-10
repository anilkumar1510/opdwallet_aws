# Admin Portal Frontend Pages

This document lists all frontend pages/routes in the Admin Portal (web-admin), including Admin, Operations, TPA, and Finance modules.

---

## Authentication

| Path | Description |
|------|-------------|
| /admin/login | Admin portal login page with email/password authentication |

---

## Dashboard

| Path | Description |
|------|-------------|
| /admin | Main admin dashboard with overview metrics and quick actions |

---

## User Management

| Path | Description |
|------|-------------|
| /admin/users | List all system users with search and role filtering |
| /admin/users/new | Create new admin/system user with role assignment |
| /admin/users/[id] | Edit existing user details and permissions |

---

## Policy Management

| Path | Description |
|------|-------------|
| /admin/policies | List all insurance policies with search and filters |
| /admin/policies/new | Create new insurance policy |
| /admin/policies/[id] | View and edit policy details |
| /admin/policies/[id]/assignments | Manage member assignments to policy |
| /admin/policies/[id]/plan-config | View plan configuration versions |
| /admin/policies/[id]/plan-config/[version] | Edit specific plan version with benefits configuration |

---

## Masters Data

| Path | Description |
|------|-------------|
| /admin/categories | Manage service categories (predefined and custom) |
| /admin/cugs | Manage Corporate User Groups (CUGs) |
| /admin/masters | Tabbed interface for relationship and specialty masters |
| /admin/services | Service management with specialty and lab service mappings |

---

## Operations Module

| Path | Description |
|------|-------------|
| /admin/operations | Operations dashboard with key metrics |
| /admin/operations/members | Search and browse all members |
| /admin/operations/members/[id] | Comprehensive member profile with wallet details |
| /admin/operations/appointments | View and manage all appointments |
| /admin/operations/doctors | Manage doctor profiles |
| /admin/operations/doctors/new | Create new doctor profile |
| /admin/operations/doctors/[id] | Edit existing doctor profile |
| /admin/operations/doctors/[id]/schedules | Manage doctor appointment schedules |
| /admin/operations/clinics | Manage clinic information |
| /admin/operations/clinics/new | Create new clinic |
| /admin/operations/clinics/[id] | Edit existing clinic |
| /admin/operations/lab/prescriptions | Browse lab prescriptions for digitization |
| /admin/operations/lab/prescriptions/[id]/digitize | Digitize individual prescription |
| /admin/operations/lab/orders | Manage lab orders and track status |

---

## Lab Management

| Path | Description |
|------|-------------|
| /admin/lab | Lab dashboard with service and vendor statistics |
| /admin/lab/services | Manage lab test services catalog |
| /admin/lab/vendors | Manage lab partner vendors |
| /admin/lab/vendors/[vendorId]/pricing | Manage vendor-specific lab service pricing |
| /admin/lab/vendors/[vendorId]/slots | Manage booking slots for vendor |

---

## TPA Module

| Path | Description |
|------|-------------|
| /admin/tpa | TPA dashboard with claims analytics |
| /admin/tpa/claims | Browse all submitted claims with filters |
| /admin/tpa/claims/unassigned | View claims awaiting TPA reviewer assignment |
| /admin/tpa/claims/assigned | View claims assigned to TPA reviewers |
| /admin/tpa/claims/[claimId] | View full claim details with review workflow |
| /admin/tpa/users | Manage TPA user accounts |
| /admin/tpa/analytics | TPA analytics and reporting dashboard |

---

## Finance Module

| Path | Description |
|------|-------------|
| /admin/finance | Finance dashboard with payment analytics |
| /admin/finance/payments/pending | List approved claims awaiting payment |
| /admin/finance/payments/history | View completed payment history |

---

**Total Pages: ~45**
