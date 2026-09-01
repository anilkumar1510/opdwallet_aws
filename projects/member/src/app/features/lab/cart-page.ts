import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../../core/lab/cart.store';
import { LabKind } from '../../core/lab/lab.model';
import { formatMoney } from '../../core/domain/money';
import { ErrorView, LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Screen 2: the cart the lab built from your prescription. */
@Component({
  selector: 'opd-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/lab-tests"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to lab tests"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Your Cart</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Review tests and select lab</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (store.loading()) {
          <opd-loading label="Loading your cart" />
        } @else if (store.error(); as error) {
          <!-- retry() defaults to LAB, so a diagnostics cart must pass its own
               kind or the refetch goes to member/lab/carts/… and 404s — the same
               prefix error parity entry 14 records in the reference. -->
          <opd-error [error]="error" (retry)="store.retry(kind())" />
        } @else if (store.cart(); as cart) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-[#0B2C63]">{{ cart.patientName }}</h2>
                <p class="mt-0.5 text-xs text-ink-500">
                  {{ cart.id }} · {{ date(cart.createdAt) }}
                  @if (cart.pincode) {
                    · pincode {{ cart.pincode }}
                  }
                </p>
              </div>
              <span class="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#034DA2]">{{
                cart.status
              }}</span>
            </div>

            <ul class="mt-4 divide-y divide-surface-border border-t border-surface-border">
              @for (item of cart.items; track item.id) {
                <li class="flex items-center gap-3 py-3">
                  <span class="text-[#034DA2]" aria-hidden="true">&#10003;</span>
                  <span class="min-w-0 flex-1 truncate text-ink-900">{{ item.name }}</span>
                  @if (item.code) {
                    <span class="shrink-0 text-xs text-ink-500">{{ item.code }}</span>
                  }
                </li>
              }
            </ul>

            <p class="mt-3 text-sm text-ink-700">
              {{ cart.items.length }} test{{ cart.items.length === 1 ? '' : 's' }} in this cart
            </p>
          </section>

          <!-- Select a lab -->
          @if (store.vendors().length) {
            <h2 class="mb-3 mt-6 text-base font-semibold text-[#0E51A2] lg:text-lg">
              Select a lab
            </h2>
            <ul class="space-y-4">
              @for (vendor of store.vendors(); track vendor.id) {
                <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h3 class="truncate text-lg font-bold text-[#0B2C63]">{{ vendor.name }}</h3>
                      <p class="mt-0.5 text-xs text-ink-500">
                        {{ vendor.offersHomeCollection ? 'Home collection' : '' }}
                        {{ vendor.offersHomeCollection && vendor.offersCenterVisit ? '·' : '' }}
                        {{ vendor.offersCenterVisit ? 'Centre visit' : '' }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-2xl font-bold text-[#0B2C63]">
                        {{ money(vendor.payableTotal) }}
                      </p>
                      @if (vendor.saving.amount > 0) {
                        <p class="text-xs text-success-700">You save {{ money(vendor.saving) }}</p>
                      }
                    </div>
                  </div>

                  <ul class="mt-4 divide-y divide-surface-border border-t border-surface-border">
                    @for (price of vendor.prices; track price.serviceId) {
                      <li class="flex items-center justify-between gap-3 py-2 text-sm">
                        <span class="min-w-0 truncate text-ink-700">{{ price.name }}</span>
                        <span class="shrink-0">
                          @if (price.listPrice.amount > price.payablePrice.amount) {
                            <span class="mr-1 text-xs text-ink-500 line-through">{{
                              money(price.listPrice)
                            }}</span>
                          }
                          <span class="font-medium text-ink-900">{{
                            money(price.payablePrice)
                          }}</span>
                        </span>
                      </li>
                    }
                  </ul>

                  <a
                    [routerLink]="['/member', basePath(), 'cart', cart.id, 'vendor', vendor.vendorId]"
                    class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2]"
                  >
                    Select this lab
                  </a>
                </li>
              }
            </ul>
          } @else if (store.vendorsFailed()) {
            <!-- Distinct from the empty state below, and deliberately so: the
                 request failed, so no lab was asked. Saying "no lab has quoted"
                 here names a cause that did not happen and stops the member
                 retrying. The cart itself stays on screen either way. -->
            <section
              class="mt-5 rounded-2xl border border-danger-200 bg-white p-6 text-center shadow-sm"
              role="alert"
            >
              <p class="font-medium text-ink-900">We could not load this</p>
              <p class="mt-1 text-sm text-ink-500">
                The labs for this cart did not load. Your cart is unchanged.
              </p>
              <button
                type="button"
                class="mt-4 min-h-touch rounded-xl border border-[#034DA2] px-5 text-sm font-semibold text-[#034DA2]"
                (click)="store.retry(kind())"
              >
                Try again
              </button>
            </section>
          } @else {
            <section
              class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-6 text-center shadow-sm"
            >
              <p class="font-medium text-ink-900">No lab partners available yet</p>
              <p class="mt-1 text-sm text-ink-500">
                No lab in your area has quoted for these tests. Try again shortly.
              </p>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class CartPage {
  /** Business cart id from the route (CART-…). */
  readonly cartId = input<string>('');
  /** 'LAB' or 'DIAGNOSTIC', from route data. */
  readonly kind = input<LabKind>(LabKind.Lab);

  protected readonly store = inject(CartStore);
  protected readonly money = formatMoney;

  protected readonly basePath = computed(() =>
    this.kind() === LabKind.Lab ? 'lab-tests' : 'diagnostics',
  );

  constructor() {
    effect(() => this.store.select(this.cartId(), this.kind()));
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : '';
  }
}
