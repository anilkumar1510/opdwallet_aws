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
import { WalletCategoryBalance } from '../../core/wallet/wallet.model';
import { CartStore } from '../../core/lab/cart.store';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import {
  STATIC_BENEFITS,
  STATIC_POLICIES,
  STATIC_WALLET_TOTAL,
} from '../../core/member/static-policy.data';
import { ProfileMenu } from '../shell/profile-menu';
import { RemoteAssetPipe } from '../../shared/remote-asset.pipe';
import {
  BalanceSummary,
  BenefitCard,
  LinkTile,
  PolicyCard,
  QuickLinks,
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
      id: 'transactions',
      lead: 'Transaction',
      accent: 'History',
      iconSrc: 'images/icons/home/action-transaction-history.svg',
      path: '/member/transactions',
    },
    {
      // Also the design's "Help and Support" pill: same screen, and the
      // handoff ships no separate glyph for it.
      id: 'helpline',
      accent: '24/7',
      trail: 'Helpline',
      iconSrc: 'images/icons/home/action-helpline.svg',
      path: '/member/helpline',
    },
  ];
}

/**
 * The design's artwork and wording per benefit card. The handoff has no
 * Vaccination artwork; its syringe is drawn in-house in the same line style.
 */
const BENEFIT_ART: Readonly<Partial<Record<BenefitCategory, { icon: string; label: string }>>> = {
  [BenefitCategory.OnlineConsultation]: { icon: 'images/icons/home/benefit-online-consult.svg', label: 'Online Consult' },
  [BenefitCategory.InClinicConsultation]: { icon: 'images/icons/home/benefit-in-clinic.svg', label: 'In-Clinic Consultation' },
  [BenefitCategory.Pharmacy]: { icon: 'images/icons/home/benefit-pharmacy.svg', label: 'Pharmacy' },
  [BenefitCategory.Radiology]: { icon: 'images/icons/home/benefit-radiology.svg', label: 'Radiology/Cardiology' },
  [BenefitCategory.Pathology]: { icon: 'images/icons/home/benefit-pathology.svg', label: 'Pathology (Lab)' },
  [BenefitCategory.Dental]: { icon: 'images/icons/home/benefit-dental.svg', label: 'Dental Services' },
  [BenefitCategory.Vision]: { icon: 'images/icons/home/benefit-vision.png', label: 'Vision Care' },
  [BenefitCategory.Vaccination]: { icon: 'images/icons/home/benefit-vaccination.svg', label: 'Vaccination' },
  // The design's "Wellness Programs" art; the card is the health check package.
  [BenefitCategory.HealthPackages]: { icon: 'images/icons/home/benefit-wellness.png', label: 'Annual Health Check' },
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
  imports: [RouterLink, ProfileMenu, PolicyCard, QuickLinks, BalanceSummary, BenefitCard, RemoteAssetPipe],
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
              routerLink="/member/notifications"
              class="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#fbfdfe] shadow-sm"
              [attr.aria-label]="
                notifications.unread()
                  ? 'Notifications, ' + notifications.unread() + ' unread'
                  : 'Notifications'
              "
            >
              <img
                [src]="'images/icons/notification-bell.svg' | remoteAsset"
                alt=""
                width="16"
                height="18"
                class="h-[18px] w-4 object-contain brightness-0"
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
            <!-- DUMMY / STATIC — benefit wallet total, no wallet API. -->
            <opd-balance-summary
              [available]="walletTotal.available"
              [allocated]="walletTotal.allocated"
            />

            @if (policies().length) {
              <div class="mt-8 w-full lg:mt-[52px] lg:w-[500px]">
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
                      [style.transform]="i === activeIndex() ? null : 'scale(0.85)'"
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
            } @else {
              <p class="mt-8 text-sm text-ink-500">No policy assigned yet.</p>
            }
          </div>

          <!-- Phone: Quick Links sit between the policy and the benefits. -->
          <div class="px-5 pt-4 lg:hidden">
            <opd-quick-links [links]="quickLinks()" />
          </div>

          <!-- RIGHT: Health Benefits -->
          @if (categories().length) {
            <section
              class="px-5 pb-28 pt-2 lg:ml-8 lg:w-[510px] lg:border-l lg:border-[#E5E7EB] lg:px-0 lg:pb-0 lg:pl-8 lg:pt-0"
            >
              <h2 class="mb-4 text-[15px] font-medium leading-[1.2] text-[#1c1c1c] lg:mb-[26px] lg:text-[22px]">
                Health Benefits
              </h2>
              <!-- Web: a fixed-height panel that scrolls, as in the design;
                   two 223px columns. -->
              <div class="benefits-scroll lg:max-h-[380px] lg:overflow-y-auto lg:pr-4">
                <div class="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-[223px_223px] lg:gap-x-6 lg:gap-y-4 lg:pb-2">
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
    /* The design's thin always-visible track on the benefits panel. */
    .benefits-scroll { scrollbar-width: thin; scrollbar-color: #b8b8b8 rgba(217, 217, 217, 0.54); }
  `,
})
export class HomePage {

  protected readonly family = inject(FamilyStore);
  // DUMMY / STATIC — the home wallet total no longer reads wallet/balance.
  protected readonly walletTotal = STATIC_WALLET_TOTAL;
  protected readonly notifications = inject(NotificationsStore);
  protected readonly carts = inject(CartStore);

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

  protected artFor(category: WalletCategoryBalance): { icon: string; label: string } | null {
    return BENEFIT_ART[category.category] ?? null;
  }

  protected linkFor(categoryCode: string): string {
    return categoryCode ? benefitLink(categoryCode) : '/member/benefits';
  }
}
