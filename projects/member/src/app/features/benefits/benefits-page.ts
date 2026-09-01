import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BenefitCategory } from '../../core/domain/codes';
import { formatMoney } from '../../core/domain/money';
import { WalletCategoryBalance } from '../../core/wallet/wallet.model';
import { WalletStore } from '../../core/wallet/wallet.store';
import { Icon, IconName } from '../../shared/ui/icon';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';

/**
 * What each benefit covers. web-member hardcodes this same copy — there is no
 * endpoint behind it.
 */
const FEATURES: Readonly<Partial<Record<BenefitCategory, readonly string[]>>> = {
  [BenefitCategory.InClinicConsultation]: [
    'General physicians',
    'Specialists',
    'Follow-ups',
  ],
  [BenefitCategory.OnlineConsultation]: ['Video consultation', 'Chat with a doctor', 'Follow-ups'],
  [BenefitCategory.Pharmacy]: ['Prescribed drugs', 'OTC medicines', 'Home delivery'],
  [BenefitCategory.Pathology]: ['Blood tests', 'Urine tests', 'Home collection'],
  [BenefitCategory.Radiology]: ['X-rays', 'MRI & CT scans', 'Ultrasound'],
  [BenefitCategory.Dental]: ['Dental cleanings', 'Basic procedures', 'Consultations'],
  [BenefitCategory.Vision]: ['Eye exams', 'Glasses & contacts', 'Consultations'],
  [BenefitCategory.HealthPackages]: ['Annual checkup', 'Health screening', 'Risk assessment'],
  [BenefitCategory.Vaccination]: ['Adult vaccines', 'Child vaccines', 'Booster doses'],
};

const ICONS: Readonly<Partial<Record<BenefitCategory, IconName>>> = {
  [BenefitCategory.InClinicConsultation]: 'user',
  [BenefitCategory.OnlineConsultation]: 'helpline',
  [BenefitCategory.Pharmacy]: 'pill',
  [BenefitCategory.Pathology]: 'lab',
  [BenefitCategory.Radiology]: 'lab',
  [BenefitCategory.Dental]: 'sparkles',
  [BenefitCategory.Vision]: 'eye',
  [BenefitCategory.HealthPackages]: 'shield',
  [BenefitCategory.Vaccination]: 'shield',
};

/**
 * The benefits index at /member/benefits.
 *
 * web-member fetches `member/benefit-components`, `member/wallet-rules` and
 * `member/coverage-matrix` here; all three answer 404 and each call is guarded
 * by `if (response.ok)`, so the reference silently falls back to eight
 * hardcoded cards with invented limits ("₹30,000/year", "40% used") and hides
 * its wallet-rules panel entirely.
 *
 * The categories, limits and consumption here come from the wallet instead,
 * which is real and already loaded. Registered in parity-divergences.md.
 */
@Component({
  selector: 'opd-benefits-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, LoadingView, ErrorView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Your Benefits</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              What {{ store.memberName() || 'your policy' }} is covered for
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1100px] px-5 py-6 lg:px-8">
        <label class="relative block">
          <span class="sr-only">Search benefits</span>
          <input
            type="search"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
            placeholder="Search benefits"
            class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-4 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus:border-[#0F5FDC]"
          />
        </label>

        @if (store.loading()) {
          <opd-loading label="Loading your benefits" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else if (!visible().length) {
          <opd-empty
            title="No benefits to show"
            [detail]="
              query()
                ? 'Nothing matches that search.'
                : 'Your policy has no benefit categories allocated yet.'
            "
          />
        } @else {
          <ul class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (category of visible(); track category.code) {
              <li>
                <a
                  [routerLink]="['/member/benefits', category.code]"
                  class="flex h-full flex-col rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm transition-colors hover:border-[#0F5FDC]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <span
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FB] text-[#0F5FDC]"
                      aria-hidden="true"
                    >
                      <opd-icon [name]="icon(category)" [size]="22" />
                    </span>
                    <span class="text-ink-500" aria-hidden="true">
                      <opd-icon name="chevronRight" [size]="18" />
                    </span>
                  </div>

                  <p class="mt-3 text-base font-semibold text-[#0B2C63]">{{ category.label }}</p>
                  <p class="mt-1 text-sm text-ink-700">
                    {{ category.isUnlimited ? 'Unlimited' : money(category.allocated) }}
                    @if (!category.isUnlimited) {
                      <span class="text-ink-500">allocated</span>
                    }
                  </p>

                  @if (!category.isUnlimited) {
                    <div class="mt-3">
                      <div class="h-2 overflow-hidden rounded-full bg-[#EEF2FA]">
                        <div
                          class="h-full rounded-full bg-[#0F5FDC]"
                          [style.width.%]="usedPercent(category)"
                        ></div>
                      </div>
                      <p class="mt-1.5 text-xs text-ink-500">
                        {{ money(category.consumed) }} used &middot;
                        {{ money(category.available) }} left
                      </p>
                    </div>
                  }

                  <ul class="mt-3 space-y-1">
                    @for (feature of features(category); track feature) {
                      <li class="flex items-start gap-2 text-xs text-ink-700">
                        <span class="text-success-700" aria-hidden="true">&#10003;</span>
                        {{ feature }}
                      </li>
                    }
                  </ul>
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class BenefitsPage {
  protected readonly store = inject(WalletStore);
  protected readonly money = formatMoney;
  protected readonly query = signal('');

  private readonly categories = computed(() => this.store.wallet()?.categories ?? []);

  protected readonly visible = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const rows = this.categories();
    return needle ? rows.filter((row) => row.label.toLowerCase().includes(needle)) : rows;
  });

  protected icon(category: WalletCategoryBalance): IconName {
    return ICONS[category.category] ?? 'money';
  }

  protected features(category: WalletCategoryBalance): readonly string[] {
    return FEATURES[category.category] ?? [];
  }

  /** Guarded against a zero allocation, which would divide by zero. */
  protected usedPercent(category: WalletCategoryBalance): number {
    const allocated = category.allocated.amount;
    if (allocated <= 0) return 0;
    return Math.min(100, Math.round((category.consumed.amount / allocated) * 100));
  }
}
