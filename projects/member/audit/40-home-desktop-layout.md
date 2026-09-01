# 40 — The desktop home, rebuilt to a supplied design

**2026-08-13, session 55.** The member supplied a desktop mock and said the
Angular page should look like it.

## First: the mock is not the reference

Captured both apps at 1600px before touching anything
(`scratchpad/react-home.png`, `angular-home.png`). **Angular's desktop was
already very close to React's** — same dark top bar, same two-column split, same
sections. The mock is a **third design**, matching neither.

That matters because this project has been a parity migration: the default is
"do what the reference does". This is not that. It is a design instruction, and
it overrides parity for this screen — which is the member's call to make, but
worth writing down so a later reader does not "fix" the divergence back.

## Built

| | Before | After |
|---|---|---|
| Quick Actions | vertical stack in the sidebar, "Quick Links" | **full-width row of six pills** above both columns |
| Wallet balance | white card, top of the right column | **blue illustrated card, in the sidebar under the policy** |
| Health Benefits | four across | **two across** |
| More Services | four cards inside the right column | **full-width row of pills** below both columns |

The blue card was already built for mobile; desktop now opts into it via
`preferBlue`, so the wallet screen keeps the white one. Nothing new was designed
that did not already exist somewhere in the app.

## NOT built, and why

**The top utility bar** — Habit Coins, My Files, Cart (3). There is no cart, no
coins and no file store in this system. A cart badge reading "3" over nothing is
the `21-degraded-not-declared.md` failure in its purest form.

**The dark secondary nav** — My Benefits, Packages, Consultation, Vaccination,
Dental procedures, Lab & Diagnostics, Assessment, Pharmacy, Engage, Play, Mental
Wellness. **Six of those eleven have no screen**: Packages, Assessment, Engage,
Play, Mental Wellness and Vaccination (ruled in during session 50 but never
built). Navigation to nothing is worse than no navigation — it is the defect
class this audit spends most of its time removing.

The five that DO exist (My Benefits, Consultation, Dental, Lab & Diagnostics,
Pharmacy) are all reachable today from Quick Actions and the benefit cards, so
the nav would add a second path rather than a first one.

**The Home/Claims/Bookings/Wallet tab row** under the greeting duplicates the top
bar, which already carries those four and marks the active one. Two navigations
for the same four destinations, one screen apart.

## Verification

`03-live/verify-home-desktop-layout.mjs` — **13/13**, non-mutating. Arrangement is
asserted from **bounding boxes**, not from class names: the balance sits at the
policy's x below its y, the benefits start beyond the sidebar's right edge, More
Services returns to the left margin below both.

**The control that earned its place:** the six pills must sit on ONE row. They
wrapped onto two on the first attempt and a count-only assertion — six pills
exist — passes either way. The second attempt truncated "Transactio…" instead,
so there is an assertion for that too.

**Mobile is asserted unchanged**, section by section. The entire change is `lg:`
styling and the phone layout was already settled; a desktop rework quietly
altering the phone is the likeliest way this breaks and nothing else would catch
it.

### A harness note

`opd-quick-links` and `opd-more-services` each render **twice** — a desktop
instance and a mobile one, shown and hidden by CSS, the pattern the shell already
uses. The first run reported "12 pills" and then crashed on a null bounding box
from the hidden copy. Every locator here is `:visible` for that reason.

---

# PART TWO — the header

*"top should be like this"*, with a crop: avatar, "Hi Shivam! ⌄", "welcome to OPD
Wallet", three round icon buttons, and an underline tab row.

**That header already existed — on the phone.** The greeting block, the family
chevron and the bell/wallet/cart buttons are the mobile header, which was
`lg:hidden`. Desktop showed "Welcome back to OPD Wallet, Shivam Jha!" instead, and
carried navigation in a navy bar.

| | Before | After |
|---|---|---|
| Brand bar | navy, with logo + four nav pills + bell + avatar | **slim white bar, logo only** |
| Greeting | "Welcome back to OPD Wallet, {name}!" | **avatar + "Hi {name}! ⌄" + subtitle**, as on the phone |
| Icon buttons | phone only | **shown on desktop**, scaled up |
| Destinations | navy pills | **underline tabs** below the greeting |

**A correction to part one.** I wrote that the cart in the design does not exist.
It does: the cart button links to `/member/lab-tests` and badges
`carts.openCount()` — real open lab carts. It was in the phone header the whole
time. The utility bar's *Habit Coins* and *My Files* still have nothing behind
them and remain unbuilt.

**Why the navy bar lost its nav rather than keeping it.** Tabs plus pills would be
two navigations to the same four destinations, one row apart — the objection
raised against the mock's tab row in part one, which only holds if the pills stay.
Moving them resolves it; keeping both would not.

## Two defects this produced, both caught

**The greeting rendered white-on-white.** It was styled for the blue phone hero
(`text-white`, `bg-white/25`) and desktop has no blue behind it. Visible in the
screenshot, invisible to any structural assertion — so the harness now reads the
**computed colour** and fails if it is white.

**A control that failed on correct code.** "The four destinations appear once" was
implemented as *count links named "Bookings"* — which is 2, because Bookings is
also a Quick Action pill. **Counting a label is not counting a navigation.**
Rewritten to count visible `nav[aria-label="Main"]`.

## Also

`Claim` → **`Claims`** in the destination list, matching both the design and the
reference. It had been singular since the nav was built.

## Verification

`03-live/verify-home-desktop-layout.mjs` — **19/19**, mobile asserted unchanged
throughout.

---

# PART THREE — the brand bar removed, and the regression that exposed

*"remove"*, over the white logo strip.

Removing it was one deletion. What it exposed was not.

## The regression I introduced and then caught

With the navy bar gone and the tabs living **inside the home page's header**,
every other desktop screen had **no navigation at all**. `/member/claims`
measured **zero** visible main navs. A member on Claims could reach Home only
through the back link, and Bookings or Wallet not at all.

**Navigation belongs to the shell, not to a page.** It had been in the shell all
along (the navy bar); I moved it into a page while chasing the header design and
did not ask what that meant for the other twenty-odd screens.

**Fixed** by moving both the greeting row and the tab row into the shell, above
the router outlet, desktop only. Every screen now carries the same header, and
the active tab is marked correctly on each.

The phone is untouched: it keeps its own greeting on the blue hero and the
floating bottom nav.

## Final shape of the desktop header

```
  SJ  Hi Shivam! ⌄                                    (bell)  (wallet)  (cart)
      welcome to OPD Wallet
  ─────────────────────────────────────────────────────────────────────────────
  Home    Claims    Bookings    Wallet
```

No brand bar, no navy, no duplicate navigation.

## Verification

**24/24.** Three assertions were added for exactly the regression above —
`/member/claims`, `/member/bookings` and `/member/wallet` each carry the tabs with
the correct one marked `aria-current`. A fourth asserts only ONE greeting is
visible, since the page and the shell both have markup for one.

Dead imports removed with the bar: `Icon` and `ProfileMenu` from the shell
(ProfileMenu came straight back for the greeting), and `Icon` from QuickLinks. The
compiler flagged all three; leaving them would have been leaving the same
declared-and-unused shape the endpoint scan exists to catch.

---

# PART FOUR — the header adopts the page's type scale

*"same font and style of others like quick actions."*

The greeting had been set at 22px semibold — a size and weight that exist nowhere
else in the app. Every section heading on the page (`Quick Actions`,
`Your Policies`, `Health Benefits`, `More Services`) shares one style:

```
text-[18px] font-medium leading-[1.2] text-[#1c1c1c]  lg:text-xl
```

The greeting now uses exactly that: **20px, weight 500, `#1c1c1c`, Inter** —
measured identical to the `h2`s beside it. The avatar came down from 44px to 40px
to sit with a 20px line rather than a 22px one, the subtitle took the app's muted
`#656565`, and the tabs took `font-medium` at 16px with `#383838` when inactive.

**Two assertions, because "looks the same" is exactly the claim that goes stale
silently.** The harness reads *computed* styles and compares the greeting against
the section heading — family, size and weight — rather than comparing class
strings, which can diverge while still looking related.

A probe bug worth noting: the first version selected the greeting by
"span whose textContent starts with Hi", which matched the **wrapper** and
reported 16px/400 for correctly-styled markup. It now requires the element's
first child to be the text node itself. **A selector that matches an ancestor
measures the ancestor.**

**26/26.**

---

# PART FIVE — one heading scale, enforced

*"fix your wallet balance font and style."*

`Your Wallet Balance` was `text-xl font-bold text-black` — the only heading on the
page in **bold**, and the only one in pure black rather than `#1c1c1c`.

**Measuring it exposed a second one.** Printing the computed style of every
visible `h2` side by side:

| Heading | Before |
|---|---|
| Quick Actions | 20px / 500 / `#1c1c1c` |
| **Your Policies** | **18px** / 500 / `#1c1c1c` |
| **Your Wallet Balance** | 20px / **700** / **black** |
| Health Benefits | 20px / 500 / `#1c1c1c` |
| More Services | 20px / 500 / `#1c1c1c` |

`Your Policies` had no `lg:text-xl`, so it kept its phone size on desktop. Nobody
reported it and it had been there since the page was built.

Both fixed; all five now read `20px / 500 / rgb(28, 28, 28)`.

**The assertion is collective, not per-heading.** It gathers every visible `h2`,
computes size/weight/colour, and requires **exactly one distinct spec**. A
per-heading check would have needed someone to already know which heading was
wrong — which is the thing the check is supposed to tell you. Two drifted
headings survived every prior run of this harness because it never compared them
to each other.

**27/27.**

---

# PART SIX — the balance card rebuilt to the design

The supplied card: a tall panel, the figure large, the caption on two lines, and
the wallet illustration big in the bottom-right with the sparkles to its left.

| | Before | After |
|---|---|---|
| Height | 150px | **215px** |
| Figure | 30px | **36px bold** |
| Caption | one line, 12px | **two lines, 14px** |
| Illustration | 120×70, in flow | **162×92, absolute, bottom-right corner** |
| Sparkles | above the wallet, 7-12px | **left of the wallet, 12-20px** |

## Arbitrary-value class bindings did not apply

`[class.lg:h-[212px]]="preferBlue()"` — Angular class-binding names containing
`[` and `]` do not reliably resolve, so the card came out 186px when 212 was
asked for, and several other sizes silently kept their old values. **It failed
quietly**: no error, no warning, just the previous number.

Replaced with `[style.height.px]`, `[style.width.px]`, `[style.fontSize.px]`.
Safe without an `lg:` prefix because the `preferBlue` instance only ever renders
inside a `hidden lg:block` container — the phone card is a different instance
with `preferBlue` false.

## The caption overlapped the illustration

At 56% width the second line ran under the wallet's left edge. Narrowed to 45%,
and there is now an assertion that measures the caption's right edge against the
illustration's left edge and fails on any overlap — a thing that is obvious in a
screenshot and invisible to every structural check.

## ⚠ ONE DIFFERENCE THAT NEEDS A DECISION

The design's caption reads **"Your total usage cannot exceed this allocated
limit."** The phone card reads **"…cannot exceed this amount"**, and the
reference uses the shorter one too.

**The desktop card now says one thing and the phone card another.** That is a
real inconsistency — one fact, two sentences — and it is deliberate only in the
sense that the phone caption is `whitespace-nowrap` at 9px and the longer
sentence would overflow it. Unifying needs either the phone caption allowed to
wrap or the shorter sentence kept on both. **Flagged, not resolved.**

## Verification

**30/30**, including that the phone card is **96px and untouched**.

---

# PART SEVEN — benefit cards to an exact size

**355.5 × 99**, supplied as a measurement.

They were **418 × 82**. The width was wrong for a reason worth recording:
`lg:grid-cols-2` makes two *fractional* columns, so each card stretches to fill
whatever the column is — 852px of right column minus a 16px gap, halved. The card
never had a width of its own.

Fixed by sizing the tracks rather than the card:

```
lg:grid-cols-[355.5px_355.5px]  lg:auto-rows-[99px]
```

`auto-rows` rather than a height on the card, because the card is `h-full` inside
its cell — setting the row is what actually decides it.

**All eight measure 355.5 × 99**, asserted exactly. The phone grid is untouched at
172px wide and is asserted not to inherit the desktop size.

Note that these arbitrary values are in a **static class attribute**, which
Tailwind compiles normally — unlike the bracketed values in *class bindings* that
failed silently in part six.

**32/32.**

---

# PART EIGHT — the benefit card to the design

A close-up was supplied. Size was already right from part seven; the treatment
was not.

| | Before | After |
|---|---|---|
| Radius | 16px | **22px** |
| Border | 1.5px `#E5E7EB` | **none** |
| Chevron disc | 24px | **40px** |
| Disc position | `ml-[136px]` after the amount | **`ml-auto`, at the card edge** |
| Title | 16px | 18px |
| Figure | 18px | 21px |
| Left // 3k | 12px | 13px |

## The disc never lined up

`lg:ml-[136px]` placed it a fixed distance **after the amount**, so a card reading
`₹28` put its chevron 100px left of one reading `₹5,000`. Eight cards, eight
positions. `ml-auto` pins it to the right edge instead — measured identical at
22px on all eight.

Nobody reported this and it is not in the close-up's brief; it only became
visible once the discs were large enough to notice. The measurement caught it:
`[...new Set(gaps)]` had to collapse to one value.

## Two icons rendered where one was wanted

Sizing the chevron for the bigger disc, I put two `<opd-icon>`s in with
`lg:hidden` and `hidden lg:block`. **Both rendered.** The class lands on the
component host, and the host was not the element deciding display — so the disc
showed a pair of chevrons side by side.

Replaced with one icon in a `lg:scale-[1.45]` wrapper, and an assertion that each
card contains exactly **one** `svg`. This is the third styling mechanism this
session that failed quietly rather than erroring — after bracketed class bindings
and the white-on-white greeting.

The phone card is asserted to keep its own 16px radius, its border and its 24px
disc.

**37/37.**

---

# PART NINE — the balance card to exact spec

```
width: 411;  height: 235;  border-radius: 20px;  opacity: 1;  angle: 0deg
```

Applied as given: **411 x 235, radius 20px**, asserted exactly.

**`top: 769.89px` and `left: 121px` were deliberately NOT applied.** They are
coordinates in the design canvas, not layout instructions — hardcoding them as
absolute position would take the card out of flow and break at every width other
than the one the mock was drawn at. The card reaches the same place by being the
width of the sidebar column, which is what the numbers describe.

**The sidebar widened from 360 to 411** to hold it. The arithmetic was checked
before committing to it, because the benefit cards are now fixed-width and can no
longer absorb a squeeze:

```
411 (sidebar) + 28 (gap) + 727 (2 x 355.5 + 16) = 1166  ≤  1176 available
```

Ten pixels of slack. Any wider a sidebar and the benefit grid would wrap.

The illustration was rescaled to keep its share of the card (185 x 105 in
411 x 235, the same 45% x 45% it had at 360 x 215) — a fixed size would have left
it stranded in the corner of a bigger card.

## Left unmatched, and worth a decision

**The policy card above it is still ~300px wide** in a 411px column, so the two
cards in the sidebar do not align. The policy card sits in a horizontally
scrolling carousel with its own item width, and no spec was given for it.
Flagged, not changed.

**37/37.**

---

# PART TEN — sidebar alignment, and the benefit cards narrowed

**The policy card now matches the balance card.** It was 300 x 168 in a 411px
column while the card below it was 411 x 235 — the misalignment flagged at the
end of part nine. The carousel track and its items now take the sidebar width, so
both cards sit flush at x = 121.

Its height came from the supplied mock rather than from a given number: the
policy card measures ≈2.17:1 there against the 1.79:1 it had, so
`lg:aspect-[2.175]` puts it at **411 x 189**. Radius matched to the balance card
at 20px. **That ratio is measured off a screenshot, not specified** — a number
would override it.

**Benefit cards: 355.5 → 305.5 wide**, as asked. Height unchanged at 99.

Layout arithmetic after both changes:

```
411 (sidebar) + 28 (gap) + 627 (2 x 305.5 + 16) = 1066  ≤  1176 available
```

110px of slack now, against 10px before — the narrower cards took the grid well
clear of wrapping.

**37/37.**

---

# PART ELEVEN — the chevron disc, equal gaps

Measured before changing anything: **right 22px, bottom 7px.**

The cause is worth recording because the markup looked symmetric. The disc sat
**in the flow**, inside the amount row, centred on the amount's text line. The
disc is 40px tall and that line is about 21px, so it hung ~11px past the padding
box. Vertical padding was 18 and the disc ended 7 from the edge; horizontal
padding was 22 and it ended 22.

**No padding value could have fixed that**, because the overhang came from the
disc being taller than the line it centred on, not from the padding. It had to be
pinned:

```
lg:bottom-[18px]  lg:right-[18px]      (card padding now a uniform lg:p-[18px])
```

Measured after: **18 / 18 on all eight.**

The amount gained `lg:pr-[62px]` (disc 40 + gap 18 + 4) so a long figure cannot
run under the pinned disc; measured clearance is 66px.

Two assertions added — that the right gap equals the bottom gap, and that pinning
did not slide the disc under the title. The second is the risk this change
introduced: at a fixed 99px card height with 18px padding, the disc top and the
title bottom now meet at exactly 0px of clearance. **A two-line benefit title
would collide.** None of the eight wraps at 305.5px today, and the assertion will
fail if one ever does.

**39/39.**
