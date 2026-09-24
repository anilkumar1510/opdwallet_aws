## ADDED Requirements

### Requirement: Claim action reason codes are mapped to display names via valueset
The system SHALL fetch `claim_action_reason` codes from the system-management valueset endpoint and map each code to its display name.

#### Scenario: Fetching valueset entries
- **WHEN** the claim detail page loads and the claim has a `claim_action_reason`
- **THEN** the system calls `/system-management/api/v1/valueset?queryId=get_valueset_by_id_flat&args=resourceId:claim_action_reason,system:karexpert,noCount:0&application=system-management`
- **AND** the response contains a list of `{ code, display }` entries

#### Scenario: Displaying mapped reason
- **WHEN** a claim has `claim_action_reason: "AMOUNT_ABOVE_THE_NETWORK_TARIFF"`
- **THEN** the system resolves the code to its display name from the valueset
- **AND** the resolved display name is shown to the member instead of the raw code

#### Scenario: Fallback when code is not in valueset
- **WHEN** a claim has a `claim_action_reason` code that is not present in the valueset response
- **THEN** the system falls back to humanising the raw code (e.g. `AMOUNT_ABOVE_THE_NETWORK_TARIFF` → `Amount above the network tariff`)