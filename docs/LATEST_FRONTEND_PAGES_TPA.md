# TPA Portal Frontend Pages

This document lists all frontend pages/routes in the TPA Portal (web-tpa) for claims processing operations.

**Portal URL:** `/tpa`
**Port (dev):** 3004
**Roles:** TPA_ADMIN, TPA_USER

**Redis Caching:** Claim approvals that credit member wallets trigger automatic cache invalidation in the Member Portal to ensure updated balances reflect immediately. See `REDIS_CACHING.md` and `LATEST_API_ENDPOINTS_TPA.md` for details.

---

## Role-Based Access Control (RBAC)

The TPA Portal implements comprehensive RBAC to differentiate access between TPA_ADMIN and TPA_USER roles.

### Access Control Summary

| Feature | TPA_ADMIN | TPA_USER |
|---------|-----------|----------|
| Dashboard | ✅ Full access with all metrics | ✅ Filtered to assigned claims only |
| All Claims page | ✅ See all claims | ✅ See only assigned claims (titled "My Claims") |
| Unassigned Claims | ✅ Full access | ❌ Hidden from navigation, route protected |
| Assigned Claims | ✅ Full access | ❌ Hidden from navigation, route protected |
| Analytics | ✅ Full access | ❌ Hidden from navigation, route protected |
| Members Management | ✅ Full access | ❌ Hidden from navigation, route protected |
| Claim Detail Actions | ✅ Can approve/reject/reassign any claim | ✅ Can only approve/reject assigned claims |

### RBAC Utilities

**Location:** `/web-tpa/lib/utils/rbac.ts`

Provides role-checking utility functions:
- `isTpaAdmin(role)` - Returns true if role is TPA_ADMIN or SUPER_ADMIN
- `isTpaUser(role)` - Returns true if role is TPA_USER
- `canAccessAdminFeatures(role)` - Alias for isTpaAdmin

**Location:** `/web-tpa/lib/hooks/useRoleGuard.ts`

Custom React hook for route protection:
- `useRoleGuard(allowedRoles, redirectTo)` - Automatically redirects unauthorized users
- Used in restricted pages (Unassigned, Assigned, Analytics, Users)
- Redirects TPA_USER to `/claims` when accessing admin-only pages

### Navigation Behavior

**Dynamic Navigation Items:**
- TPA_ADMIN: Sees all 6 navigation items (Dashboard, All Claims, Unassigned, Assigned, Analytics, Members)
- TPA_USER: Sees only 2 navigation items (Dashboard, My Claims)
- "All Claims" dynamically shows as "My Claims" for TPA_USER
- Page titles automatically adjust based on user role

**Implementation:** `/web-tpa/app/(tpa)/layout.tsx`
- Navigation items have `allowedRoles` property
- Filtered at render time based on `user?.role`
- Applies to both desktop and mobile navigation

### Backend Integration

**Controller Updates:** `/api/src/modules/tpa/tpa.controller.ts`
- `/tpa/claims` - Both roles, filters by assignedTo for TPA_USER
- `/tpa/claims/unassigned` - TPA_ADMIN only
- `/tpa/claims/assigned` - TPA_ADMIN only (removed TPA_USER)
- `/tpa/claims/:claimId` - Both roles, TPA_USER can only view assigned claims
- `/tpa/analytics/summary` - Both roles, filters data for TPA_USER

**Service Layer:** `/api/src/modules/tpa/tpa.service.ts`
- `getClaims()` - Automatically filters by assignedTo for TPA_USER
- `getClaimById()` - Uses `.lean()` query for authorization check before populate
- Returns `assignedToId` field to handle populate failures
- `getAnalyticsSummary()` - Filters all metrics by assignedTo for TPA_USER

---

## Authentication

| Path | Description |
|------|-------------|
| /login | TPA portal login page with role validation (TPA_ADMIN/TPA_USER only) |

---

## Dashboard

| Path | Role Access | Description |
|------|-------------|-------------|
| /tpa | Both (filtered) | **TPA_ADMIN:** Full analytics, View Analytics button, Quick Actions section<br>**TPA_USER:** Filtered analytics (assigned claims only), no View Analytics button, no Quick Actions section |

---

## Claims Management

| Path | Role Access | Description |
|------|-------------|-------------|
| /tpa/claims | Both (filtered) | **TPA_ADMIN:** Browse all claims with assignedTo filter<br>**TPA_USER:** See only assigned claims, page titled "My Claims", no Unassigned button, no assignedTo filter |
| /tpa/claims/unassigned | TPA_ADMIN only | View claims awaiting assignment. **Protected:** TPA_USER redirected to `/claims` |
| /tpa/claims/assigned | TPA_ADMIN only | View all assigned claims. **Protected:** TPA_USER redirected to `/claims` |
| /tpa/claims/[claimId] | Both (conditional) | **TPA_ADMIN:** Can view and take actions on any claim<br>**TPA_USER:** Can only view assigned claims, action buttons visible only for assigned claims |

**RBAC Implementation Details:**

**All Claims Page** (`/web-tpa/app/(tpa)/claims/page.tsx`):
- Uses `isTpaAdmin(user?.role)` to check permissions
- Page header dynamically shows "All Claims" or "My Claims"
- Unassigned button conditional: `{isAdmin && <Link href="/claims/unassigned">...}`
- AssignedTo filter hidden for TPA_USER in advanced filters section
- Backend `/api/tpa/claims` automatically filters by assignedTo for TPA_USER

**Claim Detail Page** (`/web-tpa/app/(tpa)/claims/[claimId]/page.tsx`):
- `canTakeAction()` checks both `assignedTo._id` and `assignedToId` (handles populate failures)
- Action buttons (Approve, Reject, Request Documents) only shown if `canTakeAction()` returns true
- TPA_USER can only see actions for claims assigned to them
- Backend returns `assignedToId` field to handle cases where populate fails
- Authorization check uses `.lean()` query before populate to access raw ObjectId

**Protected Pages** (Unassigned, Assigned):
- Use `useRoleGuard(['TPA_ADMIN', 'SUPER_ADMIN'])` hook
- Automatically redirects unauthorized users to `/claims`
- No flash of content before redirect

**Redis Cache Invalidation:**
- **Claim Approval** (`/tpa/claims/[claimId]`): When TPA approves claim (full or partial), member wallet is credited and `wallet:balance:{userId}` cache is invalidated. Member Portal shows updated balance on next page load. Floater wallets cascade to family members.

---

## User Management

| Path | Role Access | Description |
|------|-------------|-------------|
| /tpa/users | TPA_ADMIN only | Manage TPA user accounts. **Protected:** TPA_USER redirected to `/claims` |

**RBAC Implementation:**
- Uses `useRoleGuard(['TPA_ADMIN', 'SUPER_ADMIN'])` hook
- Hidden from TPA_USER navigation
- Direct URL access blocked with redirect

---

## Analytics

| Path | Role Access | Description |
|------|-------------|-------------|
| /tpa/analytics | TPA_ADMIN only | Full analytics and reporting dashboard. **Protected:** TPA_USER redirected to `/claims` |

**RBAC Implementation:**
- Uses `useRoleGuard(['TPA_ADMIN', 'SUPER_ADMIN'])` hook
- Hidden from TPA_USER navigation
- Direct URL access blocked with redirect
- Backend `/api/tpa/analytics/summary` accessible to both roles but filters data for TPA_USER

---

**Total Pages: 8**

## Key Features

### Security & Access Control
- Independent authentication with `/tpa` cookie path
- **Multi-layered RBAC implementation:**
  - Frontend: Navigation filtering + route guards (`useRoleGuard` hook)
  - Backend: `@Roles` decorators on endpoints
  - Service: Automatic query filtering based on user role
- TPA_ADMIN sees all claims, TPA_USER sees assigned claims only
- No unauthorized content flash (checks happen before render)
- Graceful handling of populate failures in authorization checks

### Claim Management
- Claim workflow: Review → Approve/Reject/Request Documents
- Real-time assignment and reassignment (TPA_ADMIN only)
- Document request and tracking system
- Comprehensive audit trail for all claim actions
- Action buttons conditionally shown based on role and assignment

### User Experience
- **Dynamic UI based on role:**
  - Navigation items filtered by allowed roles
  - Page titles adjust ("All Claims" vs "My Claims")
  - Dashboard sections conditional (Quick Actions for admin only)
  - Filters hidden for restricted access (assignedTo filter for TPA_USER)
- **Seamless redirection:** Unauthorized access redirects to appropriate page
- **Consistent messaging:** Clear indication of user's scope (e.g., "X claims assigned to you")

### Technical Implementation
- **RBAC Utilities:** `/web-tpa/lib/utils/rbac.ts` (role checking functions)
- **Route Protection:** `/web-tpa/lib/hooks/useRoleGuard.ts` (redirect hook)
- **Backend Filtering:** Service layer automatically applies role-based filters
- **Type-safe:** All role checks use TypeScript enums and utility functions
- **Performance:** Uses `.lean()` queries for authorization checks before expensive populates
