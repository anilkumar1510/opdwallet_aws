# AHC commit contract — read before building

`AHC_API.orders` (`core/ahc/ahc.ts:20`) has never had a caller, so nobody had
established what it accepts. Read-only inspection of
`api/src/modules/ahc/controllers/ahc-member.controller.ts` and
`dto/create-ahc-order.dto.ts`.

## Verdict: **booking-first is supported. AHC is buildable, and not blocked on the API owner.**

## 1. Does it accept order creation before payment? Yes

`CreateAhcOrderDto` requires **no payment reference**.

> **CORRECTION 2026-08-08 — my original reading of this DTO was wrong.**
> I wrote that its required fields are "member contact details (`fullName`,
> `phone`, `pincode`, `city`, `state`) and `packageId`". Those five belong to a
> **different class in the same file**, `CollectionAddressDto`, reached through the
> optional `labCollectionAddress`. I grepped field names across the file and
> attributed them all to the top-level DTO.
>
> **`CreateAhcOrderDto` requires only `packageId`.** Everything else is
> `@IsOptional()`. Sending the five flat is rejected — the API whitelists:
> *"property fullName should not exist, property phone should not exist, …"*.
> `CollectionAddressDto` additionally requires **`addressLine1`**, which nothing in
> the audit had noticed.
>
> This is what cost session 27 and 28: two payload adjustments and a session's
> verification, all downstream of one mis-read class boundary. **Reading field
> names is not reading a schema.**

The correct shape, confirmed by a `201` from `curl`:

```json
{
  "packageId": "AHC-PKG-…",
  "labVendorId": "VENDOR-002",
  "labCollectionDate": "2026-08-10",
  "labCollectionAddress": {
    "fullName": "…", "phone": "…", "addressLine1": "…",
    "pincode": "201301", "city": "Noida", "state": "UP"
  },
  "diagnosticVendorId": "DIAG-VEN-…",
  "diagnosticAppointmentDate": "2026-08-10"
}
```

**One AHC order per policy year.** A second attempt returns
`400 "Already booked AHC for this policy year"`. That is a business rule, not a
payload fault, and it makes this journey **unrepeatable per member per year** —
harsher than the slot collisions, and it cannot be worked around without touching
policy data.

The only payment-related field is:

```ts
paymentAlreadyProcessed?: boolean; // True if payment was already handled by PaymentProcessor
```

**Optional**, and it exists to serve the reference's payment-first path — it is the
flag React's `PaymentProcessor` sets after taking money. Omitting it is a
first-class case, not an edge:

```ts
paymentStatus: createDto.paymentAlreadyProcessed
  ? PaymentStatus.COMPLETED
  : PaymentStatus.PENDING,
```

So a booking-first order lands in `PENDING` — exactly the state an unpaid booking
should hold — and the wallet is debited only on the already-processed branch.

**This is the vision ordering, available without any API change.**

## 2. What does success return? An order id

`POST /member/ahc/orders` -> **201**, with an order carrying
`orderId` in the form `AHC-ORD-<timestamp>-<random>` and `status: PLACED`. That id
is what a subsequent payment step would be keyed by.

Note the identifier duality applies here as it does elsewhere: `AHC-ORD-…` is the
**business** id. `GET /member/ahc/orders/:orderId` exists; which identifier it
takes must be checked before wiring navigation, given the claims precedent where
getting this wrong rendered "Claim not found" over a claim that existed.

## 3. Is there a payment step like vision's `process-payment`? No

Vision has `vision-bookings/:id/process-payment`. **AHC has no equivalent.** Its
endpoints are `package`, `eligibility`, `vendors/lab`, `vendors/diagnostic`,
`orders/validate`, `orders`, `orders/:orderId`, and the two report routes.

So the payment leg would go through the generic `payments/:paymentId` +
`payments/:id/mark-paid`, which is what Angular already does for every other paid
journey (register entry 5 conformance).

## Finding — `POST orders/validate` is a stub and will not work

Not part of the question asked, found while answering it, and it changes what the
AHC build can promise.

`ahc-member.controller.ts:190-206` passes **six `null` services** into
`validateOrder`:

```ts
// TODO: Inject dependencies when module is updated
const ahcPackageService = null;      // AhcPackageService
const labVendorService = null;       // this.labVendorService
const diagnosticVendorService = null;// this.diagnosticVendorService
const assignmentsService = null;     // this.assignmentsService
const planConfigService = null;      // this.planConfigService
const copayCalculator = null;        // this.copayCalculator
```

**Consequence for the build:** every other booking journey in this portal shows a
wallet/copay split *before* the member commits — it is a requirement in the lab,
diagnostics, vision and dental specs. AHC cannot, because the endpoint that would
compute it is not wired.

**This is the API owner's, and it is the only part of AHC that is.** It does not
block the build: create returns its own `paymentBreakdown` fields
(`walletDeduction`, `copayAmount`, `finalPayable`), so the split can be shown
*after* creation, on the pending order. It does block showing it *before*, so the
AHC spec must either omit the pre-commitment split scenario or state plainly that
it is deferred pending `orders/validate`.

## What the build is, restated with the contract confirmed

- **Journey, screens, content, step navigation** — copy from the reference.
- **Commit ordering** — take from vision, not the reference: `POST orders`
  (booking-first, `PENDING`), then payment keyed by the returned id, then
  `mark-paid`. Register entry 5 rules the reference's payment-first ordering
  do-not-port; it is the architecture behind the 13 orphaned payments.
- **Pre-commitment wallet split** — **not available** until `orders/validate` is
  wired. Show the split post-creation, or defer the scenario and say so.

AHC is therefore a hybrid — journey from the reference, commit ordering from
vision — and the spec must say so, so a future reader does not "correct" the
ordering back toward the reference.

---

## The payment leg — answered 2026-08-08. Vision's path is NOT available to AHC.

Asked before building anything, on the chance it removed a build. It did not, but
it removed a wrong build.

**How vision pays:** it never calls `POST /api/payments`. It calls
`vision-bookings/:id/process-payment` (`clinic-booking.store.ts:118-132`), and the
**server creates the payment record and returns its `paymentId`**; the screen then
navigates to `/member/payments/:paymentId`
(`vision-payment-page.ts:142-147`). So the endpoint Angular "doesn't declare" was
never needed for vision — the server does it.

**Why AHC cannot copy that:** AHC has **no `process-payment` equivalent**, and its
order-create returns **no `paymentId`** — the response carries `orderId`, `status`,
`paymentStatus` and the price breakdown, and nothing else. Confirmed by reading the
create path; the service's own comment is explicit:

```
// Debit wallet and create transaction if payment was already processed
// (Payment page created payment record, but wallet debit happens here)
```

That is the reference architecture stated plainly: **the payment record is created
by the payment page**, i.e. `POST /api/payments`, and the wallet debit happens on
order-create only when `paymentAlreadyProcessed` is set.

### What this means for the AHC payment leg

Booking-first leaves a `PENDING` order with **no payment record and no server-side
way to create one.** Three options, none of which should be chosen silently:

1. **Declare `POST /api/payments` in Angular** and create the payment after the
   order, keyed by `serviceReferenceId = orderId`. This is React's mechanism used
   in the correct order — booking first, then payment record, then `mark-paid`. It
   needs no API change.
2. **Ask for an AHC `process-payment`**, matching vision. Cleaner and consistent,
   but it is an API change and therefore not ours.
3. **Leave AHC orders `PENDING` and unpayable in the portal.** Not acceptable as an
   end state, but it is what the current build produces and it is honest about it.

**Recommendation: option 1.** It is the only one available without an API change,
it reuses an endpoint the API already serves, and the ordering stays entry-5
conformant. Option 2 is the better long-term shape and worth raising with the API
owner alongside inherited finding 10.

**Note the API already has the pieces:** `AhcOrderService` injects `PaymentService`
(`:25`). An AHC `process-payment` would be a small addition on their side, not a new
subsystem.

---

## The vision analogy has a limit — read before writing "as vision does"

Verifying vision (session 32-33) confirmed its ordering exactly: booking created
first, payment screen keyed by the existing `bookingId`, no booking created during
payment. **Entry 5 conformance holds and AHC should still be booking-first.**

But vision's payment leg carries a precondition AHC has no analogue for:

```
POST /api/vision-bookings/:id/process-payment
400 "Bill has not been generated for this booking"
```

Vision's real journey is **book -> wait for a bill -> pay**, and the bill is
generated **outside the member portal** — an ops or clinic step.

**Why this matters for AHC.** Vision is booking-first *because payment is gated on an
external event*; there is no moment at which paying first would even be possible.
AHC would be booking-first **by choice**, with nothing enforcing the gap. Same
ordering, different reason — and a reader who follows "as vision does" will find a
precondition AHC lacks and be unable to tell whether its absence is deliberate.

**So the AHC spec must not say "as vision does" unqualified.** State the ordering and
state *why*: entry 5, the orphaned payments — not "because vision does it".

**Open question for the API owner** (added to inherited finding 11's thread): **should
AHC payment be gated the same way?** If bills exist for AHC orders as an ops step, the
answer is probably yes and the payment leg's design changes — it would wait for a bill
rather than create a payment immediately. If they don't, AHC is a genuinely different
shape and the spec should say so explicitly.

Entry 5 is unaffected either way.


---

# OBSERVED 2026-08-10 (session 51) — the missing leg has produced a real unpayable debt

The payment leg has been described here since session 28 as "not yet built". It is
now visible in the data as a live defect, not a gap in a plan.

## The order

`AHC-ORD-1786182053508-8GHNX7JM9`, on the test member, created 2026-08-08:

| Field | Value |
|---|---|
| `status` | `PLACED` |
| `copayAmount` | **240** |
| `paymentStatus` | **`PENDING`** |
| **`paymentId`** | **`undefined`** |
| `walletDebitAmount` | `undefined` |
| `totalMemberPayment` | `undefined` |

**A committed order that owes ₹240, with no payment record in existence and no way
to settle it from the portal.**

## Why this is worse than the copay continuation, which was just ruled

They look like the same defect and are not.

| | Dental / consultations | **AHC** |
|---|---|---|
| Who creates the payment | the API, on create | **nobody** |
| Does a PENDING payment row exist? | yes | **no** |
| What was missing | the navigation to it | **the payment itself** |
| Cost of the fix | one line per confirm page | a new endpoint call, and finding 11 must be answered first |

Session 50 could fix the copay continuation in two lines because the destination
already existed — the API had created the payment and the portal was discarding
its id. **Here there is no id to discard.** `AhcBookingStore.place()` omits
`paymentAlreadyProcessed` deliberately, which is correct for entry 5: the order is
created `PENDING` with no wallet debit. But nothing then creates the payment, so
the member is left with an obligation that has no representation anywhere.

Criterion 6 does not catch it, and that is worth recording: the criterion looks for
**pending payments** the journey left behind. AHC leaves a pending **order** with no
payment at all, so the query finds nothing. *A detector tuned to one artifact is
blind to the same failure expressed in another.*

## The endpoint is not even declared

```ts
export const AHC_API = {
  eligibility:        'member/ahc/eligibility',
  package:            'member/ahc/package',
  orders:             'member/ahc/orders',
  labVendors:         'member/ahc/vendors/lab',
  diagnosticVendors:  'member/ahc/vendors/diagnostic',
} as const;
```

Five keys, no payment. And **`core/` declares no `POST payments` anywhere** — the
endpoint session 28 identified as the one AHC needs (`POST /api/payments`, keyed by
`serviceReferenceId = orderId`) has never been added to any API map.

## AHC is the only vertical where booking-first shipped without its other half

Every other journey resolves the money somewhere:

| Vertical | How the member's share becomes payable |
|---|---|
| dental, consultations | the API creates a PENDING payment on create and returns its id |
| vision | `process-payment`, gated on a bill |
| lab, diagnostics | `createOrder` has no else branch — no debit, no payment, nothing owed |
| **AHC** | **nothing** |

So the ordering that is right everywhere else leaves AHC with a committed order and
no settlement path. **This is not an argument against booking-first** — it is an
argument that AHC's second half was never built, and the first half shipped anyway.

## Proof the leg is possible

`PAY-20260330-0134` — COMPLETED, ₹240, `serviceReferenceId:
AHC-ORD-1774855136269-PJNIDVZDL`, March 2026. A different order, created through the
**reference's** payment-first path. It is both the demonstration that the API
supports an AHC payment and the measure of exactly what Angular is missing.

## Blocked on finding 11, and that ordering matters

Do not build this before **inherited finding 11** is answered. If AHC payment should
be bill-gated as vision's is, the leg waits for a bill rather than creating a payment
immediately, and the design above changes. **Building it first risks building the
wrong half a second time** — which is how this defect arose.

## Status

**Filed, not fixed.** Adding the payment leg is a new call in the journey and a
design that finding 11 governs; the standing instruction is to file and stop. It
also cannot be verified end to end on this account — AHC is once per member per
policy year and this order consumed it, which is test-data item 1.

---

# RESOLVED 2026-08-10 (session 53) — finding 11 answered, the leg built

**The question was answerable all along.** Finding 11 asked whether AHC payment
should be bill-gated as vision's is. The answer is **no, and it could not be**:
there is **no bill concept anywhere in the AHC module**. Ops runs
collection → reports → complete (`ahc-ops.controller.ts`), and the word does not
occur in the module at all. There was nothing to gate on.

**This block cost two sessions.** It was recorded as *"do not build this before
finding 11 is answered"*, which was right — but nobody tried to answer it, and it
took one grep. **A blocked item with no owner and no next action is a decision to
stop, dressed as a dependency.**

**Built:** `AhcBookingStore.createCopayPayment()` posts to `PAYMENTS_API.create`
with the order's `AHC-ORD-…` as `serviceReferenceId`, and the payment page
continues to `/member/payments/:paymentId`. Booking-first is unchanged — the order
is committed before the payment exists, the opposite of the reference's
payment-first stash.

**Verified by forced branch, 3 assertions inside 24/24** — the allowance is
consumed, so no real AHC order has exercised it.

**Still true:** `AHC-ORD-1786182053508-8GHNX7JM9` remains unpayable. This fix
applies at placement; making an existing order payable needs an on-demand control
on the bookings row, which is a new affordance and a design call. Filed, not
built. The row does disclose the ₹240.
