import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Money, formatCompact, formatMoney } from '../../core/domain/money';
import { Policy } from '../../core/member/policy';
import { WalletCategoryBalance } from '../../core/wallet/wallet.model';
import { Icon } from '../../shared/ui/icon';

/** Plain grouped digits, no symbol — the reference prints ₹ separately. */
const NUMBER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

@Component({
  selector: 'opd-policy-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="['/member/policy-details', policy().id]"
      class="flex aspect-[1.79] w-full flex-col rounded-2xl p-[4.9%] transition-all duration-300 lg:aspect-[2.175] lg:rounded-[20px]"
      style="background: linear-gradient(-3.81deg, rgba(228,235,254,1) .81%, rgba(205,220,254,1) 94.71%); border: 1px solid rgba(164,191,254,.48)"
    >
      <div class="flex items-center gap-2">
        <span class="shrink-0 text-black" aria-hidden="true">
          <opd-icon name="userCircle" [size]="20" />
        </span>
        <span class="truncate text-base font-medium leading-tight text-black lg:text-lg">{{
          policy().holderName
        }}</span>
        <span class="ml-auto hidden shrink-0 text-[#0E51A2] lg:block" aria-hidden="true">
          <opd-icon name="chevronRight" [size]="16" />
        </span>
      </div>

      <div class="mt-[4%] h-px w-full" style="background: rgba(164,191,254,.6)"></div>

      <!-- The rows share out whatever height the card's ratio leaves, which is
           what gives the design its airy spacing at any card width. -->
      <dl class="flex flex-1 flex-col justify-evenly">
        <div class="flex items-center justify-between">
          <dt class="text-xs font-normal leading-none text-[#4a4a4a]">Policy Number</dt>
          <dd class="truncate pl-2 text-xs font-semibold leading-none text-[#1c1c1c]">
            {{ policy().policyNumber }}
          </dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-xs font-normal leading-none text-[#4a4a4a]">Valid Till</dt>
          <dd class="text-xs font-semibold leading-none text-[#1c1c1c]">{{ validTill() }}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-xs font-normal leading-none text-[#4a4a4a]">Corporate</dt>
          <dd class="truncate pl-2 text-xs font-semibold leading-none text-[#1c1c1c]">
            {{ policy().corporate }}
          </dd>
        </div>
      </dl>
    </a>
  `,
  imports: [Icon, RouterLink],
})
export class PolicyCard {
  readonly policy = input.required<Policy>();

  protected readonly validTill = computed(() => {
    const date = this.policy().validTill;
    return date ? DATE.format(date) : 'No Expiry';
  });
}

@Component({
  selector: 'opd-wallet-balance-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div>
      <!-- No heading above the card. The supplied design goes straight from the
           policy carousel to the balance, and the 44px this used cost More
           Services its place on the first screen. The card says
           "Total Available Balance" on itself. -->

      <!-- Phone: the blue card with the wallet illustration. Both surfaces are
           always in the DOM, shown or hidden by CSS, as the shell does. -->
      <a
        routerLink="/member/transactions"
        class="flex h-24 w-full items-center justify-between gap-3 overflow-hidden rounded-2xl p-4 lg:h-auto"
        [class.lg:hidden]="!preferBlue()"
        [class.lg:relative]="preferBlue()"
        [class.lg:block]="preferBlue()"
        [style.height.px]="preferBlue() ? 235 : null"
        [style.borderRadius.px]="preferBlue() ? 20 : null"
        [class.lg:p-6]="preferBlue()"
        style="background: linear-gradient(135deg,#4C8FDF 0%,#2C74D0 100%)"
      >
        <!-- The three lines share out the card's height rather than stacking
             tight, which is what gives the design its spread. -->
        <div
          class="flex min-w-0 flex-col justify-between self-stretch"
          [class.lg:relative]="preferBlue()"
          [class.lg:z-10]="preferBlue()"
          [class.lg:block]="preferBlue()"
          [class.lg:self-auto]="preferBlue()"
        >
          <div
            class="text-[13px] text-white"
            [style.fontSize.px]="preferBlue() ? 16 : null"
            [class.lg:font-medium]="preferBlue()"
          >
            Total Available Balance
          </div>
          <div
            class="flex flex-nowrap items-baseline gap-1 whitespace-nowrap"
            [class.lg:mt-2]="preferBlue()"
          >
            <span
              class="text-[20px] font-semibold leading-tight text-white"
              [style.fontSize.px]="preferBlue() ? 36 : null"
              [class.lg:font-bold]="preferBlue()"
              >₹{{ plain(available()) }}</span
            >
            <span class="text-[15px] text-white/70" [class.lg:text-xl]="preferBlue()"
              >/ {{ plain(allocated()) }}</span
            >
            <span class="text-[11px] text-white/70" [class.lg:text-xl]="preferBlue()">Left</span>
          </div>
          <p
            class="whitespace-nowrap text-[9px] text-white/80"
            [class.lg:whitespace-normal]="preferBlue()"
            [class.lg:mt-4]="preferBlue()"
            [style.maxWidth.%]="preferBlue() ? 45 : null"
            [style.fontSize.px]="preferBlue() ? 14 : null"
            [class.lg:leading-snug]="preferBlue()"
          >
            {{ preferBlue() ? 'Your total usage cannot exceed this allocated limit.' : 'Your total usage cannot exceed this amount' }}
          </p>
        </div>

        <!-- Wallet plus the three sparkles that sit off its top-left corner.
             web-member ships the sparkles but never uses them. -->
        <!-- On desktop the illustration leaves the flow and anchors to the
             bottom-right corner, at roughly twice the size, as in the design. -->
        <div
          class="relative h-[58px] w-[116px] shrink-0"
          [class.lg:absolute]="preferBlue()"
          [class.lg:bottom-0]="preferBlue()"
          [class.lg:right-0]="preferBlue()"
          [style.height.px]="preferBlue() ? 118 : null"
          [style.width.px]="preferBlue() ? 212 : null"
          aria-hidden="true"
        >
          <img
            src="images/icons/wallet-illustration.svg"
            alt=""
            width="95"
            height="54"
            class="absolute bottom-0 right-0 h-[54px] w-[95px] object-contain"
            [style.height.px]="preferBlue() ? 105 : null"
            [style.width.px]="preferBlue() ? 185 : null"
          />
          <img
            src="images/icons/sparkle-1.svg"
            alt=""
            class="absolute left-0 top-0 h-3 w-3"
            [style.left.px]="preferBlue() ? 0 : null"
            [style.top.px]="preferBlue() ? 36 : null"
            [style.height.px]="preferBlue() ? 22 : null"
            [style.width.px]="preferBlue() ? 22 : null"
          />
          <img
            src="images/icons/sparkle-2.svg"
            alt=""
            class="absolute left-[17px] top-[3px] h-[7px] w-[7px]"
            [style.left.px]="preferBlue() ? 34 : null"
            [style.top.px]="preferBlue() ? 26 : null"
            [style.height.px]="preferBlue() ? 13 : null"
            [style.width.px]="preferBlue() ? 13 : null"
          />
          <img
            src="images/icons/sparkle-3.svg"
            alt=""
            class="absolute left-[5px] top-[18px] h-[11px] w-[11px]"
            [style.left.px]="preferBlue() ? 9 : null"
            [style.top.px]="preferBlue() ? 68 : null"
            [style.height.px]="preferBlue() ? 19 : null"
            [style.width.px]="preferBlue() ? 19 : null"
          />
        </div>
      </a>

      <a
        routerLink="/member/transactions"
        class="hidden w-full items-center rounded-2xl border-2 border-[#E5E7EB] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg lg:h-[143px] lg:p-6"
        [class.lg:flex]="!preferBlue()"
      >
        <div class="flex w-full items-center justify-between gap-4">
          <div class="flex-1">
            <div class="mb-2 text-xs text-ink-500 lg:text-sm">Total Available Balance</div>
            <div class="mb-2 flex items-baseline gap-2">
              <span class="text-lg font-bold text-brand-600 lg:text-2xl">₹</span>
              <span class="text-2xl font-bold text-brand-600 lg:text-3xl">{{
                plain(available())
              }}</span>
              <span class="text-sm text-ink-500 lg:text-base">/ {{ plain(allocated()) }}</span>
            </div>
            <p class="text-xs text-ink-500 lg:text-sm">
              Your total usage cannot exceed this amount
            </p>
          </div>
          <svg
            class="h-5 w-5 shrink-0 text-brand-600 lg:h-6 lg:w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>
    </div>
  `,
})
export class WalletBalanceCard {
  /**
   * Render the blue illustrated card at desktop widths too. The home sidebar
   * wants it; the wallet screen still wants the white one, so this is opt-in
   * rather than a change of default.
   */
  readonly preferBlue = input(false);

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
      class="group relative flex h-full min-h-[82px] flex-col rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-[14px] transition-all duration-200 lg:rounded-[22px] lg:border-0 lg:p-[18px]"
      style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
    >
      <h3 class="text-base font-normal leading-tight text-[#034DA2] lg:text-[18px]">
        {{ category().label }}
      </h3>

      <div class="mt-auto pt-3 lg:flex lg:items-center">
        <p
          class="min-w-0 pr-8 text-[18px] font-normal leading-none text-[#034DA2] lg:pr-[62px] lg:text-[21px]"
        >
          @if (category().isUnlimited) {
            Unlimited
          } @else if (category().isExhausted) {
            Fully used
          } @else {
            {{ money(available()) }}<span class="text-xs text-[#9a9a9a] lg:text-[13px]">Left</span
            ><span class="text-xs text-[#1c1c1c] lg:text-[13px]"
              >/{{ compact(allocated()) }}</span
            >
          }
        </p>
        <!-- Phone: pinned to the corner, so it lands in the same spot whether
             or not the title wraps.
             Web: also pinned, at an EQUAL 18px from the bottom and the right.
             In the flow it centred on the amount's text line and, being 40px
             tall, hung 11px past the padding box — 22px from the right but only
             7px from the bottom. Pinning is the only way the two gaps stay equal,
             since the disc is taller than the line it sat on.
             (It was previously ml-[136px] from the amount, which also made the
             eight discs land at eight different x positions.) -->
        <span
          class="absolute bottom-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#F1F3F7] text-[#545454] lg:bottom-[18px] lg:right-[18px] lg:h-10 lg:w-10"
          aria-hidden="true"
          ><!-- One icon, scaled for the larger desktop disc. Two icons with
               lg:hidden / hidden lg:block rendered BOTH: the class lands on the
               component host, and the host was not the element deciding display. -->
          <span class="flex lg:scale-[1.45]"
            ><opd-icon name="chevronRight" [size]="12"
          /></span>
        </span>
      </div>
    </a>
  `,
  imports: [RouterLink, Icon],
})
export class BenefitCard {
  readonly category = input.required<WalletCategoryBalance>();
  readonly href = input('/member/benefits');

  protected readonly available = computed(() => this.category().available);
  protected readonly allocated = computed(() => this.category().allocated);
  protected readonly money = formatMoney;
  protected readonly compact = formatCompact;
}

export interface LinkTile {
  readonly id: string;
  readonly label: string;
  /**
   * Printed in brand blue ahead of the label. The design colours each service
   * pill differently — "24/7" blue then "Helpline" black, "Claims" all black,
   * "Transaction History" all blue — so the split is per tile, not per word.
   */
  readonly accent?: string;
  /** web-member's own SVG for this tile. */
  readonly iconSrc: string;
  /**
   * The design's full illustration, drawn at 56px on a phone. Tiles without
   * one fall back to `iconSrc` inside the pale disc.
   */
  readonly artSrc?: string;
  /** Web pill width in px. Defaults to 150; widen it for a longer label. */
  readonly width?: number;
  readonly path: string;
}

@Component({
  selector: 'opd-quick-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section>
      <h2 class="mb-4 text-[18px] font-medium leading-[1.2] text-[#1c1c1c] lg:mb-3 lg:text-xl">
        Quick Actions
      </h2>

      <!-- Mobile: illustration over label, scrolled sideways and bleeding off
           the right edge. Desktop: a ROW of pills across the full width, not a
           vertical stack in the sidebar — the sidebar is where the policy and
           the balance now live. -->
      <div
        class="scrollbar-hide -mr-5 flex gap-8 overflow-x-auto pr-5 lg:mr-0 lg:flex-wrap lg:gap-3 lg:overflow-visible lg:pb-0 lg:pr-0"
      >
        @for (link of links(); track link.id) {
          <a
            [routerLink]="link.path"
            [style.--pill-w]="link.width ? link.width + 'px' : null"
            class="flex shrink-0 flex-col items-center gap-2 text-sm font-normal text-[#383838] transition-all duration-200 hover:-translate-y-px lg:h-[50px] lg:w-[var(--pill-w,150px)] lg:flex-none lg:flex-row lg:justify-center lg:gap-2.5 lg:rounded-full lg:border-[1.5px] lg:border-[#E5E7EB] lg:bg-white lg:px-4 lg:text-[15px] lg:font-medium lg:text-[#1c1c1c] lg:shadow-sm lg:hover:border-[#A4BFFE7A] lg:hover:shadow-md"
          >
            @if (link.artSrc) {
              <!-- The illustration draws its own disc, so no circle behind it. -->
              <img
                [src]="link.artSrc"
                alt=""
                width="56"
                height="56"
                class="h-14 w-14 shrink-0 object-contain lg:h-9 lg:w-9"
              />
            } @else {
              <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full lg:h-10 lg:w-10"
                style="background: linear-gradient(180deg,#CDDDFE 0%,#E4EBFE 100%); border: 1px solid #A4BFFE7A"
              >
                <img
                  [src]="link.iconSrc"
                  alt=""
                  width="28"
                  height="28"
                  class="h-7 w-7 object-contain lg:h-5 lg:w-5"
                />
              </span>
            }
            <span class="whitespace-nowrap lg:min-w-0">{{
              link.label
            }}</span>
          </a>
        }
      </div>
    </section>
  `,
})
export class QuickLinks {
  readonly links = input.required<readonly LinkTile[]>();
}

@Component({
  selector: 'opd-more-services',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section>
      <h2 class="mb-4 text-[18px] font-medium leading-[1.2] text-[#1c1c1c] lg:mb-3 lg:text-xl">
        More Services
      </h2>
      <!-- Mobile: a row of pills scrolled sideways. Desktop: a four-up grid. -->
      <div
        class="scrollbar-hide -mr-5 flex gap-2.5 overflow-x-auto pr-5 lg:mr-0 lg:flex-wrap lg:gap-3 lg:overflow-visible lg:pb-0 lg:pr-0"
      >
        @for (service of services(); track service.id) {
          <a
            [routerLink]="service.path"
            class="flex h-[52px] shrink-0 items-center gap-3.5 rounded-2xl bg-white px-3.5 transition-all duration-200 lg:h-[60px] lg:flex-1 lg:justify-center lg:gap-3 lg:rounded-full lg:border-[1.5px] lg:border-[#E5E7EB] lg:px-5 lg:shadow-sm lg:hover:border-[#0F5FDC]"
          >
            <img
              [src]="service.iconSrc"
              alt=""
              width="24"
              height="24"
              class="h-7 w-7 shrink-0 object-contain lg:hidden"
            />
            <span
              class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full lg:flex"
              style="background: linear-gradient(180deg,#CDDDFE 0%,#E4EBFE 100%); border: 1px solid #A4BFFE7A"
            >
              <img [src]="service.iconSrc" alt="" width="24" height="24" class="object-contain" />
            </span>
            <span
              class="whitespace-nowrap text-[16px] text-[#1c1c1c] lg:text-base lg:font-medium lg:text-[#1c1c1c]"
            >
              @if (service.accent) {
                <span class="text-[#0F5FDC] lg:text-inherit">{{ service.accent }}</span>
              }
              <span>{{ service.accent && service.label ? ' ' : '' }}{{ service.label }}</span>
            </span>
          </a>
        }
      </div>
    </section>
  `,
})
export class MoreServices {
  readonly services = input.required<readonly LinkTile[]>();
}
