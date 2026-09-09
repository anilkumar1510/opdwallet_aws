# Removed APIs — dummy / static frontend

As we convert the member portal to a backend-free dummy environment, this tracks
every API we stop calling, flow by flow. Each row: the API, what it did in plain
words, the screen it powered, and what replaced it.

| # | API (method + path) | What it did | Screen / flow | Replaced with |
|---|---------------------|-------------|---------------|---------------|
| 1 | `GET /api/policies/{policyId}/current` | Fetched the member-readable policy — number, corporate, validity, and the covered / not-covered lists — from the plan config. | Policy details page (`/member/policy-details/:id`) | Static data in `core/member/static-policy.data.ts` (served via `PolicyStore`). Enriched with sum insured, co-payment, members covered and claim window. |
| 2 | `GET /api/wallet/balance?userId=` *(entire home use)* | Supplied both the home "Total Available Balance" card and the per-category "Health Benefits" cards. | Home page — wallet total + Health Benefits grid | Static in `static-policy.data.ts`: `STATIC_WALLET_TOTAL` (₹40,000 benefit wallet, shown full) and `STATIC_BENEFITS` — 9 fixed benefits (Online/In-Clinic Consultation, Vision, Dental, Pharmacy, Vaccination, Pathology, Radiology & Cardiology, Annual Health Check), each ₹5,000 annual · ₹500 per-claim · ₹400 per-service. `wallet/balance` is no longer called on the home page (still used by the Wallet screen). |

## Notes

- **Policy card (home "Your Policies")** — no dedicated API of its own; it was
  derived from the `member/profile` assignments. It is now served from
  `STATIC_POLICIES` in `static-policy.data.ts`. `member/profile` itself is still
  called (it powers family / wallet), so it is **not** listed as removed — only
  the policy card's dependence on it was cut.
