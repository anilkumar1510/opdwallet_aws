## Why

The member-facing portal is a Next.js/React app (`web-member`) whose state is spread across TanStack Query caches, a single React context, and per-page `useState`. There is no single source of truth for the active member, the wallet, or the policy, so the same data is refetched and re-derived per page and the API's raw Mongo-shaped DTOs (`_id`, `REL003`, `CAT002`) leak into components. This change starts a fresh Angular member portal in the existing `web-angular/` workspace with one central signal store and a mapper boundary at the API edge, so domain codes and DTO shapes are translated exactly once.

Now, because `web-angular/` already exists as an empty workspace scaffold and no member behaviour has been specified yet — every future member feature written against the old structure is migration debt.

## What Changes

- Add a new Angular application `member` to the existing `web-angular/` workspace. `web-member` is **read-only reference** and is not modified, moved, or deleted. Both apps ship side by side until the Angular portal reaches parity.
- Introduce a **central store**: injectable services holding Angular `signal()` state, with `computed()` derivations. Components read signals; they never fetch, and never see a DTO.
- Introduce a **mapper boundary**: every API response passes through a per-resource mapper that converts transport DTOs to domain models — `_id` → `id`, ISO strings → `Date`, `REL003` → `Relationship.Son`, `CAT002` → `BenefitCategory.Pharmacy`, paise/rupee amounts → a single `Money` shape. Unknown codes degrade to a safe fallback rather than rendering a raw code or crashing.
- Establish **session handling**: login, session restore on reload, route guard on `/member/**`, and a single 401 handler that clears the store and routes to login.
- Establish the **responsive shell**: one app, one set of routes, one layout serving both mobile and desktop. A persistent sidebar on wide viewports, a bottom tab bar plus header on narrow ones, with identical destinations either way. No mobile-only route tree, no device-sniffing redirect, no separate mobile build — the same URL renders the same screen at every width.
- Deliver the **wallet vertical slice** end to end (total balance, per-category balances, transaction history) as the proof that store + mappers + shell hold together.
- **BREAKING** for the new app only: it does not consume `lib/api/types.ts` DTO interfaces directly. Those types are re-declared as `*Dto` transport types on the Angular side, with domain models as the public surface.

Scope note: `web-member` has ~65 member routes (appointments, online consult, claims, lab tests, diagnostics, dental, vision, AHC, pharmacy, orders, transactions, payments, health records, profile, settings). This change delivers the foundation plus the wallet slice only. The remaining verticals follow as separate changes reusing the patterns specified here; they are listed under Impact so the sequencing is on record.

## Capabilities

### New Capabilities

- `member-session`: Authenticating a member, restoring an existing session on reload, guarding member routes, and terminating the session on expiry or logout.
- `member-shell`: The member portal's navigation and layout behaviour — which destinations exist, how one responsive layout adapts between mobile and desktop at a breakpoint, and how loading, error, and not-found states are surfaced.
- `member-family-context`: Selecting which family member (self or dependent) the portal is currently acting for, and how that selection propagates to every screen and survives reload.
- `member-wallet`: Presenting a member's wallet — total balance, per-category balances including unlimited categories, and transaction history — for the currently selected family member.

### Modified Capabilities

None. `openspec/specs/` is empty; this is the first change to declare behaviour.

## Impact

**Added**
- `web-angular/projects/member/**` — new Angular application (standalone components, signals, functional guards and interceptors).
- `web-angular/package.json`, lockfile, and `angular.json` project entry for `member`.
- `acceptance-tests/**` — first acceptance-test harness for the repo (`stack: javascript`, now recorded in `openspec/config.yaml`).
- `adr/**` — first repository-level ADRs (state management, API mapper boundary, app-shell placement).

**Modified**
- `openspec/config.yaml` — schema switched to `intent-driven`, project context and `stack: javascript` recorded.
- `web-angular/angular.json` — new project registered alongside the existing `shell-tpa` stub.

**Unchanged (explicitly)**
- `web-member/**` — reference only, read-only for the duration of this migration.
- `api/**` — no endpoint, payload, or auth change. The Angular portal consumes the existing API as-is; every shape difference is absorbed by mappers.

**Deferred to follow-up changes** (sequenced): policy and benefits → claims → appointments and online consult → lab tests and diagnostics → dental, vision, AHC → pharmacy → orders, transactions, payments → health records, profile, settings.

**Risk**: two member portals in production at once. Mitigated by keeping the Angular app behind its own route/host until parity, and by never dual-writing — both apps read the same API and hold no client-side authority over wallet balances.
