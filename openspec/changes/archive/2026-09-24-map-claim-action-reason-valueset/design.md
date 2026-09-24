## Context

The API returns raw machine-readable codes for `claim_action_reason` (e.g., `AMOUNT_ABOVE_THE_NETWORK_TARIFF`). Members need to see human-friendly display names fetched from the system valueset endpoint:
`GET /system-management/api/v1/valueset?queryId=get_valueset_by_id_flat&args=resourceId:claim_action_reason,system:karexpert,noCount:0&application=system-management`

## Goals / Non-Goals

**Goals:**
- Fetch and cache/map `claim_action_reason` codes to their display names via the valueset API.
- Gracefully fall back to humanised strings if the valueset entry is not found.
- Display the mapped reason correctly in the claim detail view.

**Non-Goals:**
- Modifying backend APIs.
- Caching valueset responses beyond simple in-memory store state.

## Decisions

### 1. Valueset Fetching in ClaimsStore
- **Why**: `ClaimsStore` already handles valuesets (e.g., categories via `valueset`). We will add a similar method to fetch `claim_action_reason` mappings.

## Risks / Trade-offs

- **Network latency**: Fetching valueset on detail load could add a request. Mitigation: Load once or lazy load with fallback.
