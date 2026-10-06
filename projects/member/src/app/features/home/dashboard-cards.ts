import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Money, formatMoney } from '../../core/domain/money';
import { Policy } from '../../core/member/policy';
import { WalletCategoryBalance } from '../../core/wallet/wallet.model';
import { Icon } from '../../shared/ui/icon';
import { RemoteAssetPipe } from '../../shared/remote-asset.pipe';

/** Plain grouped digits, no symbol — the design prints ₹ separately. */
const NUMBER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * The blue policy card. 500 x 235 on the web design and the phone's track
 * width on a phone, with the same 2.13 ratio at both, so the rows keep their
 * spacing at any width.
 */
@Component({
  selector: 'opd-policy-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="['/member/policy-details', policy().id]"
      class="flex aspect-[2.13] w-full flex-col rounded-[20px] px-[6.5%] pb-[6%] pt-[5.5%] text-white transition-all duration-300 lg:rounded-[32px]"
      style="background: linear-gradient(101deg,#0077E2 0%,#0077E3 18%,#003977 100%); border: 2px solid rgba(137,185,245,.39); box-shadow: 0 10px 18px -6px rgba(0,57,119,.28)"
    >
      <span class="truncate text-[22px] font-semibold leading-tight lg:text-[28px]">{{
        policy().holderName
      }}</span>

      <div class="mt-[3%] h-px w-full bg-white/30"></div>

      <!-- The rows share out whatever height the card's ratio leaves. -->
      <dl class="mt-[4%] flex flex-1 flex-col justify-between text-[13px] leading-none lg:text-lg">
        <div class="flex items-center justify-between gap-3">
          <dt class="font-normal text-white/85">Policy Number</dt>
          <dd class="w-[45%] truncate font-semibold">{{ policy().policyNumber }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="font-normal text-white/85">Valid Till</dt>
          <dd class="w-[45%] font-semibold">{{ validTill() }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="font-normal text-white/85">Corporate</dt>
          <dd class="w-[45%] truncate font-semibold">{{ policy().corporate }}</dd>
        </div>
      </dl>
    </a>
  `,
  imports: [RouterLink],
})
export class PolicyCard {
  readonly policy = input.required<Policy>();

  protected readonly validTill = computed(() => {
    const date = this.policy().validTill;
    return date ? DATE.format(date) : 'No Expiry';
  });
}

/** "Available Balance  ₹50,000 / 50,000" — plain centred text, no card. */
@Component({
  selector: 'opd-balance-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a routerLink="/member/transactions" class="block text-center">
      <p class="text-[13px] leading-tight text-[#3a3a3a] lg:text-[15px]">Available Balance</p>
      <p class="mt-2 whitespace-nowrap leading-none lg:mt-1.5">
        <span class="text-[32px] font-semibold text-[#1c1c1c] lg:text-[36px]"
          >₹{{ plain(available()) }}</span
        >
        <span class="text-[18px] text-[#656565]"> / {{ plain(allocated()) }}</span>
      </p>
    </a>
  `,
})
export class BalanceSummary {
  readonly available = input.required<Money>();
  readonly allocated = input.required<Money>();

  protected plain(value: Money): string {
    return NUMBER.format(value.amount);
  }
}

@Component({
  selector: 'opd-benefit-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="href()"
      class="relative flex h-full min-h-[106px] flex-col rounded-2xl border border-[#D9D9D97A] bg-white p-3.5 transition-all duration-200 hover:-translate-y-px lg:min-h-[116px] lg:px-[17px] lg:py-2.5"
      style="box-shadow: -2px 11px 46px 0 rgba(0,0,0,.08)"
    >
      <!-- The slot keeps its height when a category has no artwork, so the
           label and amount line up across the row. -->
      <span class="block h-[30px] w-[30px]" aria-hidden="true">
        @if (iconSrc(); as src) {
          <img [src]="src | remoteAsset" alt="" width="30" height="30" class="h-[30px] w-[30px] object-contain" />
        }
      </span>

      <h3 class="mt-auto pt-3 text-[12px] font-normal leading-tight text-[#545454] lg:text-[15px]">
        {{ label() || category().label }}
      </h3>
      <p class="mt-1 pr-8 text-[18px] font-medium leading-none text-[#034DA2] lg:text-[24px]">
        @if (category().isUnlimited) {
          Unlimited
        } @else if (category().isExhausted) {
          Fully used
        } @else {
          {{ money(category().available) }}
        }
      </p>

      <span
        class="absolute bottom-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#F6F6F6] text-[#545454] lg:h-[27px] lg:w-[27px]"
        aria-hidden="true"
        ><opd-icon name="chevronRight" [size]="12"
      /></span>
    </a>
  `,
  imports: [RouterLink, Icon, RemoteAssetPipe],
})
export class BenefitCard {
  readonly category = input.required<WalletCategoryBalance>();
  readonly href = input('/member/benefits');
  /** The design's artwork for this category; none leaves the slot empty. */
  readonly iconSrc = input<string | null>(null);
  /** The design's wording, when it differs from the category's own name. */
  readonly label = input<string | null>(null);

  protected readonly money = formatMoney;
}

export interface LinkTile {
  readonly id: string;
  /**
   * The pill's words, split by colour. The design prints part of each label in
   * brand blue — Health *Records*, *Claims*, *24/7* Helpline — so the split is
   * per tile, not per word.
   */
  readonly lead?: string;
  readonly accent: string;
  readonly trail?: string;
  readonly iconSrc: string;
  readonly path: string;
}

/**
 * The row of pills. A phone calls it "Quick Links" and scrolls it sideways;
 * the web calls it "Quick Actions" and lays it across the full width.
 */
@Component({
  selector: 'opd-quick-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RemoteAssetPipe],
  template: `
    <section>
      <h2 class="mb-3 text-[15px] font-medium leading-[1.2] text-[#1c1c1c] lg:mb-[26px] lg:text-[22px]">
        <span class="lg:hidden">Quick Links</span><span class="hidden lg:inline">Quick Actions</span>
      </h2>

      <div
        class="scrollbar-hide -mr-5 flex gap-2.5 overflow-x-auto pb-4 pr-5 lg:mr-0 lg:gap-[21px] lg:pb-8 lg:pr-0"
      >
        @for (link of links(); track link.id) {
          <a
            [routerLink]="link.path"
            class="flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#034DA21C] bg-white pl-2.5 pr-3.5 text-[13px] text-[#1c1c1c] transition-all duration-200 hover:-translate-y-px lg:h-[57px] lg:gap-3 lg:border-transparent lg:pl-7 lg:pr-[30px] lg:text-[20px] lg:hover:border-[#034DA21C]"
            style="box-shadow: 0 4px 14px 0 rgba(0,0,0,.06)"
          >
            <img
              [src]="link.iconSrc | remoteAsset"
              alt=""
              width="24"
              height="28"
              class="h-[18px] w-[18px] shrink-0 object-contain lg:h-[28px] lg:w-[26px]"
            />
            <span class="whitespace-nowrap"
              >{{ link.lead ? link.lead + ' ' : '' }}<span class="text-[#0F5FDC]">{{ link.accent }}</span
              >{{ link.trail ? ' ' + link.trail : '' }}</span
            >
          </a>
        }
      </div>
    </section>
  `,
})
export class QuickLinks {
  readonly links = input.required<readonly LinkTile[]>();
}
