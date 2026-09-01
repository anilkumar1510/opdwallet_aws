import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { PharmacyStore } from '../../core/pharmacy/pharmacy.store';
import { LoadingView } from '../../shared/ui/state-views';

/**
 * Steps 5-9: the adjudicated cart (what was retained, what was removed and
 * why), the payment breakdown, pay, and the receipt once paid.
 */
@Component({
  selector: 'opd-pharmacy-order-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: 'pharmacy' }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Pharmacy Order</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ orderId() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (!store.order()) {
          <opd-loading label="Loading order" />
        } @else {
          @let order = store.order()!;

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2]">Your order</h2>
            <ul class="space-y-2">
              @for (item of order.retainedItems; track item.medicineId) {
                <li class="flex items-center justify-between text-sm">
                  <span class="text-ink-900">{{ item.name }} x{{ item.requestedQuantity }}</span>
                  <span class="font-medium text-ink-900">{{ money(item.price) }}</span>
                </li>
              }
            </ul>

            @if (order.deliveryAddressLines.length) {
              <div class="mt-3 rounded-xl bg-surface-50 p-3">
                <p class="text-xs font-semibold text-ink-700">Delivering to</p>
                <p class="mt-1 text-xs text-ink-600">{{ order.deliveryAddressLines.join(', ') }}</p>
              </div>
            }

            @if (order.removedItems.length) {
              <div class="mt-3 rounded-xl bg-warning-50 p-3">
                <p class="text-xs font-semibold text-warning-700">Removed during review</p>
                @for (item of order.removedItems; track item.medicineId) {
                  <p class="mt-1 text-xs text-warning-700">{{ item.name }} — {{ item.removedReason }}</p>
                }
              </div>
            }

            <div class="mt-4 space-y-2 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between">
                <span class="text-ink-700">Bill amount</span>
                <span class="font-medium text-ink-900">{{ money(order.billAmount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-ink-700">Paid from wallet</span>
                <span class="font-medium text-success-700">{{ money(order.walletDebitAmount) }}</span>
              </div>
              @if (order.copayAmount.amount > 0) {
                <div class="flex justify-between">
                  <span class="text-ink-700">Copay</span>
                  <span class="font-medium text-ink-900">{{ money(order.copayAmount) }}</span>
                </div>
              }
              @if (order.excessAmount.amount > 0) {
                <div class="flex justify-between">
                  <span class="text-ink-700">Above wallet balance</span>
                  <span class="font-medium text-ink-900">{{ money(order.excessAmount) }}</span>
                </div>
              }
              <div class="flex justify-between border-t border-surface-border pt-2">
                <span class="font-semibold text-ink-900">You pay</span>
                <span class="text-lg font-bold text-[#0B2C63]">{{ money(order.totalMemberPayment) }}</span>
              </div>
            </div>
          </section>

          @if (store.orderError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ error }}</p>
          }

          @if (order.status === 'ADJUDICATED') {
            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
              [disabled]="store.paying()"
              (click)="pay()"
            >
              {{ store.paying() ? 'Processing…' : 'Pay and confirm order' }}
            </button>
          } @else if (order.status === 'CONFIRMED' || order.status === 'DELIVERED') {
            <section class="mt-5 rounded-2xl border border-success-200 bg-success-50 p-5 text-center">
              <p class="font-semibold text-success-700">
                {{ order.status === 'DELIVERED' ? 'Delivered' : 'Order confirmed' }}
              </p>
              <p class="mt-1 text-sm text-success-700">
                {{
                  order.status === 'DELIVERED'
                    ? 'Your medicines have been delivered. The invoice is in your health records.'
                    : 'Sent to the pharmacy for processing and delivery.'
                }}
              </p>
            </section>
          } @else if (order.status === 'CANCELLED') {
            <section class="mt-5 rounded-2xl border border-surface-border bg-surface-50 p-5 text-center">
              <p class="font-semibold text-ink-700">Order cancelled</p>
              <p class="mt-1 text-sm text-ink-500">
                {{ order.walletWasDebited ? 'Any amount paid from your wallet has been refunded.' : 'No payment was taken for this order.' }}
              </p>
            </section>
          }

          @if (order.status === 'ADJUDICATED' || order.status === 'CONFIRMED') {
            <button
              type="button"
              class="mt-3 min-h-touch w-full rounded-xl border border-danger-200 px-6 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-50 disabled:opacity-50"
              [disabled]="cancelling()"
              (click)="cancel()"
            >
              {{ cancelling() ? 'Cancelling…' : 'Cancel order' }}
            </button>
          }
        }
      </div>
    </div>
  `,
})
export class PharmacyOrderPage {
  readonly orderId = input<string>('');

  protected readonly store = inject(PharmacyStore);
  protected readonly money = formatMoney;
  protected readonly cancelling = signal(false);

  constructor() {
    effect(() => {
      const id = this.orderId();
      if (id) void this.store.loadOrder(id);
    });
  }

  protected async pay(): Promise<void> {
    await this.store.pay(this.orderId());
  }

  protected async cancel(): Promise<void> {
    this.cancelling.set(true);
    try {
      await this.store.cancel(this.orderId());
    } finally {
      this.cancelling.set(false);
    }
  }
}
