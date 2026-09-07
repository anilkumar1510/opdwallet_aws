import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DENTAL_ONLY_API } from '../../core/clinic-booking/clinic-booking';
import { formatMoney, money } from '../../core/domain/money';
import { isAppError } from '../../core/http/app-error';
import { LoadingView } from '../../shared/ui/state-views';

/**
 * Flow 4 step 17 — "No show on the consultation".
 *
 * The sheet gives this step to the network: *"No show information comes from
 * the network."* The member does not report it, which is why this screen sets
 * out what happens rather than asking them to declare anything.
 *
 * The money is the part worth being straight about. `markNoShow` refunds
 * nothing — that is the behaviour in the code today — while the sheet still
 * says *"penalisation is still to be discussed"*. So a decision has quietly
 * been made that the flow has not made yet, and the member is the one it lands
 * on. Both facts are on the page.
 */
@Component({
  selector: 'opd-not-attended-page',
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
            [queryParams]="{ tab: 'dental' }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              You did not attend
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

        @if (booking.isLoading()) {
          <opd-loading label="Loading your visit" />
        } @else if (details(); as visit) {
          @if (visit.isNoShow) {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
                Recorded as a missed visit
              </h2>
              <p class="mt-1 text-sm text-ink-700">
                {{ visit.clinicName }} told us you did not attend on {{ visit.appointmentDate }} at
                {{ visit.appointmentTime }}.
              </p>
            </section>
          } @else {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
                The clinic tells us, not you
              </h2>
              <p class="mt-1 text-sm text-ink-700">
                {{ visit.clinicName }} reports a missed appointment after the time has passed. There
                is nothing for you to send us, and nothing to do here.
              </p>
            </section>
          }

          <!--
            The one thing a member actually wants to know, said first and
            plainly. The no-show handler refunds nothing, so saying "we will
            let you know" would be softer than the truth.
          -->
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
              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="font-semibold text-ink-900">Refunded</dt>
                <dd class="text-lg font-bold text-ink-900">Nothing</dd>
              </div>
            </dl>
            <p class="mt-3 text-sm text-ink-700">
              A missed visit is not refunded today. The clinic held the slot and the dentist's time,
              and neither can be given back.
            </p>
            <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
              Whether a missed visit carries any further penalty has not been decided. If that
              changes, it will apply to visits from then on, not to this one.
            </p>
          </section>

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">If you still need to go</h2>
            <p class="mt-1 text-sm text-ink-700">
              Book again — a missed visit does not stop you. You pay for the new visit the same way,
              from whatever is left of your cover.
            </p>
            <a
              routerLink="/member/dental/compare"
              class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              >Book another visit</a
            >
            <a
              routerLink="/member/bookings"
              [queryParams]="{ tab: 'dental' }"
              class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
              >Back to your bookings</a
            >

            <!--
              Demonstration only. The clinic reports a no-show, so nothing in
              the member portal can reach this state on its own — and without a
              way in, the ending cannot be seen at all. Refused outside
              development, and it keeps the rule that a visit cannot be missed
              before its own appointment time.
            -->
            @if (!visit.isNoShow) {
              <div class="mt-5 border-t border-surface-border pt-4">
                <p class="text-xs text-ink-500">
                  For demonstrations: stand in for the clinic and report this visit as missed.
                </p>
                <button
                  type="button"
                  class="mt-2 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk disabled:opacity-60"
                  [disabled]="busy()"
                  (click)="reportMissed()"
                >
                  {{ busy() ? 'Reporting…' : 'Report as missed (demo)' }}
                </button>
              </div>
            }
          </section>
        }
      </div>
    </div>
  `,
})
export class NotAttendedPage {
  readonly reference = input<string>('');

  private readonly http = inject(HttpClient);
  protected readonly fmt = formatMoney;

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly booking = resource({
    params: () => ({ id: this.reference() }),
    loader: ({ params }) =>
      firstValueFrom(
        this.http.get<{ data?: Record<string, unknown> } & Record<string, unknown>>(
          DENTAL_ONLY_API.bookingById(params.id),
        ),
      ).catch(() => null),
  });

  protected details() {
    const body = this.booking.value();
    const dto = (body?.['data'] ?? body) as Record<string, any> | null;
    if (!dto?.['bookingId']) return null;

    return {
      clinicName: (dto['clinicName'] as string)?.trim() || 'The clinic',
      appointmentDate: dto['appointmentDate']
        ? new Date(dto['appointmentDate'] as string).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'the appointment date',
      appointmentTime: (dto['appointmentTime'] as string) ?? '',
      fromCover: money(dto['walletDebitAmount'] as number),
      paidByYou: money(dto['totalMemberPayment'] as number),
      isNoShow: dto['status'] === 'NO_SHOW',
    };
  }

  /** See the button's comment — development only, refused elsewhere. */
  protected async reportMissed(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.post(DENTAL_ONLY_API.demoNoShow(this.reference()), {}));
      this.booking.reload();
    } catch (error: unknown) {
      this.error.set(
        isAppError(error) ? error.message : 'We could not record that. Try again.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
