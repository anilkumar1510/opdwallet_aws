# 21 — Degraded, but not declared

**Found:** 2026-08-08, session 35, verifying `member-lab`.
**Status:** **ALL FOUR SITES FIXED, session 38** — see `26-session-38-fixes.md`.
Originally filed not-fixed, deliberately, so the class could be reported before
being touched. Re-verified: diagnostics 21/21, lab 22/22.
**Named as a class:** 2026-08-09, session 36.

## The class

> **Degradation that substitutes a domain explanation for a technical failure is
> worse than blanking.** "Could not load" prompts a retry. A fabricated cause
> forecloses one — a member reads it, believes it, and gives up.

The two halves are not equally bad, and the ranking matters when these are
triaged:

| What the member is shown on a failure | Cost |
|---|---|
| the error | none — this is the target |
| nothing (a blank or a spinner) | they wait, then retry |
| a **silence** that reads as normal ("Awaiting the lab") | they wait indefinitely |
| a **false domain cause** ("no lab in your area has quoted") | they stop; the app has answered the question |

Only the last one is actively harmful, because it is the only one that gives the
member a reason to abandon the journey. It converts a transient 500 into a
settled fact about their circumstances.

**This is the second time this codebase has answered a failure by asserting
something false about the member's situation rather than admitting the failure.**
The first was *"No claims yet"* served to a member whose session had been
rejected — `08-empty-vs-unfetched.md`, where the recommended fix is expressly the
one that *eliminates the claim* rather than softening it, on the same reasoning.
Two instances, two features, two mechanisms (a reset store; a caught rejection),
one shape.

**What keeps this a defect rather than a design choice is the positive control.**
The lab hub, on the same failed request, renders *"Could not load orders.
Everything else is shown below."* — degradation and disclosure together, which is
what the other two sites are missing. One class, three sites, one of them already
correct.

## The pattern

The lab portal deliberately degrades rather than blanking a screen when one of
several parallel requests fails. That intent is sound and is documented in the
code. What is missing is the second half: **on two of three screens the member is
not told the degradation happened**, and on one of them the copy asserts a
specific, false cause.

**This is not a generalisation from one instance.** The three sites were checked
individually, and one of them is correct — it is the positive control.

| Screen | On a failed sub-request | Told? |
|---|---|---|
| `/member/lab-tests` (hub) | keeps the screen, renders *"Could not load orders. Everything else is shown below."* (`lab-tests-page.ts:200-205`) | **yes — correct** |
| `/member/lab-tests/orders` | keeps the screen, renders *"Awaiting the lab"* | **no** |
| `/member/lab-tests/cart/:id` | keeps the cart, renders *"No lab partners available yet"* | **no, and wrongly** |
| `/member/diagnostics` (hub) | keeps the screen, renders **nothing at all about the failure** (`diagnostics-page.ts`, no `partial()` reader) | **no — added session 37** |

**Session 37 changed the ratio, and with it the reading.** Verifying diagnostics
found a fourth site, in a component of its own. The orders and cart sites are
*shared* between the two verticals, so diagnostics inherits those two by
construction — but the diagnostics **hub** is a separate component (the reference
gives it its own layout) and the disclosure was simply never written there.

So the tally across both verticals is **one site correct out of four**, not "two
sites missed out of three". The generous reading — that the pattern is mostly
right — does not survive the second vertical. Full run in
`25-diagnostics-verification.md`.

## Defect 1 — the orders screen swallows its own failure

`LabStore.load()` fetches orders and prescriptions in parallel; the orders
promise catches into `_partial` rather than `_error`, and only *both* failing is
treated as a real failure (`lab.store.ts:276-277`, which says so). The hub
renders `store.partial()`. **`lab-orders-page.ts` never reads it.**

So with `member/lab/orders` returning 500, the member sees:

> Awaiting the lab · Uploaded prescription PRES-1786007337999-RGJHEZDV5 · Our
> team is processing your prescription. You will be notified once it is ready
> for ordering.

They are told their prescription is in progress. They are not told their order
list failed to load. Verified from a cold context; the hub under the *same*
interception says "Could not load orders", which is the positive control.

**Sharpened by session 36 (`24-where-lab-carts-come-from.md`): that copy is not
invented.** *"Our team is processing your prescription"* is a **true and accurate**
description of the real pre-digitize state — a submitted prescription genuinely
does sit waiting for ops. That makes this the milder half of the class: a true
statement standing in for a missing one, not a false one. It ranks at *silence*
in the table above, where defect 2 ranks at *false cause*. It is still a defect —
the member cannot tell a waiting prescription from a broken screen — but it should
be fixed by **adding** the disclosure, not by rewriting the copy, which is correct.

## Defect 2 — a failed vendor request is reported as "no lab has quoted"

`CartStore.load()` catches the vendor request to `null` on purpose — the comment
reads *"A cart with no vendors quoting is still a viewable cart, so a vendor
failure must not blank the screen"* (`cart.store.ts:170-174`). Correct intent.
But the vendor-less branch is the only branch left, and its copy is:

> **No lab partners available yet** — No lab in your area has quoted for these
> tests. Try again shortly.

That names a cause that did not happen. The request failed; no lab was asked.

**This one contradicts the spec directly.** `member-lab` requires:

> #### Scenario: Vendor list fails to load
> - **THEN** an error state is shown, **distinct from the no-vendor empty state**
> - **AND** a retry is offered

Neither clause holds. There is one branch for both states.

### It also hid itself from the harness

The first version of this check asserted `/could not|went wrong|try again/` and
**passed** — on the empty state, whose copy ends *"Try again shortly."* A green
assertion that could not tell the two branches apart. Re-aimed at copy unique to
each branch (`"We could not load this"` vs `"No lab partners available yet"`),
the failure is unambiguous. *A green suite is evidence about the assertions.*

## The shape of the fix, not applied here

Both are the same one-line-of-state fix, and neither requires giving up the
degradation:

- orders screen: render `store.partial()` as the hub already does.
- cart screen: a `vendorsFailed` signal set in that `.catch`, and a third branch
  that says the vendors could not be loaded and offers a retry — keeping the cart
  on screen either way.

## The adjacent shape: asserted, and nothing follows

Cross-referenced here in session 37 because it is the same member experience by a
different mechanism, and filing it only against the endpoint diff would hide that.

**`/member/bookings` renders "Invoice available" and offers no way to get one.**
`bookings-page.ts:143-145` — a `<p>`, not a control — gated on `hasInvoice`,
which `booking.mapper.ts:250` maps correctly from `invoiceGenerated`.
`CLINIC_BOOKING_API[area].invoice` is declared for both vision and dental with
zero callers. The reference downloads the PDF
(`bookings/page.tsx:761-793`, `handleViewInvoice`). Full write-up in
`17-renders-but-cannot-complete.md`.

**Where it sits on the ranking above: at *silence*, not at *false cause*.** The
statement is **true** — the invoice really does exist on the server. What is
missing is the action, so the member is left holding a fact they cannot use.
That is strictly better than defect 2, which fabricates a cause, and strictly
worse than saying nothing, because it invites an attempt that has nowhere to go.

**Why the two files belong together.** This file is about a screen that will not
admit a failure; that one is about a screen that announces a capability it does
not have. Both are the app **stating something about the member's situation that
its own behaviour does not support** — and both were invisible to every static
check until a detector was built for the specific shape. The unifying test for a
reviewer is not "is this string true?" but **"can the member act on what this
screen just told them?"**

Not fixed. Vision and dental are closed verticals and reopening them is a
separate call.

## Relation to `08-empty-vs-unfetched.md`

That file raised the class. These are two live instances of it in one vertical,
with a working counter-example in the same store's other consumer — which is why
this is filed as two defects rather than as a design question.
