# 29 — Reverting the copay continuation, and what it changes

**Session 40, 2026-08-09.** A revert, two riders, and a stop condition tripped
on the last read.

## The revert

Session 34 navigated the member to `/member/payments/:paymentId` after confirming
a dental booking or a consultation. **That was a flow change made under a
standing instruction not to change flows**, folded in as a defect fix. The user
has ruled: reverted.

**Where the navigation actually lived.** The brief named
`ClinicBookingStore.create()` and `BookingStore.create()`; the navigation was in
the two **confirm pages**, and the stores only carried `paymentId`. That is the
same split the brief asked for — keep the plumbing, drop the navigation — so both
were reverted at the page call sites and both stores left intact.

| | Session 34 | Now |
|---|---|---|
| `confirm-booking-page.ts` (dental) | `if (created.paymentId) navigate(['/member/payments', …])` | **removed** — ends on `/member/bookings?tab=dental` |
| `appointment-confirm-page.ts` | same, both consult modes | **removed** — ends on `/member/bookings?tab=doctors` |
| `ClinicBookingResult.paymentId` | added | **kept, carried, unused** |
| `toAppointmentBookingResult` | reads `appointmentId` from under `appointment` instead of the top level, where it always resolved to `''` | **kept** — a real bug, unrelated to the flow |

`paymentId` is left in place with a comment at each declaration saying it is
deliberately unused pending the ruling. Deleting it would turn a one-line remedy
into a rewrite, and the filing depends on it being available.

**Four stale comments corrected while reverting** — `clinic-booking.ts`,
`clinic-booking.store.ts`, `appointments/booking.ts` and both confirm pages all
asserted that the journey continues to a payment screen. Session 39's rule
applies: *an in-code comment has no more authority than a stale register entry*,
and a comment describing a reverted flow is exactly the kind that survives
unchallenged.

**Vision was not touched.** Its payment screen runs `process-payment` and
navigates to `/member/payments/:id` from there — pre-existing, not session 34's
addition, and outside this revert.

## Re-verification: both tasks reopen, correctly

Run after the revert, with **no assertion weakened**:

| Harness | Was | Now |
|---|---|---|
| `verify-dental.mjs` | 17/17 | **13/17** |
| `verify-consultations.mjs` | 20/20 | **14/20** |

The ten failures are the continuation assertions and criterion 6, in both flows.
**8.8 and 8.18 go back to open**, on the same scenario they closed on. That is the
correct outcome: they close when the defect is resolved, and it is now unresolved
by decision.

**The failing assertions were relabelled, not changed.** Each now reads
`OPEN DEFECT (awaiting ruling) — …` and each file carries a banner saying the red
is deliberate and that a green run would mean the revert had been undone or
criterion 6 weakened. No predicate was touched. A permanent, explained red is a
better artifact than a suite that forgets what it is waiting for.

## The filing, restored to open

`20-copay-continuation.md` is open for **all three** — dental, consultations,
claims — with what is certain and unchanged:

> The wallet is debited, a PENDING payment is created server-side, the portal
> discards the `paymentId`, and the member sees a screen saying the booking is
> complete with nothing about the amount still owed.

Twelve unsettled consultation copays and two dental, found by criterion 6 across
the closed verticals.

**What the earlier ruling got wrong, recorded because it is the transferable
part:** it read "entry 5 prescribes the continuation" as authority to ship it.
Entry 5 *permits* the continuation — it rules ordering, not destination.
**Permission is not approval**, and conflating the two is how a flow change
entered as a fix.

**Four options are now recorded in that file** so the decision does not have to be
re-derived. Worth flagging one: **surfacing the outstanding amount on the bookings
row the member already lands on** is not a flow change by the standing definition
— no new destination — and it also fixes the settled/unsettled ambiguity in the
same row. It was never considered in session 34; the jump from "the member is in
debt" to "navigate them to pay" skipped it.

## Step 5 — the refusal is a DEFECT, not a divergence

The question was whether any other Angular form in this app names missing fields
inline. **It does. Several, and one of them is in the same feature folder.**

| Where | Message |
|---|---|
| `appointment-confirm-page.ts:407-419`, in `confirm()` | *"We could not tell who this appointment is for. Go back and choose a patient."* · *"Enter a contact number so the doctor can reach you."* · *"Choose a time for your consultation."* |
| `vendor-booking-page.ts`, in `place()` | *"We need a complete address before a home collection — line, city, state and pincode. Add or complete one in your profile, or choose a centre visit."* |
| `new-claim-page.ts:238` | *"Amount exceeds available balance …"* — a range check rather than a missing field, but the same inline pattern |

All three keep the control **enabled**, validate **on attempt**, and name the
problem. That is precisely the model the upload forms do not follow.

**So the upload forms are inconsistent with their own codebase**, and the *"Incomplete
submission is refused"* failure is a **defect, not an interaction-model
divergence.** Entry 10's reasoning does not carry: it sanctions a divergence
Angular applies consistently, and this one Angular applies in exactly two screens
out of the set.

The comment at `appointment-confirm-page.ts:403-405` is the strongest evidence,
because it was written against this same failure:

> *"Surface the failure rather than swallowing it. A silent return here is why the
> ONLINE journey was dead for the whole audit: the button was enabled, clicking it
> did nothing, and nothing said why."*

A disabled button with no explanation is the same failure with the click removed.

**Also settled by this:** the fix needs no flow change. Inline messaging adds no
screen and no destination — it is a display change to a screen already in the
journey, the same category as option 2 for the copay. So it is fixable under the
standing instruction without a ruling.

**Not fixed here.** The brief said report, do not rule or fix either way, and
finding that it is a defect rather than a divergence is a change to what happens
next, which is a stop condition. Both specs still describe the scenario as
written; neither has been amended to bless the disabled control.

## Step 6 — the test-data bundle, three items, three owners

| # | Item | Owner | Unblocks |
|---|---|---|---|
| 1 | **A member with an unused AHC allowance** — AHC is once per member per policy year (`ahc-order.service.ts:61`) and `curl` verification consumed `shivam@`'s. `standard@` has no cover. | whoever owns test data | AHC transcription, and the AHC commit observed through the app rather than by `curl` |
| 2 | **A dependent credential** — open since session 12. | whoever owns test data | 5.8's *"dependent signs in directly"*, the last scenario keeping `member-family-context` open |
| 3 | **A doctor-authored digital prescription for `shivam@`** | **a doctor, through the doctor portal** — not a seed | *Submitting an existing prescription*, in **both** lab and diagnostics |

**Item 3 is a different kind of ask and should not be sent as a seeding request.**
`shivam@` holds zero health records; four exist globally, none his;
`doctorprescriptions` is empty for everyone. No member-side route creates one —
the only writer is `DigitalPrescriptionWriter` on the doctor portal's appointment
screen. It is an action with an owner and a UI, like the ops digitize that
unblocked lab in session 38.

**Why item 3 was not worked around.** A records fixture would have made the
selector render rows and the submit fire, and the run would have gone green while
the scenario's GIVEN — *"a member who already holds a digital prescription"* — was
satisfied by **no path a member can reach**. That is the silent-spec danger from
`10-assertion-provenance.md` arriving one step later in the same session: not a
spec that omits its precondition, but a harness that supplies one the product
cannot. Declining it is the same judgement, applied to the harness instead of the
spec.
