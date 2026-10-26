# Tasks

## 1. Specification & Design
- [x] 1.1 Document proposal and design in OpenSpec change `restrict-treatment-date-by-claim-expiry`.
- [x] 1.2 Define spec delta requirements and scenarios for claim treatment date restriction.

## 2. Implementation
- [x] 2.1 Add `claimExpiryDays` computed signal in `NewClaimPage` reading `policyStore.version()?.claim_expiry` with 45-day default.
- [x] 2.2 Add `minTreatmentDate` computed signal calculating `today - claimExpiryDays` in `YYYY-MM-DD` format.
- [x] 2.3 Bind `[min]="minTreatmentDate()"` on `<input id="treatmentDate">` and display helper message.
- [x] 2.4 Add validation checks in `missingStep1()` blocking dates older than `minTreatmentDate` and future dates.

## 3. Verification
- [x] 3.1 Validate OpenSpec change with `npx openspec validate restrict-treatment-date-by-claim-expiry`.
- [x] 3.2 Run TypeScript compilation check with `npx tsc --noEmit -p projects/member/tsconfig.app.json`.
