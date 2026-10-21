# 39 — Support: claims that need help, and services already used

**2026-08-11, session 54.** Brief: *"in quick links we added support — in support
add claims that need help and add previous availed services so user can ask for
support."*

## What it was

The Support quick link opened `/member/helpline`: a **"Coming Soon"** panel, an
illustration, and `support@opdwallet.com`. A member with a rejected claim had to
compose the whole story themselves — starting with the reference the desk asks
for first, which is on a different screen.

## What it is now

**Claims that need your help** — the ones the API says are waiting on the
*member*: `DOCUMENTS_REQUIRED`, `RESUBMISSION_REQUIRED`, `REJECTED`. Each row
carries its reference, status, amount and provider, an **Ask for help** action,
and a link to the claim.

**Services you have used** — past bookings and orders, most recent first, ten at
most. Each with its reference, type and date, and its own **Ask for help**.

Both come from `ClaimsStore` and `BookingsStore`, which the portal already loads.
**No new endpoint.**

## The line this cannot cross, and does not pretend to

**There is no support-ticket API.** No controller in `api/src` matches support,
ticket, help, grievance or query, and neither reference has one. So "Ask for
help" is a **prefilled `mailto:`** carrying the reference, status and date.

That is the honest ceiling: the portal cannot open a ticket, but it can stop the
member retyping what the desk needs. Building a ticket UI over an endpoint that
does not exist would be the `21-degraded-not-declared.md` failure — a screen
promising something the system cannot do.

The 24/7 helpline is still unbuilt. It now says so **in one line at the bottom**
rather than as a banner across the whole screen, so the parts that do work are
not hidden behind the part that does not.

## The discrimination that matters

**Under-review claims are excluded, deliberately.** `SUBMITTED`, `ASSIGNED`,
`UNDER_REVIEW` and the payment statuses are with the assessor. Listing them under
"needs your help" would tell the member to chase something already moving —
noise that makes the real items harder to see.

Matching is on the **raw status code**, never the display label. `Claim` did not
expose one — it carried only `status.label`, which is presentation and can be
reworded without anything failing — so `statusCode` was added, mirroring
`Booking`.

## Verification

`03-live/verify-support-page.mjs` — **15/15**, non-mutating.

Real data: the screen loads, no "Coming Soon" banner, the empty state explains
that claims under assessment are not waiting on the member, ten real past
services each with a mailto carrying its own reference.

Forced (this account has no qualifying claims): all three needing-help statuses
listed; **UNDER_REVIEW and APPROVED absent**; the mail prefilled with reference
and status; three "View claim" links.

### Two harness faults, both already on record elsewhere

- **Wrong envelope shape, a third time.** The fixture sent `{success, data}`;
  `ClaimsStore` reads `list.claims`. This codebase has **at least three response
  shapes** — a bare array (dental/vision), `{success,data}` (lab), `{claims}`
  (claims) — and a wrong-shaped fixture fails as an empty list, which reads
  exactly like the feature not working.
- **The negative controls passed on an empty screen.** With nothing rendered,
  "UNDER_REVIEW is not listed" was trivially true. A guard now asserts the
  fixture arrived before the negatives are believed. Third time this pattern has
  appeared this week, after the lab reports control and the pricing gate.

## What a reader should NOT conclude

**Not that support is now handled.** Nothing is tracked, nothing is assigned, and
nobody is notified. The member gets a prefilled email; whether it is answered is
outside this portal entirely.

---

# PART TWO — asking the questions instead of opening a blank email

*"and when ask for help ask questions that are needed."*

The first version opened a `mailto:` with the reference in the body and an empty
line under *"Please describe what you need help with"*. That hands the member a
blank email and hands the desk a reply reading *"my claim was rejected"* — one
round trip before anyone can act.

**Three questions, and deliberately no more:**

| Asked | Why |
|---|---|
| what kind of problem | a fixed list — **the desk routes on this, and free text does not route** |
| what happened | the only part the portal cannot know |
| where to reach you | prefilled from the profile, editable — the number on file is not always the one they want called |

**Nothing else is asked.** Reference, status, category, amount, provider and date
are carried as context. Asking a member to retype what is printed on the screen
behind the form is asking a question that is already answered.

**The options depend on why the item is stuck.** A REJECTED claim is asked about
the decision ("I want to understand why", "I think the decision is wrong");
DOCUMENTS_REQUIRED and RESUBMISSION_REQUIRED are asked about documents ("I do not
know which are needed", "I already uploaded these"). One merged list would make
every member scroll past options that cannot apply to them.

**It refuses to send until answered, and says which answer is missing** rather
than only greying the control — the stale-message rule from session 41 applied to
a new form.

**One form at a time.** Two open forms invite the member to fill in the wrong one.

## Verification

`03-live/verify-support-page.mjs` — **24/24**, non-mutating.

New assertions: a form opens rather than a blank email · it asks all three
questions · the phone is prefilled from the profile · **send is blocked with no
href while incomplete** · it names the missing answer · a completed form composes
mail carrying both the answers and the context · **a REJECTED claim gets
decision questions while a DOCUMENTS_REQUIRED claim gets document questions** ·
only one form open at a time.

## Still the same ceiling

The transport is email. Nothing is tracked, assigned or acknowledged. **The form
is the honest half of a ticket** — the questions are real even when the transport
is not. If a ticket endpoint ever lands, the answers already have the shape a
ticket needs and only `mailto()` changes.

---

# PART THREE — collapsible sections

*"add dropdown in policy what covered and whats not covered and also in support
services and claims add dropdown."*

`shared/ui/disclosure.ts`, on native **`<details>`/`<summary>`** rather than a
signal and a click handler. The browser supplies keyboard operation, the correct
ARIA semantics, open/closed state, and find-in-page that opens the section
containing the match. A hand-rolled accordion would be more code and would need
every one of those added back.

Applied to four sections: **What's Covered** and **What's Not Covered** on policy
details (which already existed, as always-expanded panels), and **Claims that
need your help** and **Services you have used** on Support.

**Each summary carries a count.** A collapsed section with no count makes the
member open it to find out whether it was worth opening.

**What starts open follows what the member has to do:**

| Section | Default | Why |
|---|---|---|
| Claims that need your help | **open** | something needs doing, and hiding it is the wrong default |
| Services you have used | closed | ten rows of history nobody has asked about would push the actionable list off screen |
| What's Covered / Not Covered | closed | reference material, read on demand |

## Verification

**31/31.** New: both are collapsible · services starts closed and its rows are
**not visible** · its summary states the count without opening · opening reveals
the rows · claims starts **open** because it has items · its summary counts them.

**Asserting on visibility, not DOM count, is the point.** A closed `<details>`
keeps its children in the DOM, so `locator('li').count()` returns ten on a
collapsed section and a count-based assertion would pass whether or not the
dropdown worked.

### A harness bug worth naming

Two assertions failed against correct code because a patch wrote `` through a
non-raw Python string, putting a literal **backspace byte (0x08)** into the
regex: `/<BS>10<BS>/` can never match. The output rendered as `/^H10^H/` only
under `cat -A`.

That is the fourth escaping failure in this session's tooling — after the
backticks in an inline template, the heredoc newline collapse, and the wrong
envelope shapes. **The generator is the weak link, not the code being
generated**, and every one of these presented first as a failing assertion
against working software.


## Part 4 — grievances are real for claims (2026-10-14/15)

The Support page now saves **claim** grievances and reads them back: the claims
listing feeds "Claims that need your help"; "Send to support" calls
`POST habit-opd/api/v1/opd_dispute` (`submit`, the member's words in `final_reason`, documents in `documents`); tickets (`GET_PAGE`) and threads
(`GET_DISPUTE_MESSAGES`) are fetched from the API and refreshed every 30 s; replies
go out as `userReply`. The raise form takes optional documents (DMS), which show on the ticket and download from DMS. "Claims that need your help" reads every page of the claims listing. The member
cannot reopen a closed ticket and claim detail has no payment section.
Nothing is kept in the browser, so a refresh shows the same tickets.

Backend quirks the portal works around (commas/colons in `args`, the 3-second
same-action guard) and the points for the backend team are listed
in `PLACEHOLDER-APIS.md` section 7. Still placeholder: Mark resolved by the
member, notifications, central configuration and service-line (non-claim) grievances. Phone layouts are covered by emulated iPhone 13 / Pixel 7 tests, real devices by hand.

Spec: `openspec/changes/2026-10-14-dispute-integration/`. Browser tests:
`tests/e2e/disputes/` (a fake of the API, plus `live-api.spec.ts` against the real
one when `SESSION_ID` is set).

## Update: claims paging and ticket details (2026-10-15)

The real claims listing repeats its first page for later 20-row pages (39 rows, only 20 distinct claims), so the Support page now reads one 100-row page and removes repeats; all claims are reachable and Load more shows five at a time. `benefit_category` is the claim's own category code, a reply refused by the backend's 3-second guard is retried once, and a missing document says "This document is no longer available". Verified: 46 unit, 65 browser (desktop and phone) and 3 live API tests.

## Update: Mark resolved and backend check (2026-10-15)

The backend (`new_prod`) now has `userResolve`, so "Mark resolved" works on real tickets: it closes the ticket, shows "You marked this resolved", survives a refresh and cannot be undone. The backend also enforces one open ticket per claim and the 3-month window, and added a `description` field. The live claims listing still repeats pages at 20 rows (49 rows, 32 distinct), so the 100-row read stays. Verified: build clean, 52 unit, 72 browser (desktop and phone), 3 live API tests; the duplicate, 3-month, `description` and `userResolve` paths were also exercised against the live API, and a member-closed ticket stays closed after a reload.

## Update: replies moved to dispute_chat (2026-10-15 evening)

The backend moved `userReply` to the `dispute_chat` resource (the old `dispute` + `userReply` now answers "Invalid Query"), and refuses replies on resolved or closed tickets. The portal now posts `{resourceType: "DisputeChat", dispute_id, message_text}` plus the swapped `args`, so it works on both backend builds; if support closes a ticket while the member types, the refusal is shown and the ticket refreshes to closed. Verified: build clean, 54 unit, 74 browser (desktop and phone) and 4 live tests (raise, reply, document, resolve, reload). Still open on the backend: claims paging, `description` into Twenty, and Twenty's callback still using the old reply path.

## Update: backend recheck, replies verbatim (2026-10-15 night)

The backend now reads the reply from `message_text` (stored verbatim, empty refused, member name instead of id), so the portal sends only `message_text` and the comma and colon lookalike swap is gone for new replies. Verified: build clean, 55 unit, 74 browser and 4 live tests (a first message and a reply with commas, colons, ₹ and an emoji come back exactly as typed). Still open on the backend: claims paging (unstable sort), `description` into Twenty (`daf8d03` not merged), replies into Twenty, and unauthenticated `adjudicate` and `agentReply`.

## Update: backend paging fixed, Twenty status (2026-10-16)

The backend now orders claims by `g_creation_time DESC, id DESC`: at 20 a page the pages return 20, 20, 20 and 2 rows (62 distinct claims, the same set as one 100-row read). The portal keeps its single 100-row read with repeats removed. Live check of a new ticket on 16 Oct: the Twenty record is created with Ticket ID and Description (verbatim), but the Dispute ID still carries the ticket number, the claim link and reason are not filled, and member replies and closes do not reach Twenty yet; the Twenty reply panel still fails until the app is re-applied. Portal: build clean, 55 unit and 74 browser tests pass.

## Update: backend resources renamed with the `opd_` prefix (2026-10-17)

The backend (`new_prod`, merge of `feature/policy-validator`) renamed the resources: `claim` is now `opd_claim`, `dispute` is `opd_dispute` and `dispute_chat` is `opd_dispute_chat`; the old URLs answer 404. Query and action names (`GET_CLAIMS_BY_USER`, `GET_PAGE`, `GET_DISPUTE_MESSAGES`, `submit`, `userReply`, `userResolve`) are unchanged. The portal now calls the new names everywhere (Support page, claims list, dashboard, new claim, claim detail). Pharmacy followed too: `opd_pharmacy_cart` is now `opd_pharmacy_consumption` (same actions and queries, 10 fields added, none removed); the `opd_cart` controller was removed and the portal does not use it. Verified: build clean, 55 unit and 74 browser tests; live check pending a signed-in session.

## Update: draft claims, live check on the `opd_` names (2026-10-19)

Claims still in DRAFT are no longer listed under "Claims that need your help", so a grievance cannot be raised on an unsubmitted claim (the backend accepted two on drafts and should refuse them too). Live check on the new names with a fresh member and two draft claims: claims list, ticket with document, document download (PDF 1,088,420 bytes, matches the stored size), reply with a comma, semicolon and ₹ stored verbatim, a long description with quotes, a colon, ₹, & and % stored verbatim, Mark resolved (status RESOLVED, last sender MEMBER), and Send to support disabled for "Other" with no description. No Twenty record was created for either ticket (`twenty_dispute_id` empty): expected, because both claims were drafts and a draft claim is not meant to have a grievance (Twenty is only fed from submitted claims). A fresh check on a submitted claim is still needed. Portal: build clean, 55 unit and 76 browser tests pass.

## Update: the portal stops sending `final_reason` (2026-10-21)

New tickets send the member's words only as `description` (checked 16 Oct: it arrives verbatim in Twenty on portal tickets). `final_reason` is not sent, so it stays blank until support closes the ticket and Twenty's Resolution Reason no longer shows the member's words. The backend does not require it (only `claim_id` and `name`). Tickets raised earlier keep the member's words in `final_reason`, so the closed-ticket display rule stays for them. Verified: build clean and 76 browser tests pass (the unit test change could not be run: the unit test setup was unavailable).
