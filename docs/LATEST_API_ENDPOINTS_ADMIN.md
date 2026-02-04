# Admin Portal API Endpoints

This document lists all API endpoints used by the Admin Portal (web-admin) for core administrative functions.

**Portal URL:** `/admin`
**Port (dev):** 3001
**Roles:** SUPER_ADMIN, ADMIN

**Note:** Operations, TPA, and Finance modules have been moved to separate portals with independent documentation:
- Operations Portal: `/operations` - See `LATEST_API_ENDPOINTS_OPERATIONS.md`
- TPA Portal: `/tpa` - See `LATEST_API_ENDPOINTS_TPA.md`
- Finance Portal: `/finance` - See `LATEST_API_ENDPOINTS_FINANCE.md`

**Redis Caching:** This portal performs cache invalidation operations on Member Portal caches. See `REDIS_CACHING.md` for comprehensive caching architecture.

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
| GET | /members/:id/dependents | Get member dependents (family members) |
| GET | /members/:id/assignments | Get member policy assignments |

**Note:** Member address management is done via `/users/:id/addresses` endpoints (see Unified Users section below).

### Internal Users (Staff)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /internal-users | Create new internal user (staff) |
| GET | /internal-users | Get all internal users with pagination/filters |
| GET | /internal-users/:id | Get internal user by ID |
| PUT | /internal-users/:id | Update internal user |
| DELETE | /internal-users/:id | Delete internal user |
| POST | /internal-users/:id/reset-password | Reset internal user password |

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

### Redis Cache Invalidation

**Cache Strategy:** Plan configurations are heavily cached (30-minute TTL) as they rarely change. Cache invalidation is triggered on admin updates to ensure immediate propagation.

**Cache Invalidation Triggers:**

1. **PUT /policies/:policyId/config/:version (Update Config)**
   - **Invalidates:**
     - `plan:config:{policyId}` - Current version cache
     - `plan:config:{policyId}:v{version}` - Specific version cache
     - Cascade to all member profiles using this policy
   - **Implementation:** `plan-config.service.ts:updateConfig()`

2. **POST /policies/:policyId/config/:version/publish (Publish Config)**
   - **Invalidates:**
     - `plan:config:{policyId}` - Forces reload of published version
     - All member profiles assigned to this policy
   - **Implementation:** `plan-config.service.ts:publishConfig()`

3. **POST /policies/:policyId/config/:version/set-current (Set Current)**
   - **Invalidates:**
     - `plan:config:{policyId}` - Forces reload of new current version
     - All member profiles assigned to this policy
   - **Implementation:** `plan-config.service.ts:setCurrentConfig()`

**Cascade Invalidation Logic:**

```typescript
// plan-config.service.ts
private async invalidatePlanConfigCache(policyId: string, version?: number): Promise<void> {
  // Delete plan config cache
  const cacheKey = version ? `plan:config:${policyId}:v${version}` : `plan:config:${policyId}`;
  await this.cacheManager.del(cacheKey);

  // Cascade: Invalidate all member profiles using this policy
  const assignments = await this.assignmentModel
    .find({ policyId, isActive: true })
    .select('userId')
    .lean();

  await Promise.all(
    assignments.map(a => this.cacheManager.del(`member:profile:${a.userId}`))
  );
}
```

**Performance Impact:**
- Plan config cache hit rate: 95%+
- Cache invalidation: <50ms for typical policy (10-50 assigned users)
- Large policies (100+ users): <200ms for cascade invalidation

**Monitoring:**
```bash
# Watch plan config cache invalidation
docker logs opd-api-dev -f | grep "plan:config"

# Example output:
# [CACHE DELETE] plan:config:6964b3551b07d3458cc19fa6 | Reason: config updated
# [CACHE DELETE] member:profile:6960ed35cfa3c189f7556949 | Reason: plan config changed
```

**Related Documentation:** See `REDIS_CACHING.md` for complete caching architecture.

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

### Redis Cache Invalidation

**Critical Feature:** Policy assignment and unassignment operations trigger automatic cache invalidation in the Member Portal to ensure users see updated data immediately.

**Cache Invalidation Triggers:**

1. **POST /assignments (Assign Policy)**
   - **Invalidates:**
     - `member:profile:{userId}` - User's profile cache
     - `wallet:balance:{userId}` - User's wallet cache
     - Cascade invalidation for floater family members
   - **Reason:** New policy assignment updates wallet balances, benefits, and family member relationships
   - **Implementation:** `assignments.service.ts:createAssignment()`

2. **DELETE /assignments/:assignmentId (Remove Assignment)**
   - **Invalidates:**
     - `member:profile:{userId}` - User's profile cache
     - `wallet:balance:{userId}` - User's wallet cache
     - Cascade invalidation for floater family members
   - **Reason:** Policy removal updates wallet availability and benefits
   - **Implementation:** `assignments.service.ts:removeAssignment()`

3. **DELETE /assignments/user/:userId/policy/:policyId (Unassign Policy)**
   - **Invalidates:**
     - `member:profile:{userId}` - User's profile cache
     - `wallet:balance:{userId}` - User's wallet cache
     - `member:profile:{primaryMemberId}` - Primary member's profile (for dependents)
     - `member:family:{primaryMemberId}` - Family relationships cache
     - All dependent profiles in floater family
   - **Reason:** Unassignment removes wallet, benefits, and potentially family relationships
   - **Implementation:** `assignments.service.ts:unassignPolicyFromUser()`
   - **Floater Handling:** If user is dependent, invalidates primary member's cache; if primary, invalidates all dependents

**Invalidation Strategy:**

```typescript
// Helper method in assignments.service.ts
private async invalidateUserCache(userId: string, reason: string): Promise<void> {
  // Delete profile cache
  await this.cacheManager.del(`member:profile:${userId}`);

  // Delete wallet cache
  await this.cacheManager.del(`wallet:balance:${userId}`);

  // Handle floater family cascade
  const user = await this.userModel.findById(userId).select('primaryMemberId').lean();
  if (user?.primaryMemberId) {
    // Invalidate primary member
    await this.cacheManager.del(`member:profile:${user.primaryMemberId}`);
    await this.cacheManager.del(`wallet:balance:${user.primaryMemberId}`);
  } else {
    // Invalidate all dependents
    const dependents = await this.userModel.find({ primaryMemberId: userId }).select('_id').lean();
    await Promise.all(dependents.map(dep => [
      this.cacheManager.del(`member:profile:${dep._id}`),
      this.cacheManager.del(`wallet:balance:${dep._id}`)
    ]).flat());
  }
}
```

**User Experience Impact:**
- **Before:** Admin unassigns policy → Member portal shows stale cached data for 5-10 minutes
- **After:** Admin unassigns policy → Member portal cache invalidated → Next request fetches fresh data showing removal

**Performance Impact:**
- Cache invalidation: <10ms per user
- Cascade invalidation for family: <50ms for typical family size (1 primary + 3-5 dependents)
- Next member portal request triggers cache miss and rebuilds cache with fresh data

**Monitoring:**
```bash
# Watch cache invalidation logs
docker logs opd-api-dev -f | grep "CACHE DELETE"

# Example output:
# [CACHE DELETE] member:profile:6960ed35cfa3c189f7556949 | Reason: policy unassigned
# [CACHE DELETE] wallet:balance:6960ed35cfa3c189f7556949 | Reason: policy unassigned
```

**Related Documentation:**
- Full caching architecture: `REDIS_CACHING.md`
- Member Portal cache strategy: `LATEST_API_ENDPOINTS_MEMBER.md`
- Configuration: `api/src/config/configuration.ts`

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

### Lab Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/lab/services | Create lab service |
| GET | /admin/lab/services | Get all lab services with filters (supports ?category and ?search) |
| GET | /admin/lab/services/:id | Get lab service by ID |
| PATCH | /admin/lab/services/:id | Update lab service |
| PATCH | /admin/lab/services/:id/activate | Activate lab service |
| PATCH | /admin/lab/services/:id/deactivate | Deactivate lab service (blocks if service is in active AHC packages) |

### Lab Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/lab/vendors | Create lab vendor |
| GET | /admin/lab/vendors | Get all vendors |
| GET | /admin/lab/vendors/:id | Get vendor by ID |
| PATCH | /admin/lab/vendors/:id | Update vendor |

### Vendor Pricing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/lab/vendors/:vendorId/pricing | Create vendor pricing |
| GET | /admin/lab/vendors/:vendorId/pricing | Get vendor pricing |
| PATCH | /admin/lab/vendors/:vendorId/pricing/:serviceId | Update vendor pricing |

### Vendor Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/lab/vendors/:vendorId/slots | Create vendor slots |
| GET | /admin/lab/vendors/:vendorId/slots | Get available slots (supports ?pincode and ?date) |

### Master Test Parameters

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/lab/master-tests | Create master test parameter |
| GET | /admin/lab/master-tests | Get all master test parameters (supports ?category and ?search) |
| GET | /admin/lab/master-tests/search | Search master test parameters by query (?q) |
| GET | /admin/lab/master-tests/:id | Get master test parameter by ID |
| PATCH | /admin/lab/master-tests/:id | Update master test parameter |
| DELETE | /admin/lab/master-tests/:id | Deactivate master test parameter |

### Test Name Aliases

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/lab/test-aliases | Create test name alias |
| POST | /admin/lab/test-aliases/bulk | Bulk create test name aliases |
| GET | /admin/lab/test-aliases/vendor/:vendorId | Get all test aliases for vendor |
| GET | /admin/lab/test-aliases/vendor/:vendorId/search | Search test aliases by vendor and query (?q) |
| PATCH | /admin/lab/test-aliases/:aliasId | Update test name alias |
| DELETE | /admin/lab/test-aliases/:aliasId | Delete test name alias |

---

## Diagnostics Admin

### Diagnostic Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/diagnostics/services | Create diagnostic service |
| GET | /admin/diagnostics/services | Get all diagnostic services with filters (supports ?category and ?search) |
| GET | /admin/diagnostics/services/:id | Get diagnostic service by ID |
| PATCH | /admin/diagnostics/services/:id | Update diagnostic service |
| PATCH | /admin/diagnostics/services/:id/activate | Activate diagnostic service |
| PATCH | /admin/diagnostics/services/:id/deactivate | Deactivate diagnostic service (blocks if service is in active AHC packages) |

### Diagnostic Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/diagnostics/vendors | Create diagnostic vendor |
| GET | /admin/diagnostics/vendors | Get all diagnostic vendors |
| GET | /admin/diagnostics/vendors/:id | Get diagnostic vendor by ID |
| PATCH | /admin/diagnostics/vendors/:id | Update diagnostic vendor |

### Diagnostic Vendor Pricing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/diagnostics/vendors/:vendorId/pricing | Create vendor pricing |
| GET | /admin/diagnostics/vendors/:vendorId/pricing | Get vendor pricing |
| PATCH | /admin/diagnostics/vendors/:vendorId/pricing/:serviceId | Update vendor pricing |

### Diagnostic Vendor Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/diagnostics/vendors/:vendorId/slots | Create vendor slots |
| GET | /admin/diagnostics/vendors/:vendorId/slots | Get available slots (supports ?pincode and ?date) |

### Diagnostic Master Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/diagnostics/master-tests | Create diagnostic master test |
| GET | /admin/diagnostics/master-tests | Get all diagnostic master tests (supports ?category and ?search) |
| GET | /admin/diagnostics/master-tests/:id | Get diagnostic master test by ID |
| PATCH | /admin/diagnostics/master-tests/:id | Update diagnostic master test |
| PATCH | /admin/diagnostics/master-tests/:id/status | Update diagnostic master test status (activate/deactivate) |

---

## AHC Packages (Annual Health Check)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/ahc/packages | Create new AHC package |
| GET | /admin/ahc/packages | Get all AHC packages |
| GET | /admin/ahc/packages?search={query} | Search packages by package ID or name |
| GET | /admin/ahc/packages/:packageId | Get AHC package by ID |
| PATCH | /admin/ahc/packages/:packageId | Update AHC package |
| PATCH | /admin/ahc/packages/:packageId/toggle-active | Toggle package active status |
| DELETE | /admin/ahc/packages/:packageId | Delete AHC package |

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

**Total Endpoints: ~117**

**Notes:**
- All endpoints require authentication (JWT token via cookie with path `/admin`)
- Access restricted to SUPER_ADMIN and ADMIN roles
- Operations, TPA, and Finance endpoints have been moved to separate portals
