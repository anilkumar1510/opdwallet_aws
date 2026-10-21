# Spec Delta

## Purpose

Enables live policy assignment, version resolution, covered family member filtering, loading skeletons, error resilience, and empty state handling across member wallet journeys.

## ADDED Requirements

### Requirement: Live Policy Assignment and Version Resolution
The system SHALL retrieve the member's assigned policy from `opd_policy_member_assignment` using the primary member's dynamically resolved user ID, extract `policy_version_id`, and fetch the policy rules and configurations from `opd_policy_version`.

#### Scenario: Policy assignment found for member
- **WHEN** the primary user ID has an active policy assignment in `opd_policy_member_assignment`
- **THEN** the system fetches the corresponding `opd_policy_version` and derives wallet balance, benefit categories, and covered relationships

#### Scenario: No policy assignment found for member
- **WHEN** the query to `opd_policy_member_assignment` returns an empty resource array or lacks `policy_version_id`
- **THEN** the system clears policy state and marks policy loading as complete without error

#### Scenario: API failure during policy fetch
- **WHEN** either the policy assignment or policy version request fails due to network or server error
- **THEN** the system records an error state and allows the user to trigger a retry

### Requirement: Dynamic Family Covered Member Policy Cards
The dashboard carousel SHALL only render policy cards for family members whose relationships are marked as covered in the active `opd_policy_version` relationships configuration.

#### Scenario: Covered family relationships
- **WHEN** a family member's relationship code matches a policy version relationship with `is_primary === true` or `covered !== false`
- **THEN** a policy card is generated for that member in the policy carousel

#### Scenario: Non-covered family relationships
- **WHEN** a family member's relationship code is not present or has `covered === false` in the policy version (such as Father in a Non-Parental policy)
- **THEN** no policy card is rendered for that member in the policy carousel

### Requirement: Skeleton Loaders During Latency
The application SHALL render animated skeleton placeholders with matching layout dimensions during policy and family loading to eliminate layout shifts (CLS).

#### Scenario: Home page loading
- **WHEN** policy or family data is currently being fetched
- **THEN** the balance summary, policy card (with `aspect-[2.13]`), and health benefits grid render skeleton placeholders with `animate-pulse`

#### Scenario: Wallet page loading
- **WHEN** wallet policy data is currently being fetched
- **THEN** the wallet hero balance and the three stat tiles render skeleton placeholders

#### Scenario: Policy details loading
- **WHEN** policy details are currently being fetched
- **THEN** the policy summary and disclosure panels render skeleton placeholders

### Requirement: Error Recovery UI with Retry
The system SHALL display an actionable error UI when policy retrieval fails, providing a direct retry action.

#### Scenario: Retrying failed policy load
- **WHEN** an error view is displayed on the dashboard, wallet, or policy details screen and the user activates "Try Again"
- **THEN** the system re-executes the policy fetch sequence

### Requirement: Informative Empty States
The system SHALL display helpful empty states when a member has no assigned policy or no configured benefits.

#### Scenario: User has no policy assigned
- **WHEN** policy loading completes successfully with zero assigned policies
- **THEN** the dashboard renders "No Policy Assigned" with guidance to contact HR/Admin, and the wallet renders "No active wallet"

### Requirement: Complete Members Covered Display
The policy details screen SHALL display all covered relationship types returned by `opd_policy_version` without artificial truncation or clipping.

#### Scenario: Displaying all covered relationship types
- **WHEN** a policy version defines covered relationships
- **THEN** all unique relationship names are displayed under "Members Covered" and wrap cleanly across multiple lines

### Requirement: Relationship Benefit Inheritance (INHERIT_FROM_PRIMARY)
The system SHALL identify the primary relationship in `opd_policy_version` where `is_primary === true`. For any dependent relationship where `benefit_set === 'INHERIT_FROM_PRIMARY'`, the system SHALL map the same `categories` and `additional_claim_categories` as configured on the primary relationship.

#### Scenario: Dependent relationship inherits primary benefits
- **WHEN** a dependent relationship (such as Spouse or Child) has `benefit_set === 'INHERIT_FROM_PRIMARY'`
- **THEN** it inherits the categories and additional claim categories defined on the primary relationship

#### Scenario: Relationship with own benefit set
- **WHEN** a relationship has `benefit_set === 'OWN'`
- **THEN** it retains its own defined categories and additional claim categories without inheriting from primary

### Requirement: Dynamic Combined Claim Categories in Claim Submission
The claim creation category dropdown SHALL dynamically present the combined options of standard categories (where `claims === true`) and `additional_claim_categories` (mapped as uppercase slug codes) for the selected patient's relationship under the active policy.

#### Scenario: Combined category options for primary member
- **WHEN** the primary patient is selected in the new claim form
- **THEN** the category dropdown renders all standard categories with `claims === true` plus all additional claim categories formatted with uppercase slug values (e.g. "PHYSIOTHERAPY", "AYUSH_CONSULTATION")

#### Scenario: Combined category options for dependent member inheriting benefits
- **WHEN** a dependent patient with `benefit_set === 'INHERIT_FROM_PRIMARY'` is selected in the new claim form
- **THEN** the category dropdown reflects the inherited standard and additional claim categories from the primary relationship

#### Scenario: Changing selected patient updates available categories
- **WHEN** the user selects a different patient in the new claim form
- **THEN** the category dropdown reactively refreshes to the new patient's allowed categories, clearing any previously selected category that is no longer permitted

### Requirement: Dynamic Benefit Claim Mode Resolution and QA Override
The system SHALL dynamically resolve the claim mode (`both`, `cashless`, or `claims`) for any benefit category from `cashless` and `claims` booleans in `opd_policy_version`, while only displaying and allowing selection of options provided by the policy.

#### Scenario: Live policy coverage display
- **WHEN** a benefit landing screen is rendered with an active policy
- **THEN** the policy coverage status displays the dynamic mode derived from the policy version (`cashless: true, claims: true` → 'both' ("Cashless + claims"), `cashless: false, claims: true` → 'claims' ("Claims"), `cashless: true, claims: false` → 'cashless' ("Cashless")) along with the active policy number

#### Scenario: QA test mode override restricted to provided options
- **WHEN** a QA tester selects an available mode option
- **THEN** only options permitted by the policy for that category are displayed and selectable (e.g. if the policy allows claims only, only 'claims' is shown), and when an override is active, an indicator and reset button are rendered

### Requirement: Dynamic Benefit Category Pool Resolution
The system SHALL query `opd_benefit_category_pool` with the assigned `policy_id` to retrieve configured wallet pools, sort them ascending by pool code, map matching standard and additional claim categories from `opd_policy_version`, and display the pool code alongside balance and description in the wallet balance modal.

#### Scenario: Policy pools retrieved from live API
- **WHEN** an assigned policy has configured pools in `opd_benefit_category_pool`
- **THEN** the system resolves the pools sorted ascending by pool code (e.g. POOL-0004, POOL-0005, POOL-0006), allocating each pool's distinct `annual_limit`

#### Scenario: Category mapping under pools
- **WHEN** policy version categories define `pool_code` or `claim_pool_code` matching a pool's code
- **THEN** the category is grouped under that pool with an initial used balance of ₹0

#### Scenario: Pool card rendering in wallet balance modal
- **WHEN** the user opens the "Your Wallet Balance" modal
- **THEN** each pool card displays its pool code badge (e.g. `POOL-0004`), available and allocated balance, pool description, and an expandable category breakdown

### Requirement: Dependent Coverage Verification and Profile Switch Data Updates
The system SHALL verify whether each family member is covered under the active policy version, indicate coverage status in the profile switcher, and dynamically update all wallet, category, pool, and carousel data across the project when switching profiles.

#### Scenario: Switching to a covered dependent
- **WHEN** the user switches to a family dependent whose relationship is covered in the policy version
- **THEN** the active member updates, the policy carousel elevates their policy card first, and wallet balances, pools, and category limits reflect the shared floater entitlement for their relationship

#### Scenario: Switching to a non-covered dependent
- **WHEN** the user switches to a dependent whose relationship is marked as not covered in the policy version (such as Father in a Non-Parental policy)
- **THEN** the profile switcher marks the dependent as "Not covered", their wallet total and categories resolve to zero/empty, and the dashboard displays an informative non-covered notice while retaining access to view their profile
