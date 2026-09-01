# Assertion provenance — what the closed scenarios actually verified

Prompted by the exhausted-category defect: a scenario passed on `₹3,000 of ₹3,000`,
a string that is real, present, and consistent with the **opposite** state (fully
available, not exhausted).

**Result: contained. One wrong assertion, already corrected. No task reopens.**

## Controls

| Control | Expectation | Result |
|---|---|---|
| **Positive** | must classify the exhausted-category assertion as a **string match** | **PASS** — classified string match, and it is the one confirmed-wrong assertion in the audit |
| **Negative** | must **not** flag `"Direct navigation without a session"`, verified by hand to inspect observed state (`page.url()` after a redirect — no text read) | **PASS** — classified observed, unflagged |

## The distinction that actually predicts failure

Classifying by "string match vs observed state" turned out to be the wrong axis on
its own. The stronger predictor is **whether the harness controlled the input
state**:

- **Forced state** — fixture served, request held open, 500 injected, cookies
  cleared, viewport resized. The cause is known, so a matched string can only have
  come from the intended state.
- **Ambient state** — real seeded data, where the state is *inferred from the
  string itself*. This is circular, and it is exactly where the defect occurred.

The exhausted-category assertion was ambient: I saw `₹3,000 of ₹3,000` on the real
wallet and inferred "exhausted". The card format is `<available> of <total>`, so
that string meant the opposite. **Every other wallet-state assertion in 6.11 is now
fixture-forced**, which is why the correction also hardened the rest.

## 3.9 `member-session` — 11 scenarios

| Scenario | Provenance | Verdict |
|---|---|---|
| Successful login | observed — URL | sound |
| Reload with a valid session | observed — URL | sound |
| Rejected credentials | forced (wrong password) + text | sound |
| Auth service unreachable | forced (`route.abort`) + text | sound |
| Reload with an expired session | forced (`clearCookies`) + URL | sound |
| Direct navigation without a session | observed — URL | sound *(negative control)* |
| Return to the attempted route | observed — URL equality | sound |
| Login screen while already authenticated | observed — URL equality | sound |
| Explicit sign out | observed — `waitForURL` | sound |
| **Session rejected mid-session** | observed — `waitForURL('**/login')` + network 401 log | sound |
| Signing back in after signing out | **absence-based** — re-verified below | sound |

**Re-verified (absence assertions pass trivially if the page never loads):**
the second session renders a real, loaded screen — `"Wallet SU Wallet Standard
User No wallet for this member…"` — naming the new member. The absence of Shivam's
name and figures is therefore meaningful, not an artefact of a blank page.

**3.9 stays closed.**

## 4.8 `member-shell` — 11 scenarios

| Scenario | Provenance | Verdict |
|---|---|---|
| Same URL across viewports | observed — URL | sound |
| Resizing across the breakpoint | forced (`setViewportSize`) + URL | sound |
| Wide / narrow viewport navigation | forced viewport + string | sound |
| Destination parity | string, cross-checked against `destinations.ts` | sound |
| Active member shown in the shell | string | sound |
| **Single member** | **absence-based** — re-verified below | sound |
| Data pending | forced (request held open) + string | sound |
| Data load fails | forced (500) + **discriminating** — asserts error-shaped **and not** empty-shaped | sound, strongest in the set |
| Retry succeeds | observed — clicked control, figures returned | sound |
| Unknown member route | string (`404` / "could not find") | sound |

**Re-verified — this was the highest-risk assertion in any closed task.** "Single
member" asserts the *absence* of "Switch profile", which passes automatically if
the avatar menu never opens. Printed instead of re-asserted:

```
menu opened (text changed): true
menu contains own items   : true      (Profile / All Services / Settings / Log Out)
contains "Switch profile" : false
```

The menu opened and rendered its own contents; the absence is real.

**4.8 stays closed.**

## 6.11 `member-wallet` — 15 scenarios

| Scenario | Provenance | Verdict |
|---|---|---|
| **Exhausted category** | **ambient string match — WAS WRONG** | **corrected in session 3**, now fixture-forced and asserting `₹0 Fully used` |
| Zero balance | fixture-forced | sound |
| Unlimited category | fixture-forced | sound |
| Unrecognised category | fixture-forced, incl. absence of `CAT999` alongside a positive match on the label | sound |
| Floater wallet | fixture-forced | sound |
| No transactions | fixture-forced | sound |
| Reversed transaction | fixture-forced | sound |
| Wallet displayed for the active member | ambient string (`₹20,000`) | sound — `20,000` is the allocated figure and appears nowhere else in the fixture-free page |
| Wallet follows the active member | forced (family switch) + name | sound |
| No wallet for the active member | ambient, account-selected (`standard@`) | sound |
| Categories listed with readable names | ambient string | sound |
| Transactions listed / newest first | observed — parsed date sequence | sound *(a prior version scraped the cover-period line; corrected session 1)* |
| Loading further transactions | observed — length delta after click | sound |
| Amounts / dates formatted | ambient string | sound |

**6.11 stays closed**, with the caveat already on file about interception
verifying rendering rather than producibility.

## Screen files

`login.md`, `session-lifecycle.md`, `shell-nav.md`, `notifications.md`,
`family.md`, `wallet.md` are **static source reads with `file:line` citations**,
not string assertions against a running app. Out of scope for this audit; their
risk is misreading code, not fitting an assertion.

## Conclusion

**One wrong assertion across three closed tasks, already corrected. Nothing
reopens.**

The containment is not luck. 3.9 and 4.8 were built almost entirely on **forced
state** — URLs, injected failures, cleared cookies, resized viewports — because
those scenarios are about transitions, which are hard to assert any other way.
6.11 is about *presentation of data*, which invites reading the rendered string
and inferring the state behind it. That is the shape to watch for in the 58
unspecified routes: **presentation scenarios on ambient data.**

The rule that caught it stands and is now written into the harness:
**an assertion adjusted more than once gets printed, not adjusted again.**

---

## Specs from a working reference come out silent, not wrong (added session 38)

Five specs have now turned out to **under-claim rather than mis-claim**, and the
consistency is the finding:

| What was missing | Found |
|---|---|
| where a lab cart comes from | session 36 |
| where a diagnostics cart comes from | session 37 |
| which prefix serves a diagnostics cart | session 37 |
| the awaiting-notice's precondition (no orders) | session 37 |
| lab's order reference is `ORD-…`, not `LAB-ORD-…` | session 38 |

Not one of these was a false statement. Every one was an **omission** — a
described screen with an undescribed dependency: its precondition, its data
source, its identifier format.

**Why this is the expected failure mode here.** These specs are transcribed from
a working reference. You can see what a screen *does* by reading it; you cannot
see what it *assumes*, because the assumption is already satisfied in front of
you. A cart is simply there. An identifier is whatever the seeded row happens to
carry. The reference never has to state a precondition it always meets.

**Consequences, and they are good ones:**

1. **Every fix has been an addition** — a Rule, a scenario, a clause — never a
   rewrite. Correction cost has stayed near zero.
2. **The danger is a false pass, and "every fix was an addition" is not the
   reassurance it sounds like.** Read carelessly, this section says the specs have
   been nearly right and cheap to correct. What it actually says is that they
   **cannot fail in the place where they are wrong**.

   A silent spec is satisfied by a portal that ignores the dependency entirely.
   `member-lab`'s cart scenarios read *"GIVEN a cart"* and were **satisfiable in
   the harness while no member could obtain one** — the verification would have
   gone green on a fixture, and the journey would still have been unreachable in
   production. The correction cost was low only because verification happened to
   trip over the precondition; nothing in the spec would have surfaced it.

   So the low correction cost is a **selection effect**, not evidence of quality:
   these are the silent specs we caught. The ones still silent are, by
   construction, the ones nothing has forced yet.

   **The operational rule this yields:** when a scenario passes, ask what had to
   be true for it to pass, and whether the portal is what made it true. If the
   answer is "the fixture", the scenario is not verified — it is satisfied.
   Session 39 declined to force a records fixture for *Submitting an existing
   prescription* on exactly this ground: the GIVEN is *"a member who already holds
   a digital prescription"*, and a member who holds none does not satisfy it
   however green the run looks.
3. **So the question to ask a transcribed spec is not "is this true?" but "what
   does this screen need in order to be true?"** — where the cart came from, who
   created the identifier, what state the account must be in. That is the class
   of gap to expect, and it is worth one deliberate pass per spec rather than
   waiting for verification to trip over it.

Distinct from this file's original finding, which is about assertions written
against **ambient** data. These are specs written against **satisfied**
preconditions. Same root: evidence that happened to be present was mistaken for
evidence that must be.

---

## A rule that cannot be run is a reminder, and reminders decay (session 42)

Two method rules in this audit have now failed to prevent the recurrence they were
written for:

| Rule | Written after | Recurred as |
|---|---|---|
| "establish class boundaries when reading a schema" | the AHC 400, session 29 | `collectionAddress` sent as a string to lab, session 38 |
| "the effect fought the user" | the ONLINE contact number, session 25 | both upload prefills, session 41 |

Both were accurate. Both were **descriptions of a past incident** rather than
something checkable, and in both cases the recurrence was in a different feature,
written by someone following the same instinct that produced the original.

The correction that worked, both times, was **mechanising the rule**: the schema
rule became a send-site check, and the effect rule became
`30-effect-self-write-scan.mjs`, which immediately found four more sites.

**So the test for a method rule is: what would run it?** If the answer is "the
reader remembers", it will hold until the next person, feature or session — and
the failure is silent, because nothing contradicts a rule that simply was not
consulted. Same shape as the silent spec above and "permission is not approval" in
the register: three places where the absence of a signal was mistaken for the
absence of a problem.

---

## Controls expire. Anchor them to properties, not to instances (session 43)

The effect detector's first positive control asserted the scan must still find
the ONLINE contact number — a defect session 25 had fixed. **A control that
requires a fixed defect to stay broken decays silently**, and nothing announces
when it stops meaning what it says.

Swept every control in the harnesses and detectors. Three anchor types:

| Anchor | Behaviour | Example |
|---|---|---|
| **an instance** — a specific defect | **fragile.** Expires when the defect is fixed, and the expiry is invisible | the dead-endpoint scan's `submitExisting` |
| **a property** — a structural fact | **durable.** Cannot be retired by a fix | "a declared key with no caller must be flagged" |
| **a deliberately preserved example** | durable *only if the record says it is preserved on purpose* | `CLINIC_BOOKING_API.invoice`, filed not-fixed |

### What the sweep found

**One expired control, and it fails rather than passing wrongly.**
`22-dead-endpoint-scan.mjs` asserted it finds `submitExisting` dead; session 39
wired that endpoint up, so the count went 10 → 9 and the control began failing.
Failing is the safe direction — but it left the scan with **no working positive
control**, so its output had been unverified since session 39.

**Re-anchored** to a synthetic fixture: a two-key API map where one key is used
and one is not. Property-anchored, so nothing in the codebase can retire it.
`invoice` is now reported as a *note* — a deliberately preserved example — rather
than load-bearing as a control. If it ever gains a caller the scan should stop
reporting it, and that is a result, not a broken control.

**One control whose meaning drifted without breaking.** `13-trace.mjs` asserts it
flags `online-consult/confirm` as taking a `patientId` route input nothing
supplies. That is still structurally true and the control still passes correctly
— but the *defect* it was written from was fixed in session 25 by resolving the
patient from `FamilyStore` instead. **So its output is no longer a defect list.**
The control is fine; reading it as a finding would not be. Marked in the file.

**Fragile, left as-is with what would break it recorded:** the pending-payment
harnesses key their positive control on `PAY-20260808-0188`, a real obligation on
the test account. If that payment is ever settled or the account reseeded, every
criterion-6 check loses its positive control at once. One-line fix is not
available — a synthetic payment cannot be queried through the same path — so it is
marked rather than re-anchored.

**Durable, no action:** the wallet-fixture controls (exhausted category, unlimited
category), `16-id-duality.mjs` (models exposing both ids), the CAT006-vs-CAT007
list check, and every "healthy state shows no error" negative control. All assert
structural facts.

### The rule

> **Before writing a control, ask what would make it stop being true. If the
> answer is "someone fixes the bug", it is a timer, not a control.** Anchor to the
> property the check relies on, or to an example the record says is preserved on
> purpose — and if neither is available, write down what will break it.

---

## A message derived from a past evaluation outlives the condition it described (session 44)

Session 41 stored a refusal message in a signal. The member fixed the field and
**the message stayed on screen** — the form telling them something that had
stopped being true.

That is not a new class. It is the one this audit has been finding since session
33, arriving from a fourth direction:

| Instance | The screen said | It was untrue because |
|---|---|---|
| "No claims yet" to a signed-out member | the member has no claims | the store had been reset |
| "No lab in your area has quoted" | no vendor bid | the request failed; none was asked |
| "Invoice available" with no control | you can have this | nothing fetches it |
| **a stored refusal message** | **this field is missing** | **the member has since filled it** |

> **A message derived from a past evaluation will outlive the condition it
> described. Derive user-facing state from current state, or clear it when the
> condition changes.**

The fix in session 43 was the first form: `attempted` plus a computed that
re-evaluates the current first unmet requirement. It cannot go stale, because
there is nothing stored to go stale.

### What would run this rule

Per the standing test — *a rule whose only enforcement is the reader's memory is a
reminder* — the check would be:

> **a user-facing message signal that is `.set()` from inside an event handler and
> never recomputed.**

**Not built this session, and the reason is worth more than the scan.** A sound
version is not cheap: the codebase has many legitimately-stored message signals —
`uploadError`, `fileError`, `orderError`, `submitError` — which are set in a
handler and correctly cleared at the start of the next attempt. Distinguishing
"cleared appropriately" from "never recomputed" mechanically means modelling when
each condition changes, and that is exactly the kind of fuzzy scan that would
produce a candidate list nobody trusts.

**The cheap version needs a convention first.** If the rule were *a message
describing form state must be a `computed`, never a stored signal*, the check
becomes trivial and exact: any `signal<string | null>` rendered in a `role="alert"`
that describes form validity is a violation, and grep finds it.

So the honest sequence is **convention, then detector** — the check is expensive
because the convention is missing, not because the property is hard to see. Filed
as the next mechanisation, ranked below the four open decisions.

---

## The control taxonomy, as three distinct failures (session 44)

The sweep produced three outcomes. They are worth keeping apart because they fail
in different directions and need different responses.

### 1. Expired — fails loudly

A control anchored to a specific defect stops passing when the defect is fixed.
**Two instances, and both were invisible for a long time despite being red**,
because nobody re-ran the detector:

| Detector | Anchor | Broke when | Sessions unusable |
|---|---|---|---|
| `22-dead-endpoint-scan.mjs` | "finds `submitExisting` dead" | session 39 wired it up | 4 |
| `18-write-sweep.mjs` | "ahc shows none" | session 27 built AHC's commit path | **16** |

The write sweep is the sharper case: **it was retired by its own success.** Its
purpose was to find a feature with no commit path; it found AHC in session 35;
AHC was built; the control died. *A control anchored to a defect is a countdown
started by the person most likely to fix that defect.* It did exit with "output
meaningless" rather than printing — the script was honest — but an honest script
nobody runs is still sixteen sessions of nothing.

**Both re-anchored to properties evaluated over in-memory fixtures**, which
nothing in the codebase can retire. `invoice` was demoted from control to a
preserved-example note; AHC's write count is kept as a printed *observation* so
the change stays visible rather than vanishing from the record.

### 2. Drifted — keeps passing, means something else

`13-trace.mjs` still correctly flags `online-consult/confirm` as taking a
`patientId` no route supplies. Structurally true; control valid. But the defect it
was written from was fixed in session 25, so **its output is a structural fact
list, not a defect list**, and reading it as the latter sends someone after a
fixed bug.

**This is the dangerous direction.** An expired control goes red and eventually
someone notices. A drifted one stays green while its meaning moves, and there is
no signal at all. Re-anchoring would not help — the control is fine. The fix is
the header now at the top of that file saying what the output is and is not.

**One instance so far.** A second would make it a class and would justify a
convention — every detector stating, in its header, what a row means and what it
does not.

### 3. Fragile — valid, but a single point of failure

The criterion-6 controls, all keyed on `PAY-20260808-0188`. Valid today, and there
is no cheap substitute, so the response is neither re-anchoring nor a header but a
**constraint on the environment**: see `31-run-budget.md`.

### The altitude point

Control expiry is the same failure as an unmechanised method rule, one level up:
**a check that exists but is never run against the thing it protects.**

- a method rule nobody executes → the defect recurs (twice: the schema rule, the
  effect rule)
- a control nobody re-runs → the detector rots (twice: the write sweep, the
  dead-endpoint scan)
- a spec scenario whose precondition cannot arise → it passes for the wrong reason
  ("GIVEN a cart")

Three altitudes, one shape. The common remedy is the same each time: make the
check run against current state rather than against a remembered one — which is
also, exactly, the stale-message rule above.

---

## The cold-read test, turned on the audit's own documents (session 46)

The audit's rule is that forcing a failure from a warm context proves nothing.
**Every reader of these documents had been warm**, including whoever wrote them,
and their remaining value is legibility to someone who was not here. That had
never been checked.

**Method, and its honest limit.** A true cold read was not available — the reader
wrote most of the material. The approximation was mechanical: start at
`progress.md`, follow **only links that physically exist in the text**, and refuse
any knowledge not written down. Breaks are recorded only where the document itself
failed to carry the reader.

### Results — one pass, two breaks, one contradiction

| Question | Outcome | Type |
|---|---|---|
| *Which findings are open, and which need a decision rather than work?* | **PASS end-to-end** — session 45's block is the first thing under the header tables, names `32-decision-brief.md`, and §6 is titled "Filed, not fixed — the register" | positive control |
| *Why does Angular create the booking before payment when React does the opposite?* | **BREAK** — "entry 5" is cited five times in `progress.md` and **never once with a path**. Zero co-occurrences of "entry 5" and "parity-divergences" | **unlinked** |
| *Can I run the verification suite, and what will it cost?* | **BREAK** — `31-run-budget.md` is named **once**, at line 220, inside the session-42 block. The most consequential operational fact in the audit — two runs left — is reachable only by scrolling into a session report | **unlinked** |

**A second defect in the same path:** the three places that do name the register
write it as `../../../tools/parity-divergences.md`, which **does not resolve from
`audit/`** — the real relative path is three levels up. A reader following the
citation lands nowhere.

**And the entry point itself was the first break.** `progress.md` opened with
*"Updated after every screen. On restart: read this first, continue from the first
`todo`"* — phase-2 framing that stopped being right around session 20. A stranger
obeying it lands in the Screens checklist, which is mostly DEBT routes
deliberately scoped out, and starts work that was deliberately not started.

### STOP CONDITION — a contradiction of fact, not emphasis

`17-renders-but-cannot-complete.md:72` stated flatly **"Angular is 56
genuinely-completable routes, not 59"**. `progress.md:1235` said **57**. Same
question, two documents, different answers, neither marked provisional.

Fixed first, as the stop condition requires: the passage now carries a superseded
note, the current figure is stated as **57 and provisional**, and the full
sequence with the reason for each move is reconciled in `README.md`.

### What this produced

- **`README.md`** — the entry point that did not exist. A map, not a report: what
  the audit is, what state it is in, which document answers which question, the
  numbers that moved, and what a stranger must not conclude.
- **A self-describing header on `progress.md`** — it is a chronological log, it
  contradicts itself on purpose, and its unchecked boxes are not a work queue.
- **`33-method-rules.md`** — the transferable rules with the instance that earned
  each, extracted from files that only made sense in sequence.

### The finding under the findings

**Every break was a link that existed in someone's head and not in the text.** The
information was present and correct in all three cases; what was missing was the
path from the question to it. That is the documentation form of the same failure
this file already records twice — a check that exists but is never run against the
thing it protects, and a spec that is silent rather than wrong.

> **Legibility is not a property of a document. It is a property of the path from
> a question to it, and the only way to test it is to start from the question.**
