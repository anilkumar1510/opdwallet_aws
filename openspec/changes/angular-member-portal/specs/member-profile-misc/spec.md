# member-profile-misc

Retro-spec transcribed from `web-member/` on 2026-08-07. Covers six routes that
shipped before any spec existed: `/member/profile`, `/member/services`,
`/member/health-checkup`, `/member/helpline`, `/member/pharmacy`,
`/member/settings`.

Grouped because they are the portal's non-journey screens — one data screen, one
directory, three placeholders and one settings shell. They share no flow.

**Own reference read, per method rule.** Nothing inherited from lab, diagnostics,
vision or dental — those pairings were wrong three times out of four.

## What the reference actually is here

Read directly rather than pattern-matched. Only **one** of the six calls an API:

| Route | Reference | Calls |
|---|---|---|
| `/member/profile` | 479 lines, real screen | `member/profile` |
| `/member/services` | 291 lines, **static link directory** | none |
| `/member/settings` | 244 lines, tabs + local toggles | none |
| `/member/health-checkup` | 116 lines, "Coming Soon" | none |
| `/member/helpline` | 84 lines, "Coming Soon" | none |
| `/member/pharmacy` | 121 lines, "Coming Soon" | none |

This is the most presentation-heavy group transcribed so far, which is exactly
where ambient-data assertions caused this audit's one real assertion defect. Every
scenario below is written to be verified against **forced** state.

## Register — conformance and divergence, both recorded

- **Entry 5** — *unviolatable* here. No screen in this group creates a booking or
  takes a payment.
- **Entry 10** — does not apply. No pickers.
- **Dead links dropped (new, see register entry 11).** The reference's services
  directory links to `/member/reimbursements`, `/member/notifications` and
  `/member/help`. **`/member/reimbursements` and `/member/help` exist in neither
  portal** — verified. Angular drops all three rather than shipping dead links
  (`features/misc/services-page.ts:13-16`).
- **Settings' password fields have no save path in the reference** — no `<form>`,
  no submit handler, no endpoint. Angular reproduces them as static inputs and says
  so inline (`settings-page.ts:23`). Specified below as presentational, because
  specifying "the member can change their password" would describe a capability
  that does not exist on either side.

## ADDED Requirements

### Requirement: Member profile
The portal SHALL present the signed-in member's own profile details, scoped to the active family member.

#### Scenario: Profile displayed
- **GIVEN** an authenticated member
- **WHEN** the profile screen loads
- **THEN** their identifying details are shown, with coded values resolved to readable labels

#### Scenario: Profile follows the active family member
- **GIVEN** a primary member who has switched to a dependent
- **WHEN** the profile screen loads
- **THEN** the dependent's details are shown

#### Scenario: The member's own details always render
- **GIVEN** an authenticated member
- **WHEN** the profile screen loads
- **THEN** their identifying details render from the session
- **AND** no placeholder identity is ever substituted, whatever else fails

Rule: the member's own details come from the session, not from a separate profile
request, so they cannot fail independently. Corrected 2026-08-08 during backlog
verification — the original scenario asserted an error state for a request the
screen does not depend on, and passed only because the assertion was never forced.

#### Scenario: Saved addresses fail to load
- **GIVEN** the addresses request fails
- **WHEN** the profile screen loads
- **THEN** the member's own details still render
- **AND** the addresses section shows that they could not be loaded, distinct from having none

### Requirement: Service directory
The portal SHALL present a directory of the portal's destinations, and SHALL NOT offer destinations that do not exist.

Rule: A directory entry whose target route does not exist is omitted, not rendered as a dead link.

#### Scenario: Destinations listed
- **WHEN** the services screen loads
- **THEN** the portal's available destinations are listed, each navigating to a route that exists

#### Scenario: Entry for a non-existent route
- **GIVEN** a directory entry whose target route is not implemented
- **WHEN** the services screen loads
- **THEN** that entry is not shown

### Requirement: Placeholder screens
The portal SHALL present the unbuilt capabilities as explicitly unavailable rather than as broken screens.

#### Scenario: Unbuilt capability
- **GIVEN** a member opening health checkup, helpline, or pharmacy
- **WHEN** the screen loads
- **THEN** it states the capability is not yet available
- **AND** offers a way back into the portal

### Requirement: Settings
The portal SHALL present the member's settings, and SHALL NOT present controls that cannot take effect as though they can.

Rule: The reference's password fields have no save path. They are presentational on both sides; this requirement records that deliberately so a future reader does not implement a capability the reference never had.

#### Scenario: Settings displayed
- **GIVEN** an authenticated member
- **WHEN** the settings screen loads
- **THEN** their settings are shown

#### Scenario: Sign out from settings
- **GIVEN** an authenticated member on settings
- **WHEN** they sign out
- **THEN** the session ends and they are taken to the login screen

#### Scenario: Presentational controls
- **GIVEN** a settings control with no persistence behind it
- **WHEN** the member interacts with it
- **THEN** nothing is claimed to have been saved

### Requirement: Support
The Support screen SHALL list the claims that are waiting on the member and the services they have already used, and SHALL let them raise each one with the support desk carrying its own reference.

Rule: A claim needs help when the API says it is waiting on the MEMBER — `DOCUMENTS_REQUIRED`, `RESUBMISSION_REQUIRED` or `REJECTED`. Claims under assessment (`SUBMITTED`, `ASSIGNED`, `UNDER_REVIEW`, the payment statuses) are excluded: they are with the team, and inviting the member to chase them is worse than saying nothing.

Rule: Matching is on the API's raw status code, never the display label. The label is presentation and can be reworded without anything failing.

Rule: Only services already taken are listed. An upcoming booking is not yet something to raise an issue about.

Rule: **There is no support-ticket endpoint** — no controller in the API matches support, ticket, help or grievance, and neither reference has one. The portal cannot open a ticket; it can collect what a ticket would need and hand it over by email.

Rule: Asking for help SHALL ask the three questions the desk cannot answer for itself — what kind of problem, what happened, and where to reach the member — and SHALL NOT ask for anything the portal already knows. Reference, status, category, amount and date are carried as context, because asking a member to retype what is printed on the screen behind the form is asking a question that has already been answered.

Rule: The problem options depend on WHY the item is stuck. A rejected claim is asked about the decision; a claim missing documents is asked about documents. One merged list makes every member scroll past options that cannot apply to them.

Rule: The request cannot be sent until the questions are answered, and the screen names which answer is missing rather than only disabling the control.

#### Scenario: A claim is waiting on the member
- **GIVEN** a claim the API reports as DOCUMENTS_REQUIRED, RESUBMISSION_REQUIRED or REJECTED
- **WHEN** the member opens Support
- **THEN** that claim is listed with its reference and status
- **AND** it offers a way to ask for help
- **AND** it links to the claim itself

#### Scenario: Asking for help
- **GIVEN** a member who has chosen an item to get help with
- **WHEN** the request form opens
- **THEN** they are asked what kind of problem it is, what happened, and where to reach them
- **AND** the contact number is prefilled from their profile
- **AND** the request cannot be sent until all three are answered
- **AND** the message that is composed carries their answers together with the item's reference and status

#### Scenario: The questions match why the item is stuck
- **GIVEN** a rejected claim and a claim missing documents
- **WHEN** help is requested on each
- **THEN** the rejected one is asked about the decision
- **AND** the other is asked about documents

#### Scenario: One request at a time
- **GIVEN** an open request form
- **WHEN** the member asks for help on a different item
- **THEN** only the newly chosen form is open

#### Scenario: A claim is with the assessor
- **GIVEN** a claim under review or already approved
- **WHEN** the member opens Support
- **THEN** it is not listed as needing help

#### Scenario: Nothing is stuck
- **GIVEN** a member with no claims waiting on them
- **WHEN** they open Support
- **THEN** the screen says so, and says that claims under assessment are not waiting on them

#### Scenario: Raising an issue with a past service
- **GIVEN** a member who has used a service
- **WHEN** they open Support
- **THEN** that service is listed with its reference and date
- **AND** it offers a way to ask for help carrying that reference

> **Session 54.** The Support quick link previously opened a "Coming Soon" panel
> with a bare email address: a member with a rejected claim had to compose the
> whole story themselves, starting with the reference. Both lists come from stores
> the portal already loads — no new endpoint. The 24/7 phone line is still
> unbuilt and the screen now says so in one line instead of as a banner over
> everything. `audit/39-support-screen.md`.

### Requirement: Collapsible sections
Long lists on the policy and support screens SHALL be collapsible, and a collapsed section SHALL state how many items it holds.

Rule: A collapsed section with no count makes the member open it to find out whether it was worth opening. The count goes in the summary.

Rule: What starts open follows what the member has to DO, not what the screen wants to show. A list of claims waiting on the member starts open; ten past services nobody has asked about start closed.

#### Scenario: What is covered and what is not
- **GIVEN** a policy with inclusions and exclusions
- **WHEN** the member opens policy details
- **THEN** each is a collapsible section stating how many clauses it holds
- **AND** opening one reveals its clauses

#### Scenario: Support lists
- **GIVEN** a member with claims that need help and past services
- **WHEN** they open Support
- **THEN** both lists are collapsible sections showing their counts
- **AND** the claims list starts open because it needs action
- **AND** the services list starts closed

> **Session 54.** Built on native `<details>`/`<summary>` rather than a signal and
> a click handler: keyboard operation, ARIA semantics and find-in-page that opens
> the matching section all come from the browser. A hand-rolled accordion would
> be more code and would need each of those added back.
