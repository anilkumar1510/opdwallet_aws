## 1. Config & Infrastructure

- [x] 1.1 Create `playwright.config.ts` at repo root (Chromium, webServer=ng serve on port 4590, base URL /member)
- [x] 1.2 Add `test:e2e` script to `package.json` → `npx playwright test`
- [x] 1.3 Create `tests/e2e/claims/` directory

## 2. Test Specs

### 2.1 Claims List

- [x] 2.1.1 Write `tests/e2e/claims/claims-list.spec.ts` — dashboard 4-card summary visible, each claim row links to detail page, status badge renders, loading state appears then clears during `loadDashboard()`

### 2.2 Claim Detail

- [x] 2.2.1 Write `tests/e2e/claims/claim-detail.spec.ts` — open each seeded claim (CLM-2026-0009/0006/0004/0002), verify amount/status/timeline rendered, scenario switcher cycles statuses, cancel flow (confirm dialog → withdraw → back to list)

### 2.3 New Claim Form

- [x] 2.3.1 Write `tests/e2e/claims/new-claim.spec.ts` — step 1 validation blocks Continue on missing fields, valid navigation step 1 → 2 → 3, review summary reflects entered data, submit adds claim to list, over-limit cap notice shown

### 2.4 File Upload

- [x] 2.4.1 Write `tests/e2e/claims/file-upload.spec.ts` — attach files to document inputs on step 2, verify files appear in list with correct names, remove file clears it, cancelled cheque upload with size validation (>5MB rejected)

### 2.5 Loading States

- [x] 2.5.1 Write `tests/e2e/claims/loading-states.spec.ts` — patient dropdown shows "Loading…" on fresh load, category dropdown populated, dashboard spinner on claims list, all dropdowns settle before interaction

## 3. Verification

- [ ] 3.1 Install Chromium: `npx playwright install`
- [ ] 3.2 Run full suite: `npm run test:e2e` and verify all specs pass
