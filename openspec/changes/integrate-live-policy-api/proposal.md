# Proposal

## Why

The OPD Member application was previously using hardcoded static mock policy data (`static-policy.data.ts`), which prevented real API testing and dynamic user journeys. Members need their actual assigned OPD policies, wallet balances, benefit categories, and covered family relationships retrieved live from the backend services (`account-management` and `habit-opd`). Furthermore, during API latency or failures, the interface must present fluid skeleton loaders without layout shift, clear error recovery states with retry capability, and friendly empty states when no policy is assigned.

## What Changes

- **Live Policy Member Assignment & Version Integration**: Connects `PolicyStore` to `opd_policy_member_assignment` and `opd_policy_version` in `habit-opd`.
- **Dynamic Patient ID Resolution**: Dynamically extracts `user_id` from live `user_relationship_mapping` (`GET_FAMILY_LIST`), replacing hardcoded patient IDs.
- **Dynamic Relationship Filtering for Policy Carousel**: Matches family members against covered relationships (`version.relationships` with `is_primary || covered !== false`), ensuring cards are generated only for entitled family members.
- **Removal of Static Policy Mock Data**: Deleted `static-policy.data.ts` and disconnected mock fallbacks.
- **Skeleton Loaders**: Added animated pulse skeletons for Balance Summary, Policy Card Carousel (`aspect-[2.13]`), Health Benefits grid, Wallet Hero & Stat tiles, and Policy Details summary to eliminate layout shifts (CLS).
- **Error UI & Retry Capabilities**: Added retryable error state views across Dashboard, Wallet, and Policy Details screens.
- **Empty States**: Added informative empty views when no policy is assigned or no categories are configured.
- **Members Covered Display**: Corrected mapping to display all covered relationship types from `opd_policy_version` (without artificial slicing) and allowed natural text wrapping.

## Capabilities

### New Capabilities
- `live-policy-integration`: Integrates live policy assignment, policy versioning, dynamic member filtering, loading skeletons, error resilience, and empty state views across dashboard, wallet, and policy detail screens.

### Modified Capabilities
- None

## Impact

- `projects/member/src/app/core/member/policy.dto.ts` (new DTOs)
- `projects/member/src/app/core/member/policy.mapper.ts` (new mappers)
- `projects/member/src/app/core/member/wallet-pool.model.ts` (new models)
- `projects/member/src/app/core/member/policy.store.ts` (live API integration & state)
- `projects/member/src/app/core/family/family.store.ts` (dynamic patient extraction & policy card generation)
- `projects/member/src/app/core/member/static-policy.data.ts` (deleted)
- `projects/member/src/app/features/home/home-page.ts` (skeletons, error, empty state)
- `projects/member/src/app/features/wallet/wallet-page.ts` (skeletons, error, empty state)
- `projects/member/src/app/features/policy/policy-details-page.ts` (skeletons, empty state, full members covered)
