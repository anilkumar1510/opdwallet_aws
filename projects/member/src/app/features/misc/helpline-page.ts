import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingsStore } from '../../core/bookings/bookings.store';
import { Booking } from '../../core/bookings/booking.model';
import { Claim } from '../../core/claims/claim.model';
import { ClaimsStore } from '../../core/claims/claims.store';
import { formatMoney } from '../../core/domain/money';
import { Disclosure } from '../../shared/ui/disclosure';
import { Icon } from '../../shared/ui/icon';
import { SupportRequest } from './support-request';

const SUPPORT_EMAIL = 'support@opdwallet.com';

/**
 * Support, at `/member/helpline` — reached from the Support quick link.
 *
 * It used to be a bare "Coming Soon" panel with an email address. A member with a
 * rejected claim or a service that went wrong had to compose the whole story
 * themselves, from memory, including the reference the support desk would ask for
 * first.
 *
 * Two lists now sit above the contact block:
 *   - **claims that need help** — the ones the API says are stuck on the member:
 *     DOCUMENTS_REQUIRED, RESUBMISSION_REQUIRED and REJECTED
 *   - **services already used** — completed bookings and orders, most recent first
 *
 * **There is no support-ticket API**, in this codebase or either reference — no
 * controller matches support/ticket/help/grievance. So "Ask for help" is a
 * `mailto:` with the reference, the status and the date already filled in. That
 * is the honest ceiling of what the portal can do today: it cannot open a ticket,
 * but it can stop the member retyping what the desk needs.
 *
 * Both lists come from stores the portal already loads. No new endpoint.
 */
@Component({
  selector: 'opd-helpline-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, SupportRequest, Disclosure],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="sticky top-0 z-10 border-b border-surface-border bg-white shadow-sm">
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-4 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#0E51A2] hover:bg-gray-100"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-lg font-bold text-[#0E51A2] lg:text-xl">Support</h1>
            <p class="truncate text-xs text-ink-600 lg:text-sm">Get help with a claim or a service</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[720px] px-5 py-6 lg:px-8 lg:py-10">
        <!-- Claims the API says are waiting on the MEMBER. Anything under review
             is waiting on the assessor and is not the member's to chase. -->
        <section class="rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
          @if (claims.loading()) {
            <h2 class="text-base font-semibold text-[#0E51A2]">Claims that need your help</h2>
            <p class="mt-2 text-sm text-ink-500">Checking your claims&hellip;</p>
          } @else if (needHelp().length) {
            <!-- Open by default: this is the actionable list, and something is in
                 it. A collapsed section hiding work the member has to do would be
                 the wrong default. -->
            <opd-disclosure
              title="Claims that need your help"
              [count]="needHelp().length"
              tone="#0E51A2"
              [startOpen]="true"
            >
            <p class="text-sm text-ink-600">
              These are waiting on something from you, or were not approved.
            </p>
            <ul class="mt-3 space-y-2">
              @for (claim of needHelp(); track claim.id) {
                <li class="rounded-xl border border-surface-border p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-ink-900">
                        {{ claim.reference }} · {{ claim.categoryLabel }}
                      </p>
                      <p class="mt-0.5 text-xs text-ink-500">
                        {{ claim.status.label }} · {{ money(claim.billAmount) }}
                        @if (claim.providerName) {
                          · {{ claim.providerName }}
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 rounded-lg bg-[#0F5FDC] px-3 py-1.5 text-xs font-semibold text-white"
                      (click)="toggle('claim:' + claim.id)"
                    >
                      {{ open() === 'claim:' + claim.id ? 'Close' : 'Ask for help' }}
                    </button>
                  </div>
                  <a
                    class="mt-2 inline-block text-xs font-medium text-[#0F5FDC] underline underline-offset-2"
                    [routerLink]="['/member/claims', claim.id]"
                    >View claim</a
                  >
                  @if (open() === 'claim:' + claim.id) {
                    <opd-support-request
                      [subject]="'Help with claim ' + claim.reference"
                      [context]="claimContext(claim)"
                      [topics]="claimTopics(claim)"
                      (cancelled)="open.set(null)"
                    />
                  }
                </li>
              }
            </ul>
            </opd-disclosure>
          } @else {
            <h2 class="text-base font-semibold text-[#0E51A2]">Claims that need your help</h2>
            <p class="mt-2 text-sm text-ink-600">
              Nothing needs your attention. Claims still being assessed are with our team, not
              waiting on you.
            </p>
          }
        </section>

        <!-- Past services, so a member raising an issue can point at the exact
             one instead of describing it. -->
        <section class="mt-5 rounded-2xl border border-surface-border bg-white p-5 shadow-sm">
          @if (bookings.loading()) {
            <h2 class="text-base font-semibold text-[#0E51A2]">Services you have used</h2>
            <p class="mt-2 text-sm text-ink-500">Loading your history&hellip;</p>
          } @else if (availed().length) {
            <!-- Closed by default: ten rows of history nobody has asked about yet
                 would push the actionable list off the screen. -->
            <opd-disclosure
              title="Services you have used"
              [count]="availed().length"
              tone="#0E51A2"
            >
            <p class="text-sm text-ink-600">Pick the one you need help with.</p>
            <ul class="mt-3 space-y-2">
              @for (booking of availed(); track booking.id) {
                <li class="rounded-xl border border-surface-border p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-ink-900">{{ booking.title }}</p>
                      <p class="mt-0.5 text-xs text-ink-500">
                        {{ booking.kindLabel }} · {{ booking.reference }}
                        @if (when(booking); as date) {
                          · {{ date }}
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 rounded-lg bg-[#0F5FDC] px-3 py-1.5 text-xs font-semibold text-white"
                      (click)="toggle('svc:' + booking.id)"
                    >
                      {{ open() === 'svc:' + booking.id ? 'Close' : 'Ask for help' }}
                    </button>
                  </div>
                  @if (open() === 'svc:' + booking.id) {
                    <opd-support-request
                      [subject]="'Help with ' + booking.kindLabel + ' ' + booking.reference"
                      [context]="bookingContext(booking)"
                      [topics]="SERVICE_TOPICS"
                      (cancelled)="open.set(null)"
                    />
                  }
                </li>
              }
            </ul>
            </opd-disclosure>
          } @else {
            <h2 class="text-base font-semibold text-[#0E51A2]">Services you have used</h2>
            <p class="mt-2 text-sm text-ink-600">
              You have not used any services yet. Once you do, they will be listed here so you can
              raise an issue against one.
            </p>
          }
        </section>

        <section
          class="mt-5 rounded-2xl border-2 border-[#86ACD8] p-6 text-center"
          style="background: linear-gradient(135deg, rgba(224,233,255,0.48) 0%, rgba(200,216,255,0.48) 100%)"
        >
          <span
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-[#0F5FDC]"
            style="background: linear-gradient(180deg,#CDDDFE 0%,#E4EBFE 100%); border: 1px solid #A4BFFE7A"
            aria-hidden="true"
          >
            <opd-icon name="helpline" [size]="36" />
          </span>
          <h2 class="mb-2 text-lg font-bold text-[#0E51A2]">Something else?</h2>
          <!-- The 24/7 phone line is still not built. Saying so plainly beats a
               "Coming Soon" banner over the whole screen, which is what this page
               used to be. -->
          <p class="mx-auto mb-4 max-w-md text-sm text-ink-700">
            Our 24/7 helpline is not available yet. Reach us through your corporate HR, or email
            <a class="font-semibold text-[#0F5FDC] hover:underline" [href]="generalMail()">{{
              email
            }}</a
            >.
          </p>
        </section>
      </div>
    </div>
  `,
})
export class HelplinePage {
  protected readonly claims = inject(ClaimsStore);
  protected readonly bookings = inject(BookingsStore);

  protected readonly money = formatMoney;
  protected readonly email = SUPPORT_EMAIL;

  /**
   * Waiting on the MEMBER, or refused. `UNDER_REVIEW` and the payment statuses
   * are deliberately excluded: those are with the assessor, and listing them
   * under "needs your help" would tell the member to chase something that is
   * already moving.
   */
  private static readonly NEEDS_HELP = new Set([
    'DOCUMENTS_REQUIRED',
    'RESUBMISSION_REQUIRED',
    'REJECTED',
  ]);

  protected readonly needHelp = computed(() =>
    this.claims.claims().filter((claim) => HelplinePage.NEEDS_HELP.has(claim.statusCode)),
  );

  /** Past services only — an upcoming booking is not something to complain about yet. */
  protected readonly availed = computed(() =>
    this.bookings
      .bookings()
      .filter((booking) => !booking.isUpcoming)
      .slice(0, 10),
  );

  protected when(booking: Booking): string {
    return booking.scheduledFor ? DATE.format(booking.scheduledFor) : '';
  }

  /** Which row's form is open. One at a time — two open forms invite the member
   *  to fill in the wrong one. */
  protected readonly open = signal<string | null>(null);

  protected toggle(key: string): void {
    this.open.set(this.open() === key ? null : key);
  }

  /**
   * What the portal already knows, passed to the form as context so it never
   * asks the member for something printed on the screen behind it.
   */
  protected claimContext(claim: Claim): readonly string[] {
    return [
      `Claim reference: ${claim.reference}`,
      `Status: ${claim.status.label}`,
      `Category: ${claim.categoryLabel}`,
      `Amount: ${formatMoney(claim.billAmount)}`,
      `Provider: ${claim.providerName}`,
    ];
  }

  protected bookingContext(booking: Booking): readonly string[] {
    return [
      `Reference: ${booking.reference}`,
      `Service: ${booking.title}`,
      `Type: ${booking.kindLabel}`,
      `Date: ${this.when(booking) || 'not recorded'}`,
    ];
  }

  /**
   * The options differ by WHY the claim is stuck. A member whose claim was
   * rejected has different questions from one who owes documents, and one merged
   * list would make both scroll past options that cannot apply to them.
   */
  protected claimTopics(claim: Claim): readonly string[] {
    if (claim.statusCode === 'REJECTED') {
      return [
        'I want to understand why this was rejected',
        'I think the decision is wrong and want it reviewed',
        'The amount assessed is not what I expected',
        'Something else',
      ];
    }
    return [
      'I do not know which documents are needed',
      'I already uploaded these documents',
      'I need help resubmitting',
      'Something else',
    ];
  }

  protected readonly SERVICE_TOPICS: readonly string[] = [
    'The service was not provided',
    'I was charged the wrong amount',
    'My refund has not arrived',
    'The invoice or report is missing',
    'The quality of service was poor',
    'Something else',
  ];


  protected generalMail(): string {
    return this.mail('Support request', '');
  }

  /**
   * `encodeURIComponent`, not a template literal: a provider name with an
   * ampersand would otherwise truncate the body at that character.
   */
  private mail(subject: string, body: string): string {
    const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return `mailto:${SUPPORT_EMAIL}?${query}`;
  }
}

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
