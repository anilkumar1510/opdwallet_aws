# Design

## Context

In `ClaimsPage` (`projects/member/src/app/features/claims/claims-page.ts`), reimbursement claims are loaded via `ClaimsStore.getClimListData(pageNo, pageSize)`. Following the pattern implemented in the wallet passbook (`WalletPage` / `PolicyStore`), claims pagination now uses server-side pagination with initial 10 records and on-demand page fetching via `goToClaimsPage(pageNo, pageSize)`.

The UI uses the shared `opd-wallet-pagination` component (`projects/member/src/app/shared/ui/wallet-pagination.ts`), which renders:
```html
<nav aria-label="Claims pages" class="mt-3 flex items-center justify-between gap-3">
  <button type="button" class="... disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-50/50" [disabled]="!hasPrev() || loading()">
    ← Previous
  </button>
  <p class="text-sm font-medium text-ink-500">Page {{ page() + 1 }} of {{ totalPages() }}</p>
  <button type="button" class="... disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-50/50" [disabled]="!hasNext() || loading()">
    Next →
  </button>
</nav>
```

## Technical Architecture

### 1. Store State & Server-Side Pagination
In `ClaimsStore` (`projects/member/src/app/core/claims/claims.store.ts`):
- `_claimsPage = signal<number>(0)`: Current 0-indexed page number.
- `_claimsTotalCount = signal<number | null>(null)`: Total claims count from API `count`, `total`, or dashboard aggregate.
- `_claimsHasMore = signal<boolean>(true)`: Whether subsequent pages exist.
- `totalClaimsCount = computed(() => ...)`: Resolves total from API count or dashboard summary.
- `getClimListData(pageNo = 0, pageSize = 10)`: Issues `queryId=GET_CLAIMS_BY_USER&page_no=${pageNo}&page_size=${pageSize}`, maps categories/statuses, and updates page/total signals.
- `goToClaimsPage(pageNo, pageSize = 10)`: Boundary-guarded page navigation triggering `getClimListData`.

### 2. Initial Rendering & Smooth Navigation UX
In `ClaimsPage` (`projects/member/src/app/features/claims/claims-page.ts`):
```typescript
export class ClaimsPage implements OnInit {
  protected readonly store = inject(ClaimsStore);
  protected readonly pageSize = 10;

  ngOnInit(): void {
    void this.store.loadDashboard();
    void this.store.getClimListData(0, this.pageSize);
  }

  protected onPageChange(targetPage: number): void {
    this.store.goToClaimsPage(targetPage, this.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
```
When moving between pages, the viewport smoothly scrolls to the top of the claims section so the user is immediately focused on the top claim.

### 3. Template Integration & UX States
```html
@if (store.getClimListDataLoading() && (!store.clailListData() || !store.clailListData().length)) {
  <!-- Pulse skeletons during initial load to prevent empty-state flashes -->
} @else if (store.clailListData() && store.clailListData().length) {
  <!-- Render current 10 claims -->
  <opd-wallet-pagination
    [page]="store.claimsPage()"
    [pageSize]="pageSize"
    [total]="store.totalClaimsCount()"
    [hasMore]="store.claimsHasMore()"
    [loading]="store.getClimListDataLoading()"
    ariaLabel="Claims pages"
    (pageChange)="onPageChange($event)"
  />
} @else {
  <opd-empty title="No claims yet" ... />
}
```
