# claim-action-reasons-array Specification

## Purpose
TBD - created by archiving change claim-action-reasons-array. Update Purpose after archive.
## Requirements
### Requirement: Claim detail reasons array
The claim detail view SHALL consume `claim_action_reasons` as an array of strings from the claim payload. Each reason code SHALL be mapped to a display string via the existing valueset mapping path. The alert panel SHALL render mapped reasons as a bullet list when one or more reasons are present, and SHALL show “No reasons provided” when the array is empty or absent.

#### Scenario: Multiple reasons present
- **WHEN** `claim_action_reasons` contains `["AMOUNT_ABOVE_THE_NETWORK_TARIFF", "MISSING_DOCUMENTS"]`
- **THEN** the claim detail alert panel renders both mapped reasons as bullet list items

#### Scenario: Single reason present
- **WHEN** `claim_action_reasons` contains `["AMOUNT_ABOVE_THE_NETWORK_TARIFF"]`
- **THEN** the claim detail alert panel renders one bullet list item

#### Scenario: Empty reasons array
- **WHEN** `claim_action_reasons` is `[]`
- **THEN** the claim detail alert panel shows “No reasons provided”

#### Scenario: Missing reasons field
- **WHEN** the claim payload omits `claim_action_reasons`
- **THEN** the claim detail alert panel shows “No reasons provided”

