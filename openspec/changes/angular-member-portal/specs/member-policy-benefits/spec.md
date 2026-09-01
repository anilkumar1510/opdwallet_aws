# member-policy-benefits

Retro-spec transcribed from `web-member/` on 2026-08-08. Covers `/member/benefits`,
`/member/benefits/:categoryId`, `/member/policy-details/:policyId`.

**Own reference read**, one level below the route list — the AHC lesson: its route
list and endpoint diff both said it was built, and reading the feature found no
commit path. These three are presentational and have no commit path by design;
confirmed rather than assumed.

Every scenario is written to be verified against **forced** state. This is the most
presentational vertical transcribed, and presentation scenarios asserted against
ambient data is where this audit's one real assertion defect lived.

## Register — two entries apply, both as carve-outs

- **Entry 1** — the benefits cards draw their figures from `wallet/balance`, not
  from the reference's `member/benefit-components`, `member/wallet-rules` and
  `member/coverage-matrix`. **All three answer 404**, and the reference guards each
  with `if (response.ok)`, so it silently falls back to eight hardcoded cards with
  invented figures. Angular renders real wallet figures instead. Sanctioned; the
  requirements below describe the Angular behaviour.
- **Entry 13** — `/member/benefits/:categoryId` is an **Angular-only** route. The
  reference has no per-category screen. It composes `WalletStore`, `BookingsStore`
  and `TransactionsStore` and introduces no endpoint, which is why it is a
  presentation divergence rather than scope. Its scenarios below describe Angular's
  behaviour with the entry cited — they are not gaps against the reference.
- Entry 5 — no payment, no booking creation anywhere in this vertical.
  *Unviolatable*, recorded so a reader does not look for it.
- Entry 10 — does not apply. No pickers.

## ADDED Requirements

### Requirement: Benefit categories
The portal SHALL present the member's benefit categories with figures drawn from their actual wallet, scoped to the active family member.

Rule: Figures come from the wallet, never from hardcoded defaults. A category the member's cover does not include is not presented as available.

#### Scenario: Categories listed with real figures
- **GIVEN** a member with an active wallet
- **WHEN** the benefits screen loads
- **THEN** each covered category is listed with its allocated and remaining amounts
- **AND** those amounts match the member's wallet, not a fixed default

#### Scenario: Exhausted category
- **GIVEN** a category the member has fully consumed
- **WHEN** the benefits screen loads
- **THEN** it is shown as fully used rather than as having a remaining balance

#### Scenario: Unlimited category
- **GIVEN** a category with no monetary cap
- **WHEN** the benefits screen loads
- **THEN** it is presented as unlimited rather than as a number

#### Scenario: No wallet for the active member
- **GIVEN** a member with no active wallet for the current policy period
- **WHEN** the benefits screen loads
- **THEN** an empty state explains that no benefits are available
- **AND** no category is shown with invented figures

#### Scenario: Benefits fail to load
- **GIVEN** the wallet request fails
- **WHEN** the benefits screen loads
- **THEN** an error state is shown, distinct from the no-wallet empty state
- **AND** a retry is offered

#### Scenario: Benefits follow the active family member
- **GIVEN** a primary member viewing their own benefits
- **WHEN** they switch the active family member to a dependent
- **THEN** the categories refresh to that dependent's cover without a manual reload

### Requirement: Benefit category detail
The portal SHALL present a single benefit category's balance together with the member's activity in that category.

Rule: This route composes data the member already has — wallet balance, bookings and transactions — and introduces no endpoint. It is an Angular-only presentation, sanctioned as parity register entry 13.

Rule: Where a category already has a dedicated journey, this route forwards to it rather than presenting a second, weaker version of the same screen. Only categories without one render the composed view.

#### Scenario: Category with a dedicated journey forwards to it
- **GIVEN** a category that has its own journey, such as online consultation
- **WHEN** the member opens that category
- **THEN** they are taken to that journey's own screen
- **AND** no duplicate category view is shown

#### Scenario: Category detail displayed
- **GIVEN** a member opening one of their benefit categories
- **WHEN** the detail loads
- **THEN** that category's allocated, used and remaining amounts are shown
- **AND** the bookings and transactions belonging to it are listed

#### Scenario: Category with no activity
- **GIVEN** a category the member has never used
- **WHEN** the detail loads
- **THEN** the balance is shown
- **AND** an empty state stands in for the activity list, distinguishable from a failed load

#### Scenario: Unrecognised category
- **GIVEN** a category code the portal does not recognise
- **WHEN** the detail loads
- **THEN** the API-supplied name is used as the label
- **AND** the raw code is not shown to the member

### Requirement: Policy detail
The portal SHALL present the member's policy — who it covers, when it runs, and what it includes.

#### Scenario: Policy displayed
- **GIVEN** a member opening their policy
- **WHEN** the detail loads
- **THEN** the policy number, corporate, cover period and covered members are shown
- **AND** dates are formatted, never raw

#### Scenario: Policy unavailable
- **GIVEN** a policy id that cannot be resolved
- **WHEN** the detail loads
- **THEN** a message states the policy information is not available
- **AND** the member can return to the portal

#### Scenario: Policy fails to load
- **GIVEN** the policy request fails
- **WHEN** the detail loads
- **THEN** an error state is shown, distinct from the unavailable-policy state
