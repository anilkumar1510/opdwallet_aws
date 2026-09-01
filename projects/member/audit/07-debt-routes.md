# DEBT routes — re-derived, not inherited

Every prior figure for this was an estimate ("roughly 50", "~60"). This is the
derived number.

**Verified: 58 of the 60 `/member` routes have no approved spec covering them.**

## Why it could not be string-derived

The obvious method — grep the four specs for route paths and subtract — **returns
nothing.** `member-session`, `member-shell`, `member-family-context` and
`member-wallet` contain **zero** route paths between them. They are behaviour-scoped,
not route-scoped.

What they do name is screens, in prose:

| Screen named in the specs | Mentions | Route |
|---|---|---|
| the wallet screen | 11 | `/member/wallet` |
| the login screen | 10 | `/login` (top-level, not a `/member` child) |
| the member home screen | 6 | `/member` |

Everything else the specs describe is cross-cutting rather than route-owning: the
shell and its navigation, session termination, the not-found route, and the
family-member selector.

**Criterion used:** a route is spec-covered only if a spec names its screen. Stated
explicitly because it is a judgement, not a match — and it is the step where an
inherited count would have gone unexamined.

## The count

| | |
|---|---|
| `/member` children (from `00-inventories/angular-routes.md`) | **60** |
| Spec-covered: `/member` (home), `/member/wallet` | **2** |
| **DEBT** | **58** |

`/login` and the `/member/**` not-found wildcard are covered but sit outside the
60-route child count, so they do not change the subtraction.

## One correction to an earlier assumption

**`/member/family` is NOT spec-covered**, despite `member-family-context` existing.

That spec's presentation requirement scopes to *"the family-member selector"* —
the avatar menu in the shell — not to the family screen:

> **WHEN** the family-member selector is displayed
> **THEN** that dependent is listed with their name and the relationship in readable words

The `/member/family` screen is a separate list view that no scenario mentions. It
is DEBT. The *mechanism* it exercises (`FamilyStore`, `activeMember()`) is
specified; the *screen* is not.

Same distinction applies to notifications: `member-shell` specifies the badge as a
shell surface; the dropdown and the `/member/notifications` page are not specified.

## The 58

**Claims (3)** — `/member/claims`, `/member/claims/new`, `/member/claims/:claimId`

**Bookings (1)** — `/member/bookings`

**Lab (6)** — `/member/lab-tests`, `/lab-tests/upload`, `/lab-tests/cart/:cartId`,
`/lab-tests/cart/:cartId/vendor/:vendorId`, `/lab-tests/orders`, `/lab-tests/orders/:orderId`

**Diagnostics (6)** — `/member/diagnostics`, `/diagnostics/upload`, `/diagnostics/cart/:cartId`,
`/diagnostics/cart/:cartId/vendor/:vendorId`, `/diagnostics/orders`, `/diagnostics/orders/:orderId`

**Appointments — in-clinic (6)** — `/member/appointments`, `/appointments/specialties`,
`/appointments/doctors`, `/appointments/confirm`, `/appointments/select-patient`,
`/appointments/select-slot`

**Online consult (4)** — `/member/online-consult`, `/online-consult/specialties`,
`/online-consult/doctors`, `/online-consult/confirm`

**Vision (6)** — `/member/vision`, `/vision/clinics`, `/vision/select-patient`,
`/vision/select-slot`, `/vision/confirm`, `/vision/payment/:bookingId`

**Dental (5)** — `/member/dental`, `/dental/clinics`, `/dental/select-patient`,
`/dental/select-slot`, `/dental/confirm`

**AHC (3)** — `/member/ahc/booking`, `/ahc/booking/diagnostic`, `/ahc/booking/payment`

**Wellness (1)** — `/member/wellness`

**Policy & benefits (3)** — `/member/policy-details/:policyId`, `/member/benefits`,
`/member/benefits/:categoryId`

**Transactions & payments (4)** — `/member/transactions`, `/member/orders`,
`/member/orders/:transactionId`, `/member/payments/:paymentId`

**Records (1)** — `/member/health-records`

**Family (1)** — `/member/family` — see correction above

**Profile & misc (6)** — `/member/profile`, `/member/services`, `/member/health-checkup`,
`/member/helpline`, `/member/pharmacy`, `/member/settings`

**Notifications (1)** — `/member/notifications`

**Placeholder (1)** — `/member/vaccination` — routed to `PlaceholderPage` on purpose;
DEBT as a route, NOTE as an implementation

Total: 3+1+6+6+6+4+6+5+3+1+3+4+1+1+6+1+1 = **58** ✅

## Corroboration

The store-level count in `04-design-symbol-diff.md` §4 lands in the same place from
a different direction: **13 of 17 stores are unspecified (76%)**. Two independent
axes, same conclusion — the unspecified surface is most of the application, not a
fringe.

## Sub-classification: unspecified-and-working vs unspecified-and-dead

Not all DEBT costs the same to remediate. Known dead code inside the DEBT surface,
which is free to remove rather than expensive to specify:

| Item | Status |
|---|---|
| `features/shell/member-switcher.ts` | complete component, **never imported or rendered**. The working switcher is the profile-menu avatar. |
| `features/wellness/ahc-booking-page.ts:124` | injects `FamilyStore`, never uses it |
| `features/shell/member-shell.ts:214` | injects `FamilyStore`, never uses it |
| `core/lab/lab.mapper.ts:26,42` | both `vendorPricing` entries — declared, no caller; the diagnostics one also has a path the API does not serve |
| `core/member/member.mapper.ts:21` | `assignments/my-policy` — declared, no caller |
| `core/session/auth.ts` | `auth/refresh` — declared, no caller |

Different remediation from the rest of the list: deleting these needs no spec.

## Spec-authoring note — for task 7.4

**The four approved specs consistently constrain mechanisms and not surfaces.**
Concretely: `member-shell` specifies the notification **badge** but not the
dropdown or the `/member/notifications` page; `member-family-context` specifies
the family-member **selector** but not `/member/family`. Neither spec names a
single route path.

That is why two screens exist with no scenario governing them, and it is also why
the DEBT count above had to be derived by judgement rather than by matching.

**If the follow-up specs for the remaining verticals are written the same way, this
gap arrives at 58 routes' scale instead of two.** Worth settling the convention —
whether a spec owns screens or only behaviours — before writing them, not after.

## Not started, deliberately

No screen files for any of these. Per the standing instruction, they are a separate
campaign with a product decision attached, and writing 58 screen files before that
decision is made would be work performed against an unsettled scope.

**What the two BLOCKERs imply for this list:** both are last-mile omissions — state
computed centrally, then not consulted at the point of use. The active-member
defect in particular will recur on every one of the ~30 routes above that act on a
patient (claims, bookings, all four consult/clinic journeys, lab, diagnostics, AHC).
Fixing the pattern before building the remainder is worth more than auditing the
remainder.
