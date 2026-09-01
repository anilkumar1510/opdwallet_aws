# wallet

- React:   `web-member/app/member/wallet/page.tsx` → `/member/wallet` · `app/member/transactions/page.tsx` (the wallet ledger)
- RN:      `web-member-rn/app/member/wallet.tsx` → `/member/wallet`
- Angular: `features/wallet/wallet-page.ts` → `/member/wallet` (balance **and** ledger on one screen)
- Spec:    `member-wallet`
- Status:  **PARITY** — with one stale task and one orphan

## API integration

| Verb + path | Params | React | RN | Angular | Notes |
|---|---|---|---|---|---|
| `GET /api/wallet/balance` | `userId` for the active member | ✅ | ✅ | ✅ | **carries no policy period** — confirmed live and by fixture |
| `GET /api/wallet/transactions` | `limit` (no offset) | ✅ | ✅ | ✅ | `PAGE_SIZE = 15` |
| `GET /api/member/profile` | — | ✅ | ✅ | ✅ | supplies `assignments[]` → the policy period |
| `GET /api/assignments/my-policy` | — | ❌ | ❌ | declared, **no caller** | new orphan; see finding |
| `POST /api/wallet/update` | — | ✅ `lib/transactions.ts` | ? | ❌ | in the 16 React-calls-Angular-doesn't list |

## Task 6.4 — resolved in code already; reporting evidence, not choosing

The open task reads: *"the policy period is NOT [done], because `GET /wallet/balance`
does not return `effectiveFrom`/`effectiveTo`. Source it from `GET /member/profile`
assignments, or amend `specs/member-wallet/spec.md` to drop the requirement."*

**Both halves of the premise are confirmed, and the first option is already
implemented.** The task is stale, not outstanding.

### Evidence 1 — `wallet/balance` carries no period

Live, `standard@gmail.com`:
```json
{"totalBalance":{"allocated":0,"current":0,"consumed":0},"categories":[],
 "isFloater":false,"memberConsumption":[],"config":null}
```
Captured fixture, `shivam@gmail.com` (cover in force):
```json
{"totalBalance":{"allocated":20000,"current":15480,"consumed":4520,
  "_id":"…","lastUpdated":"2026-08-05T05:36:20.042Z"}, "categories":[…]}
```
Neither shape contains `effectiveFrom` or `effectiveTo`, at any nesting level.

### Evidence 2 — the period **is** available, and there are two of them

`assignments-my-policy.json` (real captured response, account `shivam`):

| Field | Value |
|---|---|
| `policyId.effectiveFrom` / `.effectiveTo` | 2026-06-18 → **2027-06-30** |
| top-level `effectiveFrom` / `effectiveTo` | 2026-06-19 → **2027-06-16** |

**These are different windows.** The policy runs longer than this member's
assignment to it. So "the policy period" is ambiguous unless the answer names
which one, and the member-facing answer is the assignment — the window in which
*this member* is actually covered.

### Evidence 3 — Angular already sources it, and already picks correctly

`core/member/policy.ts:31-33`:
```ts
// The assignment period wins over the policy period: a member can be
// assigned for a shorter window than the policy itself runs.
validFrom: toDate(inner?.effectiveFrom ?? policy?.effectiveFrom),
validTill: toDate(inner?.effectiveTo ?? policy?.effectiveTo),
```
`features/wallet/wallet-page.ts:33-36,172-182` renders it as
`Cover <from> – <till>` from the active member's policy, with an inline comment
naming the reason: *"/wallet/balance carries no policy period, so it comes from
the …"*.

**Conclusion to report:** the work described in task 6.4 exists, takes the
assignment period over the policy period, and matches the shape of the real
response. What remains is a **verification** step, not an implementation choice —
and it cannot be verified with `standard@gmail.com`, whose `assignments[0]` is
`{userId, memberId, memberName, assignment: null}`. It needs `shivam@gmail.com`.
The decision itself is not mine to make and does not need making.

## Findings

### [DEBT] `assignments/my-policy` declared, never called

`core/member/member.mapper.ts:21` declares `myPolicy: 'assignments/my-policy'`.
Nothing calls it — the period comes from `member/profile` instead. Third orphan
in the codebase after the two `vendorPricing` entries.

### [NOTE] Phase 1 under-counted: my prefix filter omitted `assignments`

`01-endpoint-diff.md` filtered member-reachable routes by prefix and the list did
not include `assignments`. The API serves 7 `assignments/*` routes, one of which
(`assignments/my-policy`) Angular declares. So the Phase 1 totals are a **floor,
not a ceiling** — corrected in the method note there. This does not change any
finding; it adds one orphan.

### [NOTE] `/member/transactions` renders the wallet screen's sibling, not React's ledger

Recorded divergence #2 in `../../../../tools/parity-divergences.md`. React splits the wallet
ledger (`/member/transactions`) from the order list (`/member/orders`); Angular
puts the ledger on `/member/wallet` and points both other routes at
`TransactionsPage`. Intentional, documented, not re-filed.

## Flows

| Flow | Angular |
|---|---|
| Load balance | effect on `family.activeMember()` — no call-site wiring |
| Switch family member | effect refires; `loadedFor` guard stops a repeat switch refetching |
| Transaction history | newest first; reversed rows marked |
| "Show more" | widens `limit` and **replaces** the list — the API takes `limit` but no offset, which is what stops rows repeating (task 6.9, done) |
| No wallet for period | `isEmpty` → "There is no active benefit wallet for the current policy period." |

## State

`WalletStore` is the design's showcase: the `FamilyStore` dependency is an
`effect()`, so an open wallet screen follows a family switch with no event
wiring — the mechanism `design.md` promises and the `member-family-context`
scenario "already-open screen follows the switch" depends on.

`loadedFor` prevents a redundant refetch when the effect refires for the same
member. Correct, and the kind of thing that is easy to omit.

## Non-happy paths

| Path | Angular | Verified |
|---|---|---|
| No wallet for the period | dedicated empty state, no balance figures | **live** — `standard@gmail.com` returns zeros and empty `categories`; this is exactly the state that renders it |
| Balance load fails | `AppError` in `_error`, screen renders error state | not verified |
| Empty transaction list | empty state | not verified |
| Reversed transaction | row marked | not verified — needs data with a reversal |
| Family switch mid-load | `loadedFor` + effect; last write wins | not verified |

## Guards / permissions

Parent `authGuard`. Family-scoped through `activeMember()` — correct, and the
reason a dependent cannot see the primary's balance.

## Navigation edges

- In: shell destination "Wallet" (one of 4 primary), home screen card
- Out: transaction rows → `/member/orders/:transactionId`; policy card → `/member/policy-details/:policyId`
- The active-appointment nudge would render above this screen in React. Absent — see `shell-nav.md`.

## Spec scenarios

`member-wallet`'s scenarios are covered structurally. One is now **verified live**
(no wallet for the current period). The rest need `shivam@gmail.com`, which has
cover in force — task 6.11.

---

## CORRECTED 2026-08-10 (session 53) — React's wallet screen IS the ledger

Found by the user clicking Wallet in the running React app and seeing transaction
history. This file and register entry 2 both implied React keeps the ledger at
`/member/transactions` and Angular relocated it to the wallet screen.

**React's `/member/wallet` shows the ledger by default:**

- `app/member/wallet/page.tsx:111` — `const [activeTab, setActiveTab] =
  useState<'transactions' | 'categories'>('transactions')`
- `:399-404` — fetches `wallet/balance` and `wallet/transactions` in parallel on
  load
- `:492` — `<h1>My Wallet</h1>`
- imports `FilterPopup` from `../transactions/FilterPopup` — the two screens share
  filtering

So the member's route to their ledger is **the same in both apps**: click Wallet.
The ledger never moved.

### What actually differs

**1. Same URL, different resource.** `/member/transactions` is the wallet ledger in
React and the service-order list in Angular. A bookmark or deep link resolves to
different content depending on the app. This is the substantive divergence and it
was not recorded anywhere; register entry 2 now carries it.

**2. Navigation model on the wallet screen.**

| | React | Angular |
|---|---|---|
| Heading | *My Wallet* | *Wallet* |
| Structure | **two tabs** — *Transactions* \| *Categories* | **one scrolling page** |
| Sections | — | *Used by each member* · *Benefits* · *Activity* |

Same content, reached differently: React hides half of it behind a tab, Angular
requires scrolling. Neither is obviously better and neither is filed as a defect,
but the **section labels are renamed** — *Categories* → *Benefits*,
*Transactions* → *Activity* — which is a real terminology divergence that no entry
covers.

### Method note

This is the third correction in two days from the same cause: a claim about the
reference made without opening the reference's screen. The previous two were the
confirm-screen structure and the VISION create branch. **All three were found by
someone looking at the running app, not by reading code**, which is worth weighing
against how much of this audit is code-read.
