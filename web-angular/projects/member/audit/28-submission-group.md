# 28 — The submission group: one built, one blocked, one divergence to rule

**Session 39, 2026-08-09.** Two harnesses, deliberately separate:

| Harness | Writes? | Covers | Result |
|---|---|---|---|
| `03-live/verify-submission.mjs` | **yes** — one prescription per kind | Submitting an existing prescription | **4/6** — blocked, see below |
| `03-live/verify-submission-states.mjs` | no — both scenarios assert that no request is sent | the two refusal scenarios | **8/10** |

Session 37 claimed a vertical was fully exercised when this group was not. Two
files, each saying what it covers, is what makes that answerable next time.

## Step 1 — `submitExisting` is built, on the hub

`LAB_API[kind].submitExisting` had zero callers — the first member of the
declared-but-uncalled class found on purpose (`23-three-detectors.md`), and the
reason *Submitting an existing prescription* could not pass.

**Built to the reference's shape.** `web-member` opens a selector modal from the
lab hub and submits inside `handlePrescriptionSelect` (`lab-tests/page.tsx:100-140`).
Angular had kept the label and pointed it at `/member/health-records`, a browser
with no submit control. New shared component `features/lab/prescription-selector.ts`,
used by both hubs; the host keeps its own trigger (the two hubs style it very
differently) and calls `open()` on a template reference. **A submit control was
deliberately NOT added to the records browser** — the reference has no such flow.

**The payload was read at the send site, per the rule earned last session.**
`SubmitExistingPrescriptionDto` is **flat** — seven strings, `pincode` the only
optional one, `prescriptionDate` an `@IsDateString()`. No nested class, so the
`collectionAddress` trap does not apply here; that was confirmed rather than
assumed.

**Two things the reference gets wrong and this does not port:**

1. **`healthRecordId` is the Mongo `_id`.** The service does
   `findById(healthRecordId)` and then `new Types.ObjectId(...)`, so the business
   `PRES-…` reference would fail. `Prescription.id` carries `_id`;
   `Prescription.reference` does not. Checked before wiring — seventh instance of
   identifier duality, and the first checked *before* it cost anything.
2. **The reference sends `patientId: 'current'`, `patientName: 'Current Member'`,
   `patientRelationship: 'Self'`** with comments saying the backend resolves them.
   **It does not** — `lab-prescription.service.ts` stores all three verbatim, so
   the reference writes literal placeholder text into every record submitted this
   way. Angular sends the active family member, which is what `member-lab`'s
   patient Rule requires. This is the "reference is the criterion for intended
   behaviour, not for its defects" constraint applied literally.

Also added while wiring: the diagnostics hub had **neither** the success nor the
failure notice the lab hub carries, so a submission that failed would have said
nothing. Same one-site-of-four shape as `21-degraded-not-declared.md`, caught
before shipping rather than after.

## The scenario is BLOCKED, and not on work

**`shivam@` holds zero health records.** Both sources return empty:

```
GET member/digital-prescriptions -> 200, 0 rows
GET member/prescriptions         -> 200, 0 rows
```

Globally: `digitalprescriptions` has 4 rows, **none for this member**;
`doctorprescriptions` is **empty for everyone**.

**There is no member-side route that creates one.** The API serves no
`POST member/prescriptions` or `POST member/digital-prescriptions` — a health
record is written by a **doctor**, through `DigitalPrescriptionWriter` on the
doctor portal's appointment screen (`web-doctor/components/DigitalPrescriptionWriter.tsx:228`).

Attempted, following session 38's precedent of using the real UI rather than
seeding: the doctor portal starts, `anil@doctor.com` signs in (201), and
`anil@doctor.com` is the doctor on all of `shivam@`'s appointments — but the
appointment detail screen renders *"Failed to fetch appointment details"* for
both the business reference and the Mongo `_id`. **Not diagnosed further**:
`web-doctor` is read-only and is not this audit's subject.

**Deliberately not forced.** Serving a fixture to the records list would make the
selector render rows and the submit fire — and it would be a **false pass**, of
exactly the kind Step 3 warns about. The scenario's GIVEN is *"a member who
already holds a digital prescription"*; a member who holds none does not satisfy
it, and a green assertion over an unsatisfied precondition is the failure this
whole audit exists to prevent.

**What IS verified** (4 of 6 in the mutating harness, both kinds): the hub offers
the control, and it opens a chooser **in place** rather than navigating to the
records browser. The session-35 defect — a labelled control landing somewhere
that cannot perform the action — is fixed and observed fixed. Only the submit
itself is unobserved.

**Third item for the test-data request**, and it differs from the other two: the
AHC allowance and the dependent credential need seeding, this needs **a doctor to
issue a prescription to the test member** — an action with an owner and a UI,
like the ops digitize, not a DB write.

## The refusal scenarios: one passes, one is a divergence

**Unsupported or oversized file — passes, both kinds, both clauses.**
*"Upload a PDF or a clear photo (JPG, PNG or WebP)."*, the rest of the form
preserved (notes and date still populated), and no request sent. The form was
filled **before** the bad file was attached, so "preserved" is a real assertion
rather than a check on an empty form.

**Incomplete submission is refused — clause 2 passes, CLAUSE 1 FAILS, both kinds.**

> #### Scenario: Incomplete submission is refused
> - **THEN** submission is refused with a message naming what is missing ← **fails**
> - **AND** no request is sent ← passes

Observed: the submit button is **disabled** and no message appears anywhere on the
screen. `canSubmit()` (`upload-prescription-page.ts:241-248`) requires file,
patient, address and a chosen date; below that threshold the control is simply
inert.

**The reference names what is missing**, at
`web-member/app/member/lab-tests/upload/page.tsx:213-231` — four `alert()` calls:
*"Please select a file"*, *"Please enter patient name"*, *"Please select
prescription date"*, *"Please select an address"*. Its button is enabled and it
validates on submit.

**This is an interaction-model divergence, and it is not mine to rule.** Angular
prevents the attempt; the reference permits it and explains the refusal. There is
precedent for Angular diverging deliberately here — parity entry 10 sanctions
*"pickers commit on tap, not select-then-Continue"* on the same kind of ground.
But the two models differ in what the member learns:

- **disabled** — the member sees an inert button and must work out which of four
  fields is at fault;
- **validate-on-submit** — the member is told, which is what the spec transcribed.

The scenario as written is also **unreachable** under the disabled model: it says
*"WHEN they attempt to submit"*, and no attempt is possible.

**Not fixed, filed for a ruling.** Either sanction the divergence and amend both
specs to describe the disabled control, or port the reference's behaviour in
Angular's idiom — an inline message naming the missing fields, not an `alert()`,
which is presentation and would not be ported either way. The standing rule when
a visible-behaviour choice has two defensible answers is to report rather than
pick, and that has held every time it has been tested.

## Consequence for 8.2 and 8.4

**Both stay open**, on two scenarios rather than three:

| Scenario | State |
|---|---|
| Uploading a new prescription | verified, session 38 |
| Submitting an existing prescription | **built; blocked on a doctor-issued record** |
| Incomplete submission is refused | **fails clause 1 — divergence, awaiting a ruling** |
| Unsupported or oversized file | **verified, session 39, both clauses, both kinds** |

Eleventh and twelfth time the rule has held. Neither remaining item is work on the
portal: one needs data with an owner, one needs a decision.
