/**
 * The in-clinic consultation journey, from the moment the request is raised.
 *
 * The sequence is the one the patient-flows sheet describes and the API does
 * not implement: the wallet portion is BLOCKED when the request is raised,
 * operations confirm the slot with the clinic, the member then reviews the cart
 * and settles any self-payment through the gateway, and the block becomes a
 * debit only when the consultation is closed. A clinic that declines releases
 * the block — nothing was charged, so there is nothing to refund.
 *
 * **What is real and what is drawn, measured against the running API rather
 * than assumed.** The appointment and its pending status are real. Where the
 * policy carries a copay the API debits the wallet as the request is created —
 * so the amount this module calls "blocked" is money that has genuinely left,
 * and cancelling credits it back in full (verified: 49,150 → 48,900 on
 * creation, back to 49,150 on cancellation). Where no copay applies nothing is
 * debited and the block is a label only. Either way the release is real,
 * because every path out of this journey cancels the appointment.
 *
 * Drawn: the confirmation, the letter, the visit, the invoice, and the moment
 * the block "becomes" a debit — there is no held state to convert. The wallet
 * exposes no hold and this app can only read it, which is the change the
 * journey is waiting on (`openspec/changes/wallet-block-and-razorpay`).
 *
 * Leaf module by design — no imports, so it stays runnable under node for
 * `inclinic-flow.check.ts`. Amounts are plain numbers because the journey is
 * persisted as JSON; the store maps them to `Money` before a template sees one.
 */

export const IN_CLINIC_STAGE = {
  /** Request raised, wallet portion blocked, waiting on the clinic. */
  Requested: 'REQUESTED',
  /** Clinic agreed the slot. The cart is now the member's to settle. */
  Confirmed: 'CONFIRMED',
  /** Self-payment settled, or nothing was owed. Cashless letter issued. */
  Paid: 'PAID',
  Visited: 'VISITED',
  /** Closed. The block becomes a debit here and nowhere earlier. */
  Completed: 'COMPLETED',
  /** Clinic could not take the slot. */
  Declined: 'DECLINED',
  Cancelled: 'CANCELLED',
  NoShow: 'NO_SHOW',
} as const;

export type InClinicStage = (typeof IN_CLINIC_STAGE)[keyof typeof IN_CLINIC_STAGE];

export type InClinicEvent =
  | 'CONFIRM'
  | 'DECLINE'
  | 'PAY'
  | 'VISIT'
  | 'COMPLETE'
  | 'NO_SHOW'
  | 'CANCEL';

/**
 * Cancellation is offered only while nothing has been collected. Once the
 * self-payment is taken the member's exit is a no-show, which is what the sheet
 * models — a refund path would be inventing policy that is still open.
 */
const NEXT: Readonly<Record<InClinicStage, Readonly<Partial<Record<InClinicEvent, InClinicStage>>>>> =
  {
    REQUESTED: { CONFIRM: 'CONFIRMED', DECLINE: 'DECLINED', CANCEL: 'CANCELLED' },
    CONFIRMED: { PAY: 'PAID', CANCEL: 'CANCELLED' },
    PAID: { VISIT: 'VISITED', NO_SHOW: 'NO_SHOW' },
    VISITED: { COMPLETE: 'COMPLETED' },
    COMPLETED: {},
    DECLINED: {},
    CANCELLED: {},
    NO_SHOW: {},
  };

export interface InClinicJourney {
  readonly appointmentId: string;
  readonly stage: InClinicStage;
  readonly doctorName: string;
  readonly specialty: string;
  readonly clinicName: string;
  readonly clinicAddress: string;
  readonly patientName: string;
  /** ISO date, as the appointment was filed. */
  readonly appointmentDate: string;
  readonly timeSlot: string;
  readonly fee: number;
  /** The wallet-eligible portion, held from the request onwards. */
  readonly blocked: number;
  /** Copay plus anything above the service limit, collected after confirmation. */
  readonly selfPay: number;
  readonly copayPercentage: number;
  /**
   * The API's own PENDING payment for the self-payment, when it raised one.
   *
   * On a copay policy the payment it creates alongside the appointment is
   * exactly what the member owes, so the journey settles that real record at
   * the payment step rather than drawing one beside it. Null when the wallet
   * covers everything and nothing is owed.
   */
  readonly paymentId: string | null;
  readonly raisedAt: string;
  readonly confirmedAt: string | null;
  readonly paidAt: string | null;
  readonly visitedAt: string | null;
  readonly completedAt: string | null;
  readonly prescriptionName: string | null;
}

export interface StartJourneyInput {
  readonly appointmentId: string;
  readonly doctorName: string;
  readonly specialty: string;
  readonly clinicName: string;
  readonly clinicAddress: string;
  readonly patientName: string;
  readonly appointmentDate: string;
  readonly timeSlot: string;
  readonly fee: number;
  readonly blocked: number;
  readonly selfPay: number;
  readonly copayPercentage: number;
  readonly paymentId: string | null;
  readonly at: string;
}

export function startJourney(input: StartJourneyInput): InClinicJourney {
  return {
    appointmentId: input.appointmentId,
    stage: IN_CLINIC_STAGE.Requested,
    doctorName: input.doctorName,
    specialty: input.specialty,
    clinicName: input.clinicName,
    clinicAddress: input.clinicAddress,
    patientName: input.patientName,
    appointmentDate: input.appointmentDate,
    timeSlot: input.timeSlot,
    fee: input.fee,
    blocked: input.blocked,
    selfPay: input.selfPay,
    copayPercentage: input.copayPercentage,
    paymentId: input.paymentId,
    raisedAt: input.at,
    confirmedAt: null,
    paidAt: null,
    visitedAt: null,
    completedAt: null,
    prescriptionName: null,
  };
}

/**
 * Applies an event, or answers null when the journey does not allow it.
 *
 * Null rather than the journey unchanged: a refused transition that looks like
 * a successful one is how a dead button hides. Screens offer only
 * `allowedEvents`, so null reaching a caller means a genuine bug.
 */
export function advance(
  journey: InClinicJourney,
  event: InClinicEvent,
  at: string,
): InClinicJourney | null {
  const stage = NEXT[journey.stage][event];
  if (!stage) return null;

  // "Upload is needed to close the consultation" — the sheet's rule, enforced
  // here rather than in a screen, so no route around it can close a
  // consultation with no prescription filed against it.
  if (event === 'COMPLETE' && !journey.prescriptionName) return null;

  return {
    ...journey,
    stage,
    confirmedAt: event === 'CONFIRM' ? at : journey.confirmedAt,
    paidAt: event === 'PAY' ? at : journey.paidAt,
    visitedAt: event === 'VISIT' ? at : journey.visitedAt,
    completedAt: event === 'COMPLETE' ? at : journey.completedAt,
  };
}

/** The prescription the member photographs at the clinic. Name only — see the file note. */
export function attachPrescription(journey: InClinicJourney, fileName: string): InClinicJourney {
  return { ...journey, prescriptionName: fileName.trim() || null };
}

export function allowedEvents(journey: InClinicJourney): readonly InClinicEvent[] {
  return (Object.keys(NEXT[journey.stage]) as InClinicEvent[]).filter(
    (event) => event !== 'COMPLETE' || journey.prescriptionName !== null,
  );
}

export type WalletState = 'HELD' | 'DEBITED' | 'RELEASED';

/**
 * What the blocked amount is doing.
 *
 * A no-show releases it: the sheet records that penalisation is still to be
 * discussed, so keeping the member's money against an undecided penalty would
 * be inventing the policy.
 */
export function walletState(journey: InClinicJourney): WalletState {
  switch (journey.stage) {
    case IN_CLINIC_STAGE.Completed:
      return 'DEBITED';
    case IN_CLINIC_STAGE.Declined:
    case IN_CLINIC_STAGE.Cancelled:
    case IN_CLINIC_STAGE.NoShow:
      return 'RELEASED';
    default:
      return 'HELD';
  }
}

/** True while the member still owes the self-payment on a confirmed booking. */
export function awaitingPayment(journey: InClinicJourney): boolean {
  return journey.stage === IN_CLINIC_STAGE.Confirmed;
}

/**
 * The gateway step is skipped when the wallet covers everything — the sheet
 * sends the member to Razorpay only "if co-payment or a per transaction limit
 * applies".
 */
export function needsGateway(journey: InClinicJourney): boolean {
  return journey.selfPay > 0;
}

/** Drawn documents, numbered off the appointment so they are stable across reloads. */
export function receiptNumber(journey: InClinicJourney): string | null {
  return journey.paidAt ? `RCPT-${journey.appointmentId}` : null;
}

export function invoiceNumber(journey: InClinicJourney): string | null {
  return journey.completedAt ? `INV-${journey.appointmentId}` : null;
}

export interface StageDisplay {
  readonly label: string;
  readonly tone: 'neutral' | 'progress' | 'positive' | 'negative';
  /** What the member should understand is happening, in their words. */
  readonly detail: string;
}

const DISPLAY: Readonly<Record<InClinicStage, StageDisplay>> = {
  REQUESTED: {
    label: 'Pending confirmation',
    tone: 'progress',
    detail:
      'We are confirming your slot with the clinic. Your wallet is blocked for this appointment and nothing has been taken from your card.',
  },
  CONFIRMED: {
    label: 'Cart ready',
    tone: 'progress',
    detail: 'The clinic has confirmed your slot. Review the amount and complete your payment.',
  },
  PAID: {
    label: 'Confirmed',
    tone: 'positive',
    detail: 'Payment received. Carry your cashless letter to the clinic.',
  },
  VISITED: {
    label: 'Visit completed',
    tone: 'progress',
    detail: 'Upload the prescription your doctor gave you to close this consultation.',
  },
  COMPLETED: {
    label: 'Completed',
    tone: 'positive',
    detail: 'This consultation is closed and your invoice is available.',
  },
  DECLINED: {
    label: 'Not confirmed',
    tone: 'negative',
    detail: 'The clinic could not take this slot. Your wallet has been released in full.',
  },
  CANCELLED: {
    label: 'Cancelled',
    tone: 'neutral',
    detail: 'This request was cancelled and your wallet has been released.',
  },
  NO_SHOW: {
    label: 'Not attended',
    tone: 'negative',
    detail: 'The clinic reported that this appointment was not attended.',
  },
};

export function stageDisplay(stage: InClinicStage): StageDisplay {
  return DISPLAY[stage];
}
