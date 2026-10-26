import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Common pagination component rendering Previous/Next navigation and page count.
 *
 * Pattern:
 *   <nav aria-label="..." class="mt-3 flex items-center justify-between gap-3">
 *     <button class="... disabled:opacity-40"> ← Previous </button>
 *     <p class="text-sm text-ink-500">Page X of Y</p>
 *     <button class="... disabled:opacity-40"> Next → </button>
 *   </nav>
 */
@Component({
  selector: 'opd-wallet-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="ariaLabel()" class="mt-3 flex items-center justify-between gap-3">
      <button
        type="button"
        class="min-h-touch rounded-xl border border-surface-border bg-white px-4 text-sm font-medium text-brand-700 disabled:opacity-40"
        [disabled]="!hasPrev() || loading()"
        (click)="onPrev()"
      >
        ← Previous
      </button>

      <p class="text-sm text-ink-500">
        @if (totalPages() > 0) {
          Page {{ page() + 1 }} of {{ totalPages() }}
        } @else {
          Page {{ page() + 1 }}
        }
      </p>

      <button
        type="button"
        class="min-h-touch rounded-xl border border-surface-border bg-white px-4 text-sm font-medium text-brand-700 disabled:opacity-40"
        [disabled]="!hasNext() || loading()"
        (click)="onNext()"
      >
        Next →
      </button>
    </nav>
  `,
})
export class WalletPagination {
  /** 0-indexed current page (default: 0). */
  readonly page = input<number>(0);

  /** Number of items per page (default: 10). */
  readonly pageSize = input<number>(10);

  /** Total number of records available. If provided, totalPages is computed. */
  readonly total = input<number | null>(null);

  /** Fallback indicator if total is unknown: whether subsequent records exist. */
  readonly hasMore = input<boolean>(false);

  /** Whether a page request is currently in-flight. Disables both buttons. */
  readonly loading = input<boolean>(false);

  /** Accessible label for the navigation element. */
  readonly ariaLabel = input<string>('Past orders pages');

  /** Emitted when previous page is requested. */
  readonly prev = output<void>();

  /** Emitted when next page is requested. */
  readonly next = output<void>();

  /** Emitted with the target 0-indexed page number when either button is clicked. */
  readonly pageChange = output<number>();

  /** Total number of pages (at least 1 when total is known). */
  readonly totalPages = computed(() => {
    const t = this.total();
    if (typeof t === 'number' && t >= 0) {
      return Math.max(1, Math.ceil(t / Math.max(1, this.pageSize())));
    }
    return 0;
  });

  readonly hasPrev = computed(() => this.page() > 0);

  readonly hasNext = computed(() => {
    const tp = this.totalPages();
    if (tp > 0) {
      return this.page() + 1 < tp;
    }
    return this.hasMore();
  });

  protected onPrev(): void {
    if (this.hasPrev() && !this.loading()) {
      const target = Math.max(0, this.page() - 1);
      this.prev.emit();
      this.pageChange.emit(target);
    }
  }

  protected onNext(): void {
    if (this.hasNext() && !this.loading()) {
      const target = this.page() + 1;
      this.next.emit();
      this.pageChange.emit(target);
    }
  }
}

export { WalletPagination as OpdWalletPagination };
