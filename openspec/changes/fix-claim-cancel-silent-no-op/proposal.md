## Why

The "Cancel this claim" button on the claim detail page is a silent no-op on live data. When a member clicks "Yes, withdraw it", the application navigates away to the claims list but the claim's status is completely unchanged — the backend state is not mutated, and the member sees no indication anything happened. This regression occurred when the detail page was switched from the static store to live `GET_PAGE` integration, while the cancel handler was never updated to pass the correct identifier or issue the actual cancel action.

## What Changes

- Fix the `cancelClaim` handler in `claim-detail-page.ts` so it passes the correct business identifier (`claim_id`) to the cancel action
- Ensure the cancel action issues a `PATCH` request to the `opd_claim` backend endpoint to set the claim status to `CANCELLED`
- Add UI feedback (success/error messaging) so the member knows the cancel was processed
- Update the claims list to reflect the cancelled status

## Capabilities

### New Capabilities

- `claim-cancel`: The member can successfully cancel a reimbursement claim from the detail page, which sets the claim status to `CANCELLED` on the backend and reflects the change in the claims list

### Modified Capabilities

- None (no existing claim capability requirements are changing; the fix restores existing intended behavior)

## Impact

- **Code**: `claim-detail-page.ts` — the `cancelClaim` method and its call to `store.cancel()` 
- **API**: `PATCH member/claims/:id/cancel` (or the appropriate `opd_claim` backend endpoint)
- **Backend**: The `opd_claim` resource needs a `cancel` action handler that sets the claim status to `CANCELLED`
- **Testing**: e2e test should verify the cancel flow end-to-end (new or modified)
- **Note**: No existing spec-level requirements are changing — this is a bugfix restoring prior intended behavior. However, a new `claim-cancel` capability is declared so the change has at least one capability and does not require `skip_specs: true`.
