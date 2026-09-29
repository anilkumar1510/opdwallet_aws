## Context

The live Claims list fetches `claim_category` valueset entries, builds a code-to-display map, and replaces only the list row’s display category. The live Claim Details page receives the raw `category` code from `GET_PAGE` and currently renders it directly. The detail page also uses the loaded record as the base for the document-resubmission payload, so the raw category must not be replaced in the API record. The existing `claim-detail-page-test.ts` route is backed by static data and is outside this live-data change.

## Goals / Non-Goals

**Goals:**
- Resolve the live claim’s category code through the existing `claim_category` valueset path.
- Show the resolved display name in the production Claim Details heading consistently with the Claims list.
- Keep the raw `category` code available to code that serializes the claim back to the API.
- Provide deterministic fallback behavior when the valueset is empty, unavailable, or lacks the code.

**Non-Goals:**
- Change the claim API, valueset API, or the static test route.
- Change claim category codes, claim submission payloads, or document-resubmission behavior.
- Add a second valueset endpoint, cache service, dependency, or generalized label registry.

## Decisions

### 1. Reuse the existing valueset lookup and map code-to-display only for presentation

`ClaimsStore` already owns the `claim_category` valueset request and the list-side category mapping. Reuse that lookup boundary for the detail page rather than adding another request path or duplicating a category-label table. The detail record retains `category` as the machine code; a separate `categoryLabel` (or equivalent display field) is used by the template.

**Alternative considered:** mutate `detail.category` to the display name. Rejected because the same record is spread into the document-resubmission payload, where the API expects the machine code.

### 2. Fall back to the raw category code

If the valueset is unavailable, empty, or does not contain the code, the existing raw value remains displayable. This preserves current behavior and avoids hiding a claim’s category while a supporting lookup is unavailable.

### 3. Limit the change to the live production route

The static test route already supplies its own category labels and does not load the live valueset. It remains unchanged to keep the scope and test data boundary explicit.

## Risks / Trade-offs

- **[Risk]** The valueset request adds latency or fails independently of `GET_PAGE`. → **Mitigation:** keep the raw-code fallback and reuse the existing lazy/once-only lookup behavior; do not block the detail page on the label lookup.
- **[Risk]** A future API call serializes a display-mapped record. → **Mitigation:** preserve the raw field and verify the document-resubmission payload still contains the original category code.
- **[Risk]** List and detail labels drift if mapping is duplicated. → **Mitigation:** centralize the code-to-display lookup at the existing store/mapping boundary and test both mapped and fallback paths.
