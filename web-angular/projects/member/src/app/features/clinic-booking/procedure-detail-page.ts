import { ChangeDetectionStrategy, Component, inject, input, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';

import { CLINIC_AREA, DENTAL_ONLY_API } from '../../core/clinic-booking/clinic-booking';
import { ClinicBookingStore } from '../../core/clinic-booking/clinic-booking.store';
import { DentalProcedureStore } from '../../core/dental/dental-procedure.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

/**
 * The procedure cart — flow 4 steps 22 to 28.
 *
 * One screen carrying the whole tail of the route, because each state is a
 * short thing to say and splitting them would add destinations the sheet does
 * not describe:
 *
 *   being reviewed  — step 20. Nothing charged; nothing for the member to do.
 *   ready to book   — steps 22-25. What was approved and what was not, then a
 *                     slot and the payment breakdown.
 *   paid            — steps 27-28. Paid but NOT confirmed; operations still
 *                     have to agree the slot with the clinic.
 *   not approved    — the rejection and its reason.
 *
 * Step 23 is the reason the approved and estimated figures are both shown: "the
 * member can see what was approved and what was not."
 */
@Component({
  selector: 'opd-procedure-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, LoadingView, EmptyView],
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
              Your procedure
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ procedureId() }}
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

        @if (procedure.isLoading()) {
          <opd-loading label="Loading your procedure" />
        } @else if (procedure.value(); as current) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-[#0B2C63]">{{ current.clinicName }}</h2>
                @if (current.notes) {
                  <p class="mt-0.5 text-sm text-ink-700">{{ current.notes }}</p>
                }
              </div>
              <span
                class="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#034DA2]"
                >{{ current.statusLabel }}</span
              >
            </div>

            <!-- Step 23: both figures, so "what was approved and what was not"
                 is visible rather than implied by a single number. -->
            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Dentist's estimate</dt>
                <dd class="font-medium text-ink-900">{{ money(current.estimate) }}</dd>
              </div>
              @if (!current.isRejected && current.approved.amount > 0) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Approved under your plan</dt>
                  <dd class="font-semibold text-ink-900">{{ money(current.approved) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid from your cover</dt>
                  <dd class="font-semibold text-success-700">{{ money(current.walletPays) }}</dd>
                </div>
                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="font-semibold text-ink-900">You pay</dt>
                  <dd class="text-lg font-bold text-ink-900">{{ money(current.memberPays) }}</dd>
                </div>
              }
            </dl>

            @if (current.adjudicationNotes; as note) {
              <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-700">{{ note }}</p>
            }

            <!--
              Step 20 adjudicates "against the policy details and the uploaded
              prescription". The member is entitled to see the document their
              approval turns on — and to notice before the decision that they
              photographed the wrong page.
            -->
            <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-4">
              <span class="text-sm text-ink-700">The prescription you sent</span>
              <button
                type="button"
                class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk disabled:opacity-60"
                [disabled]="opening()"
                (click)="openPrescription(current.bookingId)"
              >
                {{ opening() ? 'Opening…' : 'View prescription' }}
              </button>
            </div>
            @if (openError(); as problem) {
              <p class="mt-2 text-sm text-danger-700" role="alert">{{ problem }}</p>
            }
          </section>

          @switch (current.statusCode) {
            @case ('PENDING_ADJUDICATION') {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="text-base font-semibold text-[#0E51A2]">Being reviewed</h2>
                <p class="mt-1 text-sm text-ink-700">
                  We are checking what your plan covers. Nothing has come out of your cover, and
                  there is nothing to do until this is decided.
                </p>

                <!--
                  A wait with no end told is a wait a member chases. This screen
                  is where the procedure route is at its longest gap — steps 20
                  and 21 are entirely ours — so it says what is coming and, just
                  as importantly, that the estimate is not the final number.
                -->
                <div class="mt-5 border-t border-surface-border pt-4">
                  <h3 class="text-sm font-semibold text-ink-900">What happens next</h3>
                  <ol class="mt-3 space-y-2.5">
                    <li class="text-sm text-ink-500">
                      We decide what your plan approves, against the policy and the prescription you
                      sent. It may be less than {{ money(current.estimate) }} — you will see both
                      figures and the reason for anything not approved.
                    </li>
                    <li class="text-sm text-ink-500">
                      We tell you when the cart is ready. If nothing is approved, nothing is
                      charged and you can still have the treatment and pay the clinic yourself.
                    </li>
                    <li class="text-sm text-ink-900">
                      You pick a slot at {{ current.clinicName }} and pay your share.
                    </li>
                    <li class="text-sm text-ink-500">
                      We confirm the slot with the clinic and issue your cashless letter.
                    </li>
                    <li class="text-sm text-ink-500">
                      After the procedure, your invoice is raised and your cover is settled with the
                      clinic.
                    </li>
                  </ol>
                </div>

                <ng-container [ngTemplateOutlet]="demo" />
              </section>
            }
            @case ('REJECTED') {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <h2 class="text-base font-semibold text-danger-700">Not approved</h2>
                <p class="mt-1 text-sm text-ink-700">
                  {{ current.rejectionReason ?? 'Your plan does not cover this procedure.' }}
                </p>
                <p class="mt-2 text-sm text-ink-500">
                  Nothing was charged. You can still have the treatment and pay {{ current.clinicName }}
                  yourself.
                </p>
              </section>
            }
            @case ('CART_READY') {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Book your procedure</h2>
                <!-- Step 24 wants the SAME DENTIST. Dental records only a
                     clinic, so what is really guaranteed is the same clinic —
                     said plainly rather than claimed. -->
                <p class="mt-1 text-sm text-ink-700">
                  At {{ current.clinicName }}, where it was recommended.
                </p>

                <label class="mt-4 block sm:max-w-[220px]">
                  <span class="text-sm text-ink-700">Date</span>
                  <input
                    type="date"
                    [value]="date()"
                    [min]="today"
                    (input)="pickDate($any($event.target).value)"
                    class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
                  />
                </label>

                <!--
                  Step 24 — the clinic's own slots, not a free time field. A
                  typed time was accepted whether or not the clinic was open,
                  and could take a time the consultation journey had already
                  given away.
                -->
                @if (date()) {
                  @if (slots.isLoading()) {
                    <p class="mt-4 text-sm text-ink-500">Loading times…</p>
                  } @else if (slots.value()?.length) {
                    <div class="mt-4 flex flex-wrap gap-2">
                      @for (slot of slots.value(); track slot.id) {
                        <button
                          type="button"
                          class="min-h-touch rounded-xl border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                          [class]="
                            slot.startTime === time()
                              ? 'border-[#0F5FDC] bg-[#0F5FDC] text-white'
                              : 'border-surface-border text-ink-900 hover:bg-surface-sunk'
                          "
                          [disabled]="!slot.isAvailable"
                          (click)="time.set(slot.startTime)"
                        >
                          {{ slot.startTime }}
                        </button>
                      }
                    </div>
                  } @else {
                    <p class="mt-4 text-sm text-ink-500">
                      {{ current.clinicName }} has no times on that day. Try another date.
                    </p>
                  }
                }

                <button
                  type="button"
                  class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white disabled:opacity-60"
                  [disabled]="!date() || !time() || store.busy()"
                  (click)="book()"
                >
                  {{ store.busy() ? 'Booking…' : 'Book and pay ' + money(current.memberPays) }}
                </button>
              </section>
            }
            @case ('AWAITING_PAYMENT') {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <h2 class="text-base font-semibold text-[#0E51A2]">Finish your payment</h2>
                <!--
                  Steps 26 to 28 are three moments. Your share is still owed, so
                  the procedure is not paid and operations cannot confirm it yet.
                -->
                <p class="mt-1 text-sm text-ink-700">
                  {{ money(current.memberPays) }} is still to pay. We hold
                  {{ current.appointmentDate }} at {{ current.appointmentTime }} until it clears —
                  the clinic is only asked to confirm once it has.
                </p>
                @if (current.paymentId; as paymentId) {
                  <a
                    [routerLink]="['/member/payments', paymentId]"
                    class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                    >Pay {{ money(current.memberPays) }}</a
                  >
                }
              </section>
            }
            @default {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                @if (current.appointmentDate) {
                  <p class="text-sm font-medium text-ink-900">
                    {{ current.appointmentDate }} at {{ current.appointmentTime }}
                  </p>
                }
                <p class="mt-1 text-sm text-ink-700">
                  Paid. We are confirming the slot with {{ current.clinicName }} — they will be in
                  touch if anything changes.
                </p>

                <ng-container [ngTemplateOutlet]="demo" />

                @if (current.paymentId; as paymentId) {
                  <a
                    [routerLink]="['/member/payments', paymentId]"
                    class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                    >See your payment</a
                  >
                }

                <!--
                  Steps 27, 30 and 32. Listed because the flow promises them and
                  a member who is told a cashless letter exists will go looking;
                  each opens a page saying we do not issue it yet. The invoice
                  appears only once the visit is done, which is when step 32
                  raises it.
                -->
                <div class="mt-3 flex flex-wrap gap-2">
                  <a
                    [routerLink]="['/member/dental/procedure', procedureId(), 'document', 'receipt']"
                    class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                    >Receipt</a
                  >
                  <a
                    [routerLink]="[
                      '/member/dental/procedure',
                      procedureId(),
                      'document',
                      'cashless-letter'
                    ]"
                    class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                    >Cashless letter</a
                  >
                  @if (current.statusCode === 'COMPLETED') {
                    <a
                      [routerLink]="[
                        '/member/dental/procedure',
                        procedureId(),
                        'document',
                        'invoice'
                      ]"
                      class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                      >Invoice</a
                    >
                  }
                </div>
              </section>
            }
          }
        } @else {
          <opd-empty title="Procedure not found" detail="We could not find that procedure." />
        }

        <!--
          Demonstration only, and labelled as such. Adjudicating a cart and
          confirming a slot are ours to do, and on a demo database nobody is
          doing them — so without this the procedure route stops at step 20 and
          the last third of the flow cannot be seen. The API refuses it outside
          development.
        -->
        <ng-template #demo>
          <div class="mt-5 border-t border-surface-border pt-4">
            <p class="text-xs text-ink-500">
              For demonstrations: stand in for our team and move this on.
            </p>
            <button
              type="button"
              class="mt-2 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk disabled:opacity-60"
              [disabled]="store.busy()"
              (click)="advance()"
            >
              {{ store.busy() ? 'Working…' : 'Do it as our team (demo)' }}
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
})
export class ProcedureDetailPage {
  readonly procedureId = input<string>('');

  protected readonly store = inject(DentalProcedureStore);
  private readonly clinics = inject(ClinicBookingStore);
  private readonly http = inject(HttpClient);
  protected readonly money = formatMoney;

  protected readonly opening = signal(false);
  protected readonly openError = signal<string | null>(null);
  protected readonly date = signal('');
  protected readonly time = signal('');
  /** Stops the date picker offering a day that has already gone. */
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly procedure = resource({
    params: () => ({ id: this.procedureId() }),
    loader: ({ params }) => this.store.byId(params.id),
  });

  /** The clinic's published times for the chosen day. */
  protected readonly slots = resource({
    params: () => ({
      clinicId: this.procedure.value()?.clinicId ?? '',
      date: this.date(),
    }),
    loader: ({ params }) =>
      params.clinicId && params.date
        ? this.clinics.slots(CLINIC_AREA.Dental, params.clinicId, params.date)
        : Promise.resolve([]),
  });

  /** A time from one day means nothing on another, so changing the date clears it. */
  protected pickDate(value: string): void {
    this.date.set(value);
    this.time.set('');
  }

  /**
   * Opened in a tab rather than downloaded: the member is checking a document,
   * not filing it. Fetched through HttpClient so the session travels with it —
   * a bare href would be an unauthenticated request.
   */
  protected async openPrescription(bookingId: string): Promise<void> {
    this.opening.set(true);
    this.openError.set(null);
    try {
      const blob = await firstValueFrom(
        this.http.get(DENTAL_ONLY_API.prescriptionFile(bookingId), { responseType: 'blob' }),
      );
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      // Left to the browser to release once the tab has it; revoking now would
      // pull the file out from under a tab that has not finished loading it.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      this.openError.set('We could not open that prescription.');
    } finally {
      this.opening.set(false);
    }
  }

  /** See the `#demo` template — development only, refused elsewhere. */
  protected async advance(): Promise<void> {
    if (await this.store.demoAdvance(this.procedureId())) this.procedure.reload();
  }

  protected async book(): Promise<void> {
    const booked = await this.store.schedule(this.procedureId(), {
      appointmentDate: this.date(),
      appointmentTime: this.time(),
    });
    // Reload rather than patch: scheduling moves the status and opens a
    // payment, and the screen should read both from the server.
    if (booked) this.procedure.reload();
  }
}
