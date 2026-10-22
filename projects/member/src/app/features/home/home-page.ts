import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { BenefitCategory, toBenefitCategory } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { WalletCategoryBalance } from '../../core/wallet/wallet.model';
import { CartStore } from '../../core/lab/cart.store';
import { PolicyStore } from '../../core/member/policy.store';
import { ProfileMenu } from '../shell/profile-menu';
import { RemoteAssetPipe } from '../../shared/remote-asset.pipe';
import {
  BalanceSummary,
  BenefitCard,
  LinkTile,
  PolicyCard,
  QuickLinks,
  WalletBalanceModal,
} from './dashboard-cards';

/**
 * The design's own glyphs, from the Habit Health UI handoff
 * (public/images/icons/home). The Policy pill opens the member's own policy,
 * so the list is built per render rather than declared as a constant.
 */
function quickLinksFor(policyId: string | null): readonly LinkTile[] {
  return [
    {
      id: 'health-records',
      lead: 'Health',
      accent: 'Records',
      iconSrc: 'images/icons/home/action-health-records.svg',
      path: '/member/health-records',
    },
    {
      id: 'claims',
      accent: 'Claims',
      iconSrc: 'images/icons/home/action-claims.svg',
      path: '/member/claims',
    },
    {
      id: 'policy',
      lead: 'Download',
      accent: 'Policy',
      iconSrc: 'images/icons/home/action-download-policy.svg',
      path: policyId ? `/member/policy-details/${policyId}` : '/member/profile',
    },
    {
      id: 'help-support',
      lead: 'Help and',
      accent: 'Support',
      iconSrc: 'images/icons/home/action-help-support.svg',
      path: '/member/helpline',
    },
    {
      id: 'transactions',
      lead: 'Transaction',
      accent: 'History',
      iconSrc: 'images/icons/home/action-transaction-history.svg',
      path: '/member/transactions',
    },
  ];
}

/**
 * The design's artwork and wording per benefit card, from the handoff ZIP
 * (images/icons/home).
 */
const BENEFIT_ART: Readonly<Partial<Record<BenefitCategory, { icon: string; label: string }>>> = {
  [BenefitCategory.OnlineConsultation]: { icon: 'images/icons/home/benefit-online-consult.svg', label: 'Online Consult' },
  [BenefitCategory.InClinicConsultation]: { icon: 'images/icons/home/benefit-in-clinic.svg', label: 'In-Clinic Consultation' },
  [BenefitCategory.Pharmacy]: { icon: 'images/icons/home/benefit-pharmacy.svg', label: 'Pharmacy' },
  [BenefitCategory.Radiology]: { icon: 'images/icons/home/benefit-radiology.svg', label: 'Radiology/\u200BCardiology' },
  [BenefitCategory.Pathology]: { icon: 'images/icons/home/benefit-pathology.svg', label: 'Pathology (Lab)' },
  [BenefitCategory.Dental]: { icon: 'images/icons/home/benefit-dental.svg', label: 'Dental Services' },
  [BenefitCategory.Vision]: { icon: 'images/icons/home/benefit-vision.svg', label: 'Vision Care' },
  [BenefitCategory.Vaccination]: { icon: 'images/icons/home/benefit-vaccination.svg', label: 'Vaccination' },
  [BenefitCategory.HealthPackages]: { icon: 'images/icons/home/benefit-annual-health-check.svg', label: 'Annual Health Check' },
};

/**
 * Benefit cards open the per-category detail screen, keyed by the API's own
 * category code. Booking journeys (appointments, lab-tests, dental …) are
 * reached from there once those screens are ported.
 */
/**
 * Categories with a purpose-built screen. Everything else falls through to the
 * generic benefit detail, which composes balance, bookings and spend.
 */
const CATEGORY_SCREENS: Readonly<Partial<Record<BenefitCategory, string>>> = {
  // Eligibility-gated checkup package, not a spend category.
  [BenefitCategory.HealthPackages]: '/member/wellness',
  // Prescription -> order -> report journeys.
  [BenefitCategory.Pathology]: '/member/lab-tests',
  [BenefitCategory.Radiology]: '/member/diagnostics',
  // Pick-a-service-then-a-clinic journeys.
  [BenefitCategory.Vision]: '/member/vision',
  [BenefitCategory.Dental]: '/member/dental',
  // Specialty -> doctor journeys.
  [BenefitCategory.InClinicConsultation]: '/member/appointments/specialties',
  /*
   * The hub, not the specialties list.
   *
   * This card could only ever START a booking, even when a confirmed call was
   * minutes away — and the hub carrying the Join call button had no inbound
   * link at all. The hub leads with Book Consultation, so nothing is lost for
   * a member who wants a new one.
   */
  [BenefitCategory.OnlineConsultation]: '/member/online-consult',
  // Vaccine-then-vendor journey, same shape as vision/dental's pick-a-clinic flow.
  [BenefitCategory.Vaccination]: '/member/vaccination',
  // Search-and-cart journey — previously had no card destination at all,
  // the placeholder screen behind it was reachable only by direct URL.
  [BenefitCategory.Pharmacy]: '/member/pharmacy',
};

function benefitLink(categoryCode: string): string {
  return (
    CATEGORY_SCREENS[toBenefitCategory(categoryCode)] ?? `/member/benefits/${categoryCode}`
  );
}

@Component({
  selector: 'opd-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProfileMenu, PolicyCard, QuickLinks, BalanceSummary, BenefitCard, WalletBalanceModal, RemoteAssetPipe],
  template: `
    <div class="relative min-h-screen bg-[#f7f7fc]">
      <!-- Greeting — phone only; the shell carries it on the web. -->
      <section class="relative mx-auto max-w-[480px] px-5 pt-3 lg:hidden">
        <div class="flex items-center justify-between gap-4">
          <opd-profile-menu [showName]="true" />

          <!-- The design's own glyphs. brightness-0 paints the blue source
               files black. -->
          <div class="flex items-center gap-2.5">
            <a
              routerLink="/member/wallet"
              class="flex h-9 w-9 items-center justify-center rounded-full bg-[#fbfdfe] shadow-sm"
              aria-label="Wallet"
            >
              <img
                [src]="'images/icons/wallet-icon.svg' | remoteAsset"
                alt=""
                width="19"
                height="16"
                class="h-4 w-[19px] object-contain brightness-0"
              />
            </a>
            <a
              routerLink="/member/lab-tests"
              class="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#fbfdfe] shadow-sm"
              [attr.aria-label]="
                carts.openCount() ? 'Cart, ' + carts.openCount() + ' open' : 'Cart'
              "
            >
              <img
                [src]="'images/icons/cart-icon.svg' | remoteAsset"
                alt=""
                width="18"
                height="18"
                class="h-[18px] w-[18px] object-contain brightness-0"
              />
              @if (carts.openCount(); as open) {
                <span
                  class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F58220] px-1 text-[11px] font-bold text-white"
                  >{{ open > 9 ? '9+' : open }}</span
                >
              }
            </a>
          </div>
        </div>
      </section>

      <div class="relative mx-auto max-w-[480px] lg:max-w-[1240px] lg:px-8 lg:pt-6">
        <!-- Web: balance and policy on the left, Health Benefits on the right
             behind a hairline. Phone: one column, in the design's order. -->
        <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <!-- LEFT: balance + policy -->
          <div class="flex flex-col items-center px-5 pt-10 lg:px-0 lg:pt-3">
            @if (isLoading()) {
              <!-- SKELETON: Balance Summary -->
              <div class="flex flex-col items-center animate-pulse py-2" role="status" aria-label="Loading balance">
                <div class="h-4 w-32 rounded bg-slate-200"></div>
                <div class="mt-2.5 h-9 w-56 rounded bg-slate-200"></div>
                <div class="mt-4 h-7 w-28 rounded-full bg-slate-200"></div>
              </div>
            } @else if (error(); as err) {
              <!-- Error State for Balance -->
              <div class="text-center py-2">
                <p class="text-[13px] text-[#3a3a3a] lg:text-[15px]">Available Balance</p>
                <p class="mt-2 text-2xl font-semibold text-[#8b8b8b] lg:text-3xl">-- / --</p>
              </div>
            } @else {
              <!-- Live balance summary from active policy version -->
              <opd-balance-summary
                [available]="walletTotal.available"
                [allocated]="walletTotal.allocated"
              />
              <!-- The pool-level breakdown behind the total. -->
              <button
                type="button"
                class="mt-4 inline-flex items-center gap-2 rounded-full bg-white py-1 pl-3.5 pr-1.5 text-sm text-[#1c1c1c] shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_14px_rgba(0,0,0,0.14)]"
                aria-haspopup="dialog"
                (click)="walletInfoOpen.set(true)"
              >
                More Info
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8EEF9]" aria-hidden="true"
                  ><svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" /></svg
                ></span>
              </button>
              @if (walletInfoOpen()) {
                <opd-wallet-balance-modal
                  [available]="walletTotal.available"
                  [allocated]="walletTotal.allocated"
                  [pools]="walletPools"
                  (closed)="walletInfoOpen.set(false)"
                />
              }
            }

            @if (isLoading()) {
              <!-- SKELETON: Policy Card (aspect-[2.13] matches PolicyCard exactly, preventing layout shift) -->
              <div class="mt-8 w-full lg:mt-[36px] lg:w-[500px]" role="status" aria-label="Loading policy details">
                <div
                  class="flex aspect-[2.13] w-full flex-col justify-between rounded-[20px] bg-slate-200/90 p-[6%] animate-pulse lg:rounded-[32px]"
                >
                  <div class="h-7 w-3/5 rounded-lg bg-slate-300"></div>
                  <div class="my-2 h-px w-full bg-slate-300/70"></div>
                  <div class="space-y-3 lg:space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="h-4 w-28 rounded bg-slate-300"></div>
                      <div class="h-4 w-36 rounded bg-slate-300"></div>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="h-4 w-20 rounded bg-slate-300"></div>
                      <div class="h-4 w-28 rounded bg-slate-300"></div>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="h-4 w-24 rounded bg-slate-300"></div>
                      <div class="h-4 w-36 rounded bg-slate-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            } @else if (error(); as err) {
              <!-- ERROR STATE -->
              <div class="mt-8 flex w-full flex-col items-center justify-center rounded-[20px] border border-red-200 bg-white p-6 text-center shadow-sm lg:mt-[36px] lg:w-[500px] lg:rounded-[32px] lg:p-8" role="alert">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 class="mt-3 text-base font-semibold text-slate-800">Unable to load policy</h3>
                <p class="mt-1 max-w-sm text-xs text-slate-500">{{ err.message || 'Something went wrong while fetching your policy information.' }}</p>
                <button
                  type="button"
                  class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#034DA2] px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#023B7C]"
                  (click)="retry()"
                >
                  Try Again
                </button>
              </div>
            } @else if (!policies().length) {
              <!-- EMPTY STATE (NO POLICY) -->
              <div class="mt-8 flex w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm lg:mt-[36px] lg:w-[500px] lg:rounded-[32px] lg:p-10">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#034DA2]">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 class="mt-3 text-base font-semibold text-slate-800">No Policy Assigned</h3>
                <p class="mt-1 max-w-sm text-xs text-slate-500">
                  No active OPD policy is assigned to your account yet. Please contact your company administrator or HR if you need assistance.
                </p>
              </div>
            } @else {
              <div class="relative mt-8 w-full lg:mt-[36px] lg:w-[500px]">
                <!-- Web: arrows either side of the card page between policies. -->
                @if (policies().length > 1) {
                  <button
                    type="button"
                    class="absolute -left-14 top-[calc(50%-30px)] hidden lg:flex flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#0F5FDC] bg-white text-lg font-semibold leading-none text-[#0F5FDC] shadow-md hover:bg-[#0F5FDC] hover:text-white disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:text-[#94A3B8] disabled:shadow-none disabled:hover:bg-white"
                    aria-label="Previous policy"
                    [disabled]="activeIndex() === 0"
                    (click)="scrollToPolicy(activeIndex() - 1)"
                  >‹</button>
                  <button
                    type="button"
                    class="absolute -right-14 top-[calc(50%-30px)] hidden lg:flex flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#0F5FDC] bg-white text-lg font-semibold leading-none text-[#0F5FDC] shadow-md hover:bg-[#0F5FDC] hover:text-white disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:text-[#94A3B8] disabled:shadow-none disabled:hover:bg-white"
                    aria-label="Next policy"
                    [disabled]="activeIndex() === policies().length - 1"
                    (click)="scrollToPolicy(activeIndex() + 1)"
                  >›</button>
                }
                <!-- Bleeds off the right edge on a phone: the next card is meant
                     to be clipped by the screen, not by a gutter. On the web the
                     track is exactly one card wide, so only the open policy shows
                     and the dots below page between them. -->
                <div
                  #policyScroller
                  class="scrollbar-hide -mr-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-6 pr-5 lg:mr-0 lg:gap-5 lg:pr-0"
                  (scroll)="onPolicyScroll()"
                >
                  @for (policy of policies(); track policy.holderId; let i = $index) {
                    <!-- The card being read is full size, the rest sit back at
                         0.85, shrinking toward the edge that faces the active one
                         so the gap stays at the flex gap. A transform, not a
                         width, so the scroll offsets never move. -->
                    <opd-policy-card
                      class="w-[90%] shrink-0 snap-start transition-transform duration-300 lg:w-[500px]"
                      [policy]="policy"
                      [style.transform]="policies().length > 1 && i !== activeIndex() ? 'scale(0.85)' : null"
                      [style.transform-origin]="i < activeIndex() ? 'right center' : 'left center'"
                    />
                  }
                </div>
                @if (policies().length > 1) {
                  <div class="hidden items-center justify-center gap-1.5 lg:flex">
                    @for (policy of policies(); track policy.holderId; let i = $index) {
                      <button
                        type="button"
                        class="rounded-full transition-all duration-200"
                        [class]="i === activeIndex() ? 'h-2 w-2 bg-[#034DA2]' : 'h-1.5 w-1.5 bg-[#7FA6DD]'"
                        [attr.aria-label]="'Go to policy ' + (i + 1)"
                        [attr.aria-current]="i === activeIndex() ? 'true' : null"
                        (click)="scrollToPolicy(i)"
                      ></button>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Phone: Quick Links sit between the policy and the benefits. -->
          <div class="px-5 pt-4 lg:hidden">
            <opd-quick-links [links]="quickLinks()" />
          </div>

          <!-- RIGHT: Health Benefits -->
          @if (isLoading()) {
            <!-- SKELETON: Health Benefits Grid -->
            <section
              class="px-5 pb-28 pt-2 lg:ml-8 lg:w-[549px] lg:border-l lg:border-[#E5E7EB] lg:px-0 lg:pb-0 lg:pl-8 lg:pt-0"
              role="status"
              aria-label="Loading health benefits"
            >
              <div class="mb-4 h-6 w-36 rounded bg-slate-200 animate-pulse lg:mb-[26px]"></div>
              <div class="grid grid-cols-2 gap-x-3.5 gap-y-3.5 lg:grid-cols-[223px_223px] lg:gap-x-[22px] lg:gap-y-6">
                @for (item of [1, 2, 3, 4, 5, 6]; track item) {
                  <div
                    class="flex h-full min-h-[92px] flex-col justify-between rounded-[18px] border-[1.5px] border-[#EEF0F4] bg-white p-3.5 shadow-sm animate-pulse lg:min-h-[104px] lg:rounded-[22px] lg:p-4"
                  >
                    <div class="h-8 w-8 rounded-full bg-slate-200"></div>
                    <div class="mt-4 h-4 w-28 rounded bg-slate-200"></div>
                  </div>
                }
              </div>
            </section>
          } @else if (categories().length) {
            <section
              class="px-5 pb-28 pt-2 lg:ml-8 lg:w-[549px] lg:border-l lg:border-[#E5E7EB] lg:px-0 lg:pb-0 lg:pl-8 lg:pt-0"
            >
              <h2 class="mb-4 text-[15px] font-medium leading-[1.2] text-[#1c1c1c] lg:mb-[26px] lg:text-[22px]">
                <!-- The phone design calls them cashless benefits. -->
                <span class="lg:hidden">Cashless Benefits</span><span class="hidden lg:inline">Health Benefits</span>
              </h2>
              <!-- Web: a fixed-height panel that scrolls, as in the design;
                   two 223px columns of name-only cards. -->
              <div class="benefits-panel lg:-mt-1 lg:max-h-[368px] lg:pl-0.5 lg:pr-9 lg:pt-1">
                <div class="grid grid-cols-2 gap-x-3.5 gap-y-3.5 lg:grid-cols-[223px_223px] lg:gap-x-[22px] lg:gap-y-6 lg:pb-2">
                  @for (category of categories(); track category.label) {
                    <opd-benefit-card
                      [category]="category"
                      [href]="linkFor(category.code)"
                      [iconSrc]="artFor(category)?.icon ?? null"
                      [label]="artFor(category)?.label ?? null"
                    />
                  }
                </div>
              </div>
            </section>
          } @else if (!error()) {
            <!-- Empty state for Health Benefits when policy has no categories -->
            <section
              class="px-5 pb-28 pt-2 lg:ml-8 lg:w-[549px] lg:border-l lg:border-[#E5E7EB] lg:px-0 lg:pb-0 lg:pl-8 lg:pt-0"
            >
              <h2 class="mb-4 text-[15px] font-medium leading-[1.2] text-[#1c1c1c] lg:mb-[26px] lg:text-[22px]">
                <span class="lg:hidden">Cashless Benefits</span><span class="hidden lg:inline">Health Benefits</span>
              </h2>
              <div class="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white p-8 text-center">
                <p class="text-sm font-medium text-slate-700">No benefits available</p>
                <p class="mt-1 text-xs text-slate-500">There are no health benefit categories configured for your active policy.</p>
              </div>
            </section>
          }
        </div>

        <!-- Web: Quick Actions across the full width, below both columns. -->
        <div class="hidden pb-10 lg:mt-7 lg:block">
          <opd-quick-links [links]="quickLinks()" />
        </div>
      </div>
    </div>
  `,
  styles: `
    /* Always-visible scrollbar, as in the design. A styled WebKit scrollbar is
       never an overlay, so macOS cannot hide it between scrolls. */
    @media (min-width: 1024px) {
      .benefits-panel { overflow-y: scroll; }
      .benefits-panel::-webkit-scrollbar { width: 7px; }
      .benefits-panel::-webkit-scrollbar-track { background: rgba(217, 217, 217, 0.54); border-radius: 4px; }
      .benefits-panel::-webkit-scrollbar-thumb { background: #b8b8b8; border-radius: 4px; }
    }
    @supports not selector(::-webkit-scrollbar) {
      .benefits-panel { scrollbar-width: thin; scrollbar-color: #b8b8b8 rgba(217, 217, 217, 0.54); }
    }
  `,
})
export class HomePage {

  protected readonly family = inject(FamilyStore);
  protected readonly policyStore = inject(PolicyStore);
  protected readonly carts = inject(CartStore);

  protected get walletTotal() {
    return this.policyStore.walletTotal();
  }

  protected readonly activeIndex = signal(0);
  protected get walletPools() {
    return this.policyStore.pools();
  }
  protected readonly walletInfoOpen = signal(false);

  private readonly policyScroller = viewChild<ElementRef<HTMLElement>>('policyScroller');

  /** Offsets are measured from the track, not assumed: the gap changes at lg. */
  private cards(): readonly HTMLElement[] {
    const track = this.policyScroller()?.nativeElement;
    return track ? ([...track.children] as HTMLElement[]) : [];
  }

  protected scrollToPolicy(index: number): void {
    const track = this.policyScroller()?.nativeElement;
    const cards = this.cards();
    if (!track || !cards[index]) return;
    // Set immediately so the dot responds even before the smooth scroll lands.
    this.activeIndex.set(index);
    track.scrollTo({ left: cards[index].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
  }

  /** Keeps the dots and the dimming in step with a drag or swipe. */
  protected onPolicyScroll(): void {
    const index = this.nearestCard();
    if (index !== this.activeIndex()) this.activeIndex.set(index);
  }

  /**
   * The card nearest the left edge — except at the end of the track, which is
   * its own case: cards peek, so the last one can never reach that edge. A
   * stride-based index therefore never left the first card on a two-policy
   * carousel, and nothing ever dimmed.
   */
  private nearestCard(): number {
    const track = this.policyScroller()?.nativeElement;
    const cards = this.cards();
    if (!track || cards.length < 2) return 0;
    if (track.scrollWidth - track.clientWidth - track.scrollLeft < 1) return cards.length - 1;

    const offset = cards[0].offsetLeft + track.scrollLeft;
    const distance = (card: HTMLElement) => Math.abs(card.offsetLeft - offset);
    return cards.reduce(
      (best, card, i) => (distance(card) < distance(cards[best]) ? i : best),
      0,
    );
  }

  protected readonly greetingName = computed(() => this.family.activeMember()?.fullName ?? 'there');
  protected readonly policies = computed(() => this.family.policies());
  protected readonly quickLinks = computed(() => quickLinksFor(this.policies()[0]?.id ?? null));

  /** Category balances derived from the member's active policy version. */
  protected readonly categories = computed(() => this.policyStore.categories());

  protected readonly isLoading = computed(() => this.family.loading() || this.policyStore.loading());
  protected readonly error = computed(() => this.policyStore.error() ?? this.family.error());

  constructor() {
    effect(() => {
      // Whenever active member changes, reset carousel position to the first card
      this.family.activeMember();
      this.activeIndex.set(0);
      const track = this.policyScroller()?.nativeElement;
      if (track) {
        track.scrollLeft = 0;
      }
    });
  }

  protected retry(): void {
    if (this.family.error()) {
      this.family.retry();
    } else {
      this.policyStore.retry();
    }
  }

  protected artFor(category: WalletCategoryBalance): { icon: string; label: string } | null {
    return BENEFIT_ART[category.category] ?? null;
  }

  protected linkFor(categoryCode: string): string {
    return categoryCode ? benefitLink(categoryCode) : '/member/benefits';
  }
}
