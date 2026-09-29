## 1. Category Lookup

- [x] 1.1 Reuse or centralize the existing `claim_category` valueset code-to-display lookup in the claims store/mapping boundary.
- [x] 1.2 Add a detail-safe display accessor that returns the valueset display name and falls back to the original category code.

## 2. Claim Details Rendering

- [x] 2.1 Update the production Claim Details category heading to bind to the display accessor while preserving `detail.category` as the raw API code.
- [x] 2.2 Verify the document-resubmission payload still spreads the original claim category code and is not replaced by the display label.
- [x] 2.3 Keep the static Claim Details test route unchanged.

## 3. Verification

- [x] 3.1 Add or update focused tests for mapped category, unknown-code fallback, and valueset failure fallback.
- [x] 3.2 Run diagnostics on changed TypeScript files and run the project's build/test verification relevant to the claims flow.
- [x] 3.3 Validate the OpenSpec change and review the final diff to confirm no unrelated files changed.
