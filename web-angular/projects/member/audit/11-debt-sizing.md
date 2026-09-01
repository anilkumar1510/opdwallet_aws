# Sizing the 58 DEBT routes

Written after `09-step-count-diff.md`, as instructed — the hand-read is the basis.

## Verdict: **spec transcription, batchable by vertical**

The evidence supports the cheaper of the two sizings, and it supports it cleanly.

## The basis

The hand-read compared 16 screens across 4 booking verticals. **10 identical, 6
divergent — and all 6 are the same divergence**, select-then-Continue collapsed to
tap-to-commit, which is already sanctioned as parity register entry 10.

What was *not* found matters as much as what was:

- **No flow where Angular has more steps** than the reference.
- **No flow where the same step count commits differently.**
- **No second pattern of any kind.**

Four verticals — appointments, online consult, vision, dental — each built by
different route groups and partly by shared components, and they produced exactly
one deviation shape between them. That is the signature of a migration that was
done consistently, not one where each screen was improvised.

## Why that supports batching

If step divergences were idiosyncratic, each of the 58 would need individual
behavioural review before a spec could be written for it, because the spec would
have to describe whatever that screen happened to do. That is the expensive
sizing.

Instead there is one known deviation, already decided and registered. A retro-spec
for a DEBT route can therefore be written from the reference plus a single
standing carve-out, and reviewed against the Angular screen rather than
reverse-engineered from it. That is transcription work: bounded, parallelisable by
vertical, and mechanical enough to batch.

**It is also perishable.** Transcription is cheap *because* `web-member/` is
sitting there to read. Once the reference is retired the same work becomes
archaeology against the Angular code, with no independent source to check against.
This is the argument for doing it while both exist, not after.

## Two things that must not be batched away

### 1. Entry 10 is scoped too narrowly — widen before transcribing

The register sanctions tap-to-commit for the three **patient pickers**. The
hand-read found the identical divergence on the three **`select-slot`** screens,
unrecorded anywhere. Batch transcription against the current register would flag
those three as defects and "fix" them back to the reference — reversing a decision
nobody revisited.

Widen entry 10 first. One open question rides along:
`appointments/select-slot`'s React gate gnards **two** values
(`!selectedDate || !selectedSlot`), and whether Angular's single tap carries a date
as well as a slot is the one place collapsing the step could drop information
rather than a tap.

### 2. Presentation scenarios must force state, not read ambient data

`10-assertion-provenance.md` found exactly one wrong assertion across three closed
tasks, and its shape is directly relevant here. It passed on `₹3,000 of ₹3,000`,
inferring "exhausted" from a string that actually means fully **available**. The
predictive property was not "string match" — it was **ambient vs forced state**.
3.9 and 4.8 are near-entirely forced (injected 500s, cleared cookies, resized
viewports) and had zero bad assertions; 6.11 read ambient data and had one.

**Most of the 58 are presentation routes** — orders, records, benefits, policy
detail, profile, services. They are the same shape as the one that failed.

So the standing instruction for retro-speccing them: **force the state.** Serve a
fixture for the empty case, the exhausted case, the unrecognised-code case; do not
assert against whatever the seeded account happens to show. The wallet fixture
harness (`03-live/wallet-scenarios.mjs`) is the working template — it forces every
state it checks and carries both controls.

## What this sizing does not cover

- **The 6 UNSCOPED RN screens** (vaccination ×5, combined carts) are not part of
  the 58 and are not transcription — vaccination has no React reference at all, so
  it must be sized from RN. Separate, and more perishable still.
- **Dead code inside the 58** — `MemberSwitcher`, the two dead `FamilyStore`
  injections, three orphaned endpoint declarations. Free to remove, needs no spec,
  and should be taken out *before* transcription so nobody writes a spec for a
  component that is never rendered.

## Not started

No retro-speccing, per instruction. This document sizes the work; it does not
begin it.
