# 31 — The audit's run budget, and a fourth defect class

**Session 42, 2026-08-09.** No mutating work. One measurement, one detector, and
a dependency that would be discovered too late.

## The sequencing dependency — a decision against a resource

**This is the item most likely to be found after the resource is gone, so it is
written as a dependency and not as a note.**

> ~~The copay continuation must be ruled while `verify-consultations.mjs` can
> still run.~~ **DISCHARGED — ruled and verified in session 50, on one run.**
> CAT001 has **one** run left; the dependency this section existed to flag was
> met with budget to spare.

- `verify-consultations.mjs` books one IN_CLINIC (CAT001) and one ONLINE/LATER
  (CAT005) per run.
- **CAT001 In-Clinic: ₹600 remaining, ₹300 per booking → 2 runs.**
- **CAT005 Online: ₹900 remaining, ₹300 per booking → 3 runs.**
- The binding constraint is **CAT001, at two runs.**

Measured from `wallet_transactions`, not estimated: eighteen ₹300 CAT005 debits
and sixteen CAT001 debits in the last forty transactions.

**Why it matters specifically here.** That harness is what would verify a
continuation ruling, and **twelve of the fourteen accumulated copays are
consultations**. If the ruling arrives after the second run, there is nothing left
to verify it against — the decision would land and be unverifiable in the same
week.

**Two ways out, and they must be chosen before the fact:** rule the continuation
now, or refresh CAT001/CAT005 first. Doing neither and running the harness twice
more spends the budget on re-confirming what is already known.

## The four categories, measured

| Category | Remaining | Per booking | Runs left |
|---|---|---|---|
| CAT006 Dental | ₹200 of ₹3,000 | ₹400 | **0 — spent** |
| CAT001 In-Clinic | **₹300** of ₹3,000 | ₹300 | **1** — one spent verifying the ruling, session 50 |
| CAT005 Online | **₹600** of ₹3,000 | ₹300 | 2 — one spent, session 50 |
| CAT004 Pathology / CAT007 Vision / CAT008 Wellness | full | — | unaffected |

CAT006 was spent by this audit's own seven dental bookings across sessions 33,
34, 40 and 41.

## The request is now a resource-refresh request, not a seeding request

Four items, and they do not go to the same person. Asking for the allowances
piecemeal — dental this week, consultations next — is how a request gets
deprioritised, so **CAT001, CAT005 and CAT006 are one ask.**

| Item | Unblocks | Kind |
|---|---|---|
| A member with an unused AHC allowance | AHC transcription | never-ran |
| A dependent credential | 5.8 *"dependent signs in directly"*, open since session 12 | never-ran |
| A doctor-authored digital prescription for `shivam@` | *Submitting an existing prescription*, both kinds | **an action with an owner and a UI — not a seed.** `DigitalPrescriptionWriter` on the doctor portal |
| **Refreshed CAT001, CAT005 and CAT006 allowances** | the dental create leg now; consultations within two runs | **capacity the audit itself consumed** |

The fourth is the only one caused by the audit rather than absent from the
fixtures, and it is the only one that will recur — every verification run of a
booking journey spends real entitlement.

### A CONDITION on the refresh, not a fifth item

> **If the test account is reseeded, `PAY-20260808-0188` must survive — or every
> criterion-6 positive control dies simultaneously.**

Every criterion-6 harness proves it can see a real obligation by finding that one
payment. It is a **single point of failure across the audit's most productive
detector**: criterion 6 is what found the twelve orphaned consultation copays, and
without a positive control its "no unexplained pending payment remains" result
means nothing — a query that silently returns nothing looks identical to a clean
run.

There is **no cheap substitute.** A synthetic payment is not queryable through the
same path, so the control cannot be re-anchored to a fixture the way the
dead-endpoint and write-sweep controls were. That is why this is a constraint on
how the refresh is done rather than a request for more data: refreshing the
category allowances is wanted, reseeding the account wholesale is not.

If it cannot survive, say so before the reseed — the harnesses need a different
anchor chosen deliberately, not discovered afterwards.

## Two varieties of harness self-limitation, and only one has a mitigation

Session 26 recorded the first. This is the pair, because treating them as one
thing is what left the second unbudgeted.

> **A harness that mutates shared state is not repeatable by default. Where the
> mutation is a *collision*, a selection strategy recovers it. Where the mutation
> *consumes a finite entitlement*, nothing does — the harness has a total run
> budget, and that budget should be known before it is spent.**

| | Collision | Entitlement |
|---|---|---|
| Example | a slot another run took | CAT006 dental, the AHC yearly allowance |
| Recoverable in-harness? | **yes** — `slot-picker.mjs` retries | **no** |
| Cost of ignoring it | a run fails, retry succeeds | the harness stops working, permanently |
| What to do | write the retry | **count the runs before starting** |

The practical consequence: **before building a harness that books, divide the
category allowance by the per-booking debit and write the number down.** Dental
had seven runs in it. Nobody counted, and the eighth failed.

**A first for this audit: a measurement that is gone rather than stale.**
`verify-dental.mjs` reported 14/18 in session 41 and reports 7/9 now. The earlier
number was accurate when taken and cannot be reproduced until the allowance is
refreshed. The banner in that file says so, and says which nine of the eighteen
still run — "7/9" alone does not.

## Detector 5 — an effect that writes a signal it also reads

`30-effect-self-write-scan.mjs`. Overdue: the shape has appeared three times, and
**the method rule written after the first occurrence did not prevent the third.**

The failure mode: an effect that writes a signal it also reads re-runs on its own
write. "Prefill only if empty" is not a guard — the member clears the field, the
effect re-runs, and the value comes straight back. The field cannot be emptied.
In session 41 that was not cosmetic: the upload form's address could not be
cleared, so the refusal scenario could not be driven and the form **uploaded a
real prescription instead of refusing.**

**Second time a prose method rule has failed this way**, after the schema rule
between AHC and lab. Both were descriptions of a past incident rather than
something checkable. The lesson is not "write better rules" — it is that a rule
which cannot be run is a reminder, and reminders decay.

### Controls, and the two false positives that were fixed before reporting

All four controls pass. Two false positives from the first run were corrected —
both were the scanner knowing syntax but not structure, the same family as the
previous three detectors:

1. **A phantom row at `vendor-booking-page.ts:305`.** An expression-bodied
   `effect(() => this.store.select(...))` has no block, so scanning for the next
   `{` swallowed the *following* effect and attributed it to the wrong line. Now
   paren-matched when there is no block.
2. **`appointment-confirm-page.ts` `laterDate`.** The read sits inside a
   `.then()`. Angular tracks only what is read synchronously, so writing what you
   read in a promise callback does not re-trigger. Not a defect. Now excluded, and
   reported in a separate bucket rather than silently dropped.

**A control was also wrong, and that is worth more than the false positives.** The
first version asserted the scan must find the ONLINE contact number. It does not —
session 25 fixed that one by latching on a class field **and no longer reading
`contactNumber()` at all**, so it is genuinely not self-referential any more. The
control asserted that a fixed thing stays broken. Corrected, with the reason kept
in the file header.

That also surfaces something useful: **there are two valid remedies** — latch the
prefill, or stop reading the signal you write. Session 25 took the second, session
41 the first. Either breaks the loop.

### STOP CONDITION — four unguarded sites

Every one read by hand before reporting; none is inferred from the scan alone.

| Site | Signal | What the member cannot do |
|---|---|---|
| ~~`claims/new-claim-page.ts:297`~~ | `patientId` | **FIXED session 43** — and it was NOT member-reachable; see below |
| `clinic-booking/clinics-page.ts:114` | `pincode` | clear the pincode to search a different area |
| `lab/vendor-booking-page.ts:308` | `addressId` | clear the collection address |
| `wellness/ahc-booking-page.ts:147` | `pincode` | clear the pincode |

`new-claim-page.ts:297` is **line-for-line the upload patient prefill** fixed in
session 41 — the same two lines, in a different feature.

**Corrected in session 43, after fixing it: identical code, different exposure.**
The upload form's address select carries a blank *"Select an address"* option, so
a member could clear it and the effect refilled it — that is what let the form
upload a prescription instead of refusing. The claims patient select is built from
the family list with **no blank option** (verified live: two options, neither
empty). A member cannot clear it, so the loop was never reachable from the UI.

The fix stands — it removes a latent hazard and the inconsistency — but it is a
correctness fix, not a member-visible one. Worth stating because "line-for-line
the same code" is a claim about the code and says nothing about whether anyone can
get to it. Same distinction the audit has had to make about specs and controls:
the artifact being identical does not make the consequence identical.

### `vendor-booking-page.ts:308` — a guard and the defect that hides it, in one file

**The most valuable thing the scan found, and it is a pair, not a single defect.**

- **Session 38** added an `addressBlocked` guard to `vendor-booking-page.ts`: a
  home collection with an incomplete address is refused before the request, with
  the missing parts named, instead of showing the API's raw validator text.
- **Line 308 of the same file** carries an unguarded prefill effect on
  `addressId`. It reads the signal it writes, so the address cannot be cleared —
  the effect puts the default straight back.

**Therefore the member cannot reach the guard.** To trigger it they must present
an incomplete address; the only route to that is clearing or blanking the
selection; the effect prevents exactly that. The guard is correct code that
cannot execute, and its own file contains the reason.

**Neither half looks wrong on its own.** The guard reads as careful defensive
work. The prefill reads as a convenience. Nothing in the file, and no review of
either change, would surface the interaction — **it took a mechanical scan of a
property neither author was thinking about.** That is the argument for detectors
in one sentence: they find relationships between changes, which is what review of
a diff structurally cannot do.

Exactly the same shape as `member-lab`'s "GIVEN a cart" in
`10-assertion-provenance.md`: something that passes because the condition it
guards can never arise. There the check was a spec scenario; here it is a
runtime guard.

**Not fixed this session** — `vendor-booking-page` sits in the lab ordering
journey, whose harness needs a digitized cart, so the fix could not be verified.
Filed with the pairing stated so whoever fixes the effect knows to re-verify the
guard in the same pass.

**Not fixed** — four sites is a class, and the stop condition says report first.
The remedy is known and one line each; two of the four sit in journeys whose
harnesses are out of budget, so fixing them now would produce changes that cannot
be verified this week. That sequencing is the same dependency this file opens
with.

---

## Added 2026-08-10 (session 52) — invoice fixtures

**A COMPLETED dental or vision booking owned by `shivam@gmail.com`, with an
invoice file that actually exists on disk.**

Every one of the eight invoiced bookings in this database belongs to
`all@gmail.com` or `random@gmail.com`, and `all@gmail.com` does not take the
shared test password (`401` on login). Worse, every stored `invoicePath` is a
macOS absolute path from the original developer's machine —
`/Users/nitendraagarwal/opdwallet_aws/api/uploads/invoices/...` — and both
`api/uploads/invoices/dental/` and `.../vision/` are **empty** here.

**So the invoice download's happy path cannot be verified on this machine by any
means.** `36-invoice-download.md` asserts the failure is disclosed, which is what
this machine really does, and does not assert that a PDF arrives.

Either fixture unblocks it: a file on disk for a booking `shivam@` owns, or the
password for `all@gmail.com`.

---

## Spent 2026-08-10 (session 53)

**One UPLOADED lab prescription cancelled** — `PRES-1786270759436-WO6QCXLBG`, by
`03-live/verify-api-integration-fixes.mjs`. Six of the original seven remain, plus
five diagnostic. **Replenishable** through the upload flow, unlike a CAT
allowance; recorded so the count is not later mistaken for a data problem.

**No AHC run spent** — none was available. Eligibility reports
`isEligible: false, "Already booked AHC for this policy year"`, so the copay leg
built this session is verified by forced branch only. Test-data item 1 (an unused
AHC allowance) is now blocking a *verification*, not just a *build*.

**A lab or diagnostic CART for `shivam@gmail.com`.** Both `member/lab/carts` and
`member/diagnostics/carts` return `[]`, so the vendor screen — and with it the
per-test pricing rows added in session 53 — cannot be reached by any harness.
A cart appears when a prescription is digitised, so digitising one of the
member's UPLOADED prescriptions would unblock it.
