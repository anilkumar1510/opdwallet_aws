# Divergence 4 — tap-to-commit patient pickers

> **PORTED 2026-08-07.** Now lives in `web-angular/tools/parity-divergences.md`
> as **entry 10**, matching that file's format (`**Routes:**` / body / `**Why:**` /
> `**Revisit if:**`). The register turned out to hold **9** prior entries, not 3 —
> the "three sanctioned divergences" in the task briefs are the *no-new-flows
> exemption list*, which is a narrower thing than the register.
>
> This staged copy is retained for provenance only. **The register is canonical;
> edit that.**

---

## The divergence

**Routes:** `/member/appointments/select-patient`,
`/member/vision/select-patient`, `/member/dental/select-patient`

| | React (`web-member`) | Angular |
|---|---|---|
| Choosing | tap a card → sets `selectedPatient` state, `isSelected` styling | tap a card → navigates immediately |
| Committing | separate **Continue** button, `disabled={!selectedPatient}` | the tap is the commit |
| Default | auto-selects the patient matching `viewingUserId`, commented *"PRIVACY: Auto-select patient based on currently viewed profile"* | none |
| User-committed steps | **2** | **1** |

Reference: `web-member/app/member/appointments/select-patient/page.tsx:39,104-108,185,189,238-243`.

## Verdict: sanctioned

Restoring select→Continue would add a step back **and** introduce a failure mode
Angular does not currently have. React's flow can commit the wrong patient when
someone taps Continue without re-reading the pre-filled selection. Angular's
cannot: there is no default, so every booking requires an explicit tap on a named
person.

On the exact axis this was escalated over — booking for the wrong patient —
**Angular's flow is safer than the reference's.**

## Why this entry is written at length

**This is the first divergence sanctioned reactively rather than decided in
advance.** The other three were chosen and documented before the fact:

| # | Divergence | Decided |
|---|---|---|
| 1 | `ResponsiveLayout`'s mock user not ported | in advance |
| 2 | `wallet.ts` `getBalance` `this` bug not ported | in advance |
| 3 | `Router` over `window.location.href` | in advance, in `design.md` |
| **4** | **tap-to-commit** | **after the fact, on discovery** |

Part of the reason for sanctioning it is that reverting is expensive. **That is a
different standard from the first three, and it should be named as such rather
than blurred into them.**

The safety argument above is genuine and would stand on its own. But it was
constructed after finding the divergence, not before choosing it — nobody weighed
one-tap against two-tap and picked. The divergence arrived by omission and is
being ratified because it turned out to be defensible.

**This will be asked for again.** There are 58 unspecified routes, and each is a
chance to discover a divergence that is cheaper to ratify than to revert. The test
that should be applied next time, and that this one passes:

1. Is the divergence defensible on its own merits, stated without reference to
   the cost of reverting?
2. Does it remove a failure mode rather than add one?
3. Does it change what a member can *do*, or only how many taps it takes?

A divergence that only passes because reverting is expensive fails this test.
Record it as debt and revert it later; do not ratify it.

## What was fixed rather than sanctioned

Tap-to-commit is sanctioned. **The family context not reaching the picker is not**
— it survives the decision as a separate defect and was fixed. See
`08-fix-session-2.md`.
