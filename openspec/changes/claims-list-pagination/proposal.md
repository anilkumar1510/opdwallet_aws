# Proposal

## Why

In `opd-claims-page`, claims were previously displayed using a crude "Load more" button that accumulated 5 claims at a time via `visibleCount`. This created inconsistent UX across the portal and required multiple clicks to browse claims.

Following the design system's standardized pagination pattern (`opd-wallet-pagination`), `opd-claims-page` adopts the shared pagination component to provide predictable 10-claims-per-page navigation matching the wallet transaction page, with Previous/Next controls and a clear `Page X of Y` indicator.

## What Changes

- **Adopt Shared Pagination Component**: Integrate `opd-wallet-pagination` into `ClaimsPage` (`projects/member/src/app/features/claims/claims-page.ts`).
- **Standardized Server-Side Page Size**: Display 10 claims per page on initial rendering (`page_no = 0`, `page_size = 10`), matching the wallet transactions page.
- **On-Demand Page Navigation**: Call `goToClaimsPage(pageNo, pageSize)` to load the next page via `getClimListData` instead of client-only slicing.
- **Authoritative Total Claims Count**: Compute total claims using API count or `dashboardSummary()?.total` so multi-page navigation is accurately calculated.
- **Previous / Next Controls**: Enable easy navigation with `← Previous`, `Page X of Y`, and `Next →` buttons.
- **Auto-Scroll on Page Change**: Automatically scroll back to the top of the claims list when the user flips pages.
- **Prevent Empty Flashing**: Display pulse skeleton loading states during in-flight initial retrieval.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `claims-listing-pagination`: Standardizes claims list pagination to 10 claims per page using the shared `opd-wallet-pagination` component and server-side page retrieval.

## Impact

- `projects/member/src/app/features/claims/claims-page.ts`: Replaces legacy "Load more" button with `opd-wallet-pagination`.
- `projects/member/src/app/core/claims/claims.store.ts`: Adjusts `getClimListData` parameterization for larger retrieval window.
