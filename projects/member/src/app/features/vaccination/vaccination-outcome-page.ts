import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { formatMoney, money } from '../../core/domain/money';
import { VACCINATION_API } from '../../core/vaccination/vaccination';
import { LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Flow 6 steps 15 and 16 — the vendor reports the outcome, then the invoice.
 *
 * Both belong to other people. The sheet is explicit that *"completion or a no
 * show is confirmed by the vendor, not by the member"*, and the invoice is
 * raised by us once that report arrives. So this screen tells the member where
 * their booking stands and hands over the invoice; it asks them for nothing.
 *
 * The three states it has to say out loud:
 *
 *   waiting    — the appointment may not have happened yet, or the vendor has
 *                not told us. Nothing is owed and nothing more is taken.
 *   completed  — the dose was given, the invoice exists, and it downloads.
 *   missed     — the vendor said the patient did not attend.
 *
 * The money line matters most on the last one, and `markNoShow` refunds
 * nothing, so it says exactly that rather than leaving a member to hope.
 */
@Component({
  selector: 'opd-vaccination-outcome-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: 'vaccination' }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              After your appointment
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ reference() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (error(); as problem) {
          <p class="mb-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

        @if (loading()) {
          <opd-loading label="Loading your appointment" />
        } @else if (details(); as visit) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            @if (visit.isComplete) {
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Dose given</h2>
              <p class="mt-1 text-sm text-ink-700">
                {{ visit.vendorName }} confirmed your {{ visit.vaccineName }} dose on
                {{ visit.appointmentDate }}.
              </p>
            } @else if (visit.isNoShow) {
              <h2 class="text-base font-semibold text-danger-700">Recorded as missed</h2>
              <p class="mt-1 text-sm text-ink-700">
                {{ visit.vendorName }} told us the appointment on {{ visit.appointmentDate }} was
                not attended.
              </p>
            } @else {
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
                Waiting on the vendor
              </h2>
              <p class="mt-1 text-sm text-ink-700">
                {{ visit.vendorName }} tells us whether the dose was given, after
                {{ visit.appointmentDate }}. That report is theirs, not yours — there is nothing to
                send us.
              </p>
            }
          </section>

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">What about the money</h2>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Taken from your cover</dt>
                <dd class="font-medium text-ink-900">{{ fmt(visit.fromCover) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Paid by you</dt>
                <dd class="font-medium text-ink-900">{{ fmt(visit.paidByYou) }}</dd>
              </div>
            </dl>
            <p class="mt-3 text-sm text-ink-700">
              @if (visit.isComplete) {
                Settled with {{ visit.vendorName }} on the agreed cycle. Nothing further is owed.
              } @else if (visit.isNoShow) {
                A missed appointment is not refunded today. Whether it carries any further penalty
                has not been decided.
              } @else {
                Nothing more will be taken, whichever way the vendor reports it.
              }
            </p>
          </section>

          <!--
            Step 16. A real invoice, generated when the vendor confirms the
            dose, so this is a download and not a stand-in — but it exists only
            once the visit is complete, and saying so beats a dead button.
          -->
          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Your invoice</h2>
            @if (visit.hasInvoice) {
              <p class="mt-1 text-sm text-ink-700">Raised when the dose was confirmed.</p>
              <button
                type="button"
                class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-60"
                [disabled]="opening()"
                (click)="openInvoice()"
              >
                {{ opening() ? 'Opening…' : 'Open invoice' }}
              </button>
            } @else {
              <p class="mt-1 text-sm text-ink-500">
                Raised once the vaccination is complete. There is nothing to download yet — this
                shows what it will carry.
              </p>
              <a
                [routerLink]="['/member/vaccination/booking', reference(), 'invoice']"
                class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                >See what it will carry</a
              >
            }
          </section>

          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: 'vaccination' }"
            class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
            >Back to your bookings</a
          >
        }
      </div>
    </div>
  `,
})
export class VaccinationOutcomePage {
  readonly reference = input<string>('');

  private readonly http = inject(HttpClient);
  protected readonly fmt = formatMoney;

  private readonly record = signal<Record<string, any> | null>(null);
  protected readonly loading = signal(true);
  protected readonly opening = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const reference = this.reference();
      this.loading.set(true);
      firstValueFrom(this.http.get<Record<string, any>>(VACCINATION_API.byId(reference)))
        .then((body) => this.record.set(body?.['data'] ?? body ?? null))
        .catch(() => this.record.set(null))
        .finally(() => this.loading.set(false));
    });
  }

  protected details() {
    const dto = this.record();
    if (!dto?.['bookingId']) return null;

    return {
      vendorName: (dto['vendorName'] as string)?.trim() || 'The vendor',
      vaccineName: (dto['serviceName'] as string)?.trim() || 'vaccination',
      appointmentDate: dto['appointmentDate']
        ? DATE.format(new Date(dto['appointmentDate'] as string))
        : 'the appointment date',
      fromCover: money(dto['walletDebitAmount'] as number),
      paidByYou: money(dto['totalMemberPayment'] as number),
      isComplete: dto['status'] === 'COMPLETED',
      isNoShow: dto['status'] === 'NO_SHOW',
      hasInvoice: dto['invoiceGenerated'] === true,
    };
  }

  /**
   * Fetched through HttpClient so the session travels with it — a bare href
   * would go out unauthenticated — then opened in a tab rather than saved.
   */
  protected async openInvoice(): Promise<void> {
    this.opening.set(true);
    this.error.set(null);
    try {
      const blob = await firstValueFrom(
        this.http.get(VACCINATION_API.invoice(this.reference()), { responseType: 'blob' }),
      );
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      this.error.set('We could not open that invoice.');
    } finally {
      this.opening.set(false);
    }
  }
}
