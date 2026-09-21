# Claims E2E

End-to-end Playwright tests for the claims feature: list, detail, new-claim form, file upload, and loading states.

## User Journeys

### View claims list

Given the member is on `/member/claims`
Then the dashboard summary shows 4 cards (total, in-progress, claimed, approved)
And 4 seeded claims are listed (CLM-2026-0009, CLM-2026-0006, CLM-2026-0004, CLM-2026-0002)
And each claim row has a status badge and a link to the detail page
And the loading spinner appears during initial load and clears

### View claim detail

Given the member opens `/member/claims/CLM-2026-0009`
Then the detail page shows the claim amount, status, patient, and timeline
And the scenario switcher is visible
When the scenario is switched to "Approved (full)"
Then the status badge and approved amount update accordingly
And the cancel button appears for cancellable claims
When cancel is confirmed
Then the member returns to `/member/claims`

### Submit a new claim

Given the member is on `/member/claims/new`
When they try to continue from step 1 with no values
Then Continue is blocked and validation errors appear
When they select patient, category, treatment date, and bill amount
Then Continue enables and advances to step 2
When documents and bank details are provided on step 2
Then Continue enables and advances to step 3
And the review summary reflects the entered data
When the claim is submitted
Then the new claim appears in the claims list
And a cap notice appears if bill exceeds per-claim limit

### Upload files

Given the member is on `/member/claims/new` at step 2
When they attach files to document inputs
Then the files appear in the list with their names
When they remove an attached file
Then the file is no longer in the list
When a cancelled cheque over 5 MB is attached
Then a size error appears

### Loading states

Given a fresh page load
Then the patient dropdown shows "Loading…" until family data is ready
And the category dropdown is populated from `STATIC_CLAIM_CATEGORIES`
And the claims list shows a loading label during dashboard load
And all dropdowns are settled before interaction is possible
