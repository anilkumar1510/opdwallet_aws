import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { PharmacyStore } from '../../core/pharmacy/pharmacy.store';
import { LoadingView, ErrorView } from '../../shared/ui/state-views';
import { CartItem } from '../../core/pharmacy/pharmacy';
import { PharmacyCartComponent } from './pharmacy-cart.component';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Past order cart view — displays the adjudicated cart for a past order.
 * Fetches cart data using the order's booking_name (from route param) and patient_id (from query param).
 */
@Component({
  selector: 'opd-pharmacy-past-order-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, PharmacyCartComponent],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member/pharmacy']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to order"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Order Cart</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Adjudicated medicines for {{ bookingName() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <p class="mb-4 rounded-xl bg-[#F0FDF4] px-3 py-2 text-sm text-success-700">🔔 Your cart is ready.</p>
        <p class="mb-3 text-xs text-ink-500">You can remove an item or reduce a quantity — you can't add or increase, since the cart is adjudicated against your prescription.</p>
        <opd-pharmacy-cart
          [cartItems]="cartItems()"
          [cartLoading]="cartLoading()"
          [cartError]="cartError()"
          [editable]="true"
          [emptyMessage]="'The adjudicated cart for this order could not be loaded or is empty.'"
          [retryLabel]="'Retry'"
          (retryClicked)="loadCart(bookingName(), queryPatientId())"
          (decrementClicked)="onDecrement($event)"
          (removeClicked)="onRemove($event)"
        />
        @if (cartItems().length > 0) {
          <div class="mt-3 space-y-1 border-t border-surface-border pt-3 text-sm">
            <div class="flex justify-between"><span class="text-ink-700">Cart value</span><span class="font-medium text-ink-900">₹{{ cartTotal() }}</span></div>
          </div>

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Order Details</h2>
            <p class="mb-1 text-sm text-ink-700"><span class="font-medium">Order ID:</span> {{ bookingName() }}</p>
            <p class="mb-1 text-sm text-ink-700"><span class="font-medium">Booking:</span> {{ bookingName() }}</p>
            @if (queryPatientId()) {
              <p class="mb-1 text-sm text-ink-700"><span class="font-medium">Patient ID:</span> {{ queryPatientId() }}</p>
            }
            <p class="text-sm text-ink-700"><span class="font-medium">Status:</span> {{ cartStatus() }}</p>
          </section>
        } @else {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6 text-center">
            <p class="font-medium text-ink-900">No cart items found</p>
            <p class="mt-1 text-sm text-ink-500">The adjudicated cart for this order could not be loaded or is empty.</p>
          </section>
        }

        <a
          [routerLink]="['/member/pharmacy']"
          class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border bg-white px-5 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
        >
          &larr; Back to order
        </a>
      </div>
    </div>
  `,
})
export class PharmacyPastOrderCartPage {
  readonly bookingName = input<string>('');

  private readonly store = inject(PharmacyStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly money = formatMoney;

  // Read patientId from query params
  protected readonly queryPatientId = computed(() => this.route.snapshot.queryParamMap.get('patientId') || '');

  protected readonly cartLoading = signal(false);
  protected readonly cartError = signal<string | null>(null);
  protected readonly cartItems = signal<readonly CartItem[]>([]);

  protected readonly cartStatus = computed(() => 'ADJUDICATED');

  protected readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  );

  constructor() {
    effect(() => {
      const id = this.bookingName();
      const patientId = this.queryPatientId();
      if (id) {
        void this.loadCart(id, patientId);
      }
    });
  }

  protected async loadCart(bookingName: string, patientId: string): Promise<void> {
    this.cartLoading.set(true);
    this.cartError.set(null);
    try {
      const items = await this.store.fetchCart(bookingName, patientId);
      this.cartItems.set(items);
    } catch (error: unknown) {
      this.cartError.set(
        error instanceof Error ? error.message : 'We could not load the cart. Please try again.'
      );
    } finally {
      this.cartLoading.set(false);
    }
  }

  protected onDecrement(itemId: string): void {
    this.cartItems.update(items =>
      items
        .map(item => (item.id === itemId ? { ...item, qty: Math.max(0, item.qty - 1) } : item))
        .filter(item => item.qty > 0)
    );
  }

  protected onRemove(itemId: string): void {
    this.cartItems.update(items => items.filter(item => item.id !== itemId));
  }
}