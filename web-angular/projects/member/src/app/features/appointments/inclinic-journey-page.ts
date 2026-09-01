import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppointmentBookingStore } from '../../core/appointments/booking.store';
import { InClinicFlowStore } from '../../core/appointments/inclinic-flow.store';
import { formatMoney } from '../../core/domain/money';
import { TransactionsStore } from '../../core/transactions/transactions.store';

const DATE = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Same four tones the claim badges use, so one status vocabulary runs portal-wide. */
const TONES: Readonly<Record<string, string>> = {
  neutral: 'bg-gray-100 text-gray-700',
  progress: 'bg-blue-50 text-[#034DA2]',
  positive: 'bg-success-50 text-success-700',
  negative: 'bg-danger-50 text-danger-700',
};

const STAMP = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Everything after the in-clinic request is raised, on one screen.
 *
 * One screen rather than six routes because the member returns to the *same*
 * booking again and again — to see whether the clinic confirmed, to settle the
 * cart, to fetch the cashless letter, to upload the prescription. Splitting
 * that into a route per stage would give five destinations that each show one
 * paragraph and lose the thread of the booking.
 *
 * The tone throughout: say plainly what is real. The block is described to the
 * member as held money because that is what the flow promises, and the panel
 * marked "Simulated" is honest about standing in for operations, the clinic and
 * the payment gateway. See `inclinic-flow.ts` for what is drawn and why.
 */
@Component({
  selector: 'opd-inclinic-journey-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: 'doctors' }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Clinic appointment
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ appointmentId() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (view(); as v) {
          <!-- Where the booking stands. -->
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Status</h2>
              <span
                class="inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium"
                [class]="toneClass(v.display.tone)"
                >{{ v.display.label }}</span
              >
            </div>
            <p class="mt-2 text-sm text-ink-700">{{ v.display.detail }}</p>

            <ol class="mt-4 space-y-2 text-sm">
              @for (step of timeline(); track step.label) {
                <li class="flex items-start gap-3">
                  <span
                    class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    [class]="step.done ? 'bg-success-700' : 'bg-gray-300'"
                    aria-hidden="true"
                  ></span>
                  <span class="min-w-0">
                    <span [class]="step.done ? 'text-ink-900' : 'text-ink-500'">{{
                      step.label
                    }}</span>
                    @if (step.at) {
                      <span class="block text-xs text-ink-500">{{ stamp(step.at) }}</span>
                    }
                  </span>
                </li>
              }
            </ol>
          </section>

          <!-- The appointment itself. Real, and filed with the API. -->
          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <dl class="space-y-4">
              <div>
                <dt class="text-xs uppercase tracking-wide text-ink-500">Doctor</dt>
                <dd class="mt-0.5 text-lg font-bold text-[#0B2C63]">{{ v.journey.doctorName }}</dd>
                <dd class="text-sm text-ink-700">{{ v.journey.specialty }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Patient</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ v.journey.patientName }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">Clinic</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ v.journey.clinicName }}</dd>
                <dd class="text-sm text-ink-700">{{ v.journey.clinicAddress }}</dd>
              </div>
              <div class="border-t border-surface-border pt-4">
                <dt class="text-xs uppercase tracking-wide text-ink-500">When</dt>
                <dd class="mt-0.5 font-medium text-ink-900">{{ dateLabel() }}</dd>
                <dd class="text-sm text-ink-700">{{ v.journey.timeSlot }}</dd>
              </div>
            </dl>
          </section>

          <!-- What is happening to the member's money at this stage. -->
          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Payment breakdown</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Consultation fee</dt>
                <dd class="font-medium text-ink-900">{{ money(v.fee) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">
                  From your wallet
                  @if (v.journey.copayPercentage > 0) {
                    <span class="text-ink-500">(after {{ v.journey.copayPercentage }}% copay)</span>
                  }
                </dt>
                <dd class="font-medium text-ink-900">{{ money(v.blocked) }}</dd>
              </div>
              @if (v.selfPay.amount > 0) {
                <div class="flex justify-between gap-3">
                  <dt class="text-danger-700">You pay</dt>
                  <dd class="font-medium text-danger-700">{{ money(v.selfPay) }}</dd>
                </div>
              }
            </dl>

            <p class="mt-3 rounded-xl px-3 py-2 text-sm" [class]="walletNoteClass()">
              {{ walletNote() }}
            </p>
          </section>

          <!-- Cart ready: the clinic has agreed, so the amount is now the member's to settle. -->
          @if (v.awaitingPayment) {
            <section
              class="mt-5 rounded-2xl border-2 border-[#0F5FDC] bg-white p-5 shadow-sm lg:p-6"
            >
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Your cart is ready</h2>
              <p class="mt-1 text-sm text-ink-700">
                @if (v.needsGateway) {
                  The clinic has confirmed your slot. Pay {{ money(v.selfPay) }} to complete the
                  booking — the rest is covered by your wallet.
                } @else {
                  The clinic has confirmed your slot. Your wallet covers this consultation in full,
                  so there is nothing more to pay.
                }
              </p>

              @if (paymentProblem(); as problem) {
                <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                  {{ problem }}
                </p>
              }

              <button
                type="button"
                class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-60"
                [disabled]="paying()"
                (click)="pay()"
              >
                @if (paying()) {
                  Paying…
                } @else if (v.needsGateway) {
                  Pay {{ money(v.selfPay) }}
                } @else {
                  Confirm and continue
                }
              </button>

              @if (v.needsGateway) {
                <p class="mt-2 text-center text-xs text-ink-500">
                  Payment gateway is simulated — no card is charged.
                </p>
              }
            </section>
          }

          <!-- Receipt. Confirms the payment only; the tax invoice comes at completion. -->
          @if (v.receiptNumber; as receipt) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Receipt</h2>
                <span class="text-xs text-ink-500">{{ receipt }}</span>
              </div>
              <dl class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid by you</dt>
                  <dd class="font-medium text-ink-900">{{ money(v.selfPay) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Blocked from wallet</dt>
                  <dd class="font-medium text-ink-900">{{ money(v.blocked) }}</dd>
                </div>
                @if (v.journey.paidAt) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Paid on</dt>
                    <dd class="font-medium text-ink-900">{{ stamp(v.journey.paidAt) }}</dd>
                  </div>
                }
              </dl>
              <p class="mt-3 text-xs text-ink-500">
                This receipt confirms your payment. It is not the tax invoice, which is raised once
                the consultation is closed.
              </p>
            </section>
          }

          <!-- Cashless letter: what the member shows at the clinic. -->
          @if (hasLetter()) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Cashless letter</h2>
              <div class="mt-3 rounded-xl border border-dashed border-[#0F5FDC] bg-[#F5F8FF] p-4">
                <p class="text-sm font-semibold text-[#0B2C63]">Authorisation for cashless consultation</p>
                <dl class="mt-3 space-y-1 text-sm text-ink-700">
                  <div class="flex justify-between gap-3">
                    <dt>Patient</dt>
                    <dd class="font-medium text-ink-900">{{ v.journey.patientName }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt>Doctor</dt>
                    <dd class="font-medium text-ink-900">{{ v.journey.doctorName }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt>Clinic</dt>
                    <dd class="font-medium text-ink-900">{{ v.journey.clinicName }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt>Approved amount</dt>
                    <dd class="font-medium text-ink-900">{{ money(v.blocked) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt>Reference</dt>
                    <dd class="font-medium text-ink-900">{{ appointmentId() }}</dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                class="mt-4 min-h-touch w-full rounded-xl border-2 border-[#0F5FDC] px-6 text-sm font-semibold text-[#0F5FDC] transition-colors hover:bg-blue-50"
                (click)="downloadLetter()"
              >
                Download letter
              </button>
              <p class="mt-2 text-center text-xs text-ink-500">
                A copy would also be emailed. Email delivery is not connected yet.
              </p>
            </section>
          }

          <!-- Prescription. The upload is what closes the consultation. -->
          @if (canUpload()) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Upload prescription</h2>
              <p class="mt-1 text-sm text-ink-700">
                Upload the prescription your doctor gave you. This is needed to close the
                consultation.
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                class="mt-3 block w-full text-sm text-ink-700 file:mr-3 file:min-h-touch file:rounded-xl file:border-0 file:bg-[#EAF1FB] file:px-4 file:text-sm file:font-semibold file:text-[#0F5FDC]"
                (change)="pickPrescription($event)"
              />
              @if (v.journey.prescriptionName; as name) {
                <p class="mt-2 text-sm text-success-700">{{ name }} attached</p>
              }
              <p class="mt-2 text-xs text-ink-500">
                The file is not stored yet — appointments have no document upload behind them.
              </p>
              <button
                type="button"
                class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
                [disabled]="!v.journey.prescriptionName"
                (click)="act('COMPLETE')"
              >
                Close consultation
              </button>
            </section>
          }

          <!-- Invoice. Raised at completion, with the debit. -->
          @if (v.invoiceNumber; as invoice) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Invoice</h2>
                <span class="text-xs text-ink-500">{{ invoice }}</span>
              </div>
              <dl class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Consultation fee</dt>
                  <dd class="font-medium text-ink-900">{{ money(v.fee) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Debited from wallet</dt>
                  <dd class="font-medium text-ink-900">{{ money(v.blocked) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid by you</dt>
                  <dd class="font-medium text-ink-900">{{ money(v.selfPay) }}</dd>
                </div>
              </dl>
            </section>
          }

          <!-- The member's own way out, while nothing has been collected. It
               cancels the real appointment as well as this journey — see cancel(). -->
          @if (canCancel()) {
            <button
              type="button"
              class="mt-5 min-h-touch w-full rounded-xl border border-danger-600 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-60"
              [disabled]="cancelling()"
              (click)="release('CANCEL')"
            >
              {{ cancelling() ? 'Cancelling…' : 'Cancel this request' }}
            </button>
          }

          @if (cancelProblem(); as problem) {
            <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ problem }}
            </p>
          }

          <!--
            Stands in for everyone outside this app: operations ringing the clinic,
            the clinic reporting attendance. None of them can reach us today, so
            the actions are here and labelled rather than hidden behind a pretence
            that they happened by themselves.
          -->
          @if (simulated().length) {
            <section
              class="mt-5 rounded-2xl border border-dashed border-warning-700 bg-warning-50 p-5 lg:p-6"
            >
              <h2 class="text-sm font-semibold text-warning-700">Simulated — not part of the member journey</h2>
              <p class="mt-1 text-xs text-warning-700">
                Operations confirming with the clinic, and the clinic reporting the visit, have no
                integration yet. Use these to walk the flow.
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (action of simulated(); track action.event) {
                  <button
                    type="button"
                    class="min-h-touch rounded-xl border border-warning-700 bg-white px-4 text-sm font-medium text-warning-700 disabled:opacity-60"
                    [disabled]="cancelling()"
                    (click)="simulate(action.event)"
                  >
                    {{ action.label }}
                  </button>
                }
              </div>
            </section>
          }
        } @else {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-6 text-center shadow-sm">
            <p class="font-medium text-ink-900">We could not find this request</p>
            <p class="mt-1 text-sm text-ink-500">
              This journey is held on this device only, so signing out or switching device clears
              it.
            </p>
            <a
              routerLink="/member/bookings"
              [queryParams]="{ tab: 'doctors' }"
              class="mt-4 inline-flex min-h-touch items-center rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white"
              >Go to bookings</a
            >
          </section>
        }
      </div>
    </div>
  `,
})
export class InClinicJourneyPage {
  readonly appointmentId = input<string>('');

  private readonly store = inject(InClinicFlowStore);
  private readonly booking = inject(AppointmentBookingStore);
  private readonly transactions = inject(TransactionsStore);

  protected readonly money = formatMoney;
  protected readonly paymentProblem = signal<string | null>(null);
  protected readonly cancelProblem = signal<string | null>(null);
  protected readonly cancelling = signal(false);
  protected readonly paying = signal(false);

  protected readonly canCancel = computed(() => this.view()?.allowed.includes('CANCEL') === true);

  protected readonly view = computed(() => this.store.view(this.appointmentId()));

  constructor() {
    // The drawn journey never otherwise learns that operations confirmed (or
    // cancelled) the real appointment — reconcile once per visit to this
    // screen. PAID/VISITED/COMPLETED stay drawn: the backend has no field
    // that distinguishes them from COMPLETED alone.
    effect(() => {
      const id = this.appointmentId();
      if (id) void this.reconcile(id);
    });
  }

  private async reconcile(appointmentId: string): Promise<void> {
    const status = await this.booking.remoteStatus(appointmentId);
    const stage = this.store.view(appointmentId)?.journey.stage;
    if (!status || !stage) return;
    if (status === 'CONFIRMED' && stage === 'REQUESTED') {
      this.store.apply(appointmentId, 'CONFIRM');
    } else if (status === 'CANCELLED' && stage !== 'CANCELLED' && stage !== 'DECLINED') {
      this.store.apply(appointmentId, 'CANCEL');
    }
  }

  protected readonly dateLabel = computed(() => {
    const raw = this.view()?.journey.appointmentDate ?? '';
    const parsed = raw ? new Date(raw) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? DATE.format(parsed) : raw;
  });

  /** The letter is issued once the payment step is behind the member. */
  protected readonly hasLetter = computed(() => this.view()?.journey.paidAt != null);

  protected readonly canUpload = computed(() => this.view()?.journey.stage === 'VISITED');

  protected readonly timeline = computed(() => {
    const journey = this.view()?.journey;
    if (!journey) return [];
    return [
      { label: 'Request raised, wallet blocked', at: journey.raisedAt, done: true },
      {
        label: 'Clinic confirmed the slot',
        at: journey.confirmedAt,
        done: journey.confirmedAt !== null,
      },
      { label: 'Payment settled', at: journey.paidAt, done: journey.paidAt !== null },
      { label: 'Visit completed', at: journey.visitedAt, done: journey.visitedAt !== null },
      {
        label: 'Consultation closed, wallet debited',
        at: journey.completedAt,
        done: journey.completedAt !== null,
      },
    ];
  });

  /**
   * The actions that belong to somebody else — operations or the clinic. The
   * member's own actions (pay, upload, close) are offered in their own sections
   * and deliberately not repeated here.
   */
  protected readonly simulated = computed(() => {
    const allowed = this.view()?.allowed ?? [];
    return [
      { event: 'CONFIRM' as const, label: 'Operations confirms with clinic' },
      { event: 'DECLINE' as const, label: 'Clinic declines the slot' },
      { event: 'VISIT' as const, label: 'Mark visit completed' },
      { event: 'NO_SHOW' as const, label: 'Clinic reports no show' },
    ].filter((action) => allowed.includes(action.event));
  });

  protected stamp(iso: string | null): string {
    if (!iso) return '';
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? '' : STAMP.format(parsed);
  }

  protected toneClass(tone: string): string {
    return TONES[tone] ?? TONES['neutral'];
  }

  /** Said in the member's terms: held money is still theirs, and debited is not. */
  protected readonly walletNote = computed(() => {
    const view = this.view();
    if (!view) return '';
    switch (view.wallet) {
      case 'HELD':
        return `${formatMoney(view.blocked)} is blocked from your wallet for this appointment. If the slot cannot be confirmed, or you cancel, it is released back to you in full.`;
      case 'DEBITED':
        return `${formatMoney(view.blocked)} has been debited from your wallet for this consultation.`;
      default:
        return `${formatMoney(view.blocked)} has been released back to your wallet. Nothing was charged.`;
    }
  });

  protected readonly walletNoteClass = computed(() => {
    switch (this.view()?.wallet) {
      case 'DEBITED':
        return 'bg-[#EAF1FB] text-[#0B2C63]';
      case 'RELEASED':
        return 'bg-success-50 text-success-700';
      default:
        return 'bg-warning-50 text-warning-700';
    }
  });

  /**
   * Settles the self-payment.
   *
   * Where the API raised a copay payment, this completes that real record —
   * which also moves the appointment itself to CONFIRMED, so the bookings list
   * and this screen agree from here on. The gateway is still a stand-in: the
   * API's `mark-paid` takes the member's word for it, which is precisely the
   * hole the wallet-block change closes with a verified webhook.
   */
  protected async pay(): Promise<void> {
    const view = this.view();
    if (!view) return;

    this.paying.set(true);
    this.paymentProblem.set(null);
    const paymentId = view.journey.paymentId;
    const settled = paymentId ? await this.transactions.markPaid(paymentId) : true;
    this.paying.set(false);

    if (!settled) {
      this.paymentProblem.set('We could not complete that payment. Try again in a moment.');
      return;
    }
    if (!this.store.apply(this.appointmentId(), 'PAY')) {
      this.paymentProblem.set('That payment went through but we could not update this page. Reload it.');
    }
  }

  /** Drawn-only steps: nobody outside this app can tell us these happened. */
  protected act(event: 'CONFIRM' | 'VISIT' | 'COMPLETE'): void {
    this.store.apply(this.appointmentId(), event);
  }

  /**
   * The stand-in actions. Two of them end the booking for real — a clinic that
   * declines and a no-show both release the money — so they take the release
   * path rather than only redrawing the stage.
   */
  protected simulate(event: 'CONFIRM' | 'DECLINE' | 'VISIT' | 'NO_SHOW'): void {
    if (event === 'DECLINE' || event === 'NO_SHOW') {
      void this.release(event);
      return;
    }
    this.act(event);
  }

  /**
   * Every way out of this journey, and all three really cancel the appointment.
   *
   * Cancelling is what returns the money: where a copay debited the wallet at
   * request time, the API credits it back in full (verified live — 48,900 back
   * to 49,150). So "released" on screen is a true statement rather than a
   * drawn one, and it must not be shown unless the API agreed.
   *
   * A no-show goes through the same door on purpose. The sheet records that
   * penalisation is still to be discussed, so keeping the member's money
   * against an undecided penalty would be inventing the policy.
   */
  protected async release(event: 'CANCEL' | 'DECLINE' | 'NO_SHOW'): Promise<void> {
    this.cancelling.set(true);
    this.cancelProblem.set(null);
    const cancelled = await this.booking.cancelAppointment(this.appointmentId());
    this.cancelling.set(false);
    if (!cancelled) {
      this.cancelProblem.set(
        'We could not release this appointment. It may already have started — call the helpline if you need it withdrawn.',
      );
      return;
    }
    this.store.apply(this.appointmentId(), event);
  }

  protected pickPrescription(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.store.attach(this.appointmentId(), file.name);
  }

  /**
   * Hands the member something they can carry to the clinic. A text file rather
   * than a PDF: the app has no PDF library, and adding one to render five lines
   * that the API will eventually render properly is not worth the weight.
   */
  protected downloadLetter(): void {
    const view = this.view();
    if (!view) return;
    const lines = [
      'AUTHORISATION FOR CASHLESS CONSULTATION',
      '',
      `Reference:       ${view.journey.appointmentId}`,
      `Patient:         ${view.journey.patientName}`,
      `Doctor:          ${view.journey.doctorName} (${view.journey.specialty})`,
      `Clinic:          ${view.journey.clinicName}, ${view.journey.clinicAddress}`,
      `Appointment:     ${this.dateLabel()} at ${view.journey.timeSlot}`,
      `Approved amount: ${formatMoney(view.blocked)}`,
      '',
      'Present this letter at the clinic reception.',
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `cashless-letter-${view.journey.appointmentId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
