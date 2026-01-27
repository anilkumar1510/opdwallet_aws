# Changelog

All notable changes to the OPD Wallet project will be documented in this file.

## [Unreleased] - 2026-01-27

### Changed

- **Documentation Audit and Updates**
  - Updated `docs/README.md`:
    - Fixed port mappings (Member Portal: 3002, Admin Portal: 3001)
    - Added Redis and Docker Compose to technology stack
    - Corrected project structure path from `opdwallet/` to `opdwallet_aws/`
    - Added missing infrastructure directories (.claude/, docker-compose files)
    - Added Nginx proxy and MongoDB/Redis ports to ports table
  - Updated `docs/PROJECT_OVERVIEW.md`:
    - Changed platform count from "6 platforms (3 active + 3 planned)" to "7 platforms (6 web portals + 1 backend)"
    - Moved TPA Portal, Operations Portal, and Finance Portal from "Future Platforms" to "Active Platforms" section
    - Added Operations Portal documentation (was completely missing)
    - Fixed broken documentation links (removed references to non-existent files)
    - Updated "Getting Started" section with correct documentation links
  - Updated `docs/MANUAL_DEPLOYMENT.md`:
    - Corrected project directory from `~/opdwallet` to `~/opdwallet_aws`
    - Updated container count from 5 to 10 containers
    - Added complete list of all running containers (all 6 portals + API + Nginx + MongoDB + Redis)
    - Added all portal access URLs (Member, Admin, Doctor, TPA, Operations, Finance)
    - Added direct port access instructions for debugging
    - Fixed quick deployment script path references
  - Updated `docs/DATABASE_AND_CONFIG.md`:
    - Changed portal count from "3 Next.js Web Portals" to "6 Next.js Web Portals"
    - Added Redis Cache to infrastructure components
    - Listed all 6 portals with descriptions
  - Updated `docs/API_REFERENCE.md`:
    - Fixed incorrect port mappings (swapped Member and Admin portal ports)
  - Updated `docs/PORTAL_TESTING_GUIDE.md`:
    - Fixed all portal port numbers and URLs
    - Member Portal: 3002 (was incorrectly 3001)
    - Admin Portal: 3001/admin (was incorrectly 3002)
    - Doctor Portal: 3003/doctor (was incorrectly 3006)
    - TPA Portal: 3004/tpa (was incorrectly 3003)
    - Finance Portal: 3006/finance (was incorrectly 3004)
    - Operations Portal: 3005/operations (correct, added Nginx URL)
    - Added Nginx proxy URLs (http://localhost/{portal}) alongside direct port access for all portals
  - Updated `docs/LAB_TESTING_GUIDE.md`:
    - Fixed Member Portal URL from 3001/member to / or 3002/
    - Fixed Admin Portal URL from 3002/admin to /admin or 3001/admin
  - All documentation now accurately reflects current system architecture with 6 active portals
  - **API Documentation Audit (Complete)**:
    - Audited all 6 API endpoint documentation files against actual API controllers
    - **LATEST_API_ENDPOINTS_MEMBER.md** (646 lines): ✓ Verified accurate
      - All auth, member profile, wallet, appointments, lab tests, diagnostics, AHC, claims, prescriptions endpoints match actual controllers
      - Redis caching documentation accurate
      - Family access control documentation accurate
    - **LATEST_API_ENDPOINTS_ADMIN.md** (522 lines): ✓ Verified accurate
      - Members, internal users, policies, plan config, assignments, doctors, clinics, master data endpoints match controllers
      - Correct separation of member vs internal user endpoints documented
      - Cache invalidation strategies documented
    - **LATEST_API_ENDPOINTS_DOCTOR.md** (171 lines): ✓ Verified accurate
      - Doctor auth, appointments, digital prescriptions, uploaded prescriptions, video consultations, patient records match controllers
      - Prescription template and consultation notes endpoints verified
    - **LATEST_API_ENDPOINTS_TPA.md** (70 lines): ✓ Verified accurate
      - All 15 TPA endpoints (claims processing, assignment, approval/rejection) match tpa.controller.ts
      - Role-based access control accurately documented
      - Cache invalidation on claim approval documented
    - **LATEST_API_ENDPOINTS_OPERATIONS.md** (377 lines): ✓ Verified accurate
      - Operations member management, appointments, doctors, clinics, lab operations, diagnostics, AHC operations endpoints verified
      - Comprehensive coverage of all operational workflows
      - Cache invalidation triggers documented
    - **LATEST_API_ENDPOINTS_FINANCE.md** (63 lines): ✓ Verified accurate
      - All 9 finance endpoints (payment processing, history, analytics) match finance.controller.ts
      - Payment completion workflow accurately documented
      - Wallet credit cache invalidation documented
    - **Verification Method**: Cross-referenced all documented endpoints with actual @Controller, @Get, @Post, @Put, @Patch, @Delete decorators in 54 controller files
    - **Controllers Verified**: auth.controller, doctor-auth.controller, member.controller, wallet.controller, members.controller, internal-users.controller, tpa.controller, finance.controller, operations.controller, and related domain controllers (appointments, lab, diagnostics, AHC)
    - **Result**: All API documentation is accurate and up-to-date with current codebase
    - **No updates required**: All 6 API endpoint documentation files are correct
  - **Documentation Audit Summary:**
    - Total files audited: 32 documentation files
    - Files updated: 7 (README.md, PROJECT_OVERVIEW.md, MANUAL_DEPLOYMENT.md, DATABASE_AND_CONFIG.md, API_REFERENCE.md, PORTAL_TESTING_GUIDE.md, LAB_TESTING_GUIDE.md)
    - Primary fixes: Port number corrections, portal count updates, infrastructure component additions, broken link removals
    - All port mappings now consistent across documentation
    - All API documentation verified accurate (no changes needed)
  - **Comprehensive Re-Audit (Complete)**:
    - Re-audited all 32 documentation files with deep line-by-line review
    - **Additional fixes in PROJECT_OVERVIEW.md**:
      - Fixed Table of Contents link from "Future Platforms (Planned)" to "Additional Platforms (Active)"
      - Updated Feature Matrix: Changed TPA Portal Claims Processing from "🔄 Full Review" to "✅ Full Review"
      - Updated Feature Matrix: Changed Finance Portal Financial Settlements from "🔄 Full Control" to "✅ Full Control"
      - Updated Feature Matrix: Changed Analytics Dashboard for TPA and Finance from "🔄" to "✅"
      - Removed "(Future)" label from "Example 3: TPA Processes Claim" user journey heading
    - **Verification Results**:
      - All 6 portal-specific documentation files (MEMBER_PORTAL.md, ADMIN_PORTAL.md, DOCTOR_PORTAL.md, TPA Portal, Operations Portal, Finance Portal) verified accurate
      - All 6 LATEST_FRONTEND_PAGES_*.md files verified accurate with correct portal URLs, ports, and roles
      - All 6 LATEST_API_ENDPOINTS_*.md files re-verified accurate (no changes needed)
      - REDIS_CACHING.md verified comprehensive and accurate
      - All cross-references between documents validated
    - **Total Issues Found and Fixed**: 4 (all in PROJECT_OVERVIEW.md)
    - **Documentation Status**: All 32 documentation files now accurate and consistent

---

## [Unreleased] - 2026-01-02

### Fixed

- **Member Portal - Transactions Page Analytics Charts**
  - Fixed analytics overview charts (Transaction Volume, 7-Day Trend, Category Split, Balance Trend) not rendering on mobile viewport
  - Root cause: ResponsiveContainer using percentage-based width (100%) couldn't calculate dimensions on mobile
  - Solution: Changed ResponsiveContainer to fixed pixel width (248px) for mobile charts
  - Added explicit minHeight to chart containers to prevent collapse
  - Charts now render correctly on both mobile and desktop viewports
  - File: `web-member/app/member/transactions/page.tsx`

- **Member Portal - Profile Dropdown Menu Overflow**
  - Fixed profile dropdown menu text overflowing outside white background container on mobile view
  - Root cause: Dropdown constrained to 48px width by parent flex-shrink-0 container
  - Solution:
    - Added overflow-visible to ProfileDropdown root container and parent wrappers
    - Replaced Tailwind w-56 class with inline styles to force 14rem (224px) width
    - Ensures dropdown expands properly beyond the 48px parent container
  - Dropdown now displays correctly with all menu items fully visible on mobile and desktop
  - Files: `web-member/components/ProfileDropdown.tsx`, `web-member/components/BottomNavigation.tsx`

### Added

- **Claude Code Project Rules Enforcement System**
  - Added comprehensive project rules documentation in `.claude/project-rules.md`
  - Added mandatory checklist system in `.claude/START_CHECKLIST.md`
  - Updated SessionStart hook to display prominent warning banners and rules at session start
  - Ensures project rules are always read before any implementation work
  - Rules include:
    - Analysis before action requirement with proof validation
    - Code quality and maintainability standards (no breaking structure)
    - MANDATORY documentation updates after every change
    - Testing protocol with browser automation and log checking
    - Task tracking with PLAN.md for multi-step tasks
    - New feature development guidelines (review existing APIs first)
  - Files: `.claude/project-rules.md`, `.claude/START_CHECKLIST.md`
  - Note: `settings.local.json` hook configuration is user-specific (not committed)

### Changed

- **Development Workflow**
  - All developers now see warning banners and mandatory checklist at Claude Code session start
  - Documentation updates are now explicitly required for all code changes
  - Testing protocol enforces checking both backend and frontend logs

---

## [1.1.0] - 2025-12-15

### Added - User Segregation Migration

- **Separate Collections for Internal and External Users**
  - Created new `internal_users` collection for staff (SUPER_ADMIN, ADMIN, TPA, FINANCE_USER, OPS, etc.)
  - Existing `users` collection now contains only members (MEMBER role) and doctors (DOCTOR role)
  - Improved data organization and security separation

- **New API Endpoints**
  - `POST /api/members` - Create new member (external user)
  - `GET /api/members` - List all members with pagination
  - `GET /api/members/:id` - Get member details
  - `PUT /api/members/:id` - Update member
  - `DELETE /api/members/:id` - Delete member
  - `GET /api/members/:id/dependents` - Get family members
  - `POST /api/members/:id/reset-password` - Reset member password
  - `POST /api/members/:id/set-password` - Set member password
  - `POST /api/internal-users` - Create new internal user (staff)
  - `GET /api/internal-users` - List all internal users
  - `GET /api/internal-users/:id` - Get internal user details
  - `PUT /api/internal-users/:id` - Update internal user
  - `POST /api/internal-users/:id/reset-password` - Reset internal user password
  - `POST /api/internal-users/:id/set-password` - Set internal user password

- **Backend Services**
  - `MembersService` - Handles member (external user) operations
  - `InternalUsersService` - Handles internal user (staff) operations
  - `UnifiedUserService` - Provides backward compatibility for resolving users from both collections
  - `CommonUserService` - Shared utilities for user operations

- **Admin Portal Enhancements**
  - Tab-contextual user creation forms
  - External Users tab shows member-specific fields (UHID, Member ID, Corporate Group, etc.)
  - Internal Users tab shows staff-specific fields (Employee ID, Role dropdown, Department, etc.)
  - Role field automatically locked to "Member" for external users
  - Role dropdown with internal roles for internal users
  - Conditional field validation based on user type

### Changed

- **Authentication Service**
  - Updated to check both `users` and `internal_users` collections during login
  - JWT payload enhanced with `userType` field
  - Maintains backward compatibility with existing sessions

- **User Schema**
  - `users` collection now validates that role must be MEMBER or DOCTOR only
  - Added `userType: 'member'` discriminator

- **Internal User Schema** (new)
  - Required fields: `employeeId`, `role`, `email`, `phone`, `name`
  - Internal-specific fields: `department`, `designation`, `reportingTo`
  - Enhanced security fields: `mfaEnabled`, `allowedIPs`
  - Excludes member-specific fields: `uhid`, `memberId`, `relationship`, etc.

- **Admin Portal - User Creation**
  - Form now conditionally renders fields based on user type (external vs internal)
  - Phone number automatically formatted as object `{ countryCode, number }`
  - Validation rules updated to check different required fields based on user type

### Fixed

- **Validation Logic**
  - External users (members) now require: UHID, Member ID (NOT Employee ID)
  - Internal users (staff) now require: Employee ID, Role (NOT UHID, Member ID)
  - Phone field now properly formatted as object instead of string

- **Duplicate Role Dropdown**
  - Removed duplicate role field in user creation form
  - Only conditional role field remains (locked for external, dropdown for internal)

### Database Schema Changes

- **New Collection: `internal_users`**
  - Fields: `userId`, `employeeId`, `email`, `phone`, `name`, `role`, `passwordHash`, `status`
  - Internal-specific: `department`, `designation`, `reportingTo`, `mfaEnabled`, `allowedIPs`
  - Indexes: Unique on `userId`, `employeeId`, `email`, `phone`

- **Updated Collection: `users`**
  - Now contains only MEMBER and DOCTOR roles
  - Internal users (SUPER_ADMIN, ADMIN, TPA, etc.) migrated to `internal_users`
  - Added validation: role must be 'MEMBER' or 'DOCTOR'

### Migration

- **Data Migration Script** (`api/src/scripts/migrate-users-segregation.ts`)
  - Automatically migrated all internal users from `users` to `internal_users` collection
  - Preserved ObjectIds for reference integrity
  - Created backup collection: `users_backup_pre_segregation`

- **Cleanup Script** (`api/src/scripts/cleanup-migrated-users.ts`)
  - Removes migrated internal users from `users` collection
  - Requires explicit confirmation via environment variable

- **Rollback Script** (`api/src/scripts/rollback-user-segregation.ts`)
  - Restores internal users back to `users` collection if needed

### Security

- **Role-Based Access Control**
  - Internal user endpoints restricted to SUPER_ADMIN and ADMIN roles
  - Member endpoints accessible by SUPER_ADMIN, ADMIN, TPA, and OPS roles
  - Enhanced separation between internal and external user data

### Documentation

- Updated `PROJECT_OVERVIEW.md` with new architecture
- Updated `LATEST_API_ENDPOINTS_ADMIN.md` with new endpoints
- Updated `DATABASE_AND_CONFIG.md` with new collections
- Created migration testing guides

---

## [Unreleased] - 2025-12-09

### Added
- **BenefitResolver Utility** (`api/src/modules/plan-config/utils/benefit-resolver.ts`)
  - New utility to resolve benefit configurations from member-specific or global config
  - Follows same pattern as CopayResolver for consistent configuration resolution
  - Supports fallback from member-specific to global benefit configurations

- **originalBillAmount Field** to MemberClaim schema
  - Stores the original bill amount entered by user before auto-capping
  - Enables transparent display of both original and capped amounts

### Fixed
- **Auto-Capping for Claims**
  - Fixed per-claim limit resolution to check member-specific configurations
  - Claims now correctly auto-cap when bill amount exceeds per-claim limit
  - Properly saves `originalBillAmount`, `cappedAmount`, `wasAutoCapped`, and `perClaimLimitApplied` fields

- **Assignment Lookup in Claim Submission**
  - Added explicit ObjectId conversion for userId lookup
  - Added `isActive: true` filter to only retrieve active assignments
  - Added detailed debug logging for assignment lookup failures

- **Transaction Amount Calculation**
  - Updated transaction summary to use `finalAmount` (capped) instead of `claim.billAmount`
  - Ensures accurate transaction records when claims are auto-capped

- **Claims List API Response** (`api/src/modules/memberclaims/memberclaims.service.ts`)
  - Added auto-capping fields to `.select()` statement in `findAll()` method
  - Now returns `originalBillAmount`, `cappedAmount`, `wasAutoCapped`, `perClaimLimitApplied`

- **Member Portal - Claim Detail Page** (`web-member/app/member/claims/[id]/page.tsx`)
  - Updated to display original bill amount and auto-capped amount separately
  - Shows clear indication when claim was auto-capped
  - Displays per-claim limit information

- **Member Portal - Claims List Page** (`web-member/app/member/claims/page.tsx`)
  - Updated table display to show both original and capped amounts
  - Added visual indicators for auto-capped claims

- **Admin Portal - Approval Modal** (`web-admin/components/tpa/ApprovalModal.tsx`)
  - Replaced direct `fetch()` call with `apiFetch()` wrapper
  - Fixes routing issue with `/admin` base path

### Changed
- **Member Claims Service** - Enhanced claim submission with proper benefit resolution
- **Claim Schema** - Extended with auto-capping metadata fields

### API Endpoints Modified
- `POST /api/member/claims/:claimId/submit` - Now properly handles auto-capping with member-specific limits
- `GET /api/member/claims` - Returns additional auto-capping fields
- `GET /api/member/claims/:id` - Returns auto-capping metadata

### Database Schema Changes
- `memberclaims` collection:
  - Added `originalBillAmount: Number` - Original amount before capping
  - Added `cappedAmount: Number` - Amount after applying per-claim limit
  - Added `wasAutoCapped: Boolean` - Flag indicating if auto-capping occurred
  - Added `perClaimLimitApplied: Number` - The per-claim limit that was applied

---

## Version History Format
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
