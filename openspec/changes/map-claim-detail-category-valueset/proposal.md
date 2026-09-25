## Why

The production Claim Details route renders the raw claim category code returned by `GET_PAGE`, while the Claims list resolves the same code through the `claim_category` valueset and shows a human-readable category. Members therefore see inconsistent labels for the same claim. The detail display must use the valueset without changing the raw code used by API payloads.

## What Changes

- Add a presentation-only claim-category valueset lookup for the production `/member/claims/:claimId` route.
- Render the valueset display name in the Claim Details category heading, matching the Claims list.
- Preserve the raw `category` code on the loaded claim for API operations, including document resubmission.
- Fall back to the raw category value when the valueset is unavailable or does not contain a matching code.
- Reuse the existing `claim_category` valueset request and category mapping path; add no backend endpoint or dependency.
- Leave the static `/member/claims/test/:claimId` route unchanged; this change is for the live production data path.

## Capabilities

### New Capabilities
- `claim-detail-category-valueset`: Display human-readable claim categories on the production Claim Details route using the existing claim-category valueset while preserving the API category code.

### Modified Capabilities

- None.

## Impact

- Affected area: `projects/member/src/app/core/claims/claims.store.ts` and `projects/member/src/app/features/claims/claim-detail-page.ts`, with focused coverage for the category mapping and rendering behavior.
- Existing API: `GET_PAGE` remains unchanged; its `category` value remains the source of truth for API requests.
- Existing valueset API: the already-used `claim_category` lookup is reused or shared with the list path.
- Dependencies: none.
- Behavioral boundary: only the production live Claim Details route changes; static/test-only claim data is not reclassified.
