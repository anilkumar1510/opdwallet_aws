# RN-only screens — severity `UNSCOPED`

## The new severity

> **`UNSCOPED`** — present in `web-member-rn/` with no React counterpart.
> Structurally invisible while building against React as the reference — not
> skipped, not a defect. Blocked on a product decision: does "replace
> `web-member-rn`" include the RN-only surface, or was it always shorthand for
> the overlapping part?

Filed separately from `GAP` so they do not dilute it. A `GAP` is functionality
the team meant to have and does not. An `UNSCOPED` item is functionality nobody
has decided about yet.

## Headline: 26 RN-only routes, but only 6 are absent functionality

`tools/parity-inventory.mjs` compares **URLs**. RN uses different route names for
several flows Angular already ships in full, so the raw count of 26 overstates
what is missing by more than 3×.

| Class | Routes | What it means |
|---|---|---|
| **Naming variant** — RN URL differs, Angular ships the flow | **19** | No missing functionality. URL divergence only. |
| **Resolved** — Angular route now exists | **1** | `notifications`, built 2026-08-07 |
| **Absent functionality** | **6** | The real UNSCOPED surface |

## Full mapping — all 26

### Naming variants (19) — no functionality missing

| RN route | Angular equivalent | Evidence |
|---|---|---|
| `/member/in-clinic-consultation` | `/member/appointments` | 1:1; Angular loop `mode: IN_CLINIC` |
| `/member/in-clinic-consultation/specialties` | `/member/appointments/specialties` | loop leg |
| `/member/in-clinic-consultation/doctors` | `/member/appointments/doctors` | loop leg |
| `/member/in-clinic-consultation/select-patient` | `/member/appointments/select-patient` | explicit route |
| `/member/in-clinic-consultation/select-slot` | `/member/appointments/select-slot` | explicit route |
| `/member/in-clinic-consultation/confirm` | `/member/appointments/confirm` | loop leg |
| `/member/online-consultation` | `/member/online-consult` | loop `mode: ONLINE` |
| `/member/online-consultation/specialties` | `/member/online-consult/specialties` | loop leg |
| `/member/online-consultation/doctors` | `/member/online-consult/doctors` | loop leg |
| `/member/online-consultation/confirm` | `/member/online-consult/confirm` | loop leg |
| `/member/pathology-lab` | `/member/lab-tests` | `kind: 'LAB'` |
| `/member/pathology-lab/upload` | `/member/lab-tests/upload` | |
| `/member/radiology-cardiology` | `/member/diagnostics` | `kind: 'DIAGNOSTIC'` |
| `/member/radiology-cardiology/upload` | `/member/diagnostics/upload` | |
| `/member/health-packages` | `/member/health-checkup` | both call `member/ahc/eligibility` + `member/ahc/package` — verified by grep on `health-packages.tsx` |
| `/member/wellness-programs` | `/member/wellness` | RN screen makes no API calls; static |
| `/member/ahc` | `/member/ahc/booking` | RN screen makes no API calls; static hub |
| `/member/pathology-lab/booking/:p` | — | **already counted as a GAP**, not UNSCOPED: React has `/member/lab-tests/booking/[cartId]` too |
| `/member/radiology-cardiology/booking/:p` | — | **already counted as a GAP**: React has `/member/diagnostics/booking/[cartId]` too |

The last two rows are listed for completeness of the 26 but belong to the React
GAP list — they are not RN-only in substance, only in name.

### Resolved (1)

| RN route | Angular | Status |
|---|---|---|
| `/member/notifications` | `/member/notifications` | built 2026-08-07; see `02-screens/notifications.md` |

### Absent functionality (6) — the real UNSCOPED surface

| RN route | Angular | Note |
|---|---|---|
| `/member/vaccination` | `PlaceholderPage` | |
| `/member/vaccination/select-patient` | — | |
| `/member/vaccination/select-vendor` | — | |
| `/member/vaccination/select-slot` | — | |
| `/member/vaccination/confirm` | — | |
| `/member/carts` | — | combined lab + diagnostics cart list. RN calls `/member/lab/carts` **and** `/member/diagnostics/carts` on one screen (verified by grep on `carts.tsx`). Angular consumes both endpoints but only ever per-kind, from `lab-tests/cart/:cartId` and `diagnostics/cart/:cartId`. No combined list screen exists. |

## Vaccination — fully specified, fully unbuilt

The only RN-only *feature*. It is not a research problem:

- **API is complete and live** — 8 endpoints, all unconsumed:
  `member/vaccination/{services,vendors,vendors/:p/slots,bookings,bookings/:p,bookings/validate,bookings/:p/cancel,bookings/:p/invoice}`
- **A reference implementation exists** — 5 RN screens covering the whole journey.
- **Angular has a deliberate placeholder** (`app.routes.ts:328`), which is a
  recorded NOTE and correct as it stands.

Size it from RN, not from scratch. This is the single largest buildable item in
the UNSCOPED set and the only one with no design work outstanding.

## The product decision this is blocked on

Everything above reduces to one question: **does "replace `web-member-rn`" include
the RN-only surface?**

The answer is much cheaper than the raw count suggests. If the answer is yes, the
work is **vaccination (5 screens) + a combined carts list (1 screen)** — not 26.
Everything else RN has, Angular already ships under a different URL.

If URL parity with RN matters (deep links, push-notification payloads, anything
holding a stored RN route), that is a separate and much smaller question: 19
redirect entries, no new screens. See the `online-consult` NOTE in
`02-screens/login.md` and `progress.md`.
