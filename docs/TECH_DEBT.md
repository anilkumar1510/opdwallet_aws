# Technical Debt Tracker

This document tracks technical debt items that have been identified but deferred for future implementation.

---

## High Priority

### 1. Claim Draft Persistence with Encrypted Storage
**Status:** Not Started
**Priority:** Medium
**Added:** 2026-02-09
**Component:** web-member-rn (Member Portal)

**Description:**
The secure storage infrastructure (`secureStorage.ts` with AES-256-GCM encryption) has been implemented, but claim draft persistence is not integrated into the claim form.

**Current Behavior:**
- Claim form data is stored in React state (memory only)
- Data is lost on page refresh or navigation
- No persistence across sessions

**Proposed Implementation:**
- Integrate `saveDraft`, `loadDraft`, `clearDraft` from `src/lib/claimHelpers.ts` into the claim form
- Auto-save draft as user fills the form (debounced)
- Load existing draft when user returns to the claim form
- Clear draft after successful claim submission
- Show "Draft saved" indicator in UI

**Files to Modify:**
- `app/member/claims/new.tsx` - Add draft auto-save and load functionality

**Files Already Implemented:**
- `src/lib/storage/secureStorage.ts` - AES-256-GCM encrypted storage (ready)
- `src/lib/claimHelpers.ts` - `saveDraft`, `loadDraft`, `clearDraft` functions (ready)

**HIPAA Compliance:**
The `secureStorage` module encrypts all data at rest using AES-256-GCM, ensuring PHI in claim drafts is protected per HIPAA §164.312(a)(2)(iv).

**Estimated Effort:** 2-4 hours

---

## Medium Priority

### 2. Rate Limiting Is Hardcoded, Ignoring Its Own Config
**Status:** Not Started
**Priority:** Medium
**Added:** 2026-07-28
**Component:** api

**Description:**
`api/src/config/configuration.ts` parses a `rateLimit` block and a `security` block, but
`api/src/main.ts` hardcodes the actual limiter values and never reads them. The environment
variables are silently inert.

**Current Behavior:**
- Global limiter fixed at a 15-minute window and 1000 requests per IP
- Auth limiter fixed at a 15-minute window, 50 requests in production and 500 in development
- `RATE_LIMIT_WINDOW`, `RATE_LIMIT_GLOBAL`, `RATE_LIMIT_AUTH`, `RATE_LIMIT_API`,
  `MAX_LOGIN_ATTEMPTS` and `LOCK_TIME` have no effect anywhere
- Rate limits cannot be tuned per environment without a code change and redeploy

**Proposed Implementation:**
- Read the limiter values from `ConfigService` in `main.ts`, keeping the current numbers as defaults
- Either wire up `security.maxLoginAttempts` / `lockTime` for account lockout, or delete them
  from `configuration.ts` so they stop implying a feature that does not exist

**Files to Modify:**
- `api/src/main.ts`
- `api/src/config/configuration.ts`

**Estimated Effort:** 1-2 hours

---

## Low Priority

### 3. Duplicate, Unused Cache Module
**Status:** Not Started
**Priority:** Low
**Added:** 2026-07-28
**Component:** api

**Description:**
`api/src/common/cache/cache.module.ts` exports `CacheConfigModule`, which configures a Redis
cache store. It is never imported by any module — `app.module.ts` registers its own Redis cache
configuration directly. The file is dead code that duplicates live configuration and will drift.

**Current Behavior:**
- `CacheConfigModule` compiles and is exported but is not part of the module graph
- Its TTL (3600s) and `max` (100 items) differ from the values actually in use
- A developer editing it to change caching behaviour would see no effect

**Proposed Implementation:**
- Delete `api/src/common/cache/cache.module.ts`, or import it in `app.module.ts` and remove the
  inline duplicate — one or the other, not both

**Files to Modify:**
- `api/src/common/cache/cache.module.ts`
- `api/src/app.module.ts`

**Estimated Effort:** 30 minutes

---

### 4. Unactioned Findings in the Dead Code Audit
**Status:** Partially Complete
**Priority:** Low
**Added:** 2026-07-28
**Component:** web-admin, web-tpa, web-finance, web-operations, web-doctor, web-member

**Description:**
`docs/DEAD_CODE_AUDIT_REPORT.md` (January 11, 2026) listed dead code across all six portals.
Orphaned component files were removed, but the unused exported functions were not — for example
`getCugs()` and `createCug()` still sit in `web-admin/lib/api.ts`.

**Proposed Implementation:**
- Re-verify each remaining finding against current code (the report is a point-in-time snapshot)
- Remove what is still dead, then delete or archive the report so it stops reading as live work

**Estimated Effort:** 2-3 hours

---

## Completed Items

*(Move items here when completed)*

---

## How to Add New Items

Use this template:

```markdown
### [N]. [Title]
**Status:** Not Started | In Progress | Completed
**Priority:** High | Medium | Low
**Added:** YYYY-MM-DD
**Component:** [api | web-admin | web-member | web-member-rn | web-doctor | web-tpa | web-operations | web-finance]

**Description:**
[Brief description of the technical debt]

**Current Behavior:**
- [Current behavior point 1]
- [Current behavior point 2]

**Proposed Implementation:**
- [Implementation step 1]
- [Implementation step 2]

**Files to Modify:**
- [file1.ts]
- [file2.tsx]

**Estimated Effort:** [X hours/days]
```
