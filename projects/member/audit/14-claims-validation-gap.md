# Claims — validation equivalence check (the precondition that failed)

Session 18 was to sanction Angular's single-page claim form as a register entry,
**conditional on** the form enforcing every rule React's three wizard steps did.

**It does not. Two rules are unmatched, so the entry waits.**

## The comparison

React's rules live in `web-member/lib/utils/claimValidation.ts`; Angular's gate is
`canSubmit` at `features/claims/new-claim-page.ts:292-301`.

| React rule | Angular | |
|---|---|---|
| family member selected | `patientId() !== ''` | ok |
| category selected | `category() !== ''` | ok |
| treatment date required | `treatmentDate() !== ''` | ok |
| bill amount present and > 0 | `(billAmount() ?? 0) > 0` | ok |
| at least one document | `files().length > 0` | ok |
| **bill amount must not exceed available balance** | **absent** | **GAP 1** |
| **at least one _prescription_ document** | **absent** | **GAP 2** |
| **at least one _bill_ document** | **absent** | **GAP 2** |

Angular additionally requires `providerName`, which React does not — a stricter
rule, not a missing one, and not a blocker for the entry.

## GAP 1 — no pre-submission balance guard

`claimValidation.ts:44-54`: React blocks submission when the bill exceeds the
member's available balance for the chosen category, naming the figure.

Angular has **no equivalent**. It submits, and if the API caps the amount it reports
so afterwards via `capNotice` (`core/claims/claims.store.ts:180-186`).

**These are not the same rule and do not substitute.** `capNotice` reports the API's
**per-claim limit**; React's guard is against **available wallet balance**. Different
limits, and the second is checked only after the claim exists. A member can submit a
claim exceeding their balance and learn about it — if at all — only once it is filed.

`capNotice` is deliberate and well-commented; it is not the defect. The absence of a
balance guard beside it is.

## GAP 2 — document types are not distinguished

React requires **at least one prescription** and **at least one bill**, as separate
checks (`:66-70`). Angular requires one file of any kind, behind a single control
labelled "Add bills and prescriptions" (`new-claim-page.ts:197`).

So a claim can be submitted with two prescriptions and no bill, which React refuses.

## Why this blocks the register entry rather than being filed alongside it

The sanction rests on *"per-step validation becomes whole-form validation"* — the
wizard's purpose served differently, not abandoned. That argument requires the rules
to be the same. Two are missing, so what is currently in front of a member is not a
different layout of the same guarantees; it is a weaker form.

**Fix the two rules, then the entry is filable as written.** The layout argument is
sound and unaffected — this is about the rules, not the number of pages.

**Not fixed here.** Both are behaviour changes to a submitting flow, and GAP 1 needs
a decision on which limit to guard against (available balance, per-claim limit, or
both) — the reference guards one and the API enforces the other.
