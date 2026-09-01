import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { BookingKind } from '../../core/bookings/booking.model';
import { formatBookingWhen } from '../../core/bookings/booking-when';
import { BookingsStore } from '../../core/bookings/bookings.store';
import { BenefitCategory, benefitCategoryLabel, toBenefitCategory } from '../../core/domain/codes';
import { formatMoney } from '../../core/domain/money';
import { TransactionsStore } from '../../core/transactions/transactions.store';
import { WalletStore } from '../../core/wallet/wallet.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Which booking kinds and transaction service types belong to a category. */
const BOOKING_KINDS: Readonly<Partial<Record<BenefitCategory, readonly BookingKind[]>>> = {
  [BenefitCategory.InClinicConsultation]: [BookingKind.Appointment],
  [BenefitCategory.OnlineConsultation]: [BookingKind.Appointment],
  [BenefitCategory.Dental]: [BookingKind.Dental],
  [BenefitCategory.Vision]: [BookingKind.Vision],
};

const SERVICE_TYPES: Readonly<Partial<Record<BenefitCategory, readonly string[]>>> = {
  [BenefitCategory.InClinicConsultation]: ['APPOINTMENT'],
  [BenefitCategory.OnlineConsultation]: ['APPOINTMENT'],
  [BenefitCategory.Pharmacy]: ['PHARMACY'],
  [BenefitCategory.Radiology]: ['DIAGNOSTIC_ORDER'],
  [BenefitCategory.Pathology]: ['LAB_ORDER'],
  [BenefitCategory.Dental]: ['DENTAL'],
  [BenefitCategory.Vision]: ['VISION'],
  [BenefitCategory.HealthPackages]: ['AHC'],
  [BenefitCategory.Vaccination]: ['VACCINATION'],
};

/**
 * One screen for every benefit category, at /member/benefits/:categoryId.
 *
 * Built entirely from stores that are already loaded — wallet balance plus the
 * bookings and transactions belonging to this category. It deliberately does
 * not depend on GET /member/benefits/:categoryId/services, which is not
 * registered in the running API.
 */
@Component({
  selector: 'opd-benefit-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView, StatusBadge],
  template: `
    <div class="mx-auto w-full max-w-[480px] px-5 py-5 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <a routerLink="/member" class="text-sm font-medium text-[#034DA2] hover:underline"
        >← Back to home</a
      >

      <h1 class="mt-2 text-2xl font-bold text-black lg:text-3xl">{{ title() }}</h1>

      @if (wallet.loading()) {
        <opd-loading label="Loading benefit" />
      } @else if (balance(); as category) {
        <section
          class="mt-4 rounded-2xl p-5 text-white shadow-soft"
          style="background: linear-gradient(180deg,#1a6fd4 0%,#034da2 100%)"
        >
          @if (category.isUnlimited) {
            <p class="text-xs uppercase tracking-wide text-brand-100">This benefit</p>
            <p class="mt-1 text-3xl font-semibold">Unlimited</p>
            <p class="mt-1 text-xs text-brand-100">No cap applies to this category</p>
          } @else {
            <p class="text-xs uppercase tracking-wide text-brand-100">Available</p>
            <p class="mt-1 text-3xl font-semibold">{{ money(category.available) }}</p>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
              <div class="h-full rounded-full bg-accent" [style.width.%]="usedPercent()"></div>
            </div>
            <dl class="mt-3 flex justify-between text-xs text-brand-100">
              <div>
                <dt class="inline">Allocated </dt>
                <dd class="inline font-medium text-white">{{ money(category.allocated) }}</dd>
              </div>
              <div>
                <dt class="inline">Used </dt>
                <dd class="inline font-medium text-white">{{ money(category.consumed) }}</dd>
              </div>
            </dl>
            @if (category.isExhausted) {
              <p class="mt-3 rounded-lg bg-white/15 px-2 py-1 text-xs">
                This benefit is fully used for the current policy period.
              </p>
            }
          }
        </section>
      } @else {
        <opd-empty
          title="Not part of your plan"
          detail="This benefit is not included in your current policy."
        />
      }

      @if (bookings().length) {
        <section class="mt-6">
          <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Your bookings</h2>
          <ul class="space-y-3">
            @for (booking of bookings(); track booking.id) {
              <li
                class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-base font-semibold text-[#034DA2]">{{ booking.title }}</p>
                    <p class="mt-0.5 truncate text-sm text-ink-700">{{ booking.subtitle }}</p>
                    <p class="mt-1 text-xs text-ink-500">{{ when(booking) }}</p>
                  </div>
                  <div class="shrink-0 text-right">
                    <opd-status-badge [status]="booking.status" />
                    <p class="mt-2 text-base font-semibold text-[#303030]">
                      {{ money(booking.amount) }}
                    </p>
                  </div>
                </div>
              </li>
            }
          </ul>
        </section>
      }

      @if (spend().length) {
        <section class="mt-6">
          <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Spending</h2>
          <ul
            class="divide-y divide-surface-border overflow-hidden rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white"
          >
            @for (txn of spend(); track txn.id) {
              <li class="flex items-start justify-between gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-ink-900">{{ txn.serviceName }}</p>
                  <p class="mt-0.5 text-xs text-ink-500">
                    {{ date(txn.occurredAt) }} · {{ txn.paymentMethodLabel }}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-semibold text-[#303030]">{{ money(txn.total) }}</p>
                  <p class="text-xs text-ink-500">{{ money(txn.fromWallet) }} wallet</p>
                </div>
              </li>
            }
          </ul>
        </section>
      }

      @if (balance() && !isCheckup() && !bookings().length && !spend().length) {
        <opd-empty
          title="No activity yet"
          detail="Bookings and spending under this benefit will appear here."
        />
      }
    </div>
  `,
})
export class BenefitDetailPage {
  /** Bound from the route param via withComponentInputBinding(). */
  readonly categoryId = input<string>('');

  protected readonly wallet = inject(WalletStore);
  private readonly router = inject(Router);
  private readonly bookingsStore = inject(BookingsStore);
  private readonly transactionsStore = inject(TransactionsStore);

  protected readonly money = formatMoney;

  private readonly category = computed(() => toBenefitCategory(this.categoryId()));

  /** Categories that have a purpose-built screen instead of this generic one. */
  private readonly dedicatedScreen = computed(() => {
    switch (this.category()) {
      case BenefitCategory.HealthPackages:
        return '/member/wellness';
      case BenefitCategory.Pathology:
        return '/member/lab-tests';
      case BenefitCategory.Radiology:
        return '/member/diagnostics';
      case BenefitCategory.Vision:
        return '/member/vision';
      case BenefitCategory.Dental:
        return '/member/dental';
      case BenefitCategory.InClinicConsultation:
        return '/member/appointments/specialties';
      case BenefitCategory.OnlineConsultation:
        return '/member/online-consult/specialties';
      default:
        return null;
    }
  });

  protected readonly isCheckup = computed(() => this.dedicatedScreen() !== null);

  constructor() {
    // Covers anyone arriving on this URL directly or from a stale link.
    effect(() => {
      const screen = this.dedicatedScreen();
      if (screen) void this.router.navigate([screen]);
    });
  }

  protected readonly balance = computed(() =>
    this.wallet
      .wallet()
      ?.categories.find((candidate) => candidate.category === this.category()),
  );

  protected readonly title = computed(
    () => this.balance()?.label ?? benefitCategoryLabel(this.category()),
  );

  protected readonly usedPercent = computed(() => {
    const category = this.balance();
    if (!category || category.allocated.amount <= 0) return 0;
    return Math.min(100, Math.round((category.consumed.amount / category.allocated.amount) * 100));
  });

  protected readonly bookings = computed(() => {
    const kinds = BOOKING_KINDS[this.category()];
    if (!kinds) return [];
    // `all`, not `bookings` — a filter set on the Bookings screen must not
    // change what this screen shows.
    return this.bookingsStore.all().filter((booking) => kinds.includes(booking.kind));
  });

  protected readonly spend = computed(() => {
    const types = SERVICE_TYPES[this.category()];
    if (!types) return [];
    return this.transactionsStore
      .transactions()
      .filter((txn) => types.includes(txn.serviceTypeCode));
  });

  protected readonly when = formatBookingWhen;

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }
}
