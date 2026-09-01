# GATE — `/member/benefits/:categoryId` has no reference counterpart

Found during the policy & benefits reference read. **Blocks transcription of that
route; the other two in the group are clean.**

## What it is

`features/benefits/benefit-detail-page.ts` renders a per-category view composed
from stores the portal already has — `WalletStore`, `BookingsStore`,
`TransactionsStore` — showing that category's balance, its bookings and its
transactions. **It introduces no endpoint.**

## Why it needs a ruling

**The reference has no such screen.** `web-member/app/member/benefits/` has no
subroute, and its cards navigate to `/member/providers`, `/member/claims/new` and
`/member/family/add` — never to a category detail. Verified, not assumed.

The standing constraint is "no screens, steps, states, prompts or transitions the
reference doesn't have". This is a screen the reference doesn't have. It is also
plainly useful and introduces no new data, which is exactly why it should be
*ruled* rather than quietly transcribed — a spec written for it would make an
undecided addition look approved.

**Register entry 1 does not cover it.** Entry 1 is scoped to `/member/benefits`
and concerns which figures the cards display.

## The two ways this could go

- **Sanction it** as a divergence — an Angular-only screen, justified because it
  composes existing data into a view the reference achieves nowhere, and costs no
  new endpoint. It would need entry 10's first question answered: defensible
  without reference to the cost of removing it?
- **Remove it** as scope that was never agreed, folding it into the DEBT list.

Not my call. Either way the route stays out of the spec until it is made.

## Consequence for this vertical

`/member/policy-details/:policyId` and `/member/benefits` both have reference
counterparts and are clean. **Policy & benefits was not transcribed this session:**
transcribing two of three routes would leave the group half-specified and its
paired verification unable to cover the vertical, which section 9 forbids in
substance if not in letter.
