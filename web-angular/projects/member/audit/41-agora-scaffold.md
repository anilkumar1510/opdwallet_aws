# 41 — Agora client, scaffolded

**2026-08-14, session 56.** Brief: *"Agora client scaffolded"*, SDK 4.24.

## What this system actually runs, before any of this

**Not Agora. Daily.co, on three clients.**

| | |
|---|---|
| `web-member` | `@daily-co/daily-js` + `daily-react` |
| `web-doctor` | same |
| `web-member-rn` | same, in `consultations/[appointmentId].tsx` |
| API | provisions rooms: `roomId`, `roomName`, `roomPassword`, `roomUrl`, plus a legacy `jitsiDomain` from an earlier migration |

`POST video-consultations/join` returns
`{ consultationId, roomName, roomUrl, doctorName, patientName, status }`.
**Agora appears nowhere** — no package, no env var, no code, in any of the eight
apps in this repo.

So this is a platform swap, not an integration, and it is three clients plus the
API. This change is the member client's share of it, and only that.

## Built

**`agora-rtc-sdk-ng@4.24.7`**, production dependencies clean (`npm audit
--omit=dev`: 0). Declared in `allowedCommonJsDependencies` — the SDK is CommonJS
and the build warns about optimization bailouts otherwise.

**`core/video/video.ts`** — endpoints, DTOs, and `agoraReadiness()`, which
returns *which single piece* is missing rather than a boolean:

```
NO_APP_ID → NO_CHANNEL → NO_TOKEN → READY
```

in the order a member hits them. `AgoraJoinFields` documents the shape the API
would need to add. Writing it down rather than guessing at call time is what
lets the screen say something useful.

**`core/video/agora.client.ts`** — joins, publishes, subscribes, toggles mic and
camera, and **releases the devices on the way out**. The SDK is behind a
**dynamic `import()`**, never module scope.

**`core/video/consultation.store.ts`** — calls `join` once per appointment.
Called on open, not on hover: `join` is a WRITE that stamps `patientJoinedAt`.

**`features/consultations/consultation-room-page.ts`** at
`/member/consultations/:appointmentId`, the reference's own route.

## What it does while Agora is unconfigured

It **names the missing piece** and offers the Daily room the rest of the estate
uses, so the member is not stranded:

> Video calling is not configured in this build — no Agora app id is set.
> **[Open the consultation room]**

And it offers **no "Join call" control at all** in that state. A join button over
a connection that cannot be made is exactly the defect this audit has spent weeks
removing; building the scaffold that way would have been building it wrong.

## Verification

`03-live/verify-agora-scaffold.mjs` — **10/10**. `join` is intercepted in every
case, so nothing is written server-side.

| | |
|---|---|
| positive | the room loads and names the consultation; `join` called once |
| ✔ | with the API's REAL shape it reports **no app id** — the first missing piece |
| ✔ | with app id + channel but no token it reports **the token**, and says why |
| negative | **no join control** in either unready state |
| ✔ | the Daily room link is offered, pointing at the real `roomUrl` |
| ✔ | with all three present, the join control appears and the notice goes |
| negative | **a bogus token fails loudly** |

That last one is the strongest evidence the path is real rather than mocked. The
SDK loaded, attempted a connection, and returned:

```
AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: invalid vendor key, can not find appid
```

An error from Agora's own gateway, surfaced to the member. Nothing about that is
stubbed.

**The initial bundle is unchanged.** Agora is a 1.5 MB lazy chunk; the initial
total is 331 kB (85 kB transferred), and no initial chunk contains `AgoraRTC` —
checked by grepping the emitted files listed in `index.html`.

### An assertion that failed against correct code

The first run expected the *token* message with nothing configured. Readiness
correctly reported the *app id* — the first missing piece, by design. The
assertion was wrong, not the code; both cases are now covered separately.

## Not done, and not startable from here

**No entry point.** Nothing links to `/member/consultations/:id`. A "Join call"
button on the bookings row would promise a connection this cannot make. It goes
in when tokens do.

**The token endpoint.** Agora tokens must be signed with the App Certificate
server-side. `api/src/**` is read-only for this audit, and no credentials were
supplied. This is the whole remaining gap on the member side.

**The other two clients.** `web-doctor` and `web-member-rn` are still on Daily,
and RN needs `react-native-agora` — a different SDK with native build
implications for the Expo setup. **Until the doctor app moves, a member joining
an Agora channel is alone in it.**

## What a reader should NOT conclude

**Not that video calling works.** No call has ever connected through this code.
What is proven is that the join path is wired, that failures surface, and that
the screen tells the truth about why it cannot connect yet.
