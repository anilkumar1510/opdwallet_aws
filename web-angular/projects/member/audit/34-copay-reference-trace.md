# 34 — Where a copay takes the member, in both reference apps

**Session 47, 2026-08-09.** A read of `web-member/` and `web-member-rn/` only. No
code, no harnesses. Written to answer one question: does the reference disclose an
outstanding amount on a screen Angular already has?

**Answer, in one line: it depends on the service, and the split is exactly the one
the copay decision turns on.** Dental and vision — yes, and Angular already does it
*more accurately than the reference*. Consultations — **no, neither app shows
anything**, and the only disclosure is on the payment screen the redirect goes to.

---

## The path, React (`web-member/`)

### 1. At confirm — the amount IS named, before anything is created

`components/PaymentProcessor.tsx:361-364`.

> **CORRECTED session 48.** This was written as "rendered inline on the confirm
> screen". It is rendered by the confirm *route*, but on a **second step**: the
> default `return` at `online-consult/confirm/page.tsx:616` shows only
> Consultation Fee / Platform Fee / Total and a **Proceed to Payment** CTA, and
> only then does `:527` — `if (showPaymentStep && selectedPatient &&
> !paymentProcessed)` — swap in `<PaymentProcessor>` at `:584`. So the member sees
> the breakdown **after** committing to proceed, not while reviewing. Part B has
> the consequence.

```
Your Copay ({validationResult.copayPercentage}%)   ₹…
```

Gated on `copayPercentage > 0 && copayAmount > 0`, or a service limit carrying a
copay. So the member sees the figure **before** committing.

### 2. The redirect — and it is keyed by service type

`PaymentProcessor.tsx:213-227` (and the same block again at `:270-284` for the
second branch):

```ts
const redirectUrl = serviceType === 'APPOINTMENT' ? '/member/bookings?tab=doctors'
  : serviceType === 'DENTAL'     ? '/member/bookings?tab=dental'
  : serviceType === 'VISION'     ? '/member/bookings?tab=vision'
  : serviceType === 'LAB'        ? '/member/bookings?tab=lab'
  : serviceType === 'DIAGNOSTIC' ? '/member/bookings?tab=diagnostic'
  : serviceType === 'AHC'        ? '/member/bookings?tab=ahc'
  : '/member/online-consult';
router.push(`/member/payments/${payment.paymentId}?redirect=${redirectUrl}`);
```

**The payment screen is the same for all seven; only the `redirect` differs.**

**Enclosing scope matters here.** This sits inside the copay branch of
`PaymentProcessor`'s validation handler — *"Case 2: Copay required with sufficient
wallet for coverage"* (`:175-181`). It is not a general navigation.

### 3. On the payment screen

`app/member/payments/[paymentId]/page.tsx`:

| What | Where |
|---|---|
| **"Amount to Pay" ₹X**, 4xl bold | `:600-604` |
| primary action, labelled **"Mark as Paid (Dummy Gateway)"** | `:629` |
| **a "Cancel" button that leaves without paying** — `router.push(redirectUrl)` | `:634-639` |
| default destination if no `redirect` param | `:23` — `'/member'` |

**Yes, the member can leave without paying**, and the Cancel button goes to the
same place a successful payment does.

**And this screen creates the booking.** `:146` dental, `:211` lab, `:268`
diagnostic, `:349` AHC, `:424` appointment — each logs "…created successfully"
*after* payment. This is the payment-first ordering parity register entry 5 rules
do-not-port, seen directly rather than inferred.

> **CORRECTED 2026-08-10.** An earlier version listed VISION among these. **It does
> not create.** `:151` — the vision booking already exists and the backend completes
> the payment; the branch only logs. RN is the same
> (`payments/[paymentId].tsx:448-463`, which resolves an existing booking id).
> **Five creating branches, not six.**

### 4. After payment succeeds

`:473` marks the payment completed, then `:479` `router.push(redirectUrl)` — the
bookings list, service tab. A success state renders first (`:517-527`, *"Amount
Paid: ₹X"*).

### 5. If they never pay — the bookings row

**This is the question that matters, and React answers it differently per service.**

**Dental / vision / lab / diagnostic / AHC — discloses.**
`app/member/bookings/page.tsx`:

- a **payment badge** beside the status badge, `:2016-2023`, text from
  `getPaymentStatusText` (`:683-696`): `PENDING → "Payment Pending"`,
  `COMPLETED → "Paid"`, `FAILED → "Payment Failed"`, `REFUNDED → "Refunded"`
- a **money breakdown**, `:2060-2074`, gated on `walletDebitAmount > 0`:
  *Wallet Deduction: ₹X* and, when `copayAmount > 0`, *Co-pay: ₹Y*

**Consultations — discloses nothing.** The doctors tab is `:1023-1292`. The only
money in those 270 lines is `₹{appointment.consultationFee}`, twice (`:1125`,
`:1272`) — the **gross fee**. No payment badge, no copay, no outstanding amount,
no marker of any kind. A paid consultation and an unpaid one render identically.

---

## The path, RN (`web-member-rn/`)

### Same disclosure split, one better badge

`app/member/bookings.tsx`:

- `getUnifiedBookingStatus(bookingStatus, paymentStatus)` at **`:1678-1701`** merges
  booking status and payment status into **one** badge — `PENDING → "Payment
  Pending"` (`:1691`, `:1700`). React renders two separate badges; RN renders one.
  A presentation improvement, not a data difference.
- the same wallet/copay breakdown, `:2010-2023`, gated the same way.

**And the same consultations blind spot, visible in the type.** The `Appointment`
interface (`:58-78`) declares `consultationFee` and **no `paymentStatus`, no
`copayAmount`, no `totalMemberPayment`**. `DentalBooking` (`:80-115`),
`VisionBooking` (`:117-154`) and `VaccinationBooking` (`:156-207`) all declare them.

### Payment screen

`app/member/payments/[paymentId].tsx`: default redirect
`'/member/bookings?tab=dental'` (`:268`) — React's default is `/member` (`:23`);
**auto-redirect on a countdown** (`:389-390`), which React does not do; a "View
Booking" control (`:788-789`). It creates the booking after payment, as React does.

---

## STOP CONDITION — React and RN disagree on the destination, for consultations only

| Service | React | RN |
|---|---|---|
| dental, vision, lab, diagnostic, AHC | `/member/bookings?tab=<service>` | `/member/bookings?tab=<service>` (`:729-741`) |
| **in-clinic consultation** | `/member/bookings?tab=doctors` (`PaymentProcessor.tsx:214`) | **`/member/in-clinic-consultation`** (`payments/[paymentId].tsx:723-725`) |
| **online consultation** | `/member/bookings?tab=doctors` | **`/member/online-consultation`** (`:726-727`) |

RN sends a member who has just paid for a consultation back to the **consultation
hub**, not to their bookings. React sends them to the bookings list.

## CORRECTED 2026-08-10 — React and RN are NOT equivalent on orphan risk

This file has treated the two as interchangeable on the payment-first path. Reading
both `handleMarkAsPaid` implementations in full shows they are not, and the
difference is where the orphaned payments actually come from.

| Failure | React | RN |
|---|---|---|
| **no stash in storage** | logs three warnings — *"Payment will be marked as paid without creating appointment"* — and **marks it paid anyway** (`payments/[paymentId]/page.tsx:449-453`) | **throws** *"Booking data not found. Please try booking again."* (`payments/[paymentId].tsx:408-411`) |
| **stash belongs to another payment** | **no check** | **throws** on `bookingData.paymentId !== paymentId` (`:416-422`) |

**So the thirteen orphaned payments are a React-specific consequence**, not an
inherent property of payment-first. Any session-storage loss between the two
screens — refresh, new tab, timeout, returning to the URL later — orphans a payment
in React and raises an error in RN.

**This does not weaken session 50's ruling**, and the reason is worth stating:
booking-first *avoids* the failure class; RN *guards* against it, and RN's mismatch
check exists precisely because payment-first makes a mismatch possible at all. But
this file had been arguing against both references on evidence that convicts one.

RN also passes `existingPaymentId` on both appointment payloads (`:483`, `:621`),
linking payment to booking explicitly where React sends only
`paymentAlreadyProcessed`; stashes from **eight** journeys to React's three; and
carries a full **vaccination** branch (`:635+`) — the only implementation of that
flow's payment leg, now that vaccination is ruled in.

**This does not change the answer below** — neither destination discloses an
outstanding amount for consultations — but it means there is no single "what the
reference does" for that step, and anyone implementing a redirect must choose.
Reported rather than merged, per the standing rule.

---

## Which of (a) / (b) / (c) is true

**Neither cleanly. It splits by service, and the split is the finding.**

### Dental and vision → **(a)**, and Angular is already ahead

React discloses on the bookings row, which Angular already has and already uses.
**No decision is needed for these two.** Session 41's disclosure was matching the
reference without knowing it.

**And Angular's version is more accurate.** React's row renders `copayAmount`;
Angular's renders `totalMemberPayment`. On the live test booking those are
**₹200 and ₹600** — `copayAmount: 200`, `excessAmount: 400`,
`totalMemberPayment: 600`. **React's row understates what the member owes by the
excess.** Filed below as a reference defect; do not port it.

### Consultations → **(b)**

React shows the copay at confirm (`PaymentProcessor.tsx:364`) and on the payment
screen (`:604`), and **nothing afterwards, anywhere**. RN is identical. So for
consultations the disclosure is genuinely **inseparable from the redirect** — the
only screens that ever name the amount are the two the member passes through on
the way to paying.

**The flow-change decision stands, and it stands only for consultations.**

### What this settles about finding 13

**Finding 13 is confirmed as an API problem, from three independent directions:**

1. the API returns only `consultationFee` on `GET appointments/user/:id` (27 of 27
   rows, measured in session 44);
2. React's doctors tab renders only `consultationFee`;
3. RN's `Appointment` interface does not even declare the payment fields.

**No reference app is getting this data from somewhere Angular is missing.** The
question "find where React gets it" has an answer: it does not get it. Angular's
inability to disclose a consultation copay is inherited, not self-inflicted.

---

## Reference defects found in passing — do not port

1. **React's bookings row understates the amount owed.** It renders `copayAmount`
   and omits `excessAmount`, so a booking owing ₹600 displays "Co-pay: ₹200"
   (`bookings/page.tsx:2068-2072`). Angular's `totalMemberPayment` is correct.
2. **The breakdown is gated on `walletDebitAmount > 0`** (`:2060`). A booking the
   wallet covered nothing of — full out-of-pocket — shows **no** money breakdown at
   all, only the badge. Angular's gate is `paymentStatus === 'PENDING' &&
   totalMemberPayment > 0`, which does not have this hole.
3. **The copay line renders regardless of payment status.** "Co-pay: ₹200" shows
   whether or not it has been settled; only the badge distinguishes them. Angular
   shows the amount *only when outstanding*, which is why it reads "still to pay".

---

# Part B — the payment screen, observed (session 48)

Previously read from code; now seen running at
`localhost:3002/member/payments/PAY-20260809-0219?redirect=%2Fmember%2Fonline-consult`.

**What is on it:** a Payment Details block (Payment ID, Type: Co-payment, Service:
APPOINTMENT, description *"Copay for Online consultation with Dr Ramkrishan"*),
**Amount to Pay — ₹500.00**, a **Mark as Paid (Dummy Gateway)** button with
**Cancel** directly beneath it, and a note that the dummy gateway stands in for
Razorpay/Stripe in production.

Three things that matter for the ruling:

**1. Cancel sits next to Pay.** Sending the member here guarantees they are
**told** ₹500 is owed. It does **not** guarantee anything is collected. This was
cited from code in session 47 (`payments/[paymentId]/page.tsx:634-639`); it is now
observed. Whoever rules the redirect should read option 1 as *"the member finds
out"*, not *"the copay gets settled"*.

**2. It is a real, functional screen, not a stub.** If Angular sends members here,
the destination works.

**3. The `redirect` param is NOT a third destination — Cancel and success share it.**
The URL carries `redirect=/member/online-consult`, while session 47 recorded
React's success path going to `/member/bookings?tab=doctors`
(`PaymentProcessor.tsx:214`).

Reading the enclosing scopes settles it: the param is **read once** into
`redirectUrl` (`payments/[paymentId]/page.tsx:23`,
`searchParams.get('redirect') || '/member'`) and **both** exits use that same
variable — success at `:479` (`router.push(redirectUrl)`) and Cancel at `:634-639`
(`router.push(redirectUrl)`).

> **So cancel and success reach the same place, and the param decides where.**
> They do not differ.

`PaymentProcessor.tsx:213-227` is what *sets* the param, and its `APPOINTMENT`
branch sets `/member/bookings?tab=doctors`. The observed
`/member/online-consult` came from the **ONLINE_CONSULTATION** service type, which
falls through that chain to its final `: '/member/online-consult'` — the else
branch, not a separate rule.

**This simplifies the pending decision.** There is no cancel-vs-success fork to
choose between. What remains is the one already recorded: React sends a paid
consultation to the bookings list or the online-consult hub depending on service
type, and **RN sends it to the consultation hub**
(`payments/[paymentId].tsx:723-727`). Two candidates, not three.

**Nothing here was built.** The redirect remains an open decision and a flow
change.

---

# Angular's confirm now matches the reference (session 48)

The consultation confirm screen renders the reference's full breakdown — same
lines, same order, same gating — verified against three cases in
`03-live/verify-confirm-breakdown.mjs` (**17/17**, non-mutating, no booking run
spent). Rendered:

```
Consultation fee ₹800 · Wallet balance ₹11,508 · Your copay (20%) − ₹160 ·
Insurance eligible amount ₹640 · Service transaction limit applied Max ₹300 ·
Additional out-of-pocket − ₹340 · Paid from your wallet ₹300 · You pay total ₹500
Note: this service has a transaction limit of ₹300. After applying your 20% copay
(₹160), your wallet can cover a maximum of ₹300. You pay the remaining ₹340 out of
pocket.
```

### Where React puts this — and the two modes differ

> **CORRECTED 2026-08-10.** This section originally said *"React does not show this
> on its confirm screen"* and treated the in-clinic branch as needing nothing
> separate. **The first claim is true only of online consultations; the second was
> reasoning from a shared component to a shared structure, which does not follow.**

**Online consultations — two steps.** `online-consult/confirm/page.tsx` renders only
*Consultation Fee / Platform Fee / Total Amount* and a **Proceed to Payment** CTA on
its default path (`:854-871`, under the `return` at `:616`). The breakdown is a
**second step of the same route**, gated at `:527` —
`if (showPaymentStep && selectedPatient && !paymentProcessed)` — rendering
`<PaymentProcessor>` at `:584`. The member sees the working **after** committing to
proceed.

**In-clinic appointments — one step.** `appointments/confirm/page.tsx:308-331`
renders `<PaymentProcessor>` **inline**, gated only on
`!loadingUser && userId && patientId`. No `showPaymentStep`, no CTA, no swap. The
breakdown is on screen from load.

**So the reference is inconsistent with itself**, and Angular's single-screen
breakdown matches its in-clinic structure exactly while disclosing earlier than its
online one. Only the online difference is a divergence — register entry 16, narrowed
accordingly.

**The error and how it was made**, kept because it is the more useful part: both
pages import and render the same `PaymentProcessor`. That was checked, and treated
as showing the screens matched. It shows only that the component is shared — *where
a page renders it* is a property of the page, and neither page's render structure
was read. A citation must carry its enclosing scope; a shared import is not one.

### One label deliberately differs — "Paid from your wallet", not "Insurance Pays"

React labels this line **Insurance Pays**. Angular says **Paid from your wallet**.
Chosen, not defaulted:

1. **The number is the wallet debit.** Angular's mapper is
   `fromWallet: money(breakdown.walletDebitAmount ?? breakdown.insurancePayment)`
   (`core/domain/cover-check.ts`) — it prefers `walletDebitAmount`. The API returns
   both fields; the one rendered is the debit.
2. **It is the member's own money.** The ₹300 leaves their OPD wallet, whose
   balance they watch on the wallet screen. *"Insurance Pays ₹300"* implies a third
   party paid and their balance is untouched — the opposite of what happened.
3. **Every other Angular screen says wallet** — the wallet screen, the bookings row
   (*"₹400 from wallet"*). One screen saying "insurance" would be the internal
   inconsistency this audit has repeatedly flagged.

**This is a sanctioned label divergence and warrants a parity register entry.**
`../../../tools/parity-divergences.md` was outside this session's writable set, so
it is recorded here for whoever adds it.

### One line of the reference was NOT reproduced

React's **Payment Method: Insurance + Copay** badge is not rendered.
`getPaymentMethodDisplay(validationResult.paymentMethod)`
(`PaymentProcessor.tsx:329`) reads `paymentMethod` from React's **own client-side
validator** (`lib/paymentValidator`), not from the API —
`appointments/validate-booking` does not return that field. Reproducing it would
mean writing a second payment calculator in Angular, which is changing arithmetic
rather than display, and the brief's instruction there is to stop.

### Two reference defects still not ported

- React's breakdown is gated on `walletDebitAmount > 0` (`:353`), so a fully
  out-of-pocket booking shows **no money at all**. Angular's renders — verified as
  case 3.
- React's **bookings row** renders `copayAmount` and omits `excessAmount`, showing
  ₹200 for a ₹500 debt. **Angular's bookings row was not touched** and remains
  correct.

So Angular's confirm now matches the reference, and its bookings row remains ahead
of it.

---

# The Platform Fee, settled (session 49)

Session 48 declined to reproduce React's **Platform Fee** line and left open
whether it is *absent* or *zero*. Both totals came to ₹500, which was consistent
with either.

**It is a hardcoded zero, in both reference apps, and it is not in either total.**

```
web-member/app/member/online-consult/confirm/page.tsx:860-862
    <span>Platform Fee</span>
    <span>₹0</span>            <- a string literal in JSX, not a variable

web-member-rn/app/member/online-consultation/confirm.tsx:1190-1192
    <Text>Platform Fee</Text>
    <Text>₹0</Text>            <- the same literal
```

And in both, **Total Amount is `₹{consultationFee}`** (`:866-869` and `:1197-1200`)
— the fee is not summed into it. Even structurally it contributes nothing.

**Nothing computes it and nothing returns it:**

| Search | Result |
|---|---|
| `platformFee` / `platform_fee` across `web-member/` app, components, lib | **the label at `:861` only** — no variable, no calculation |
| `platformFee` / `convenienceFee` / `serviceCharge` across all of `api/src/**` | **none** |
| any fee-like field in the appointments validate breakdown | **none** — `billAmount`, `copayAmount`, `copayPercentage`, `insuranceEligibleAmount`, `serviceTransactionLimit`, `insurancePayment`, `excessAmount`, `totalMemberPayment`, `walletBalance`, `walletDebitAmount` |

## Conclusion — closed, no gap

**It cannot be non-zero for a member.** There is no code path that would make it
so, in either app or in the API. Angular's total is not missing a component;
there is no component. The stop condition for this session — *"the Platform Fee
can be non-zero and is not returned by the API"* — **does not apply.**

## And session 49's brief mis-attributed the reason

The brief said React "derives it from its own client-side validator, not the API,
and reproducing it means writing a second calculator". **That was true of the
*Payment Method* badge**, which is session 48's finding
(`getPaymentMethodDisplay(validationResult.paymentMethod)`,
`PaymentProcessor.tsx:329`, fed by `lib/paymentValidator`). It is **not** true of
Platform Fee, which needs no calculator at all — it is a literal.

So there were two reasons not to port, and they are different:

| Line | Why not ported |
|---|---|
| **Payment Method** | derived from a client-side calculator the API does not back — reproducing it is arithmetic |
| **Platform Fee** | a hardcoded ₹0 excluded from the total — reproducing it adds a row that can only ever say nothing |

**A third reason applies to Platform Fee alone, and it is the cleanest:** it lives
on React's **step-1 summary card**, the *Consultation Fee / Platform Fee / Total*
block that Angular's confirm effectively supersedes by showing the full breakdown
in its place. It is not part of the `PaymentProcessor` line set Angular matched —
that set has no Platform Fee row at all. Porting it would mean importing a row
from a card Angular does not have, to display a constant.

**Closed. Not filed for the API owner**, because there is nothing for them to
return.
