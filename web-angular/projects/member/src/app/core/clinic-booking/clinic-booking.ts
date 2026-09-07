import { Money, money } from '../domain/money';

/**
 * Vision (CAT007) and Dental (CAT006) clinic booking — the same contract on
 * two prefixes, exactly like lab and diagnostics.
 *
 * Flow: service -> clinics -> patient -> slot -> confirm -> booking.
 *
 * These routes return bare `{ clinics }` / `{ slots }` objects — a fifth
 * envelope style in this API.
 */
export const CLINIC_AREA = {
  Vision: 'VISION',
  Dental: 'DENTAL',
} as const;

export type ClinicArea = (typeof CLINIC_AREA)[keyof typeof CLINIC_AREA];

export const CLINIC_BOOKING_API = {
  [CLINIC_AREA.Vision]: {
    categoryId: 'CAT007',
    basePath: 'vision',
    clinics: 'vision-bookings/clinics',
    validate: 'vision-bookings/validate',
    /**
     * Completes a created booking: debits the wallet and, when the member owes
     * a copay or excess, returns `paymentRequired` with a paymentId for the
     * gateway. Vision only — dental has no equivalent route.
     */
    processPayment: (bookingId: string) => `vision-bookings/${bookingId}/process-payment`,
    slots: 'vision-bookings/slots',
    create: 'vision-bookings',
    byId: (bookingId: string) => `vision-bookings/${bookingId}`,
    invoice: (bookingId: string) => `vision-bookings/${bookingId}/invoice`,
  },
  [CLINIC_AREA.Dental]: {
    categoryId: 'CAT006',
    basePath: 'dental',
    clinics: 'dental-bookings/clinics',
    validate: 'dental-bookings/validate',
    slots: 'dental-bookings/slots',
    create: 'dental-bookings',
    byId: (bookingId: string) => `dental-bookings/${bookingId}`,
    invoice: (bookingId: string) => `dental-bookings/${bookingId}/invoice`,
  },
} as const;

/**
 * Dental-only routes — flow 4 steps 15 and 18 onwards.
 *
 * Kept out of CLINIC_BOOKING_API, which is symmetric across both areas, so a
 * caller cannot reach for a vision equivalent that does not exist. Vision has
 * no visit to close and no procedure route: its journey ends at a coupon.
 */
export const DENTAL_ONLY_API = {
  /** Multipart: `file` plus `procedureRecommended`. */
  closeVisit: (bookingId: string) => `dental-bookings/${bookingId}/close-visit`,
  /**
   * Steps 7-8 done by the member. Development only — the API refuses it
   * anywhere else. Stands in for operations the way the dummy gateway stands
   * in for Razorpay, so the journey can be walked end to end.
   */
  demoConfirm: (bookingId: string) => `dental-bookings/${bookingId}/demo-confirm`,
  /**
   * Step 17 reported by the member — development only. The clinic tells us
   * about a missed visit; this stands in for the clinic so the ending can be
   * reached at all.
   */
  demoNoShow: (bookingId: string) => `dental-bookings/${bookingId}/demo-no-show`,
  /**
   * The prescription uploaded at step 15, streamed back. Owner-scoped on the
   * API — the path comes off the booking, never off the URL.
   */
  prescriptionFile: (bookingId: string) => `dental-bookings/${bookingId}/prescription`,
  /** One booking, to read its status before offering to close the visit. */
  bookingById: (bookingId: string) => `dental-bookings/${bookingId}`,
  procedures: 'member/dental/procedures',
  procedureById: (procedureId: string) => `member/dental/procedures/${procedureId}`,
  scheduleProcedure: (procedureId: string) =>
    `member/dental/procedures/${procedureId}/schedule`,
} as const;

export interface ClinicAddressDto {
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ClinicDto {
  clinicId?: string;
  clinicName?: string;
  address?: ClinicAddressDto;
  contactNumber?: string;
  servicePrice?: number;
  availableSlots?: number;
}

export interface ClinicsResponseDto {
  clinics?: ClinicDto[];
}

export interface ClinicSlotDto {
  _id?: string;
  slotId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  currentBookings?: number;
  maxAppointments?: number;
}

export interface SlotsResponseDto {
  slots?: ClinicSlotDto[];
}

export interface Clinic {
  readonly id: string;
  readonly name: string;
  /** Pre-composed; no template joins address parts itself. */
  readonly addressLine: string;
  readonly pincode: string;
  readonly contactNumber: string | null;
  readonly servicePrice: Money;
  readonly availableSlots: number;
}

export interface ClinicSlot {
  /** Composite id (slotDoc-HH:mm) — unique per time, unlike slotId. */
  readonly id: string;
  /** The underlying slot document id, which the booking POST expects. */
  readonly slotId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly isAvailable: boolean;
}

export function toClinic(dto: ClinicDto): Clinic {
  const address = dto.address;
  return {
    id: dto.clinicId ?? '',
    name: dto.clinicName?.trim() || 'Clinic',
    addressLine:
      [address?.line1?.trim(), address?.city?.trim(), address?.state?.trim()]
        .filter(Boolean)
        .join(', ') || 'Address not listed',
    pincode: address?.pincode?.trim() ?? '',
    contactNumber: dto.contactNumber?.trim() || null,
    servicePrice: money(dto.servicePrice),
    availableSlots: dto.availableSlots ?? 0,
  };
}

export function toClinicSlot(dto: ClinicSlotDto, index: number): ClinicSlot {
  return {
    id: dto._id ?? `${dto.slotId ?? index}-${dto.startTime ?? index}`,
    slotId: dto.slotId ?? '',
    date: dto.date ?? '',
    startTime: dto.startTime ?? '',
    endTime: dto.endTime ?? '',
    // Absent capacity means unconstrained, not unavailable.
    isAvailable:
      dto.isAvailable !== false && (dto.currentBookings ?? 0) < (dto.maxAppointments ?? 1),
  };
}

/** Body for POST vision-bookings / dental-bookings. */
/** Body for POST {vision,dental}-bookings/validate. */
export interface ValidateClinicBookingInput {
  readonly patientId: string;
  readonly clinicId: string;
  readonly serviceCode: string;
  readonly slotId: string;
  readonly price: number;
}

export interface CreateClinicBookingInput {
  readonly patientId: string;
  readonly clinicId: string;
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly slotId: string;
  readonly price: number;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
}

/**
 * What `POST {vision,dental}-bookings` answers with.
 *
 * The two areas settle money at different moments. **Dental** debits the wallet
 * on this call and, where the member owes a copay or is out of pocket, creates
 * a PENDING payment and returns its reference. **Vision** defers both to
 * `process-payment`, which is gated on a bill the portal cannot generate, so
 * its create returns no payment at all.
 *
 * `paymentId` is **carried but not currently acted on.** The confirm page ends
 * the journey on the bookings list without mentioning the outstanding amount, so
 * a member holds a committed booking and an unsettled copay. That is an open
 * defect (`audit/20-copay-continuation.md`), not an oversight in this file:
 * taking them to a payment screen adds a destination, which is a flow change and
 * therefore a decision. Session 34 shipped it as a fix; session 40 reverted it.
 * The field stays available so the remedy is one line once ruled.
 */
export interface ClinicBookingResult {
  readonly bookingId: string;
  /** Set only when the API created a payment the member still owes. */
  readonly paymentId: string | null;
}

export function toBookingResult(data: Record<string, unknown> | undefined): ClinicBookingResult {
  const paymentId = data?.['paymentId'];
  return {
    bookingId: String(data?.['bookingId'] ?? data?.['_id'] ?? ''),
    // Identifier duality, again: dental stores the business `PAY-…` reference
    // here and vision a Mongo ObjectId. `GET payments/:paymentId` resolves via
    // `findOne({ paymentId })`, so only the business reference is navigable —
    // anything else is not a destination and is treated as absent.
    paymentId: typeof paymentId === 'string' && paymentId.startsWith('PAY-') ? paymentId : null,
  };
}
