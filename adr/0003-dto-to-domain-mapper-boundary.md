# ADR-0003: A mapper boundary translates API DTOs to domain models

**Status**: accepted
**Date**: 2026-08-05

## Context

The OPD Wallet API returns Mongo-shaped payloads: `_id` rather than `id`, coded values such as `REL003` for a relationship and `CAT002` for a benefit category, ISO date strings, free-form status strings, and bare numbers that represent money.

In the existing `web-member` portal these shapes reach components directly — `lib/api/types.ts` declares the transport shapes and screens consume them as-is. The consequence is `lib/utils/mappers.ts`: a grab-bag of `getRelationshipLabel`, `getCategoryName`, `getStatusColor` lookups that every screen calls independently, with each screen free to forget one and render `REL003` to a member.

The API is not changing as part of the Angular port, so the translation has to happen somewhere on the client. The question is whether it happens once or per screen.

## Decision

We will define, per resource, three files: a `*.dto.ts` declaring the transport shape as the API actually returns it, a `*.model.ts` declaring the domain model the application uses, and a `*.mapper.ts` holding a pure `toDomain` function — plus `toDto` only where the application writes.

Stores call mappers. Components receive domain models and never see a DTO.

Mappers translate `_id` to `id`, coded values to enum members, date strings to `Date`, money amounts to a single `Money` shape, and free-form status strings to discriminated unions.

Mappers degrade on unknown input rather than throwing. An unrecognised relationship code maps to a neutral label; an unrecognised category retains the API-supplied display name.

## Consequences

Domain vocabulary is defined once. A screen cannot render a raw code because it never receives one, and the lookup helpers that were duplicated across the reference portal collapse into the mapper that owns each resource.

When the API changes a shape, exactly one file changes per resource.

Degrading on unknown codes means the API introducing a new benefit category cannot blank a member's wallet screen — the category appears with its API-supplied name instead of breaking the render. The cost is that a genuine API contract violation surfaces as a neutral label rather than a loud failure.

Mappers are hand-written, so they can drift from the API silently. Runtime schema validation at this same seam is the upgrade path if drift becomes routine; because the boundary already exists, adding validation would touch no component.

Every future change that consumes a new endpoint inherits this: add the DTO, the model, and the mapper. Do not widen a domain model to accommodate a transport quirk.
