# Admin Portal Frontend Pages

This document lists all frontend pages/routes in the Admin Portal (web-admin) for core administrative functions.

**Portal URL:** `/admin`
**Port (dev):** 3001
**Roles:** SUPER_ADMIN, ADMIN

**Note:** Operations, TPA, and Finance modules have been moved to separate portals with independent documentation:
- Operations Portal: `/operations` - See `LATEST_FRONTEND_PAGES_OPERATIONS.md`
- TPA Portal: `/tpa` - See `LATEST_FRONTEND_PAGES_TPA.md`
- Finance Portal: `/finance` - See `LATEST_FRONTEND_PAGES_FINANCE.md`

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

## Lab Administration

| Path | Description |
|------|-------------|
| /admin/lab | Lab dashboard with service and vendor statistics |
| /admin/lab/services | Manage lab test services catalog |
| /admin/lab/vendors | Manage lab partner vendors |
| /admin/lab/vendors/[vendorId]/pricing | Manage vendor-specific lab service pricing |
| /admin/lab/vendors/[vendorId]/slots | Manage booking slots for vendor |

---

**Total Pages: 15**

**Key Features:**
- Core administrative functions: users, policies, masters
- Policy configuration and assignment management
- Lab service and vendor administration
- Category and CUG management
- Comprehensive admin dashboard
- Independent authentication with `/admin` cookie path
- Restricted to SUPER_ADMIN and ADMIN roles only
