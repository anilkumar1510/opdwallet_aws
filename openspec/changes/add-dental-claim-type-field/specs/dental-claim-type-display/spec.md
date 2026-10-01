## ADDED Requirements

### Requirement: Display dental claim type on claim detail page
The system SHALL display the `dental_claim_type` field on the claim detail page when present in the claim data.

#### Scenario: Dental claim shows claim type
- **WHEN** member views claim detail for a dental claim with `dental_claim_type` in response
- **THEN** page displays "Dental claim type: Procedure" (or "Consultation") in the summary section

#### Scenario: Non-dental claim does not show dental type
- **WHEN** member views claim detail for non-dental claim
- **THEN** page does not display dental claim type row (field absent or empty in response)

#### Scenario: Dental claim without type in response
- **WHEN** member views dental claim but response lacks `dental_claim_type` field
- **THEN** page does not display dental claim type row (graceful degradation)