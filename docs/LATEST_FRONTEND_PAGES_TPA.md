# TPA Portal Frontend Pages

This document lists all frontend pages/routes in the TPA Portal (web-tpa) for claims processing operations.

**Portal URL:** `/tpa`
**Port (dev):** 3004
**Roles:** TPA_ADMIN, TPA_USER

---

## Authentication

| Path | Description |
|------|-------------|
| /tpa/login | TPA portal login page with role validation (TPA_ADMIN/TPA_USER only) |

---

## Dashboard

| Path | Description |
|------|-------------|
| /tpa | TPA dashboard with claims analytics and workload overview |

---

## Claims Management

| Path | Description |
|------|-------------|
| /tpa/claims | Browse all submitted claims with filters |
| /tpa/claims/unassigned | View claims awaiting TPA reviewer assignment (TPA_ADMIN only) |
| /tpa/claims/assigned | View claims assigned to TPA reviewers |
| /tpa/claims/[claimId] | View full claim details with review workflow |

---

## User Management

| Path | Description |
|------|-------------|
| /tpa/users | Manage TPA user accounts (TPA_ADMIN only) |

---

## Analytics

| Path | Description |
|------|-------------|
| /tpa/analytics | TPA analytics and reporting dashboard |

---

**Total Pages: 8**

**Key Features:**
- Independent authentication with `/tpa` cookie path
- Role-based access (TPA_ADMIN sees all claims, TPA_USER sees assigned claims only)
- Claim workflow: Review → Approve/Reject/Request Documents
- Real-time assignment and reassignment
- Document request and tracking system
- Comprehensive audit trail for all claim actions
