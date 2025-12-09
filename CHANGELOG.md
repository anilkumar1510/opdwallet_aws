# Changelog

All notable changes to the OPD Wallet project will be documented in this file.

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
