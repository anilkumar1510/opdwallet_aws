## 1. Workspace and toolchain

- [x] 1.1 Add `web-angular/package.json` pinning `@angular/*` to `~21.2` and `@angular/cli` + `@angular/build` to the matching major; install and commit the lockfile
- [x] 1.2 Generate the `member` application into `web-angular/projects/member` and register it in `angular.json` alongside `shell-tpa`; leave `shell-tpa` unmodified
- [x] 1.3 Configure `main.ts` for zoneless: `provideZonelessChangeDetection()`, no `zone.js` in `package.json` or polyfills
- [x] 1.4 Verify `ng build member` and `ng serve member` both succeed zoneless with the workspace's existing `strict` / `strictTemplates` / `noPropertyAccessFromIndexSignature` settings — this confirms Decision 0, which was asserted from docs and not yet observed
- [x] 1.5 Add Tailwind to the `member` project, copying the `brand-*` / `ink-*` / `surface-*` tokens from `web-member/tailwind.config.ts`; do not import from or modify `web-member`
- [x] 1.6 Set the `member` production budgets in `angular.json` to match the `shell-tpa` entry (500kB warning, 1MB error)

## 2. HTTP layer and mapper conventions

- [x] 2.1 Configure `provideHttpClient(withInterceptors([...]))` and an environment-driven API base URL (dev: `http://localhost:4000/api`; prod: relative `/api`)
- [x] 2.2 Write the credentials interceptor setting `withCredentials` on every request so the session cookie travels
- [x] 2.3 Write the error-normalisation interceptor converting `HttpErrorResponse` to a domain `AppError` (`kind: 'network' | 'server' | 'notFound' | 'validation' | 'unauthorized'` + member-safe message)
- [x] 2.4 Define the shared domain primitives: `Money`, `Relationship`, `BenefitCategory`, and the unknown-code fallback helper every mapper uses
- [x] 2.5 Write one reference resource triple (`*.dto.ts` / `*.model.ts` / `*.mapper.ts`) with a runnable check covering a known code, an unknown code degrading to a neutral label, and a date string becoming a `Date` — this is the pattern every later resource copies

## 3. Session and route protection

- [x] 3.1 Build `SessionStore` (signal state, `.asReadonly()` exposure, in-flight request held to dedupe concurrent callers)
- [x] 3.2 Implement login against the existing auth endpoint, mapping the auth DTO to a domain `Member`
- [x] 3.3 Implement session restore at bootstrap, resolving before the first route activates so a valid session does not flash the login screen
- [x] 3.4 Implement `expire()`/`logout()`: clear every store's cached member data and route to login
- [x] 3.5 Write the session interceptor calling into the store once on any 401, routing via the Angular router rather than assigning `window.location`
- [x] 3.6 Write the functional `authGuard` on the member route subtree, capturing the attempted URL for post-login return
- [x] 3.7 Redirect an authenticated visitor away from the login screen to member home
- [x] 3.8 Build the login screen with error states for rejected credentials and for an unreachable service — no mock-user fallback on failure, unlike `web-member/components/layout/ResponsiveLayout.tsx`
- [ ] 3.9 Verify every scenario in `specs/member-session/spec.md` against a running API, including that a second member signing in on the same device sees none of the first member's data

## 4. Responsive shell

- [x] 4.1 Define the primary destination list as a single source consumed by both navigation surfaces
- [x] 4.2 Build `MemberShell` with the side navigation at and above 768px and the bottom tab bar plus header below it, both driven by the destination list
- [x] 4.3 Mark the destination matching the current route as active in both surfaces
- [x] 4.4 Add the breakpoint signal backed by `matchMedia` for the cases CSS cannot express; confirm it stays reactive on resize
- [x] 4.5 Build shared loading, error-with-retry, and empty-state components; the error state must never render placeholder values in place of failed data
- [x] 4.6 Build the not-found screen inside the shell with a route back to member home
- [x] 4.7 Scaffold the member route tree with `loadComponent`, routing not-yet-built destinations to a placeholder screen
- [ ] 4.8 Verify every scenario in `specs/member-shell/spec.md` in a real browser, including that resizing across the breakpoint keeps the route and already-loaded data

## 5. Family context

- [x] 5.1 Write the member-profile DTO, domain model, and mapper, including dependents and the relationship-code translation
- [x] 5.2 Build `FamilyStore` with `activeMember` as the single source of truth for whose data is shown
- [x] 5.3 Compute switch eligibility: offered only to a primary member with at least one dependent
- [x] 5.4 Persist the active member for the session and restore it on load; fall back to the signed-in member when the stored selection is no longer in the family
- [x] 5.5 Clear the persisted selection on session termination so a re-login starts as the signed-in member
- [x] 5.6 Build the family-member selector in the shell, showing readable relationships and never a raw code
- [x] 5.7 Keep the signed-in member's screens usable when family membership fails to load — no selector, no blocking error
- [ ] 5.8 Verify every scenario in `specs/member-family-context/spec.md` against a running API, including that an already-open screen follows a switch without a manual reload

## 6. Wallet

- [x] 6.1 Resolve Open Question 2 in `design.md` — `GET /wallet/balance?userId=` needs no policy assignment id, and the API enforces family access itself, so `WalletStore` has no dependency on a policy store
- [x] 6.2 Write the wallet DTO, domain model, and mapper: nested balances, category balances, unlimited and exhausted variants, `Money`, and dates
- [x] 6.3 Build `WalletStore` deriving its target member from `FamilyStore.activeMember()`, so a family switch invalidates it with no event wiring
- [ ] 6.4 Build the wallet screen: allocated, consumed, and available amounts **with the policy period identified** — amounts are done; the policy period is NOT, because `GET /wallet/balance` does not return `effectiveFrom`/`effectiveTo`. Source it from `GET /member/profile` assignments, or amend `specs/member-wallet/spec.md` to drop the requirement
- [x] 6.5 Render benefit categories with readable names, unlimited categories without a numeric balance, and exhausted categories still visible
- [x] 6.6 Render shared-wallet per-member consumption when the wallet is shared, and omit it when it is not
- [x] 6.7 Handle the active member having no wallet for the current period with a message and no balance figures
- [x] 6.8 Write the transaction DTO, model, and mapper including direction, reversal state, and the related service
- [x] 6.9 Build transaction history: newest first, empty state, reversed rows marked, and "show more" widening the request window (the API takes `limit` but no offset, so the list is replaced rather than appended — this is what stops rows repeating)
- [x] 6.10 Apply currency and date formatting everywhere; no raw number or timestamp reaches a template
- [ ] 6.11 Verify every scenario in `specs/member-wallet/spec.md` against a running API

## 7. Close out

- [x] 7.1 Confirm `web-member/` and `api/` have no modifications in the diff for this change
- [ ] 7.2 Resolve or explicitly defer the remaining Open Questions in `design.md` (deployment target, multiple concurrent policies, idle timeout, accessibility target, wallet policy period) **Session 45:** both remaining open questions are now stated for their owners in `audit/32-decision-brief.md` §3 (native packaging) and §4 (AHC reload, recommendation on file: sanction the loss). Native packaging is flagged as the one decision the audit cannot supply the input for — it needs app-store usage figures nobody in this loop has gathered.
- [x] 7.3 Run `openspec validate angular-member-portal --type change --strict` and fix anything it reports
- [ ] 7.4 Record the follow-up change sequence for the remaining verticals (policy and benefits, claims, appointments, labs, dental, vision, AHC, pharmacy, orders, payments, health records, profile, settings) **Session 45:** the 30-second termination window is carried in `audit/32-decision-brief.md` §6 as a spec gap belonging here — a rejected session is detected only by the next notification poll, and `member-session` has no scenario for detection latency.

## 8. Retro-specs for shipped verticals

These verticals shipped before any spec existed. Each is transcribed from
`web-member/`, and **each transcription is paired with a verification task in the
same numbered pair**. The pairing is deliberate: a transcribed spec records what
the *reference* does and is **not** evidence that Angular does it.

- [x] 8.1 Transcribe `member-lab` from `web-member/` (6 routes, 4 requirements, 15 scenarios)
- [ ] 8.2 **Verify** every scenario in `specs/member-lab/spec.md` against the running app, forcing each state — **22/22 in `03-live/verify-lab.mjs`.** Session 38 unblocked and closed the ordering journey: a cart was created through the ops portal (`POST ops/lab/prescriptions/:ref/digitize`), and the journey now reaches a terminal state (`POST member/lab/orders` 201, `ORD-1786254378495-ZH3O7CYKT`), criterion 6 clean. Three defects were found only by driving it — see `audit/26-session-38-fixes.md`: the cart route's missing `data.kind` sent the vendor link to `/member/diagnostics/…`; `collectionAddress` was sent as a string against a nested DTO (the AHC 400 again); and the order endpoint wants the business `VENDOR-…` id, not the Mongo `_id`, under a comment claiming the opposite. Both degradation defects fixed. Identifier scenario corrected — lab's reference is `ORD-…`, not `LAB-ORD-…`. **Open only on the submission group:** *Submitting an existing prescription* cannot pass (`submitExisting` has no caller, `audit/17-…md`), and *Incomplete submission is refused* / *Unsupported or oversized file* are not yet verified. **Session 39 — submission group, two harnesses (`03-live/verify-submission.mjs` mutating 4/6, `verify-submission-states.mjs` non-mutating 8/10).** *Unsupported or oversized file* now verified, both clauses, both kinds. `submitExisting` BUILT on the hub matching the reference (`features/lab/prescription-selector.ts`), so the labelled-control defect is fixed and observed fixed — but the submit is **unobserved**: the test member holds no health records and only a doctor can create one, so the scenario is blocked on a precondition with an owner, not on work. *Incomplete submission is refused* **fails clause 1** — Angular disables the submit control and names nothing, where the reference validates on submit and names each missing field; an interaction-model divergence filed for a ruling, not picked. See `audit/28-submission-group.md`. **Session 41:** *Incomplete submission is refused* now PASSES, both clauses, both kinds (`03-live/verify-submission-states.mjs` **24/24**). The control is enabled and validates on attempt, naming each missing field — the pattern `appointment-confirm-page` and `vendor-booking-page` already used; it was a defect, not a divergence. A second defect was found driving it: two prefill effects read the signal they wrote, so the member could not clear the address (the session-25 "the effect fought the user" shape, still present) — fixed with a one-shot guard. **Still open only on *Submitting an existing prescription*, blocked on a doctor-authored health record.**
- [x] 8.3 Transcribe `member-diagnostics` from `web-member/` (6 routes, 4 requirements, 14 scenarios)
- [ ] 8.4 **Verify** every scenario in `specs/member-diagnostics/spec.md` against the running app, forcing each state — **21/21 in `03-live/verify-diagnostics.mjs`**, plus 4/4 in `probe-upload-prefix.mjs`. All three degraded-not-declared defects fixed and re-verified (the diagnostics hub now renders `store.partial()`; the shared orders and cart sites with it). **Correction to session 37, which claimed every scenario was exercised — it was not:** the four submission scenarios were outside the non-mutating harness. Verifying one of them found **defect D** — `upload-prescription-page.ts` hardcoded `LabKind.Lab`, so a diagnostics upload POSTed to the lab prefix and returned the member to the lab hub, failing both THEN clauses; fixed and asserted on the network log. **Open only on the submission group:** *Submitting an existing prescription* cannot pass, and the two refusal scenarios are not yet verified. **Session 39 — submission group, two harnesses (`03-live/verify-submission.mjs` mutating 4/6, `verify-submission-states.mjs` non-mutating 8/10).** *Unsupported or oversized file* now verified, both clauses, both kinds. `submitExisting` BUILT on the hub matching the reference (`features/lab/prescription-selector.ts`), so the labelled-control defect is fixed and observed fixed — but the submit is **unobserved**: the test member holds no health records and only a doctor can create one, so the scenario is blocked on a precondition with an owner, not on work. *Incomplete submission is refused* **fails clause 1** — Angular disables the submit control and names nothing, where the reference validates on submit and names each missing field; an interaction-model divergence filed for a ruling, not picked. See `audit/28-submission-group.md`. **Session 41:** *Incomplete submission is refused* now PASSES, both clauses, both kinds (`03-live/verify-submission-states.mjs` **24/24**). The control is enabled and validates on attempt, naming each missing field — the pattern `appointment-confirm-page` and `vendor-booking-page` already used; it was a defect, not a divergence. A second defect was found driving it: two prefill effects read the signal they wrote, so the member could not clear the address (the session-25 "the effect fought the user" shape, still present) — fixed with a one-shot guard. **Still open only on *Submitting an existing prescription*, blocked on a doctor-authored health record.**
- [x] 8.5 Transcribe `member-vision` from `web-member/` (6 routes, 4 requirements, 13 scenarios)
- [x] 8.6 **Verify** every scenario in `specs/member-vision/spec.md` against the running app, forcing each state — 8/8; entry-5 ordering confirmed live, identifier asserted, clinics failure forced from a cold context with `serviceCode` (`03-live/verify-vision.mjs`, `verify-vision-clinics-fail.mjs`)
- [x] 8.7 Transcribe `member-dental` from `web-member/` (5 routes, 3 requirements, 15 scenarios)
- [ ] 8.8 **Verify** every scenario in `specs/member-dental/spec.md` against the running app, forcing each state — **13/17 in `03-live/verify-dental.mjs`. REOPENED in session 40.** Closed in session 34 on the copay continuation; the user has ruled that continuation an unapproved **flow change** and it is reverted, so the journey again ends on the bookings list with the outstanding copay unsurfaced. The four failures are the continuation assertions and criterion 6, relabelled `OPEN DEFECT (awaiting ruling)` with no predicate changed. Closes when the defect is ruled and resolved — `audit/20-copay-continuation.md`, `audit/29-session-40-revert.md`. **Session 41:** the bookings row now names the amount still owed (`14/18`, DISCLOSURE assertion passing) — a display fix on the screen the journey already ends on, no new destination. The four continuation assertions still fail by design. Closes when the continuation is ruled.
- [x] 8.9 Transcribe `member-profile-misc` from `web-member/` (6 routes, 4 requirements, 10 scenarios)
- [x] 8.10 **Verify** every scenario in `specs/member-profile-misc/spec.md` against the running app, forcing each state — 10/10 (`03-live/verify-profile-misc.mjs`); spec corrected during verification, see the profile Rule
- [x] 8.11 Transcribe `member-transactions-payments` from `web-member/` (4 routes, 3 requirements, 10 scenarios)
- [x] 8.12 **Verify** every scenario in `specs/member-transactions-payments/spec.md` against the running app, forcing each state — 7/7, cold-context failure, entry-5 conformance confirmed live (`03-live/verify-transactions.mjs`)
- [x] 8.13 Transcribe `member-claims` from `web-member/` (3 routes, 3 requirements, 16 scenarios)
- [x] 8.14 **Verify** every scenario in `specs/member-claims/spec.md` against the running app, forcing each state — 10/10, terminal state included (`03-live/verify-claims.mjs`)
- [x] 8.15 Transcribe `member-policy-benefits` from `web-member/` (3 routes, 3 requirements, 13 scenarios)
- [x] 8.16 **Verify** every scenario in `specs/member-policy-benefits/spec.md` against the running app, forcing each state — 10/10 (`03-live/verify-policy-benefits.mjs`)
- [x] 8.17 Transcribe `member-consultations` from `web-member/` — both modes as one spec (10 routes, 5 requirements, 22 scenarios)
- [ ] 8.18 **Verify** every scenario in `specs/member-consultations/spec.md` against the running app — **14/20 in `03-live/verify-consultations.mjs`. REOPENED in session 40**, same cause as 8.8: the copay continuation is reverted as an unapproved flow change, so both modes end on the bookings list with the outstanding amount unsurfaced. Six failures, all relabelled `OPEN DEFECT (awaiting ruling)`, no predicate changed. Criterion 6 deliberately left failing — the criterion is right and the flow is a known defect. Twelve unsettled consultation copays are what made it visible. `audit/20-copay-continuation.md`. **Session 41:** the disclosure fix does NOT reach this vertical — `GET appointments/user/:id` returns `consultationFee` and no payment fields at all, so the row has nothing to render (**inherited finding 13**). Twelve of the fourteen accumulated copays are consultations, so this is the larger share. 15/21; blocked on the API and on the continuation ruling.

## 9. Completion criteria

**This change cannot close while any transcribed spec has unverified scenarios.**

A transcribed spec is a record of reference behaviour. A spec set that is complete
but unverified looks like coverage and is not — which is the failure this change
already made once, at 43/51 tasks done with zero scenarios verified against a
running API. Section 8 exists so that failure cannot recur by convention: every
odd-numbered transcription task has an even-numbered verification task, and both
must be checked.

**Transcription and verification interleave. A vertical's transcribe task is not
complete until its paired verify task passes.**

Earned, not stylistic. Three defects in this audit were invisible to every static
check it built - and it built good ones:

| Defect | What every static check said | What found it |
|---|---|---|
| ONLINE confirm silently dead | passed the step-count diff, endpoint diff, `FamilyStore` census and patient-input trace | driving the flow to a terminal state |
| Claim filed then shown as "Claim not found" | guards, rendering and every network call up to the last one looked correct | criterion 5, within one session of being written |
| `lab-orders-page.ts:44` | reads as correct | still unverified - no order rows on the test account |

Batching verification behind transcription means the next defect of this shape
waits for every remaining vertical. A defect found during its own vertical is a fix
inside that session; the same defect found six verticals later invalidates the spec
that described it.

**Catch-up backlog - known debt, not oversight.** Six verticals were transcribed
before this rule and remain unverified: `member-lab`, `member-diagnostics`,
`member-vision`, `member-dental`, `member-profile-misc`,
`member-transactions-payments`. That set is fixed and no longer grows.

Specifically, the change closes only when:

1. Every task in sections 1-7 is checked.
2. Every transcription task in section 8 has its paired verification task checked.
3. `openspec validate angular-member-portal --type change --strict` passes.
4. No scenario in any spec, original or transcribed, is marked passing on evidence
   read from ambient data. Forced state only - see
   `web-angular/projects/member/audit/10-assertion-provenance.md`.
5. **Forced-failure scenarios are forced from a COLD context** - a fresh browser
   context with the route intercepted *before* sign-in. Intercepting after sign-in
   proves nothing: the store already holds the data and the screen never re-requests
   it.

   Added 2026-08-08. `member-profile-misc` carried a scenario - "Profile fails to
   load" - describing a failure that **cannot occur**, because the screen renders the
   member from the **session**, not from `member/profile`. It passed transcription
   because nothing forced it, and a warm-context interception would have "passed" it
   too. The cold run still rendered the member, and that is what exposed the real
   source. **A scenario that names a dependency the code does not have is a spec
   defect, and only a cold context distinguishes it from a passing one.**

   Checked across the remaining backlog specs: the other forced-failure scenarios
   (orders, clinics, vendors) all name routes their screens genuinely fetch, so the
   shape does not repeat. Verified rather than assumed.

6. **Any scenario asserting that something is created, booked, placed or submitted
   is verified to a terminal state** - the record exists and the navigation the
   scenario names actually happened. Rendering the screen and clicking the control
   is not sufficient evidence.

   Added 2026-08-07 after the ONLINE confirm defect: that screen routed, rendered,
   and offered an enabled confirm button that silently did nothing. No check in this
   audit would have caught it - not the step-count diff, the endpoint diff, the
   `FamilyStore` census, or the patient-input trace. The transcribed scenarios *do*
   carry terminal clauses ("the order is placed **and** the member is taken to the
   order"), so section 8 covers the class already; this criterion makes that
   explicit rather than leaving it to how carefully a verifier reads the AND.

   **EXTENDED 2026-08-08.** A terminal state is not terminal while money is still
   owed. **Where a scenario involves money, the verification must also establish
   that no unexplained pending payment state was created.**

   The hole was real, not theoretical. `member-consultations` passed **9/9** in
   session 26 under this criterion as originally written — the appointment record
   existed, the named navigation happened — while leaving **twelve** unsettled
   copays behind it. The check was satisfied and the flow was wrong. Dental added
   two more before the pattern was noticed, and only then because a reference read
   went looking for something else.

   The query and both controls are on hand:

   - **POSITIVE CONTROL** — it must return `PAY-20260808-0188`, a real obligation
     session 31 reached and paid through the transaction detail.
   - **NEGATIVE CONTROL** — vision, whose payment is created inside the bill-gated
     `processPaymentForBilling` rather than at create, and where the portal does
     navigate onward. A pending row there is deferral, not orphaning.

   "Unexplained" is the operative word: a pending payment the journey **navigated
   the member to** is the flow working. One left behind on a screen that says the
   booking is complete is the defect (`audit/20-copay-continuation.md`).
