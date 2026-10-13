## ADDED Requirements

### Requirement: Submit dental claim type with claim
The system SHALL include the `dental_claim_type` field in the claim submission payload sent to the Twenty API.

#### Scenario: Dental category claim submission with procedure type
- **WHEN** member selects DENTAL category and "Procedure" dental type and submits claim
- **THEN** payload includes `"dental_claim_type": "procedure"`

#### Scenario: Dental category claim submission with consultation type
- **WHEN** member selects DENTAL category and "Consultation" dental type and submits claim
- **THEN** payload includes `"dental_claim_type": "consultation"`

#### Scenario: Non-dental category claim submission
- **WHEN** member selects non-DENTAL category (e.g., ONLINE_CONSULTATION) and submits claim
- **THEN** payload does NOT include `dental_claim_type` field

### Requirement: Dental claim type persists in submitted claim
The system SHALL store the `dental_claim_type` value with the claim record for retrieval.

#### Scenario: Claim detail retrieves dental claim type
- **WHEN** member views claim detail for a dental claim
- **THEN** GET_PAGE response includes `dental_claim_type` field with submitted value