# 33 — Method rules, with the instances that earned them

**For a different project.** Everything here was learned on one Angular-from-React
migration audit, but none of it is specific to that. Each rule is followed by the
instance that produced it, because **the rules without their instances read as
platitudes** — "verify every clause" is advice; *the diagnostics upload failed both
of its THEN clauses and a partial check would have passed it* is an argument.

Ordered roughly by how much they cost to learn.

---

## On detectors

### A detector's first output is a candidate list, never a findings list

**Five static detectors were built. All five shipped a false positive on their
first run, and every one came from matching syntax rather than structure.**

| Detector | First-run false positive |
|---|---|
| dead endpoint | a self-use filter skipped any `identifier:` line, discarding two live calls that sat inside an object literal (`downloadPath: RECORDS_API.digitalDownload(id)`) |
| route-input sweep | `data: { mode }` shorthand has no colon → six phantom rows; `[queryParams]="{…}"` in a template is not `queryParams: {…}` in TypeScript → four more |
| effect self-write | an expression-bodied `effect(() => this.store.select(…))` has no block, so scanning to the next `{` swallowed the *following* effect and blamed the wrong line; and a read inside `.then()` is not a tracked dependency |

Three of the five would have produced wrong reports had the first output been
trusted. **Read every flag before it becomes a finding.** The scan locates
candidates; a human classifies them.

Corollary, learned the same way: **a tool asserting its own soundness in prose is
the thing nobody re-checks.** One detector's header claimed it "will not invent
one" while doing exactly that on its first run.

### A control anchored to a detector's own first finding dies if the detector succeeds

**The write sweep looked for features with no commit path. It found AHC. Its
negative control was "AHC shows none".** AHC's commit path was then built — and the
detector spent **sixteen sessions** exiting "output meaningless".

This is worse than ordinary control expiry because it is *guaranteed*: the control
is anchored to the very thing the detector exists to get fixed. Success kills it.

> **Fixture-anchor that class of control from the start. It is not a
> nice-to-have.**

### Controls expire, and drift is worse than expiry

Three ways a control stops meaning what it says:

- **Expired — fails loudly.** Anchored to a defect; the defect gets fixed. Goes
  red. Two instances, both invisible for a long time anyway *because nobody
  re-ran the detector*.
- **Drifted — keeps passing, means something else.** One detector still correctly
  flags a component as taking a route input nothing supplies — structurally true —
  but the defect it was written from was fixed, so its output became a fact list
  rather than a defect list. **Nothing announces this.** The fix is not
  re-anchoring; it is a header saying what a row means and what it does not.
- **Fragile — valid, single point of failure.** Every criterion-6 harness proves
  it can see a real obligation by finding one specific payment record. If that
  record is settled, they all lose their control at once, and *a query returning
  nothing looks identical whether the run is clean or the check is dead.*

> **Before writing a control, ask what would make it stop being true. If the
> answer is "someone fixes the bug", it is a timer, not a control.**

---

## On rules themselves

### The test for a method rule is what would run it

**Two prose rules failed to prevent the exact recurrence they were written for.**

| Rule | Written after | Recurred as |
|---|---|---|
| "establish class boundaries when reading a schema" | a 400 caused by attributing a nested DTO's fields to its parent | the same nested-object mistake in a different feature, six sessions later |
| "the effect fought the user" | a prefill effect that re-filled a field the member cleared | two more prefill effects with the same two lines, in another feature |

Both were accurate. Both were **descriptions of a past incident** rather than
something checkable. Both were fixed by mechanising them — and the mechanised
version of the second immediately found **four more sites**.

> If the answer to *"what would run this rule?"* is *"the reader remembers"*, it is
> a reminder, and reminders decay.

**Corollary: convention first, then detector.** One check was left unbuilt because
a sound version was expensive — the codebase has many legitimately stored message
signals, and separating those from stale ones means modelling when each condition
changes. The cheap version needs a convention (*a message describing form state
must be a `computed()`*), after which grep is exact. **The check was expensive
because the convention was missing, not because the property was hard to see.**

### The same failure appears at three altitudes

- a method rule nobody executes → the defect recurs
- a control nobody re-runs → the detector rots
- a spec scenario whose precondition cannot arise → it passes for the wrong reason

**One shape: a check that exists but is never run against the thing it protects.**
The remedy is identical each time — evaluate against current state, not a
remembered one.

---

## On evidence

### A citation must carry its enclosing scope

A line number is not a citation. *"`confirm/page.tsx:141` creates the booking"* was
wrong: line 141 sat inside `handlePaymentSuccess`, a payment callback, not the
journey's create. The misreading survived for twelve sessions and produced a
sanctioned-divergence entry that had to be withdrawn.

> Name the class, the function, and the branch. `file:line` alone is a pointer to
> a place, not a claim about behaviour.

### Verify every clause of a scenario, not the first one

A diagnostics upload was found filing prescriptions under the *lab* prefix **and**
returning the member to the *lab* hub. Its scenario had two THEN clauses and it
failed both. A check of either one alone would have looked like a partial pass.

Related: **assert on the network log when the question is which endpoint was
called.** The two upload forms are visually identical; nothing on screen could
distinguish them.

### Print the render; don't adjust the assertion

An assertion that could not tell two branches apart passed on the wrong one for a
whole session: the failure copy and the empty-state copy both ended "Try again".
Re-aimed at copy unique to each branch, the defect was unambiguous.

> **A green suite is evidence about the assertions, not only about the code.**

**Two adjustments, then stop and read.** Every time this limit was respected, the
third attempt would have been assertion-fitting; the answer came from printing the
output or reading the component. Where it was exceeded — once, at three
corrections — that was recorded in writing rather than absorbed, because a rule
broken quietly is worth less than a rule broken on the record.

### Confirmation is a warning sign, including for your own hypotheses

A mapper gap was predicted for a particular moment and the prediction absorbed the
attention the real cause never got — the actual defect was a nested DTO. The
forecast was reasonable and wrong, and being reasonable is what made it expensive.

### Cold context for forced-failure scenarios

Intercepting a request *after* sign-in proves nothing: the store already holds the
data. One scenario described a failure that could not occur — the screen rendered
its data from the session, not from the route being failed — and it had passed
transcription because nothing forced it. Only a cold run, with interception
installed before sign-in, exposed the real source.

---

## On harnesses that write

### A harness that mutates shared state is not repeatable by default — and there are two varieties

> Where the mutation is a **collision**, a selection strategy recovers it. Where
> the mutation **consumes a finite entitlement**, nothing does.

| | Collision | Entitlement |
|---|---|---|
| Example | a booking slot another run took | a per-year benefit allowance |
| Recoverable in-harness? | **yes** — retry another candidate | **no** |
| Cost of ignoring | one run fails, the retry succeeds | the harness stops working, permanently |
| What to do | write the retry | **count the runs before building** |

Treating these as one thing is what left the second unbudgeted. A dental
verification suite had **seven runs in it**; nobody counted, and the eighth
failed — taking a measurement with it that is accurate, recorded, and no longer
reproducible.

> **Before building a harness that books, divide the allowance by the per-run cost
> and write the number down.**

And where the mutation is *deterministic* — an id computed from doctor, date and
time — it cannot be made repeatable at all. That is a property of the flow, not of
the harness, and the formula must not be changed to make a test pass.

---

## On specifications

### A spec transcribed from a working reference is silent more often than wrong

Five specs under-claimed rather than mis-claimed. Not one was false; each omitted a
dependency — a precondition, a data source, an identifier format.

**Why this is the expected failure mode:** you can see what a screen *does* by
reading it; you cannot see what it *assumes*, because the assumption is already
satisfied in front of you.

**And the danger is a false pass, not a false fail.** One spec's cart scenarios
read *"GIVEN a cart"* and were perfectly satisfiable in a harness while **no member
could obtain one**. A silent spec cannot fail in the place where it is wrong.

> When a scenario passes, ask what had to be true for it to pass, and whether the
> product is what made it true. If the answer is "the fixture", it is satisfied,
> not verified.

Corollary on cost: every one of those was fixed by an **addition**, never a
rewrite — which reads as reassuring and is a **selection effect**. Those are the
silent specs something happened to force.

### Permission is not approval

A register entry ruled that payment must never precede booking creation. That was
read as *prescribing* a particular continuation, and a flow change shipped on it.
The entry ruled **ordering**; it said nothing about where a journey ends. It
permitted the change without mandating it.

> **An entry that does not forbid something has not approved it.**

The test, for any entry: name the axis it rules on; ask whether your change is on
that axis; and if it is merely *not prohibited*, the entry is silent and silence is
not sanction.

### A message derived from a past evaluation outlives the condition it described

A stored validation message stayed on screen after the member fixed the field.
Same class as an empty-state that says "no results" when the request failed, and a
label that announces a document with no way to fetch it.

> **Derive user-facing state from current state, or clear it when the condition
> changes.**

---

## On process

### Transcribe and verify in the same session

Two of the worst defects found were invisible to every static check: a confirm
screen that routed, rendered and offered an enabled button that silently did
nothing; and a record that was created successfully and then displayed as "not
found" because navigation used the wrong one of two ids.

Both were caught by **driving the flow to a terminal state**. Neither would have
been caught by a spec written and verified a week apart — the specification would
have described a working journey.

### An in-code comment has no more authority than a stale register entry

A comment stated that an endpoint wanted a Mongo `_id`; the API resolved by
business reference and said so in its own source. **The disproof was two lines
further up in the same function**, where a sibling call already sent the business
id and was accepted.

Comments are assertions nobody re-checks. So are file headers, register entries,
and control names.

### Where a defect can only be fixed by changing a flow, file it and stop

A flow change is any change to the sequence of screens a member passes through, or
to where a journey ends. **Fixing a screen that cannot complete is not a flow
change; adding a destination is.** One such change was shipped as a defect fix and
reverted five sessions later.

That distinction is what makes "filed, not fixed" a decision rather than a
backlog — and it is worth saying out loud, because a list of unfixed defects
invites someone to work through it.
