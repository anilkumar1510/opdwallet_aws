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

*(No items currently)*

---

## Low Priority

*(No items currently)*

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
