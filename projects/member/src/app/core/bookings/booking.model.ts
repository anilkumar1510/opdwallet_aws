import { ClaimStatus } from '../claims/claim.model';
import { Money } from '../domain/money';

/** Which source a booking came from, so one list can carry all three. */
/**
 * Values are web-member's own `?tab=` keys, so a link from either portal
 * lands on the same list.
 */
export const BookingKind = {
  Appointment: 'doctors',
  Lab: 'lab',
  Diagnostic: 'diagnostic',
  Pharmacy: 'pharmacy',
  Dental: 'dental',
  Vision: 'vision',
  Ahc: 'ahc',
  Vaccination: 'vaccination',
} as const;

export type BookingKind = (typeof BookingKind)[keyof typeof BookingKind];

export const BOOKING_KIND_LABELS: Readonly<Record<BookingKind, string>> = {
  [BookingKind.Appointment]: 'Doctors',
  [BookingKind.Lab]: 'Lab',
  [BookingKind.Diagnostic]: 'Diagnostic',
  [BookingKind.Pharmacy]: 'Pharmacy',
  [BookingKind.Dental]: 'Dental',
  [BookingKind.Vision]: 'Vision',
  [BookingKind.Ahc]: 'Health checkup',
  [BookingKind.Vaccination]: 'Vaccination',
};

/**
 * One normalised booking across consultations, dental and vision.
 *
 * `scheduledFor` is a Date; `hasExactTime` says whether the time of day in it
 * is real. Appointments give a date and a display string only, so their time
 * is not trustworthy — dental and vision give a parseable 24-hour time.
 * Anything sorting or comparing must respect that difference.
 */
export interface Booking {
  readonly id: string;
  readonly kind: BookingKind;
  readonly kindLabel: string;
  readonly reference: string;
  readonly patientName: string;
  /** Doctor for a consultation, service name for dental and vision. */
  readonly title: string;
  readonly subtitle: string;
  readonly location: string;
  readonly scheduledFor: Date | null;
  readonly hasExactTime: boolean;
  /** The API's own display string, e.g. "2:00 PM" or "12:30". */
  readonly timeLabel: string;
  readonly amount: Money;
  readonly walletPaid: Money | null;
  readonly selfPaid: Money | null;
  /**
   * What the member still owes on this booking, or null when nothing is
   * outstanding. Distinct from `selfPaid`, which is their share whether or not
   * it has been settled — the two are the same number until it is paid, and the
   * row could not tell a settled booking from an unsettled one without this.
   *
   * Only dental and vision can populate it: `GET appointments/user/:id` returns
   * no payment fields at all, so a consultation's outstanding copay is not
   * knowable from the list. See `audit/20-copay-continuation.md`.
   */
  readonly outstanding: Money | null;
  readonly status: ClaimStatus;
  readonly isUpcoming: boolean;
  readonly hasPrescription: boolean;
  /**
   * True for a dental/vision booking whose invoice the API has generated, and —
   * confusingly — for a lab/diagnostic order with REPORTS (`reportCount > 0`).
   * Two meanings on one flag; read `invoicePath` when you mean an invoice.
   */
  readonly hasInvoice: boolean;
  /**
   * Where the invoice PDF is fetched from, or null when there is none.
   *
   * Set only for dental and vision — the only kinds with a real invoice route.
   * A lab order's `hasInvoice` is a report count and must never reach the
   * vision/dental invoice endpoint.
   */
  readonly invoicePath: string | null;
  /**
   * Where to POST to cancel this prescription, or null when it cannot be
   * cancelled. Set only for a prescription row still in UPLOADED status — the
   * API refuses every other status (`lab-prescription.service.ts:322`).
   *
   * Separate from `isCancellable`, which governs cancelling a BOOKING and routes
   * to an entirely different set of endpoints. A lab ORDER and a lab
   * PRESCRIPTION are both `BookingKind.Lab`, so the two must not share a flag.
   */
  readonly cancelPrescriptionPath: string | null;
  /**
   * IN_CLINIC or ONLINE for a doctor appointment, null for everything else.
   *
   * web-member refetches `appointments/user/:id?type=…` per hub screen; this
   * list already holds every appointment, so the hubs filter on this instead of
   * issuing a second request for a subset of what is in memory.
   */
  readonly consultMode: 'IN_CLINIC' | 'ONLINE' | null;
  /** Raw API status, kept so cancellability can be judged on the real code. */
  readonly statusCode: string;
  /**
   * Whether the member may still cancel. web-member allows it only from
   * PENDING_CONFIRMATION or CONFIRMED, and only while the booking is still in
   * the future. Lab and diagnostic rows are never cancellable from here —
   * those have their own endpoints on their own screens.
   */
  readonly isCancellable: boolean;
}
