# Allowance-limited actions — what can be verified only once per member

Run before any backlog verification. An entitlement that can be used once per
period can be verified **once per member, ever** — and then that member is spent.
AHC's constraint was discovered by burning the only account that could test it.

## Controls

| Control | Expectation | Result |
|---|---|---|
| **Positive** | must flag **AHC** | **PASS** — `ahc-order.service.ts:61`, *"Already booked AHC for this policy year"* |
| **Negative** | must **not** flag **appointments**, booked repeatedly across sessions | **PASS** — its only match is a *slot* collision (`appointments.service.ts:427`), which is contention for a resource, not an allowance |

The distinction the negative control enforces: **"this slot is taken" is not "you
have used your entitlement."** The first is retryable with another slot; the second
is not retryable at all.

## Result: AHC is the only one

| Action | Limit | Verifiable repeatedly? |
|---|---|---|
| **AHC order** | **once per member per policy year** | **No — one shot per member** |
| Appointment (in-clinic / online) | slot contention only | Yes, with slot-aware selection |
| Vision / dental booking | slot contention only | Yes |
| Lab / diagnostic order | none found | Yes |
| Claim | per-claim monetary cap, and available balance | Yes — caps bound the amount, not the count |
| Wallet, records, profile, services | read-only | N/A |

**Method note:** every module except AHC has an *eligibility* check, and it would be
easy to read those as allowance limits. They are not — they gate **whether a benefit
is covered**, not whether it has already been used. Only `ahc-order.service.ts`
refuses on the existence of a prior record in the period.

## Consequence for the backlog

Nothing in the six backlog verticals is allowance-limited, so all of them can be
verified with the accounts on hand. Slot-aware selection is needed for the ones that
book; nothing needs a fresh member.

**Safe order by write pressure:** profile & misc (no writes) -> transactions &
payments (one write, `mark-paid`) -> vision, dental, lab, diagnostics (all place
records).
