import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { VisionStore } from '../../core/vision/vision.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * The vision cart — built from what the partner reported, never from the member.
 *
 * The coupon is a reference id: Lenskart prices the basket and sends back the
 * order and its value, and only then is there anything to apply the copay and
 * the per-service cap to. So this screen has two states and no input:
 *
 *   waiting  — the coupon is live, nothing reported yet. Says so plainly and
 *              does not pretend a figure will appear on its own.
 *   settled  — the report arrived, the split is decided, and the money has
 *              already moved. This shows what happened; it does not ask.
 *
 * There is deliberately no way to enter an amount here. The order value decides
 * the copay and how much benefit is consumed, so it is not the member's to
 * assert about their own order — operations record it, and an integration will
 * replace them.
 */
@Component({
  selector: 'opd-vision-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/vision/order"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to your vision order"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Your vision cart
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ orderId() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (order.isLoading()) {
          <opd-loading label="Loading your cart" />
        } @else if (order.value(); as current) {
          @if (current.cart; as cart) {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="text-lg font-bold text-[#0B2C63]">{{ current.partnerName }}</h2>
                  @if (cart.partnerOrderId) {
                    <p class="mt-0.5 text-sm text-ink-700">Their order {{ cart.partnerOrderId }}</p>
                  }
                </div>
                <span
                  class="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#034DA2]"
                  >{{ current.statusLabel }}</span
                >
              </div>

              <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">What you ordered came to</dt>
                  <dd class="font-medium text-ink-900">{{ money(cart.orderValue) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid from your cover</dt>
                  <dd class="font-semibold text-success-700">{{ money(cart.walletPaid) }}</dd>
                </div>
                @if (cart.copay.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Your co-payment</dt>
                    <dd class="font-medium text-ink-900">{{ money(cart.copay) }}</dd>
                  </div>
                }
                @if (cart.overLimit.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Above your plan's limit</dt>
                    <dd class="font-medium text-ink-900">{{ money(cart.overLimit) }}</dd>
                  </div>
                }
                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="font-semibold text-ink-900">You pay {{ current.partnerName }}</dt>
                  <dd class="text-lg font-bold text-ink-900">{{ money(cart.memberPays) }}</dd>
                </div>
              </dl>

              <!--
                Only the copay is payable here. The rest of what the member owes
                goes to the partner at their till, so offering to collect it
                would bill them twice for one pair of glasses.
              -->
              @if (cart.paymentId; as paymentId) {
                <div class="mt-5 rounded-xl border border-[#EDF0F7] bg-blue-50 p-4">
                  <p class="text-sm font-medium text-ink-900">
                    {{ money(cart.payableHere) }} co-payment to settle
                  </p>
                  <p class="mt-1 text-sm text-ink-700">
                    The rest goes to {{ current.partnerName }} directly, not through this app.
                  </p>
                  <a
                    [routerLink]="['/member/payments', paymentId]"
                    class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white hover:bg-[#034DA2]"
                    >Pay my co-payment</a
                  >
                </div>
              }

              <p class="mt-4 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                Settled on {{ date(cart.reportedAt) }}. Anything your cover did not use has already
                gone back to your vision benefit.
              </p>
            </section>
          } @else {
            <!--
              Coupon live, nothing reported. Not an error and not a loading
              state: it is the normal condition for as long as the member has
              not bought anything, and it can last indefinitely because no
              partner callback exists to end it.
            -->
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
                Nothing to show yet
              </h2>
              <p class="mt-1 text-sm text-ink-700">
                Your cart appears here once {{ current.partnerName }} tells us what you ordered. We
                work out your co-payment from their figures — you are never asked to enter an
                amount.
              </p>
              <p class="mt-2 text-sm text-ink-500">
                {{ money(current.eligible) }} of your cover is held against the coupon until then.
              </p>
              <a
                routerLink="/member/vision/order"
                class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                >Back to your coupon</a
              >
            </section>
          }
        } @else {
          <opd-empty title="Order not found" detail="We could not find that vision order." />
        }
      </div>
    </div>
  `,
})
export class VisionCartPage {
  readonly orderId = input<string>('');

  private readonly store = inject(VisionStore);
  protected readonly money = formatMoney;

  protected readonly order = resource({
    params: () => ({ id: this.orderId() }),
    loader: ({ params }) => this.store.orderById(params.id),
  });

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'a date we did not record';
  }
}
