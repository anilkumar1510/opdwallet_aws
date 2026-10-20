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
