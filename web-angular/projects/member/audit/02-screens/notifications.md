# notifications

Audited as one unit — badge, dropdown and page all share `NotificationsStore`,
so their read state cannot diverge by construction.

- React:   `web-member/components/NotificationBell.tsx` → no route; header only
- RN:      `web-member-rn/app/member/notifications.tsx` → `/member/notifications` (full screen)
- Angular: `features/shell/member-shell.ts` (badge + dropdown) · `features/notifications/notifications-page.ts` → `/member/notifications`
- Spec:    `member-shell` (badge is a shell surface; the page itself is `UNSPECIFIED`)
- Status:  **PARITY** for badge and dropdown · **DEBT** for the page

## API integration

| Verb + path | React | RN | Angular | Notes |
|---|---|---|---|---|
| `GET /api/notifications/unread-count` | ✅ 30s poll | ❌ | ✅ 30s poll | Angular matches React's cadence exactly (`notifications.store.ts:16`) |
| `GET /api/notifications?limit=` | ✅ `limit=10` | ✅ `limit=6&page=1` | ✅ `limit=10` | Angular matches React, not RN |
| `PATCH /api/notifications/:id/read` | ✅ | ✅ fire-and-forget | ✅ with rollback | |
| `PATCH /api/notifications/mark-all-read` | ✅ | ✅ | ✅ | |
| `DELETE /api/notifications/:id` | ❌ | ✅ | ❌ | **RN-only — see finding** |
| `GET /api/notifications/:id` | ❌ | ❌ | ❌ | unconsumed by all three |

## Findings

### [UNSCOPED] Deleting a notification exists only in RN

`web-member-rn/app/member/notifications.tsx:274` calls
`apiClient.delete('/notifications/${id}')`, and the API serves it
(`DELETE /api/notifications/:id`, confirmed in the route table). Neither React nor
Angular has it.

Filed `UNSCOPED` rather than `GAP` under the amended taxonomy: React is the
reference and React cannot delete a notification, so this was never in scope —
it is part of the RN-only surface decision. It is worth flagging because the
Angular *page* is a port of RN's screen, and RN's screen has a delete affordance
the Angular one does not.

### [DRIFT — RN only] RN derives the unread count client-side

RN computes `notifications.filter(n => !n.isRead).length` (`notifications.tsx:302`)
from a **6-item** page, so its badge is wrong whenever a member has more than six
unread. React and Angular both read the server's `unread-count`. Angular is
correct; recorded so the RN behaviour is not mistaken for a reference to match.

### [DEBT] The page has no approved spec

`/member/notifications` was added 2026-08-07. `member-shell` specifies the badge
as a shell surface but says nothing about a dedicated screen. React has no such
route, so there is no reference behaviour to conform to either — the page is a
port of the RN screen. Sequence it into whichever follow-up change covers the
shell.

### [NOTE] `actionUrl` is validated before it is followed

`core/notifications/notification.ts:73` accepts `actionUrl` only when it starts
with `/`, so an API-supplied external URL is dropped rather than navigated to.
Neither reference app does this. Deliberate and correct; recorded so it is not
re-reported as a missing feature.

## Flows

| Flow | React | Angular |
|---|---|---|
| Badge poll | 30s `setInterval`, silent on failure | same; `refreshBadge()` keeps the previous count on error |
| Open dropdown | fetches list on open | same — `toggleNotifications()` calls `load()` only when opening |
| Tap a notification | marks read, navigates if `actionUrl` | same, plus the `/`-prefix guard |
| Mark all read | ✅ | ✅ |
| Delete one | ❌ | ❌ (RN only) |
| Open full page | n/a | `load()` on `ngOnInit`; same store, same 10-item window |

**Idle cost is matched to the reference deliberately**: the list is fetched only
when the dropdown opens, so an idle session costs one small request per 30s.
Documented at `notifications.store.ts:22-25`.

## State

One `providedIn: 'root'` store holds `notifications`, `unread`, `loading`, all
exposed `.asReadonly()`. The badge, the dropdown and the page read the same
signals, so marking one read updates all three with no invalidation step — the
signal-store equivalent of React's cache invalidation, and stronger here because
React's `NotificationBell` owns its own state and the RN screen owns a separate
copy.

`markRead()` is optimistic with rollback (`notifications.store.ts:100-115`): it
flips the row and decrements the badge immediately, then restores both if the
PATCH fails. React does not roll back. Angular ahead.

Session-scoped, not family-scoped — deliberately. `notifications.store.ts:20-22`
notes that unlike the wallet, notifications do not follow
`FamilyStore.activeMember()`. Confirmed: the store injects `SessionStore` only.
**This is a behaviour to verify live** — see `family.md`.

## Non-happy paths

| Path | Angular |
|---|---|
| Badge request fails | previous count kept; nothing shown to the member |
| List request fails | list set to `[]` — **renders as "You have no notifications."** |
| Empty list | same empty state as a failed load — see below |
| Mark-all fails | silently leaves them unread |
| 401 on the poll | `expire()` — the BLOCKER trigger; see `session-lifecycle.md` |

### [DRIFT] A failed list load is indistinguishable from an empty list

`notifications.store.ts:86` sets `_notifications.set([])` in the catch. Both the
dropdown and the page then render "You have no notifications." A member whose
request failed is told, positively, that they have none.

React has the same shape (`NotificationBell.tsx:62` logs and leaves the list
empty), so this is **not a regression** — it is inherited. Recorded because
`member-shell` specifies "Data load fails" as a distinct presentation from empty,
and this screen does not satisfy it on either side.

## Guards / permissions

Inherits `authGuard` from the `/member` parent. No role check — correct; there is
one member role. Not family-scoped by design.

## Navigation edges

- In: bell button (every screen, via shell) · direct URL `/member/notifications`
- Out: `item.actionUrl` when `/`-prefixed · back to `/member` from the page header
- **Missing edge:** nothing in the shell links to `/member/notifications`. The
  dropdown has no "see all" affordance, so the page is reachable only by typing
  the URL. On a narrow viewport — the case the page exists for — a member cannot
  get to it at all. Filed as [GAP] below.

### [GAP] The notifications page is unreachable from the UI

The route was added but no entry point was. The bell opens the dropdown at every
width; `DESTINATIONS` does not include notifications; the profile menu does not
link to it. RN reaches its screen from the header bell.

This is the one finding on this screen that costs a member something today.

**Provenance — this audit's own work created it.** The route and component were
added on 2026-08-07, in the session immediately before this audit began, in
response to "add the missing routes". `ng build member` passed and a lazy chunk
was emitted, and that was taken as done.

**Adding a route and adding a way to reach it are separate acts.** A green build
proves only the first: the compiler verifies the component resolves, never that
anything links to it. On a narrow viewport — the exact case the page exists for,
since a dropdown anchored to a 9×9 button is a poor list on a phone — the screen
cannot be reached at all.

Recorded with attribution rather than as an anonymous defect, because the lesson
generalises to the ~60 DEBT routes: any of them added the same way carries the
same risk, and `ng build` will stay green for all of them.

## Active-appointment nudge

React mounts `ActiveAppointmentNudge` in `app/member/layout.tsx`, so it would
render above this screen too. Angular has no equivalent anywhere — see
`shell-nav.md`. Not re-filed here.
