import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { TransactionsStore } from '../../core/transactions/transactions.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** One payment record. */
@Component({
  selector: 'opd-payment-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView, StatusBadge],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/orders"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to transactions"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Payment</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ paymentId() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (payment.isLoading()) {
          <opd-loading label="Loading payment" />
        } @else if (payment.value(); as detail) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-3xl font-bold text-[#0B2C63]">{{ money(detail.amount) }}</p>
                <p class="mt-0.5 text-sm text-ink-700">{{ detail.typeLabel }}</p>
              </div>
              <opd-status-badge [status]="detail.status" />
            </div>

            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              @if (detail.description) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Description</dt>
                  <dd class="truncate pl-2 font-medium text-ink-900">{{ detail.description }}</dd>
                </div>
              }
              @if (detail.serviceReference) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Service reference</dt>
                  <dd class="font-medium text-ink-900">{{ detail.serviceReference }}</dd>
                </div>
              }
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Method</dt>
                <dd class="font-medium text-ink-900">{{ detail.methodLabel }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Date</dt>
                <dd class="font-medium text-ink-900">{{ date(detail.paidAt) }}</dd>
              </div>
            </dl>
          </section>

          @if (store.payError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }

          <!-- A settled payment has a final status; anything else is still due. -->
          @if (!detail.status.isFinal) {
            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
              [disabled]="store.paying()"
              (click)="pay(detail.reference)"
            >
              {{ store.paying() ? 'Completing…' : 'Mark as paid' }}
            </button>
          }
        } @else {
          <opd-empty title="Payment not found" detail="We could not find that payment." />
        }
      </div>
    </div>
  `,
})
export class PaymentDetailPage {
  readonly paymentId = input<string>('');

  protected readonly store = inject(TransactionsStore);
  protected readonly money = formatMoney;

  protected readonly payment = resource({
    params: () => this.paymentId(),
    loader: ({ params }) => (params ? this.store.paymentById(params) : Promise.resolve(null)),
  });

  /** Takes the business PAY-… reference, which is what the route expects. */
  protected async pay(reference: string): Promise<void> {
    if (await this.store.markPaid(reference)) this.payment.reload();
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }
}
