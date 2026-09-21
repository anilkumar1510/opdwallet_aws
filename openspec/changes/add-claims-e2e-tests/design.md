## Context

The `opd-wallet` Angular app (member portal) ships a claims feature across three routes: `/member/claims` (list), `/member/claims/new` (3-step form), `/member/claims/:id` (detail). All data is static/in-memory per `REMOVED-APIS.md`. Playwright is listed in `devDependencies` but has no config, no test directory, and no test scripts — nothing runs today.

The proxy config (`proxy.conf.json`) rewrites `/habit-opd/api/**`, `/account-management/api/**`, `/dms/api/**` to `https://api.habithealth.com/`. The test environment serves the app through `ng serve` with this proxy intact, so tests drive against the real proxy path.

## Goals / Non-Goals

**Goals:**
- Cover the claims user journey end-to-end: list, detail, new-claim submission, file uploads, loading states
- Run against the dev server with the existing proxy (no API mocking)
- Provide a foundation for future E2E coverage across other features

**Non-Goals:**
- No test for `/member/claims/:id/document/:kind` document views (no documents seeded)
- No test for claims API correctness (backend concern)
- No cross-feature tests (other features outside claims scope)
- No CI/CD pipeline integration in this change

## Decisions

### 1. Test location: `tests/e2e/claims/`
- **Why**: Co-located with source but clearly separated from unit tests (`projects/member/src/**/*.spec.ts` excluded from tsconfig). Top-level `tests/` signals these are integration tests, not part of the Angular build.
- **Alternative considered**: `e2e/` at repo root (Angular CLI convention). Rejected — CLI's e2e builder expects Protractor; this suite uses Playwright directly, so a plain `tests/` dir avoids adapter friction.

### 2. Config: `playwright.config.ts` at repo root
- **Why**: Playwright's standard location; `webServer` config handles starting the dev server so `npx playwright test` is the only command needed.
- **Browser**: Chromium (matches primary dev browser, fastest to install).
- **webServer**: `ng serve member --proxy-config proxy.conf.json` on port 4590, matching `package.json` start script.
- **Base URL**: `http://localhost:4590/member` (app router starts at `/member`).

### 3. Domain: real proxy, no mocking
- Tests drive against `api.habithealth.com` via the proxy. Claims data is static so the app renders regardless of proxy reachability, but all HTTP traffic flows through the configured path.
- `loadDashboard()` in `ClaimsStore` calls `CLAIMS_API.dashboard` and falls back to static data on failure — tests wait for the loading state to clear before asserting.

### 4. Spec structure
- One spec file per logical concern (list, detail, new-claim, file-upload, loading-states).
- Each spec is self-contained: navigates to the app, performs actions, asserts results. No shared setup hooks (tests are simple enough that fixtures would add complexity without benefit).
- Seeded claims (CLM-2026-0009/0006/0004/0002) are the test anchors — identified by reference from `static-claims.data.ts`.

### 5. File upload testing
- Playwright's `setInputFiles` drives the `<input type="file">` elements on new-claim step 2 and claim detail resubmit section.
- Tests create small temp files via `fs.writeFileSync` rather than committing fixtures.
- Validation tested: accepted file types (PDF/images), size rejection >5MB via `MAX_BYTES`.

## Risks / Trade-offs

- **Dev server dependency**: Tests require `ng serve` running (handled by `webServer`). If the dev server crashes, tests fail — acceptable for local/dev CI but not suitable for headless CI without a stable build target.
- **Static data assertions**: Tests assert against the 4 seeded claims in `static-claims.data.ts`. Adding/removing seeds will break tests — documented in `static-claims.data.ts`.
- **Proxy reachability**: `loadDashboard()` may call `api.habithealth.com` during tests. If unreachable, it falls back to static data, but there is a brief loading state. Tests wait for loading to clear.
- **HEIC/HEIF conversion**: `new-claim-page.ts` has complex file-upload logic (`heic2any` dynamic import, DICOM handling). Tests verify file attachment and naming only — not conversion — since that's backend-bound.

## Migration Plan
1. Add `playwright.config.ts` and `tests/e2e/claims/` directory.
2. Add `test:e2e` script to `package.json`.
3. Run `npx playwright install` to install Chromium.
4. Run `npm run test:e2e` to verify locally.

## Open Questions
- Should tests be added to CI later? (out of scope for this proposal)
- Should `playwright` browser binaries be committed or fetched on demand? (default: fetched on demand via `npx playwright install`)
