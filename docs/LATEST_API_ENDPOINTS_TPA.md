# TPA Portal API Endpoints

This document lists all API endpoints used by the TPA Portal (web-tpa) for claims processing operations.

**Portal URL:** `/tpa`
**Port (dev):** 3004
**Roles:** TPA_ADMIN, TPA_USER

**Redis Caching:** Claim approvals that credit member wallets trigger automatic cache invalidation in the Member Portal. See `REDIS_CACHING.md` for details.

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | User login with credentials (TPA role validation) |
| POST | /auth/logout | User logout |
| GET | /auth/me | Get current user information |
| POST | /auth/refresh | Refresh access token using refresh token |

---

## TPA (Claims Processing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tpa/claims | Get claims (filtered by role) |
| GET | /tpa/claims/unassigned | Get unassigned claims (admin only) |
| GET | /tpa/claims/assigned | Get assigned claims (all roles) |
| GET | /tpa/claims/:claimId | Get claim details |
| POST | /tpa/claims/:claimId/assign | Assign claim to TPA user |
| POST | /tpa/claims/auto-assign | Distribute unassigned claims across available TPA users (admin only) |
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

**POST /tpa/claims/auto-assign** (TPA_ADMIN, ADMIN, SUPER_ADMIN):

Request body:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| assigneeIds | string[] | Yes | Internal user IDs of the TPA users marked available. All must be ACTIVE with role TPA_USER or TPA_ADMIN, otherwise the request is rejected with 400 |
| claimIds | string[] | No | Business claim IDs to distribute. Omit to take every unassigned claim |
| strategy | `BALANCED` \| `ROUND_ROBIN` | No | Defaults to `BALANCED` |
| notes | string | No | Recorded on every assignment in the batch |
| maxClaims | number (1-500) | No | Safety cap per run, defaults to 200 |

Behaviour:
- Picks up the same claims the unassigned list shows: status SUBMITTED or UNASSIGNED with no `assignedTo`.
- Distributes oldest claim first (`submittedAt` ascending), so the longest-waiting member is served first.
- `BALANCED` seeds each user with the open claims they already hold and always hands the next claim to the lowest, which levels the queue. `ROUND_ROBIN` starts everyone at zero, splitting only this batch evenly.
- Ties go to whoever sorts first by `name.fullName` — the same order `GET /tpa/users` returns, so the portal's preview matches the outcome exactly.
- Each claim is saved individually and records the same status/review history as a single assign. A claim that fails to save is reported in `failed[]` and does not abort the run (some legacy claim documents are missing required fields and cannot be saved by any assign path).

Response: `assignedCount`, `totalCandidates`, `strategy`, `distribution[]` (per user: `assigned`, `previousWorkload`, `newWorkload`) and `failed[]`.

**Redis Cache Invalidation:**
- **POST /tpa/claims/:claimId/approve**: When claim is approved, wallet is credited, triggering invalidation of `wallet:balance:{userId}` cache. Member Portal reflects updated balance immediately on next load.
- **Floater Wallets**: Cache invalidation cascades to all family members when floater wallet is credited
- **Performance**: Cache invalidation completes in <10ms, ensuring near-instant reflection in Member Portal

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Check health status and database connectivity |

---

**Total Endpoints: 16**

**Access Control:**
- Login page validates TPA_ADMIN or TPA_USER role
- Non-TPA users are logged out immediately
- Independent session management via `/tpa` cookie path
