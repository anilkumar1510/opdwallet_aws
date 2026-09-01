# ADR-0004: One responsive layout serves mobile and desktop

**Status**: accepted
**Date**: 2026-08-05

## Context

The member portal is used on phones and on desktops. The existing `web-member` portal already handles this with a single layout that swaps a persistent sidebar for a bottom tab bar at Tailwind's `md` breakpoint (768px).

The Angular portal will carry roughly 65 screens. Whether those screens are written once or twice is a decision worth making before the first one is written, because reversing it later means touching all of them.

## Decision

We will serve every viewport width from one application, one route tree, and one layout component.

Presentation adapts at a CSS breakpoint: a persistent side navigation at and above 768px, a bottom tab bar plus header below it. Both navigation surfaces render from a single destination list, so the two presentations cannot drift apart in what they expose.

We will not detect devices, will not redirect to a mobile URL prefix, and will not produce a separate mobile build.

Where a viewport-dependent decision genuinely cannot be expressed in CSS, it reads a breakpoint signal backed by `matchMedia`, so it stays reactive as the viewport changes rather than sampling width once at load.

## Consequences

A URL identifies a screen, not a screen-and-device. A link shared from a phone opens the same content on a desktop, and resizing a window does not navigate the member somewhere else.

Navigation parity between viewports is structural rather than a synchronisation chore: adding a destination adds it everywhere, because there is one list.

Each screen is written once. The cost is that every screen author must think about both layouts as they write, rather than deferring the narrow case to a separate mobile team or a later pass.

Both navigation surfaces are present in the DOM at all widths and hidden by CSS. At the current component count this is cheaper than the alternatives; `@defer` on the hidden surface is available if it ever measures as a problem.

Every future member-portal change inherits this: features ship responsive, not desktop-first with a mobile follow-up.
