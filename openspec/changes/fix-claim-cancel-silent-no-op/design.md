## Context

The "Cancel this claim" button on the claim detail page (`claim-detail-page.ts`) is a silent no-op on live data. When a member clicks "Yes, withdraw it", the application navigates to the claims list but the claim's status is completely unchanged. This regression occurred in commit `c299137` when the detail page was switched from the static store to live `GET_PAGE` integration (`store.claimDetails()`), while the `cancelClaim` handler was never updated to pass the correct identifier or issue the actual cancel action.

The live payload from `GET_PAGE` carries the business identifier as `claim_id` (not `reference`), and the `ClaimsStore.cancel()` method patches the in-memory seed list by `reference` matching — so passing `undefined` silently does nothing. Additionally, the backend `PATCH member/claims/:id/cancel` endpoint was removed (REMOVED-APIS.md row 13), so the fix must issue the cancel against the new `habit-opd/api/v1/opd_claim` endpoint.

## Goals

- The member can cancel a claim from the detail page and the claim status is set to `CANCELLED` on the backend
- The member is navigated back to the claims list where the claim reflects the cancelled status
- The UI provides clear success/error feedback to the member
- No existing claim workflows are broken

## Non-Goals

- Changing the claim detail page design beyond the cancel button
- Adding new claim statuses or modifying the status lifecycle
- Changing the claims list page layout
- Implementing new features unrelated to claim cancellation

## Decisions

### Decision 1: Use `claim_id` from the live payload

**Rationale**: The live `GET_PAGE` response carries `claim_id` as the business identifier. The cancel handler must extract `claim_id` from `displayClaim()` rather than relying on `detail.reference` which is `undefined` on live data.

**Alternative**: Pass `reference` from the route param — but the route param is the Mongo `_id`, not the business identifier, and navigating with it causes "Claim not found" errors (audit `15-claim-detail-id.md`).

**Decision**: Extract `claim_id` from `displayClaim()` in the `cancelClaim` method.

### Decision 2: Issue `PATCH` to the `opd_claim` backend endpoint

**Rationale**: The old `PATCH member/claims/:id/cancel` was removed (REMOVED-APIS.md). The new endpoint is `PATCH habit-opd/api/v1/opd_claim` with action `cancel` (as defined in `CLAIMS_API.cancel` at `claim.mapper.ts:36`, which points at `member/claims/${reference}/cancel` — but this requires the backend to still support it, or we issue the request against the new resource pattern).

**Alternative**: Use the `ClaimsStore` existing `submit` pattern which already hits the live backend via `appService.getcall('opd_claim', 'habit-opd', ...)`. However, `submit` creates a new claim; we need an update/cancel action.

**Decision**: Issue a `POST`/`PATCH` to `habit-opd/api/v1/opd_claim` with `resource` payload containing `status: CANCELLED` and `action: cancel`, following the same pattern as `sendDocuments` in the same component.

### Decision 3: Add UI feedback (success/error messaging)

**Rationale**: The current block has an error banner (`store.submitError()`) that is **never set** by cancel, and no success message exists. Adding explicit feedback ensures the member knows the action completed or failed.

**Alternative**: Silent navigation as-is (current behavior) — but this was deemed a bug.

**Decision**: Add `submitting` signal management, success/error toasts, and update the error banner to handle cancel-specific errors.

## Risks / Trade-offs

- [Risk: Backend cancel endpoint may not be fully implemented] → Mitigation: Work with backend team to ensure the cancel action is wired; if not, feature can be gated behind a feature flag.
- [Risk: Case-sensitivity of status code] → Mitigation: Normalize the status code to uppercase before sending (matching `toStatus()` pattern elsewhere in the codebase).
- [Risk: Navigating away before cancel completes] → Mitigation: Guard the navigate with the request's completion status; show "Cancelling…" state.

## Open Questions

- Should the success/error toast use the existing notification system or a new inline message? (Can be decided during implementation)
- Does the claims list need a `CANCELLED` badge filter or color change? (Depends on existing badge component — review `status-badge.ts`)

