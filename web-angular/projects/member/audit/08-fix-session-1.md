# Fix session 1 — record

First session in this audit authorised to edit source. Scope held to Steps 1–2;
Step 3 stopped on a corrected premise, Steps 4–5 partially done. Detail below.

---

## Step 1 — FamilyStore census: done

`07-familystore-census.md`. **23 injectors; defect queue is 2, not ~30.** Both
positive controls passed before results were read.

It also overturned the premise of Step 3 — see §Step 3.

## Step 2 — `terminate()`: done, verified, **task 3.9 CLOSES**

### New finding, found while settling the spike's open question

The brief asked whether, with a rejected session and 7 live controls, clicking a
nav control redirects or silently 401s. **Neither. It navigates successfully and
makes no request at all.**

Observed (`03-live/click-after-expiry.mjs`), before the fix:

```
after idle, url: /member/wallet      401s so far: 2
after clicking "Claims":
  url       : /member/claims
  new calls : (none)
  body      : … Claims  Reimbursements for this member  New claim
              No claims yet  Reimbursement claims you submit will appear here.
```

Two mechanisms compound:

1. **`authGuard` sits on the parent `/member` route** (`app.routes.ts:18`), so it
   runs once on entry to the subtree. Angular does not re-run a parent guard when
   navigating between children of an already-activated parent. A signed-out member
   moving inside `/member/*` is never re-checked.
2. **Stores gate their loads on `session.isAuthenticated()`**, so after termination
   they do not attempt a fetch. No request, no 401, no error state.

The result is worse than the blank shell the spike recorded: **every screen renders
its ordinary empty state as though it were fact.** "No claims yet" is not a loading
failure or an error — it is a positive, false statement about the member's data,
served to someone who is signed out. A member could browse the whole portal this
way and conclude their records had been wiped.

This is why fixing at the interceptor was correct and adding navigation to callers
would not have helped: there is no caller, and there is no request.

### The change

| File | Change |
|---|---|
| `core/session/session.store.ts` | `expire()` → **`terminate()`**, per `design.md:139`. Injects `Router`; clears state then `router.navigate(['/login'])`. Still idempotent — concurrent 401s end the session and navigate once. |
| `core/session/session.store.ts` | `logout()` now calls `terminate()` instead of `clear()`, so sign-out and rejection are the same ending. |
| `core/http/api.interceptors.ts` | calls `terminate()` |
| `features/shell/profile-menu.ts` | removed its own `router.navigate(['/login'])`; the now-unused `Router` injection and import removed with it |
| `features/shell/member-shell.ts` | removed its own `router.navigate(['/login'])` (keeps `Router` — still used for notification `actionUrl`) |

Conformance to the constraints:

- **One place.** Termination and its navigation live only in `terminate()`. The old
  asymmetry — sign-out navigated because both callers did, expiry did not because
  nothing did — is gone.
- **Not `window.location.href`.** `Router.navigate`, as `design.md` requires.
- **Existing behaviour preserved.** `clear()` is untouched, so the 16 store resets
  and the "no stale data" guarantee are unchanged. Only navigation was added.
- **`SessionStore`'s public surface** gained `terminate()` and lost `expire()`;
  no other member changed. No reshaping was needed, so no stop condition triggered.

### Verified live

`03-live/verify-terminate.mjs`, 60s token:

```
PASS  Session rejected mid-session -> login (no user action)   /member/wallet -> /login
PASS  Login screen actually rendered                            "OPD Wallet  Sign in to your health benefits …"
PASS  Explicit sign out -> login (navigation now centralised)   landed on /login
```

### Task 3.9 — all 11 `member-session` scenarios pass

`03-live/session-full.mjs` (9/9) plus the two above:

| Scenario | Result |
|---|---|
| Successful login | PASS |
| Rejected credentials | PASS — *"That email or password was not recognised"* |
| Authentication service unreachable | PASS — *"We could not reach the service. Check your connection and try again."* (aborted `auth/login`) |
| Reload with a valid session | PASS |
| Reload with an expired session | PASS |
| Return to the attempted route after signing in | PASS — `/member/claims` |
| Direct navigation without a session | PASS |
| Login screen while already authenticated | PASS |
| Explicit sign out | PASS |
| **Session rejected mid-session** | **PASS** — was the BLOCKER |
| Signing back in after signing out | PASS — second session leaks neither Shivam's name nor his figures |

**Recommend closing 3.9.**

`ng build member` green after every edit.

## Step 3 — patient preselect: **STOPPED, premise corrected**

Not implemented. The reason is a correction to my own earlier finding, set out in
full at `07-familystore-census.md` §5. In short:

- I re-filed this DRIFT → BLOCKER last session on the reasoning that the flow
  "completes with wrong data".
- Reading the reference — which this session's constraint makes the acceptance
  criterion — shows Angular **cannot** complete with the wrong patient. React
  selects-then-Continues with an auto-selected default; **Angular has no default at
  all**, because every patient is a link that commits on tap. There is nothing to
  be wrongly defaulted.
- Correct severity is **GAP** — the reference's privacy-motivated auto-selection is
  missing — not BLOCKER.

**Why that stops the step rather than shrinking it:** preselection is meaningless
without a commit step to preselect into. Implementing it means restoring selection
state and a Continue button on two screens — a **visible flow change**, on the
strength of a finding I had graded wrong. Step 3's own instruction says to stop and
report rather than introduce states, and this is the inverse case: Angular is
*missing* a step the reference has, which is itself a previously-unrecorded
divergence and not one of the three sanctioned ones.

The census makes the eventual fix cheap either way — **2 files**, so the shared
mechanism Step 3 contemplated is not warranted at this size.

**Needs a decision:** restore the reference's select→Continue flow on both patient
pickers, or accept tap-to-commit as a divergence and record it as a fourth
sanctioned one.

## Step 4 — wallet seed data: **not done**

Not started. Deferred with Step 5 once Step 3 stopped; flagged rather than
half-done. 6.11 still needs rows for: unknown category code, unlimited category,
floater/shared wallet, empty transaction list, and a reversal.

The constraint on it stands and should carry forward: **do not normalise Sayani
Kumari's 19-day assignment overhang out of the fixtures.**

## Step 5 — close what closes

| Task | Verdict |
|---|---|
| **3.9 `member-session`** | **CLOSES** — 11/11 observed |
| 4.8 `member-shell` | already closed last session |
| 5.8 `member-family-context` | **unresolved, not failed** — see census §5; my earlier FAIL call on *"Switching the active member"* is itself in question, because a patient picker's purpose is to list the whole family, which React does too |
| 6.11 `member-wallet` | unchanged — no failures, 5 scenarios still lack seed data |

## Environment

`api/.env` set to `JWT_EXPIRY=60s` for the spike and the fix verification, then
restored to `7d` — `diff` against the backup reported identical, backup deleted,
API restarted on the restored value. Confirmed: the live API issues 604800-second
tokens.
