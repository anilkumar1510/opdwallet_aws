## 1. Claim Submission - Add Field to Payload

- [x] 1.1 Add conditional `dental_claim_type` to payload object in `new-claim-page.ts` submit() method (only when `isDental()` is true)
- [x] 1.2 Map `dentalSubType()` signal value (`consultation`/`procedure`) to payload field
- [x] 1.3 Verify payload structure matches existing base64 encoding flow

## 2. Claim Detail Page - Display Field

- [x] 2.1 Add dental claim type display in claim detail summary section (`claim-detail-page.ts`)
- [x] 2.2 Conditionally render only when `dental_claim_type` is present and non-empty in response
- [x] 2.3 Position after "Claim type" row in summary (around line 131)

## 3. Verification & Tests

- [x] 3.1 Update e2e test (`new-claim.spec.ts`) to verify `dental_claim_type` payload for dental submissions
- [x] 3.2 Test dental claim submission with both Consultation and Procedure types
- [x] 3.3 Test non-dental claim submission does NOT include `dental_claim_type`
- [x] 3.4 Verify claim detail page displays dental claim type for dental claims
- [x] 3.5 Run existing e2e tests to ensure no regressions