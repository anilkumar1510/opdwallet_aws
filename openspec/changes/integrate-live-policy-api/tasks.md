# Tasks

## 1. DTOs and Data Mapping

- [x] 1.1 Create `policy.dto.ts` defining `OpdPolicyMemberAssignmentDto` and `OpdPolicyVersionDto` and verify TypeScript compilation
- [x] 1.2 Create `wallet-pool.model.ts` defining wallet pool and pool category structures
- [x] 1.3 Create `policy.mapper.ts` with converters for policy card, detail, wallet total, benefit categories, and covered relationships
- [x] 1.4 Delete `static-policy.data.ts` and remove static mock policy fallbacks

## 2. Store Integration

- [x] 2.1 Update `PolicyStore` to query `opd_policy_member_assignment` and `opd_policy_version` via `AppService.getcall`
- [x] 2.2 Add `retry()` and error signal handling to `PolicyStore`
- [x] 2.3 Update `FamilyStore` to dynamically resolve `user_id` from `user_relationship_mapping` and pass to `PolicyStore.load(userId)`
- [x] 2.4 Compute `FamilyStore.allPolicies` and `policies` by filtering members with `isRelationshipCoveredInPolicy()`
- [x] 2.5 Add `retry()` and `error` signal to `FamilyStore`

## 3. UI States: Skeletons, Errors, and Empty Views

- [x] 3.1 Implement skeleton loaders for dashboard balance summary, policy card (`aspect-[2.13]`), and health benefits grid in `home-page.ts`
- [x] 3.2 Implement retryable error UI and "No Policy Assigned" empty state on the dashboard
- [x] 3.3 Implement hero balance and stat tile skeleton loaders in `wallet-page.ts`
- [x] 3.4 Implement error view and "No active wallet" empty view in `wallet-page.ts`
- [x] 3.5 Implement skeleton loader and "No policy details found" empty view in `policy-details-page.ts`
- [x] 3.6 Display all covered member relationships in `policy-details-page.ts` with `break-words` text wrapping

## 4. Verification

- [x] 4.1 Run `npx tsc --noEmit -p projects/member/tsconfig.app.json` and verify 0 type errors
- [x] 4.2 Run domain checks (`codes.check.ts` and `family-mapper.check.ts`) and verify all assertions pass
- [x] 4.3 Validate OpenSpec change artifacts with `openspec validate integrate-live-policy-api`
