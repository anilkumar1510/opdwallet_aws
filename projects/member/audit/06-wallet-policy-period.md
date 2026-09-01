# Task 6.4 — the wallet's policy period

**Recommendation only. Nothing here is applied, and `specs/member-wallet/spec.md`
is untouched.** The amendment is the user's to make.

## The task as written is stale

> *6.4 … the policy period is NOT [done], because `GET /wallet/balance` does not
> return `effectiveFrom`/`effectiveTo`. Source it from `GET /member/profile`
> assignments, or amend `specs/member-wallet/spec.md` to drop the requirement.*

Both halves of the premise are confirmed, and the first option is **already
implemented**:

- `wallet/balance` carries no period — verified live against a *funded* wallet
  (`shivam@gmail.com`, ₹20,000 allocated, 8 categories): no `effectiveFrom` or
  `effectiveTo` at any nesting level.
- `core/member/policy.ts:31-33` already sources it from `member/profile`
  assignments, and `features/wallet/wallet-page.ts:172-182` renders it as
  `Cover <from> – <till>`.

So the offered choice — profile vs. drop the requirement — was answered in code
before the task was read. **What is actually open is a different question**, which
only appeared once live data was examined.

## The real question

`GET /member/profile` as `shivam@gmail.com`:

```
[0] Shivam  Jha     assignment 2026-06-19 → 2027-06-16   policy 2026-06-18 → 2027-06-30
[1] Sayani Kumari   assignment 2026-06-19 → 2027-07-19   policy 2026-06-18 → 2027-06-30
```

There are **two periods per member and they disagree**, differently for each
member under the same policy.

The code takes the assignment, falling back to the policy, and states its reason:

> *"The assignment period wins over the policy period: a member can be assigned
> for a shorter window than the policy itself runs."* — `core/member/policy.ts:31`

**The data contradicts the rationale.** Sayani's assignment is *wider* than its
policy by 19 days. The rule implemented is "assignment wins"; the rule described
is "narrower wins". Those coincide only while assignments stay inside their
policies, and one of two seeded rows already does not.

## Recommendation — intersection

```
validFrom = max(assignment.effectiveFrom, policy.effectiveFrom)
validTill = min(assignment.effectiveTo,   policy.effectiveTo)
```

**"Narrower wins" is what the existing rationale already describes. Intersection
is what implements it.** This is not a new policy decision — it is the decision
the code says it made, applied to data the author did not anticipate.

It is correct under every available reading of the overhang:

| If the overhang is… | Under intersection |
|---|---|
| a data-entry error | the member is shown the right period; the bad date never surfaces |
| a deliberate run-off | the display is conservative, someone queries it, and the intent gets stated — which surfaces the rule faster than a silent wrong answer |
| a policy shortened without cascading to assignments | exactly right; the policy is the funding boundary |

**There is no reading in which showing a member cover that outlives the policy
funding it is the desired outcome.** That asymmetry is what makes intersection
safe to recommend without first knowing which case applies.

Under intersection, Sayani's cover reads **2026-06-19 → 2027-06-30**. Shivam's is
unchanged at 2026-06-19 → 2027-06-16, since his assignment already sits inside
its policy.

### Cost

Two comparisons in one mapper (`core/member/policy.ts`). No API change, no new
call, no spec-scope change. The data is already in the response the store fetches.

### Edge cases the implementer will hit

- Either date may be `null` (`toDate` returns `Date | null`). A null on one side
  should fall through to the other, not collapse the range.
- If the intersection is empty — assignment entirely outside its policy — the
  member has no valid cover window, which is a different state from "no wallet"
  and is not currently modelled. Worth deciding before it occurs rather than after.

## What to record if this is accepted

The answer to 6.4 is **both**, not either:

1. **Source** — `GET /member/profile` assignments. Already true; document it so
   the next reader does not re-litigate `wallet/balance`.
2. **Rule** — intersection of assignment and policy periods. New; this is the part
   that needs writing down, because the current code and its own comment disagree.

## Related

The upstream question — *should the API accept an assignment outside its policy at
all?* — is filed separately at `05-inherited-api-findings.md` §2.
`assignments.service.ts:30-35` validates date presence and ordering, never against
the policy. A frontend rule and a write-boundary rule are complementary; neither
substitutes for the other, and intersection is correct regardless of what the API
decides.
