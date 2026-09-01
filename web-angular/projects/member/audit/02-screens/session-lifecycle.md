# session-lifecycle

Not a screen — the cross-cutting session behaviour behind every route. Audited as
a unit because `member-session` specifies it as one, and because the failure found
here is invisible from any single screen.

- React:   `web-member/components/layout/ResponsiveLayout.tsx` (per-render check, no interceptor)
- RN:      `web-member-rn/src/lib/api/client.ts`
- Angular: `core/http/api.interceptors.ts`, `core/session/session.store.ts`, `core/session/auth.guard.ts`
- Spec:    `member-session`
- Status:  **DRIFT** — with one **BLOCKER** against the spec

## API integration

| Verb + path | React | RN | Angular | Notes |
|---|---|---|---|---|
| `GET /api/auth/me` | ✅ | ✅ | ✅ | Angular dedupes concurrent restores via a shared promise (`session.store.ts:70`) |
| `POST /api/auth/logout` | ✅ | ✅ | ✅ | Angular clears local state even when the call fails |
| `POST /api/auth/refresh` | ❌ | ❌ | declared, **no caller** | orphan |

## Interceptor chain

`apiInterceptors = [apiUrlInterceptor, errorInterceptor, sessionInterceptor]`
(`api.interceptors.ts:60`). Order is load-bearing and correctly commented:
`sessionInterceptor` sits *inside* `errorInterceptor` so it still sees a raw
`HttpErrorResponse` rather than the app's normalised error.

`SessionStore` is resolved through a lazy dynamic `import()` inside the catch
(`api.interceptors.ts:36-40`) because the store depends on `HttpClient` and the
interceptor is part of `HttpClient`'s own pipeline. Injecting eagerly is a
dependency cycle. This is correct and non-obvious; worth keeping.

## Flows

| Flow | Angular behaviour | Spec scenario | Verdict |
|---|---|---|---|
| Explicit sign out | `logout()` → `router.navigate(['/login'])` — in both callers (`profile-menu.ts:130`, `member-shell.ts:238`) | "Explicit sign out" | ✅ |
| Session rejected mid-session (401) | `expire()` clears state. **No navigation.** | "Session rejected mid-session" | ❌ **BLOCKER** |
| Reload with valid session | `authGuard` awaits `restore()` before deciding | "Reload with a valid session" | ✅ |
| Reload with expired session | `restore()` returns false → `/login` | "Reload with an expired session" | ✅ |
| Second member signs in on same device | 16 stores reset on `isAuthenticated()` going false | "Signing back in after signing out" | ✅ static; needs live proof (task 3.9) |

## Findings

### [BLOCKER] A session rejected mid-session never reaches the login screen

`core/http/api.interceptors.ts:39` → `core/session/session.store.ts:118`

The spec scenario is explicit:

> **WHEN** any request to the API reports the session is no longer valid
> **THEN** the session ends **AND** they are taken to the login screen
> **AND** no previously loaded member data remains available to any screen

Two of the three clauses hold. `expire()` clears session state, and 16 stores
reset themselves through `effect()`s watching `session.isAuthenticated()` —
verified by grep across `core/**`, listed below. So no stale member data survives.

**The third clause does not hold.** `expire()` calls `clear()` and returns. No
`Router` is injected into `SessionStore`, and no caller navigates. `authGuard`
only runs on navigation, so a member who is *sitting* on `/member/wallet` when
their token is rejected stays on `/member/wallet`, looking at a shell with every
store emptied — zero balance, blank name, empty lists — with no indication that
they have been signed out. The next navigation they attempt redirects them
correctly, which is what makes this easy to miss in manual testing.

Sign-out does not have this hole: both its callers navigate explicitly. That
asymmetry is the tell — the navigation is at the two call sites rather than in
the one place the spec's own Rule requires ("Session termination is handled in one
place. Any API response indicating an invalid session MUST produce the same
outcome regardless of which screen triggered the request").

**The approved design specified the missing behaviour explicitly.**
`design.md:139` (Decision 4, interceptor 2):

> **Session** — on any 401, calls `SessionStore.terminate()` once **and routes to
> login**.

`grep -rn terminate` over `src/**` returns nothing: the designed
`SessionStore.terminate()` shipped as `expire()`, keeping the "ends the session
once" half and dropping the "routes to login" half. The design also rejects the
reference's `window.location.href` approach by name, for discarding Angular's
router state — so an in-interceptor `router.navigate(['/login'])` is the designed
behaviour, and it is absent. This is a design-to-code divergence, not an
unspecified edge case.

**Interceptor sweep completed 2026-08-07** (see `03-live/session-expiry-spike.md`):
exactly one registration exists, `provideHttpClient(withInterceptors(apiInterceptors))`
at `app.config.ts:18`. No second interceptor navigates. The finding is not
downgradable to DRIFT.

Stores that correctly reset on expiry (16): `ahc-booking`, `ahc`, `booking`,
`bookings`, `claims`, `clinic-booking`, `family`, `cart`, `lab`, `policy`,
`profile`, `notifications`, `records`, `benefit-services`, `transactions`,
`wallet`.

**Not verified live.** Static reading only; reproducing it needs an expired cookie
against the running API (Phase 3).

### Other findings

- [DEBT] `auth/refresh` declared, never called — no token-refresh flow exists in any of the three apps, so the endpoint is unreachable from the member portal
- [NOTE] React has no interceptor equivalent; each screen handles its own failures and `ResponsiveLayout` masks an unauthenticated state with a mock user. Angular centralising this is the spec's Rule, not drift.
- [NOTE] The lazy `import()` of `SessionStore` inside the interceptor is a deliberate cycle-break, not an accident

## Non-happy paths

| Path | Angular |
|---|---|
| 401 on a background poll (notifications, 30s) | `expire()` fires from a request the member did not initiate — same missing navigation, but now with no user action to explain the blanked screen |
| Logout call fails | local state cleared regardless (`session.store.ts:108`); member is not stranded in a signed-in shell |
| Concurrent 401s | `expire()` no-ops when already anonymous (`session.store.ts:119`), so the session ends once |
| Concurrent restores | one shared promise; one `/auth/me` per burst |

The notifications poll makes the BLOCKER worse: it is the one request that fires
without user action, so it is the most likely trigger and the least explicable to
the member.
