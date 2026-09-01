# 38 — The wallet ledger: the summary, the running balance, and a way back

**2026-08-11, session 54.** Found by the user clicking the home balance card and
asking why Angular's destination was not what the reference opens.

## What the card actually does in each app

| | React | Angular |
|---|---|---|
| Card is a link | ✔ `<Link href="/member/transactions">`, whole card | ✔ `routerLink="/member/wallet"`, whole card |
| Destination | **Transaction History** — a dedicated screen | **Wallet** — balance, benefits, activity |
| Ledger rows | ✔ | ✔ |
| Credits / Debits / Net change | ✔ | **absent** |
| Running balance per row | ✔ `Bal: ₹10,308` | **absent** |
| Analytics overview | ✔ recharts | **absent** |
| Back control | ✔ `router.back()` | **absent** |

**The link was never broken.** Both cards navigate, on both viewports, and
Angular's destination carries the same rows from the same endpoint. What was
missing was content on the page the card opens.

**React has three wallet-ish screens; Angular has two.** React: `/member/wallet`
(*My Wallet*, tabs Transactions|Categories), `/member/transactions`
(*Transaction History*, the summary screen), `/member/orders`. Angular folded the
first into one scrolling page and gave `/member/transactions` to service orders —
parity register entry 2.

## A labelling error worth recording

I first offered building a Transaction History screen as *"a flow change"*, beside
adding the figures. **The user pushed back and was right.** Matching a screen the
reference already has, reached by a control that already exists and already
navigates, is the migration doing its job — the same category as the invoice
download. The convention exists to stop *inventing* destinations, not to stop
*porting* them.

What is genuinely in the way is narrower and is **routing, not flow**: Angular's
`/member/transactions` is occupied by service orders, so a history screen needs a
different path or entry 2 revisited. That question is still open. It did not
block the fix below, which needed no new route at all.

## Fixed

**Credits, debits and net change**, computed over the member's **whole** history.
Not over the rows on screen: the ledger pages 15 at a time, so page-derived
figures would be wrong on arrival and would **change on every "Show more"**. A
summary that moves while the data underneath it does not is worse than no
summary. `GET /wallet/transactions` has no aggregate and its `total` field is only
the returned count, so the figures come from one wide read (`TOTALS_WINDOW`), as
the reference does at `limit=100`.

**The running balance.** `newBalance.total` was in the payload all along and
simply never mapped. It is taken from the API rather than derived by subtraction,
because a reversed or out-of-order row would make a derived figure disagree with
the API's own. It matters more than it looks: this member has three identical
₹300 debits on one day, and without it they cannot be told apart or reconciled.

**A back control**, using `Location.back()` rather than a fixed parent route — the
ledger is reached from the balance card, the bottom nav and deep links, and
hardcoding one parent would be wrong for two of them.

## Reported as missing, but was not

**"Load more feature missing."** It is present, visible and working: `hasMore` is
true at 15 of 70 rows, and clicking takes the list 15 → 30. Measured before
building anything. Recorded because a fix for a working feature is pure risk.

## Not ported

**The Analytics Overview.** React renders `recharts` bar charts — transaction
volume by type, 7-day trend. Angular has no charting dependency, and adding one
for two charts was not a call to make unasked. The numbers those charts summarise
are now all on the page.

## Verification

`03-live/verify-wallet-summary.mjs` — **13/13**, non-mutating.

The figures are asserted against **the reference's own output for the same
member** — credits ₹5,100, debits ₹14,792, net −₹9,692 — not against "three
numbers rendered", which would pass on three zeroes.

The assertion that carries the design: **the totals do not move when the member
pages.** 15 → 30 rows, figures unchanged. That is the one that would have caught
the obvious wrong build, which is computing them from the loaded list.

Also covered: exactly one balance card is visible to click · the card opens the
ledger · the count states 70 while 15 rows show · every row carries its balance,
including newly paged ones · back returns to `/member`.

## Still open

**Whether Angular should have a separate Transaction History screen.** It collides
with entry 2's decision to put service orders on `/member/transactions`. Routing
question, unresolved, not blocking.

---

# PART TWO — the back control was not a wallet problem, it was a shell-wide one

The report *"back option also missing"* came a second time after the wallet was
fixed. That was the signal that I had scoped it to the screen I was staring at
rather than measuring the pattern.

**Measured across 23 nav-reachable screens:** eight had no way back but the
browser control — `/member/bookings`, `/member/claims`, `/member/transactions`,
`/member/orders`, `/member/health-records`, `/member/profile`, `/member/family`,
`/member/health-checkup`. **The reference has a back control on 21 pages.**

**Why source grep was the wrong instrument.** My first sweep looked for
`location.back()` and a `←` glyph and reported 39 pages missing. That was wrong:
the journey screens implement back as `[routerLink]="backLink()"` with an inline
SVG and no literal arrow, so they matched nothing. Grepping for an
*implementation* found pages that lacked that implementation, not pages that
lacked the *affordance*. Re-measured at runtime by looking for a control with a
back `aria-label` or a chevron path — 8, not 39.

**Fixed** with one shared `opd-back-link` (`shared/ui/back-link.ts`) added to the
seven components behind those eight routes (`/member/transactions` and
`/member/orders` share one). The wallet's inline copy from part one was replaced
by it rather than left as a duplicate.

`Location.back()`, not a fixed parent: these screens have several entry points
each — the ledger alone is reached from the home balance card, the bottom nav and
deep links.

**Journey screens were deliberately left alone.** AHC, lab and clinic booking
point back at the *previous step* via `routerLink`, which is right for a wizard
and wrong for history. This component is for destinations, not steps.

**Verified at runtime across all 23 routes: `still missing: NONE`, `duplicated:
NONE`**, and the control navigates (`/member/claims` → `/member`). The
duplicate check is the one that matters — inserting a second arrow on a page that
already had one is the obvious way this change could have gone wrong.

## "Load more feature missing" — measured twice, and it is not

| Screen | Rows shown | Show more | Rows available |
|---|---|---|---|
| `/member/transactions` | 24 | **present** | 50 |
| `/member/wallet` | 15 → 30 | **present** | 70 |
| `/member/bookings` | 65 | not needed | 65 rendered |
| `/member/claims` | 12 | not needed | 12 rendered |
| `/member/health-records` | 0 | not needed | empty |

**No list truncates silently.** Where paging exists the control is present and
works; where it does not, every row is on screen. **The reference has no
load-more anywhere** — it fetches at `limit=100` and stops.

Recorded because it was reported twice and built zero times: a fix applied to a
working feature is pure risk, and the only way to know which it was, was to
measure.

---

# PART THREE — the card's destination, ruled

*"when we click on wallet balance box it should open transaction history not
wallet."* The open routing question from part one, decided.

**Angular now routes as the reference does.** `/member/transactions` is the
wallet ledger; `/member/orders` is the service-order list. **Parity register
entry 2 is resolved**, in the reference's favour.

| | Before | After |
|---|---|---|
| Balance card opens | `/member/wallet` | `/member/transactions` |
| `/member/transactions` | service orders | **Transaction history** |
| `/member/orders` | service orders | service orders |
| Order list titled | "Transaction History" | **"Order History"** (as the reference) |

**The swap was already producing a false claim**, independently of the card: the
home quicklink is *labelled* "Transaction History" and opened the service-order
list. A tile naming a screen that did not exist — the same defect class as the
invoice label and the empty Health checkup tab.

**Two screens were briefly called "Transaction History"** — the new one and the
order list, which still carried the old title. Caught by reading the orders page
after rerouting, not by a test. Renamed to "Order History", matching
`orders/page.tsx:140`.

**The ledger is one component, not two copies.** `wallet-ledger.ts` holds the
summary, rows and paging, and is rendered by both `/member/wallet` and
`/member/transactions`. Ninety lines of money rendering duplicated across two
screens is how they drift.

Detail back links moved with the content: payment and transaction detail now
return to `/member/orders`, which is where their rows live.

**Verified on both viewports**: the card lands on `/member/transactions`, the
heading reads "Transaction history", the summary shows ₹5,100 / ₹14,792 /
−₹9,692, 15 rows each with a running balance, Show more present, back present.
`/member/orders` still lists service orders.

---

# PART FOUR — cancel is one click

*"just cancel dont show keep it and y are u cancelling box just cancel once u
click on cancel."*

Both cancel paths on `/member/bookings` were two-step. Now neither is:

- **Booking cancel** — the "Cancel this booking? / Yes, cancel / Keep it" panel is
  gone. One click cancels.
- **Prescription cancel** — the "Why are you cancelling?" textarea and its
  10-character counter are gone. One click cancels.

**The API still requires a reason of 10-500 characters**
(`CancelLabPrescriptionDto`), so the portal sends a fixed one:
*"Cancelled by the member from the portal."* It is deliberately neutral and
says where it came from — **ops reads this field**, and inventing a motive the
member never gave would be worse than recording plainly that none was collected.

**Verified:** no confirmation copy on screen, zero textareas, and one click takes
the cancellable count 5 → 4 with the POST carrying the fixed reason.

The lab and diagnostics specs were rewritten rather than left standing — they
still described the reason box and a "reason too short" scenario that can no
longer occur. A spec that describes a removed control is the stale-contradiction
shape corrected in `member-dental/spec.md` earlier this week.

---

# PART FIVE — back went to history, and history is not a parent

*"when u press back button its looping between both pages but not redirecting to
home page."*

**Reproduced, and the diagnosis is that I chose the wrong primitive.** The shared
control called `Location.back()`. A member who had moved between the wallet and
the transaction history — two screens both reachable from the bottom nav — filled
their history with alternating entries, and back walked back through them one at
a time. It looks like the two screens are looping and home is unreachable.

**That is not a bug in `history.back()`. It is `history.back()` working**, applied
to screens that are destinations rather than steps. A destination has one sensible
parent; history has as many as the member made.

**Fixed:** `opd-back-link` is now a `routerLink` to a fixed parent, `/member` by
default, with a `to` input for screens that belong elsewhere. Deterministic — it
cannot loop, because it does not consult history at all.

**Verified:** from a deliberately alternated wallet/transactions history, back
lands on `/member`; and from all nine patched screens, back lands on `/member`.

The journey screens still point at the previous **step** via their own
`routerLink`, which was right all along and is untouched.

---

# PART SIX — the nudge is removed

The active-appointment banner built in session 53 is **gone, at the member's
request**: as a fixed element above the bottom navigation it covered the Health
Benefits cards on the home screen.

Removed: the shell mount, `active-appointment-nudge.ts`, `ongoing.store.ts`, and
the `BOOKINGS_API.ongoingByUser` declaration — so the dead-endpoint scan stays at
**0** rather than carrying a permanently uncalled key.

**Recorded as a DECLINED PORT, not an oversight**, in `member-consultations/spec.md`
and in the removal comment. This matters because the endpoint appears React-only
on all 30 routes in `35-api-integration-parity.md`, and without the record the
next sweep would file it as a missing feature and someone would build it again.
`37-fix-all-apis.md` keeps the behaviour, both destinations and the bare-array
response shape, so rebuilding is cheap if it is ever wanted.

**Verified gone** on mobile and desktop: no component, no banner text, and zero
`/ongoing` requests.

## A note on the session's shape

Six of this session's changes came from the member using the running app, not
from any detector: the missing summary, the missing back control, the back loop,
the two-step cancel, the card's destination, and the nudge being unwanted. The
detectors were green throughout. **Everything they check, they checked correctly
— and none of them can see a banner covering a card, or a back button that
retraces.**

---

# PART SEVEN — the harness pinned money, and money moved

Re-running the wallet harness after the back fix reported two failures that were
not defects: *total debits ₹15,172, expected ₹14,792*.

**Nothing was broken. The member used the app.** The wallet moved ₹380 between
capturing the reference figures from React's screen and re-running — visible in
the member's own screenshot, where available balance reads ₹9,928 against the
₹10,308 the harness was pinned to.

**The harness was wrong, twice over.** It hardcoded money that the member can
change, and `verify-dental.mjs` already carries exactly this rule:

> *assert against the amount the API actually recorded, not a literal — the copay
> follows the service price and a hardcoded figure would rot.*

This file had to learn it independently a week later. **A lesson recorded in one
harness is not a lesson the next harness inherits** — nothing carries it across
but the person writing the next one.

**Fixed:** the expected credits, debits and net are now computed at run time from
`GET /wallet/transactions?limit=500` and compared against what the screen renders.
That is also the stronger assertion: a literal only ever proved the screen matched
one past moment, whereas this proves the screen agrees with the data it is
rendering — which is the actual claim.

A positive control was added so the computation cannot silently expect zero from
an empty response.

**15/15.**
