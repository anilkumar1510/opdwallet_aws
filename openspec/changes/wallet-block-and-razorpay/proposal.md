# Wallet block/release and a real payment gateway

## Why

Every service line in *Member Portal Patient Flows* (`Patient Flows` sheet, nine
flows) assumes the same money mechanic: at payment the wallet is **blocked**, the
member pays any self-pay excess through Razorpay, and the block **becomes a debit**
only at completion or delivery — released if the booking is cancelled, fails, or
the member never shows.

**The two halves of the payment split apart, and the split is the point.** Online
consultation pays at booking and auto-confirms. In-clinic consultation, per the
revised sheet supplied on 2026-08-17, separates them: the wallet portion is
**blocked when the request is raised**, before anything is confirmed; operations
then confirm the slot with the clinic; the member reviews the cart and confirms;
and only then is the **self-payment collected through Razorpay**, if any is owed.
No card is ever touched before the clinic has agreed the slot — so a clinic that
declines costs the member nothing and needs no refund, only a release.

The system does neither half.

- **The wallet has no held state.** `totalBalance` and every entry in
  `categoryBalances` carry `allocated`, `current`, `consumed` and nothing else
  (`api/src/modules/wallet/schemas/user-wallet.schema.ts:60-98`). Money is debited
  outright at booking time by 14+ call sites across eight services.
- **There is no payment gateway.** Payments default to `'DUMMY_GATEWAY'`
  (`api/src/modules/payments/payment.service.ts:67`) and are completed by the
  paying member's own API call to `POST /payments/:paymentId/mark-paid`
  (`payment.controller.ts:170`), which sets COMPLETED and fabricates a transaction
  id from a timestamp and `Math.random()` (`payment.service.ts:128`). No Razorpay
  SDK, keys, or webhook path exists anywhere in the repo.

Two consequences are live defects rather than missing features:

1. **Money leaves before it is collected.** In the copay path the wallet is debited
   at `appointments.service.ts:690`; the copay payment request is only created at
   line 704. A member who abandons checkout has paid the wallet portion for an
   appointment that never confirms, and nothing reverses it.
2. **Wallet writes are not atomic.** `debitWallet` reads the wallet, mutates it in
   memory and saves (`wallet.service.ts:659-700`); there is no `startSession` or
   `withTransaction` anywhere in the API. Two concurrent bookings against one
   wallet — routine on a floater family policy — can both pass the balance check
   and both debit.

Blocking is the precondition for the rest of the spreadsheet. An adjudicated
pharmacy cart that is "not charged while on hold", and a cashless letter quoting an
approved amount, both need a held balance to point at.

## What Changes

**Pilot route.** This change builds the wallet primitive and migrates **one** flow —
appointments — end to end. The other seven spend paths (dental, vision,
vaccination, lab, diagnostics, AHC, claims) keep calling `debitWallet` unchanged
and migrate in follow-up changes. The wallet therefore supports both models
concurrently: a wallet with no blocks behaves exactly as it does today.

- Add a **held amount** to `totalBalance` and to each category balance, and derive
  **available = current − held**. Blocks on a dependant's wallet are held against
  the floater master, matching how `debitWallet` already redirects.
- Add **block / capture / release / expire** to `WalletService`. Capture may be
  partial; the remainder releases. Every one of these invalidates the wallet cache
  (`wallet.service.ts:138`), as debit already does.
- Make wallet balance mutation **atomic** via a single conditional update that
  fails when available balance no longer covers the amount, replacing the current
  read-modify-write. Chosen over Mongo transactions, which would require a replica
  set the local setup does not run.
- Add a `status` field to `wallet_transactions` and a **HELD** transaction type. The
  schema has no `status` today, although the service writes one (`wallet.service.ts:790`)
  and selects it back (line 300) — that read has been silently returning nothing.
- Introduce a **payment provider boundary**, implement **Razorpay** behind it
  (order create, checkout handoff, signature-verified webhook, gateway refund), and
  keep the dummy gateway as the configured default until merchant credentials exist.
  Adds `razorpay` to `api/package.json`, raw-body handling in `main.ts` for
  signature verification, an unauthenticated webhook route, and webhook idempotency
  so a redelivered event captures once.
- **BREAKING** — for appointments only, `mark-paid` stops confirming the booking.
  Capture is driven by the gateway webhook. The endpoint remains for the seven
  unmigrated services and is deleted as each one migrates.
- **BREAKING** — the wallet balance response gains `held` and `available`.
  `web-member` (wallet page, dashboard, transactions, PDF generators) and the
  Angular `wallet.dto.ts` and its mapper must read `available` where they read
  `current` today.
- Migrate the **appointment flow**, which carries **two sequences**, not one:
  - *Online consultation* — block at booking, confirm on payment, capture when the
    consultation completes.
  - *In-clinic consultation* — the wallet portion is **blocked when the request is
    raised**, while the request sits pending; **no card payment** is taken at that
    point. Operations confirm the slot; the member returns to a **cart review**
    screen showing the breakdown, confirms, and only then is the **self-payment
    collected through Razorpay**. A **receipt** is issued at payment; the **tax
    invoice** is raised only at completion, when the block becomes a debit.
    Booking-time invoicing, which several flows do today, is wrong for this journey.
  - Both release on cancellation, no-show, or a clinic that declines. In-clinic
    releases without any refund, because nothing was charged.
- Add block **expiry**. A block taken at booking for an in-flight payment attempt
  (online consultation) expires after a configurable window, default 15 minutes, if
  the gateway never confirms, and the member can start again. A block held against a
  pending in-clinic request does **not** expire on that timer — it is held for as
  long as the request waits on the clinic, and releases when the request is
  confirmed and paid, declined, or cancelled. Requires `@nestjs/schedule`, which the
  API does not currently depend on.
- Add an **operations release action** so a stuck block can be freed without a
  database edit.

**Out of scope.** The seven unmigrated services. Adjudication states, multi-channel
notification, cashless letters and ops confirmation — each is a later change in the
sequence. Bank-account payout for reimbursement claims.

**Boundary worth stating.** The in-clinic sequence needs the member to come back
after confirmation and pay. This change builds the cart review screen and the
in-app prompt that gets them there; it does **not** build the WhatsApp and push
notification the flow calls for — that belongs to the notification change. Until
that lands, a member who does not reopen the application leaves a confirmed slot
unpaid, so the in-clinic journey is not complete on this change alone.

## Capabilities

### New Capabilities

- `wallet-block-lifecycle`: held balance and available balance; block, partial
  capture, release, expiry; floater master routing; atomicity and concurrent-booking
  behaviour; cache invalidation; the HELD ledger entry.
- `payment-gateway`: the provider boundary and Razorpay behaviour — order creation,
  checkout handoff, signature-verified webhook capture, webhook idempotency and
  replay, gateway-backed refunds, and the dummy gateway's retained role as default.
- `appointment-payment-capture`: both appointment journeys expressed against blocks
  — online consultation blocking and paying at booking; in-clinic consultation
  blocking the wallet portion at request time and collecting the self-payment only
  after the clinic is confirmed and the member confirms the cart — covering what the
  member is shown at each step, the cart review, receipt versus invoice timing, and
  what happens when the self-payment is abandoned or fails, the clinic declines, or
  the visit is a no-show.

### Modified Capabilities

None. `openspec/specs/` is empty; nothing has been synced to main specs yet, so all
three capabilities above are new.

## Impact

**API.** `wallet` (schemas, service, controller), `payments` (schema, service,
controller, new provider layer and webhook controller), `appointments` (service:
four debit sites at lines 462, 621, 690, 763 and two credit sites at 1089, 1212),
`transactions` (summary status handling), `operations` (release action). New
dependencies: `razorpay`, `@nestjs/schedule`. New configuration: Razorpay key id,
key secret, and webhook secret across `.env.example`, `.env.docker`,
`.env.production` and AWS Secrets Manager.

**Frontends.** `web-member`: wallet page, member dashboard, transactions, payment
breakdown and PDF generators. `web-angular`: `wallet.dto.ts`, its mapper and the
wallet store. `web-operations`: the release action. `web-admin` and `web-finance`
utilisation views, which must distinguish held from consumed.

**Data.** All existing data is test data (project rule 1), so no migration of
historical balances is required. New wallets initialise `held` at zero, and
unmigrated services never set it.

**Assumptions carried, to be confirmed before implementation.** Expiry policy is
TTL-on-payment-attempt with explicit release thereafter. Razorpay ships behind a
provider interface with the dummy gateway as default, because no merchant
credentials exist in the repo today; if test keys are available, Razorpay becomes
the default and the dummy gateway is deleted.

**Open decision the in-clinic sequence creates.** A confirmed in-clinic appointment
can sit with the wallet blocked and the self-payment unpaid, because the member has
to come back and confirm the cart before Razorpay is reached. Someone must decide
how long that state may last and what ends it — an expiry that cancels the booking
and releases the block, or an operations chase with no automatic end. Note this is
about the **self-payment only**; the wallet portion is already secured from the
moment the request was raised, so the member cannot arrive at the cart short of
wallet balance.
