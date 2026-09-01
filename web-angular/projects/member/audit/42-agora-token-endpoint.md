# 42 — Agora token minting, server-side

**2026-08-14, session 56.** The blocker from `41-agora-scaffold.md`: both clients
were ready and neither could connect, because Agora channels are joined with a
token signed by the App Certificate and nothing signed one.

**`api/src` was read-only for this whole audit and is written to here for the
first time, on instruction.**

## Built

**`agora-token@2.0.5`** — the current package. `agora-access-token` is
deprecated and npm redirects to this one.

**`video-consultation.service.ts`**

- `agoraFor(consultationId, uid)` mints an RTC token, or **returns `null` when
  the credentials are blank**
- `refreshAgoraToken(consultationId, userId)` re-mints for a call already running
- `agora` added to all three existing returns: `join` (member, uid 2) and both
  `start` paths (doctor, uid 1)

**`video-consultation.controller.ts`** — `GET video-consultations/:id/token`,
open to both roles because both are participants and both tokens expire.

**`api/.env`** — `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `AGORA_TOKEN_TTL_SECONDS`,
all appended. **`JWT_EXPIRY=7d` untouched**, as the audit requires.

## Three decisions worth the words

**Blank credentials are a designed path, not a failure.** With either env var
empty, `agoraFor` returns `null`, the response carries no `agora` block, and both
clients fall back to the Daily.co room they use today. **Adding this changed
nothing for anyone** until credentials exist.

**The certificate is read and never returned.** Only the app id — which is
public and ships to the browser anyway — and the signed token leave the server.

**Both expiry arguments are seconds from now**, not absolute timestamps. That is
the usual mistake with `buildTokenWithUid`, and it fails as tokens rejected at
the gateway rather than as an error at signing time.

## Two things that would silently break the call

**The channel must match on both ends.** `consultationId` is the key, but it is
**sanitised** to Agora's charset (letters, digits, space, a fixed punctuation set,
under 64 bytes) rather than trusted — an id format change would otherwise produce
an unjoinable channel with no error anywhere.

**The uids must differ.** Doctor 1, patient 2. Two participants sharing a uid
means the second to join evicts the first.

## Verification

**Token generation, against the real package** — same arguments and order as the
service:

```
channel sanitised : VC-1786-abc-xyz$$weird      (slash replaced)
doctor token      : 007eJxTYAjNXi7jxbcjK+Nir...  len 143
patient token     : 007eJxTYDBSMDuu7jnH/82aH...  len 143
version prefix 007: true
tokens differ     : true
```

**The route, running the new build:**

| | |
|---|---|
| `GET /:id/token` before | **404** — route absent |
| after | **401** unauthenticated — route present |
| participant, no credentials | **400** *"Agora is not configured on this server"* |
| **non-participant** | **403** *"You are not a participant in this consultation"* |

The 403 is the one that matters: **ownership is checked before anything is
signed.** A token endpoint that signs first and asks later hands any authenticated
member a way into any consultation.

### An operational finding

The API on **:4000 is `node dist/main`, started 8 August** — not a watch process.
It has been serving a six-day-old build all session and **will not serve the new
route until it is restarted**. Nothing this session depended on that (every other
change was client-side), but it explains why `/token` 404s there.

Rather than kill a long-running process, verification ran a second instance on
:4101 from the current `dist` and stopped it afterwards. :4000 was left untouched.

## What still does not work

**Nothing connects yet.** `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are empty —
no credentials were supplied. Fill them in, restart the API, and the member's
"Join call" control appears and the doctor's page switches to `AgoraVideoCall`
without another code change.

**Renewal is half-built.** The endpoint mints fresh tokens; neither client
listens for `token-privilege-will-expire` yet, so a call running past the TTL
(default one hour) still drops. That is the next code task, and it is now
unblocked.

---

# PART TWO — credentials in, entry point, renewal

## It connects

Credentials went into `api/.env`; the API was rebuilt and restarted. A token
minted by our own endpoint was then used to join Agora's real gateway from a
browser:

```
{ ok: true, uid: "2", state: "CONNECTED" }
```

That is the whole chain — env → `RtcTokenBuilder` → `GET /:id/token` → SDK →
**CONNECTED**. It also proves the two values were pasted in the right order; a
swapped pair fails at the gateway with `invalid vendor key`, which is exactly
what the bogus-token control still produces.

**The API on :4000 had to be restarted** — it was `node dist/main` from 8 August
and would never have served the new route. Old PID 20420 stopped, new one up on
the current build.

⚠ **The certificate was pasted into the working transcript and should be
rotated.** It is masked in every command output here, but the transcript has it.

## Entry point

`Join call` on the online-consult hub, to the reference's rule exactly:
**CONFIRMED, ONLINE, no prescription yet** (`online-consult/page.tsx:312`). A
prescription means the consultation is over.

Two details that would have broken it:

- **It links the Mongo `_id`, not the `APT-` reference.** `joinConsultation`
  does `new Types.ObjectId(appointmentId)`; a business id throws. `Booking.id` is
  the `_id`, `Booking.reference` is not — the identifier duality this audit keeps
  meeting.
- **It appears in the PAST list too.** The reference gates on status alone, never
  on the date, and both of this member's confirmed consultations are dated
  yesterday. Upcoming-only would have shown the control to nobody — which is how
  it first tested.

Verified: 2 links on the online hub, both 24-hex ids, **0 on the in-clinic hub**.

## Renewal

Tokens expire at 3600s. Both clients now answer `token-privilege-will-expire` by
fetching a fresh one and calling `renewToken`, and treat
`token-privilege-did-expire` as a last chance before saying the call timed out
rather than vanishing.

The endpoint re-signs correctly: **same channel, same uid, different token.**
Same-uid matters — a renewal for a different identity is rejected.

## A wrong cause, corrected

Clicking Join for a consultation the doctor has not opened rendered
**"We could not load this"** — the generic error view, because `join` answers
404. Nothing had failed; the member was early.

That is the `21-degraded-not-declared.md` failure: a screen naming the wrong
cause. `notStarted` is now distinguished from `error`, and the room says *"Your
doctor has not started this consultation yet"* with a Check again control.

## Where it stands

**Working:** credentials, minting, renewal, the entry point, and a verified
connection to Agora's gateway.

**Untested:** two participants in one channel. Every test so far has been one
side. That needs a doctor to start a consultation for an appointment this member
owns — the only `IN_PROGRESS` consultations in the database belong to another
member.

**Unchanged:** `web-member` and `web-member-rn` are still on Daily and out of
scope. When the doctor app serves Agora to Angular members, RN members lose
video — the RN decision is still open.
