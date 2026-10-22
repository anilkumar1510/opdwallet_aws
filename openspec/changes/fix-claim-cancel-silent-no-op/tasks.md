## 1. Fix cancelClaim handler in claim-detail-page.ts

- [x] 1.1 Extract `claim_id` from `displayClaim()` live payload — the payload field is `claim_id`, not `reference`; add a helper `getClaimId()` that returns `displayClaim()?.claim_id ?? claimId()` 
- [x] 1.2 Update `cancelClaim(reference)` to use the extracted `claim_id` — replace `cancelClaim(detail.reference)` with `cancelClaim(claimId)` where `claimId` is from step 1.1
- [x] 1.3 Issue `PATCH` to the `opd_claim` backend — replace the in-memory `_patch()` call with a real HTTP call to `habit-opd/api/v1/opd_claim` using `appService.post()`/`put()` with a payload `{ resource: JSON.stringify({ claim_status: CANCELLED, action: 'cancel' }), action: 'cancel' }` following the same pattern as `sendDocuments()`
- [x] 1.4 Add `submitting` signal management — set `submitting` to `true` before the request, `false` in `finally` block; update button `[disabled]="submitting"` and label `{{ submitting() ? 'Cancelling…' : 'Yes, withdraw it' }}`
- [x] 1.5 Add success/error feedback — on success, display a success toast and keep the member on the page (or navigate after a short delay); on error, display the error in the `store.submitError()` banner and keep the member on the page
- [x] 1.6 Ensure `reason` is sent to the backend — include the member's typed reason in the request payload under `reason` field, or as a separate `action` parameter; the backend may require it for audit purposes

## 2. Update claims store or add cancel action

- [ ] 2.1 If the backend cancel endpoint `PATCH member/claims/:id/cancel` is truly removed, confirm with the backend team that the new endpoint `POST/PATCH habit-opd/api/v1/opd_claim` with `action: cancel` is available
- [ ] 2.2 If a new `ClaimsStore.cancel()` method is needed that issues the real HTTP request (instead of the current in-memory `_patch()`), add it — following the existing `submit()` pattern which already uses `appService.getcall()` and handles success/error
- [ ] 2.3 Ensure the `submitting` and `submitError` signals are properly managed in the new store method

## 3. Add UI feedback components

- [ ] 3.1 Add a success toast — using the existing notification system (e.g., `this.appService.showSuccess('Claim cancelled successfully')`) or an inline success message in the cancel section
- [ ] 3.2 Add an error toast — using the existing error banner (`store.submitError()`) but now populated by the cancel action; clear it after a timeout
- [ ] 3.3 Ensure the error banner can display cancel-specific errors (the current `store.submitError()` is only ever `.set(null)` by `submit()`, so either reuse it or add a `cancelError` signal)

## 4. Add e2e test for the cancel flow (optional but recommended)

- [ ] 4.1 Write a Playwright test that: logs in, creates/loads a claim, navigates to detail, clicks "Cancel this claim", confirms, verifies the claim status changes to CANCELLED and the member is on the claims list
- [ ] 4.2 Verify the test passes against a mock backend that returns CANCELLED status

## 5. Verify the fix end-to-end

- [ ] 5.1 Manual verification: create a claim, navigate to detail, click "Cancel this claim", confirm, verify the claim status is CANCELLED on the claims list
- [ ] 5.2 Run the e2e test (step 4) and confirm it passes
- [ ] 5.3 Check that no regressions are introduced to other claim workflows (submit, resubmit documents, etc.)
