# Phase 4 — design-symbol reconciliation

Mechanical diff of every code-span identifier in the planning docs against the
Angular source. Rationale: `terminate()` proved that design and code were never
reconciled, and a screen-by-screen sweep structurally cannot find this class of
defect — a screen file shows what *is* there, not what was specified and dropped.

**Sources:** `design.md`, the four specs (`member-session`, `member-shell`,
`member-family-context`, `member-wallet`), `adr/0001`–`0004`.
**Target:** all `.ts` and `.html` under `projects/member/src/`.
**Tool:** `04-symbol-scan.mjs` (read-only).

**Result: 60 symbols extracted · 40 present · 20 absent · 1 real defect.**

## Method note — the extractor was wrong the first time

The first run extracted 46 symbols and **did not surface `terminate`**, because
`design.md` writes it as `` `SessionStore.terminate()` `` — a dotted span, which
the identifier regex rejected whole. Dotted spans are precisely where a dropped
*behaviour* hides, since the method name is the payload. Fixed to split dotted
spans and test each part; the count rose 46 → 60 and `terminate` appeared.

Recorded because it is a live caution: a symbol scan that silently drops the
shape it was built to catch reads exactly like a clean result.

**Known remaining scope limit:** only `.ts`/`.html` are scanned, so config-file
symbols report as absent. Both instances below were verified by hand and are
false positives.

---

## 1. Specified, absent

### [BLOCKER] `terminate` — the one real defect

| | |
|---|---|
| Specified | `design.md:139` — "on any 401, calls `SessionStore.terminate()` once **and routes to login**" |
| In source | **nothing.** `grep -rn terminate` over `src/**` returns zero hits |
| Shipped as | `SessionStore.expire()` — the "ends the session once" half, idempotent, correct |
| Dropped | the navigation |

Already filed and now **observed live** — see `03-live/session-expiry-spike.md`.
Listed here because this scan is what would have caught it without a 100-second
browser spike, and it takes seconds to run.

The design also rejects the reference's `window.location.href` approach *by name*
for discarding router state, so the intended implementation is documented, named,
and absent. Design-to-code divergence, not an unspecified edge case.

**No other symbol in the docs is genuinely absent.** The remaining 19 classify as
below.

## 2. Specified, renamed — behaviour present, none dropped

| Doc symbol | Implemented as | Verdict |
|---|---|---|
| `isTerminal` (`design.md:124`) | `Claim.isCancellable` (`core/claims/claim.model.ts:31`) | **Renamed, and inverted deliberately.** The design specifies a discriminated union plus `isTerminal`; the code exposes the member-facing question instead — may this claim still be withdrawn. The doc comment records the reasoning: six terminal statuses block it, and *anything unrecognised stays cancellable* so a new API status cannot silently trap a claim. Nothing dropped; the rename carries a degradation rule the doc's version did not state. |
| `MemberProfileResponse` (`design.md:195`) | `MemberProfileDto` (`core/member/member.dto.ts:79`) | Renamed to the codebase's `*Dto` convention. Same shape, same `assignments[]` array. |
| `toDomain` / `toDto` (`design.md`, `adr/0003`) | `toWallet`, `toMember`, `toPolicies`, `toNotification`, `toTransaction`, … | The ADR names a *pattern*, not literal functions. Implemented per resource. Not a finding. |

**Renames are only findings when the rename dropped something.** Exactly one did:
`terminate` → `expire`.

## 3. False positives — verified, recorded so they are not re-flagged

**Config symbols (scan covers `.ts`/`.html` only) — both actually set:**

| Symbol | Reality |
|---|---|
| `strictTemplates` | `tsconfig.json:22` — `true` |
| `noPropertyAccessFromIndexSignature` | `tsconfig.json:8` — `true` |

**Reference-app (React) symbols, quoted to describe what the reference does — correctly absent from Angular:**
`FamilyContext`, `useState`, `getBalance`, `getWallet`, `getCategoryName`,
`getRelationshipLabel`, `getStatusColor`, `categoryName`.

`getWallet` is worth a line: `design.md:192` calls the reference's
`walletApi.getWallet(userId, assignmentId)` **"stale against the current API"** —
the endpoint takes an optional `userId` and resolves the assignment server-side.
Its absence is the design being followed, not ignored.

**Rejected alternatives, named in order to be dismissed:**
`ChangeDetectorRef`, `setTimeout`, `APP_INITIALIZER`.

**Noise:** `OPD000001` (sample id), `latest` (npm dist-tag).

## 4. Implemented, unspecified

Taken at store granularity, which is the unit the architecture is defined in.
**17 stores exist; 4 are covered by an approved spec.**

| Store | Spec | Status |
|---|---|---|
| `session/session.store.ts` | `member-session` | specified |
| `family/family.store.ts` | `member-family-context` | specified |
| `wallet/wallet.store.ts` | `member-wallet` | specified |
| `notifications/notifications.store.ts` | `member-shell` (badge only) | **partly** — the badge is specified; the dropdown and `/member/notifications` page are not |
| `ahc/ahc.store.ts` | — | **DEBT** |
| `ahc/ahc-booking.store.ts` | — | **DEBT** |
| `appointments/booking.store.ts` | — | **DEBT** |
| `bookings/bookings.store.ts` | — | **DEBT** |
| `claims/claims.store.ts` | — | **DEBT** |
| `clinic-booking/clinic-booking.store.ts` | — | **DEBT** |
| `lab/cart.store.ts` | — | **DEBT** |
| `lab/lab.store.ts` | — | **DEBT** |
| `member/policy.store.ts` | — | **DEBT** |
| `member/profile.store.ts` | — | **DEBT** |
| `records/records.store.ts` | — | **DEBT** |
| `services/benefit-services.store.ts` | — | **DEBT** |
| `transactions/transactions.store.ts` | — | **DEBT** |

**13 of 17 stores are unspecified — 76% of the state layer.** This is the same
scope drift the route list shows, measured against a different axis, and it
corroborates it: the DEBT surface is not a handful of stray screens, it is most
of the application's state.

Cross-reference holds as expected — every DEBT store maps to routes on the DEBT
route list, and no DEBT store serves a spec-covered route.

## What this scan is worth

One real defect, found mechanically, that a 70-file screen sweep would not have
surfaced — and the same defect took a Playwright spike and a shortened JWT to
demonstrate by observation. **Re-run `04-symbol-scan.mjs` whenever a spec or ADR
changes.** It is seconds of work and its yield is demonstrably non-zero.
