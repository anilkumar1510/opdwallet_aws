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
5. **Does the clinic booking journey survive?** See BREAKING above.

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
