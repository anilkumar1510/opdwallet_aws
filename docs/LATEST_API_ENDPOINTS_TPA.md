# TPA Portal API Endpoints

This document lists all API endpoints used by the TPA Portal (web-tpa) for claims processing operations.

**Portal URL:** `/tpa`
**Port (dev):** 3004
**Roles:** TPA_ADMIN, TPA_USER

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | User login with credentials (TPA role validation) |
| POST | /auth/logout | User logout |
| GET | /auth/me | Get current user information |

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

**Notes:**
- All endpoints require authentication (JWT token via cookie with path `/tpa`)
- Access restricted to TPA_ADMIN and TPA_USER roles
- TPA_ADMIN can see all claims (assigned/unassigned)
- TPA_USER can only see their assigned claims
- Claim status workflow: PENDING → UNDER_REVIEW → APPROVED/REJECTED/PENDING_DOCUMENTS
- Document requests pause claim processing until documents are submitted
- Partial approvals allow for copay adjustments
- All actions are logged for audit trail

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Check health status and database connectivity |

---

**Total Endpoints: 15**

**Access Control:**
- Login page validates TPA_ADMIN or TPA_USER role
- Non-TPA users are logged out immediately
- Independent session management via `/tpa` cookie path
