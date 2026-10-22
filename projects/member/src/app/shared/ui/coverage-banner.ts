import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { BenefitCategory, benefitCategoryLabel, toBenefitCategory } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { PolicyCategoryDto } from '../../core/member/policy.dto';
import { findRelationshipInVersion, getPrimaryRelationship } from '../../core/member/policy.mapper';
import { PolicyStore } from '../../core/member/policy.store';

function defaultUnitNoun(category: BenefitCategory): string {
  switch (category) {
    case BenefitCategory.OnlineConsultation:
      return 'consultation';
    case BenefitCategory.InClinicConsultation:
      return 'visit';
    case BenefitCategory.Pharmacy:
      return 'order';
    case BenefitCategory.Pathology:
    case BenefitCategory.Radiology:
      return 'test';
    case BenefitCategory.Dental:
    case BenefitCategory.Vision:
      return 'visit';
    case BenefitCategory.Vaccination:
      return 'vaccination';
    case BenefitCategory.HealthPackages:
      return 'package';
    default:
      return 'transaction';
  }
}

function buildFootnote(
  cat: PolicyCategoryDto | undefined,
  unitNoun: string,
  customFootnote?: string,
): string | null {
  if (customFootnote) return customFootnote;
  if (!cat) return null;

  const parts: string[] = [];
  const perLimit = cat.per_transaction_limit ?? cat.per_claim_limit;
  if (perLimit && perLimit > 0) {
    parts.push(`Up to ₹${perLimit.toLocaleString('en-IN')} per ${unitNoun} from wallet`);
  }

  if (typeof cat.co_payment_value === 'number') {
    if (cat.co_payment_value > 0) {
      const isFlat = cat.co_payment_mode === 'flat';
      parts.push(isFlat ? `₹${cat.co_payment_value} co-payment` : `${cat.co_payment_value}% co-payment`);
    } else {
      parts.push('0% co-payment');
    }
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

@Component({
  selector: 'opd-coverage-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    @if (isLoading()) {
      @if (isDetailed()) {
        <!-- Skeleton: detailed definition-list layout -->
        <div class="mb-5 animate-pulse rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
          <div class="flex items-center justify-between">
            <div class="h-4 w-44 rounded bg-blue-100"></div>
            <div class="h-4 w-16 rounded bg-blue-100"></div>
          </div>
          <div class="mt-4 space-y-2.5">
            <div class="flex justify-between"><div class="h-4 w-28 rounded bg-blue-100"></div><div class="h-4 w-20 rounded bg-blue-200"></div></div>
            <div class="flex justify-between"><div class="h-4 w-24 rounded bg-blue-100"></div><div class="h-4 w-24 rounded bg-blue-100"></div></div>
            <div class="flex justify-between"><div class="h-4 w-20 rounded bg-blue-100"></div><div class="h-4 w-48 rounded bg-blue-100"></div></div>
          </div>
          <div class="mt-4 h-3 w-4/5 rounded bg-blue-100"></div>
        </div>
      } @else {
        <!-- Skeleton: standard single-balance layout -->
        <div class="mb-5 animate-pulse rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
          <div class="flex items-center justify-between">
            <div class="h-4 w-36 rounded bg-blue-100"></div>
            <div class="h-4 w-16 rounded bg-blue-100"></div>
          </div>
          <div class="mt-2 h-7 w-28 rounded bg-blue-200"></div>
          <div class="mt-2 h-3 w-40 rounded bg-blue-100"></div>
          <div class="mt-2 h-3 w-56 rounded bg-blue-100"></div>
        </div>
      }
    } @else if (categoryInfo(); as c) {
      @if (isDetailed()) {
        <!-- Detailed definition-list layout (e.g. Vision) -->
        <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-semibold text-[#034DA2]">{{ c.title }}</p>
            @if (c.poolCode) {
              <span class="inline-flex shrink-0 items-center rounded-md bg-blue-100/80 px-2 py-0.5 text-[11px] font-semibold text-[#034DA2]">
                {{ c.poolCode }}
              </span>
            }
          </div>
          @if (c.poolName) {
            <p class="mt-1 text-xs text-ink-600 leading-snug">
              <span class="font-medium text-ink-700">Pool:</span> {{ c.poolName }}
            </p>
          }
          <dl class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-ink-700">Eligible amount</dt>
              <dd class="font-medium text-ink-900">
                @if (c.annualLimit > 0) {
                  ₹{{ c.annualLimit | number }}
                } @else {
                  No annual limit
                }
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-700">Frequency</dt>
              <dd class="font-medium text-ink-900">{{ c.frequency }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-700">Covered</dt>
              <dd class="text-right font-medium text-ink-900">{{ c.coveredText }}</dd>
            </div>
          </dl>
          @if (c.couponNote) {
            <p class="mt-3 text-xs text-ink-500">{{ c.couponNote }}</p>
          }
        </div>
      } @else {
        <!-- Standard single-balance layout -->
        <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm text-ink-700">{{ c.title }}</p>
            @if (c.poolCode) {
              <span class="inline-flex shrink-0 items-center rounded-md bg-blue-100/80 px-2 py-0.5 text-[11px] font-semibold text-[#034DA2]">
                {{ c.poolCode }}
              </span>
            }
          </div>
          @if (c.annualLimit > 0) {
            <p class="mt-1 text-2xl font-bold text-[#034DA2]">
              ₹{{ c.annualLimit | number }} <span class="text-sm font-normal text-ink-500">left this year</span>
            </p>
          } @else {
            <p class="mt-1 text-base font-semibold text-ink-500">
              No annual limit allocated for this
            </p>
          }
          @if (c.poolName) {
            <p class="mt-1 text-xs text-ink-600 leading-snug">
              <span class="font-medium text-ink-700">Pool:</span> {{ c.poolName }}
            </p>
          }
          @if (c.footnote) {
            <p class="mt-1 text-xs text-ink-500">{{ c.footnote }}</p>
          }
        </div>
      }
    }
  `,
})
export class CoverageBannerComponent {
  readonly category = input.required<BenefitCategory>();
  readonly customTitle = input<string>();
  readonly unitNoun = input<string>();
  readonly customFootnote = input<string>();
  readonly variant = input<'standard' | 'detailed'>();
  readonly frequency = input<string>();
  readonly coveredText = input<string>();
  readonly couponNote = input<string>();

  protected readonly policyStore = inject(PolicyStore);
  protected readonly family = inject(FamilyStore);

  protected readonly isDetailed = computed(() => {
    const v = this.variant();
    if (v) return v === 'detailed';
    return this.category() === BenefitCategory.Vision;
  });

  protected readonly isLoading = computed(() => this.policyStore.loading() || this.family.loading());

  protected readonly categoryInfo = computed(() => {
    const version = this.policyStore.version();
    const activeMember = this.family.activeMember();
    const relCode = activeMember?.relationshipCode || (activeMember?.isPrimary ? 'self' : 'self');
    const rel = version
      ? (findRelationshipInVersion(version, relCode) ?? getPrimaryRelationship(version))
      : null;

    const cat = rel?.categories?.find(
      (c) =>
        toBenefitCategory(c.category_code) === this.category() ||
        toBenefitCategory(c.category_name) === this.category(),
    );

    let poolCode = cat?.pool_code?.trim() || null;
    let poolName = cat?.pool_name?.trim() || null;

    if (!poolCode && rel?.additional_claim_categories) {
      const addMatch = rel.additional_claim_categories.find(
        (a) => toBenefitCategory(a.claim_category_name) === this.category(),
      );
      if (addMatch?.claim_pool_code) {
        poolCode = addMatch.claim_pool_code.trim();
      }
    }

    const pool = poolCode
      ? this.policyStore.pools().find(
          (p) =>
            p.code?.trim().toUpperCase() === poolCode?.toUpperCase() ||
            p.id?.trim().toUpperCase() === poolCode?.toUpperCase(),
        )
      : null;

    if (pool?.description) {
      poolName = pool.description;
    }

    const hasPool = Boolean(poolCode && (pool || poolName));
    const walletAnnualLimit = this.policyStore.walletTotal().allocated.amount ?? 0;
    const annualLimit = hasPool ? (pool?.allocated?.amount ?? walletAnnualLimit) : walletAnnualLimit;

    const noun = this.unitNoun() || defaultUnitNoun(this.category());
    const defaultTitle =
      this.category() === BenefitCategory.Vision
        ? 'Your vision coverage'
        : this.category() === BenefitCategory.HealthPackages
          ? 'Annual Health Check coverage'
          : benefitCategoryLabel(this.category(), cat?.category_name) + ' coverage';

    const title = this.customTitle() || defaultTitle;
    const footnote = buildFootnote(cat, noun, this.customFootnote());
    const frequency = this.frequency() || 'Once a year';
    const coveredText = this.coveredText() || 'Frames · prescription lenses · contact lenses';
    const couponNote =
      this.couponNote() ||
      'You get a coupon to use at the partner — coverage is shown here instead of a payment breakdown, because nothing is charged on the portal. Anything above the coupon value is paid to the partner, and settlement happens after the order is processed.';

    return {
      title,
      hasPool,
      poolCode: hasPool ? (pool?.code || poolCode) : null,
      poolName: hasPool ? poolName : null,
      annualLimit,
      footnote,
      frequency,
      coveredText,
      couponNote,
    };
  });
}
