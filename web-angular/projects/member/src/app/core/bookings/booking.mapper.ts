import { ClaimStatus } from '../claims/claim.model';
import { toDate } from '../domain/codes';
import { money } from '../domain/money';
import { Cart } from '../lab/cart';
// lab.mapper imports nothing from bookings/, so this is not a cycle.
import { LAB_API } from '../lab/lab.mapper';
import { LabKind, LabOrder, LabPrescription } from '../lab/lab.model';
import { CLINIC_BOOKING_API } from '../clinic-booking/clinic-booking';
import { OrderDto as PharmacyOrderDto, PHARMACY_API, toOrder as toPharmacyOrder } from '../pharmacy/pharmacy';
import { AhcOrderDto } from './booking.dto';
import { AppointmentDto } from './appointment.dto';
import { ServiceBookingDto } from './booking.dto';
import { BOOKING_KIND_LABELS, Booking, BookingKind } from './booking.model';

/**
 * Every URL these three sources use, beside the shapes they return. Changing
 * an endpoint means editing this file only.
 */
export const BOOKINGS_API = {
  appointmentsByUser: (userId: string) => `appointments/user/${userId}`,
  /**
   * All three cancel routes take the **business** id (Booking.reference), not
   * the Mongo _id, and each uses a different verb. Appointments take no body;
   * dental and vision take an optional `reason`.
   */
  cancelAppointment: (reference: string) => `appointments/${reference}/user-cancel`,
  cancelDental: (reference: string) => `dental-bookings/${reference}/cancel`,
  cancelVision: (reference: string) => `vision-bookings/${reference}/cancel`,
  /** Vaccination lives under member/vaccination, not its own top-level prefix. */
  cancelVaccination: (reference: string) => `member/vaccination/bookings/${reference}/cancel`,
  vaccinationInvoice: (reference: string) => `member/vaccination/bookings/${reference}/invoice`,
  /*
   * REMOVED — `appointments/user/:userId/ongoing`.
   *
   * Wired in session 53 as the active-appointment nudge, a mobile banner ported
   * from `web-member/components/ActiveAppointmentNudge.tsx`. **Removed in
   * session 54 at the member's request** — it floated above the bottom nav and
   * covered the Health Benefits cards on the home screen.
   *
   * This is a DECLINED port, not an oversight. The reference mounts it in its
   * member layout inside a `lg:hidden` wrapper (`layout.tsx:69-73`); the desktop
   * `section` variant it imports is never rendered. If it is ever wanted back,
   * `audit/37-fix-all-apis.md` records the behaviour, both destinations
   * (bookings doctors tab, or the prescription when COMPLETED) and the
   * bare-array response shape.
   */
  dentalByUser: (userId: string) => `dental-bookings/user/${userId}`,
  visionByUser: (userId: string) => `vision-bookings/user/${userId}`,
  /** Vaccination takes userId as a query param, not a path segment — its own controller's shape. */
  vaccinationByUser: (userId: string) => `member/vaccination/bookings?userId=${userId}`,
} as const;

const STATUSES: Readonly<Record<string, ClaimStatus>> = {
  SCHEDULED: { label: 'Scheduled', tone: 'progress', isFinal: false },
  PENDING: { label: 'Pending', tone: 'progress', isFinal: false },
  CONFIRMED: { label: 'Confirmed', tone: 'positive', isFinal: false },
  DELIVERED: { label: 'Delivered', tone: 'neutral', isFinal: true },
  COMPLETED: { label: 'Completed', tone: 'neutral', isFinal: true },
  CANCELLED: { label: 'Cancelled', tone: 'negative', isFinal: true },
  NO_SHOW: { label: 'Missed', tone: 'negative', isFinal: true },
  REFUNDED: { label: 'Refunded', tone: 'neutral', isFinal: true },
};

function toStatus(value: string | undefined): ClaimStatus {
  const key = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (key && STATUSES[key]) return STATUSES[key];
  const label = (key ?? 'UNKNOWN').replace(/_+/g, ' ').toLowerCase();
  return { label: label.charAt(0).toUpperCase() + label.slice(1), tone: 'neutral', isFinal: false };
}

/**
 * Upcoming is decided on the day, not the instant, because appointments carry
 * no trustworthy time. Comparing an exact dental time against a midnight
 * appointment would make the same day sort inconsistently.
 *
 * ponytail: day-granularity comparison — a 9am appointment still reads as
 * "upcoming" at 6pm the same day. Upgrade path: have the appointments API
 * return a real timestamp, then compare instants and drop `hasExactTime`.
 */
/** web-member offers cancel only from these two statuses. */
const CANCELLABLE = ['PENDING_CONFIRMATION', 'CONFIRMED'];

function isUpcoming(scheduledFor: Date | null, status: ClaimStatus, now: Date): boolean {
  if (status.isFinal || !scheduledFor) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(
    scheduledFor.getFullYear(),
    scheduledFor.getMonth(),
    scheduledFor.getDate(),
  );
  return day >= today;
}

export function appointmentToBooking(dto: AppointmentDto, now: Date): Booking {
  const status = toStatus(dto.status);
  const code = dto.status?.trim().toUpperCase() ?? '';
  const scheduledFor = toDate(dto.appointmentDate);
  const isOnline = dto.appointmentType?.trim().toUpperCase() === 'ONLINE';

  return {
    id: dto._id ?? dto.appointmentId ?? '',
    kind: BookingKind.Appointment,
    kindLabel: BOOKING_KIND_LABELS[BookingKind.Appointment],
    reference: dto.appointmentId ?? dto.appointmentNumber ?? '',
    patientName: dto.patientName?.trim() || 'Member',
    title: dto.doctorName?.trim() ? `Dr. ${dto.doctorName.trim()}` : 'Doctor to be assigned',
    subtitle: `${dto.specialty?.trim() || 'General'} · ${isOnline ? 'Video consultation' : 'In clinic'}`,
    location: isOnline ? 'Video consultation' : dto.clinicName?.trim() || 'Clinic to be confirmed',
    scheduledFor,
    // The API sends a date with no time; "2:00 PM" is a display string only.
    hasExactTime: false,
    timeLabel: dto.timeSlot?.trim() || '',
    amount: money(dto.consultationFee),
    walletPaid: null,
    selfPaid: null,
    outstanding: null,
    status,
    isUpcoming: isUpcoming(scheduledFor, status, now),
    hasPrescription: dto.hasPrescription === true,
    hasInvoice: false,
    invoicePath: null,
    cancelPrescriptionPath: null,
    consultMode: isOnline ? 'ONLINE' : 'IN_CLINIC',
    statusCode: code,
    isCancellable: CANCELLABLE.includes(code) && isUpcoming(scheduledFor, status, now),
  };
}

/** "12:30" applied to the booking's date. Returns the date unchanged if unparseable. */
function withTime(date: Date | null, time: string | undefined): { at: Date | null; exact: boolean } {
  if (!date) return { at: null, exact: false };
  const match = /^(\d{1,2}):(\d{2})$/.exec(time?.trim() ?? '');
  if (!match) return { at: date, exact: false };

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return { at: date, exact: false };

  const at = new Date(date);
  at.setHours(hours, minutes, 0, 0);
  return { at, exact: true };
}

/**
 * A lab order is a booking too — it has a collection slot, a vendor and a
 * cost. Reuses the already-mapped LabOrder rather than re-reading the DTO, so
 * the lab screen and the bookings list can never disagree about a status.
 */
export function labOrderToBooking(
  order: LabOrder,
  now: Date,
  kind: BookingKind = BookingKind.Lab,
): Booking {
  const testNames = order.tests.map((test) => test.name);

  return {
    id: order.id,
    kind,
    kindLabel: BOOKING_KIND_LABELS[kind],
    reference: order.reference,
    patientName: '',
    title: order.vendorName,
    subtitle: testNames.length ? testNames.join(', ') : 'Lab tests',
    location: order.collectionLabel ?? 'Lab',
    scheduledFor: order.collectionAt ?? order.placedAt,
    // collectionAt carries a real time when the API supplied one.
    hasExactTime: order.collectionAt !== null,
    timeLabel: '',
    amount: order.total,
    walletPaid: order.fromWallet,
    selfPaid: order.youPay,
    outstanding: null,
    status: order.status,
    isUpcoming: isUpcoming(order.collectionAt ?? order.placedAt, order.status, now),
    hasPrescription: false,
    // NOT an invoice — this is `reportCount`. Lab and diagnostics have no invoice
    // route, so the path stays null and the row must not offer a download.
    hasInvoice: order.reportCount > 0,
    invoicePath: null,
    cancelPrescriptionPath: null,
    consultMode: null,
    statusCode: '',
    isCancellable: false,
  };
}

/**
 * A prescription awaiting digitisation is a booking-in-progress: web-member
 * lists these under the Lab and Diagnostic tabs as "In Queue", which is the
 * only place a member sees that their upload was received.
 */
export function labPrescriptionToBooking(
  prescription: LabPrescription,
  kind: BookingKind,
): Booking {
  const label = kind === BookingKind.Lab ? 'Lab Prescription' : 'Diagnostic Prescription';

  return {
    id: prescription.id,
    kind,
    kindLabel: BOOKING_KIND_LABELS[kind],
    reference: prescription.reference,
    patientName: prescription.patientName,
    title: label,
    subtitle: prescription.hasOrder ? 'Ordered' : 'In Queue',
    location: prescription.sourceLabel,
    scheduledFor: prescription.uploadedAt,
    hasExactTime: false,
    timeLabel: '',
    amount: money(0),
    walletPaid: null,
    selfPaid: null,
    outstanding: null,
    status: prescription.status,
    // Always current: it is waiting on someone else, not on a past date.
    isUpcoming: !prescription.status.isFinal && !prescription.hasOrder,
    hasPrescription: true,
    hasInvoice: false,
    invoicePath: null,
    // The only row in this file that can be cancelled as a PRESCRIPTION. The API
    // allows it from UPLOADED only (`lab-prescription.service.ts:322`), so a
    // DIGITIZED or already-CANCELLED prescription gets no control rather than a
    // control that 400s — the same gate shape as the invoice download.
    cancelPrescriptionPath:
      prescription.statusCode === 'UPLOADED' && prescription.reference
        ? LAB_API[kind === BookingKind.Lab ? LabKind.Lab : LabKind.Diagnostic].cancelPrescription(
            prescription.reference,
          )
        : null,
    consultMode: null,
    statusCode: prescription.statusCode,
    isCancellable: false,
  };
}

/** A cart is the step between a digitised prescription and an order. */
export function cartToBooking(cart: Cart, kind: BookingKind): Booking {
  const names = cart.items.map((item) => item.name);

  return {
    id: cart.id,
    kind,
    kindLabel: BOOKING_KIND_LABELS[kind],
    reference: cart.id,
    patientName: cart.patientName,
    title: 'Ready to book',
    subtitle: names.length ? names.join(', ') : 'Tests ready',
    location: cart.pincode ? `Pincode ${cart.pincode}` : '',
    scheduledFor: cart.createdAt,
    hasExactTime: false,
    timeLabel: '',
    amount: money(0),
    walletPaid: null,
    selfPaid: null,
    outstanding: null,
    status: { label: 'Choose a lab', tone: 'progress', isFinal: false },
    isUpcoming: true,
    hasPrescription: false,
    hasInvoice: false,
    invoicePath: null,
    cancelPrescriptionPath: null,
    consultMode: null,
    statusCode: '',
    isCancellable: false,
  };
}

export function serviceBookingToBooking(
  dto: ServiceBookingDto,
  kind: BookingKind,
  now: Date,
): Booking {
  const status = toStatus(dto.status);
  const code = dto.status?.trim().toUpperCase() ?? '';
  const { at, exact } = withTime(toDate(dto.appointmentDate), dto.appointmentTime);
  // Vaccination names the same two fields vendorName/vendorAddress.
  const facilityName = dto.clinicName?.trim() || dto.vendorName?.trim();
  const address = dto.clinicAddress ?? dto.vendorAddress;
  const city = address?.city?.trim();

  return {
    id: dto._id ?? dto.bookingId ?? '',
    kind,
    kindLabel: BOOKING_KIND_LABELS[kind],
    reference: dto.bookingId ?? '',
    patientName: dto.patientName?.trim() || 'Member',
    title: dto.serviceName?.trim() || BOOKING_KIND_LABELS[kind],
    subtitle: facilityName || BOOKING_KIND_LABELS[kind],
    location: [facilityName, city].filter(Boolean).join(', ') || 'Provider to be confirmed',
    scheduledFor: at,
    hasExactTime: exact,
    timeLabel: dto.appointmentTime?.trim() || '',
    amount: money(dto.billAmount),
    walletPaid: money(dto.walletDebitAmount),
    selfPaid: money(dto.totalMemberPayment),
    // PENDING alone is not "owed": a wallet-only vision booking settles nothing
    // at the gateway and still reports paymentStatus PENDING with
    // totalMemberPayment 0. Both conditions, or the row cries wolf.
    outstanding:
      dto.paymentStatus?.trim().toUpperCase() === 'PENDING' && (dto.totalMemberPayment ?? 0) > 0
        ? money(dto.totalMemberPayment)
        : null,
    status,
    isUpcoming: isUpcoming(at, status, now),
    hasPrescription: false,
    hasInvoice: dto.invoiceGenerated === true,
    // `invoiceGenerated` alone is not enough to offer a download. The API also
    // requires COMPLETED (dental-bookings.service.ts:1256, and vision the same),
    // and the data has a CONFIRMED booking with invoiceGenerated true —
    // VIS-BOOK-1769701879987-3994. Gating on the flag alone would put a button
    // on that row that can only ever fail.
    invoicePath:
      dto.invoiceGenerated === true && code === 'COMPLETED' && dto.bookingId
        ? kind === BookingKind.Vaccination
          ? BOOKINGS_API.vaccinationInvoice(dto.bookingId)
          : CLINIC_BOOKING_API[kind === BookingKind.Dental ? 'DENTAL' : 'VISION'].invoice(dto.bookingId)
        : null,
    cancelPrescriptionPath: null,
    consultMode: null,
    statusCode: code,
    isCancellable: CANCELLABLE.includes(code) && isUpcoming(at, status, now),
  };
}

/**
 * An AHC order as a bookings row.
 *
 * The Health checkup tab and `BookingKind.Ahc` have existed since the bookings
 * screen was built; nothing ever produced one, so the tab was permanently empty
 * while the member had a real order. Session 54.
 *
 * No appointment date exists on an AHC order — the vendor schedules the legs
 * afterwards — so `scheduledFor` is when it was placed and `isUpcoming` is false.
 * That keeps it out of "Upcoming", which would otherwise promise a time nobody
 * has set.
 */
export function ahcOrderToBooking(dto: AhcOrderDto, now: Date): Booking {
  const code = dto.status?.trim().toUpperCase() ?? '';
  const placed = toDate(dto.placedAt ?? dto.createdAt);
  const owed =
    dto.paymentStatus?.trim().toUpperCase() === 'PENDING' && (dto.finalPayable ?? dto.copayAmount ?? 0) > 0
      ? money(dto.finalPayable ?? dto.copayAmount)
      : null;

  return {
    id: dto._id ?? dto.orderId ?? '',
    kind: BookingKind.Ahc,
    kindLabel: BOOKING_KIND_LABELS[BookingKind.Ahc],
    reference: dto.orderId ?? '',
    patientName: dto.patientName?.trim() || 'Member',
    title: dto.packageName?.trim() || 'Annual health check',
    subtitle: 'Health checkup',
    location: 'Scheduled with the vendor',
    scheduledFor: placed,
    hasExactTime: false,
    timeLabel: '',
    amount: money(dto.finalAmount),
    walletPaid: money(dto.walletDeduction),
    selfPaid: money(dto.copayAmount),
    outstanding: owed,
    status: toStatus(dto.status),
    isUpcoming: false,
    hasPrescription: false,
    hasInvoice: false,
    invoicePath: null,
    cancelPrescriptionPath: null,
    consultMode: null,
    statusCode: code,
    isCancellable: false,
  };
}

/**
 * A pharmacy order as a bookings row. No appointment date exists — the
 * partner fulfils on its own schedule — so `scheduledFor` is when it was
 * placed and `isUpcoming` is false, same reasoning as AHC above.
 */
export function pharmacyOrderToBooking(dto: PharmacyOrderDto, now: Date): Booking {
  const order = toPharmacyOrder(dto);
  const placed = toDate(dto.createdAt);
  // A cancelled order's paymentStatus stays PENDING — nothing was ever
  // collected to mark otherwise — so cancellation must be checked
  // separately or a dead order reads as still owing money.
  const owed =
    order.status !== 'CANCELLED' && order.paymentStatus === 'PENDING' && order.totalMemberPayment.amount > 0
      ? order.totalMemberPayment
      : null;

  return {
    id: dto._id ?? order.id,
    kind: BookingKind.Pharmacy,
    kindLabel: BOOKING_KIND_LABELS[BookingKind.Pharmacy],
    reference: order.id,
    patientName: order.patientName,
    title: order.retainedItems.length
      ? order.retainedItems.map((item) => item.name).join(', ')
      : 'Pharmacy order',
    subtitle: 'Pharmacy',
    location: 'Delivered by the pharmacy partner',
    scheduledFor: placed,
    hasExactTime: false,
    timeLabel: '',
    amount: order.billAmount,
    walletPaid: order.walletDebitAmount,
    selfPaid: order.totalMemberPayment,
    outstanding: owed,
    status: toStatus(order.status),
    isUpcoming: false,
    hasPrescription: false,
    hasInvoice: order.invoiceGenerated,
    invoicePath: order.invoiceGenerated ? PHARMACY_API.invoice(order.id) : null,
    cancelPrescriptionPath: null,
    consultMode: null,
    statusCode: order.status,
    // The API allows cancelling up through CONFIRMED (paid, not yet
    // delivered) — it refunds the wallet debit when one was made. Only
    // DELIVERED and an already-CANCELLED order refuse it.
    isCancellable: order.status === 'ADJUDICATED' || order.status === 'CONFIRMED',
  };
}
