## Why

The backend is changing `claim_action_reason` from a single string to `claim_action_reasons` as a string array, because a claim status can have multiple action reasons. The frontend must consume the new shape without breaking the claim detail view.

## What Changes

- **BREAKING**: `ClaimDto.claim_action_reason?: string` → `claim_action_reasons?: string[]`
- **BREAKING**: `Claim.claim_action_reason?: string` → `claim_action_reasons?: readonly string[]`
- Claim detail alert panel renders a bullet list of mapped reasons instead of a single paragraph
- When the array is empty or missing, the panel shows “No reasons provided”
- Static/test claim data updated to use arrays
- Valueset mapping logic stays single-code; each array element is mapped individually

## Capabilities

### New Capabilities
- `claim-action-reasons-array`: consume `claim_action_reasons` array in claim detail UI

### Modified Capabilities
- None

## Impact

- `projects/member/src/app/core/claims/claim.dto.ts`
- `projects/member/src/app/core/claims/claim.model.ts`
- `projects/member/src/app/core/claims/static-claims.data.ts`
- `projects/member/src/app/features/claims/claim-detail-page.ts`
- `projects/member/src/app/features/claims/claim-detail-page-test.ts`
- Backend contract: `claim_action_reasons` replaces `claim_action_reason`
