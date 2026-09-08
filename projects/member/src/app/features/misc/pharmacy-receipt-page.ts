import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney, money } from '../../core/domain/money';
import type { OrderItem } from '../../core/pharmacy/pharmacy';
import { PharmacyStore } from '../../core/pharmacy/pharmacy.store';
import { LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Flow 5 step 12 — the receipt, issued straight after payment.
 *
 * A real one, not a stand-in: everything a receipt carries is already on the
 * order — what was paid, how it split between the cover and the member, which
 * medicines, and the payment reference. Nothing had to be invented, so nothing
 * here is tagged.
 *
 * It is deliberately NOT the invoice. The sheet says so twice, and they are
 * raised at different moments for different reasons: this confirms a payment
 * the moment it clears, while the invoice follows delivery (step 14) and is the
 * tax document. Showing one in place of the other would be wrong in a way a
 * member only discovers at the point they need it.
 */
@Component({
  selector: 'opd-pharmacy-receipt-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member/pharmacy/orders', orderId()]"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to your order"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Payment receipt
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ orderId() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.order(); as detail) {
          <!--
            A receipt for a payment that has not happened would be a document
            claiming something untrue, so the screen says where the money
            actually is rather than rendering one anyway.
          -->
          @if (!detail.walletWasDebited) {
            <p class="mb-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
              Nothing has been paid on this order yet. Your receipt appears here the moment it is.
            </p>
          } @else if (detail.paymentStatus !== 'COMPLETED' && detail.totalMemberPayment.amount > 0) {
            <p class="mb-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
              Your cover has been used. Your own share of
              {{ money(detail.totalMemberPayment) }} is still clearing.
            </p>
          }

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <p class="text-3xl font-bold text-[#0B2C63]">{{ money(detail.totalMemberPayment) }}</p>
            <p class="mt-0.5 text-sm text-ink-700">Paid by you</p>

            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Patient</dt>
                <dd class="font-medium text-ink-900">{{ detail.patientName }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Order</dt>
                <dd class="font-medium text-ink-900">{{ detail.id }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Date</dt>
                <dd class="font-medium text-ink-900">{{ today }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Payment</dt>
                <dd class="font-medium text-ink-900">{{ detail.paymentId ?? 'Wallet only' }}</dd>
              </div>

              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="text-ink-700">Medicines</dt>
                <dd class="font-medium text-ink-900">{{ money(detail.billAmount) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Paid from your cover</dt>
                <dd class="font-medium text-success-700">{{ money(detail.walletDebitAmount) }}</dd>
              </div>
              @if (detail.copayAmount.amount > 0) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Co-payment</dt>
                  <dd class="font-medium text-ink-900">{{ money(detail.copayAmount) }}</dd>
                </div>
              }
              @if (detail.excessAmount.amount > 0) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Above your plan's limit</dt>
                  <dd class="font-medium text-ink-900">{{ money(detail.excessAmount) }}</dd>
                </div>
              }
            </dl>

            @if (detail.retainedItems.length) {
              <ul class="mt-4 space-y-1 border-t border-surface-border pt-4">
                @for (item of detail.retainedItems; track item.medicineId) {
                  <li class="flex justify-between gap-3 text-sm">
                    <span class="text-ink-700"
                      >{{ item.name }} &times;{{ item.requestedQuantity }}</span
                    >
                    <span class="font-medium text-ink-900">{{ line(item) }}</span>
                  </li>
                }
              </ul>
            }

            <p class="mt-4 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
              This confirms your payment. It is not the tax invoice — that is raised once your
              medicines are delivered.
            </p>
          </section>

          <a
            [routerLink]="['/member/pharmacy/orders', orderId()]"
            class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
            >Back to your order</a
          >
        } @else {
          <opd-loading label="Loading your receipt" />
        }
      </div>
    </div>
  `,
})
export class PharmacyReceiptPage {
  readonly orderId = input<string>('');

  protected readonly store = inject(PharmacyStore);
  protected readonly money = formatMoney;
  protected readonly today = DATE.format(new Date());

  /** The line is the unit price times the quantity — the order stores only the unit price. */
  protected line(item: OrderItem): string {
    return formatMoney(money(item.price.amount * item.requestedQuantity));
  }

  constructor() {
    effect(() => {
      const id = this.orderId();
      if (id) void this.store.loadOrder(id);
    });
  }
}
