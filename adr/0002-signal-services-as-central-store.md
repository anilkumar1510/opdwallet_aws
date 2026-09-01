# ADR-0002: Injectable signal services as the central store

**Status**: accepted
**Date**: 2026-08-05

## Context

State in the existing `web-member` portal is split three ways: TanStack Query caches per screen, one React context for the active family member, and per-page `useState` for everything else. There is no single source of truth for who the portal is acting for, so screens re-fetch and re-derive the same data independently, and a family-member switch does not reliably propagate.

The Angular member portal needs one answer to "where does state live" before ~65 screens are written against whatever each screen's author picks.

## Decision

We will hold member domain state in root-provided injectable services built on Angular signals — `signal()` for state, `computed()` for derivations — one store per domain area (`SessionStore`, `FamilyStore`, `WalletStore`, and so on as features land).

State is written only by the owning store's own methods. Signals are exposed to components read-only via `.asReadonly()`.

Cross-store dependencies are expressed as `computed()`, not manual subscription or event wiring. A store that depends on the active family member derives it from `FamilyStore.activeMember()`.

Components read signals and call store methods. Components do not fetch.

We will not use NgRx, NgRx SignalStore, or a query-cache library as the state mechanism.

## Consequences

There is one place to look for any piece of member state, and one place it can be written. A family-member switch invalidates dependent state automatically because the dependency is a `computed()`, with no subscription to remember to wire up — this is what makes an already-open screen follow the switch without a manual reload.

No dependency is added for state management, and no action/reducer/effect boilerplate is paid per screen.

We give up NgRx devtools and time-travel debugging. We also give up automatic request deduplication, so each store holds its own in-flight request and returns it to concurrent callers rather than firing duplicates.

If the store pattern later proves insufficient, NgRx SignalStore is a contained migration precisely because the public surface of every store is already signals — consumers do not change.

Every future member-portal change inherits this: new features add a store, they do not add a state library.
