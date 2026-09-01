# 36 — The invoice download, and the two things that nearly went wrong

**2026-08-10.** Brief: *"fix the api but dont change flow."*

Of the endpoints the API integration audit found declared-but-never-called, this
one had no defensible reason to stay dead. `/member/bookings` rendered the bare
label **"Invoice available"** beside a booking, `CLINIC_BOOKING_API[area].invoice`
was declared with zero callers, `hasInvoice` was already mapped from
`invoiceGenerated`, and the reference showed exactly how to fetch it
(`web-member/app/member/bookings/page.tsx:761-793`).

**The screen named a document the portal could not produce.** That is the
`21-degraded-not-declared.md` family — an assertion the app's own capabilities
contradict.

**Not a flow change:** no new screen, no new destination, no new step. A control
on a row that already existed, next to a claim it already made.

---

## Two defects this fix would have introduced, caught before shipping

### 1. `hasInvoice` means two different things

| Mapper | What sets `hasInvoice` | What it actually is |
|---|---|---|
| `serviceBookingToBooking` (`:262`) | `dto.invoiceGenerated === true` | an invoice |
| `labOrderToBooking` (`:152`) | `order.reportCount > 0` | **reports** |

So the row said **"Invoice available"** for a lab order that has **reports**, and
gating a download on `hasInvoice` would have fired the **vision/dental** invoice
route for a **lab** order — a cross-vertical request for a document that does not
exist, on the strength of a flag that means something else.

Fixed by not reusing the flag: `invoicePath` is a separate field, set **only**
where an invoice route exists. The lab row's label was corrected to **"Reports
available"**, which is what it always meant.

### 2. `invoiceGenerated` alone is not enough

The API refuses anything but COMPLETED:

```ts
// dental-bookings.service.ts:1256, and vision the same
if (booking.status !== 'COMPLETED') {
  throw new BadRequestException('Invoice is only available for completed bookings');
}
```

And the database contains exactly the row that breaks the naive gate:

```
VIS-BOOK-1769701879987-3994  CONFIRMED  invoiceGenerated=true
```

A button on that row could only ever fail. `invoicePath` requires
`invoiceGenerated === true && code === 'COMPLETED'`.

**Both of these were found by reading the data and the service before wiring the
call, not by review afterwards.** The first is the more instructive: a shared
boolean whose meaning depends on which mapper filled it in reads as safe at the
call site, where the mapper is out of sight.

---

## What cannot be verified here, and why it is not a defect

**No invoice PDF exists on this machine.** Every stored path is a macOS absolute
path from the original developer's machine:

```
/Users/nitendraagarwal/opdwallet_aws/api/uploads/invoices/dental/invoice-INV-DEN-…pdf
```

and `api/uploads/invoices/dental/` and `.../vision/` are both **empty**. So
`res.sendFile` has nothing to send, and every download on this machine 500s.

Two consequences, and the second is the useful one:

1. **The happy path — a PDF arriving — is unverifiable locally.** Not asserted.
   It is a fixture condition, not portal behaviour, and pretending otherwise
   would be the kind of green run this audit exists to distrust.
2. **The failure path is not hypothetical, it is what this machine does.** So
   *"the failure is disclosed to the member"* is the assertion that matters, and
   it is verified.

**Nor is it verifiable against real data as another member.** All eight invoiced
bookings belong to `all@gmail.com` or `random@gmail.com`, and `all@gmail.com`
does not take the shared test password (`401`). Test-data ask below.

---

## Verification

`03-live/verify-invoice-download.mjs` — **13/13**, non-mutating, **spends no run
budget**. The dental/vision/lab list responses are intercepted so all four cases
sit on one screen; the gate under test is Angular's and runs unmodified.

| | Assertion |
|---|---|
| positive | the fixture reached the screen (a title only it has) |
| ✔ | COMPLETED + `invoiceGenerated` renders a download control |
| ✔ | the previously-dead endpoint is called, with the `DEN-BOOK-…` business id |
| ✔ | no Mongo `_id` in the request |
| ✔ | a 500 is **told to the member**, not swallowed |
| ✔ | the control returns to its resting label rather than staying pending |
| negative | a COMPLETED booking with no invoice offers nothing |
| negative | **CONFIRMED + `invoiceGenerated` offers no control** — the API's rule |
| negative | **a lab order with reports offers no download and reads "Reports available"** |
| ✔ | the invoice endpoint is hit exactly once, by the one control that offers it |

**Two harness faults worth recording, both of which produced misleading output:**

- **The first run reported the fixture screen as "Could not load."** The
  interception returned `{success, data}`, but `BookingsStore.service()` maps the
  response body directly with no unwrapping — while `labLike()` *does* unwrap an
  envelope. **Two response shapes in one store.** A wrong-shaped interception
  fails as a load error, which reads exactly like a defect in the thing under
  test.
- **The lab assertion first passed vacuously** — *"neither label present (no
  report-bearing order on this account)"*. A flag that only misbehaves when set
  cannot be cleared by an account that never sets it. Replaced with a fixture
  carrying `reports: [...]`, which turns the negative control into a real one.

---

## Also in this change

**Two stale duplicate declarations deleted** — `BOOKINGS_API.dentalClinics` and
`visionClinics`, superseded by `CLINIC_BOOKING_API[area].clinics` and unreferenced.
Two declarations of one path is the shape `22-dead-endpoint-scan.mjs` exists to
flag.

**Dead-endpoint count: 9 → 6.** Remaining: `LAB_API.activeCart`,
`LAB_API.cancelPrescription`, `LAB_API.vendorPricing`, `MEMBER_API.myPolicy`,
`BOOKINGS_API.ongoingByUser`, `AUTH_API.refresh`. None is a screen making a claim
it cannot honour, which is what separated the invoice from the rest.

**Three stale contradictions in `member-dental/spec.md` corrected.** The session-50
copay ruling was recorded in one scenario but three other places still called it
open — including two **adjacent scenarios with the same GIVEN/WHEN sending the
member to two different destinations**. The disclosure scenario is now keyed on
viewing the list rather than on creating the booking, which is what it always
described.

**`member-vision/spec.md` gained a bookings-list requirement.** It had none; the
shared behaviour was specified only under dental, where a reader of the vision
spec would not have found it.

---

## Test data this needs

Add to the standing ask in `31-run-budget.md`:

- **A COMPLETED dental or vision booking owned by `shivam@gmail.com` with an
  invoice file that exists on disk.** Without it the download's happy path stays
  unverified — the one assertion this document cannot make.
- Alternatively, the password for `all@gmail.com`, who already owns four.

## What a reader should NOT conclude

**Not that invoices now work.** They are now *reachable* — the portal asks the
right endpoint for the right booking and tells the member when it fails. Whether
a PDF comes back depends on a file this machine does not have.

**Not that the dead-endpoint list is a defect list.** Six remain and none was
fixed here, because none of them has a screen asserting the capability. That
asymmetry is the whole reason this one was chosen and the others were not.
