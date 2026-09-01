# FamilyStore census

Replaces the "roughly 30 of 58" estimate with a count.

**Result: 23 injectors. The defect queue is 2, not 30.**

## Positive controls — asserted before reading results

| Control | Expectation | Result |
|---|---|---|
| A | census finds `appointment-patient-page.ts` (injects, never reads — the known defect) | **found** (1) |
| B | census finds at least one correct reader — `wallet.store.ts` | **found** (1) |

Both pass, so an empty or small result set is a real measurement rather than a
broken check. This mattered: the answer came back far smaller than the estimate,
which is exactly the shape a broken grep produces.

## 1. Injects and reads `activeMember()` — correct, no action (17)

**Stores (6):** `bookings`, `claims`, `lab`, `records`, `transactions`, `wallet`
**Features (11):** `new-claim-page`, `family-page`, `home-page`,
`upload-prescription-page`, `vendor-booking-page`, `settings-page`,
`profile-page`, `member-switcher`, `profile-menu`, `wallet-page`,
`ahc-payment-page`

## 2. Injects, never reads, but receives the patient from upstream — correct (2)

| File | Why it is fine |
|---|---|
| `features/appointments/appointment-confirm-page.ts` | takes `patientId` as a route input (`:145`) and resolves the display name from `family()`. It acts on the patient *chosen* in the prior step, which is what it should do. |
| `features/clinic-booking/confirm-booking-page.ts` | same shape (`:160`) |

A confirm step must honour the explicit choice, not the active member. Reading
`activeMember()` here would be the bug.

## 3. Injects, never reads, and acts on a patient — the queue (2)

| File | Route |
|---|---|
| `features/appointments/appointment-patient-page.ts` | `/member/appointments/select-patient` |
| `features/clinic-booking/select-patient-page.ts` | `/member/vision/select-patient`, `/member/dental/select-patient` |

Both render `family.family()` as an undifferentiated list of links and neither
consults `activeMember()`.

**Two files, not thirty.** Per the brief's own instruction to let the count decide:
a shared resolver / base class / store-level selector would be over-engineering at
this size. Direct fixes are correct — *if* a fix is warranted at all, which §5
below re-opens.

## 4. Dead injections — note, do not fix (2)

| File | Finding |
|---|---|
| `features/wellness/ahc-booking-page.ts:124` | `private readonly family = inject(FamilyStore)` — `grep -n family` returns only the import and this line. Never used, in code or template. |
| `features/shell/member-shell.ts:214` | `protected readonly family = inject(FamilyStore)` — same. Never referenced, including in its inline template. |

Unused dependencies. Harmless at runtime, but they are why a naive
"injects FamilyStore" count overstates the exposure by 2.

## 5. Correction — the BLOCKER escalation was wrong, and this census is how I found it

Last session I re-filed the patient preselect **DRIFT → BLOCKER**, reasoning that
the flow "completes with wrong data". **Reading the reference properly shows that
is not what happens.** Correcting it here rather than acting on it.

**React** (`web-member/app/member/appointments/select-patient/page.tsx`):

| Line | Behaviour |
|---|---|
| `:39` | `selectedPatient` is component state |
| `:104-108` | auto-selects the patient matching `viewingUserId`, commented *"PRIVACY: Auto-select patient based on currently viewed profile"* |
| `:185,189` | clicking a card **sets selection**; `isSelected` drives styling |
| `:238-243` | a separate **Continue** button commits, `disabled={!selectedPatient}` |

**Angular** (`appointment-patient-page.ts:39-47`): each patient is an
`<a routerLink>` that navigates straight to `select-slot` with
`patientId: member.id`. There is no selection state and no Continue button.

**Therefore Angular cannot complete with the wrong patient.** There is no default
to be wrong — every booking requires an explicit tap on a named person. React is
the flow where inattention can commit a pre-filled choice; Angular is not.

**Correct severity: GAP** — the reference's privacy-motivated auto-selection is
absent. Not a BLOCKER: nothing completes with wrong or lost data.

### The larger finding this exposes

Angular's select-patient **removed a step the reference has**. React is
select → Continue (two actions, one reversible); Angular is tap-to-commit (one
action, immediately navigating). That divergence is not on the list of three
sanctioned divergences, and it was not previously recorded anywhere in this audit.

This has a consequence for Step 3 as written: "add a preselect" is not
implementable against Angular's current flow, because **preselection is meaningless
without a commit step to preselect into**. Restoring the reference's behaviour
means restoring selection state and a Continue button — a visible flow change on
two screens.

That is a decision, not a mechanical fix, so it is reported rather than made.

### Consequence for task 5.8

My earlier live run recorded *"Switching the active member"* as FAILING on this
screen. That call now looks wrong too. The scenario's clause is "every screen
subsequently presents that dependent's data" — and a patient picker's purpose is
to present the **whole family** so one can be chosen. React presents the whole
list as well; it merely defaults the selection. Treating the picker as a screen
that must show only the active member's data would make the screen impossible to
use.

**5.8's status is therefore unresolved rather than failed**, and it should not be
closed or failed on this evidence. Flagged for the next session.

## Limitation of this census — read before treating it as coverage

This census answered **"which components inject `FamilyStore` and fail to read
`activeMember()`"**. That is narrower than "which screens fail to respect family
context", and the difference is not academic.

**A component that never injects `FamilyStore` at all, and instead receives the
patient as a route input that silently defaults, appears in none of the four
buckets above.** It is not a correct reader, not a defect, not a dead injection,
and not an upstream-receiver — it is invisible to the question as posed.

That is exactly the shape of the online-consult BLOCKER recorded in
`02-screens/family.md`: `appointment-confirm-page.ts` **does** inject `FamilyStore`
and **does** read it, and is classified here as correct. It is correct about the
store. Its `patientId` route input is simply never bound on the ONLINE branch, so
the value it looks up is `''`.

**So this census is complete for store consumers and incomplete for family-context
propagation.** A full answer would also have to trace every route input that
identifies a patient back to whatever supplies it. That trace has not been done for
any vertical other than appointments/online-consult.

