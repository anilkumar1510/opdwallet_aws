# Claim detail navigates with the wrong identifier

Found by verifying a claim submission **to a terminal state** — the criterion added
to section 9 one session earlier. Nothing short of that would have surfaced it: the
claim is created and submitted successfully, and only the screen it lands on fails.

## Observed

```
POST /api/member/claims                          201
POST /api/member/claims/CLM-20260807-0001/submit 200
GET  /api/member/claims/CLM-20260807-0001        500
url  /member/claims/CLM-20260807-0001   ->  "Claim not found - We could not find that claim."
```

The claim **exists**. The member is told it does not.

## Cause

`api/src/modules/memberclaims/memberclaims.service.ts:765` does
`new ObjectId(id)`, so the detail endpoint accepts only the Mongo `_id`:

```
BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer
```

Angular navigates with the **business** id (`CLM-20260807-0001`).

## Ownership — Angular, not the API

The reference distinguishes the two identifiers and Angular does not:

| Purpose | Reference uses |
|---|---|
| link to detail (`app/member/claims/page.tsx:708,760`) | `claim.id` - the Mongo `_id` |
| fetch detail (`[id]/page.tsx:84`) | the same `params.id` |
| cancel (`[id]/page.tsx:128`) | `claim.claimId` - the **business** id |

So the endpoint is behaving as the reference expects. **Angular is passing the
wrong one.** The fix belongs in Angular's claims mapper/navigation, which is
writable — it is not an API change.

**Secondary, and genuinely API-side:** a malformed id yields **500**, not 400 or
404. That is worth handing to whoever owns `api/`, but it is not what breaks this
screen.

## Not fixed

Out of context this session. It is small — navigate and fetch by `_id`, keep
`claimId` for display and cancel — but it changes navigation on a submitting flow
and must be re-verified to a terminal state.

---

## FIXED and verified 2026-08-07

- `core/claims/claims.store.ts` — `submit()` now returns the Mongo `_id` for
  navigation while still calling the submit endpoint with the business reference.
  Both ids are kept explicitly, with a comment saying why they are not
  interchangeable.
- `features/claims/claims-page.ts:75` — list rows link by `claim.id`, not `claim.reference`.
- `features/claims/new-claim-page.ts` — post-submit navigation uses the returned `_id`.

**Verified to a terminal state:** opening a claim from the list lands on
`/member/claims/6a75cda4c1c499b2b38c0bd7`, renders the claim, and issues **no API
errors**. The "Claim not found" over a successfully-filed claim is gone.

## Is it a class? No — checked (`16-id-duality.mjs`, both controls passing)

Seven domain models expose both a Mongo id and a business reference, and **three
other navigations pass the business one**:

| Navigation | Endpoint takes | Verdict |
|---|---|---|
| `transactions-page.ts:70` -> `/member/orders/:id` | business `TXN-…` | **correct** — verified live, renders with no API error |
| `transaction-detail-page.ts:105` -> `/member/payments/:id` | business `PAY-…` | correct by the same contract |
| `lab-orders-page.ts:44` -> `…/orders/:id` | business `ORD-…` | **untested — no order rows on the test account** |

So claims was the single place where the endpoint wants `_id` and Angular passed
the reference. The others are consistent with their endpoints.

**Recorded as conformance, not silence:** the parameter names (`orderId`,
`transactionId`, `paymentId`) and the passing live check agree. The lab orders row
is genuinely unverified rather than assumed — it needs an account with a lab order.

