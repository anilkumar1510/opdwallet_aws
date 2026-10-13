## Context

The claim detail page currently shows a single action reason from `claim_action_reason`. The backend is switching to `claim_action_reasons: string[]` because some statuses legitimately have multiple reasons. The UI must render all reasons in the existing alert panel while keeping valueset mapping behavior unchanged.

## Goals / Non-Goals

**Goals:**
- Consume `claim_action_reasons` as an array in the claim detail view.
- Render reasons as a bullet list in the same alert panel.
- Show “No reasons provided” when the array is empty or absent.
- Keep valueset lookup unchanged: one code → one display string.

**Non-Goals:**
- Changing the valueset resource ID.
- Adding backend migration or backward-compatibility shims.
- Changing how reasons are stored or fetched beyond the detail payload shape.

## Decisions

### 1. Keep reading from raw detail object
The UI already reads `detail.claim_action_reason` from the raw API object, not from the mapped `Claim` model. We will continue this pattern with `detail.claim_action_reasons` to avoid widening the change into `toClaim()` and domain-model churn.

### 2. Map each reason individually in the UI
`ClaimsStore.getActionReasonDisplay(code)` already handles single-code lookup. `ClaimDetailPage.actionReason()` will iterate the array and map each element through that helper. No new store method is required.

### 3. Empty array hides reasons, then shows fallback text
`@if (reasonList.length)` renders the bullet list; otherwise the template renders `<p>No reasons provided</p>`. This matches the current “absent field = hide panel” behavior while satisfying the requirement to surface the empty state explicitly.

### 4. Static/test data uses arrays
`STATIC_CLAIMS` and test-page scenario overrides will set `claim_action_reasons: string[]` instead of the old singular string field.

## Risks / Trade-offs

- **Valueset gap for a code** → handled: `getActionReasonDisplay()` falls back to the raw code when no valueset entry exists.
- **Backend returns mixed legacy/new field during rollout** → out of scope: confirmed clean cutover, no migration path.
