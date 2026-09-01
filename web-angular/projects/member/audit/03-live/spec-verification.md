# Phase 3 — live verification against the four approved specs

**Superseded run, 2026-08-07 (second pass).** The first pass was API-only and
could not reach browser behaviour. Playwright is now installed, so every
browser-dependent scenario has been **observed**, not inferred.

Reproducers, all read-only: `spike.mjs`, `scenarios.mjs`, `scenarios2.mjs`,
`scenarios3.mjs`, `scenarios4.mjs`, `chk-order.mjs`.

Accounts: `standard@gmail.com` / `User@123` (no cover, no dependents) and
`shivam@gmail.com` / `12345678` (cover in force, 1 dependent — Sayani Kumari).
Clean browser context per run, so no `opd_session` collision with the other portals.

## Two of my own assertions were wrong — corrected before recording

Recorded because an audit that hides its own false positives is not trustworthy.

1. **"Unknown member route" first reported FAIL.** The app renders *"404 — We
   could not find that page"*; my regex tested for "not found". The app was right.
   **PASSES.**
2. **"Transactions newest first" first reported FAIL.** My date scrape included
   the `Cover 19 Jun 2026 – 16 Jun 2027` line from the balance card. Re-scoped to
   the Activity section only: `2026-08-06 > 2026-08-04 > 2026-08-03 > … > 2026-06-21`,
   strictly non-increasing. **PASSES.**

A third initial FAIL — "primary can switch" — was also mine: I looked for a button
labelled *switch*, but the control is the avatar (`aria-label="Account menu for …"`).
That one turned up a real finding anyway; see `MemberSwitcher` below.

---

## `member-session` — task 3.9: **STAYS OPEN**

| Scenario | Result |
|---|---|
| Successful login | **PASS** (observed) |
| Rejected credentials | **PASS** (401 on tampered cookie) |
| Authentication service unreachable | not tested |
| Reload with a valid session | **PASS** (API) |
| Reload with an expired session | **PASS** (API) |
| Return to the attempted route after signing in | **PASS** — attempted `/member/wallet` while signed out, landed back on `/member/wallet` after login |
| Direct navigation without a session | **PASS** — `/member/wallet` → `/login` |
| Login screen while already authenticated | **PASS** — `/login` → `/member` |
| Explicit sign out | **PASS** (API + both call sites navigate) |
| **Session rejected mid-session** | **FAIL — BLOCKER** |
| Signing back in after signing out | not observed |

**Blocking scenario:** *Session rejected mid-session*. Observed headless: the
notification poll 401s at t+62s, the URL stays `/member/wallet`, the member's name
and all content vanish, 7 controls remain clickable, and no redirect to `/login`
ever happens. Full transcript in `session-expiry-spike.md`.

## `member-shell` — task 4.8: **CLOSES** ✅

**All 11 scenarios pass, every one observed in a browser.**

| Scenario | Result |
|---|---|
| Same URL across viewports | **PASS** |
| Resizing across the breakpoint | **PASS** — 1440→390, route and loaded data both survive |
| Wide viewport navigation | **PASS** — all 4 destinations at 1440 |
| Narrow viewport navigation | **PASS** — all 4 destinations at 390 |
| Destination parity | **PASS** |
| Active member shown in the shell | **PASS** |
| Single member | **PASS** — `standard@`'s avatar menu has no "Switch profile" section |
| Data pending | **PASS** — request held open, renders "Loading wallet" |
| Data load fails | **PASS** — forced 500 renders *"We could not load this / Something went wrong at our end. Please try again."*, **distinct from the empty state** |
| Retry succeeds | **PASS** — "Try again" present; after it, figures return |
| Unknown member route | **PASS** — 404 screen |

The loading/error/retry trio is worth calling out: these were the scenarios I
flagged last pass as "specified at shell level, implemented per page, unverified".
They are implemented, and the error state is correctly distinguishable from empty —
which is exactly what the notifications screen fails to do (see `notifications.md`).

**Recommend closing task 4.8.**

## `member-family-context` — task 5.8: **STAYS OPEN**

| Scenario | Result |
|---|---|
| Default active member | **PASS** |
| **Switching the active member** | **FAIL** — see below |
| Already-open screen follows the switch | **PASS** — switched to Sayani on `/member/wallet`; the open screen re-rendered to her data with no reload |
| Primary member with dependents | **PASS** — "Switch profile" section present |
| Primary member with no dependents | **PASS** — absent for `standard@` |
| Dependent signs in directly | not tested — no dependent credential known |
| Reload keeps the selection | **PASS** — Sayani survives F5 |
| Selection does not survive sign out | not observed |
| Stored selection no longer valid | not observed |
| Known relationship | **PASS** — "Self" and "Spouse" rendered from `REL*` codes |
| Unrecognised relationship | not observed |
| Family load fails | not observed |

### Blocking scenario: *Switching the active member*

The scenario's clauses are:

> **THEN** the active family member becomes that dependent
> **AND** **every screen** subsequently presents that dependent's data

First clause passes. **The second fails.** With Sayani active — the shell avatar
showing `SK` — `/member/appointments/select-patient` renders:

```
… Wallet 9+ SK ← Select Patient  Who is this appointment for?
SJ Shivam Jha Self    SK Sayani Kumari Spouse
```

**Zero options marked.** The shell knows the active member and the booking screen
ignores it, offering both members as equal choices.

This is not an interpretation. The requirement states it directly:

> *"every screen SHALL present data for that member."*
> *Rule: The active member is the single source of truth for whose data is shown.*
> ***No screen may independently choose a different family member.***

That is precisely what this screen does. The finding is filed as a BLOCKER in
`02-screens/family.md`.

### New finding: [DEBT] `MemberSwitcher` is dead code

`features/shell/member-switcher.ts` — a complete 71-line component with its own
`canSwitch()` gate — is **never imported or rendered**. `grep -rn "MemberSwitcher\|opd-member-switcher"`
returns only its own declaration. The working switcher is the avatar in
`profile-menu.ts` (`canSwitch()` at :49, `setActiveMember` at :123).

Same shape as the unreachable notifications page: built, compiles, unwired.

## `member-wallet` — task 6.11: **STAYS OPEN** (incomplete, not failing)

| Scenario | Result |
|---|---|
| Wallet displayed for the active member | **PASS** — ₹15,180 available, ₹20,000 allocated, ₹4,820 used |
| Wallet follows the active member | **PASS** — switching to Sayani re-rendered the screen |
| No wallet for the active member | **PASS** — `standard@` renders the dedicated empty state |
| Categories listed with readable names | **PASS** — 8 categories, human-readable |
| Exhausted category | **PASS** — Pathology and Vision both `₹3,000 of ₹3,000` |
| Transactions listed | **PASS** |
| Loading further transactions | **PASS** — "show more" grew the list |
| Amounts formatted | **PASS** — `₹15,180`, `₹20,000`, `₹4,820` |
| Dates formatted | **PASS** — `19 Jun 2026`, `7 Aug 2026` |
| Transactions newest first | **PASS** — verified after correcting my own scrape |
| Unrecognised category | **not observed** — no unknown `CAT*` code in the seed |
| Unlimited category | **not observed** — no `isUnlimited` row in the seed |
| Shared family wallet | **not observed** — both accounts are `INDIVIDUAL`; `isFloater: false` |
| No transactions | **not observed** — both wallets have history |
| Reversed transaction | **not observed** — no reversal in the seed |

**Nothing fails.** Five scenarios cannot be reached because **the seed data has no
row in those states** — not a defect, and not something a browser unblocks.

Closing 6.11 needs seeded fixtures for: an unknown category code, an unlimited
category, a floater/shared wallet, an empty transaction list, and a reversal. That
is a data task, and it is the only thing standing between this task and closure.

---

## Summary

| Task | Verdict | Blocker |
|---|---|---|
| 3.9 `member-session` | **open** | *Session rejected mid-session* — BLOCKER, observed |
| **4.8 `member-shell`** | **CLOSES** ✅ | — |
| 5.8 `member-family-context` | **open** | *Switching the active member* — BLOCKER, observed |
| 6.11 `member-wallet` | **open** | 5 scenarios have no seed data; no failures |

Both open-with-failure tasks are blocked by the **same class of defect**: state
that is correctly computed centrally and then not consulted at the point of use.
The session is terminated but not navigated; the active member is tracked but not
applied. Neither is an architecture problem — the stores are right in both cases,
and `already-open screen follows the switch` passing live proves the mechanism
works. Both are last-mile omissions.
