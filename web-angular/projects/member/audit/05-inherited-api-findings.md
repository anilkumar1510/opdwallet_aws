# Inherited API findings — for whoever owns `api/`

**These are not migration defects and must not be read as one.** They live in
`api/`, and React, RN, and Angular inherit them equally. They are filed outside
the parity matrix so they neither dilute the migration findings nor get closed
along with them.

Surfaced incidentally while auditing the Angular member portal. `api/` was read
only; nothing in it was modified. (`api/.env` was changed once, under explicit
instruction, to shorten a token TTL for a spike, and restored — see
`progress.md`.)

---

## 1. [HIGH] The session JWT has no revocation path

**The most serious thing this audit has surfaced, in any repo.**

| Fact | Evidence |
|---|---|
| Token is a stateless JWT | `api/src/modules/auth/auth.service.ts:117-145` |
| TTL is **7 days** | `api/.env:10` — `JWT_EXPIRY=7d`, consumed at `api/src/config/configuration.ts:15` |
| No denylist, blocklist, or revocation of any kind | `grep -rn -i "blacklist\|denylist\|revoke\|invalidate" api/src/modules/auth/**` → **no matches** |
| Sign-out is cookie-clearing only | `api/src/modules/auth/auth.controller.ts:101-111` — the handler calls `res.clearCookie(...)` and returns `{message:'Logged out successfully'}`. There is no server-side effect whatsoever. |

### Consequence

**Signing out does not end a session — it only stops that browser from sending
the cookie.** The token itself stays valid for the remainder of its 7 days. Any
copy that exists elsewhere — captured in transit, read from a shared or stolen
device, pulled from a log, or held by anyone who obtained it once — keeps working,
and there is no mechanism to stop it. Not for one user, and not for all users
short of rotating `JWT_SECRET`, which signs everyone out at once.

This is a security property, not a UX one, and it is invisible from every
frontend. All three portals call the same `POST /auth/logout` and all three
"succeed".

It also has a corollary the audit hit directly: **a rejected session could not be
produced for testing without shortening the TTL**, because there is no supported
way to invalidate a token. A system that cannot revoke a credential also cannot
be tested against revocation.

### Worth deciding

Short TTL plus a refresh token, or a server-side denylist keyed on `jti`. Both
are standard; which one fits depends on whether the API can carry per-request
state. **Note `POST /auth/refresh` already exists on the API and is declared but
never called by the Angular portal** — the refresh half of the first option may be
partly built already.

Not this audit's call. Flagged, evidenced, handed over.

## 2. [MEDIUM] Assignment dates are not validated against their policy's dates

### Observed live

`GET /api/member/profile` as `shivam@gmail.com`:

```
[0] Shivam  Jha     assignment 2026-06-19 → 2027-06-16   policy 2026-06-18 → 2027-06-30
[1] Sayani Kumari   assignment 2026-06-19 → 2027-07-19   policy 2026-06-18 → 2027-06-30
```

Both members sit under the same policy. Sayani's assignment ends **19 days after
the policy that funds it**. Shivam's sits inside its policy window.

**It is not systematic** — one of two rows overhangs. That rules out a deliberate
policy-wide grace period and points at an unvalidated write.

### Confirmed in the source

`api/src/modules/assignments/assignments.service.ts:30-35` validates exactly two
things on create:

```ts
if (!effectiveFrom || !effectiveTo) {
  throw new BadRequestException('effectiveFrom and effectiveTo dates are required');
}
if (new Date(effectiveTo) <= new Date(effectiveFrom)) {
  throw new BadRequestException('effectiveTo must be after effectiveFrom');
}
```

Presence, and internal ordering. **The policy's own `effectiveFrom` / `effectiveTo`
are never compared against**, even though the service populates exactly those
fields when reading (`assignments.service.ts:212,232,248`). So an assignment may
be written that starts before its policy begins, ends after its policy ends, or
sits entirely outside it, and the API will accept all three.

### Consequence

The member-facing wallet screen sources its cover period from the assignment, so
an overhanging assignment is shown to the member as cover. Sayani would be told
her cover runs to 2027-07-19 while the policy funding it stopped on 2027-06-30.

Whether that is wrong depends on what an assignment outliving its policy is
*meant* to mean — which is the same open question driving task 6.4. See
`06-wallet-policy-period.md`. **A frontend cannot resolve this**; a rule at the
write boundary can.

### Question for the API owner

Is an assignment extending beyond its policy period valid? If yes, what does it
mean for funding. If no, this needs a validation rule alongside the two that
already exist, and the existing row is data to correct.

## 3. [OPEN QUESTION] Can the API emit the shapes 6.11's scenarios specify?

6.11's five seeded scenarios were verified by serving fixtures through Playwright
route interception, with shapes built from the real DTO field names in
`core/wallet/wallet.dto.ts`. That verifies **how the portal renders a given
response** — which is what those scenarios specify — but **nothing confirms the
API can emit them**. Specifically: an unrecognised category code (`CAT999`), and
`isFloater: true` with a populated `memberConsumption[]`.

If the API cannot produce those shapes, the scenarios specify behaviour for states
that cannot occur — correct code defending against nothing. Worth one answer from
whoever owns `api/`; no frontend change either way.

## 4. [COMPLIANCE] A third-party geocoder receives member location, from the client

`web-member-rn/app/member/vaccination/select-vendor.tsx:195-200` calls
**`https://nominatim.openstreetmap.org/reverse`** directly from the device, as a
fallback after the API's own geocode call fails (`:188`).

Filed here rather than in the parity register deliberately: this is **live
production behaviour in RN today**, not a migration decision, and the person who
should see it owns compliance and will never read a parity register.

- **Privacy** - member location leaves your infrastructure to a third party under
  no contract. In a health portal that is plausibly a compliance question rather
  than an engineering one.
- **Availability** - Nominatim rate-limits by IP and its usage policy is
  restrictive. A fallback path can look fine in testing and fail under real load.
- **Unnecessary** - the API already serves `location/geocode`,
  `location/autocomplete` and `location/reverse-geocode`.

**Question for the API team: were those three location endpoints built as the
replacement for this, and RN never adopted them?** All three are unconsumed by
every portal (`01-endpoint-diff.md` §4), and three unused endpoints covering
exactly the fallback's job is suggestive rather than coincidental.

### Update 2026-08-31 — answered, and the third bullet above needs qualifying

The Angular portal now consumes all three (`core/location/`, wired into the
in-clinic doctor list). Two corrections to what is written above.

**"Unnecessary — the API already serves `location/geocode`…" is too strong.**
Those endpoints call **`nominatim.openstreetmap.org` themselves**, server-side:
Google Maps is off unless `ENABLE_GOOGLE_MAPS=true` with a real key, and the
constructor logs *"Using OpenStreetMap Nominatim for geocoding"* by default
(`api/src/modules/location/location.service.ts:33-38`). Adopting them is a real
improvement on both counts this finding raises — member coordinates leave one
server rather than every device, and the rate limit lands on one IP rather than
the fleet — but the **third-party dependency itself is unchanged**. Anyone
closing this finding on the strength of "we use our own endpoints now" is
closing it on a misreading.

**A second, unrelated exposure in the same module.**
`GET /api/location/test-geocode` carries **no `@UseGuards`** while its three
siblings all carry `JwtAuthGuard` (`location.controller.ts:10`). Its own comment
says *"Test endpoint without auth - can be removed after testing"*. It is an
unauthenticated proxy to the geocoder, reachable by anyone who can reach the
API. Nothing consumes it.

**Not portable.** Angular has no equivalent and should not gain one; if the API's
geocoder is insufficient, that is a backend fix, not a client-side reach past it.

## 5. [HIGH — needs an ops decision] Payment-first booking creation, and completed payments with no booking

### The architecture

`web-member-rn/app/member/payments/[paymentId].tsx:428-636` creates the booking
**after** payment, for **eight** service types: `DENTAL` `:428`, `VISION` `:451`,
`IN_CLINIC_APPOINTMENT` `:468`, `LAB` `:495`, `DIAGNOSTIC` `:513`, `AHC` `:531`,
`ONLINE_CONSULTATION` `:607`, `VACCINATION` `:636`. The booking is created at
`:678` and the payment marked paid at `:687`.

Parity register **entry 5** records the opposite for `web-member`: *"Payment
completion does not create the booking."* RN contradicts it **portal-wide**.

Payment-first means a payment can succeed with no booking behind it. Booking-first
fails safe; payment-first fails expensive — the member is charged and has no record
to point at.

### The signature is present in the database

Queried **read-only** on 2026-08-07. Nothing was written.

**Positive control passed first:** the join was proven able to match a known-good
pair (`vision_bookings` `VIS-BOOK-1769701879987-3994` -> `payments._id
697b848a6e8a037f523ea3b9`) before any non-match was trusted. This matters — an
empty result from a broken join is indistinguishable from a clean system.

**The first query over-reported and was discarded.** Joining on
`booking.paymentId` flagged 32 payments, but `lab_orders`, `diagnostic_orders` and
`ahc_orders` have **no `paymentId` field at all**, so their "orphans" were an
artifact of an impossible join. That result confirmed the hypothesis, which under
rule 4 is a reason to distrust it, so it was re-run independently.

**Independent check** — matching each completed payment to any booking for the same
`userId` by slot, service or payment reference:

| Service type | Completed payments | Matched to a booking | **Unmatched** |
|---|---|---|---|
| VACCINATION | 2 | 0 | **2** |
| VISION | 7 | 4 | **3** |
| DENTAL | 23 | 18 | **5** |

**10 completed payments with no booking**, totalling **₹5,800**.

| Service | Date | Amount | User (suffix) |
|---|---|---|---|
| VACCINATION | 2026-07-21 | ₹250 × 2 | `387002` |
| VISION | 2026-01-29 | ₹600 × 3 | `1f4332` |
| DENTAL | 2026-01-28 | ₹700 × 5 | `1f4332` |

The vision and dental orphans are one user across two consecutive days — a burst,
not a scatter. The vaccination pair is a different user six months later.

### The incident window — the most useful thing to hand production

Combining §5 and §8, the **13 unmatched COMPLETED payments (₹6,520)** are not spread
evenly. Ten of them fall in three consecutive days:

| Date | Service | Rows | User |
|---|---|---|---|
| 2026-01-28 | DENTAL | 5 | `…1f4332` |
| 2026-01-29 | VISION | 3 | `…1f4332` |
| 2026-01-30 | APPOINTMENT | 3 | `…829a0d` |

Three consecutive days, **three service types, two users**. The vaccination pair
(2026-07-21) sits six months later and outside the window.

**This is neither steady leakage nor one bad flow.** Three independent booking paths
failing the same way inside 72 hours is what you would expect if the common factor
is **the payment step** rather than any individual journey. The three
`PAY-20260130-004x` rows are the clearest case: one member, ₹720, **no appointment
on any date**, stable across 24h / 72h / 7d windows.

**Whether 2026-01-28 to 2026-01-30 corresponds to a deploy, an outage, or a payment
gateway change is a question for whoever holds that history — and it is the single
most useful thing to hand them alongside §7's query.** If production shows the same
burst shape, look for an incident in that window. If it shows a scatter, the
architecture is leaking continuously.

### What this is and is not

**It is not proof of production loss.** This is the local seeded database restored
from `mongodb-dump-latest`, so these rows may be test debris from manual QA rather
than real members losing money.

**It is proof the failure mode occurs.** The rows exist, they are `COMPLETED`, and
they have no booking — which is exactly the shape payment-first produces. Whether
the same query against production returns rows is the question, and it is a
one-command answer for whoever has access.

~~`APPOINTMENT` could not be checked~~ — **RETRACTED 2026-08-07, see §6.** It can
be checked, via `payments.serviceReferenceId -> appointments.appointmentId`. The
`booking.paymentId` direction is absent, which is what I mistook for "no link in
any direction". 28 of 59 resolve; the rest fail for a different and more
interesting reason.

**Also corrected in §6:** `lab_orders`, `diagnostic_orders` and `ahc_orders` are
**not** unjoinable either. All four of their completed payments resolve cleanly by
`serviceReferenceId`. Their appearance in the discarded 32-row result was purely
the artifact it was called.

### Why this is filed here and not in the parity register

The parity register is read by people porting flows. This is a defect in shipped
software that needs a reader who owns production. **Any future port of any paid RN
journey inherits this architecture** — that sentence is the one that matters in six
months when someone ports orders or payments and meets the same screen.

For the migration itself the ruling is unchanged and sufficient: **do not port**,
all eight service types.

## 6. [MEDIUM] `payments.serviceReferenceId` is polymorphic across **at least three** write paths

Filed separately from §5 because it has a different owner, a different fix and a
different lifetime. It is a **data-model** gap: it survives the migration, RN's
retirement, and the do-not-port ruling. Nothing in the current plan touches it.

> **Scope correction 2026-08-07 — this is not an APPOINTMENT bug.** At least
> **three** write paths put the wrong kind of id in this field:
>
> | Service type | Shapes held | What the majority actually is |
> |---|---|---|
> | `APPOINTMENT` | **11** | one resolves (`APT#`); the rest include cart references |
> | `DENTAL` | 2 | **29 raw ObjectIds** vs 2 `DEN-BOOK-…` |
> | `VACCINATION` | 2 | **5 slot ids** (`VSLOT-…`) vs 2 booking ids (`VAXBK-…`) |
>
> APPOINTMENT is where it is **most visible, not where it is unique.** A fix scoped
> to appointments leaves dental's ObjectIds and vaccination's slot ids in place —
> and the previous framing of this section invited exactly that scoping. The common
> cause is that each writer stores whatever id it happened to hold.
>
> **Contamination remains one-directional** — only APPOINTMENT holds foreign-domain
> (`CART-…`) references. So `serviceType` is **unreliable as a partition but not
> decorative**, and that distinction survives this reframing.

### Two corrections to §5, both mine

1. **APPOINTMENT is joinable.** Last session I reported it "could not be checked"
   because `appointments` has no `paymentId`. The link exists in the other
   direction — `payments.serviceReferenceId -> appointments.appointmentId` — and
   resolves **28 of 59** completed payments.
2. **lab / diagnostic / AHC orders are joinable and clean.** All four of their
   completed payments resolve by `serviceReferenceId` (1/1, 2/2, 1/1). They are not
   a missing-link problem at all.

### The actual finding

Within the single `serviceType: 'APPOINTMENT'`, `serviceReferenceId` holds **ten
distinct value shapes**. Only one resolves:

| Shape | Resolves? |
|---|---|
| `APT#` | **yes** — 28 rows |
| `PAY#`, `APPT_#`, `ONLINE_APPT_#`, `REF-#` | no |
| `CART-#-…` (4 variants), `DIAG-CART-#-…` (2 variants) | no — these are **cart** references filed under an appointment `serviceType` |

One field, one service type, ten schemas. Any join written against it is correct
for a subset and silently wrong for the rest — which is exactly how a payment
reconciliation report comes back clean.

### It is not 31 orphans — checked, per rule 4

31 rows fail the join. That number matches the hypothesis, so it was checked
independently: **25 of the 31 have an appointment for the same user within 24
hours.** They are not missing bookings; they are payments whose reference points at
something other than the appointment.

**6 rows have no appointment for the same user within 24h.** That warrants
inspection. It is *not* established as orphaned — a wider window or a different
owner could account for them — and it is deliberately not added to §5's total.

### Why this matters more than the ten rows

§5's ten orphans are a **floor established through one usable join**. The join that
found them works on three service types. On the largest one it works on 47% of
rows, and the failures are invisible unless someone notices that ten reference
formats went in.

The fix is small in either direction — a payment reference on the appointment, or a
consistent `serviceReferenceId` contract — which is precisely why it needs to be a
filed item and not a footnote. Footnotes do not get done.

## 7. Production query — runnable spec

For whoever has production access. Read-only. Do not re-derive it.

**Step 1, required: prove the join before trusting it.** Pick a booking that has a
`paymentId` and confirm the payment exists. An empty result from a broken join is
indistinguishable from an empty result from a clean system, and this audit hit that
failure five times.

```js
// POSITIVE CONTROL — must return a document before proceeding.
const b = db.vision_bookings.findOne({ paymentId: { $ne: null } });
db.payments.findOne({ _id: ObjectId(b.paymentId) });
```

**Step 2: the join that works.** Match each COMPLETED payment to any booking for the
same user, by slot, service or payment reference. **Do not** join on
`booking.paymentId` — that direction over-reported threefold locally, because three
order collections do not carry the field.

```js
const MAP = {
  VACCINATION: 'vaccination_bookings', VISION: 'vision_bookings',
  DENTAL: 'dental_bookings', LAB_ORDER: 'lab_orders',
  DIAGNOSTIC_ORDER: 'diagnostic_orders', AHC_ORDER: 'ahc_orders',
  APPOINTMENT: 'appointments',
};
// for each serviceType: COMPLETED payments where no booking for that userId
// matches on slotId | serviceId | paymentId | <collection's own id> === serviceReferenceId
```

**Step 2b: `serviceType` is not a reliable partition — do not sum the slices.**
`CART-…` and `DIAG-CART-…` values sit under `serviceType: 'APPOINTMENT'`, so a
per-type run picks up rows that are not appointments, and the DIAGNOSTIC run may be
missing rows that are. **Per-service-type totals therefore do not necessarily sum to
the true total.** Run the partitions for triage, but compute any headline number
from a single unpartitioned pass over COMPLETED payments.

**Step 3: read APPOINTMENT's result with §6 in hand.** It will under-report. A
clean APPOINTMENT result means "the join resolved what it could", not "appointments
are fine". Report matched and unmatched counts separately, and bucket unmatched
rows by `serviceReferenceId` shape.

### Baseline for comparison

Local seeded DB, 2026-08-07: **10 unmatched COMPLETED payments, ₹5,800** —
VACCINATION 2/2, VISION 3/7, DENTAL 5/23. LAB, DIAGNOSTIC and AHC clean.

**The shape is diagnostic.** Vision and dental orphaned for **one user across two
consecutive days** — one bad session, not steady leakage. If production shows the
same burst shape, look for an incident. If it shows a scatter, look for the
architecture.

**What the local rows do and do not show:** not that members lost money — this is a
seeded QA database. They show the failure mode **completes**. A COMPLETED payment
with no booking is the terminal state payment-first produces, and it occurred in a
database nobody was trying to break.

## 8. Closing out the six unresolved APPOINTMENT rows — 3 remain, and they have a signature

Widened the window as planned. Read-only.

| Window | Unresolved |
|---|---|
| 24h | 6 |
| 72h | **3** |
| 7 days | **3** (stable) |

Three resolved to an appointment slightly outside 24h. **Three do not resolve at any
window**, and they are not ambiguous:

| Payment | Date | Amount | Reference | User |
|---|---|---|---|---|
| `PAY-20260130-0043` | 2026-01-30 | ₹240 | `REF-1769796803034` | `…829a0d` |
| `PAY-20260130-0044` | 2026-01-30 | ₹240 | `REF-1769797061498` | `…829a0d` |
| `PAY-20260130-0046` | 2026-01-30 | ₹240 | `REF-1769797521773` | `…829a0d` |

**That user has zero appointments, on any date.** So this is not a window problem or
a reference-shape problem — three COMPLETED payments, ₹720, for a member who never
had an appointment.

### The cluster is the interesting part

Combined with §5, the unmatched rows fall in a three-day window:

| Date | Service | Rows | User |
|---|---|---|---|
| 2026-01-28 | DENTAL | 5 | `…1f4332` |
| 2026-01-29 | VISION | 3 | `…1f4332` |
| 2026-01-30 | APPOINTMENT | 3 | `…829a0d` |

**Three consecutive days, three service types, two users.** That reads as an
incident window rather than steady leakage — which is the shape §7 says is
diagnostic. The vaccination pair (2026-07-21) sits six months later and outside it.

### Revised totals

**13 unmatched COMPLETED payments, ₹6,520** — the 10 in §5 plus these 3. The
question is now closed rather than open-ended: every one of the original 31
APPOINTMENT non-matches is accounted for as resolved-at-a-wider-window,
resolved-to-a-nearby-appointment, or listed individually above.

## 9. Directionality of the reference contamination — one-directional

Checked with a positive control (the classifier was proven to recognise a known
`APT000001` -> `APT#` before being trusted on unfamiliar shapes).

**Only `APPOINTMENT` holds references from other domains** — the four `CART-…` and
two `DIAG-CART-…` shapes. Every other service type stays within its own domain. So
this is **a bug in one write path, not a decorative `serviceType`**, and §6 stands
as written rather than needing to be reframed.

One related observation, short of contamination: two service types carry **two
schemes of their own**, which is why joins under-match there —

- `DENTAL` - 29 rows hold a raw ObjectId-shaped value, 2 hold `DEN-BOOK-#-#`.
- `VACCINATION` - 5 hold a **slot** id (`VSLOT-…`), 2 hold a booking id (`VAXBK-…`).

Same root cause as §6: the field holds whatever id the writing path happened to
have. APPOINTMENT is the worst instance at eleven shapes, not the only one.

## 10. [MEDIUM] `POST /member/ahc/orders/validate` is an unfinished endpoint

`api/src/modules/ahc/controllers/ahc-member.controller.ts:190-206` passes **six
`null` services** into `validateOrder`:

```ts
// TODO: Inject dependencies when module is updated
const ahcPackageService = null;      // AhcPackageService
const labVendorService = null;       // this.labVendorService
const diagnosticVendorService = null;// this.diagnosticVendorService
const assignmentsService = null;     // this.assignmentsService
const planConfigService = null;      // this.planConfigService
const copayCalculator = null;        // this.copayCalculator
```

The handler is routed and returns `{ success: true, data: validation }`, so it
looks implemented from the outside.

### The member-visible consequence

Every other booking journey in this portal shows the member what a booking will
cost them **before** they commit — the wallet-covered amount and the amount they
pay. Lab, diagnostics, vision and dental all specify it as a requirement.

**AHC cannot.** The endpoint that computes that split does not work, so a member
commits to an annual health checkup without seeing what comes out of their wallet,
where every other journey shows them first.

### Why this is filed here and not against Angular

It is not a gap in the portal. It is an **unfinished endpoint being called by a
flow that needs it** — the AHC commit path is buildable around it (order creation
returns `walletDeduction`, `copayAmount` and `finalPayable`, so the split can be
shown *after* creation on a `PENDING` order), but "after" is not what the other
journeys do and not what a member expects.

**Wiring the six services is the fix, and it is yours.** Until then the AHC spec
will record the pre-commitment split as deferred rather than omitting the
requirement — omission would read as "AHC does not need one", which is false.

## 11. [LOW — documentation] `process-payment` requires a bill that the portal cannot generate

Found verifying vision, which is the entry-5 conformance case AHC's commit design was
built from.

A vision booking created through the portal cannot be paid immediately:

```
POST /api/vision-bookings/VIS-BOOK-1786184922451-5672/process-payment
400 "Bill has not been generated for this booking"
```

**The ordering is exactly as recorded** — the booking is created first (`201`), the
payment screen is keyed by the existing `bookingId`, and no booking is created during
payment. Entry 5 conformance holds and was confirmed live.

**What was missing from the record is a precondition:** payment is possible only once
a **bill exists**, and nothing in the member portal generates one. That is an ops or
clinic-side step. So the member-visible journey is
*book -> wait for a bill -> pay*, not *book -> pay*.

Not a defect — the API is refusing correctly. Filed here because it is a fact about
the API's workflow that the portal cannot discover on its own, and because it slightly
weakens the AHC analogy: AHC's spec is written against "vision's payment path", and
that path has a precondition AHC has no equivalent for.

### Questions for the API owner

Both are workflow questions the portal cannot answer by reading code, and both
change a design that is otherwise ready to build.

> **ESCALATED 2026-08-10.** Question 1 is no longer hypothetical. A real AHC order
> on the test account (`AHC-ORD-1786182053508-8GHNX7JM9`) is `PLACED` with
> `copayAmount: 240`, `paymentStatus: PENDING` and **no `paymentId`** — a committed
> order owing ₹240 with no payment record anywhere and no way to settle it from the
> portal. The payment leg cannot be built until this question is answered, because
> the answer decides whether it waits for a bill or creates a payment immediately.
> `14-ahc-commit-contract.md`.

1. **Should AHC payment be gated on a bill, as vision's is?** If bills exist for
   AHC orders as an ops step, the AHC payment leg should wait for one rather than
   create a payment immediately, and `14-ahc-commit-contract.md`'s design changes.
   If they do not, AHC is a genuinely different shape and its spec should say why.
   Entry 5 is unaffected either way.

2. **Who collects the copay that `POST dental-bookings` and `POST appointments`
   create?** Unlike vision, those two create a PENDING copay payment *on create*
   (`dental-bookings.service.ts:586,608`, `appointments.service.ts:572,704,805`)
   and the member portal's journey ends without routing to it — fourteen such rows
   have accumulated on the test account during this audit. If an ops or clinic
   process settles them, the portal is right to stop where it does and should say
   so. If the member is expected to pay at the gateway, the portal is missing the
   leg. Detail and controls: `audit/20-copay-continuation.md`.


---

## Finding 12 — `createOrder` has no cart-status gate (lab and diagnostics)

**Filed 2026-08-09, session 38.** Raised for the `api/` owner because the portal
cannot fully close it.

`LabOrderService.createOrder` / `DiagnosticOrderService.createOrder` validate that
the cart exists, the vendor exists and the slot is free. **Neither checks the
cart's status.** A cart already marked `ORDERED` will produce a second order.

**Member-visible consequence:** a member who reaches a consumed cart URL is shown
a fully live cart — vendor selection, slot picker, an enabled *Confirm booking*,
a correct wallet split — and can order the same tests again.

**Why the current safety is not a safeguard.** It holds by two accidents:
`findByUserId` filters the member's list to `CREATED`/`REVIEWED`, and the hub is
today the only place that builds a cart URL (`cartLink()` falls back to
`/member/bookings` when the cart is not listed). Neither is a status check. Any
new entry point to a cart URL — a notification deep link, an email, a bookmark, a
recent-activity row — re-exposes it with no change to the cart screen.

**Recommendation:** refuse `createOrder` when the cart is not `CREATED` or
`REVIEWED`. The portal can add its own gate to the cart screen, but only the API
can make the duplicate impossible.

**Not driven to a terminal state**, deliberately: confirming it would place a
second real order against the only diagnostics order this audit has. Evidence is
the observed affordance plus a read of the service's own validation sequence.

---

## Finding 13 — the appointments list omits every payment field

**Filed 2026-08-09, session 41.** Raised for the `api/` owner; the portal cannot
work around it.

`GET /api/appointments/user/:userId` returns, across all 27 rows on the test
account, exactly one money field: `consultationFee`. There is no `copayAmount`,
no `totalMemberPayment`, no `walletDebitAmount`, no `paymentStatus`, no
`paymentId`.

The sibling endpoints return all of them on the same kind of list call:

```
GET dental-bookings/user/:id  -> billAmount, copayAmount, insuranceEligibleAmount,
                                 insurancePayment, excessAmount, totalMemberPayment,
                                 walletDebitAmount, paymentMethod, paymentId, paymentStatus
GET vision-bookings/user/:id  -> the same set
GET appointments/user/:id     -> consultationFee
```

**Member-visible consequence.** `POST appointments` settles the wallet and creates
a PENDING payment for any copay, shortfall or out-of-pocket amount. The member is
returned to their bookings, and that row **cannot** name what they still owe,
because the data to render it is not in the response. Session 41 added exactly
that disclosure for dental and vision; consultations are blocked here.

**Scale:** of the fourteen unsettled copays criterion 6 found on the test account,
**twelve are consultations.** This omission covers the larger share of the
problem.

**What would fix it:** return the payment fields the dental and vision list
endpoints already return. No new endpoint, no new call from the portal — the row
is already rendered and already reads other fields off the same object.

**Verified read-only:** `audit/03-live/probe-appt-keys.mjs` prints the union of
keys across every row, so a field present on only some rows would still be seen.
