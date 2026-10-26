# Proposal

## Why

Under insurance and corporate health policy rules, reimbursement claims must be filed within a configured period (e.g. 45 days) from the date of medical treatment. The backend exposes this window as `claim_expiry` (number of days) in the `opd_policy_version` API response.

Previously, the `opd-new-claim-page` component only capped the Treatment Date at the current date (`[max]="today"`), with no lower bound restriction. Users could select dates from months or years in the past, leading to rejected claim submissions and poor user experience.

This change dynamically restricts the Treatment Date selection using the active policy version's `claim_expiry` value, preventing users from selecting expired dates and providing inline guidance.

## What Changes

- **Dynamic Claim Expiry Period**: Reads `claim_expiry` from the active policy version (`PolicyStore.version()`), defaulting to 45 days if unspecified.
- **Datepicker Lower Bound (`[min]`)**: Computes `minTreatmentDate` (`today - claim_expiry days`) and applies `[min]="minTreatmentDate()"` to `<input id="treatmentDate" type="date">`.
- **Form Validation**: Enhances `missingStep1()` validation in `NewClaimPage` to disallow manual input of dates older than `minTreatmentDate()` or dates in the future.
- **Inline Helper Guidance**: Displays a helper message below the date field informing the user of the allowed submission window (e.g., *"Claims must be submitted within 45 days of treatment."*).

## Capabilities

### New Capabilities
- `claim-treatment-date-restriction`: Restricts the treatment date picker and form validation based on the active policy's `claim_expiry` window.

### Modified Capabilities
- None

## Impact

- `projects/member/src/app/features/claims/new-claim-page.ts`: Adds `claimExpiryDays` and `minTreatmentDate` signals, binds `[min]`, adds helper text, and adds date range validation.
