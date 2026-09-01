# family (context + screen)

Covers `FamilyStore`, the shell switcher, the `/member/family` screen, and how
`activeMember()` propagates downstream — the propagation is the substance here,
not the screen.

- React:   `web-member/contexts/FamilyContext.tsx` · `app/member/family/page.tsx` · `components/SwitchProfileModal.tsx` · `components/family/MemberSwitcher.tsx`
- RN:      no dedicated family screen
- Angular: `core/family/family.store.ts` · `features/family/family-page.ts` · `features/shell/member-switcher.ts`
- Spec:    `member-family-context`
- Status:  **DRIFT**

## API integration

| Verb + path | React | RN | Angular | Notes |
|---|---|---|---|---|
| `GET /api/member/profile` | ✅ | ✅ | ✅ | one call yields family **and** policies (`toFamily` + `toPolicies`) |
| `GET /api/member/family` | ❌ | ❌ | declared, **no caller** | orphan — `member/family` in the endpoint diff |
| `GET /api/users/:id/dependents` | ✅ `lib/api/users.ts` | ? | ❌ | React has a second path to the same data |
| `POST` add dependent | ✅ `/member/family/add` | ❌ | **MISSING** | see finding |

## Findings

### [GAP] `/member/family/add` is not ported

React has `app/member/family/add/page.tsx`; Angular has `/member/family` only.
One of the 5 React routes with no Angular equivalent. A member cannot add a
dependent in the Angular portal at all.

### [BLOCKER] The active member does not preselect the patient in booking flows

> **Re-filed 2026-08-07: DRIFT → BLOCKER.** The taxonomy's BLOCKER clause is
> "flow cannot complete, **or completes with wrong/lost data**." This flow
> completes. That is what makes it worse than a broken one: a broken flow stops
> and tells you, while this one succeeds and books an appointment for the wrong
> person. Nothing signals the error until someone arrives for an appointment that
> is not theirs — at which point the wrong member's benefit has been consumed.

React's `app/member/appointments/select-patient/page.tsx:104-114` reads
`viewingUserId` from the family context and **auto-selects** the matching patient,
logging when the stored id is not in the list.

Angular's `features/appointments/appointment-patient-page.ts` injects `FamilyStore`
and renders `family.family()` as an undifferentiated list. It never references
`activeMember` — confirmed by the fact that the file does not appear in
`grep -rl activeMember features/`.

**Consequence:** a primary member who has switched to a dependent, then books an
appointment, is presented with every family member as an equal choice and must
re-pick the person they already selected in the shell. The switch silently fails
to carry into the one flow where picking the wrong person books the wrong patient
an appointment.

Same shape applies to `clinic-booking` (vision/dental `select-patient`), where
React also consumes the context (`app/member/vision/select-patient/page.tsx`,
`app/member/dental/select-patient/page.tsx`) and the Angular store does not derive
from `activeMember`.

This is the highest-consequence family finding: it is not a missing screen, it is
a correct-looking screen that acts for the wrong person by default.

### [DRIFT] Family scoping reaches 6 stores in Angular vs 14 screens in React

Angular stores deriving from `activeMember()`:
`bookings`, `claims`, `lab`, `records`, `transactions`, `wallet`.

Angular stores that do **not**: `ahc`, `ahc-booking`, `booking` (appointments),
`clinic-booking`, `cart`, `policy`, `profile`, `benefit-services`, `notifications`.

React consumes the family context in 14 member screens, including
`appointments/*`, `online-consult/*`, `vision|dental/select-patient` — none of
which have an Angular store-level equivalent.

`notifications` not deriving is **correct and documented**
(`notifications.store.ts:20-22`: notifications are session-scoped, unlike the
wallet). The others are undocumented and each needs a decision. Listed rather
than asserted as defects, because for the flows carrying an explicit
`select-patient` step the answer may legitimately be "the step supersedes the
switch" — but if so, the preceding finding says the step should at least default
to the active member.

### [BLOCKER] Online consultation cannot be booked — `patientId` is never supplied

Found while preparing the appointments/online-consult transcription. **Static, not
yet observed live** (two harness attempts failed on selectors; per rule 3 I stopped
adjusting rather than fit a third). The code path is unambiguous and cited.

**The chain:**

1. `features/appointments/doctors-page.ts:67-71` — on the ONLINE branch the doctor
   card links to `/member/online-consult/confirm` with `doctorId`, `specialtyId`,
   `specialtyName`. **No `patientId`.** (The IN_CLINIC branch at `:81-86` routes to
   `select-patient` instead, which supplies it.)
2. `features/appointments/appointment-confirm-page.ts:145` — `patientId = input<string>('')`.
   With nothing bound, it is the empty string.
3. `:162-166` — the validation effect reads
   `const patient = this.patientId(); if (!doctor || !patient) return;`
   → **wallet/copay validation never runs** for an online consult.
4. `:221-223` — `confirm()` does
   `const patient = this.family.family().find(m => m.id === this.patientId());`
   `if (!doctor || !patient) return;`
   → no family member has id `''`, so **confirm returns silently. No booking is
   created, no error is shown.**

**Which of the three cases:** not the wrong-patient fallback. The flow is **dead** —
the confirm screen renders, shows no wallet split, and its confirm action does
nothing. A member can walk the entire online-consult journey and end with no
appointment and no explanation.

**Scope:** `/member/online-consult/confirm`, reachable from
`/member/online-consult` and `/member/online-consult/specialties` → `/doctors`.
The IN_CLINIC branch is unaffected — it has a `select-patient` step.

**Why it was invisible until now:** it is not a `FamilyStore` misuse. The confirm
page *does* inject `FamilyStore` and *does* read it. The failure is an unbound route
input, which no census of store consumers would surface.

### [DEBT] `MemberSwitcher` is dead code

`features/shell/member-switcher.ts` is a complete 71-line component with its own
`family.canSwitch()` gate and member list. It is **never imported or rendered** —
`grep -rn "MemberSwitcher\|opd-member-switcher"` returns only its own declaration
and selector.

The switcher that actually works is the avatar in `features/shell/profile-menu.ts`
(`canSwitch()` at :49, `setActiveMember()` at :123), whose doc comment says so:
*"Avatar in the top bar. Doubles as the family-member switcher."*

Found only because a live scenario test looked for a control labelled "switch" and
failed. Same shape as the unreachable notifications page — built, compiles, unwired.

### [DEBT] `member/family` endpoint declared, never called

The family list comes from `member/profile`. The separate endpoint is dead.

## State

`FamilyStore` is the reference implementation of the architecture the design
calls for, and the propagation mechanism is genuinely stronger than React's:

- `activeMember` is a `computed()` that **falls back to the signed-in member**
  whenever the stored id is not in the current family (`family.store.ts:44-50`) —
  which satisfies the spec's "Stored selection no longer valid" scenario by
  construction rather than by a check someone has to remember.
- `policies` is a `computed()` that gives a primary the whole family's policies
  and a dependent only their own (`family.store.ts:58-65`).
- `canSwitch` is a `computed()` requiring primary **and** >1 member
  (`family.store.ts:68-70`) — covers two spec scenarios at once.
- Dependent stores derive via `computed()`, so a switch invalidates them with no
  event wiring. This is exactly what `design.md` promises and what React does with
  a context plus manual refetches.
- `load()` is deduped through a shared promise, like `SessionStore.restore()`.

Persistence: **`sessionStorage`**, key `opd.activeMemberId`, with the reasoning
recorded inline (`family.store.ts:123-124`) — tab-scoped, must not survive into a
different member's sign-in. React uses `sessionStorage` under the key
`viewingUserId` (`FamilyContext.tsx:121-123,166`). **Same semantics, different key
name.** Not a finding; recorded so the divergence is not mistaken for one.

## Non-happy paths

| Path | Angular | Spec scenario |
|---|---|---|
| Family load fails | `_failed` set; family emptied; `activeMember` falls back to the signed-in member so screens keep working — "degrade to just me" (`family.store.ts:97-102`) | "Family load fails" ✅ |
| Stored id not in family | `computed()` falls back to signed-in member | "Stored selection no longer valid" ✅ |
| Sign out | `reset()` clears state **and** `sessionStorage` | "Selection does not survive sign out" ✅ |
| `sessionStorage` unavailable (private browsing / quota) | all three accessors swallow and continue; selection holds in memory | not specified — Angular ahead |
| Dependent signs in directly | `canSwitch` false | "Dependent signs in directly" ✅ |
| Primary with no dependents | `canSwitch` false | "Primary member with no dependents" ✅ |

## Guards / permissions

No route guard beyond the parent `authGuard`. The switch affordance is gated by
`canSwitch`, not by hiding the route — correct, since a dependent has no second
member to switch to.

`setActiveMember()` refuses ids not in the current family (`family.store.ts:110`),
so a stale or forged id cannot point the portal at someone else's data. Worth
noting as a deliberate trust-boundary check.

## Navigation edges

- In: shell switcher (`member-switcher.ts`), profile menu, `/member/family`
- Out: `/member/family/add` — **the link target does not exist in Angular**
- The relationship labels come from coded values (`REL003`) mapped at the edge;
  spec scenarios "Known relationship" / "Unrecognised relationship" are covered by
  `core/domain/codes.ts`. Not re-verified here — needs live data (Phase 3).

## Spec scenarios

`member-family-context` has 12 scenarios across 5 requirements. Static reading
says 9 are satisfied by construction. Three cannot be settled statically and are
task 5.8:

- "Switching the active member" — needs a live switch
- "Already-open screen follows the switch" — the `computed()` chain says yes; unobserved
- "Known / unrecognised relationship" — needs real `REL*` values in a response

## Active-appointment nudge

Would render here too (React mounts it in the member layout). Absent in Angular —
see `shell-nav.md`.
