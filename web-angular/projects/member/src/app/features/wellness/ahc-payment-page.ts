import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AhcBookingStore } from '../../core/ahc/ahc-booking.store';
import { AhcStore } from '../../core/ahc/ahc.store';
import { formatMoney } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { ProfileStore } from '../../core/member/profile.store';
import { EmptyView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** AHC step 3: review both legs and the total before paying. */
@Component({
  selector: 'opd-ahc-payment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="backLink()"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Review &amp; Pay</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ stepLabel() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (!store.lab() && !store.diagnostic()) {
          <opd-empty
            title="Nothing to confirm"
            detail="Start your health checkup booking from the wellness screen."
          />
        } @else {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-1 text-lg font-bold text-[#0B2C63]">
              {{ ahc.checkupPackage()?.name ?? 'Annual Health Checkup' }}
            </h2>
            <p class="text-sm text-ink-700">{{ patientName() }}</p>

            @if (store.lab(); as lab) {
              <div class="mt-4 border-t border-surface-border pt-4">
                <p class="text-xs uppercase tracking-wide text-ink-500">Pathology</p>
                <p class="mt-0.5 font-medium text-ink-900">{{ lab.vendorName }}</p>
                <p class="text-sm text-ink-700">
                  {{ date(lab.date) }}{{ lab.time ? ', ' + lab.time : '' }}
                </p>
                <p class="text-sm text-ink-700">
                  {{ lab.collectionType === 'HOME_COLLECTION' ? 'Home collection' : 'Centre visit' }}
                  @if (lab.centreName) {
                    — {{ lab.centreName }}
                  }
                </p>
                @if (lab.collectionType === 'HOME_COLLECTION' && collectionAddress(); as address) {
                  <p class="text-sm text-ink-700">{{ address.lines.join(', ') }}</p>
                }
              </div>
            }

            @if (store.diagnostic(); as diagnostic) {
              <div class="mt-4 border-t border-surface-border pt-4">
                <p class="text-xs uppercase tracking-wide text-ink-500">Radiology</p>
                <p class="mt-0.5 font-medium text-ink-900">{{ diagnostic.vendorName }}</p>
                <p class="text-sm text-ink-700">
                  {{ date(diagnostic.date) }}{{ diagnostic.time ? ', ' + diagnostic.time : '' }}
                </p>
                @if (diagnostic.centreName) {
                  <p class="text-sm text-ink-700">{{ diagnostic.centreName }}</p>
                }
              </div>
            }
          </section>

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Amount</h2>
            <dl class="space-y-2 text-sm">
              @if (store.lab(); as lab) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Pathology</dt>
                  <dd class="font-medium text-ink-900">{{ money(lab.price) }}</dd>
                </div>
              }
              @if (store.diagnostic(); as diagnostic) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Radiology</dt>
                  <dd class="font-medium text-ink-900">{{ money(diagnostic.price) }}</dd>
                </div>
              }
              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="font-semibold text-ink-900">Total</dt>
                <dd class="text-lg font-bold text-[#0B2C63]">{{ money(store.subtotal()) }}</dd>
              </div>
            </dl>
            <p class="mt-2 text-xs text-ink-500">
              Wallet deduction and any copay are calculated when the order is confirmed. This
              benefit is checked against its once-a-year limit, not a money limit.
            </p>
            @if (store.route() === 'PATHOLOGY') {
              <p class="mt-2 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">
                Booking pathology on its own bills the health check now, whether or not you book
                radiology afterwards. Booking the whole package instead keeps both legs together.
              </p>
            }
          </section>

          @if (radiologyPlaceholder()) {
            <p class="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-sm text-[#034DA2]">
              Placeholder: radiology is meant to attach to the pathology order you already have,
              but the API has no route that adds a leg to an existing order — confirming will be
              refused by the once-a-year check until it does.
            </p>
          }
          @if (store.placeError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }
          @if (blockedReason(); as reason) {
            <p class="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700" role="alert">
              {{ reason }}
            </p>
          }

          <button
            type="button"
            class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
            [disabled]="store.placing()"
            (click)="confirm()"
          >
            {{ store.placing() ? 'Confirming…' : 'Confirm booking' }}
          </button>

          <a
            routerLink="/member/wellness"
            class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
            >Back to wellness</a
          >
        }
      </div>
    </div>
  `,
})
export class AhcPaymentPage {
  protected readonly store = inject(AhcBookingStore);
  protected readonly ahc = inject(AhcStore);
  private readonly family = inject(FamilyStore);
  private readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);

  protected readonly money = formatMoney;
  protected readonly blockedReason = signal<string | null>(null);

  protected readonly patientName = computed(() => this.family.activeMember()?.fullName ?? '');

  /** The address the member picked on the pathology leg — never a guess. */
  protected readonly collectionAddress = computed(() =>
    this.profile.addresses().find((a) => a.id === this.store.addressId()) ?? null,
  );

  protected readonly stepLabel = computed(() => {
    const total = this.store.route() === 'PACKAGE' ? 3 : 2;
    return `Step ${total} of ${total} — confirm your health checkup`;
  });

  protected readonly backLink = computed(() =>
    this.store.route() === 'PACKAGE' ? '/member/ahc/booking/diagnostic'
    : this.store.route() === 'RADIOLOGY' ? '/member/ahc/booking/diagnostic'
    : '/member/ahc/booking',
  );

  /** ROUTE A's second leg, which the API cannot take yet. See the banner. */
  protected readonly radiologyPlaceholder = computed(
    () => this.store.route() === 'RADIOLOGY' && this.store.booked().pathology,
  );

  /**
   * Booking-first: create the order, THEN create the payment for whatever the
   * wallet did not cover and take the member to it. The reference pays first and
   * creates the order afterwards; parity register entry 5 rules that ordering
   * do-not-port, and it is untouched here — only the continuation was added.
   */
  protected async confirm(): Promise<void> {
    const member = this.family.activeMember();
    // The address the member chose on the pathology leg. Only a home collection
    // actually needs one — a centre visit or a radiology-only booking has no
    // sample to collect — so fall back to the profile default for those rather
    // than blocking a journey that never asked the question.
    const address =
      this.collectionAddress() ??
      this.profile.addresses().find((a) => a.isDefault) ??
      this.profile.addresses()[0];
    const pkg = this.ahc.checkupPackage();
    const line1 = address?.lines?.[0] ?? '';
    if (!member || !pkg || !address?.pincode || !address.city || !address.state || !line1) {
      this.blockedReason.set(
        this.store.lab()?.collectionType === 'HOME_COLLECTION'
          ? 'Choose the address the sample should be collected from before confirming.'
          : 'We need your address on file before booking a health checkup. Add one in your profile.',
      );
      return;
    }
    this.blockedReason.set(null);

    const placed = await this.store.place({
      packageId: pkg.id,
      collectionAddress: {
        fullName: member.fullName,
        phone: member.phone ?? '',
        addressLine1: line1,
        pincode: address.pincode,
        city: address.city,
        state: address.state,
      },
    });
    if (!placed) return;
    this.store.clearBooking();
    // The wellness screen greys its options off this.
    void this.store.loadBookedLegs();

    // The copay continuation, ruled in session 50 and applied here for the
    // first time. AHC differs from dental and appointments in one way that
    // matters: their create endpoints CREATE the payment and hand back its id,
    // so those journeys only had to stop discarding it. AHC's does not create
    // one at all, so the payment has to be created here before there is
    // anywhere to go. See audit/14-ahc-commit-contract.md.
    if (placed.owed > 0) {
      const paymentId = await this.store.createCopayPayment(placed, member.id);
      if (paymentId) {
        await this.router.navigate(['/member/payments', paymentId]);
        return;
      }
      // The order is committed either way — never strand the member on this
      // screen. The bookings row discloses the outstanding amount, which is
      // what it was built for in session 51.
    }
    await this.router.navigate(['/member/bookings'], { queryParams: { tab: 'ahc' } });
  }

  protected date(value: string): string {
    const parsed = value ? new Date(value) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? DATE.format(parsed) : value;
  }
}
