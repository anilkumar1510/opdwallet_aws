# Internal vs External Users Separation Plan

## Executive Summary

**Problem:** All users (internal staff and external members) are currently stored in the same `users` collection, differentiated only by the `role` field.

**Solution:** Separate into two collections:
- `users` - External members only (role = MEMBER)
- `internal_users` - Internal staff (SUPER_ADMIN, ADMIN, TPA, OPS, etc.)

**Impact:** 20 files to create/modify, no data loss risk, member features unaffected.

---

## Current Architecture

### User Roles Distribution
```javascript
// Internal Roles (Staff)
- SUPER_ADMIN
- ADMIN
- TPA, TPA_ADMIN, TPA_USER
- FINANCE_USER
- OPS

// External Role (Members)
- MEMBER
```

### Current `users` Collection Fields
```
Common Fields:
- userId, email, phone, passwordHash, role, status
- name {firstName, lastName, fullName}
- createdAt, updatedAt, createdBy, updatedBy
- mustChangePassword

Member-Specific Fields (not applicable to staff):
- uhid (Universal Health ID)
- memberId (Member ID)
- employeeId (Corporate Employee ID)
- relationship (REL001/SELF, SPOUSE, CHILD, etc.)
- primaryMemberId (for dependents)
- dob, gender, bloodGroup
- address {line1, line2, city, state, pincode}
- corporateName
```

**Issue:** Internal staff users have NULL/empty values for member-specific fields (uhid, memberId, relationship, etc.) which is semantically incorrect.

---

## Impact Analysis

### 1. Database Collections with Foreign Keys

All collections that reference `userId` are **MEMBER-SPECIFIC** and will continue to reference the `users` collection (no changes needed):

```
✅ No Schema Changes Required:
- appointments (patient bookings)
- memberclaims (claim submissions)
- payments (member payments)
- user_wallets (wallet balances)
- wallet_transactions (wallet debits/credits)
- userPolicyAssignments (policy assignments)
- notifications (member notifications)
- videoconsultations (online consultations)
- doctorprescriptions (patient prescriptions)
- lab_orders (lab test orders)
- lab_prescriptions, lab_carts
- transactionsummaries
```

**Reason:** Internal staff don't have wallets, appointments, claims, or policies. These are purely member features.

### 2. Frontend Components Affected

#### Admin Portal (`web-admin`)
- `app/(admin)/users/page.tsx` - **Users list with tabs** - needs to call different APIs
- `app/(admin)/users/new/page.tsx` - **User creation** - route to correct endpoint based on role
- `app/(admin)/users/[id]/page.tsx` - **User detail/edit** - detect type and call correct API
- `lib/api/internal-users.ts` - **NEW** - API client for internal users

#### No Changes Needed
- Member Portal (`web-member`) - Only works with members
- Doctor Portal (`web-doctor`) - Only works with doctors (separate collection)
- TPA Portal (`web-tpa`) - Staff portal, will use internal_users for auth
- Operations Portal (`web-operations`) - Staff portal, will use internal_users for auth

### 3. Backend API Modules Affected

#### Core Changes
```
✅ Create New:
- api/src/modules/users/schemas/internal-user.schema.ts
- api/src/modules/users/internal-users.service.ts
- api/src/modules/users/internal-users.controller.ts
- api/src/modules/users/dto/create-internal-user.dto.ts
- api/src/modules/users/dto/update-internal-user.dto.ts

✅ Modify Existing:
- api/src/modules/users/schemas/user.schema.ts (restrict to MEMBER only)
- api/src/modules/users/users.service.ts (remove internal user logic)
- api/src/modules/users/users.controller.ts (keep member endpoints)
- api/src/modules/users/users.module.ts (register both schemas)

✅ Update Authentication:
- api/src/modules/auth/auth.service.ts (check both collections for login)
- api/src/modules/auth/strategies/local.strategy.ts (update validation)
- api/src/modules/auth/auth.controller.ts (handle both user types)
```

#### Other Modules (Minor Changes)
```
⚠️ May Need Updates:
- api/src/modules/operations/operations.service.ts (queries users for staff info)
- api/src/modules/tpa/tpa.service.ts (queries users for TPA staff)
- api/src/modules/finance/finance.service.ts (queries users for finance staff)

✅ No Changes (Member-Specific):
- api/src/modules/member/member.service.ts
- api/src/modules/wallet/wallet.service.ts
- api/src/modules/assignments/assignments.service.ts
- api/src/modules/appointments/appointments.service.ts
- api/src/modules/memberclaims/memberclaims.service.ts
```

---

## Implementation Plan

### Phase 1: Backend Schema & Core Services

#### Step 1.1: Create Internal User Schema
**File:** `api/src/modules/users/schemas/internal-user.schema.ts`

```typescript
@Schema({
  timestamps: true,
  collection: 'internal_users',
})
export class InternalUser {
  // Core Identity
  @Prop({ required: true, unique: true, immutable: true })
  userId!: string;

  // Contact Info
  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true, unique: true })
  phone!: string;

  // Name
  @Prop({ type: { firstName: String, lastName: String, fullName: String } })
  name!: { firstName: string; lastName: string; fullName?: string; };

  // Role (Internal Only)
  @Prop({
    required: true,
    enum: ['SUPER_ADMIN', 'ADMIN', 'TPA', 'TPA_ADMIN', 'TPA_USER', 'FINANCE_USER', 'OPS']
  })
  role!: string;

  // Status
  @Prop({ required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status!: string;

  // Password
  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ default: false })
  mustChangePassword!: boolean;

  // Audit
  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

// Indexes
InternalUserSchema.index({ email: 1 });
InternalUserSchema.index({ phone: 1 });
InternalUserSchema.index({ userId: 1 });
InternalUserSchema.index({ role: 1, status: 1 });
```

**Fields Removed (Member-Specific):**
- uhid, memberId, employeeId
- relationship, primaryMemberId
- dob, gender, bloodGroup
- address, corporateName

#### Step 1.2: Update User Schema (External Members)
**File:** `api/src/modules/users/schemas/user.schema.ts`

```typescript
// Add validation to enforce MEMBER role only
@Prop({
  required: true,
  enum: ['MEMBER'], // ⚠️ Changed from UserRole enum to restrict to MEMBER only
  default: 'MEMBER',
})
role!: string;
```

Keep all existing fields including member-specific ones.

#### Step 1.3: Create Internal Users Service
**File:** `api/src/modules/users/internal-users.service.ts`

Key methods:
- `create(createInternalUserDto, createdBy)` - Create staff account
- `findAll(query)` - List staff with pagination/search
- `findOne(id)` - Get staff details
- `update(id, updateDto, updatedBy)` - Update staff info
- `delete(id, deletedBy)` - Delete staff account
- `resetPassword(id, resetBy)` - Reset staff password
- `setPassword(id, password, setBy)` - Set staff password

Similar to existing UsersService but without relationship/dependent logic.

#### Step 1.4: Create Internal Users Controller
**File:** `api/src/modules/users/internal-users.controller.ts`

```typescript
@Controller('internal-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) // Only admins can manage staff
export class InternalUsersController {
  @Post() create(...)
  @Get() findAll(...)
  @Get(':id') findOne(...)
  @Put(':id') update(...)
  @Delete(':id') delete(...)
  @Post(':id/reset-password') resetPassword(...)
  @Post(':id/set-password') setPassword(...)
}
```

#### Step 1.5: Create DTOs
**Files:**
- `api/src/modules/users/dto/create-internal-user.dto.ts`
- `api/src/modules/users/dto/update-internal-user.dto.ts`
- `api/src/modules/users/dto/query-internal-user.dto.ts`

#### Step 1.6: Update Users Module
**File:** `api/src/modules/users/users.module.ts`

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: InternalUser.name, schema: InternalUserSchema }, // Add this
    ]),
    // ... other imports
  ],
  controllers: [
    UsersController,
    InternalUsersController, // Add this
  ],
  providers: [
    UsersService,
    InternalUsersService, // Add this
    // ... other providers
  ],
  exports: [
    UsersService,
    InternalUsersService, // Add this
  ],
})
```

---

### Phase 2: Update Authentication

#### Step 2.1: Update Auth Service
**File:** `api/src/modules/auth/auth.service.ts`

```typescript
async validateUser(email: string, password: string): Promise<any> {
  console.log('[AUTH] Login attempt for email:', email);

  // First, try to find in internal_users (staff)
  const internalUser = await this.internalUserModel.findOne({
    email: email.toLowerCase(),
    status: 'ACTIVE',
  });

  if (internalUser) {
    console.log('[AUTH] Found internal user:', internalUser.role);
    const isPasswordValid = await bcrypt.compare(password, internalUser.passwordHash);
    if (isPasswordValid) {
      const { passwordHash, ...result } = internalUser.toObject();
      return { ...result, userType: 'internal' }; // Add userType flag
    }
    return null;
  }

  // If not found in internal_users, try external users (members)
  const externalUser = await this.userModel.findOne({
    email: email.toLowerCase(),
    status: 'ACTIVE',
  });

  if (externalUser) {
    console.log('[AUTH] Found external user (member)');
    const isPasswordValid = await bcrypt.compare(password, externalUser.passwordHash);
    if (isPasswordValid) {
      const { passwordHash, ...result } = externalUser.toObject();
      return { ...result, userType: 'external' }; // Add userType flag
    }
  }

  console.log('[AUTH] No user found or invalid password');
  return null;
}
```

**Key Changes:**
- Check `internal_users` collection first (based on role pattern)
- Fall back to `users` collection for members
- Add `userType` flag to distinguish in JWT

#### Step 2.2: Update JWT Strategy
**File:** `api/src/modules/auth/strategies/jwt.strategy.ts`

No changes needed - JWT payload already contains role, which is sufficient.

#### Step 2.3: Update Local Strategy
**File:** `api/src/modules/auth/strategies/local.strategy.ts`

No changes needed - uses auth.service.validateUser which we updated above.

---

### Phase 3: Frontend Updates

#### Step 3.1: Create Internal Users API Client
**File:** `web-admin/lib/api/internal-users.ts`

```typescript
export interface InternalUser {
  _id: string;
  userId: string;
  email: string;
  phone: string;
  name: {
    firstName: string;
    lastName: string;
    fullName: string;
  };
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TPA' | 'OPS' | 'FINANCE_USER';
  status: 'ACTIVE' | 'INACTIVE';
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getInternalUsers(query?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.search) params.append('search', query.search);
  if (query?.role) params.append('role', query.role);

  const response = await apiFetch(`/api/internal-users?${params}`);
  if (!response.ok) throw new Error('Failed to fetch internal users');
  return response.json();
}

export async function createInternalUser(data: Partial<InternalUser> & { password?: string }) {
  const response = await apiFetch('/api/internal-users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create internal user');
  return response.json();
}

export async function updateInternalUser(id: string, data: Partial<InternalUser>) {
  const response = await apiFetch(`/api/internal-users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update internal user');
  return response.json();
}

export async function resetInternalUserPassword(id: string) {
  const response = await apiFetch(`/api/internal-users/${id}/reset-password`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reset password');
  return response.json();
}

export async function setInternalUserPassword(id: string, password: string) {
  const response = await apiFetch(`/api/internal-users/${id}/set-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (!response.ok) throw new Error('Failed to set password');
  return response.json();
}
```

#### Step 3.2: Update Users Page
**File:** `web-admin/app/(admin)/users/page.tsx`

**Current Code (Line 91-93):**
```typescript
const internalRoles = ['SUPER_ADMIN', 'ADMIN', 'TPA', 'OPS']
const internalUsers = users.filter(user => internalRoles.includes(user.role))
const externalUsers = users.filter(user => user.role === 'MEMBER')
```

**New Code:**
```typescript
const [externalUsers, setExternalUsers] = useState<any[]>([])
const [internalUsers, setInternalUsers] = useState<any[]>([])

const fetchUsers = async () => {
  try {
    if (activeTab === 'external') {
      const response = await apiFetch('/api/users?limit=100')
      if (response.ok) {
        const data = await response.json()
        setExternalUsers(data.data || [])
      }
    } else {
      const response = await apiFetch('/api/internal-users?limit=100')
      if (response.ok) {
        const data = await response.json()
        setInternalUsers(data.data || [])
      }
    }
  } catch (error) {
    console.error('Failed to fetch users')
  } finally {
    setLoading(false)
  }
}

// Re-fetch when tab changes
useEffect(() => {
  fetchUsers()
}, [activeTab])
```

**Password Reset Functions - Update endpoints:**
```typescript
const handleResetPassword = async (userId: string) => {
  const endpoint = activeTab === 'external'
    ? `/api/users/${userId}/reset-password`
    : `/api/internal-users/${userId}/reset-password`;

  // ... rest of logic
}

const handleSetPassword = async () => {
  const endpoint = activeTab === 'external'
    ? `/api/users/${selectedUser._id}/set-password`
    : `/api/internal-users/${selectedUser._id}/set-password`;

  // ... rest of logic
}
```

#### Step 3.3: Update User Creation Page
**File:** `web-admin/app/(admin)/users/new/page.tsx`

Add role selector at the top of form:
```typescript
const [userType, setUserType] = useState<'external' | 'internal'>('external')

// In form JSX:
<div className="mb-6">
  <label className="label">User Type</label>
  <div className="flex gap-4">
    <label className="flex items-center">
      <input
        type="radio"
        value="external"
        checked={userType === 'external'}
        onChange={(e) => setUserType('external')}
      />
      <span className="ml-2">External User (Member)</span>
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        value="internal"
        checked={userType === 'internal'}
        onChange={(e) => setUserType('internal')}
      />
      <span className="ml-2">Internal User (Staff)</span>
    </label>
  </div>
</div>

// Conditionally render member-specific fields:
{userType === 'external' && (
  <>
    <div>
      <label>Member ID</label>
      <input name="memberId" ... />
    </div>
    <div>
      <label>UHID</label>
      <input name="uhid" ... />
    </div>
    <div>
      <label>Relationship</label>
      <select name="relationship" ... />
    </div>
    // ... other member fields
  </>
)}

// On submit:
const endpoint = userType === 'external' ? '/api/users' : '/api/internal-users';
const response = await apiFetch(endpoint, {
  method: 'POST',
  body: JSON.stringify(formData),
});
```

#### Step 3.4: Update User Detail Page
**File:** `web-admin/app/(admin)/users/[id]/page.tsx`

```typescript
const [userType, setUserType] = useState<'external' | 'internal'>('external')

useEffect(() => {
  const fetchUser = async () => {
    // Try external first
    let response = await apiFetch(`/api/users/${id}`)
    if (response.ok) {
      const data = await response.json()
      setUser(data)
      setUserType('external')
      return
    }

    // Try internal
    response = await apiFetch(`/api/internal-users/${id}`)
    if (response.ok) {
      const data = await response.json()
      setUser(data)
      setUserType('internal')
    }
  }
  fetchUser()
}, [id])

// On update:
const endpoint = userType === 'external'
  ? `/api/users/${id}`
  : `/api/internal-users/${id}`;
```

---

### Phase 4: Update Helper Utilities

#### Step 4.1: Add Role Helpers
**File:** `api/src/common/constants/roles.enum.ts`

```typescript
export enum UserRole {
  // ... existing roles
}

export const INTERNAL_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TPA,
  UserRole.TPA_ADMIN,
  UserRole.TPA_USER,
  UserRole.FINANCE_USER,
  UserRole.OPS,
];

export const EXTERNAL_ROLES = [UserRole.MEMBER];

export function isInternalRole(role: string): boolean {
  return INTERNAL_ROLES.includes(role as UserRole);
}

export function isExternalRole(role: string): boolean {
  return EXTERNAL_ROLES.includes(role as UserRole);
}
```

---

## Files Summary

### New Files (8)
1. ✅ `api/src/modules/users/schemas/internal-user.schema.ts` - Internal user schema
2. ✅ `api/src/modules/users/internal-users.service.ts` - CRUD service for staff
3. ✅ `api/src/modules/users/internal-users.controller.ts` - REST endpoints
4. ✅ `api/src/modules/users/dto/create-internal-user.dto.ts` - Creation DTO
5. ✅ `api/src/modules/users/dto/update-internal-user.dto.ts` - Update DTO
6. ✅ `api/src/modules/users/dto/query-internal-user.dto.ts` - Query DTO
7. ✅ `web-admin/lib/api/internal-users.ts` - Frontend API client
8. ✅ `INTERNAL_EXTERNAL_USERS_SEPARATION_PLAN.md` - This document

### Modified Files (12)
1. ✅ `api/src/modules/users/schemas/user.schema.ts` - Restrict role to MEMBER
2. ✅ `api/src/modules/users/users.service.ts` - Remove internal user logic
3. ✅ `api/src/modules/users/users.controller.ts` - Keep member endpoints only
4. ✅ `api/src/modules/users/users.module.ts` - Register both schemas
5. ✅ `api/src/modules/auth/auth.service.ts` - Check both collections
6. ✅ `api/src/modules/auth/auth.controller.ts` - Handle both types
7. ✅ `api/src/common/constants/roles.enum.ts` - Add helper functions
8. ✅ `web-admin/app/(admin)/users/page.tsx` - Split API calls by tab
9. ✅ `web-admin/app/(admin)/users/new/page.tsx` - Conditional form & endpoint
10. ✅ `web-admin/app/(admin)/users/[id]/page.tsx` - Detect type & route
11. ✅ `api/src/app.module.ts` - Ensure controllers registered
12. ✅ `docs/02_DATA_SCHEMA_AND_CREDENTIALS.md` - Update schema docs

### Possibly Affected (Review & Update if Needed) (3)
1. ⚠️ `api/src/modules/operations/operations.service.ts` - May query staff
2. ⚠️ `api/src/modules/tpa/tpa.service.ts` - May query TPA staff
3. ⚠️ `api/src/modules/finance/finance.service.ts` - May query finance staff

---

## Testing Checklist

### Backend Testing
- [ ] Create internal user via API
- [ ] List internal users via API
- [ ] Update internal user via API
- [ ] Delete internal user via API
- [ ] Reset internal user password
- [ ] Set internal user password
- [ ] Create external user (member) via API
- [ ] Verify member operations unchanged
- [ ] Login as internal user (ADMIN role)
- [ ] Login as external user (MEMBER role)
- [ ] Verify JWT contains correct userType
- [ ] Verify role-based access control works

### Frontend Testing
- [ ] View external users tab
- [ ] View internal users tab
- [ ] Search external users
- [ ] Search internal users
- [ ] Create new member (external)
- [ ] Create new staff (internal)
- [ ] Edit member profile
- [ ] Edit staff profile
- [ ] Reset password for member
- [ ] Reset password for staff
- [ ] Set password for member
- [ ] Set password for staff
- [ ] Verify member-specific fields hidden for staff
- [ ] Verify staff creation form doesn't ask for uhid/memberId

### Integration Testing
- [ ] Member login → Member portal works
- [ ] Admin login → Admin portal works
- [ ] TPA login → TPA portal works
- [ ] OPS login → Operations portal works
- [ ] Member appointments still work
- [ ] Member claims still work
- [ ] Member wallet still works
- [ ] Policy assignments still work

### Data Verification
- [ ] All internal users properly separated
- [ ] All member users remain in users collection
- [ ] No orphaned references
- [ ] All foreign keys still valid
- [ ] Indexes properly created on internal_users

---

## Benefits of Separation

✅ **Clearer Data Model**
- Members have member-specific fields (uhid, memberId, relationship)
- Staff have only staff-relevant fields (no null member fields)

✅ **Better Performance**
- Smaller collections = faster queries
- Separate indexes optimized for each type

✅ **Easier Maintenance**
- Clear separation of concerns
- Different validation rules per type
- Easier to add type-specific features

✅ **No Risk to Existing Data**
- All member features continue to work
- Foreign keys already point to correct collection
- No breaking changes to member portal

✅ **Scalability**
- Can add staff-specific features without affecting members
- Can add member-specific features without affecting staff
- Independent schema evolution

---

## Post-Implementation Notes

After implementation, the system will have:

**Two User Collections:**
```
users (External Members)
├── All member-specific fields
├── Role: MEMBER only
└── Referenced by: appointments, claims, wallets, etc.

internal_users (Internal Staff)
├── Only staff-relevant fields
├── Roles: ADMIN, SUPER_ADMIN, TPA, OPS, etc.
└── Referenced by: audit logs, admin actions
```

**Unified Authentication:**
- Login endpoint checks both collections
- JWT payload indicates user type
- Role-based access control works across both

**Clean Admin UI:**
- External Users tab → `/api/users` → members
- Internal Users tab → `/api/internal-users` → staff
- Proper field visibility per type

---

**Document Version:** 1.0
**Created:** 2025-10-20
**Status:** READY FOR IMPLEMENTATION
