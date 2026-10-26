# Tasks

## 1. Specification & Design
- [x] 1.1 Document proposal and design in OpenSpec change `claims-list-pagination`.
- [x] 1.2 Define spec delta requirements and scenarios for claims list pagination.

## 2. Implementation
- [x] 2.1 Update `ClaimsStore.getClimListData` with `pageNo` and `pageSize = 10` retrieval, total count tracking, and `goToClaimsPage` navigation.
- [x] 2.2 Import `WalletPagination` in `ClaimsPage` (`opd-claims-page`).
- [x] 2.3 Implement `ngOnInit` initial rendering fetching first 10 claims (`page = 0`, `pageSize = 10`).
- [x] 2.4 Replace legacy "Load more" button with `<opd-wallet-pagination>` driven by store signals.
- [x] 2.5 Implement `onPageChange` with `store.goToClaimsPage` and smooth top-of-list scroll.
- [x] 2.6 Enhance user experience with skeleton pulse loading state and accessible button hover/disabled styles.

## 3. Verification
- [x] 3.1 Validate OpenSpec change with `npx openspec validate claims-list-pagination`.
- [x] 3.2 Run TypeScript compilation check with `npx tsc --noEmit -p projects/member/tsconfig.app.json`.
