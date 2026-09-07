import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { Payment } from '../../core/transactions/transaction.mapper';
import { TransactionsStore } from '../../core/transactions/transactions.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** One payment record. */
@Component({
  selector: 'opd-payment-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView, StatusBadge],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/orders"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to transactions"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Payment</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ paymentId() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (payment.isLoading()) {
          <opd-loading label="Loading payment" />
        } @else if (payment.value(); as detail) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-3xl font-bold text-[#0B2C63]">{{ money(detail.amount) }}</p>
                <p class="mt-0.5 text-sm text-ink-700">{{ detail.typeLabel }}</p>
              </div>
              <opd-status-badge [status]="detail.status" />
            </div>

            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              @if (detail.description) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Description</dt>
                  <dd class="truncate pl-2 font-medium text-ink-900">{{ detail.description }}</dd>
                </div>
              }
              @if (detail.serviceReference) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Service reference</dt>
                  <dd class="font-medium text-ink-900">{{ detail.serviceReference }}</dd>
                </div>
              }
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Method</dt>
                <dd class="font-medium text-ink-900">{{ detail.methodLabel }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Date</dt>
                <dd class="font-medium text-ink-900">{{ date(detail.paidAt) }}</dd>
              </div>
            </dl>
          </section>

          @if (store.payError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }

          <!-- A settled payment has a final status; anything else is still due. -->
          @if (!detail.status.isFinal) {
            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
              [disabled]="store.paying()"
              (click)="pay(detail.reference)"
            >
              {{ store.paying() ? 'Completing…' : 'Mark as paid' }}
            </button>
          } @else {
            <!--
              Paying used to end here, on a screen with nothing but a back arrow
              to the transaction list. Flow 4 does not stop at step 11 — the
              receipt, the letter and the visit all follow — so the rest of the
              journey is laid out from here.

              Only for a dental CONSULTATION: a procedure payment carries the
              same DENTAL service line but runs a different tail (confirmation,
              then the visit, then an invoice), and its own screen already shows
              that. The reference is what separates them.
            -->
            @if (dentalConsultation(detail); as reference) {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">What happens next</h2>
                <p class="mt-1 text-sm text-ink-700">
                  Your visit is paid for. These are the steps that follow.
                </p>

                <ol class="mt-4 space-y-3">
                  <li class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm text-ink-900">Your receipt</span>
                    <a
                      [routerLink]="['/member/bookings', reference, 'receipt']"
                      class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                      >Receipt</a
                    >
                  </li>
                  <li class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm text-ink-900">Your cashless letter, before the visit</span>
                    <a
                      [routerLink]="['/member/bookings', reference, 'cashless-letter']"
                      class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                      >Cashless letter</a
                    >
                  </li>
                </ol>

                <!--
                  Step 14 against step 17. Both are real endings and the sheet
                  treats them as one question, so neither is the default: going
                  is what continues to the prescription and the procedure route,
                  not going is where the journey stops.
                -->
                <div class="mt-5 border-t border-surface-border pt-4">
                  <h3 class="text-sm font-semibold text-ink-900">After the appointment</h3>
                  <p class="mt-1 text-sm text-ink-700">Did you attend?</p>
                  <div class="mt-3 flex flex-col gap-3 sm:flex-row">
                    <a
                      [routerLink]="['/member/dental/visit', reference, 'close']"
                      class="flex min-h-touch flex-1 items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                      >I attended</a
                    >
                    <a
                      [routerLink]="['/member/bookings', reference, 'not-attended']"
                      class="flex min-h-touch flex-1 items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                      >I did not attend</a
                    >
                  </div>
                  <p class="mt-3 text-xs text-ink-500">
                    Attending takes you to the prescription, and to the procedure route if your
                    dentist recommended one.
                  </p>
                </div>
              </section>
            }

            <!--
              Flow 6 steps 12 to 16. Shorter than dental's tail because the
              member does nothing in it: the vendor gives the dose and the
              vendor reports the outcome. What they need after paying is the
              two documents and an honest account of who acts next.
            -->
            @if (vaccination(detail); as reference) {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">What happens next</h2>
                <p class="mt-1 text-sm text-ink-700">
                  Your vaccination is paid for. These are the steps that follow.
                </p>

                <ol class="mt-4 space-y-3">
                  <li class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm text-ink-900">Your receipt</span>
                    <a
                      [routerLink]="['/member/vaccination/booking', reference, 'receipt']"
                      class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                      >Receipt</a
                    >
                  </li>
                  <li class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm text-ink-900">
                      Your cashless letter, before the appointment
                    </span>
                    <a
                      [routerLink]="['/member/vaccination/booking', reference, 'cashless-letter']"
                      class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                      >Cashless letter</a
                    >
                  </li>
                </ol>

                <div class="mt-5 border-t border-surface-border pt-4">
                  <h3 class="text-sm font-semibold text-ink-900">After the dose</h3>
                  <ol class="mt-3 space-y-2.5">
                    <li class="text-sm text-ink-500">
                      You attend and the vendor gives the dose. They verify the cashless letter at
                      the counter.
                    </li>
                    <li class="text-sm text-ink-500">
                      The vendor tells us whether the dose was taken. That report is theirs, not
                      yours — there is nothing for you to send us.
                    </li>
                    <li class="text-sm text-ink-500">
                      Your invoice is raised once the vaccination is complete, and your cover is
                      settled with the vendor.
                    </li>
                  </ol>

                  <!--
                    Steps 15 and 16 have a screen of their own, so the list ends
                    at the door to it rather than describing an ending the
                    member cannot open. It reads as "waiting on the vendor"
                    until they report, which is the honest state of it.
                  -->
                  <a
                    [routerLink]="['/member/vaccination/booking', reference, 'outcome']"
                    class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                    >After your appointment</a
                  >
                </div>
              </section>
            }

            <a
              routerLink="/member/bookings"
              class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]"
              >Back to your bookings</a
            >
          }
        } @else {
          <opd-empty title="Payment not found" detail="We could not find that payment." />
        }
      </div>
    </div>
  `,
})
export class PaymentDetailPage {
  readonly paymentId = input<string>('');

  protected readonly store = inject(TransactionsStore);
  protected readonly money = formatMoney;

  protected readonly payment = resource({
    params: () => this.paymentId(),
    loader: ({ params }) => (params ? this.store.paymentById(params) : Promise.resolve(null)),
  });

  /**
   * The booking reference when this paid for a dental consultation, else null.
   *
   * Read off the reference rather than the service line, because a procedure
   * payment is DENTAL too and its tail is a different set of steps.
   */
  protected dentalConsultation(detail: Payment): string | null {
    if (detail.serviceTypeCode !== 'DENTAL') return null;
    const reference = detail.serviceReference;
    return reference?.startsWith('DEN-BOOK') ? reference : null;
  }

  /**
   * The booking reference when this paid for a vaccination, else null.
   *
   * Read the same way as the dental one, and for the same reason: the service
   * line alone is not enough to know which tail to show.
   */
  protected vaccination(detail: Payment): string | null {
    if (detail.serviceTypeCode !== 'VACCINATION') return null;
    const reference = detail.serviceReference;
    return reference?.startsWith('VAXBK') ? reference : null;
  }

  /** Takes the business PAY-… reference, which is what the route expects. */
  protected async pay(reference: string): Promise<void> {
    if (await this.store.markPaid(reference)) this.payment.reload();
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }
}
