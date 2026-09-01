# Live spike — session rejected mid-session

**Date:** 2026-08-07. API live on `:4000`, Angular dev server live on `:4200`.

**Verdict: CONFIRMED — observed end to end.** Superseding the earlier PARTIAL
result on this page. Playwright was installed and `JWT_EXPIRY` shortened to `60s`,
which made the previously-unreachable half reproducible. Reproducer:
`03-live/spike.mjs`.

## Observed result

Headless Chromium, clean context (no port-collision cookies). Logged in as
`standard@gmail.com`, navigated to `/member/wallet`, then **no interaction of any
kind** for 100 seconds.

```
===== T+0   ON /member/wallet, AUTHENTICATED =====
URL      : http://localhost:4200/member/wallet
clickable: 7 visible buttons/links
text     : Skip to content Home Claims Bookings Wallet SU Wallet Standard User
           No wallet for this member There is no active benefit wallet for the
           current policy period.

  t+52s  url=/member/wallet  401s so far=1
  t+62s  url=/member/wallet  401s so far=2  last=/api/notifications/unread-count
  ...
  t+102s url=/member/wallet  401s so far=2  last=/api/notifications/unread-count

===== T+100s  AFTER TOKEN EXPIRY =====
URL      : http://localhost:4200/member/wallet
clickable: 7 visible buttons/links
text     : Skip to content Home Claims Bookings Wallet Wallet

===== VERDICT =====
URL changed     : false  (/member/wallet -> /member/wallet)
401 responses   : 2      (/api/auth/me pre-login, /api/notifications/unread-count post-expiry)
still clickable : 7 controls
page errors     : none
```

The 401 on `/api/auth/me` at the start is the `anonymousGuard` resolving the
session before login, not a defect. The one that matters landed between t+52s and
t+62s: **`/api/notifications/unread-count`, fired by the 30-second poll, with the
member touching nothing.**

### Answering the four questions that were open

| Question | Observed |
|---|---|
| Does the URL change? | **No.** `/member/wallet` before and after. |
| What renders after the stores reset? | The shell chrome only. `Home Claims Bookings Wallet` plus a bare `Wallet` heading. **The member's name, their avatar initials (`SU`), and the entire wallet body — including the "no active benefit wallet" empty state — are gone.** |
| Is anything still clickable? | **Yes — all 7 controls remain enabled.** Clicking any of them triggers a navigation, which `authGuard` then redirects to `/login`. So the member's own escape hatch works, but only if they happen to click something. |
| Did stale data survive? | **No.** Identity and content were cleared. The 16 store resets work exactly as read. |

**Two of the spec's three clauses hold; the third fails.** The session ends, no
stale data remains, and the member is *not* taken to the login screen. They are
left looking at a signed-in-looking shell — navigation present, controls live —
with every piece of their own data silently removed and nothing saying why.

The failure is worse than a blank screen would be: the shell still reads as a
working, authenticated app.

---

## Step 0 result — interceptor sweep: BLOCKER stands as written

Searched `web-angular/projects/member/src/**` for `withInterceptors`,
`HTTP_INTERCEPTORS`, and `provideHttpClient`. **Exactly one registration exists:**

```
src/app/app.config.ts:18   provideHttpClient(withInterceptors(apiInterceptors))
```

`apiInterceptors` is the three-element array in `core/http/api.interceptors.ts:60`
— `apiUrlInterceptor`, `errorInterceptor`, `sessionInterceptor`. All three were
read in full. **None injects `Router`. None navigates.** `sessionInterceptor`
calls `expire()` and rethrows; that is its entire effect on a 401.

There is no second registration, no `HTTP_INTERCEPTORS` multi-provider, and no
class-based interceptor anywhere in the project.

Every navigation to `/login` in the whole app — all three of them:

| Site | Trigger |
|---|---|
| `core/session/auth.guard.ts:19` | navigation only; the guard does not run while a member sits still |
| `features/shell/member-shell.ts:238` | explicit sign-out |
| `features/shell/profile-menu.ts:130` | explicit sign-out |

`provideBrowserGlobalErrorListeners()` is also registered (`app.config.ts:14`); it
reports uncaught errors and does not navigate.

**Outcome: the first of the two branches in the brief.** No interceptor
navigates, so the finding is not downgraded to DRIFT. It remains a **BLOCKER**,
recorded as written in `02-screens/session-lifecycle.md`.

---

## Verified live: the trigger fires exactly as the finding assumes

The 30-second notification poll is the request under test. Against the running API:

```
POST /api/auth/login          {standard@gmail.com}      → 200, sets opd_session
GET  /api/notifications/unread-count   valid cookie     → 200  {"unreadCount":0}
GET  /api/notifications/unread-count   tampered cookie  → 401  {"statusCode":401,…,"message":"Unauthorized"}
GET  /api/notifications/unread-count   no cookie        → 401  {"statusCode":401,…,"message":"Unauthorized"}
```

This is the exact condition `sessionInterceptor` keys on
(`error instanceof HttpErrorResponse && error.status === 401`,
`api.interceptors.ts:35`). The poll endpoint really does answer 401 on a rejected
session, and `NotificationsStore.refreshBadge()` really does call it on a
30-second `setInterval` with no user action (`notifications.store.ts:16,53`).

So the chain **401 → `expire()` → state cleared → no navigation** is confirmed at
every link except the last one's user-visible consequence.

## Superseded: why this was previously unreachable

*(Historical — all three obstacles were removed in the 2026-08-07 unblock: Playwright
installed as a `web-angular` devDependency, `JWT_EXPIRY` set to `60s`. Retained so
the constraint is on record.)*

**Correction to an earlier claim on this page:** I previously wrote that `api/.env`
"defines no `JWT_EXPIRY`". It does — line 10, set to `7d`. My grep searched for
`JWT_EXPIRES` and missed it. The 7-day TTL conclusion was right; the reason given
was wrong. It was explicitly configured, not defaulted.

The brief's method was "invalidate the session server-side (or wait out the
token)". **Neither was possible before the unblock:**

1. **No server-side invalidation exists.** The session is a stateless JWT. Grep for
   `blacklist|denylist|revoke|invalidate` across `api/src/modules/auth/**` returns
   nothing. Logout clears the cookie client-side only — the token stays valid
   until it expires. There is no revocation path that does not involve editing
   `api/`, which is read-only.
2. **The token cannot be waited out.** `api/src/config/configuration.ts:15` sets
   `expiresIn: process.env.JWT_EXPIRY || '7d'`, and `api/.env` defines no
   `JWT_EXPIRY`. **The TTL is 7 days.**
3. **No browser automation is available.** No `playwright`, `puppeteer`,
   `selenium`, or karma Chrome launcher is installed in `web-angular/node_modules`
   or on the `.bin` path. Nothing in this environment can drive the SPA, hold a
   cookie, or read the resulting DOM and URL.

A tampered cookie produces a genuine 401 — which is how the trigger above was
verified — but there is no way to place that cookie in a browser that is running
the Angular app and then observe it.

**Therefore these four questions remain open:**

- Did the URL change? (code says no; unobserved)
- What does the member actually see on `/member/wallet` after the poll fails?
- Did all 16 stores reset? (their `effect()`s say yes; unobserved)
- Did any stale data survive the reset?

## What would settle it

Any one of these, none of which touches a read-only repo:

- Install a headless browser in `web-angular` (dev dependency) and script:
  login → `/member/wallet` → overwrite `opd_session` with a tampered value →
  wait 30s → assert URL and DOM.
- Set `JWT_EXPIRY=60s` in `api/.env` (an env value, not an `api/` source edit),
  log in, sit on `/member/wallet`, and watch. This is the cheapest path and is
  what I would recommend.
- Drive it by hand in a browser with devtools: delete the `opd_session` cookie
  while sitting on `/member/wallet`, do not navigate, wait one poll cycle.

**Cookie gotcha observed, not hit:** `opd_session` is shared across all localhost
ports. This spike used `curl` with an isolated cookie jar, so no portal collision
was possible. A browser-based repeat must close `web-tpa` / `web-operations` /
`web-finance` tabs first.

## Documentary evidence found during Step 0 — the design specified the missing half

`openspec/changes/angular-member-portal/design.md:139`, Decision 4, interceptor 2:

> **Session** — on any 401, calls `SessionStore.terminate()` once **and routes to
> login**. Centralising this is what makes the "session rejected mid-session"
> scenario hold no matter which screen issued the request; the reference does this
> inside an axios interceptor by assigning `window.location.href`, which discards
> Angular's router state.

Two things follow.

1. **The navigation was designed in, then not built.** This is not an
   under-specified edge case someone reasonably missed — the approved design names
   the exact behaviour, and names the exact scenario it exists to satisfy.
2. **The method was renamed and half-implemented.** `grep -rn terminate` across
   `src/**` returns **nothing**. The design's `SessionStore.terminate()` shipped as
   `SessionStore.expire()`, which does the "ends the session once" half
   (`session.store.ts:117-120`, correctly idempotent) and drops the "routes to
   login" half.

The design even anticipates the alternative implementation and rejects it for a
specific reason — the reference's `window.location.href` assignment "discards
Angular's router state". So `router.navigate(['/login'])` inside the interceptor is
the designed behaviour, and it is absent.

**This raises confidence in the BLOCKER substantially.** The finding no longer
rests on my reading of what *should* happen; it is a divergence between an
approved design decision and the code that implements it.

## Confidence — closed

Mechanism **confirmed** (single interceptor, no navigation). Trigger **confirmed**
live. Member-visible symptom **observed** headless. Design divergence **documented**
(`design.md:139`). Nothing about this finding is now inferred.

**Severity holds at BLOCKER.** The finding is closed as an audit item; the fix is
sequenced separately and is not this audit's work.
