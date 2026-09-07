# Vision order and coupon for the member portal

## Why

Vision is the only service line where what is built is **not a partial version of
the sheet's journey — it is a different journey**. Every other flow stops
somewhere along the sheet's own steps. Vision left the sheet's path at step 3 and
built something the sheet does not describe anywhere.

*Member Portal Patient Flows* flow 3, and the dedicated `Vision Backend` tab
behind it, describe a coupon handoff to Lenskart: start an order, pick partner
and mode of purchase, upload the eye prescription, receive a coupon code linked
to the order identifier, then buy on the partner's own site.

What exists is a clinic booking — clinics, slots, select patient, confirm,
payment — on `vision-bookings/*`. There is no clinic, no slot and no appointment
anywhere in the sheet's vision flow. Searching the whole repository for `coupon`
or `Lenskart` returns nothing.

**The scope is much smaller than the flow's length suggests.** The `Vision
Backend` tab is explicit that steps 1–4 sit on the member portal and steps 5–14
run entirely on Lenskart's systems — their checkout, then their Insurance
Dashboard, where Partner Operations works an order queue and approves or rejects.
**Four steps are ours.** Two of them are already built:

| Step | State |
|---|---|
| 1 · Click Vision | Built — `/member/vision`, card gated on the active plan |
| 2 · Policy coverage details | Built — CAT007 services resolve; coverage is shown instead of a payment breakdown |
| 3 · Start order, pick partner and mode, upload prescription | **No API** |
| 4 · Submit request, receive coupon code | **No API** |

**Vision is not blocked by `wallet-block-and-razorpay`,** and this is worth
stating because it has been assumed otherwise. The tab rules it out twice:
*"No wallet block is placed. Every other paid service line blocks the wallet at
transaction. Vision reserves value against the coupon instead."* and *"Payment is
collected outside the platform … so it never appears in the member payment
flow."* Vision can therefore be completed **before** the wallet work, not after
it.

## What Changes

- **A vision order.** Create an order carrying the partner, the mode of purchase
  (online or in store), and an uploaded eye prescription. One open order at a
  time, per flow 3 step 3.
- **Prescription upload for vision.** Upload exists for lab and diagnostics only
  (`member/{lab,diagnostics}/prescriptions/upload`). Vision needs the same, and
  the sheet makes it **mandatory before the request can be submitted**.
- **A partner list.** Members pick from the empanelled vision network. Nothing
  models a vision partner today: `GET vision-bookings/clinics` returns
  `{"clinics":[]}` on the live database, so even the built booking journey has no
  data behind it.
- **Coupon issue.** Submit sends the request for validation; on approval a coupon
  code plus a link to the partner site are returned, **one coupon to one order
  identifier**.
- **Two member screens** — the order form (partner, mode, prescription) and the
  coupon result. The placeholder at `/member/vision/order` marks where they go.
- **BREAKING, and the decision this change really turns on** — what happens to
  the existing `vision-bookings/*` clinic journey. It is not in either sheet, it
  has no clinics seeded, and it carries a known defect
  (`audit/20-copay-continuation.md`: vision's `process-payment` is gated on a
  bill the portal cannot generate). Retiring it is the honest reading of the
  sheet; keeping both means two vision journeys, only one of which is documented.

**Out of scope.** Everything from step 5 on: the Lenskart checkout, the Insurance
Dashboard, the order queue, adjudication, fulfilment. Those run on the partner's
platform. This change ends when the member holds a coupon code.

## Open questions

These are decisions, not research — none can be settled from the codebase, and
each changes what gets built.

1. **Who mints the coupon code?** Ours, generated against the order id, or
   Lenskart's, fetched from a partner API? The tab says the code is entered *"in
   the existing coupon field on Lenskart"*, which implies Lenskart must already
   recognise it. If there is no partner integration, coupons are issued by hand
   and the "issue" step is an operations queue, not an endpoint.
2. **What does "reserves value against the coupon" mean?** The tab says vision
   reserves value rather than blocking the wallet. Nothing in the wallet models a
   reservation, and `wallet-block-and-razorpay` explicitly does not cover vision.
   Whether this is a real ledger entry or a bookkeeping note is unanswered.
3. **Who validates the request before a coupon is issued?** Step 4 says the
   request *"goes for validation"*. The tab later says eligibility is verified by
   a person against records held outside the dashboard. If validation is manual,
   this change needs an operations screen it does not currently propose.
4. **What does the member see afterwards?** The tab is blunt: *"Member has no
   status visibility … Order status, approval, rejection and fulfilment are all
   communicated outside the application."* Confirming that is intended, rather
   than a gap to close, decides whether an order history screen exists at all.
5. ~~**Does the clinic booking journey survive?**~~ **Decided 2026-09-01: no,
   for vision.** The service cards that opened it are removed from
   `/member/vision`; the way in is gone. The routes, the API and existing
   bookings are untouched, so old links still resolve and a member who booked
   before can still see it — retiring the endpoints is a separate step with its
   own blast radius. Dental keeps its cards: flow 4 *is* a clinic visit, and the
   two areas share one component, so the removal is gated rather than global.
6. **Who collects the excess above the coupon?** The two sheets disagree, and
   this one is member-facing, so it cannot be left ambiguous on screen:
   - *Patient Flows*, flow 3 step 8: "Anything above the coupon value is paid by
     the member **to the partner**."
   - *Vision Backend*, row 17: "the balance is collected directly from the
     customer … through **our own channel**, not through the member portal wallet
     and **not through Lenskart**." Row 37 adds that it "never appears in the
     member payment breakdown, the receipt or the invoice the member sees".

   The coupon screen currently states only what both agree on — what the coupon
   covers — and names nobody, because telling a member to expect a bill from the
   wrong party is worse than telling them nothing. If collection really is via
   our own channel, that is a member-facing step with no screen and no endpoint,
   and it belongs in this change rather than outside it.

## The coupon reserves nothing, and that is a live double-spend path

The `Vision Backend` tab, row 36: *"No wallet block is placed. Every other paid
service line blocks the wallet at transaction. Vision reserves value against the
coupon instead, and nothing is held on the member ledger while the order is
open."*

Built as written, that reservation does not exist. **The coupon is the
reservation and nothing enforces it:**

- The coupon records `eligibleAmount` as a SNAPSHOT of remaining vision cover at
  the moment it is issued. Nothing re-reads it afterwards.
- **Nothing outside the vision order module knows a coupon exists.** Searching
  `api/src` for `couponCode` outside `vision-orders` returns nothing.
- Two other paths spend the same CAT007 balance and neither consults it:
  `vision-bookings.service.ts` debits at three call sites, and
  `memberclaims.service.ts` at two, for a vision reimbursement claim.

So a member can hold a live ₹3,000 coupon, then book a vision clinic visit or
file a vision claim against the same ₹3,000. The coupon keeps quoting a figure
the wallet no longer backs, and the partner honours it — the redemption file
settles later against money already spent. Nothing detects this, at either end.

**This is not a bug in the code as specified — it is what "no wallet block"
means once written down.** It needs a decision, and the options differ in cost:

1. **Hold the amount.** The honest reading of "reserves value", but it needs the
   held-balance primitive that `wallet-block-and-razorpay` is building and which
   explicitly excludes vision today.
2. **Re-check at redemption.** Cheap, but there is no redemption event: nothing
   tells this platform a coupon was spent.
3. **Accept it and reconcile.** Treat over-issue as a settlement problem for the
   redemption file. Viable only if someone owns that reconciliation.

Until one is chosen, the member-facing surface says only what is true: the
screen states that this app is not told when a coupon is used, rather than
implying an unspent coupon is still backed.

## Step 9 has no member surface, deliberately

Flow 3 step 9, "Payment after order processing", is partner settlement:
"Settlement with the partner happens once the order is processed", against a
*vision partner redemption file*. It is back-office reconciliation between this
platform and the partner, with nothing the member does or sees — which is why
the journey on screen ends at the coupon. Its absence from the portal is
correct, not a gap.

## Capabilities

### New Capabilities

- `member-vision-order`: starting a vision order, choosing partner and mode of
  purchase, uploading the eye prescription, submitting for validation, and
  receiving a coupon code bound to the order identifier — including the
  one-open-order rule, what the member is shown when validation has not
  completed, and what they are shown after the coupon is issued.

### Modified Capabilities

None yet. `openspec/specs/` is empty across this repository and nothing has been
synced to main specs, so there is no existing vision capability to amend.

## Impact

**API.** A new vision order module — schema, controller, service — plus
prescription upload configured as lab and diagnostics already are, and a partner
source. Possible retirement of `vision-bookings/*` and its ops surface
(`ops/vision-services/*`), depending on question 5.

**Frontend.** `web-angular`: the order and coupon screens behind
`/member/vision/order`, replacing the placeholder; `core/clinic-booking/` loses
its VISION branch if the booking journey is retired. `web-member` is the
read-only reference and is not modified. `web-operations` gains a validation
queue if question 3 is answered "manual".

**Data.** All existing data is test data (project rule 1). No vision orders
exist; no migration.

**Sequencing.** Independent of `wallet-block-and-razorpay` — see the Why. It can
be built first, and there is an argument that it should be, since it is the only
flow whose completion does not wait on the wallet primitive.
