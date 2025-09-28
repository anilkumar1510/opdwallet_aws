# User Collection Split Audit Report
## Splitting Internal and External Users into Separate Collections

**Date:** 2025-09-28
**Prepared by:** Claude Code
**Objective:** Evaluate the feasibility and plan for splitting the unified `users` collection into two separate collections: `members` (external users) and `internal_users` (internal staff)

---

## Executive Summary

Currently, the application stores all users (both external members and internal staff) in a single MongoDB collection called `users`. This report analyzes the impact of splitting this into two separate collections and provides a comprehensive implementation strategy.

**Key Findings:**
- **Current State:** Single `users` collection with role-based differentiation (MEMBER vs SUPER_ADMIN/ADMIN/TPA/OPS)
- **Impact Scope:** 31 backend files, 3 frontend files, multiple services affected
- **Recommendation:** **MODERATE COMPLEXITY** - Feasible but requires careful migration planning
- **Estimated Effort:** 3-5 days for complete implementation and testing

---

## 1. Current Architecture Analysis

### 1.1 Current User Schema (user.schema.ts:10)

```typescript
Collection: 'users'
Fields:
  - userId: string (unique, auto-generated)
  - uhid: string (unique)
  - memberId: string (unique)
  - employeeId?: string (unique, sparse) // Only for internal users
  - relationship: RelationshipType (SELF/dependent)
  - primaryMemberId?: string (for dependents)
  - name: { firstName, lastName, fullName }
  - email: string (unique)
  - phone: string (unique)
  - dob?: Date
  - gender?: string
  - corporateName?: string
  - address?: { line1, line2, city, state, pincode }
  - role: UserRole (SUPER_ADMIN | ADMIN | TPA | OPS | MEMBER)
  - status: UserStatus (ACTIVE | INACTIVE | SUSPENDED)
  - passwordHash: string
  - mustChangePassword: boolean
  - createdBy?: string
  - updatedBy?: string
  - timestamps: true
```

### 1.2 User Role Classification

**Internal Users (Staff):**
- SUPER_ADMIN - System administrators
- ADMIN - Administrative staff
- TPA - Third-party administrators
- OPS - Operations team

**External Users (Members):**
- MEMBER - Policy holders and their dependents

**Current Distribution:**
- 1 SUPER_ADMIN
- 2 MEMBERS

---

## 2. Dependency Analysis

### 2.1 Backend Services Using User Schema

**Direct Database Access (4 files):**
1. `member.service.ts:14` - @InjectModel(User.name) - Fetches user profiles, dependents
2. `users.service.ts:21` - @InjectModel(User.name) - CRUD operations
3. `auth.service.ts:13` - @InjectModel(User.name) - Authentication
4. `seed.ts` - @InjectModel(User.name) - Data seeding

**Imports/References (31 files total):**
- All modules in `/api/src/modules/*` that import User schema
- DTOs: create-user.dto, update-user.dto, query-user.dto
- Guards and decorators for role-based access control
- Controllers: users, auth, member, assignments, policies, etc.

### 2.2 Related Collections with Foreign Keys

**userPolicyAssignments (assignment.schema.ts:18-22):**
```typescript
userId: Types.ObjectId ref 'User' // CRITICAL REFERENCE
```

**wallet_transactions (wallet-transaction.schema.ts:14-18):**
```typescript
userId: mongoose.Types.ObjectId ref 'User' // CRITICAL REFERENCE
processedBy?: mongoose.Types.ObjectId ref 'User' // CRITICAL REFERENCE
```

**plan_configs:**
```typescript
createdBy?: string
updatedBy?: string
publishedBy?: string
// String references to user identifiers
```

### 2.3 Frontend Components

**Admin Portal (3 files):**
1. `/web-admin/app/admin/users/page.tsx:91-93` - Already separates users by role:
   ```typescript
   const internalRoles = ['SUPER_ADMIN', 'ADMIN', 'TPA', 'OPS']
   const internalUsers = users.filter(user => internalRoles.includes(user.role))
   const externalUsers = users.filter(user => user.role === 'MEMBER')
   ```
2. `/web-admin/app/admin/users/[id]/page.tsx` - User detail view
3. `/web-admin/app/admin/users/new/page.tsx` - User creation

---

## 3. Proposed New Architecture

### 3.1 New Collection Schemas

#### **Collection 1: `members` (External Users)**

```typescript
Collection: 'members'
Purpose: Store policy holders and their family members

Fields:
  // Identity
  - memberId: string (unique, primary identifier)
  - uhid: string (unique, hospital ID)
  - userId: string (unique, legacy/compatibility)

  // Relationship & Family
  - relationship: RelationshipType (SELF | SPOUSE | CHILD | etc.)
  - primaryMemberId?: string (links dependents to primary member)

  // Personal Info
  - name: { firstName, lastName, fullName }
  - email: string (unique)
  - phone: string (unique)
  - dob?: Date
  - gender?: string

  // Corporate & Address
  - corporateName?: string
  - address?: { line1, line2, city, state, pincode }

  // Status & Security
  - status: MemberStatus (ACTIVE | INACTIVE | SUSPENDED)
  - passwordHash: string
  - mustChangePassword: boolean

  // Audit
  - createdBy?: string
  - updatedBy?: string
  - timestamps: true

Indexes:
  - email (unique)
  - phone (unique)
  - uhid (unique)
  - memberId (unique)
  - primaryMemberId + relationship
```

#### **Collection 2: `internal_users` (Staff)**

```typescript
Collection: 'internal_users'
Purpose: Store internal staff and administrators

Fields:
  // Identity
  - userId: string (unique, primary identifier)
  - employeeId: string (unique)
  - email: string (unique)

  // Personal Info
  - name: { firstName, lastName, fullName }
  - phone?: string

  // Role & Permissions
  - role: InternalRole (SUPER_ADMIN | ADMIN | TPA | OPS)
  - permissions?: string[] (future extensibility)
  - department?: string

  // Status & Security
  - status: UserStatus (ACTIVE | INACTIVE | SUSPENDED)
  - passwordHash: string
  - mustChangePassword: boolean

  // Audit
  - createdBy?: string
  - updatedBy?: string
  - timestamps: true

Indexes:
  - email (unique)
  - employeeId (unique)
  - userId (unique)
  - role
```

### 3.2 Why This Split Makes Sense

**Benefits:**
1. **Data Clarity** - Clear separation of concerns (members vs staff)
2. **Schema Optimization** - Remove unused fields (e.g., members don't need employeeId)
3. **Query Performance** - Smaller, more focused collections
4. **Security** - Easier to apply different access controls
5. **Scalability** - Members collection can scale independently
6. **Domain Alignment** - Matches business logic (external vs internal users)

**Challenges:**
1. **Migration Complexity** - Need to migrate existing data
2. **Reference Updates** - Update all foreign key references
3. **Code Refactoring** - Modify 31+ files
4. **Dual Authentication** - Need separate auth flows
5. **Backward Compatibility** - Ensure smooth transition

---

## 4. Impact on Existing Features

### 4.1 Authentication Service (auth.service.ts)

**Current:** Single login flow checking `users` collection

**Required Changes:**
```typescript
// NEW: Dual-lookup authentication
async validateUser(email: string, password: string) {
  // Try member login first
  let user = await this.memberModel.findOne({ email, status: 'ACTIVE' });
  let userType = 'member';

  // If not found, try internal user login
  if (!user) {
    user = await this.internalUserModel.findOne({ email, status: 'ACTIVE' });
    userType = 'internal';
  }

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return { ...user.toObject(), userType };
}
```

**Impact:** MODERATE - Requires dual model injection, slight performance overhead

### 4.2 User Management Service (users.service.ts)

**Current:** Single service managing all users

**Required Changes:**
- Split into `MembersService` and `InternalUsersService`
- OR: Keep unified service but route to appropriate model based on role
- Update all CRUD operations to use correct model

**Impact:** HIGH - Core service requiring significant refactoring

### 4.3 Member Profile Service (member.service.ts)

**Current:** Queries `users` for member profiles and dependents

**Required Changes:**
```typescript
// BEFORE
const user = await this.userModel.findById(userId);

// AFTER
const member = await this.memberModel.findById(memberId);
```

**Impact:** LOW - Minor model reference changes

### 4.4 Policy Assignments (assignments.service.ts)

**Current:**
```typescript
userId: Types.ObjectId ref 'User'
```

**Required Changes:**
```typescript
// Option 1: Keep userId but update ref
memberId: Types.ObjectId ref 'Member'

// Option 2: Polymorphic reference
userId: Types.ObjectId
userType: 'Member' | 'InternalUser'
```

**Impact:** MODERATE - Requires schema migration and population logic updates

### 4.5 Wallet Transactions (wallet.service.ts)

**Current:**
```typescript
userId: Types.ObjectId ref 'User'
processedBy?: Types.ObjectId ref 'User'
```

**Required Changes:**
```typescript
// userId should ONLY reference members
memberId: Types.ObjectId ref 'Member'

// processedBy should ONLY reference internal users
processedBy?: Types.ObjectId ref 'InternalUser'
```

**Impact:** HIGH - Clear domain separation, requires data migration

### 4.6 Frontend Admin Portal

**Current:** Already has tab-based separation (lines 91-93 of users/page.tsx)

**Required Changes:**
```typescript
// BEFORE: Single API call, filter by role
const response = await apiFetch('/api/users?limit=100')
const internalUsers = users.filter(user => internalRoles.includes(user.role))
const externalUsers = users.filter(user => user.role === 'MEMBER')

// AFTER: Separate API calls
const membersResponse = await apiFetch('/api/members?limit=100')
const internalResponse = await apiFetch('/api/internal-users?limit=100')
```

**Impact:** LOW - Minimal UI changes, mostly API endpoint updates

---

## 5. Migration Strategy

### 5.1 Migration Steps

**Phase 1: Schema Setup (Day 1)**
1. Create new schemas: `Member` and `InternalUser`
2. Set up new collections in MongoDB
3. Create indexes on both collections
4. Update TypeScript interfaces/DTOs

**Phase 2: Service Layer (Day 2)**
5. Create new services: `MembersService`, `InternalUsersService`
6. Update `AuthService` for dual lookup
7. Refactor existing services to use new models
8. Update all @InjectModel references

**Phase 3: Data Migration (Day 2-3)**
9. Write migration script to copy data:
   ```javascript
   // Migrate members (role === 'MEMBER')
   db.users.find({ role: 'MEMBER' }).forEach(user => {
     db.members.insertOne({
       memberId: user.memberId,
       uhid: user.uhid,
       userId: user.userId, // Keep for compatibility
       relationship: user.relationship,
       primaryMemberId: user.primaryMemberId,
       name: user.name,
       email: user.email,
       phone: user.phone,
       dob: user.dob,
       gender: user.gender,
       corporateName: user.corporateName,
       address: user.address,
       status: user.status,
       passwordHash: user.passwordHash,
       mustChangePassword: user.mustChangePassword,
       createdBy: user.createdBy,
       updatedBy: user.updatedBy,
       createdAt: user.createdAt,
       updatedAt: user.updatedAt
     });
   });

   // Migrate internal users (role !== 'MEMBER')
   db.users.find({ role: { $ne: 'MEMBER' } }).forEach(user => {
     db.internal_users.insertOne({
       userId: user.userId,
       employeeId: user.employeeId,
       email: user.email,
       name: user.name,
       phone: user.phone,
       role: user.role,
       status: user.status,
       passwordHash: user.passwordHash,
       mustChangePassword: user.mustChangePassword,
       createdBy: user.createdBy,
       updatedBy: user.updatedBy,
       createdAt: user.createdAt,
       updatedAt: user.updatedAt
     });
   });
   ```

10. Update foreign key references:
    ```javascript
    // Update userPolicyAssignments.userId to reference members._id
    // Create mapping: old users._id -> new members._id
    const userIdMap = {};
    db.members.find().forEach(member => {
      // Find original user by memberId
      const oldUser = db.users.findOne({ memberId: member.memberId });
      if (oldUser) {
        userIdMap[oldUser._id.toString()] = member._id;
      }
    });

    // Update assignments
    db.userPolicyAssignments.find().forEach(assignment => {
      if (userIdMap[assignment.userId.toString()]) {
        db.userPolicyAssignments.updateOne(
          { _id: assignment._id },
          { $set: { memberId: userIdMap[assignment.userId.toString()] } }
        );
      }
    });

    // Similar process for wallet_transactions
    ```

**Phase 4: API & Controller Updates (Day 3)**
11. Create new controllers: `/api/members`, `/api/internal-users`
12. Update `/api/users` to redirect or deprecate
13. Update all routes and endpoints
14. Update DTOs and validation

**Phase 5: Frontend Updates (Day 4)**
15. Update API client libraries
16. Update admin portal pages
17. Update member portal (if applicable)
18. Test all user flows

**Phase 6: Testing & Rollback Plan (Day 4-5)**
19. Comprehensive testing:
    - Authentication for both user types
    - CRUD operations
    - Policy assignments
    - Wallet transactions
    - Member profiles with dependents
    - Internal user management
20. Performance testing
21. Prepare rollback scripts
22. Deploy to staging environment

**Phase 7: Production Deployment (Day 5)**
23. Backup production database
24. Run migration scripts
25. Deploy code changes
26. Monitor for errors
27. Verify data integrity

### 5.2 Critical Migration Considerations

**1. Zero-Downtime Migration:**
- Use "blue-green" deployment strategy
- Keep old `users` collection temporarily
- Run dual-write during transition period
- Gradual cutover with feature flags

**2. Data Integrity:**
- Maintain referential integrity during migration
- Validate all foreign key mappings
- Ensure no data loss
- Create comprehensive backup before migration

**3. Rollback Strategy:**
- Keep original `users` collection for 30 days
- Document rollback procedures
- Test rollback in staging
- Have emergency recovery plan

**4. ObjectId Mapping:**
```typescript
// Critical: userPolicyAssignments and wallet_transactions use ObjectId references
// Need to create mapping table: old users._id -> new members._id
interface UserIdMapping {
  oldUserId: ObjectId; // From users collection
  newMemberId: ObjectId; // From members collection
  newInternalUserId?: ObjectId; // From internal_users collection
  migratedAt: Date;
}
```

---

## 6. Code Changes Required

### 6.1 New Files to Create

**Backend Schemas:**
- `/api/src/modules/members/schemas/member.schema.ts`
- `/api/src/modules/internal-users/schemas/internal-user.schema.ts`

**Backend Services:**
- `/api/src/modules/members/members.service.ts`
- `/api/src/modules/members/members.controller.ts`
- `/api/src/modules/members/members.module.ts`
- `/api/src/modules/internal-users/internal-users.service.ts`
- `/api/src/modules/internal-users/internal-users.controller.ts`
- `/api/src/modules/internal-users/internal-users.module.ts`

**DTOs:**
- `/api/src/modules/members/dto/create-member.dto.ts`
- `/api/src/modules/members/dto/update-member.dto.ts`
- `/api/src/modules/members/dto/query-member.dto.ts`
- `/api/src/modules/internal-users/dto/create-internal-user.dto.ts`
- `/api/src/modules/internal-users/dto/update-internal-user.dto.ts`
- `/api/src/modules/internal-users/dto/query-internal-user.dto.ts`

**Migration Scripts:**
- `/api/src/scripts/migrate-users-split.ts`
- `/api/src/scripts/rollback-users-split.ts`
- `/api/src/scripts/verify-migration.ts`

**Frontend API:**
- `/web-admin/lib/api/members.ts`
- `/web-admin/lib/api/internal-users.ts`

### 6.2 Files to Modify

**Backend (31 files minimum):**
- All files in grep results from section 2.1
- Especially critical:
  - `auth.service.ts` - Dual user lookup
  - `member.service.ts` - Use Member model
  - `wallet.service.ts` - Update references
  - `assignments.service.ts` - Update userId references
  - `app.module.ts` - Register new modules

**Assignment Schema:**
```typescript
// BEFORE
@Prop({ type: Types.ObjectId, ref: 'User', required: true })
userId: Types.ObjectId;

// AFTER - Option 1: Member-only
@Prop({ type: Types.ObjectId, ref: 'Member', required: true })
memberId: Types.ObjectId;

// AFTER - Option 2: Polymorphic
@Prop({ type: Types.ObjectId, required: true })
userId: Types.ObjectId;

@Prop({ enum: ['Member', 'InternalUser'], required: true })
userModel: string;
```

**Wallet Transaction Schema:**
```typescript
// BEFORE
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
userId: mongoose.Types.ObjectId;

@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
processedBy?: mongoose.Types.ObjectId;

// AFTER
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true })
memberId: mongoose.Types.ObjectId;

@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'InternalUser' })
processedBy?: mongoose.Types.ObjectId;
```

**Frontend (3 files):**
- `/web-admin/app/admin/users/page.tsx`
- `/web-admin/app/admin/users/[id]/page.tsx`
- `/web-admin/app/admin/users/new/page.tsx`

### 6.3 Backward Compatibility Layer

**Option: Unified API Facade**
```typescript
// Keep /api/users endpoint for backward compatibility
@Controller('users')
export class UsersController {
  constructor(
    private membersService: MembersService,
    private internalUsersService: InternalUsersService
  ) {}

  @Get()
  async findAll(@Query() query: QueryUserDto) {
    // Route based on role filter
    if (query.role === 'MEMBER') {
      return this.membersService.findAll(query);
    } else if (query.role) {
      return this.internalUsersService.findAll(query);
    } else {
      // Return both (with deprecation warning)
      const members = await this.membersService.findAll(query);
      const internal = await this.internalUsersService.findAll(query);
      return {
        ...members,
        data: [...members.data, ...internal.data],
        total: members.total + internal.total
      };
    }
  }
}
```

---

## 7. Risk Assessment

### 7.1 High-Risk Areas

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data loss during migration | CRITICAL | Comprehensive backups, dry-run in staging, verification scripts |
| Broken foreign key references | HIGH | Create complete ObjectId mapping, validation scripts |
| Authentication failures | HIGH | Dual-lookup with fallback, extensive testing |
| Performance degradation | MEDIUM | Proper indexing, query optimization, load testing |
| Code regression | MEDIUM | Comprehensive test suite, staged rollout |

### 7.2 Testing Checklist

**Pre-Migration:**
- [ ] Backup production database
- [ ] Test migration script in staging with production data copy
- [ ] Verify all foreign key mappings
- [ ] Test authentication for both user types
- [ ] Performance baseline measurements

**Post-Migration:**
- [ ] Verify data counts match (members + internal = original users)
- [ ] Test login for sample users from both collections
- [ ] Verify policy assignments work correctly
- [ ] Verify wallet transactions reference correct users
- [ ] Test member profile with dependents
- [ ] Test internal user CRUD operations
- [ ] Verify all API endpoints return correct data
- [ ] Load testing with production-like traffic
- [ ] Monitor error logs for 24-48 hours

---

## 8. Alternative Approaches

### 8.1 Option A: Discriminator Pattern (Keep Single Collection)

**Approach:** Keep `users` collection but add `userType` discriminator

```typescript
@Schema({ discriminatorKey: 'userType' })
export class User {
  @Prop({ type: String, enum: ['Member', 'InternalUser'], required: true })
  userType: string;

  // Common fields...
}

@Schema()
export class Member extends User {
  // Member-specific fields
  relationship: RelationshipType;
  primaryMemberId?: string;
  // ...
}

@Schema()
export class InternalUser extends User {
  // Internal user-specific fields
  employeeId: string;
  department?: string;
  // ...
}
```

**Pros:**
- No data migration needed
- Single collection simplifies queries
- Mongoose has built-in discriminator support
- No foreign key reference changes

**Cons:**
- Still mixed concerns in one collection
- Less query performance optimization
- Schema becomes more complex
- Doesn't achieve true separation

### 8.2 Option B: View-Based Separation

**Approach:** Keep single collection but create MongoDB views

```javascript
db.createView('members_view', 'users', [
  { $match: { role: 'MEMBER' } },
  { $project: { /* member-specific fields */ } }
]);

db.createView('internal_users_view', 'users', [
  { $match: { role: { $ne: 'MEMBER' } } },
  { $project: { /* internal user fields */ } }
]);
```

**Pros:**
- No code changes required
- No data migration
- Easy to implement
- Can add computed fields

**Cons:**
- Views are read-only
- No performance benefit
- Doesn't solve schema bloat
- Not a true separation

### 8.3 Recommended Approach

**RECOMMENDATION: Full Collection Split (Original Proposal)**

**Rationale:**
1. **True Separation:** Clear domain boundaries
2. **Performance:** Optimized queries and indexes
3. **Scalability:** Independent scaling
4. **Schema Clarity:** Remove unused fields
5. **Security:** Separate access controls
6. **Future-Proof:** Easier to add type-specific features

**Trade-off:** Higher upfront effort but better long-term architecture

---

## 9. Recommendations

### 9.1 Should You Proceed?

**YES, if:**
- ✅ You have 3-5 days for implementation
- ✅ You can afford staging environment testing
- ✅ You plan to add more user types or features in future
- ✅ Performance and scalability are concerns
- ✅ You want cleaner domain separation

**NO, if:**
- ❌ You need immediate changes (less than 1 week timeline)
- ❌ Current setup works fine with no performance issues
- ❌ Limited development resources
- ❌ Can't afford migration risks
- ❌ Simple role-based filtering is sufficient

### 9.2 Phased Rollout Plan

**Recommended: Gradual Migration**

**Week 1:** Schema & Service Setup
- Create new schemas and services
- No production changes
- Comprehensive unit tests

**Week 2:** Dual-Write Implementation
- Write to both old and new collections
- Read from old collection
- Monitor for sync issues

**Week 3:** Gradual Read Cutover
- Feature flag to read from new collections
- 10% traffic → 50% → 100%
- Monitor performance and errors

**Week 4:** Cleanup
- Remove old `users` collection
- Remove dual-write code
- Performance optimization

---

## 10. Conclusion

Splitting the `users` collection into `members` and `internal_users` is **feasible and recommended** for long-term maintainability, despite the moderate implementation complexity.

**Key Takeaways:**
1. **Scope:** 31+ backend files, 3 frontend files affected
2. **Effort:** 3-5 days with proper planning
3. **Risk:** Moderate, with proper backup and rollback strategy
4. **Benefit:** Improved performance, clarity, and scalability

**Next Steps:**
1. Review and approve this audit report
2. Set up staging environment with production data copy
3. Begin Phase 1: Schema setup and service creation
4. Run migration in staging and validate
5. Schedule production migration window

**Success Criteria:**
- ✅ Zero data loss
- ✅ All authentication flows working
- ✅ All foreign key references intact
- ✅ No performance degradation
- ✅ Admin portal displays both user types correctly

---

**End of Report**