# Fix session 2 — record

Steps 1, 3 and 5 done. **Steps 2 and 4 not done** — stated plainly at the end.

---

## Step 1 — empty vs. never-fetched: audited, fix recommended not applied

Full analysis: `08-empty-vs-unfetched.md`. Headlines:

- **Control passed** — the check flags `claims.store.ts`, the known collapser.
- **All 17 stores collapse** never-fetched into empty. None exposes a
  never-fetched signal.
- **A looser second pattern was rejected mid-check.** Adding `loadedFor` made 7
  stores look correct, claims included. `loadedFor` is a private non-reactive
  dedupe key. Reading that output uncritically would have inverted the conclusion.
- **Scope is narrower than expected, and this was verified rather than assumed.**
  There is **no** false empty state during authenticated use: stores fetch on an
  `effect()` keyed to sign-in, not to screen render, so they are settled before a
  member navigates. Confirmed both ways — `shivam@` (has claims) goes straight to
  content; `standard@` shows "No claims yet" because that is *true* for him.
- The defect therefore has exactly one trigger: **a reset store**, i.e. signed out.

**Fix recommended, not applied:** one guard in the shell against
`!session.isAuthenticated()`, not a `loaded` signal in 17 stores. Not applied
because it changes what a member sees during the termination window and the
reference offers no answer — `web-member` never reaches this state, since it does
not gate and simply takes a 401. Choosing between "shell loading state" and
"render nothing until the redirect lands" is a visible-behaviour decision with no
reference to defer to, and this audit's rule is to report those.

## Step 2 — steps-per-flow diff: **NOT DONE**

No `09-step-count-diff.md` was produced. Context was spent on Steps 1, 3 and 5.
The one known instance is fully documented in
`09-divergence-4-tap-to-commit.md`; the systematic sweep across all flows is
outstanding and remains worth doing, precisely because the per-screen schema
cannot see step boundaries.

## Step 3 — picker resolved and fixed

### Divergence sanctioned

`09-divergence-4-tap-to-commit.md`, staged for `../../../tools/parity-divergences.md`
(outside this session's writable set — **porting it is a required follow-up**).

The entry records that this is the **first divergence sanctioned reactively**, that
part of the reason is the cost of reverting, and that this is a weaker standard
than the first three met. It carries a three-question test for the next such
request, so the next one is arguable rather than waved through.

### Separable defect fixed

Family context not reaching the picker survives the tap-to-commit decision. Both
files now read `activeMember()`:

| File | Change |
|---|---|
| `features/appointments/appointment-patient-page.ts` | `isActive(member)` → `bg-blue-50` highlight + a "Currently viewing" line |
| `features/clinic-booking/select-patient-page.ts` | identical |

Marker only. **No default selection, no commit step, no wrong-patient failure
mode.** The highlight reuses the idiom `profile-menu.ts:59` already uses to mark
the active member, so it is an existing in-app signal rather than a new one.

Scope per the census: 2 files, direct fixes, no shared abstraction.

### Verified live (`03-live/verify-picker.mjs`)

```
PASS  Active member marked on the picker                     markers: 1
PASS  Marker sits on the signed-in member by default         "Shivam Jha Self Currently viewing"
PASS  Marker follows the family switch                       "Sayani Kumari Spouse Currently viewing"
PASS  No commit step added — tap still navigates straight    landed /member/appointments/select-slot
PASS  Tap books the tapped member, not the active one        explicit patientId in the query
```

The third and fifth lines are the ones that matter: the switch propagates, and the
booking still commits to whoever was tapped rather than to the active member.

### Task 5.8

The scenario I previously failed — *"Switching the active member … every screen
subsequently presents that dependent's data"* — is resolved. It was the wrong
reading (a picker's purpose is to list the whole family, as React's does), and the
picker now surfaces the active member regardless.

**5.8 still does not close**, for unrelated reasons: *dependent signs in directly*
(no credential known), *unrecognised relationship*, *family load fails*, and
*selection does not survive sign out* remain unobserved. Open on coverage, not on
defect.

## Step 5 — termination window bounded

- `authGuard` is on the parent `/member` route and does not re-run between
  children; gated stores never refetch, so browsing issues **no request**.
- The only recurring request is the badge poll: `POLL_MS = 30_000`.
- **Worst case: 30 seconds** of silent, authenticated-looking browsing after
  rejection.
- The recommended Step 1 fix **eliminates the false claim**, not merely its
  phrasing — no screen would state anything about member data. Per-store `loaded`
  signals would only downgrade "No claims yet" to a spinner.

### Task 3.9 — checked before closing, as instructed

**No `member-session` scenario covers the window.** The nearest, *"Session rejected
mid-session"*, requires: session ends, member taken to login, no stale data
remains. All three hold and all three were observed.

**3.9 closes on its scenarios; the 30-second window is a spec gap, not a code
gap.** Recorded so the closure is not read as full coverage. It belongs in
`member-session` as a new scenario — task 7.4's business.

## Step 4 — wallet seed data: **NOT DONE**

Second session running. 6.11 remains open with no failures and five unseeded
scenarios: zero-balance, unlimited category, floater wallet, empty transaction
list, reversal.

The constraint carries forward unchanged: **do not normalise Sayani Kumari's
19-day assignment overhang out of the fixtures.**

## Environment

`api/.env` untouched this session; confirmed at `JWT_EXPIRY=7d` throughout. No
backup was needed because no step required changing it.
