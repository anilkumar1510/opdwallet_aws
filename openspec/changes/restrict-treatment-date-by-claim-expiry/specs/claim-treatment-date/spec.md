# Spec Delta

## Purpose

Restricts Treatment Date selection in the claim filing flow based on the active policy's `claim_expiry` parameter.

## ADDED Requirements

### Requirement: Policy-Driven Treatment Date Bounds
The system SHALL restrict treatment date selection in `opd-new-claim-page` between a minimum date (`today - claim_expiry days`) and a maximum date (`today`).

#### Scenario: Datepicker displays minimum allowed date based on claim_expiry
- **WHEN** the active policy version specifies `claim_expiry: 45`
- **THEN** the treatment date `<input>` element has `min` set to the date 45 days prior to today
- **AND** the treatment date `<input>` element has `max` set to today's date

#### Scenario: Datepicker defaults to 45 days when claim_expiry is omitted
- **WHEN** the active policy version omits `claim_expiry` or provides a value `<= 0`
- **THEN** `claimExpiryDays` defaults to `45` days
- **AND** `min` is set to 45 days prior to today

#### Scenario: Submission blocked when treatment date is older than claim expiry window
- **WHEN** a user enters a treatment date older than `today - claim_expiry days`
- **THEN** `missingStep1()` returns a validation error indicating the treatment date is outside the policy claim submission window
- **AND** the user cannot proceed to Step 2

#### Scenario: Submission blocked when treatment date is in the future
- **WHEN** a user enters a treatment date later than `today`
- **THEN** `missingStep1()` returns a validation error stating the treatment date cannot be in the future
- **AND** the user cannot proceed to Step 2
