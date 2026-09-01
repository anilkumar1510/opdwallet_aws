# The member-portal parity audit — start here

**This is a map, not a report.** It tells you what this folder is, what state it
is in, and which document answers which question. It deliberately does not
summarise the findings; that is `SUMMARY.md`, which is **not written on purpose**
— see "What state this is in" below.

Written in session 46, after a cold-read test of these documents found that the
only reason anyone knew to start at `progress.md` was that a prompt said so.
Nothing in the repository said it. This file fixes that.

---

## What this audit is

The member portal is being rewritten from `web-member/` (Next.js/React) to
Angular, in `web-angular/projects/member/`. This folder is the parity audit of
that rewrite: what the Angular app does, where it differs from the reference, and
which differences are defects rather than decisions.

**The reference is the acceptance criterion for intended behaviour — not for its
own defects.** Several places where `web-member/` is simply wrong are recorded and
deliberately not ported.

## What state this is in

**The audit has no unblocked work left.** Everything outstanding is either a
decision belonging to someone outside the audit, or test data that must be
provided. It stopped because it ran out of things it could do, not because it was
abandoned.

- **`32-decision-brief.md` is the live document.** **Two of its four decisions are
  now closed** (the copay continuation and vaccination, both ruled in session 50);
  two remain, plus four test-data items and one condition. If you are here to
  unblock something, read that.
- **`SUMMARY.md` does not exist, deliberately.** Writing it while four decisions
  are open and four verification items are blocked would record blocked work as
  finished.

## Which document answers which question

| If you want to know… | Read |
|---|---|
| **what is blocking progress, and what decision is mine** | `32-decision-brief.md` — start here if you own anything |
| what is found-but-not-fixed, and why each was left | `32-decision-brief.md` §6 |
| **can I run the verification suites, and what does it cost** | `31-run-budget.md` — **read before running anything**; some suites spend a finite entitlement |
| why Angular creates a booking before payment when React does the opposite | `../../../tools/parity-divergences.md` entry 5 (relative to this folder) |
| which differences from React are sanctioned, and why | `../../../tools/parity-divergences.md` — 20 numbered entries |
| what the API owner needs to answer | `05-inherited-api-findings.md` — findings 11, 12, 13 and §3 |
| the copay problem in full | `20-copay-continuation.md` |
| **which endpoints each app actually calls, per screen** | `35-api-integration-parity.md` — both apps driven over 30 routes; the live counterpart to `01-endpoint-diff.md`'s static extraction |
| why a declared endpoint stayed unused, and what closing one costs | `36-invoice-download.md` — the invoice wired up, and the two defects that fix nearly introduced |
| what happened to every unintegrated endpoint | `37-fix-all-apis.md` — three wired, four deleted, dead-endpoint count 6 → 0 |
| why the wallet ledger differs from the reference's history screen | `38-wallet-ledger-summary.md` — the summary, running balance and back control |
| what Support can and cannot do | `39-support-screen.md` — stuck claims and past services, over a mailto because no ticket API exists |
| why the desktop home diverges from the reference | `40-home-desktop-layout.md` — built to a supplied design; what was left out and why |
| the state of Agora video | `41-agora-scaffold.md` — clients scaffolded; the estate runs Daily.co |
| how Agora tokens are minted | `42-agora-token-endpoint.md` — server-side signing, and why blank credentials change nothing |
| **what the reference apps actually do about a copay**, screen by screen | `34-copay-reference-trace.md` — traces React and RN end to end; settles dental/vision and isolates consultations |
| the transferable method rules, usable on another project | `33-method-rules.md` |
| how assertions and controls go wrong | `10-assertion-provenance.md` |
| what the static detectors are and what each is blind to | `23-three-detectors.md` (five detectors despite the name) |
| whether vaccination is worth building | `12-vaccination-sizing.md` — sized from an app being retired, written to outlive it |
| what happened, session by session | `progress.md` — **a chronological log, newest first.** Useful for provenance; a poor place to learn current state |

**Live harnesses** are in `03-live/`. **Detectors** are the numbered `.mjs` files.
Both print positive and negative controls before their results; **a run whose
controls fail prints nothing usable, by design.**

---

## Numbers that moved

Each of these changed during the audit. All moved because someone looked closer,
none because of a different counting method. Take the current figure and treat it
as provisional.

| Figure | Current | History | Why it moved |
|---|---|---|---|
| **Angular completable routes** | **57, provisional** | 55 → 60 → 59 → 56 → 57 | 60 corrected 55 once two `flatMap` loops were expanded; 59 removed the ONLINE confirm that routed but could not commit; 56 removed AHC's three; 57 restored ONLINE once built. `17-…md:72` still shows 56 with a superseded note. |
| **RN screens** | **57, of which 26 are RN-only** | "~20" in the original brief | **The bare "26" overstates the gap.** Only **6** are absent functionality; the other 19 are RN names for flows Angular already ships, and 1 has since been built. `00-inventories/rn-only-unscoped.md`. |
| **Dental harness score** | **7/9** | was 14/18 | **The 14/18 is not reproducible.** It was accurate when taken; the CAT006 entitlement that made the create leg runnable is spent. The banner in `03-live/verify-dental.mjs` says which nine of the eighteen still run. Do not read 14/18 as current. |
| **React pages** | 63 | 63 | unchanged; the one figure the original brief got right |

---

## What you should NOT conclude from these documents

These are the misreadings the material actively invites.

**A green harness does not mean the flow is correct — read the banner.**
`verify-dental.mjs` and `verify-consultations.mjs` used to carry assertions
labelled `OPEN DEFECT (awaiting ruling)` that had to keep failing. **Session 50
ruled the copay continuation, so those are now re-aimed and green is correct** —
but the banners state what green proves and what it does not: the member is
*told* what they owe, not that anything is collected, and for consultations the
bookings list still cannot show it afterwards.

**Divergence from React is not defect.** There are 16 sanctioned entries in the
parity register, each with reasoning. Entry 14 is a case where the reference is
**outright broken** — its diagnostics cart screens fetch a lab endpoint that
404s — and Angular is correct by diverging. Entries 15 and 16 are cases where
Angular is deliberately **better**: it refuses a label that would tell a member
their wallet was untouched when it had just been debited, and it shows the payment
breakdown while they are still deciding rather than after they commit.

**"Filed, not fixed" is a decision, not a backlog.** Items are unfixed for stated
reasons: fixing would change a flow (which requires a ruling, not a fix), or the
harness that would verify the fix is out of budget. Working through that list
without reading the reasons will reintroduce a reverted flow change.

**The specs are silent more often than they are wrong, and a silent spec passes
for the wrong reason.** `member-lab`'s cart scenarios read *"GIVEN a cart"* and
were satisfiable in the harness while **no member could obtain one**. A spec that
omits its precondition cannot fail in the place where it is wrong. Ask what had to
be true for a scenario to pass, and whether the portal is what made it true.

**`13-trace.mjs` prints a structural fact list, not a defect list.** Its header
says so. Reading it as findings sends you after a bug fixed in session 25.

**A number in a session report is a measurement, not a status.** `progress.md` is
append-only history. Where a figure has moved, the table above is current and the
session report is not.
