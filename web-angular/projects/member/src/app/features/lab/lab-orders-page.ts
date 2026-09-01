import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { LabKind } from '../../core/lab/lab.model';
import { LabStore } from '../../core/lab/lab.store';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Screen 5: every order placed under this benefit. */
@Component({
  selector: 'opd-lab-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView, StatusBadge],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath()]"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">{{ title() }}</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Track your samples and reports</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (store.loading()) {
          <opd-loading label="Loading orders" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else {
          <!-- The orders fetch degrades into partial() rather than error(), so
               without this the member sees "Awaiting the lab" — true of their
               prescription, silent about the list that failed. Same disclosure
               the hub already renders. -->
          @if (store.partial().length) {
            <p
              class="mb-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700"
              role="status"
            >
              Could not load {{ store.partial().join(' and ') }}. Everything else is shown below.
            </p>
          }

          @if (store.orders().length) {
            <ul class="space-y-3">
            @for (order of store.orders(); track order.id) {
              <li>
                <a
                  [routerLink]="['/member', basePath(), 'orders', order.reference]"
                  class="block rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm transition-colors hover:border-[#A4BFFE7A]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-base font-semibold text-[#034DA2]">
                        {{ order.vendorName }}
                      </p>
                      <p class="mt-0.5 truncate text-xs text-ink-500">
                        {{ order.reference }} · {{ date(order.placedAt) }}
                      </p>
                      <p class="mt-1 truncate text-sm text-ink-700">
                        {{ testSummary(order.tests) }}
                      </p>
                      @if (order.reportCount) {
                        <p class="mt-1 text-xs font-medium text-success-700">
                          {{ order.reportCount }} report{{ order.reportCount === 1 ? '' : 's' }}
                          available
                        </p>
                      }
                    </div>
                    <div class="shrink-0 text-right">
                      <opd-status-badge [status]="order.status" />
                      <p class="mt-2 text-base font-semibold text-[#303030]">
                        {{ money(order.total) }}
                      </p>
                    </div>
                  </div>
                </a>
              </li>
            }
            </ul>
          } @else if (store.actionable().length) {
          <!-- No orders, but uploads are waiting on the lab. Saying so beats
               "No orders yet", which reads as though the upload was lost. -->
          <section>
            <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Awaiting the lab</h2>
            <ul class="space-y-3">
              @for (prescription of store.actionable(); track prescription.id) {
                <li class="rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-base font-semibold text-[#034DA2]">
                        {{ prescription.sourceLabel }} prescription
                      </p>
                      <p class="mt-0.5 truncate text-xs text-ink-500">
                        {{ prescription.reference }} · {{ date(prescription.uploadedAt) }}
                      </p>
                      <p class="mt-1 text-sm text-ink-700">
                        Our team is processing your prescription. You will be notified once it is
                        ready for ordering.
                      </p>
                    </div>
                    <opd-status-badge [status]="prescription.status" />
                  </div>
                </li>
              }
            </ul>
            </section>
          } @else {
            <opd-empty title="No orders yet" detail="Orders you place will appear here." />
          }
        }
      </div>
    </div>
  `,
})
export class LabOrdersPage {
  readonly kind = input<LabKind>(LabKind.Lab);

  protected readonly store = inject(LabStore);
  protected readonly money = formatMoney;

  constructor() {
    effect(() => this.store.select(this.kind()));
  }

  protected readonly basePath = computed(() =>
    this.kind() === LabKind.Lab ? 'lab-tests' : 'diagnostics',
  );
  protected readonly title = computed(() =>
    this.kind() === LabKind.Lab ? 'Lab Orders' : 'Diagnostic Orders',
  );

  protected testSummary(tests: readonly { name: string }[]): string {
    if (!tests.length) return 'Tests';
    const [first, ...rest] = tests;
    return rest.length ? `${first.name} + ${rest.length} more` : first.name;
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }
}
