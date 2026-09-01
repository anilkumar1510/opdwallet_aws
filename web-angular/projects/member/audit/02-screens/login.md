# login

- React:   `web-member/app/page.tsx` → `/`
- RN:      `web-member-rn/app/login.tsx` → `/login`
- Angular: `web-angular/projects/member/src/app/features/login/login-page.ts` → `/login`
- Spec:    `member-session`
- Status:  **DRIFT**

## URL divergence (all three disagree)

| App | Login URL | Root `/` behaviour |
|---|---|---|
| React | `/` | **is** the login screen (`app/page.tsx`, component named `MemberLoginPage`) |
| RN | `/login` | `app/index.tsx` is a separate entry screen |
| Angular | `/login` | redirects → `/member` → `authGuard` → `/login` |

Angular matches RN, not React. A bookmark of React's `/` still reaches login on
Angular, but by a three-hop redirect rather than directly, and the URL the member
ends on differs from the one they saved.

## API integration

| Verb + path | Params / body | React | RN | Angular | Notes |
|---|---|---|---|---|---|
| `POST /api/auth/login` | `{email, password}` | ✅ | ✅ | ✅ `AUTH_API.login` | identical body |
| `GET /api/auth/me` | — | via `ResponsiveLayout` | ✅ | ✅ `runRestore()` | Angular deliberately does not port React's mock-user fallback |
| `POST /api/auth/logout` | — | ✅ | ✅ | ✅ | |
| `POST /api/auth/refresh` | — | ❌ | ❌ | declared, **no caller** | orphan — see `01-endpoint-diff.md` §3 |

Both web apps reach the API same-origin: React via `next.config.js` `rewrites()` +
`app/api/[...path]/route.ts`; Angular via `proxy.conf.json`. No CORS in either path.

## Flows

| Flow | React | Angular |
|---|---|---|
| Submit valid credentials | `fetch` → `router.push('/member')` — **always** `/member` | `session.login()` → `navigateByUrl(takeRedirect() ?? '/member')` |
| Submit invalid credentials | unwraps nested `data.message.message`, sets error string | store maps `unauthorized` → fixed copy |
| Already signed in, hits login | no guard — renders the form again | `anonymousGuard` → `/member` |
| Deep link while signed out | `ResponsiveLayout` mock-user fallback masks it | `authGuard` captures URL, redirects to `/login`, returns after |
| Concurrent restore | n/a | single shared promise (`restoring ??=`) — one `/auth/me` per burst |

**Angular has behaviour React lacks:** return-to-attempted-route
(`captureRedirect` / `takeRedirect`, `auth.guard.ts:18`) and the anonymous guard.
Both are `member-session` spec scenarios ("Return to the attempted route after
signing in again", "Login screen while already authenticated"). Not drift against
the spec — drift against React, in Angular's favour.

## State

React holds `email` / `password` / `error` / `loading` in four `useState` calls,
scoped to the page. Angular holds `email` / `password` as page signals and
`busy` / `error` in `SessionStore` — so a failure raised by the interceptor
mid-session lands in the same place a login failure does. No TanStack query is
involved on either side; nothing to invalidate.

## Non-happy paths

| Path | React | Angular | Verdict |
|---|---|---|---|
| Wrong password | server's message, unwrapped from the nested object | "That email or password was not recognised." | **DRIFT** — deliberate per `session.store.ts:52`; a rejected credential must not read as "your session ended". Angular never surfaces the server string here. |
| API unreachable | "Login failed. Please try again." | `appError('server')` | parity |
| Expired session on reload | mock user rendered (React defect) | cleared → `/login` | **NOTE** — known-intentional, Angular is correct |
| Session rejected mid-session | not handled | `expire()` via interceptor, no-ops if already anonymous | Angular ahead |

## Guards / permissions

- Angular: `anonymousGuard` on `/login`, `authGuard` on `/member`. Both `await session.restore()` before deciding — the comment at `auth.guard.ts:8` names the bug this avoids (valid session flashing the login screen on reload).
- React: no route guard. `ResponsiveLayout` decides per-render, and its mock-user fallback means an unauthenticated member can render the shell.
- Family scoping: not applicable pre-login.

## Forms

| | React | Angular |
|---|---|---|
| Email | `type=email`, `required` | `type=email`, `required`, `ngModel` |
| Password | `required`, **show/hide toggle** (`app/page.tsx:235`) | `type=password`, `required`, **no toggle** |
| Submit disabled | `disabled={loading}` | `[disabled]="session.busy()"` |
| Client-side format validation | browser only | browser only |
| Re-entrancy | none | `if (this.session.busy()) return` |

## Navigation edges

- In: `/` (Angular redirect), `authGuard` rejection from any `/member/*` route.
- Out: `/member` or the captured redirect URL.
- No "forgot password" or "register" link in either app. Not a gap — neither reference has one.

## Findings

- [DRIFT] Login lives at `/` in React but `/login` in Angular; React's root is the login page, Angular's root redirects into the guarded subtree — `web-member/app/page.tsx:6` vs `app.routes.ts:10-15`
- [DRIFT] No show/hide password toggle in Angular; React has one — `web-member/app/page.tsx:235` vs `features/login/login-page.ts:39`
- [DRIFT] Server-supplied error text is replaced by fixed copy on rejected credentials; React shows the unwrapped server message — `core/session/session.store.ts:50-56`
- [DEBT] `auth/refresh` declared with no caller — `core/session/auth.ts` (see `01-endpoint-diff.md` §3)
- [NOTE] Angular adds return-to-attempted-route and an anonymous guard that React lacks; both are `member-session` scenarios, so this is spec conformance, not unrequested scope
- [NOTE] React's mock-user-on-`/auth/me`-failure is deliberately not ported; Angular showing an error is correct

## Spec scenarios covered by this screen

`member-session` has 11 scenarios across 4 requirements. This screen exercises 8
of them. Static reading says all 8 are implemented. **None are verified against a
running API** — that is open task 3.9 and belongs to Phase 3.
