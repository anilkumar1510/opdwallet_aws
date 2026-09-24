## 1. Type & DTOs

- [x] 1.1 Add `ClaimActionReason` type to `claim.mapper.ts` with `code` and `display` fields
- [x] 1.2 Add `claim_action_reason?: string` to `ClaimDto` in `claim.dto.ts`

## 2. Mapper

- [x] 2.1 Add `CLAIM_ACTION_REASON_VALUESET_ARG` constant in `claim.mapper.ts`
- [x] 2.2 Add `toClaimActionReason` function that maps `ValuesetEntryDto` to `ClaimActionReason`
- [x] 2.3 Add `humaniseActionReason` fallback function for unmapped codes

## 3. Store

- [x] 3.1 Add `loadActionReasons()` and `actionReasons` map/signals to `ClaimsStore`
- [x] 3.2 Add `getActionReasonDisplay()` method that resolves a code against the cached map

## 4. Detail Page

- [x] 4.1 Update `actionReason()` in `ClaimDetailPage` to trigger valueset load and use store's mapping
- [x] 4.2 Update `actionReason()` in `ClaimDetailPageTest` to use the store's mapping

## 5. Static Data

- [x] 5.1 Updated static data / scenarios to support action reason codes

## 6. Verification

- [x] 6.1 Run `npm run build` to verify compilation
