# Spec Delta

## Purpose

Ensures that the Bill Amount field in the claim submission flow strictly accepts positive numeric values (> 0) and prevents negative numbers or zero from being entered or submitted.

## ADDED Requirements

### Requirement: Non-Negative Bill Amount Validation
The system SHALL prevent users from entering, pasting, or submitting a non-positive (zero or negative) bill amount in `opd-new-claim-page`.

#### Scenario: Keydown prevents negative and exponential characters
- **WHEN** a user types `-`, `+`, `e`, or `E` into the bill amount input field
- **THEN** the keypress is intercepted and prevented from altering the input value

#### Scenario: Paste handler rejects negative numbers
- **WHEN** a user attempts to paste text containing `-` or `+` into the bill amount input field
- **THEN** the paste operation is blocked

#### Scenario: Inline error banner for non-positive amount
- **WHEN** the bill amount value is `<= 0`
- **THEN** an inline error alert displays *"Bill amount must be greater than zero."*
- **AND** the input border is styled with `border-danger-500`

#### Scenario: Progression blocked for non-positive amount
- **WHEN** a user clicks Continue while the bill amount is `<= 0`
- **THEN** `missingStep1()` returns `"Bill amount must be greater than zero."`
- **AND** the form prevents moving to Step 2

#### Scenario: Progression blocked when bill amount is omitted
- **WHEN** a user clicks Continue while the bill amount is empty or null
- **THEN** `missingStep1()` returns `"Enter the bill amount."`
- **AND** the form prevents moving to Step 2
