# 23 — Three detectors for "renders but cannot complete"

**Written:** 2026-08-09, session 36.
**Why this file exists:** the three detectors were built one at a time, each after
an instance was found by accident. Together they cover a taxonomy that is now
closed, and the taxonomy transfers to any migration of this shape. This is meant
to be readable by someone who has never seen this audit.

## The failure being detected

A journey that is **routed, rendered, navigable and visually finished, whose
terminal step cannot commit.** Nothing marks it unbuilt. It is the failure mode
that survives review, because every artifact a reviewer normally looks at — the
route table, the component, the endpoint map, the store — is present and correct.

It arises from migration specifically: a screen is ported faithfully, including
the control that starts an action, and the action's wiring is left for later.
The control is evidence that the author knew about the feature, which is exactly
why it reads as finished.

## The taxonomy

| Shape | What it looks like | Detector |
|---|---|---|
| No commit path anywhere in the feature | a whole journey with no write | grep for writes in the feature (`18-write-sweep.mjs`) |
| Writes on one branch, silently cannot on another | a shared screen where one mode works | terminal-state verification (section 9, criterion 5) |
| Declared but never called | an endpoint in the API map with no caller | `22-dead-endpoint-scan.mjs` |

**Each detector is blind to the other two shapes**, and that is the point of
having three rather than a better one:

- The **write sweep** counts writes per feature. It found AHC (0 writes) and
  cannot see ONLINE, whose feature issues two writes and fails on one branch. It
  also cannot see `submitExisting`: `lab` issues 3 writes, so the store looks
  healthy.
- **Terminal-state verification** is the only thing that catches the ONLINE
  variety, and it is the most expensive of the three. It sees a control only if a
  scenario drives it — so it misses anything whose scenario was never written or
  never ran, which is how `submitExisting` survived.
- **Dead-endpoint scanning** is static and near-free, and it is the only one that
  finds a lost action *before* anyone tries to use it. It cannot see ONLINE
  (whose endpoint has live callers on the other branch) and cannot see a feature
  that never declared the endpoint at all.

The two expensive detectors run per vertical. The two static ones run over the
whole repo in under a second, so there is no reason not to run them on every
vertical as well.

## Detector 3 — method and its limits

`22-dead-endpoint-scan.mjs`. Pulls every plain-identifier key out of each
`export const *_API = {…}` under `core/`, then looks for `.key` anywhere in
`src/` outside the file that declares it. Computed keys (`[LabKind.Lab]:`) are
branch selectors, not endpoints, and are skipped. Keys are grouped by name, so
one live caller on the LAB branch redeems the DIAGNOSTIC one — which is
deliberate: a shared journey's two legs are one endpoint for this purpose.

**Conservative by construction.** A bare `.key` search over-counts uses
(`store.orders()` looks like `API.orders`), so the scan can miss a dead endpoint
but should not invent one. Everything it flags is then read by hand — the scan
locates candidates; it does not classify them.

### It got that wrong on the first run, and the control is what caught it

The first run reported **12** dead endpoints. Two of them —
`RECORDS_API.digitalDownload` and `uploadedDownload` — are called, at
`prescription.mapper.ts:57` and `:79`. The self-use filter discarded any line
matching `^\s*<identifier>\s*:`, intending to skip the key's own declaration, and
so also discarded every real use sitting in an object literal:

```ts
downloadPath: dto.prescriptionId ? RECORDS_API.digitalDownload(dto.prescriptionId) : null,
```

Fixed by anchoring the exclusion to *that key's* declaration
(`^\s*${key}\s*:`) rather than to any property line. A second negative control
was added for the exact shape that failed — **a key whose only caller sits inside
its own declaring file** — and the run now reports 10.

Worth recording plainly: **"will not invent one" was a claim in the file's own
header, and it was false on the first run.** It was caught by reading the flags
rather than by trusting the header. The negative control that would have caught
it did not exist until after it happened, which is the ordinary case — a control
is usually written from the failure it missed.

## Run of 2026-08-09 — 66 endpoint keys, 10 with no caller

All three controls pass. The 10 are **not one class**. Read individually:

| Flag | Class | Status |
|---|---|---|
| `LAB_API.submitExisting` | **action lost in the move** — control kept, wiring dropped | known, session 35 |
| `CLINIC_BOOKING_API.invoice` | **action lost in the move** | **NEW — see `17-…md`** |
| `LAB_API.cancelPrescription` | **feature not ported** — no control exists | **NEW** |
| `BOOKINGS_API.ongoingByUser` | feature not ported | already filed — GAP, `02-screens/shell-nav.md` |
| `AUTH_API.refresh` | **no flow anywhere**, reference included | already filed — DEBT, `02-screens/session-lifecycle.md` |
| `LAB_API.vendorPricing` | **latent wrong path** | already filed — `01-endpoint-diff.md` §1, §3 |
| `LAB_API.activeCart` | latent wrong path | **NEW** |
| `MEMBER_API.myPolicy` | orphan | already filed — `01-endpoint-diff.md` method note |
| `BOOKINGS_API.dentalClinics` | **stale duplicate** — superseded declaration | **NEW, trivial** |
| `BOOKINGS_API.visionClinics` | stale duplicate | **NEW, trivial** |

Four sub-classes, not one, and only two of them are member-visible. **A dead
endpoint is a symptom with several causes, and treating the scan's output as a
defect list would have produced four wrong fixes.**

### The two that matter

**`CLINIC_BOOKING_API.invoice` — the member is told an invoice exists and given no
way to get it.** Full write-up in `17-renders-but-cannot-complete.md`. The same
shape as `submitExisting` and the strongest argument for this detector: nothing
else in the audit would have found it, because no scenario mentions invoices.

**`LAB_API.cancelPrescription` — a feature the reference has and Angular does
not.** The reference cancels a submitted prescription from the bookings screen
(`web-member/app/member/bookings/page.tsx:851-852`, both prefixes, inside the
prescription-detail modal). Angular declares both routes and has **no cancel
control on any prescription** — the only "Cancel" string under `features/lab/` is
a back-link on the upload form (`upload-prescription-page.ts:177`). Filed as a
**GAP**, not a defect: the affordance was never ported, so nothing lies to the
member. It is not in `member-lab`, which specifies submission but not withdrawal.

### The three that are not findings, stated so they are not re-reported

**`LAB_API.activeCart` is the second instance of the `vendorPricing` latent
shape**, and it fails differently:

```ts
[LabKind.Lab]:        activeCart: 'member/lab/carts/active',    // real route
[LabKind.Diagnostic]: activeCart: 'member/diagnostics/carts',   // the COLLECTION
```

`GET member/lab/carts/active` exists in the route table; there is no diagnostics
equivalent, and the declaration quietly points at the list instead. So whoever
wires "resume your active cart" gets one cart on LAB and **the whole list** on
DIAGNOSTIC — no 404, no error, a silently wrong result. That is worse than
`vendorPricing`'s 404 and harder to notice, for the same structural reason: the
lab leg gets exercised first.

Neither is worth fixing now, and **neither should be closed by deleting the dead
code** — the LAB path is the one the API serves and the DIAGNOSTIC one records
where the gap is. Note also that the reference never calls `carts/active` either;
it labels a plain `GET carts` as "active carts" (`lab-tests/page.tsx:85-86`), so
Angular's DIAGNOSTIC declaration matches the reference's behaviour and its LAB
declaration does not.

**`BOOKINGS_API.dentalClinics` / `visionClinics` are stale duplicates.** The same
two URL strings are declared again in `CLINIC_BOOKING_API[area].clinics`
(`clinic-booking.ts:23,39`), and that pair is what the store actually calls
(`clinic-booking.store.ts:191`). Nothing is missing and no member sees anything;
two lines in `booking.mapper.ts:27-28` are simply dead. Deletable whenever
`booking.mapper.ts` is next touched — not worth a commit of its own.

## What the taxonomy is worth to the next migration

Run all three from the start, not after the instances turn up:

1. **The write sweep on day one.** It is one grep per feature and it finds whole
   journeys that cannot commit. AHC sat unnoticed through eight verticals.
2. **The dead-endpoint scan on every commit.** It is free, and it catches an
   action lost in the move *at the moment it is lost*, when the author still
   remembers the control they ported. Both instances here were found months late
   and by accident.
3. **Terminal-state verification per vertical, interleaved with transcription.**
   Expensive, irreplaceable, and the only one that sees a branch-level failure.
   The standing rule that transcription and verification must interleave exists
   because of this detector's cost profile.

And the meta-rule this file is an instance of: **each detector was written from a
failure the previous ones could not see.** Do not expect one check to cover the
class. Expect to add one every time something is found by accident, and write
down what the new one is blind to.

---

## Detector 5 — an effect that writes a signal it also reads (session 42)

The taxonomy is no longer three. This one is a different axis from the first
four: those find **a capability that was never wired**; this finds **a wiring
that fights the member**.

| Shape | Detector |
|---|---|
| No commit path anywhere | grep for writes in the feature (`18-write-sweep.mjs`) |
| Writes on one branch, silently can't on another | terminal-state verification |
| Declared but never called | `22-dead-endpoint-scan.mjs` |
| An input no route supplies | `27-route-input-sweep.mjs` |
| **An effect that writes what it reads** | **`30-effect-self-write-scan.mjs`** |

Why it earned a slot: the shape appeared three times, and the prose rule written
after the first occurrence did not stop the third. Full account and the four
sites it found in `31-run-budget.md`.

**The pattern across all five is now unmistakable.** Every one of them was written
after an instance was found *by accident*, and **every one of them shipped with a
false positive caused by matching syntax rather than structure** — the self-use
filter that discarded object-literal calls, the `data: { mode }` shorthand, the
`[queryParams]="{…}"` template binding, and now an expression-bodied `effect()`
plus a read inside `.then()`.

That is five for five. The detectors are still worth having — each found real
defects nothing else could see — but **a detector's first run should be treated as
a list of candidates to read, never as a list of findings.** Three of the five
would have produced wrong reports if their first output had been trusted.

---

## Two rules that generalise past this project (session 43)

Both were earned the same way — by a failure that a piece of prose had already
been written to prevent.

> **A detector's first output is a candidate list, never a findings list.**

Five detectors, five first-run false positives, every one from matching syntax
rather than structure: an object-literal call discarded as a declaration; a
`data: { mode }` shorthand with no colon; a `[queryParams]="{…}"` template
binding that is not `queryParams: {…}` in TypeScript; an expression-bodied
`effect()` with no block; a read inside `.then()` that is not a tracked
dependency. Three of the five would have produced wrong reports had the first
output been trusted. Read every flag before it becomes a finding.

> **The test for a method rule is what would run it.**

Two prose rules failed to prevent the exact recurrence they were written for —
the schema rule between AHC and lab, the effect rule between the ONLINE contact
number and the upload form. Both were accurate; both were descriptions of a past
incident; both were followed by the same mistake in a different feature. Both
worked once mechanised. If the answer to "what would run this rule?" is "the
reader remembers", it is a reminder, and reminders decay.

A third, from the same session, belongs beside them: **controls expire too** —
see `10-assertion-provenance.md`. All three are the same failure at different
altitudes: a check that exists but is never executed against the thing it was
written to protect.
