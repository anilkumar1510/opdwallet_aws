# Vaccination — sizing from `web-member-rn`

**This document exists to outlive the app it describes.** Vaccination has **no
React reference**. It exists only in `web-member-rn`, which is the app being
retired, so when RN goes this behaviour is unrecoverable. Every claim below cites
`file:line` for that reason.

**Sized, not transcribed and not built.** Whether vaccination is in scope is still
an open ruling; it can now be answered against this document rather than against a
live app.

## Shape

| | |
|---|---|
| Screens | **5** in `app/member/vaccination/`, plus behaviour in **3** screens outside it |
| Lines | index 437 · select-patient 323 · select-vendor 584 · select-slot 610 · confirm 784 = **2,738** |
| API endpoints | **8**, all live, all unconsumed by Angular |
| Angular today | `PlaceholderPage` at `app.routes.ts:328` |

`select-vendor` and `confirm` are the two large screens and carry nearly all of the
logic.

## Flow and step sequence

```
/member/vaccination            (index)          pick a vaccine       index.tsx:151
  -> /member/vaccination/select-vendor           pick a centre        select-vendor.tsx:234
  -> /member/vaccination/select-patient          pick a patient       select-patient.tsx:157
  -> /member/vaccination/select-slot             pick a date + slot   select-slot.tsx:201
  -> /member/vaccination/confirm                 validate, then book  confirm.tsx:282,332
```

Five user-committed steps. Note the order: **vendor before patient**, unlike every
other booking journey in the portal, which picks the patient earlier.

Each downstream screen guards its own entry and bounces home if the query params
it needs are missing — `select-patient.tsx:103-104`, `select-vendor.tsx:103-104`,
`select-slot.tsx:143-144`, `confirm.tsx:178-179`. All use `router.replace` except
select-vendor, which uses `push`.

## The 8 endpoints and what calls each

| Endpoint | Called from | Purpose |
|---|---|---|
| `GET /member/vaccination/services` | `index.tsx:103` | vaccines available under the member's policy |
| `GET /member/vaccination/vendors` | `select-vendor.tsx:129` | centres, **queried by pincode** |
| `GET /member/vaccination/vendors/:id/slots` | `select-slot.tsx:108-110` | day/slot grid; `?pincode=` appended only when set |
| `POST /member/vaccination/bookings/validate` | `confirm.tsx:282` | wallet/copay split before commitment |
| `POST /member/vaccination/bookings` | `confirm.tsx:332` **and** `app/member/payments/[paymentId].tsx:678` | creates the booking — **two call sites** |
| `POST /member/vaccination/bookings/:id/cancel` | `app/member/bookings.tsx:1078,1114` | cancel, body `{reason}` |
| `GET /member/vaccination/bookings/:id/invoice` | `app/member/bookings.tsx:1189` | invoice download |
| `GET /member/vaccination/bookings` | (list screen — `bookings.tsx`) | history |

**Three of the eight live outside the vaccination folder.** Sizing the five
screens alone under-scopes the work: cancel, invoice and history are in the shared
bookings screen.

## States each screen renders

| Screen | States |
|---|---|
| index | loading `:240` · error `:225-236` · empty "No Vaccines Available" `:289` · list |
| select-patient | loading (own + family) `:167` · empty "No Patients Available" `:242-245` · **selection state** `:82` |
| select-vendor | loading `:87` · error `:88` · **pincode-specific empty** — "No vaccination centers found for this vaccine in pincode X" `:143,149` · network error `:153` |
| select-slot | loading `:80` · error `:127,131` · day/slot grid with **three** selection signals `:82-84` |
| confirm | loading `:153` · validation result `:158` · payment method `:163` · service limit `:164` · `Alert.alert` on load failure `:217` |

## Findings with no Angular equivalent — scope items, reported per the stop condition

### 1. A third-party geocoder is called directly from the client

`select-vendor.tsx:195-200` calls **`https://nominatim.openstreetmap.org/reverse`**
directly, as a fallback after the API's own geocode (`:188`) fails.

Angular has no equivalent anywhere. The API *does* serve `location/geocode`,
`location/autocomplete` and `location/reverse-geocode` — all three unconsumed by
Angular (`01-endpoint-diff.md` §4). React's `appointments/doctors` uses the API's
own endpoints.

So RN reaches past its own backend to a public third-party service for member
location. That is a dependency, a privacy consideration, and an availability risk
that no other part of this portal has. **It should not be ported without a
decision**, and porting the flow without it changes what the member can do when
the API's geocoder fails.

### 2. Booking creation has two call sites, one of them payment-first

`POST /member/vaccination/bookings` is called from `confirm.tsx:332` and from
`app/member/payments/[paymentId].tsx:678`. The second is a **payment-completes-then-
creates-the-booking** path.

Parity register **entry 5** records the opposite decision for the rest of the
portal: *"Payment completion does not create the booking."*

### RULED 2026-08-07: entry 5 generalises. Payment-first is a defect. **Do not port.**

Payment-first means a payment can succeed with no booking behind it - payment
clears, `POST /bookings` fails, the member is charged for nothing and has no
record to point at. Booking-first fails safe; payment-first fails expensive.
Entry 10's first question settles it: payment-first is not defensible without
reference to the cost of reverting, and nothing about vaccination makes the
ordering safer there than anywhere else.

It lives in `web-member-rn`, the app being retired, so it never needs fixing -
**only not-porting.**

### Checked while open: is the second call site a fallback? No - and it is far wider than vaccination

It is not a retry or a fallback for an unreliable primary path. It is a payment
gateway screen that creates the booking and *then* marks the payment paid
(`payments/[paymentId].tsx:678` then `:687`).

**And it is not vaccination-specific.** The same screen creates bookings
payment-first for **eight service types**:

| Service type | Line |
|---|---|
| `DENTAL` | `:428` |
| `VISION` | `:451` |
| `IN_CLINIC_APPOINTMENT` | `:468` |
| `LAB` | `:495` |
| `DIAGNOSTIC` | `:513` |
| `AHC` | `:531` |
| `ONLINE_CONSULTATION` | `:607` |
| `VACCINATION` | `:636` |

So RN's paid-booking architecture contradicts entry 5 **portal-wide**, not in one
flow. Entry 5 was written about `web-member`'s payment screen; RN diverges from it
everywhere money is involved.

**Consequence for scope:** this is not a vaccination finding that happens to touch
payments. It is an RN-wide architectural divergence that vaccination merely
exposed. Any future port of *any* paid RN journey inherits it, so the do-not-port
ruling applies to all eight, not just the vaccination branch.

### 3. ~~Vendor-before-patient ordering~~ — RETRACTED 2026-08-07

**This was wrong, and it is corrected here rather than quietly dropped**, because
this document is meant to outlive the app it describes and a false claim in it
would survive the evidence.

I wrote that vaccination picks the centre first "unlike every other booking journey
in the portal". Checked against the reference, **every booking journey does the
same**:

| Flow | Order |
|---|---|
| appointments | `specialties -> doctors -> select-patient -> select-slot -> confirm` |
| vision | `clinics -> select-patient -> select-slot -> confirm` |
| dental | `clinics -> select-patient -> select-slot -> confirm` |
| vaccination (RN) | `index -> select-vendor -> select-patient -> select-slot -> confirm` |

Provider first, patient second, slot third. **Vaccination is not an exception —
it follows the portal's one consistent booking shape.**

The original claim was an assumption stated as an observation. It is exactly the
class of inherited premise this audit has now corrected six times, and it was
caught only because session 8 was told to check the ordering rather than reuse it.

**Consequence:** there is no positional special-casing to plan for. The
family-context marker work transfers to vaccination's patient picker the same way
it transferred between appointments and clinic-booking.

## What sizing this cost, and what building it would

Sizing: a fraction of a session, and it is now durable.

Building is **not** comparable to a transcription vertical. The lab vertical was
6 routes transcribed from a readable React reference in two targeted reads.
Vaccination has no reference to transcribe from — this document *is* the
reference now — plus 2,738 lines of RN to port, 5 screens, 3 more endpoints
living in a shared screen, and two open register questions. Treat it as its own
change, not as vertical ten.

## What the ruling now costs

Because this document exists, the vaccination scope ruling **no longer expires
with `web-member-rn`.** That was the whole point of sizing it early. The remaining
52 routes are still priced against the retirement date; vaccination is not.
