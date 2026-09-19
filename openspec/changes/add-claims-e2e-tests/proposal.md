## Why

The claims flow (list, detail, new-claim form) is a core member-facing feature with complex state transitions — dashboard aggregates, 3-step form validation, file uploads, scenario switching, cancel/resubmit actions. There is no automated test coverage today despite Playwright being installed as a dev dependency. A regression in any of these flows currently ships undetected.

## What Changes

- Add Playwright test suite covering the full claims user journey
- Add `playwright.config.ts` (project root) with dev-server webServer pointing at `ng serve member --proxy-config proxy.conf.json`
- Add test scripts to `package.json`
- Add `tests/e2e/claims/` directory with 5 spec files

### Specs

1. **claims-list.spec.ts** — Dashboard 4-card summary (total, in-progress, claimed, approved), claim rows with status badges, row links to detail, loading state appears and clears during `loadDashboard()`
2. **claim-detail.spec.ts** — Open each seeded claim (CLM-2026-0009/0006/0004/0002), verify amount/status/timeline, scenario switcher cycles statuses, cancel flow (confirm → withdraw → back to list)
3. **new-claim.spec.ts** — Step 1 validation blocks Continue on missing fields, valid navigation step 1 → 2 → 3, review summary reflects entered data, submit adds claim to list, over-limit cap notice shown
4. **file-upload.spec.ts** — Attach files to document inputs on new-claim step 2, verify files appear in list with correct names, remove file clears it, cancelled cheque upload with size validation (>5MB rejected)
5. **loading-states.spec.ts** — Patient dropdown shows "Loading…" on fresh load, category dropdown populated, dashboard spinner on claims list, all dropdowns settle before interaction

## Capabilities

### New Capabilities
- `claims-e2e`: End-to-end Playwright tests for the claims feature (list, detail, new-claim, file upload, loading states)

### Modified Capabilities
- (none)

## Impact

- **New files**: `playwright.config.ts`, `tests/e2e/claims/*.spec.ts`, `openspec/changes/add-claims-e2e-tests/*`
- **Modified**: `package.json` (add `test:e2e` script)
- **Dependencies**: `playwright` (^1.62.1, already in devDependencies), `ng serve` as webServer
- **Domain**: `api.habithealth.com` via existing proxy config (`proxy.conf.json`)
