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
