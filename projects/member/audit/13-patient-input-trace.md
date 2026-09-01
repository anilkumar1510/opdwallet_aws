# Patient route-input trace

The question `07-familystore-census.md` never asked. The census asked *"who injects
`FamilyStore` and ignores it"*; this asks *"who never receives the patient at all"*.
That gap is what hid the online-consult BLOCKER for the whole audit.

**Result: one unbound patient input. It is an instance, not a class.**

## Controls

| Control | Expectation | Result |
|---|---|---|
| **Positive** | must flag `/member/online-consult/confirm` — reached with no `patientId` | **PASS** |
| **Negative** | must **not** flag the IN_CLINIC chain, where `select-patient` supplies it | **PASS** — after a fix, see below |

**The negative control failed on the first run and the trace was rebuilt, not
re-asserted.** The matcher used a bounded lookahead with an optional group, which
could match empty and did — so every multi-line `[queryParams]` block read as
"no patientId". It now reads to the end of each anchor tag. Without the negative
control this would have reported **every** link as unbound and looked like a
catastrophic finding.

## Components taking a patient route input

All four use `input<string>('')` — a silent default, which is the failure signature:

| Component | Input |
|---|---|
| `features/appointments/appointment-confirm-page.ts` | `patientId` default `''` |
| `features/appointments/appointment-slot-page.ts` | `patientId` default `''` |
| `features/clinic-booking/confirm-booking-page.ts` | `patientId` default `''` |
| `features/clinic-booking/select-slot-page.ts` | `patientId` default `''` |

## Inbound links — 11 traced

| Verdict | Target | From |
|---|---|---|
| ok | `.../confirm` | `clinic-booking/select-slot-page.ts` |
| ok | `.../select-slot` | `clinic-booking/confirm-booking-page.ts` |
| ok | `.../select-slot` | `clinic-booking/select-patient-page.ts` |
| ok | `/member/appointments/confirm` | `appointment-slot-page.ts` |
| ok | `/member/appointments/select-slot` | `appointment-patient-page.ts` |
| — | `.../select-patient` ×4 | correctly omit it — the patient is *chosen* there |
| **resolved** | `.../doctors` or `select-slot` (back-link) | `appointment-confirm-page.ts` |
| **DEFECT** | `/member/online-consult/confirm` | `appointments/doctors-page.ts` |

### The one that looked like a second instance, and is not

The confirm screen's back-link binds `[queryParams]="backParams()"` — a method, so a
literal matcher cannot see inside it. Read directly
(`appointment-confirm-page.ts:197-206`): on IN_CLINIC it returns `patientId`
explicitly; on ONLINE it returns only the specialty pair, which is correct because
ONLINE has no patient step to return to.

**False positive, resolved by reading rather than by loosening the pattern.** Worth
recording: a computed `queryParams` is invisible to this trace by construction, so
the trace's guarantee is "no *literal* link omits the patient", not "no link omits
the patient". Any future component binding `queryParams` through a method needs
reading by hand.

## The single defect — confirmed live this session

`features/appointments/doctors-page.ts:67-71` links the ONLINE branch to confirm with
`doctorId`, `specialtyId`, `specialtyName` and **no `patientId`**.

Observed end to end (`03-live/consult-flows.mjs`), with IN_CLINIC as the harness's
own positive control:

| | IN_CLINIC (control) | ONLINE |
|---|---|---|
| confirm URL carries `patientId` | **yes** | **no** |
| wallet split rendered | **yes** | **no** |
| `PATIENT` field | `Shivam Jha` | **blank** |
| confirm button | present | present, **enabled** |
| result of clicking it | `POST /api/appointments 201` → `/member/bookings` | **zero API calls, no navigation** |

All four steps of the static trace confirmed. Nothing refuted.

## What this means for the five transcribed specs

**Nothing needs rewriting.** The five transcribed verticals — lab, diagnostics,
vision, dental, profile-misc — contain no unbound patient input. The two
clinic-booking components with `input<string>('')` are both correctly supplied by
`select-patient`, verified above.

Had a second instance turned up, specs already written could have described flows
that cannot complete. They do not.

## The generalizable half

Every one of the four consumers silently defaults to `''`, and the confirm screens
then `return` without comment when the lookup fails
(`appointment-confirm-page.ts:221-223`). **That silence is why a completely dead
user journey survived fourteen sessions of audit.** A guard that surfaces the
failure would have made this visible the first time anyone opened the screen — see
the fix recorded in `progress.md`.
