import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Money } from '../../core/domain/money';
import { Policy } from '../../core/member/policy';
import { WalletPool } from '../../core/member/wallet-pool.model';
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
      class="relative flex h-full min-h-[92px] flex-col rounded-[18px] border-[1.5px] border-[#EEF0F4] bg-white px-3.5 py-3 transition-all duration-200 hover:-translate-y-px hover:border-[#0F5FDC] lg:min-h-[104px] lg:rounded-[22px] lg:border-[1.5px] lg:border-[#EEF0F4] lg:px-[17px] lg:py-3.5 lg:hover:border-[#0F5FDC] shadow-[-2px_11px_46px_0_rgba(0,0,0,0.08)] lg:shadow-none"
    >
      <!-- The slot keeps its height when a category has no artwork, so the
           label and amount line up across the row. -->
      <span class="block h-[34px] w-[34px] lg:h-[38px] lg:w-[38px]" aria-hidden="true">
        @if (iconSrc(); as src) {
          <img [src]="src | remoteAsset" alt="" width="30" height="30" class="h-full w-full object-contain" />
        }
      </span>

      <!-- No per-category balance — balances sit at the pool level now, so
           the card is the icon, its name in brand blue, and the chevron. -->
      <h3 class="mt-auto pr-8 pt-2 text-[15px] font-normal leading-snug text-[#1061C4] lg:pr-9 lg:text-[16px]">
        {{ label() || category().label }}
      </h3>

      <span
        class="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#F1F3F7] text-[#1c1c1c] lg:bottom-4 lg:right-4"
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
  /** Shown on the web row only; the phone design leaves it out. */
  readonly webOnly?: boolean;
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

      <!-- Web: the row scrolls sideways between two arrow buttons. -->
      <div class="lg:flex lg:items-start lg:gap-3">
      <button
        type="button"
        class="hidden lg:mt-[10px] lg:flex lg:h-9 lg:w-9 lg:shrink-0 lg:items-center lg:justify-center lg:rounded-full lg:border-[1.5px] lg:border-[#0F5FDC] lg:bg-white lg:text-lg lg:font-semibold lg:leading-none lg:text-[#0F5FDC] lg:shadow-md lg:hover:bg-[#0F5FDC] lg:hover:text-white lg:disabled:cursor-not-allowed lg:disabled:border-[#CBD5E1] lg:disabled:text-[#94A3B8] lg:disabled:shadow-none lg:disabled:hover:bg-white"
        aria-label="Scroll quick actions left"
        [disabled]="atStart()"
        (click)="scrollRow(-1)"
      >‹</button>
      <div
        #row
        class="scrollbar-hide -mr-5 -mt-1.5 flex gap-2.5 overflow-x-auto pb-4 pr-5 pt-1.5 lg:mr-0 lg:min-w-0 lg:flex-1 lg:gap-[21px] lg:scroll-smooth lg:pb-8 lg:pr-0"
        (scroll)="onRowScroll()"
      >
        @for (link of links(); track link.id) {
          <a
            [routerLink]="link.path"
            [class.hidden]="link.webOnly"
            [class.lg:flex]="link.webOnly"
            class="flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#034DA21C] bg-white pl-2.5 pr-3.5 text-[13px] text-[#1c1c1c] transition-all duration-200 hover:-translate-y-px lg:h-[57px] lg:gap-3 lg:border-[#034DA21C] lg:pl-7 lg:pr-[30px] lg:text-[20px] lg:hover:border-[#0F5FDC]"
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
              >{{ link.lead ? link.lead + ' ' : '' }}<span class="text-[#0F5FDC] lg:font-medium lg:text-[#0E51A2]">{{ link.accent }}</span
              >{{ link.trail ? ' ' + link.trail : '' }}</span
            >
          </a>
        }
      </div>
      <button
        type="button"
        class="hidden lg:mt-[10px] lg:flex lg:h-9 lg:w-9 lg:shrink-0 lg:items-center lg:justify-center lg:rounded-full lg:border-[1.5px] lg:border-[#0F5FDC] lg:bg-white lg:text-lg lg:font-semibold lg:leading-none lg:text-[#0F5FDC] lg:shadow-md lg:hover:bg-[#0F5FDC] lg:hover:text-white lg:disabled:cursor-not-allowed lg:disabled:border-[#CBD5E1] lg:disabled:text-[#94A3B8] lg:disabled:shadow-none lg:disabled:hover:bg-white"
        aria-label="Scroll quick actions right"
        [disabled]="atEnd()"
        (click)="scrollRow(1)"
      >›</button>
      </div>
    </section>
  `,
})
export class QuickLinks {
  readonly links = input.required<readonly LinkTile[]>();

  private readonly row = viewChild<ElementRef<HTMLElement>>('row');
  protected readonly atStart = signal(true);
  protected readonly atEnd = signal(false);

  /** One step is most of the visible row, so a click always reveals new pills. */
  protected scrollRow(direction: 1 | -1): void {
    const el = this.row()?.nativeElement;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  protected onRowScroll(): void {
    const el = this.row()?.nativeElement;
    if (!el) return;
    this.atStart.set(el.scrollLeft < 1);
    this.atEnd.set(el.scrollWidth - el.clientWidth - el.scrollLeft < 1);
  }
}

/**
 * "Your Wallet Balance" — the web pop-up behind More Info. The overall balance,
 * then each pool with what it pays for; a pool opens to its categories.
 */
@Component({
  selector: 'opd-wallet-balance-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <!-- Above the floating bottom nav (z-60) and the shell's other overlays. -->
    <div class="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 lg:items-center lg:p-4" (click)="closed.emit()">
      <div
        class="sheet flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F7F7FC] shadow-2xl lg:max-h-[min(640px,85vh)] lg:max-w-[600px] lg:rounded-[24px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-balance-title"
        (click)="$event.stopPropagation()"
      >
        <div class="mx-5 flex items-center justify-between border-b-2 border-[#DADDE3] pb-3 pt-5 lg:mx-6 lg:pb-4 lg:pt-6">
          <h2 id="wallet-balance-title" class="text-[18px] font-normal text-[#1c1c1c] lg:text-[22px]">Your Wallet Balance</h2>
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full text-[#1c1c1c] hover:bg-white" aria-label="Close" (click)="closed.emit()">
            <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" /></svg>
          </button>
        </div>

        <div class="pools-scroll space-y-4 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pr-3 pt-4 lg:space-y-5 lg:px-6 lg:pb-6 lg:pr-4 lg:pt-5">
          <div
            class="rounded-[20px] px-5 py-4 text-white lg:px-7 lg:py-5"
            style="background: linear-gradient(180deg,#0A78E8 0%,#0560D2 100%); border: 1.5px solid rgba(91,153,249,.6); box-shadow: 0 8px 24px -8px rgba(5,96,210,.45)"
          >
            <p class="text-[13px] text-white/85">Available Balance</p>
            <p class="mt-2 whitespace-nowrap">
              <span class="text-[26px] font-medium leading-none lg:text-[30px]">₹{{ plain(available()) }}</span>
              <span class="text-base text-white/70"> / {{ plain(allocated()) }}</span>
            </p>
            <p class="mt-1 text-[13px] text-white/85">Your total usage cannot exceed this amount.</p>
          </div>

          @for (pool of pools(); track pool.id) {
            <div class="rounded-[20px] border border-[#EEF0F4] bg-white px-5 py-4 lg:px-7 lg:py-5" style="box-shadow: 0 4px 18px 0 rgba(0,0,0,.05)">
              <button type="button" class="flex w-full items-start justify-between gap-3 text-left" [attr.aria-expanded]="openPool() === pool.id" (click)="togglePool(pool.id)">
                <div class="flex flex-col gap-1.5">
                  <span class="whitespace-nowrap">
                    <span class="text-[24px] font-normal leading-none text-[#1c1c1c] lg:text-[28px]">₹{{ plain(pool.available) }}</span>
                    <span class="text-[15px] text-[#7A7A7A]"> / {{ plain(pool.allocated) }}</span>
                  </span>
                </div>
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8EEF9] text-[#1c1c1c]" [class.rotate-180]="openPool() === pool.id" aria-hidden="true"
                  ><svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" /></svg
                ></span>
              </button>
              <p class="mt-4 text-[13px] leading-snug text-[#7A7A7A]">{{ pool.description }}</p>
              @if (openPool() === pool.id) {
                <ul class="mt-4">
                  @for (c of pool.categories; track c.label) {
                    <li class="flex items-center justify-between border-b border-[#E5E7EB] py-2.5">
                      <span class="text-[13px] text-[#1c1c1c]">{{ c.label }}</span>
                      <span class="text-[15px] font-medium text-[#0E51A2]" [attr.aria-label]="'₹' + plain(c.used) + ' used'">₹{{ plain(c.used) }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    /* Always-visible scrollbar, as in the design. A styled WebKit scrollbar is
       never an overlay, so macOS cannot hide it between scrolls. */
    .pools-scroll { overflow-y: scroll; }
    /* Phones: a bottom sheet that slides up. */
    @media (max-width: 1023px) {
      .sheet { animation: sheet-up 0.22s ease-out; }
    }
    @keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .pools-scroll::-webkit-scrollbar { width: 7px; }
    .pools-scroll::-webkit-scrollbar-track { background: rgba(217, 217, 217, 0.54); border-radius: 4px; }
    .pools-scroll::-webkit-scrollbar-thumb { background: #b8b8b8; border-radius: 4px; }
    @supports not selector(::-webkit-scrollbar) {
      .pools-scroll { scrollbar-width: thin; scrollbar-color: #b8b8b8 rgba(217, 217, 217, 0.54); }
    }
  `,
})
export class WalletBalanceModal {
  readonly available = input.required<Money>();
  readonly allocated = input.required<Money>();
  readonly pools = input.required<readonly WalletPool[]>();
  readonly closed = output<void>();

  protected readonly openPool = signal<string | null>(null);

  protected togglePool(id: string): void {
    this.openPool.set(this.openPool() === id ? null : id);
  }

  protected plain(value: Money): string {
    return NUMBER.format(value.amount);
  }
}
