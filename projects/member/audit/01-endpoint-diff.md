# Phase 1 — endpoint string diff

**Angular side:** every path literal and template literal under
`web-angular/projects/member/src/app/core/**` (extractor:
`scratchpad/ep-diff.mjs`, read-only). 88 candidate strings, 86 resolve to a real
API path.

**API side:** live NestJS `RouterExplorer` log (see `00-inventories/api-routes.md`).
512 unique `METHOD /path`; 168 unique member-reachable paths after normalising
`:params` to `:p`.

**Headline:** Angular consumes **86 of 168** member-reachable API paths. **82 are
unconsumed.** 1 wrong path (latent). 0 wrong verbs.

> ### Read the 82 correctly — it is far less alarming than it looks
>
> "168 member-reachable" is a *prefix* filter, not a statement about ownership.
> Classifying the 82 by who actually owns them:
>
> | Class | Count | Is it a member-portal finding? |
> |---|---|---|
> | **Staff / doctor-owned** — `auth/doctor/*`, `doctors/:p/*`, `clinics*`, `specialties*`, `members/*`, `users/*`, `payments/summary/stats`, `video-consultations/doctor/history`, `location/test-geocode` | **36** | **No.** These belong to the doctor and admin portals. The member portal was never meant to call them. |
> | **Vaccination** — `member/vaccination/*` | **8** | **No — `UNSCOPED`.** RN-only feature; see `00-inventories/rn-only-unscoped.md`. |
> | **Member-owned, genuinely unconsumed** | **38** | **Yes.** This is the real number. |
>
> Against a fair denominator — 168 minus the 36 that were never the member
> portal's to call — Angular consumes **86 of 132, or 65%**, and the outstanding
> member-owned surface is **38 paths, not 82**.
>
> The RN-only surface explains only **8** of the remainder, so it does *not*
> account for the bulk. The thing that deflates this number is staff-owned
> routes sharing a prefix, not RN.

---

## 1. Wrong path — Angular calls a path the API does not serve

### [DEBT — latent, not dismissed] `member/diagnostics/vendors/:p/pricing` does not exist

`core/lab/lab.mapper.ts:42`

```ts
vendorPricing: (vendorId: string) => `member/diagnostics/vendors/${vendorId}/pricing`,
```

The API serves no such route. The diagnostics pricing route is cart-scoped and
takes **two** params:

```
GET /api/member/diagnostics/carts/:cartId/vendors/:vendorId/pricing
```

The LAB sibling at `lab.mapper.ts:26` *is* correct — `member/lab/vendors/:vendorId/pricing`
exists. So the two legs of the shared journey disagree, and only the diagnostics
one is wrong.

**Impact today: none.** Neither `vendorPricing` is ever called — `grep -rn vendorPricing`
returns only the two declarations. Angular sources pricing from the `cartVendors`
response instead (`core/lab/cart.ts:188` maps `dto.pricing[]`), which is why the
screen renders correct prices without this endpoint.

**Why it is still a finding — classify as latent, not dismissed.** `VendorBookingPage`
is shared by both `kind`s, so anyone wiring `vendorPricing` up for a per-vendor
refresh gets a working LAB leg and a 404 DIAGNOSTIC leg. The failure is not
"pricing is broken" — it is "pricing works in testing and breaks for half the
journeys in production", because whoever wires it will almost certainly exercise
the lab path first. Two independent things have to be wrong together for this to
bite (a caller appears **and** the path stays wrong), which is exactly why it
survives review: neither half looks like a defect on its own.

The correct path is also structurally different, not a typo — it is cart-scoped
and takes **two** params (`carts/:cartId/vendors/:vendorId/pricing`), so fixing it
is not a string edit; the call site needs a `cartId` it does not currently thread.
**Do not close this by deleting the dead code without recording the shape of the
real endpoint.**

## 2. Wrong verb

**None.** All 86 matched paths are called with a method the API serves.

## 3. Orphaned in Angular — declared, never called

| Endpoint | Declared | Status |
|---|---|---|
| `member/lab/vendors/:p/pricing` | `core/lab/lab.mapper.ts:26` | path valid, no caller |
| `member/diagnostics/vendors/:p/pricing` | `core/lab/lab.mapper.ts:42` | path invalid, no caller — see §1 |

Both are dead. Pricing arrives via `cartVendors`.

**Superseded 2026-08-09 — this table is a floor, not the list.** It was built from
the path-literal extractor, which only sees what it was pointed at.
`22-dead-endpoint-scan.mjs` scans every `*_API` map under `core/` and finds
**10** declared-but-uncalled endpoints, including two that are member-visible
(`CLINIC_BOOKING_API.invoice`, `LAB_API.cancelPrescription`) and a second instance
of the latent wrong-path shape below (`LAB_API.activeCart`, whose DIAGNOSTIC leg
points at the collection rather than a nonexistent `carts/active`). Full
classification in `23-three-detectors.md`; read that rather than this table.

### Extractor false positive (recorded so it is not re-reported)

`authenticated` at `core/session/session.store.ts:10,37,117` is **not** an endpoint.
It is a member of `type SessionState = 'unknown' | 'authenticated' | 'anonymous'`.
The extractor's prefix filter matched it. No finding.

## 4. Unconsumed API routes — 82

Cross-referenced against `web-member/` via `tools/parity-endpoints.mjs`. The
subset React calls and Angular does not is the highest-signal category in this
audit, and is listed first.

### 4a. Called by React, NOT declared in Angular — 16 (**missing features**)

| Endpoint | React caller | Screen | Severity |
|---|---|---|---|
| `video-consultations/join` | `lib/api/video-consultations.ts` | `/member/consultations/:id` | **BLOCKER** |
| `video-consultations/:p/status` | `lib/api/video-consultations.ts` | `/member/consultations/:id` | **BLOCKER** |
| `member/claims/:p/resubmit-documents` | `components/DocumentResubmissionForm.tsx` | `/member/claims/:id` | **GAP** |
| `payments` | `lib/transactions.ts` | payments / checkout | **GAP** |
| `payments/:p/complete` | `lib/transactions.ts` | payments / checkout | **GAP** |
| `wallet/update` | `lib/transactions.ts` | wallet debit on booking | **GAP** |
| `users/:p/dependents` | `lib/api/users.ts` | family / patient pickers | **GAP** |
| `member/profile/:p` | `lib/api/users.ts` | profile | **GAP** |
| `location/autocomplete` | `app/member/appointments/doctors/page.tsx` | doctor search | **GAP** |
| `location/reverse-geocode` | `app/member/appointments/doctors/page.tsx` | doctor search | **GAP** |
| `clinics/:p` | `app/member/vision/confirm/page.tsx` | vision confirm | **GAP** |
| `admin/lab/vendors` | lab + diagnostics vendor pages | vendor selection | **NOTE** — React member page calling an `/admin` route. Angular not porting it is defensible; confirm the vendor list is complete without it before calling this closed. |
| `member/benefit-components` | `app/member/benefits/page.tsx` | benefits | **NOTE** — 404s live; divergence #1 |
| `member/coverage-matrix` | `app/member/benefits/page.tsx` | benefits | **NOTE** — 404s live; divergence #1 |
| `member/wallet-rules` | `app/member/benefits/page.tsx` | benefits | **NOTE** — 404s live; divergence #1 |
| `wallet/balance${viewingUserId` | `app/member/transactions/page.tsx` | transactions | **NOTE** — extractor artefact of a template literal; Angular calls `wallet/balance` with the param |

### 4b. Vaccination — a complete API surface with no consumer — 8

```
GET    member/vaccination/services
GET    member/vaccination/vendors
GET    member/vaccination/vendors/:p/slots
GET    member/vaccination/bookings
GET    member/vaccination/bookings/:p
POST   member/vaccination/bookings/validate
PATCH  member/vaccination/bookings/:p/cancel
GET    member/vaccination/bookings/:p/invoice
```

RN ships the whole flow — `vaccination/index`, `select-patient`, `select-vendor`,
`select-slot`, `confirm` (5 screens). React has none. Angular has `PlaceholderPage`.

The placeholder itself is a recorded NOTE and not a defect. What *is* a finding is
that the API and a reference implementation both exist, so this is a fully
specified, fully buildable flow sitting unbuilt — size it from RN, not from scratch.

### 4c. Unconsumed, staff/doctor-owned — no member finding

`auth/doctor/*` (5), `doctors/:p/activate|deactivate|photo|set-password`,
`clinics/:p/activate|deactivate`, `specialties/:p/toggle-active`,
`members/*` and `users/*` admin CRUD (12), `payments/summary/stats`,
`video-consultations/doctor/history`, `location/test-geocode`.

Reachable by prefix, but they belong to the doctor and admin portals. No member
finding. Listed in full in `00-inventories/api-routes.md`.

### 4d. Unconsumed, member-owned — worth a decision each

| Endpoint | Note |
|---|---|
| `member/addresses/:p`, `member/addresses/:p/default` | Angular reads `member/addresses` but never edits or sets a default |
| `member/ahc/orders/:p`, `member/ahc/orders/validate` | AHC detail + pre-submit validation unused |
| `member/ahc/reports/:p/lab`, `member/ahc/reports/:p/diagnostic` | AHC report download unused |
| `member/claims/:p/documents`, `/documents/:p`, `member/claims/files/:p/:p` | claim document fetch/download unused |
| `member/diagnostics/orders/:p/cancel`, `/reports` | diagnostics order cancel + reports unused; the LAB equivalents are also absent |
| `member/lab/vendors/available`, `member/benefits/:p/lab-services` | unused |
| `member/digital-prescriptions/:p`, `/signature` | detail + signature unused |
| `appointments/:p/cancel`, `appointments/:p/confirm` | Angular has `appointments/:p/user-cancel` only |
| `notifications/:p` | single-notification GET unused (list + mark-read are used) |
| `vision-bookings/:p/complete-wallet-payment` | vision payment completion unused — check `VisionPaymentPage` closes its own loop |
| `member/benefits/CAT006/services`, `CAT007/services` | hardcoded-category routes; Angular uses the generic `member/benefits/:p/services` |

---

## Method note

**Correction (2026-08-07): these totals are a floor, not a ceiling.** The
"member-reachable" filter selects API routes by path prefix, and the prefix list
omitted `assignments`. The API serves 7 `assignments/*` routes, one of which
(`assignments/my-policy`) Angular declares at `core/member/member.mapper.ts:21`
and never calls — a third orphan, found via the wallet screen rather than via this
diff. Any other prefix absent from that list is similarly invisible here. No
finding above changes; the counts are understated by an unknown but small margin.

Path params are normalised to `:p` on both sides before comparison, so
`/wallet/balance/:memberId` and `/wallet/balance` remain distinct findings, but
`:memberId` vs `:userId` does not produce false drift.

`tools/param-drift.mjs` reports 9 endpoints where React sends params Angular may
not (`userId`, `limit`, `date`). Its own header calls the attribution heuristic —
params are collected per file, so a shared resource file masks real gaps. Those 9
are **not** promoted to findings here; they are carried into the per-screen files
in Phase 2 where the actual store call can be read.
