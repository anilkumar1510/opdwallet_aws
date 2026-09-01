# member-transactions-payments

Retro-spec transcribed from `web-member/` on 2026-08-07. Covers four routes:
`/member/transactions`, `/member/orders`, `/member/orders/:transactionId`,
`/member/payments/:paymentId`.

Transcribed, not designed. Every scenario is written to be verified against
**forced** state — a served fixture or an injected failure — never against whatever
the seeded account happens to show, per `audit/10-assertion-provenance.md`. This is
a presentation-heavy group, which is exactly where this audit's one real assertion
defect lived.

**Own reference read**, no inheriting from any prior vertical.

## Register — this is the entry-5 group, and Angular conforms

- **Entry 5 (payment never precedes booking creation, anywhere).** The reference's
  payment screen **creates** the underlying booking — it calls `/api/appointments`,
  `/api/dental-bookings`, `/api/member/lab/orders`, `/api/member/diagnostics/orders`
  and `/api/member/ahc/orders` — and only then marks the payment paid.
  **Angular performs only `payments/:id/mark-paid`**
  (`core/transactions/transaction.mapper.ts:25`, with the reasoning recorded at
  `transactions.store.ts:99`). Conformance, not divergence, and recorded as such.
- **Divergence 2** applies: `/member/orders` renders the transactions screen, and
  the wallet ledger the reference puts at `/member/transactions` lives on
  `/member/wallet`. Not re-litigated here.
- Entry 10 does not apply — no pickers in this group.

## What the reference actually is

| Route | Reference | Reads |
|---|---|---|
| `/member/transactions` | 1591 lines — the **wallet ledger** | `wallet/balance`, `wallet/transactions` |
| `/member/orders` | 284 lines — service order list | `transactions`, `transactions/summary` |
| `/member/orders/:transactionId` | 267 lines — order detail | `transactions/:id` |
| `/member/payments/:paymentId` | 653 lines — payment gateway | `payments/:id`, plus the five creation endpoints above |

## ADDED Requirements

### Requirement: Service order history
The portal SHALL list the member's service orders with a summary of what was spent, scoped to the active family member.

#### Scenario: Orders listed with summary
- **GIVEN** a member with service orders
- **WHEN** the orders screen loads
- **THEN** the orders are listed
- **AND** the summary totals for orders, amount spent, wallet-funded and self-paid are shown

#### Scenario: No orders yet
- **GIVEN** a member with no service orders
- **WHEN** the orders screen loads
- **THEN** an empty state is shown, distinguishable from a failed load
- **AND** the summary totals read zero rather than being absent

#### Scenario: Orders fail to load
- **GIVEN** the orders request fails
- **WHEN** the screen loads
- **THEN** an error state is shown, distinct from the empty state
- **AND** a retry is offered

#### Scenario: Orders follow the active family member
- **GIVEN** a primary member viewing their own orders
- **WHEN** they switch the active family member to a dependent
- **THEN** the list refreshes to that dependent's orders without a manual reload

### Requirement: Order detail
The portal SHALL present a single order with what was bought, what it cost, and how it was funded.

#### Scenario: Order detail displayed
- **GIVEN** a member opening one of their orders
- **WHEN** the detail screen loads
- **THEN** the service, provider, date, amount and funding split are shown
- **AND** monetary and date values are formatted, never raw

#### Scenario: Unknown order
- **GIVEN** an order id that cannot be resolved
- **WHEN** the detail screen loads
- **THEN** a not-found state is shown rather than an empty detail screen

### Requirement: Payment completion
The portal SHALL complete an outstanding payment against a record that already exists, and SHALL NOT create the underlying booking as part of paying.

Rule: Payment never precedes booking creation — parity register entry 5. The booking exists before the payment screen is reached; this screen settles the amount and nothing else.

#### Scenario: Outstanding payment settled
- **GIVEN** a payment with an amount outstanding
- **WHEN** the member completes it
- **THEN** the payment is marked paid
- **AND** the member is returned to the record it belongs to

#### Scenario: Payment does not create a booking
- **GIVEN** a member on the payment screen
- **WHEN** the payment completes
- **THEN** no booking, order or appointment is created by this screen

#### Scenario: Payment fails
- **GIVEN** a payment with an amount outstanding
- **WHEN** it fails
- **THEN** the failure is surfaced
- **AND** the payment remains outstanding and payable

#### Scenario: Unknown payment
- **GIVEN** a payment id that cannot be resolved
- **WHEN** the screen loads
- **THEN** the member is returned rather than shown an empty payment form

### Requirement: Health checkup copay payment
The portal SHALL create the payment for whatever a health checkup order leaves the member owing, and SHALL take them to it.

Rule: The order is created first and the payment second. `POST member/ahc/orders` — unlike dental, vision and appointments — does **not** create a payment, so nothing existed for the member to settle. Parity register entry 5 is unaffected: the order is already committed before the payment is created, which is the opposite of the reference's payment-first ordering.

Rule: Created directly rather than gated on a bill. Inherited finding 11 asked whether AHC payment should be bill-gated as vision's is; it cannot be, because **there is no bill anywhere in the AHC module** — ops goes collection → reports → complete and the concept does not exist there.

Rule: The payment's `serviceReferenceId` is the `AHC-ORD-…` order reference, so the obligation is attributable to what created it. Only a `PAY-…` business reference is treated as a destination: `GET payments/:paymentId` resolves via `findOne({ paymentId })` and a Mongo `_id` would 404.

#### Scenario: A health checkup that leaves an amount owing
- **GIVEN** a health checkup order the wallet does not cover in full
- **WHEN** the order is placed
- **THEN** a PENDING payment is created for the remainder against that order
- **AND** the member is taken to that payment

#### Scenario: A health checkup the wallet covers
- **GIVEN** a health checkup order with nothing left to pay
- **WHEN** the order is placed
- **THEN** no payment is created
- **AND** the journey ends on the member's bookings

#### Scenario: The payment cannot be created
- **GIVEN** a health checkup order that was placed successfully
- **WHEN** creating the payment fails
- **THEN** the member is still taken to their bookings rather than stranded
- **AND** the row there names the amount still owed

> **Session 53.** The absence of this leg produced a real unpayable debt —
> `AHC-ORD-1786182053508-8GHNX7JM9`, PLACED, ₹240 PENDING, `paymentId:
> undefined`. Criterion 6 did not catch it: the criterion looks for pending
> PAYMENTS left behind, and AHC left a pending ORDER with no payment at all.
> *A detector tuned to one artifact is blind to the same failure expressed in
> another.*
>
> **Verified by forced branch, not by a real order** — AHC is once per member per
> policy year and this account's is consumed. `audit/14-ahc-commit-contract.md`,
> `audit/37-fix-all-apis.md`.

### Requirement: Wallet ledger summary and navigation
The portal SHALL summarise the member's wallet activity alongside the ledger, SHALL show the balance after each transaction, and SHALL offer a way back from the ledger.

Rule: Credits, debits and net change are computed over the member's WHOLE transaction history, not over the rows currently displayed. The ledger pages 15 at a time, so page-derived figures would be wrong on arrival and would change on every "Show more" — a summary that moves while the underlying data does not is worse than none. `GET /wallet/transactions` exposes no aggregate and its `total` field reports only the returned count, so the figures come from one wide read.

Rule: The running balance is `newBalance.total` from the transaction payload, which the API already sends. It is not derived by subtracting from the current balance — a reversed or out-of-order row would make a derived figure disagree with the API's own.

#### Scenario: The ledger summarises the member's activity
- **GIVEN** a member with wallet transactions
- **WHEN** they open the wallet ledger
- **THEN** total credits, total debits and net change are shown
- **AND** the number of transactions the figures cover is stated

#### Scenario: Paging does not move the summary
- **GIVEN** a member whose history is longer than one page
- **WHEN** they load more transactions
- **THEN** more rows appear
- **AND** the credits, debits and net change figures are unchanged

#### Scenario: Each transaction shows the balance after it
- **GIVEN** a transaction whose payload carries the resulting balance
- **WHEN** the ledger is shown
- **THEN** that row states the wallet balance immediately after it
- **AND** a transaction without one shows no balance rather than a zero

#### Scenario: Returning from the ledger
- **GIVEN** a member who opened the ledger from the home balance card
- **WHEN** they use the back control
- **THEN** they return to the screen they came from

> **Session 54, found by the user clicking the home balance card** and asking why
> Angular's destination differed from the reference's. React's card links to
> `/member/transactions`, a dedicated **Transaction History** screen carrying
> these figures; Angular's opens `/member/wallet`, which had the rows and none of
> the summary. The figures here are asserted against the reference's own output
> for the same member — credits ₹5,100, debits ₹14,792, net −₹9,692.
>
> **Not ported: the Analytics Overview.** React renders `recharts` bar charts
> (transaction volume by type, 7-day trend). Angular has no charting dependency
> and adding one for two charts was not taken unasked. Recorded in
> `audit/38-wallet-ledger-summary.md`.
>
> **Whether Angular should ALSO have a separate Transaction History screen is
> open** — its `/member/transactions` already renders service orders, which is
> parity register entry 2. That is a routing decision, not a flow one.

### Requirement: Transaction history screen
The portal SHALL serve the wallet ledger at `/member/transactions` and the service-order list at `/member/orders`, and the home balance card SHALL open the ledger.

Rule: This matches the reference's routing. Angular previously had the two swapped — parity register entry 2 — which left the home quicklink **labelled "Transaction History" opening a list of service orders**, and the balance card opening the wallet page instead of the ledger.

Rule: The two screens carry distinct names. The order list is titled "Order History" as in the reference; only the ledger is called transaction history. Two screens under one name is what the swap produced.

#### Scenario: Opening the balance card
- **GIVEN** a member on the home screen
- **WHEN** they activate the wallet balance card
- **THEN** the transaction history screen opens
- **AND** it shows the current balance, the credits/debits/net summary and the ledger rows

#### Scenario: The order list keeps its own route and name
- **GIVEN** a member with service orders
- **WHEN** they open `/member/orders`
- **THEN** the service-order list is shown under the name "Order History"

> **Session 54, on the member's instruction** — "when we click on wallet balance
> box it should open transaction history not wallet". The ledger UI is shared
> between this screen and `/member/wallet` by one component rather than
> duplicated. Resolves parity register entry 2 in the reference's favour.
