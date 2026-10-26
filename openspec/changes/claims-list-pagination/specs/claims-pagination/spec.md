# Spec Delta

## Purpose

Adopts the shared pagination component `opd-wallet-pagination` in `opd-claims-page` with server-side pagination (10 claims per page) matching the wallet transactions implementation.

## ADDED Requirements

### Requirement: Claims List Pagination with Reusable Component
The system SHALL paginate reimbursement claims in `opd-claims-page` using the shared `opd-wallet-pagination` component, displaying 10 claims per page on initial rendering and retrieving subsequent pages on demand via `goToClaimsPage`.

#### Scenario: Initial render of claims list
- **WHEN** the member opens the claims page
- **THEN** the system triggers `getClimListData(0, 10)` to load the first 10 records
- **AND** displays pulse skeletons while in-flight to prevent flashing empty-state UI
- **AND** displays up to 10 claims once loaded

#### Scenario: Single-page claims view
- **WHEN** the member has 10 or fewer claims in total
- **THEN** all claims are displayed in the list
- **AND** the pagination bar displays `"Page 1 of 1"`
- **AND** both "← Previous" and "Next →" buttons are disabled

#### Scenario: Multi-page claims navigation
- **WHEN** the member has more than 10 claims (e.g. 15 claims)
- **THEN** the first page renders the 10 most recent claims
- **AND** the pagination bar displays `"Page 1 of 2"` with "← Previous" disabled and "Next →" enabled
- **WHEN** the member clicks "Next →"
- **THEN** the system calls `getClimListData(1, 10)`
- **AND** displays the next 5 claims
- **AND** the pagination bar displays `"Page 2 of 2"` with "← Previous" enabled and "Next →" disabled
- **AND** the page scrolls to the top of the claims list

#### Scenario: Boundary page states
- **WHEN** on page 0
- **THEN** "← Previous" is disabled
- **WHEN** on the last page
- **THEN** "Next →" is disabled
