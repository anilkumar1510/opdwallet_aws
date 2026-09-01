import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { CartStore } from '../../core/lab/cart.store';
import { OrderValidation } from '../../core/domain/cover-check';
import { Slot } from '../../core/lab/cart';
import { LabKind } from '../../core/lab/lab.model';
import { FamilyStore } from '../../core/family/family.store';
import { ProfileStore } from '../../core/member/profile.store';
import { ErrorView, LoadingView } from '../../shared/ui/state-views';

const DAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

type CollectionType = 'HOME_COLLECTION' | 'CENTER_VISIT';

/** Screen 4: pick collection type, address and slot, then place the order. */
@Component({
  selector: 'opd-vendor-booking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath(), 'cart', cartId()]"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to cart"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Book Lab Tests</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ vendor()?.name ?? '' }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (store.loading()) {
          <opd-loading label="Loading" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else if (vendor(); as lab) {
          <!-- Collection Type -->
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg lg:mb-5">
              Collection Type
            </h2>
            <div class="grid gap-3 sm:grid-cols-2">
              @if (lab.offersHomeCollection) {
                <button
                  type="button"
                  class="rounded-xl border p-4 text-left transition-colors"
                  [style.border-color]="isHome() ? '#0F5FDC' : '#86ACD8'"
                  [style.background]="isHome() ? '#EFF4FF' : 'transparent'"
                  [attr.aria-pressed]="isHome()"
                  (click)="collectionType.set('HOME_COLLECTION')"
                >
                  <p class="text-sm font-medium text-[#0E51A2] lg:text-base">Home Collection</p>
                  <p class="text-xs text-ink-600 lg:text-sm">Sample collected at your doorstep</p>
                  @if (lab.homeCollectionCharge.amount > 0) {
                    <p class="mt-1 text-xs text-ink-500">
                      +{{ money(lab.homeCollectionCharge) }} collection charge
                    </p>
                  }
                </button>
              }
              @if (lab.offersCenterVisit) {
                <button
                  type="button"
                  class="rounded-xl border p-4 text-left transition-colors"
                  [style.border-color]="!isHome() ? '#0F5FDC' : '#86ACD8'"
                  [style.background]="!isHome() ? '#EFF4FF' : 'transparent'"
                  [attr.aria-pressed]="!isHome()"
                  (click)="collectionType.set('CENTER_VISIT')"
                >
                  <p class="text-sm font-medium text-[#0E51A2] lg:text-base">Visit Center</p>
                  <p class="text-xs text-ink-600 lg:text-sm">Give your sample at the lab</p>
                </button>
              }
            </div>
          </section>

          <!-- Collection Address, home collection only -->
          @if (isHome()) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg lg:mb-5">
                Collection Address
              </h2>
              @if (profile.addresses().length) {
                <ul class="space-y-3">
                  @for (address of profile.addresses(); track address.id) {
                    <li>
                      <button
                        type="button"
                        class="w-full rounded-xl border p-4 text-left transition-colors"
                        [style.border-color]="address.id === addressId() ? '#0F5FDC' : '#E5E7EB'"
                        [style.background]="address.id === addressId() ? '#EFF4FF' : 'transparent'"
                        [attr.aria-pressed]="address.id === addressId()"
                        (click)="addressId.set(address.id)"
                      >
                        <p class="text-sm font-medium text-ink-900">{{ address.typeLabel }}</p>
                        <p class="mt-0.5 text-sm text-ink-700">{{ address.lines.join(', ') }}</p>
                      </button>
                    </li>
                  }
                </ul>
              } @else {
                <p class="rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
                  No saved address. Add one in your
                  <a routerLink="/member/profile" class="font-medium underline">profile</a> to book
                  home collection.
                </p>
              }
            </section>
          }

          <!-- Slots -->
          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg lg:mb-5">
              Select a Slot
            </h2>

            <div class="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              @for (day of days; track day.iso) {
                <button
                  type="button"
                  class="min-h-touch shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors"
                  [class]="
                    day.iso === date()
                      ? 'border-[#034DA2] bg-[#034DA2] text-white'
                      : 'border-[#E5E7EB] bg-white text-ink-700'
                  "
                  (click)="date.set(day.iso)"
                >
                  {{ day.label }}
                </button>
              }
            </div>

            @if (loadingSlots()) {
              <opd-loading label="Loading slots" />
            } @else if (slots().length) {
              <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                @for (slot of slots(); track slot.id) {
                  <li>
                    <button
                      type="button"
                      class="min-h-touch w-full rounded-xl border px-3 text-sm font-medium transition-colors disabled:opacity-40"
                      [class]="
                        slot.id === slotId()
                          ? 'border-[#0F5FDC] bg-[#EFF4FF] text-[#034DA2]'
                          : 'border-[#E5E7EB] bg-white text-ink-700'
                      "
                      [disabled]="!slot.isAvailable"
                      (click)="slotId.set(slot.id)"
                    >
                      {{ slot.label }}
                    </button>
                  </li>
                }
              </ul>
            } @else {
              <p class="text-sm text-ink-500">No slots available on this day. Try another date.</p>
            }
          </section>

          <!-- Summary -->
          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Summary</h2>
            <dl class="space-y-2 text-sm">
              <!-- Per-test prices, so a member comparing two labs can see WHICH
                   test drives the difference and not just that one is cheaper.
                   No extra request: GET carts/:cartId/vendors already returns
                   pricing[] per vendor and toCartVendor maps it (cart.ts:201).
                   The reference fetches vendors/:id/pricing separately for the
                   same thing; Angular had the data mapped and never rendered it. -->
              @for (price of lab.prices; track price.serviceId) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">{{ price.name }}</dt>
                  <dd class="text-ink-900">
                    @if (price.listPrice.amount > price.payablePrice.amount) {
                      <span class="mr-1 text-xs text-ink-500 line-through">{{
                        money(price.listPrice)
                      }}</span>
                    }
                    {{ money(price.payablePrice) }}
                  </dd>
                </div>
              }
              <div class="flex justify-between gap-3" [class.border-t]="lab.prices.length > 0"
                   [class.border-surface-border]="lab.prices.length > 0"
                   [class.pt-2]="lab.prices.length > 0">
                <dt class="text-ink-700">Tests</dt>
                <dd class="font-medium text-ink-900">{{ money(lab.payableTotal) }}</dd>
              </div>
              @if (isHome() && lab.homeCollectionCharge.amount > 0) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Home collection</dt>
                  <dd class="font-medium text-ink-900">{{ money(lab.homeCollectionCharge) }}</dd>
                </div>
              }
              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="font-semibold text-ink-900">Total</dt>
                <dd class="text-lg font-bold text-[#0B2C63]">{{ money(total()) }}</dd>
              </div>
            </dl>
            @if (store.validating()) {
              <p class="mt-2 text-xs text-ink-500">Checking your cover&hellip;</p>
            } @else if (validation(); as check) {
              <dl class="mt-3 space-y-2 border-t border-surface-border pt-3 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid from wallet</dt>
                  <dd class="font-medium text-success-700">{{ money(check.fromWallet) }}</dd>
                </div>
                @if (check.copay.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Copay</dt>
                    <dd class="font-medium text-ink-900">{{ money(check.copay) }}</dd>
                  </div>
                }
                @if (check.excess.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">
                      Above the {{ money(check.serviceLimit) }} limit for this test
                    </dt>
                    <dd class="font-medium text-ink-900">{{ money(check.excess) }}</dd>
                  </div>
                }
                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="font-semibold text-ink-900">You pay</dt>
                  <dd class="text-lg font-bold text-[#0B2C63]">{{ money(check.youPay) }}</dd>
                </div>
              </dl>

              @for (warning of check.warnings; track warning) {
                <p class="mt-2 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">
                  {{ warning }}
                </p>
              }
              @if (!check.isValid) {
                <p class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                  {{ check.reason ?? 'This order cannot be placed right now.' }}
                </p>
              } @else if (check.insufficientBalance) {
                <p class="mt-2 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">
                  Your wallet balance of {{ money(check.walletBalance) }} does not cover this order.
                </p>
              }
            } @else {
              <p class="mt-2 text-xs text-ink-500">
                Wallet deduction and any copay are calculated by the lab when the order is confirmed.
              </p>
            }
          </section>

          @if (addressBlocked()) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              We need a complete address before a home collection — line, city, state and pincode.
              Add or complete one in your profile, or choose a centre visit.
            </p>
          }

          @if (store.orderError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }

          <button
            type="button"
            class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
            [disabled]="!canPlace()"
            (click)="place()"
          >
            {{ store.placing() ? 'Placing order…' : 'Confirm booking' }}
          </button>
        }
      </div>
    </div>
  `,
})
export class VendorBookingPage {
  readonly cartId = input<string>('');
  readonly vendorId = input<string>('');
  /** 'LAB' or 'DIAGNOSTIC', from route data. */
  readonly kind = input<LabKind>(LabKind.Lab);

  protected readonly store = inject(CartStore);
  protected readonly profile = inject(ProfileStore);
  private readonly family = inject(FamilyStore);
  private readonly router = inject(Router);

  protected readonly money = formatMoney;
  protected readonly collectionType = signal<CollectionType>('HOME_COLLECTION');
  protected readonly addressId = signal('');
  /** Seeds the address exactly once — see the effect below. */
  private addressSeeded = false;
  /** Set when a home collection is attempted without a complete address. */
  protected readonly addressBlocked = signal(false);
  protected readonly slotId = signal('');
  protected readonly slots = signal<readonly Slot[]>([]);
  protected readonly loadingSlots = signal(false);

  /** Seven bookable days from today; the API takes one date at a time. */
  protected readonly days = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    return {
      iso: day.toISOString().slice(0, 10),
      label: offset === 0 ? 'Today' : DAY.format(day),
    };
  });

  protected readonly date = signal(this.days[0].iso);

  constructor() {
    void this.profile.load();
    effect(() => this.store.select(this.cartId(), this.kind()));

    // Default to the first address once they load, without overriding a choice.
    // ONE-SHOT, for the same reason as the pincode prefills: reading
    // `addressId()` inside made it a dependency, so the effect re-armed on every
    // change. Latent here only because the picker offers no way to UNSELECT —
    // the shape is the defect, not the current reachability.
    effect(() => {
      const addresses = this.profile.addresses();
      if (!addresses.length || this.addressSeeded) return;
      this.addressSeeded = true;
      if (untracked(() => this.addressId())) return;
      this.addressId.set((addresses.find((a) => a.isDefault) ?? addresses[0]).id);
    });

    // Reload slots whenever the vendor or day changes; clear any stale pick.
    effect(() => {
      const lab = this.vendor();
      const day = this.date();
      if (!lab) return;
      this.slotId.set('');
      void this.fetchSlots(lab.vendorId, day);
    });

    // A vendor that only visits centres cannot be booked for home collection.
    effect(() => {
      const lab = this.vendor();
      if (lab && !lab.offersHomeCollection) this.collectionType.set('CENTER_VISIT');
    });

    // Ask the API what this order actually costs once there is enough to ask
    // with — the same dry run web-member performs on its payment step.
    effect(() => {
      const lab = this.vendor();
      const cart = this.store.cart();
      const slotId = this.slotId();
      const patientId = this.family.activeMember()?.id;
      const amount = this.total().amount;

      if (!lab || !cart || !slotId || !patientId) {
        this.validation.set(null);
        return;
      }

      void this.store
        .validate(
          { patientId, vendorId: lab.vendorId, cartId: cart.id, slotId, totalAmount: amount },
          this.kind(),
        )
        .then((result) => this.validation.set(result));
    });
  }

  /** Null until the API has been asked, or if the check itself failed. */
  protected readonly validation = signal<OrderValidation | null>(null);

  protected readonly vendor = computed(() => this.store.vendorById(this.vendorId()));
  protected readonly isHome = computed(() => this.collectionType() === 'HOME_COLLECTION');
  protected readonly basePath = computed(() =>
    this.kind() === LabKind.Lab ? 'lab-tests' : 'diagnostics',
  );

  protected readonly total = computed(() => {
    const lab = this.vendor();
    if (!lab) return { amount: 0, currency: 'INR' as const };
    return this.isHome() ? lab.totalWithHomeCollection : lab.payableTotal;
  });

  /**
   * A validation that came back `valid: false` blocks the order — the API has
   * said no. A validation that never arrived does not: the check failing is
   * not the same as the order being refused, and the API rejects it again on
   * submit anyway.
   */
  protected readonly canPlace = computed(
    () =>
      this.vendor() !== undefined &&
      this.slotId() !== '' &&
      (!this.isHome() || this.addressId() !== '') &&
      this.validation()?.isValid !== false &&
      !this.store.validating() &&
      !this.store.placing(),
  );

  private async fetchSlots(vendorId: string, date: string): Promise<void> {
    this.loadingSlots.set(true);
    try {
      this.slots.set(await this.store.slots(vendorId, date, this.kind()));
    } finally {
      this.loadingSlots.set(false);
    }
  }

  protected async place(): Promise<void> {
    const lab = this.vendor();
    const slot = this.slots().find((candidate) => candidate.id === this.slotId());
    if (!lab || !slot || !this.canPlace()) return;

    const address = this.profile.addresses().find((a) => a.id === this.addressId());
    const member = this.family.activeMember();

    // Home collection needs the full nested address the DTO requires. Refuse
    // before the request rather than sending a partial one the API rejects with
    // its own validation text — which is what the member was being shown.
    if (this.isHome() && (!address?.pincode || !address.city || !address.state || !address.lines[0])) {
      this.addressBlocked.set(true);
      return;
    }
    this.addressBlocked.set(false);

    const orderId = await this.store.placeOrder(
      {
        cartId: this.cartId(),
        // The business VENDOR-… id, NOT the Mongo _id. The comment that used to
        // sit here claimed the opposite and sent `lab.id`, which returned
        // 404 "Vendor <_id> not found". The API resolves it as
        // `findOne({ vendorId })` and says so itself at
        // lab-order.service.ts:172. `validate` above already sent the business
        // id and was accepted, so the two calls disagreed with each other.
        vendorId: lab.vendorId,
        collectionType: this.collectionType(),
        collectionAddress:
          this.isHome() && address
            ? {
                fullName: member?.fullName ?? '',
                phone: member?.phone ?? '',
                addressLine1: address.lines[0] ?? '',
                pincode: address.pincode ?? '',
                city: address.city ?? '',
                state: address.state ?? '',
              }
            : undefined,
        collectionDate: slot.date,
        collectionTime: slot.timeSlot,
        slotId: slot.id,
      },
      this.kind(),
    );

    if (orderId !== null) {
      await this.router.navigate(['/member', this.basePath(), 'orders', orderId]);
    }
  }
}
