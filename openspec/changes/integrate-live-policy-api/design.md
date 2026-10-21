# Design

## Context

See `proposal.md` for motivation. The application is an Angular 21 zoneless micro-frontend (`projects/member`) using Tailwind CSS v4 and signals-first reactive state. Previously, policy details and balances were backed by `static-policy.data.ts`. The backend provides live endpoints via the `habit-opd` service (`opd_policy_member_assignment`, `opd_policy_version`) and `account-management` service (`user_relationship_mapping`).

## Goals / Non-Goals

**Goals:**
- Replace static policy fixtures with live reactive streams in `PolicyStore`.
- Dynamically extract patient identity from `FamilyStore` (`GET_FAMILY_LIST`) without hardcoding IDs.
- Restrict dashboard policy cards strictly to relationships covered by the policy version.
- Implement responsive skeleton loaders to eliminate Cumulative Layout Shift (CLS).
- Provide retryable error states and distinct empty states for missing policy assignments.
- Display all covered relationships without arbitrary slicing or truncation.

**Non-Goals:**
- Creating new backend API endpoints or altering backend schemas.
- In-memory claim submission schema changes (handled by existing claim stores).
- Modifying authentication or session creation flows (session identity updates reactively from primary family member).

## Decisions

### 1. Two-Phase API Flow in `PolicyStore`
- **Approach**: First query `habit-opd/api/v1/opd_policy_member_assignment` by `patient_id`. Extract `policy_version_id`, then query `habit-opd/api/v1/opd_policy_version` by `id`.
- **Rationale**: Policy versions contain the full configuration (floater annual limits, copay, inclusions, exclusions, and per-relationship category limits).
- **Alternative Considered**: Querying all policy versions and matching locally. Rejected because member assignments directly establish which specific version version ID is assigned.

### 2. Dynamic Primary User Extraction
- **Approach**: When `FamilyStore.load()` runs, locate the primary resource (`r.relationship_code === 'self'` or `r.mapped_id === r.user_id` or `!r.relationship_code`). Extract its `user_id` and pass it to `policyStore.load(dynamicUserId)`.
- **Rationale**: Eliminates hardcoded test UUIDs across environments while ensuring dependents view the family policy floater.

### 3. Relationship Code Normalization & Filtering
- **Approach**: `isRelationshipCoveredInPolicy()` normalizes aliases (e.g., `son`/`daughter` -> `child`, `husband`/`wife` -> `spouse`) and checks that the version's relationship definition has `covered !== false`.
- **Rationale**: Backends may return either canonical or alias codes. Normalization guarantees accurate entitlement matching.

### 4. Layout-Matching Skeletons
- **Approach**: Dashboard policy card skeleton uses exact `aspect-[2.13]`, `rounded-[20px] lg:rounded-[32px]`, and `w-[90%] lg:w-[500px]` matching the `PolicyCard` component. Health benefits grid uses matching 2-column dimensions.
- **Rationale**: Prevents any layout jump or visual shift when live data arrives.

### 5. Multi-line Wrapping for Covered Members
- **Approach**: In `policy-details-page.ts`, replace `truncate` with `break-words` on the summary value container.
- **Rationale**: Allows comprehensive display of all allowed relationships (Self, Spouse, Son, Daughter, Brother, Sister, Father, Mother) without truncation.

### 6. Primary Relationship Benefit Inheritance (`INHERIT_FROM_PRIMARY`)
- **Approach**: Locate the primary relationship where `is_primary === true`. When a dependent relationship specifies `benefit_set === 'INHERIT_FROM_PRIMARY'`, inherit `categories`, `additional_claim_categories`, and `additional_claim_categories_enabled` from the primary relationship.
- **Rationale**: Backends omit repetitive category arrays on dependent records that inherit floater benefits from the primary employee.

### 7. Combined Category Mapping in Claim Creation Form
- **Approach**: In `new-claim-page.ts`, reactively resolve the selected patient's relationship from `PolicyStore`. Combine standard `categories` (filtered by `claims === true`) with `additional_claim_categories` (converted to uppercase snake_case slugs via `toCategorySlug()`). If a member switches patient, re-evaluate and clear any invalid previously-selected category.
- **Rationale**: Ensures the claim creation form only allows submitting claims for valid, entitled categories configured in the member's policy version.

### 8. Dynamic Benefit Claim Mode Resolution and QA Override
- **Approach**: In `ClaimModeStore`, derive the active claim mode for each category dynamically from `PolicyStore` by inspecting `cashless` and `claims` booleans:
  - `cashless: true, claims: true` → `'both'` ("Cashless + claims")
  - `cashless: false, claims: true` → `'claims'` ("Claims")
  - `cashless: true, claims: false` → `'cashless'` ("Cashless")
  In `claim-option.ts`, replace the static demo box with a live policy coverage card showing the active policy number and mode. QA test mode controls only display and allow selection of options provided by the policy for that category (e.g. if a category allows claims only, only 'claims' is shown), with one-click reset to policy default.
- **Rationale**: Removes brittle static claim mode tables while empowering QA teams to verify permitted UI states without backend data manipulation.

## Risks / Trade-offs

- **[Risk] High API Latency**: Two sequential calls (`assignment` then `version`) could take longer than a single endpoint.
  - *Mitigation*: Skeleton loaders provide immediate feedback, and responses are cached in store signals.
- **[Risk] Unassigned Members**: Newly onboarded employees may not have a policy assigned.
  - *Mitigation*: Empty assignment (`resource: []`) is treated as a valid zero state (empty view), not an error.
