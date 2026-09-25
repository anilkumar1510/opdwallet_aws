## ADDED Requirements

### Requirement: Claim Details resolves category labels from the claim-category valueset
The production Claim Details page SHALL render the display name associated with the claim's category code from the existing `claim_category` valueset lookup, and SHALL preserve the original category code for API serialization.

#### Scenario: Category display is resolved
- **WHEN** the production Claim Details page loads a claim whose `category` code has a matching `claim_category` valueset entry
- **THEN** the category heading displays the valueset `display` value
- **AND** the loaded claim still retains the original `category` code for API operations

#### Scenario: Category code falls back when the valueset has no match
- **WHEN** the claim category code is not present in the valueset response
- **THEN** the category heading displays the original category code rather than an empty label

#### Scenario: Valueset failure does not hide the claim
- **WHEN** the category valueset lookup fails or returns no entries
- **THEN** the Claim Details page still displays the original category code
- **AND** the claim's document-resubmission request continues to use the original category code

#### Scenario: Static test data remains static
- **WHEN** a member opens the separate static Claim Details test route
- **THEN** that route continues to use its existing static category labels
- **AND** the live production valueset lookup is not required for static test data
