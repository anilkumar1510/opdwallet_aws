# claim-cancel Specification

## Purpose
Lets a member withdraw a reimbursement claim from the detail page, setting its status to CANCELLED on the backend and reflecting the change in the claims list.

## ADDED Requirements

### Requirement: Claim cancel action
The system SHALL allow a member to cancel a claim from the claim detail page by confirming the withdrawal action. The claim status SHALL be set to CANCELLED on the backend and the member SHALL be returned to the claims list.

#### Scenario: Member cancels a claim in DRAFT status
- **WHEN** a member views a claim in DRAFT status and clicks "Cancel this claim", confirms the action, and clicks "Yes, withdraw it"
- **THEN** the claim status is set to CANCELLED on the backend, the member is navigated to the claims list, and the claim displays with a CANCELLED badge

#### Scenario: Member cancels a claim in SUBMITTED status
- **WHEN** a member views a claim in SUBMITTED status and clicks "Cancel this claim", confirms the action, and clicks "Yes, withdraw it"
- **THEN** the claim status is set to CANCELLED on the backend, the member is navigated to the claims list, and the claim displays with a CANCELLED badge

#### Scenario: Member cancels a claim in UNDER_REVIEW status
- **WHEN** a member views a claim in UNDER_REVIEW status and clicks "Cancel this claim", confirms the action, and clicks "Yes, withdraw it"
- **THEN** the claim status is set to CANCELLED on the backend, the member is navigated to the claims list, and the claim displays with a CANCELLED badge

#### Scenario: Member cancels a claim in DOCUMENTS_REQUIRED status
- **WHEN** a member views a claim in DOCUMENTS_REQUIRED status and clicks "Cancel this claim", confirms the action, and clicks "Yes, withdraw it"
- **THEN** the claim status is set to CANCELLED on the backend, the member is navigated to the claims list, and the claim displays with a CANCELLED badge

#### Scenario: Member cancels a claim and the cancel fails
- **WHEN** a member attempts to cancel a claim but the backend returns an error
- **THEN** the member remains on the claim detail page, an error message is displayed, and the claim status is unchanged

#### Scenario: Member cancels a claim and sees success confirmation
- **WHEN** a member successfully cancels a claim
- **THEN** a success message is displayed and the member is navigated to the claims list where the claim shows CANCELLED status
