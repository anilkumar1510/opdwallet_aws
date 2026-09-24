## Why

The claim API returns `claim_action_reason` as a machine code (e.g. `AMOUNT_ABOVE_THE_NETWORK_TARIFF`) rather than a human-readable message. The member portal currently renders that raw code verbatim, so a claim blocked for exceeding the network tariff shows `AMOUNT_ABOVE_THE_NETWORK_TARIFF` to the member instead of an explanation. The display names live in a valueset at `/system-management/api/v1/valueset?queryId=get_valueset_by_id_flat&args=resourceId:claim_action_reason,...`, the same mechanism already used for claim categories (`CLAIM_CATEGORY_VALUESET_ARG`).

## What Changes

- Add a `CLAIM_ACTION_REASON_VALUESET_ARG` constant in `claim.mapper.ts`, mirroring `CLAIM_CATEGORY_VALUESET_ARG`
- Add `ClaimActionReason` type and a `toClaimActionReason` mapper function that converts a valueset entry into `{ code, display }`
- Add `ClaimActionReasonDto` to `claim.dto.ts` and map `claim_action_reason` from the claim DTO through the new type
- Add an `actionReasons()` method to `ClaimsStore` that fetches the valueset once and caches it
- Update `actionReason()` in `ClaimDetailPage` to resolve the code against the cached valueset, falling back to the raw code when unmapped
- Update `static-claims.data.ts` to use reason codes instead of free-text messages, so seeded claims exercise the mapping path

## Capabilities

### New Capabilities
- `claim-action-reason-valueset`: Fetch and map claim action reason codes to display names via the system-management valueset API

### Modified Capabilities
- (none)

## Impact

- **New files**: none
- **Modified**: `projects/member/src/app/core/claims/claim.dto.ts`, `claim.mapper.ts`, `claim.model.ts`, `claims.store.ts`, `static-claims.data.ts`, `projects/member/src/app/features/claims/claim-detail-page.ts`, `claim-detail-page-test.ts`
- **Dependencies**: none — reuses existing `AppService.getcall` and `ValuesetEntryDto`
- **Domain**: `api.habithealth.com` system-management valueset endpoint, already proxied via `proxy.conf.json`