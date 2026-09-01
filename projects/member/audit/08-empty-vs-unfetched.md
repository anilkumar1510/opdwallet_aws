# Empty vs. never-fetched, across all 17 stores

## Positive control

**Control:** the check must flag `claims.store.ts`, known to collapse the two states.

**Result: PASSED.** `grep -nE "_loaded|_fetched|hasLoaded|neverFetched|_ran"` against
`claims/claims.store.ts` returns nothing — the store has `_claims` (initialised `[]`),
`_loading`, and `_error`, and no never-fetched signal. The check can see the known
defect, so the findings below are a measurement rather than a broken grep.

**A second, looser pattern was rejected mid-check.** Adding `loadedFor` to the
regex made 7 stores look like they had a never-fetched state, including claims at
11 hits. `loadedFor` is a **private, non-reactive dedupe key** ("whose data is
currently loaded, so a repeat switch does not refetch"), not an exposed state. Had
I read that output without checking what it matched, this document would have
reported the opposite conclusion.

## Finding: none of the 17 stores distinguishes the two states

```
grep -rnE "readonly (loaded|ready|fetched|hasData|initialised)" --include=*.store.ts
→ no matches
```

Every store initialises its collection to `[]` or its object to `null`, and every
consuming screen branches on length or nullity. **Never-fetched and
fetched-and-empty are the same state everywhere in the application.**

| Category | Count | Stores |
|---|---|---|
| Distinguishes correctly | **0** | — |
| **Collapses the two** | **17** | all |
| No empty state at all | 0 | — |

## Scoping correction — the exposure is narrower than the finding implied

I expected this to also produce a false empty state during normal authenticated
use, in the window between a screen rendering and its first fetch resolving. **It
does not.** Verified live, both directions (`03-live/empty-flash.mjs`, sampling
every 50 ms from the instant navigation begins):

| Account | Has claims? | State sequence on a fresh visit to `/member/claims` |
|---|---|---|
| `standard@gmail.com` | no | `t+50ms EMPTY("No claims yet")` — **correct**, that is the true settled state |
| `shivam@gmail.com` | yes | `t+50ms content` — **no false empty state** |

The reason is architectural and worth recording as a strength: stores load through
an `effect()` keyed on `session.isAuthenticated()` and `family.activeMember()`, so
they begin fetching **at sign-in**, not at screen render.

> **CORRECTED 2026-08-10.** "At sign-in" is too strong for at least one store. A
> root-provided store's effect cannot run until the store is **constructed**, and
> that happens when a page first injects it. Measured: after sign-in, on `/member`,
> `BookingsStore` issues **zero** calls — the home screen does not inject it. It
> loads on first injection, then the `activeId === loadedFor` guard keeps it loaded.
>
> The conclusion of this file is unaffected — by the time a member reaches a screen
> that *uses* a store, that store is loading or settled — but "at sign-in" implies
> an eagerness the DI container does not provide.
> `35-api-integration-parity.md`, finding 1. By the time a member
navigates to a screen, its store has already settled. The collapse is real but
unreachable on this path.

**So the defect has exactly one trigger: a store that has been reset.** That means
signed-out — which, after last session's `terminate()` fix, means the bounded
window measured in `08-fix-session-1.md` and §Step 5 below.

This correction matters for remediation cost. "All 17 stores render false empties"
would justify adding a `loaded` signal to 17 stores and a branch to ~30 screens.
"Reset stores render false empties for up to one poll interval" does not — it
justifies one fix in one place.

## Recommended fix — one place, not seventeen

Do **not** add a `loaded` signal to 17 stores. The condition under which any of
them can lie is a single, already-known predicate: `!session.isAuthenticated()`.
The shell should decline to render member content in that state, which stops every
screen asserting anything at once and keeps termination logic in the one place the
spec's Rule requires.

That is a change to `member-shell`'s template, not to any store's public surface —
so it does not trip the stop condition on reshaping store surfaces.

**Not implemented in this session.** It changes what a member sees during the
termination window, and per the no-new-flows constraint the reference decides what
that is. `web-member/` never reaches this state: it does not gate on
`isAuthenticated()`, so it fires the request, takes a 401, and renders its error
state. Angular cannot copy that directly, because its gating is what prevents the
request. Choosing between *"render the shell's loading state"* and *"render
nothing until the redirect lands"* is a visible-behaviour decision with no
reference answer, and this audit's standing rule is to report those rather than
pick.

## Step 5 — the bound on the termination window

`terminate()` fires on any 401. But the browsing case that produced this finding
issues **no request at all**:

- `authGuard` is on the parent `/member` route (`app.routes.ts:18`), and Angular
  does not re-run a parent guard when navigating between children of an
  already-activated parent.
- Every store gates its load on `isAuthenticated()`, so a reset store never
  refetches and never 401s.

The only recurring request is the notification badge poll:
`POLL_MS = 30_000` (`notifications.store.ts:16`), started at sign-in.

**Worst case: 30 seconds.** A member whose session is rejected immediately after a
poll can browse for up to one full interval before the next poll 401s and
`terminate()` redirects. Consistent with the original spike, where the token
expired at t+60s and the 401 landed between t+52s and t+62s.

**Does the Step 1 fix eliminate the false claim or only its phrasing?** As
recommended above — refusing to render member content while unauthenticated — it
**eliminates the claim**: no screen states anything about the member's data,
rather than stating it more softly. Adding per-store `loaded` signals would only
have downgraded "No claims yet" to a spinner, which is a truthful non-statement but
leaves 17 stores each able to regress independently. That is the argument for the
one-place fix over the seventeen-place one.

## Consequence for task 3.9 — checked, as instructed

The brief asked whether 3.9 closes only because nobody wrote the scenario.
**Checked: no member-session scenario covers this.** The nearest is *"Session
rejected mid-session"*, whose clauses are: the session ends, the member is taken
to the login screen, and no previously loaded member data remains available. All
three now hold, and all three were observed.

What is uncovered is the **interval** between rejection and the poll that detects
it. No scenario in `member-session` addresses latency of detection, because the
spec was written assuming the 401 arrives on the member's own next request — which
is true in React, where nothing is gated.

**3.9 closes on its scenarios, and the gap is a spec gap, not a code gap.** Filed
here so the closure is not mistaken for full coverage: the 30-second window is a
known, measured, unspecified behaviour. It belongs in the `member-session` spec as
a new scenario, which is task 7.4's business and not this audit's to write.
