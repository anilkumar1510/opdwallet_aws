# shell-nav

- React:   `web-member/app/member/layout.tsx` + `components/layout/ResponsiveLayout.tsx` + `components/BottomNavigation.tsx`
- RN:      `web-member-rn/app/member/_layout.tsx`
- Angular: `features/shell/member-shell.ts` + `features/shell/destinations.ts`
- Spec:    `member-shell`
- Status:  **GAP**

## Destination parity — clean

`destinations.ts` is a single list driving both the desktop bar and the mobile
pill, so the spec's "Destination parity" scenario is structural rather than
maintained by hand. Compared against React's `bottomNavItems`:

| # | Angular `DESTINATIONS` | React `bottomNavItems` | Match |
|---|---|---|---|
| 1 | `/member` — Home (`exact: true`) | `/member` — Home | ✅ |
| 2 | `/member/claims` — Claims | `/member/claims` — Claims | ✅ |
| 3 | `/member/bookings` — Bookings | `/member/bookings` — Bookings | ✅ |
| 4 | `/member/wallet` — Wallet | `/member/wallet` — Wallet | ✅ |

Active-state matching also matches: exact comparison for `/member`, `startsWith`
for the rest (`BottomNavigation.tsx:74-79` vs `Destination.exact`).

React's desktop surface filters Home out of the secondary list
(`BottomNavigation.tsx:204`); Angular does the same via
`SECONDARY_DESTINATIONS = DESTINATIONS.filter(d => !d.exact)` (`destinations.ts:51`).

## API integration

| Verb + path | React | RN | Angular | Notes |
|---|---|---|---|---|
| `GET /api/auth/me` | ✅ | ✅ | ✅ | |
| `GET /api/notifications/unread-count` | ✅ `NotificationBell` | ✅ | ✅ 30s poll | see `notifications.md` |
| `GET /api/member/family` | ✅ `SwitchProfileModal` | ✅ | ✅ `member-switcher.ts` | |
| `GET /api/appointments/user/:id/ongoing` | ✅ `ActiveAppointmentNudge` | ? | **declared, no caller** | see finding below |

## Findings

### [GAP] The shell-level active-appointment nudge is not ported

React mounts `ActiveAppointmentNudge` in **`app/member/layout.tsx`** — the member
layout, so it renders on *every* member screen, and again separately on
`app/member/page.tsx` (home). It takes a `variant: 'mobile' | 'desktop' | 'section'`
prop, so it has three presentations across those two mount points.

Angular has no equivalent. `booking.mapper.ts:24` declares

```ts
ongoingByUser: (userId: string) => `appointments/user/${userId}/ongoing`,
```

and `grep -rn ongoing` across `core/**` and `features/**` returns that single
line. Nothing calls it. The endpoint is live on the API
(`GET /api/appointments/user/:userId/ongoing`, confirmed in the route table).

**Impact:** a member with a confirmed or in-progress appointment gets a persistent
prompt on every screen in React and nothing at all in Angular. This is the shell's
only always-on data surface besides the notification badge, so its absence is not
visible from any single screen file — which is why it is recorded here.

React also drives this through an event bus (`lib/appointmentEvents`,
`onAppointmentEvent` / `AppointmentEvents`) so that booking or cancelling an
appointment elsewhere refreshes the nudge. Angular has no cross-store event
mechanism; the signal-store equivalent would be a `computed()` off a bookings
store, consistent with how `WalletStore` derives from `FamilyStore`.

### Other findings

- [DEBT] `appointments/user/:p/ongoing` declared with no caller — `core/bookings/booking.mapper.ts:24`
- [NOTE] React's `ResponsiveLayout` is where the hardcoded `John Doe` mock user lives (`ResponsiveLayout.tsx:34,43`). Angular's shell has no fallback identity. Known-intentional.

## State

React: `ResponsiveLayout` fetches `/auth/me` per render with a mock-user fallback;
`NotificationBell`, `SwitchProfileModal` and `ActiveAppointmentNudge` each own
their fetch. Four independent owners of shell-level state.

Angular: one `SessionStore` for identity, `FamilyStore` for the active member,
`NotificationsStore` for the badge. Shell components inject the stores directly;
no prop drilling and no per-render fetch.

## Non-happy paths

| Path | Angular | Spec scenario |
|---|---|---|
| Data pending | per-page, not shell-level | "Data pending" — **not verified**, needs a screen-by-screen check |
| Data load fails | per-page | "Data load fails" — **not verified** |
| Retry succeeds | per-page | "Retry succeeds" — **not verified** |
| Unknown `/member/*` route | `NotFoundPage` at `app.routes.ts:337` | "Unknown member route" ✅ |
| Single family member | `member-switcher.ts` — behaviour not yet read | "Single member" — deferred to `family.md` |

The three loading/error/retry scenarios are specified at shell level but
implemented per page. Whether every page satisfies them is a per-screen question
and is carried into each screen file rather than asserted here.

## Navigation edges

- In: every `/member/*` route renders inside this shell (`app.routes.ts:17-20`).
- Out: 4 primary destinations, plus `/member/profile`, `/member/services`,
  `/member/settings` from the profile menu, plus `/login` on sign-out.
- The bell dropdown navigates to `item.actionUrl` when the API supplies one, and
  only if it starts with `/` (`notification.ts:73`) — external URLs are ignored
  rather than followed. Good; recorded so it is not flagged as a missing feature.

## Responsive behaviour

Spec requires one route tree, no device sniffing. Confirmed: a single
`MemberShell` renders both surfaces by CSS breakpoint, and `app.routes.ts:6-8`
documents the intent. No `userAgent` check exists anywhere in `features/**`.
The "Resizing across the breakpoint keeps the route and already-loaded data"
scenario cannot be settled statically — it is task 4.8 and belongs to Phase 3.
