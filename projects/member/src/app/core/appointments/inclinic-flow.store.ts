import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { Money, money } from '../domain/money';
import { SessionStore } from '../session/session.store';
import {
  InClinicEvent,
  InClinicJourney,
  StageDisplay,
  StartJourneyInput,
  WalletState,
  advance,
  allowedEvents,
  attachPrescription,
  awaitingPayment,
  invoiceNumber,
  needsGateway,
  receiptNumber,
  stageDisplay,
  startJourney,
  walletState,
} from './inclinic-flow';

/**
 * Holds the drawn half of the in-clinic journey.
 *
 * The appointment itself is real and lives in the API. Everything this store
 * knows — the block, the confirmation, the receipt, the letter, the visit, the
 * invoice, the debit — is drawn, because the wallet exposes no way to hold or
 * capture a balance and the member's app can only read it. See
 * `inclinic-flow.ts` for why that is deliberate rather than a shortcut.
 *
 * Persisted to `localStorage` so a reload does not lose a half-walked journey,
 * and cleared on sign-out because it carries the patient's name.
 */
const STORAGE_KEY = 'opd.member.inclinic-journeys.v1';

export interface InClinicJourneyView {
  readonly journey: InClinicJourney;
  readonly display: StageDisplay;
  readonly wallet: WalletState;
  readonly fee: Money;
  readonly blocked: Money;
  readonly selfPay: Money;
  readonly awaitingPayment: boolean;
  readonly needsGateway: boolean;
  readonly receiptNumber: string | null;
  readonly invoiceNumber: string | null;
  readonly allowed: readonly InClinicEvent[];
}

@Injectable({ providedIn: 'root' })
export class InClinicFlowStore {
  private readonly session = inject(SessionStore);

  private readonly _journeys = signal<Readonly<Record<string, InClinicJourney>>>(read());

  readonly journeys = this._journeys.asReadonly();

  /** Confirmed bookings the member has not settled — what the cart-ready notice counts. */
  readonly awaitingPayment = computed(() =>
    Object.values(this._journeys()).filter(awaitingPayment),
  );

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.clear();
    });
  }

  view(appointmentId: string): InClinicJourneyView | null {
    const journey = this._journeys()[appointmentId];
    return journey ? toView(journey) : null;
  }

  start(input: StartJourneyInput): InClinicJourney {
    const journey = startJourney(input);
    this.write({ ...this._journeys(), [journey.appointmentId]: journey });
    return journey;
  }

  /**
   * Applies an event. False means the journey refused it — the caller offered
   * an action the stage does not allow, which is a bug rather than a no-op.
   */
  apply(appointmentId: string, event: InClinicEvent): boolean {
    const journey = this._journeys()[appointmentId];
    if (!journey) return false;
    const next = advance(journey, event, new Date().toISOString());
    if (!next) return false;
    this.write({ ...this._journeys(), [appointmentId]: next });
    return true;
  }

  attach(appointmentId: string, fileName: string): void {
    const journey = this._journeys()[appointmentId];
    if (!journey) return;
    this.write({
      ...this._journeys(),
      [appointmentId]: attachPrescription(journey, fileName),
    });
  }

  private write(next: Readonly<Record<string, InClinicJourney>>): void {
    this._journeys.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // A full or blocked store must not break the journey on screen.
    }
  }

  private clear(): void {
    this._journeys.set({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do — the in-memory copy is already gone.
    }
  }
}

function toView(journey: InClinicJourney): InClinicJourneyView {
  return {
    journey,
    display: stageDisplay(journey.stage),
    wallet: walletState(journey),
    fee: money(journey.fee),
    blocked: money(journey.blocked),
    selfPay: money(journey.selfPay),
    awaitingPayment: awaitingPayment(journey),
    needsGateway: needsGateway(journey),
    receiptNumber: receiptNumber(journey),
    invoiceNumber: invoiceNumber(journey),
    allowed: allowedEvents(journey),
  };
}

function read(): Readonly<Record<string, InClinicJourney>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, InClinicJourney>)
      : {};
  } catch {
    return {};
  }
}
