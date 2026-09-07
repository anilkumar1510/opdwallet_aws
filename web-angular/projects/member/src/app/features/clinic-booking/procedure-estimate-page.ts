import { ChangeDetectionStrategy, Component, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DentalProcedureStore } from '../../core/dental/dental-procedure.store';
import { formatMoney } from '../../core/domain/money';
import { LoadingView } from '../../shared/ui/state-views';

/**
 * Flow 4 steps 18 and 19 — "add the estimate", then "create cart".
 *
 * The two are one screen because the member does one thing: type the figure the
 * dentist quoted. The cart going on hold is what happens next, not a second
 * action, and the sheet is explicit that nothing is charged while it waits.
 *
 * If a procedure already exists for this consultation the screen shows it
 * instead of offering a second one — the API refuses duplicates, and letting a
 * member fill in a form that will be rejected is worse than not offering it.
 */
@Component({
  selector: 'opd-procedure-estimate-page',
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
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Your procedure estimate
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ bookingId() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.error(); as problem) {
          <p class="mb-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

        @if (existing.isLoading()) {
          <opd-loading label="Checking for an existing estimate" />
        } @else if (existing.value(); as current) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
              You already sent an estimate
            </h2>
            <p class="mt-1 text-sm text-ink-700">
              {{ money(current.estimate) }} at {{ current.clinicName }} —
              {{ current.statusLabel.toLowerCase() }}.
            </p>
            <a
              [routerLink]="['/member/dental/procedure', current.id]"
              class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              >See it</a
            >
          </section>
        } @else {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
              What did the dentist quote?
            </h2>
            <p class="mt-1 text-sm text-ink-700">
              We check it against your plan before anything is charged. Nothing comes out of your
              cover while it is being reviewed.
            </p>

            <label class="mt-4 block">
              <span class="text-sm font-medium text-ink-900">Estimate</span>
              <input
                type="number"
                inputmode="decimal"
                min="1"
                step="1"
                [value]="amount()"
                (input)="amount.set($any($event.target).value)"
                placeholder="e.g. 8000"
                class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
              />
            </label>

            <label class="mt-4 block">
              <span class="text-sm font-medium text-ink-900">What is it for? (optional)</span>
              <input
                type="text"
                [value]="notes()"
                (input)="notes.set($any($event.target).value)"
                placeholder="e.g. Root canal, upper left"
                class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
              />
            </label>

            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white disabled:opacity-60"
              [disabled]="!isValid() || store.busy()"
              (click)="submit()"
            >
              {{ store.busy() ? 'Sending…' : 'Send for review' }}
            </button>

            <p class="mt-3 text-xs text-ink-500">
              Someone checks what your plan covers, then you pick a slot and pay your share.
            </p>
          </section>
        }
      </div>
    </div>
  `,
})
export class ProcedureEstimatePage {
  readonly bookingId = input<string>('');

  protected readonly store = inject(DentalProcedureStore);
  private readonly router = inject(Router);
  protected readonly money = formatMoney;

  protected readonly amount = signal('');
  protected readonly notes = signal('');

  protected readonly existing = resource({
    params: () => ({ id: this.bookingId() }),
    loader: ({ params }) => this.store.forBooking(params.id),
  });

  protected isValid(): boolean {
    const value = Number(this.amount());
    return Number.isFinite(value) && value > 0;
  }

  protected async submit(): Promise<void> {
    if (!this.isValid()) return;
    const created = await this.store.addEstimate({
      bookingId: this.bookingId(),
      estimateAmount: Number(this.amount()),
      procedureNotes: this.notes().trim() || undefined,
    });
    if (created) {
      await this.router.navigate(['/member/dental/procedure', created.id]);
    }
  }
}
