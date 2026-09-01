# Vaccination for the Angular member portal

## Why

Vaccination was the only member capability with **no React reference**. It existed
solely in `web-member-rn` — the app being retired — as 5 screens and 2,738 lines,
and Angular shipped a deliberate `PlaceholderPage` in its stead.

It was proposed as its own change rather than as one of the retro-spec verticals
because it shared none of their properties: there was nothing to transcribe from,
its reference was a document rather than an app, and it carried register questions
the other verticals did not.

## What

Port the vaccination journey. Scope, sizing, flows, endpoints, per-screen states
and `file:line` citations are recorded in
`web-angular/projects/member/audit/12-vaccination-sizing.md`, **which is the
reference for this work** and was written to outlive `web-member-rn`.

Summary of what that document establishes:

- 5 screens, 5 user-committed steps, **vendor before patient** — the only booking
  journey in the portal with that ordering.
- **8 live API endpoints, all unconsumed at the time of writing.** Three of them —
  cancel, invoice and history — live outside the vaccination folder in the shared
  `bookings.tsx`, so scoping to the 5 screens under-scopes the work.
- Two behaviours ruled **do-not-port**:
  - the payment-first booking path (parity register entry 5 generalises; see the
    sizing document — the same defect spans **eight** service types in RN, not
    just vaccination);
  - the direct `nominatim.openstreetmap.org` geocode fallback, filed as a
    compliance finding at `audit/05-inherited-api-findings.md` §4.

## Status

**Built and running (2026-08-24).** This section previously read *"Proposed, not
scheduled"* and cited a `PlaceholderPage` at `app.routes.ts:328`. Both were stale:
the journey was implemented on 2026-08-24 and that line is now the
`vaccination/vendors` route.

Delivered, verified against the running system on 2026-08-31:

- **5 screens**, matching the sizing document's count and its vendor-before-patient
  ordering — `features/vaccination/`: services, vendors, select-patient,
  select-slot, confirm. Routed at `app.routes.ts:320-353`.
- **Endpoint coverage is complete but split across two constant maps**, exactly as
  the sizing document predicted. The booking journey uses `VACCINATION_API`
  (`core/vaccination/vaccination.ts`): services, vendors, slots, validate, create.
  The three post-booking endpoints reach it through `BOOKINGS_API`
  (`core/bookings/booking.mapper.ts:30,31,50`): cancel, invoice and history —
  the same three the document warned would be missed by scoping to the screens.
- **One endpoint remains unconsumed.** `VACCINATION_API.byId`
  (`GET member/vaccination/bookings/{bookingId}`) is declared and has no caller.
  Every other operation the API exposes under `member/vaccination` is called.
- **Both do-not-port rulings hold.** No payment-first path was introduced: the
  journey creates the booking and validates before it, via `bookings/validate`.
  `nominatim` appears nowhere in `projects/member/src`.

**Not delivered, and outside this change.** The sheet's payment mechanic —
wallet block, Razorpay, cart-ready notification over WhatsApp and push, cashless
letter, and receipt-versus-invoice timing — is unbuilt for vaccination as it is
for every other service line. That is `openspec/changes/wallet-block-and-razorpay`,
which lists vaccination among the seven flows it does not migrate.

**Archiving is blocked, not overlooked.** `openspec archive` needs spec deltas,
and this change has no `specs/` directory. `openspec/specs/` is empty across the
repo and nothing has been archived yet, so vaccination is not a special case —
it inherits the repo-wide gap. Closing it means either writing the
`member-vaccination` capability spec from the delivered behaviour, or marking
`skip_specs: true` in `.openspec.yaml` and accepting that the behaviour is
recorded only in the sizing document. The first is the honest option; the
sizing document is detailed enough to write it from.
