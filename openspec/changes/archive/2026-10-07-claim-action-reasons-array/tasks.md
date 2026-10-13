## 1. Types and DTOs

- [x] 1.1 Update `ClaimDto.claim_action_reason` to `claim_action_reasons?: string[]` in `projects/member/src/app/core/claims/claim.dto.ts`
- [x] 1.2 Update `Claim.claim_action_reason` to `claim_action_reasons?: readonly string[]` in `projects/member/src/app/core/claims/claim.model.ts`

## 2. Static and test data

- [x] 2.1 Update `STATIC_CLAIMS` builder to set `claim_action_reasons: string[]` in `projects/member/src/app/core/claims/static-claims.data.ts`
- [x] 2.2 Update scenario override `claim_action_reason` to `claim_action_reasons` arrays in `projects/member/src/app/features/claims/claim-detail-page-test.ts`

## 3. Claim detail page

- [x] 3.1 Change `actionReason()` in `claim-detail-page.ts` to return `string[]` by mapping each code through `getActionReasonDisplay()`
- [x] 3.2 Replace single reason template block with bullet list when reasons exist, else show “No reasons provided”
- [x] 3.3 Apply the same `actionReason()` and template changes in `claim-detail-page-test.ts`

## 4. Verification

- [x] 4.1 Run diagnostics/build on changed claim files and fix any type errors
- [x] 4.2 Run claims page/e2e checks and verify list, detail, docs-required, and rejected scenarios render reasons correctly
