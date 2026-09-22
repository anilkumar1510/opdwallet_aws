import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { BenefitCategory, toBenefitCategory } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { CartStore } from '../../core/lab/cart.store';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import {
  STATIC_BENEFITS,
  STATIC_POLICIES,
  STATIC_WALLET_TOTAL,
} from '../../core/member/static-policy.data';
import { ProfileMenu } from '../shell/profile-menu';
import {
  BenefitCard,
  LinkTile,
  MoreServices,
  PolicyCard,
  QuickLinks,
  WalletBalanceCard,
} from './dashboard-cards';

/**
 * Icon files are web-member's own, copied into this app's public folder.
 *
 * The Policy tile opens the member's own policy, so the list is built per
 * render rather than declared as a constant. My Family is not here — the
 * design's row is four tiles and it stays reachable from All Services.
 */
function quickLinksFor(policyId: string | null): readonly LinkTile[] {
  return [
    {
      id: 'bookings',
      label: 'Bookings',
      iconSrc: 'images/icons/quicklink-my-bookings.svg',
      artSrc: 'images/icons/quicklink-my-bookings.png',
      path: '/member/bookings',
    },
    {
      id: 'claims',
      label: 'Claims',
      iconSrc: 'images/icons/quicklink-claims.svg',
      artSrc: 'images/icons/quicklink-claims.png',
      path: '/member/claims',
    },
    {
      id: 'policy',
      label: 'Policy',
      iconSrc: 'images/icons/quicklink-download-policy.svg',
      artSrc: 'images/icons/quicklink-download-policy.png',
      path: policyId ? `/member/policy-details/${policyId}` : '/member/profile',
    },
    {
      id: 'health-records',
      label: 'Records',
      iconSrc: 'images/icons/quicklink-health-records.svg',
      artSrc: 'images/icons/quicklink-health-records.png',
      path: '/member/health-records',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      iconSrc: 'images/icons/quicklink-transaction-history.svg',
      artSrc: 'images/icons/quicklink-transaction-history.png',
      width: 200,
      path: '/member/transactions',
    },
    {
      id: 'support',
      label: 'Support',
      iconSrc: 'images/icons/helpline-icon.png',
      artSrc: 'images/icons/quicklink-support.png',
      path: '/member/helpline',
    },
  ];
}

const MORE_SERVICES: readonly LinkTile[] = [
  {
    id: 'helpline',
    accent: '24/7',
    label: 'Helpline',
    iconSrc: 'images/icons/helpline-icon.png',
    path: '/member/helpline',
  },
  {
    id: 'claims',
    label: 'Claims',
    iconSrc: 'images/icons/claims-service.png',
    path: '/member/claims',
  },
  {
    id: 'health-records',
    accent: 'Health',
    label: 'Records',
    iconSrc: 'images/icons/health-records-service.png',
    path: '/member/health-records',
  },
  {
    id: 'transactions',
    accent: 'Transaction History',
    label: '',
    iconSrc: 'images/icons/transaction-history.svg',
    path: '/member/transactions',
  },
];

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
  imports: [
    RouterLink,
    ProfileMenu,
    PolicyCard,
    QuickLinks,
    WalletBalanceCard,
    BenefitCard,
    MoreServices,
  ],
  template: `
    <div class="relative min-h-screen bg-[#f7f7fc]">
      <!-- Phone: the blue field the greeting sits on, which the policy cards
           overlap by about half. Desktop keeps the plain page background. -->
      <div
        class="absolute inset-x-0 top-0 h-[194px] lg:hidden"
        style="background: linear-gradient(180deg,#1F77E0 0%,#0E51A2 100%)"
        aria-hidden="true"
      ></div>

      <!-- Greeting -->
      <section
        class="relative mx-auto max-w-[480px] px-5 pt-3 lg:max-w-[1240px] lg:px-8 lg:pb-4 lg:pt-6"
      >
        <div class="flex items-center justify-between gap-4 lg:hidden">
          <opd-profile-menu [showName]="true" />

          <!-- The design's own glyphs. brightness-0 paints the blue source
               files black, the same trick the shell uses to paint them white. -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/member/notifications"
              class="relative flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#fbfdfe] shadow-sm lg:h-10 lg:w-10"
              [attr.aria-label]="
                notifications.unread()
                  ? 'Notifications, ' + notifications.unread() + ' unread'
                  : 'Notifications'
              "
            >
              <img
                src="images/icons/notification-bell.svg"
                alt=""
                width="14"
                height="16"
                class="h-4 w-[14px] object-contain brightness-0"
              />
              @if (notifications.unread(); as unread) {
                <span
                  class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F58220] px-1 text-[11px] font-bold text-white"
                  >{{ unread > 9 ? '9+' : unread }}</span
                >
              }
            </a>
            <a
              routerLink="/member/wallet"
              class="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#fbfdfe] shadow-sm lg:h-10 lg:w-10"
              aria-label="Wallet"
            >
              <img
                src="images/icons/wallet-icon.svg"
                alt=""
                width="17"
                height="14"
                class="h-[14px] w-[17px] object-contain brightness-0"
              />
            </a>
            <a
              routerLink="/member/lab-tests"
              class="relative flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#fbfdfe] shadow-sm lg:h-10 lg:w-10"
              [attr.aria-label]="
                carts.openCount() ? 'Cart, ' + carts.openCount() + ' open' : 'Cart'
              "
            >
              <img
                src="images/icons/cart-icon.svg"
                alt=""
                width="16"
                height="16"
                class="h-4 w-4 object-contain brightness-0"
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

      <div class="relative mx-auto max-w-[480px] lg:max-w-[1240px] lg:px-8 lg:pt-1">
        <!-- Quick Actions spans the full width above the two columns. It used to
             sit in the left column as a vertical stack; the sidebar now carries
             the policy and the balance instead. -->
        <div class="hidden lg:mb-[46px] lg:block">
          <opd-quick-links [links]="quickLinks()" />
        </div>

        <!-- The sidebar is the width of the balance card, 411px to spec. 411 + 28 gap
             + 727 of benefit cards = 1166, inside the 1176 of content width. -->
        <div class="lg:grid lg:grid-cols-[411px_minmax(0,1fr)] lg:items-start lg:gap-7">
          <!-- LEFT: policy + quick links -->
          <div class="lg:flex lg:flex-col lg:gap-[46px]">
            <section class="px-5 pt-6 lg:px-0 lg:pt-0">
              <h2
                class="mb-4 text-[18px] font-medium leading-[1.2] text-white lg:mb-3 lg:text-xl lg:text-[#1c1c1c]"
              >
                Your Policies
              </h2>

              @if (policies().length) {
                <!-- Bleeds off the right edge on a phone: the next card is meant
                     to be clipped by the screen, not by a gutter. On the web the
                     track is exactly one card wide, so only the open policy shows
                     and the dots below page between them. -->
                <div
                  #policyScroller
                  class="scrollbar-hide -mr-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pr-5 lg:mr-0 lg:w-[411px] lg:gap-5 lg:pr-0"
                  (scroll)="onPolicyScroll()"
                >
                  @for (policy of policies(); track policy.holderId; let i = $index) {
                    <!-- The card being read is full size, the rest sit back at
                         0.85. Each shrinks toward the edge that faces the active
                         card, so the gap between them stays at the flex gap
                         whichever side you came from. A transform, not a width,
                         so the scroll offsets never move. -->
                    <opd-policy-card
                      class="w-[75%] shrink-0 snap-start transition-transform duration-300 lg:w-[411px]"
                      [policy]="policy"
                      [style.transform]="i === activeIndex() ? null : 'scale(0.85)'"
                      [style.transform-origin]="i < activeIndex() ? 'right center' : 'left center'"
                    />
                  }
                </div>

                @if (policies().length > 1) {
                  <div class="mt-4 hidden justify-center gap-1.5 lg:mt-1 lg:flex">
                    @for (policy of policies(); track policy.holderId; let i = $index) {
                      <button
                        type="button"
                        class="h-1 rounded-full transition-all duration-200"
                        [class]="i === activeIndex() ? 'w-[14px] bg-[#1E3A8C]' : 'w-1 bg-[#cbd5e1]'"
                        [attr.aria-label]="'Go to policy ' + (i + 1)"
                        [attr.aria-current]="i === activeIndex() ? 'true' : null"
                        (click)="scrollToPolicy(i)"
                      ></button>
                    }
                  </div>
                }
              } @else {
                <p class="text-sm text-white lg:text-ink-500">No policy assigned yet.</p>
              }
            </section>

            <div class="px-5 pt-6 lg:hidden">
              <opd-quick-links [links]="quickLinks()" />
            </div>

            <!-- The balance sits under the policy in the sidebar on desktop now,
                 as the blue card rather than the white one. -->
            <div class="hidden lg:block">
              <!-- DUMMY / STATIC — ₹40,000 benefit wallet, no wallet API. -->
              <opd-wallet-balance-card
                [available]="walletTotal.available"
                [allocated]="walletTotal.allocated"
                [preferBlue]="true"
              />
            </div>
          </div>

          <!-- RIGHT: wallet + benefits + more services -->
          <div class="lg:flex lg:flex-col lg:gap-[46px]">
            <div class="px-5 pt-6 lg:hidden">
              <!-- DUMMY / STATIC — ₹40,000 benefit wallet, no wallet API. -->
              <opd-wallet-balance-card
                [available]="walletTotal.available"
                [allocated]="walletTotal.allocated"
              />
            </div>

            @if (categories().length) {
              <!-- No lg:flex-1: the left column is the taller of the two, and
                   stretching this one parked all the slack between the benefit
                   cards and More Services. It belongs below the column. -->
              <section class="px-5 pt-6 lg:px-0 lg:pt-0">
                <h2 class="mb-4 text-[18px] font-medium leading-[1.2] text-[#1c1c1c] lg:mb-3 lg:text-xl">
                  Health Benefits
                </h2>
                <!-- Fixed 305.5 x 99 cards on desktop (355.5 less the 50 asked for). The
                     columns are sized rather than fractional so the cards do not
                     stretch to fill the column, which is what made them 418 wide. -->
                <div
                  class="grid grid-cols-2 gap-x-1.5 gap-y-4 lg:grid-cols-[305.5px_305.5px] lg:gap-3 lg:auto-rows-[99px]"
                >
                  @for (category of categories(); track category.label) {
                    <opd-benefit-card [category]="category" [href]="linkFor(category.code)" />
                  }
                </div>
              </section>
            }

            <div class="px-5 pb-4 pt-6 lg:hidden">
              <opd-more-services [services]="moreServices" />
            </div>
          </div>
        </div>

        <div class="hidden lg:mt-[46px] lg:block">
          <opd-more-services [services]="moreServices" />
        </div>

        <div class="h-2 lg:hidden" aria-hidden="true"></div>
      </div>
    </div>
  `,
})
export class HomePage {

  protected readonly family = inject(FamilyStore);
  // DUMMY / STATIC — the home wallet total no longer reads wallet/balance.
  protected readonly walletTotal = STATIC_WALLET_TOTAL;
  protected readonly notifications = inject(NotificationsStore);
  protected readonly carts = inject(CartStore);

  protected readonly moreServices = MORE_SERVICES;
  protected readonly activeIndex = signal(0);

  private readonly policyScroller = viewChild<ElementRef<HTMLElement>>('policyScroller');

  /** Offsets are measured from the track, not assumed: the gap changes at lg. */
  private cards(): readonly HTMLElement[] {
    const track = this.policyScroller()?.nativeElement;
    return track ? ([...track.children] as HTMLElement[]) : [];
  }

  protected scrollToPolicy(index: number): void {
    const track = this.policyScroller()?.nativeElement;
    const cards = this.cards();
    if (!track || !cards.length) return;
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
  // DUMMY / STATIC — the policy card no longer derives from member/profile
  // assignments; it is served from static-policy.data.ts. See REMOVED-APIS.md.
  protected readonly policies = computed(() => STATIC_POLICIES);
  protected readonly quickLinks = computed(() => quickLinksFor(this.policies()[0]?.id ?? null));

  /** Highest balance first, matching the reference dashboard's ordering. */
  // DUMMY / STATIC — the Health Benefits cards no longer read wallet/balance
  // categories; they are served from STATIC_BENEFITS in the requested order.
  // See REMOVED-APIS.md.
  protected readonly categories = computed(() => STATIC_BENEFITS);

  protected linkFor(categoryCode: string): string {
    return categoryCode ? benefitLink(categoryCode) : '/member/benefits';
  }
}
