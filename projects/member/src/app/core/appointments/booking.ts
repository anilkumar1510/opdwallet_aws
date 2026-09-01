import { Money, money } from '../domain/money';

/**
 * Doctor consultations — in-clinic and online.
 *
 * Flow: specialties -> doctors -> (patient -> slot) -> confirm.
 * Online consultations skip clinic and slot, matching web-member.
 *
 * GET doctors/:id/slots returns slots already expanded per date, so there is
 * no template to resolve and nothing to generate client-side.
 */
export const CONSULT_MODE = {
  InClinic: 'IN_CLINIC',
  Online: 'ONLINE',
} as const;

export type ConsultMode = (typeof CONSULT_MODE)[keyof typeof CONSULT_MODE];

/** The benefit category each consultation mode is funded from. */
export const CONSULT_CATEGORY: Readonly<Record<ConsultMode, string>> = {
  [CONSULT_MODE.InClinic]: 'CAT001',
  [CONSULT_MODE.Online]: 'CAT005',
};

export const APPOINTMENTS_API = {
  /**
   * Scoped to the benefit category, as web-member does. The global
   * `/specialties` route lists all nine regardless of cover, which would offer
   * the member specialties their policy cannot book.
   */
  specialties: (categoryId: string) => `member/benefits/${categoryId}/specialties`,
  doctors: 'doctors',
  /** Pass `clinicId`: it decides whether slot ids come back in-clinic or ONLINE. */
  doctorSlots: (doctorId: string) => `doctors/${doctorId}/slots`,
  validate: 'appointments/validate-booking',
  create: 'appointments',
  byId: (appointmentId: string) => `appointments/${appointmentId}`,
  cancel: (appointmentId: string) => `appointments/${appointmentId}/user-cancel`,
} as const;

export interface SpecialtyDto {
  specialtyId?: string;
  code?: string;
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

/**
 * Where to search from. A pincode is preferred when the member typed one — the
 * API geocodes it itself, so one round trip does the job.
 */
export interface DoctorSearchLocation {
  readonly pincode?: string;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
}

/**
 * Radius sent with a located doctor search. The API's own default is 10km
 * (`doctors.service.ts:78`), which drops clinics across a normal city commute
 * without saying so.
 */
export const DOCTOR_SEARCH_RADIUS_KM = 50;

export interface DoctorClinicDto {
  clinicId?: string;
  name?: string;
  address?: string;
  city?: string;
  pincode?: string;
  consultationFee?: number;
  /**
   * Kilometres from the location sent with the query, computed by the API
   * (`doctors.service.ts:189-195`). Absent when no location was sent — and ALSO
   * absent for a clinic that came back through the service's fallback, see
   * `DoctorClinic.distanceKm`.
   */
  distance?: number | null;
}

export interface DoctorDto {
  _id?: string;
  doctorId?: string;
  name?: string;
  qualifications?: string;
  specialtyId?: string;
  specialty?: string;
  experienceYears?: number;
  rating?: number;
  languages?: string[];
  isActive?: boolean;
  clinics?: DoctorClinicDto[];
  /**
   * The doctor's own fee, which is what an online consultation costs. Distinct
   * from each clinic's `consultationFee`, which applies to a visit there — the
   * two differ per doctor (₹1,000 vs ₹500 for DOC10002).
   */
  consultationFee?: number;
  availableOnline?: boolean;
  availableOffline?: boolean;
  specializations?: string[];
  reviewCount?: number;
  /** ONLINE mode only — findAll()'s "sorted by fastest available doctor" hint. */
  nextAvailableLabel?: string | null;
  /** ONLINE mode only — whether this doctor has a slot within the next 5 minutes. */
  canConsultNow?: boolean;
}

export interface DoctorsResponseDto {
  data?: DoctorDto[];
  total?: number;
}

/**
 * GET doctors/:doctorId/slots returns days already expanded from the recurring
 * templates — one entry per date, each holding its own times. There is nothing
 * to generate client-side.
 *
 * `slotId` is synthesised by the API as
 * `<doctorId>_<clinicId|ONLINE>_<date>_<time>`, so passing `clinicId` matters:
 * omit it and every id comes back as ONLINE and an in-clinic booking is filed
 * against the wrong location.
 */
export interface DoctorSlotDto {
  date?: string;
  dayOfWeek?: string;
  slots?: GeneratedSlotDto[];
}

export interface GeneratedSlotDto {
  slotId?: string;
  /** Display label, e.g. "1:00 PM" — sent back verbatim as `timeSlot`. */
  time?: string;
  available?: boolean;
}

export interface Specialty {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
}

export interface DoctorClinic {
  readonly id: string;
  readonly name: string;
  readonly addressLine: string;
  readonly fee: Money;
  /**
   * Distance in kilometres, or null when it is not known.
   *
   * Null does NOT mean "no location was sent". The API filters clinics to a
   * radius and sorts them nearest-first, but if that filter empties a doctor's
   * list it restores the doctor's raw `clinics` array with `distance: null`
   * (`doctors.service.ts:227-241`). So a located search returns a MIX: clinics
   * with a real distance, in order, followed by fallback entries with none,
   * possibly far away. The screen must not caption the list "nearest first"
   * unconditionally, and must not treat null as zero.
   */
  readonly distanceKm: number | null;
}

export interface Doctor {
  readonly id: string;
  readonly name: string;
  readonly qualifications: string | null;
  readonly specialty: string;
  readonly experienceYears: number;
  readonly rating: number;
  readonly languages: readonly string[];
  readonly clinics: readonly DoctorClinic[];
  readonly onlineFee: Money;
  readonly isActive: boolean;
  /** ONLINE mode only — e.g. "Today, 2:00 PM". Null when in-clinic, or fully booked out. */
  readonly nextAvailableLabel: string | null;
  /** ONLINE mode only — a slot within the next 5 minutes exists. Always false for in-clinic. */
  readonly canConsultNow: boolean;
}

export interface ConsultSlot {
  readonly id: string;
  /** "1:00 PM" — the label shown, and the `timeSlot` the booking is filed with. */
  readonly label: string;
  readonly isAvailable: boolean;
}

/** One bookable day for a doctor, with its own times. */
export interface ConsultDay {
  readonly date: string;
  readonly slots: readonly ConsultSlot[];
}

export function toSpecialty(dto: SpecialtyDto, index: number): Specialty {
  return {
    id: dto.specialtyId ?? dto.code ?? String(index),
    name: dto.name?.trim() || 'Specialty',
    description: dto.description?.trim() || null,
  };
}

export function toDoctor(dto: DoctorDto): Doctor {
  const clinics = (dto.clinics ?? []).map((clinic, index) => ({
    id: clinic.clinicId ?? String(index),
    name: clinic.name?.trim() || 'Clinic',
    addressLine: clinic.address?.trim() || [clinic.city, clinic.pincode].filter(Boolean).join(' '),
    fee: money(clinic.consultationFee),
    distanceKm: typeof clinic.distance === 'number' && Number.isFinite(clinic.distance)
      ? clinic.distance
      : null,
  }));

  return {
    id: dto.doctorId ?? dto._id ?? '',
    // The API stores a bare name; the honorific belongs in presentation.
    name: dto.name?.trim() ? `Dr. ${dto.name.trim()}` : 'Doctor',
    qualifications: dto.qualifications?.trim() || null,
    specialty: dto.specialty?.trim() || '',
    experienceYears: dto.experienceYears ?? 0,
    rating: dto.rating ?? 0,
    languages: (dto.languages ?? []).map((l) => l.trim()).filter(Boolean),
    clinics,
    // web-member shows the doctor's own consultationFee for online consults.
    // The clinic's fee is a different number and belongs to in-clinic visits.
    onlineFee: money(dto.consultationFee ?? clinics[0]?.fee.amount),
    isActive: dto.isActive !== false,
    nextAvailableLabel: dto.nextAvailableLabel?.trim() || null,
    canConsultNow: dto.canConsultNow === true,
  };
}

export function toConsultSlot(dto: GeneratedSlotDto, index: number): ConsultSlot {
  return {
    id: dto.slotId ?? String(index),
    label: dto.time?.trim() ?? '',
    // Absent means bookable; only an explicit false blocks it.
    isAvailable: dto.available !== false,
  };
}

export function toConsultDay(dto: DoctorSlotDto): ConsultDay {
  return {
    date: dto.date ?? '',
    slots: (dto.slots ?? []).map(toConsultSlot).filter((slot) => slot.label.length > 0),
  };
}

/** Body for POST appointments/validate-booking. */
export interface ValidateBookingInput {
  readonly patientId: string;
  readonly doctorId?: string;
  readonly specialty?: string;
  readonly consultationFee: number;
  readonly appointmentType: ConsultMode;
}

/**
 * What `POST appointments` answers with.
 *
 * The route does **not** use the `{ success, data }` envelope its siblings do,
 * and it does not return the appointment at the top level either: the document
 * is nested under `appointment`, with the payment fields beside it
 * (`api/.../appointments.service.ts`, `create()` — both of its return sites).
 *
 * `paymentId` is set whenever the API created a payment the member still owes,
 * which it does on the copay, shortfall and out-of-pocket branches.
 *
 * **Currently carried and unused, deliberately.** The confirm page ends the
 * journey on the bookings list and says nothing about the outstanding amount, so
 * the member is left with an unsettled obligation. That is a known, open defect
 * (`audit/20-copay-continuation.md`) and not an oversight here: routing to a
 * payment screen adds a destination, which is a flow change, and a flow change is
 * a decision rather than a defect fix. Session 34 made it as a fix; session 40
 * reverted it. This field stays so the remedy is one line once ruled.
 */
export interface AppointmentBookingResult {
  readonly appointmentId: string;
  readonly paymentId: string | null;
}

export function toAppointmentBookingResult(
  response: Record<string, unknown> | undefined,
): AppointmentBookingResult {
  const appointment = (response?.['appointment'] as Record<string, unknown> | undefined) ?? {};
  const paymentId = response?.['paymentId'];
  return {
    appointmentId: String(appointment['appointmentId'] ?? appointment['_id'] ?? ''),
    // `GET payments/:paymentId` resolves via `findOne({ paymentId })`, so only
    // the business reference is a destination.
    paymentId: typeof paymentId === 'string' && paymentId.startsWith('PAY-') ? paymentId : null,
  };
}

/** Body for POST appointments. */
export interface CreateAppointmentInput {
  /**
   * In-clinic sends `false`, and what that buys is a *pending* request — not an
   * unspent wallet. Measured against the running API, not assumed:
   *
   * - Left at its default, a fee the wallet fully covers is debited **and the
   *   appointment auto-confirms** (`appointments.service.ts:763,794`). The
   *   confirmation is the damage: the clinic has not agreed to anything, and
   *   the bookings list would say Confirmed while the journey says pending.
   * - With `false`, the request stays PENDING_CONFIRMATION either way, which is
   *   step 8 — verified live, APT000128 came back PENDING_CONFIRMATION.
   * - It does **not** stop the debit where a copay applies. That branch debits
   *   before it collects and never reads this flag (`appointments.service.ts:690`)
   *   — the wallet moved 49,150 → 48,900 on a ₹500 consultation with a 50%
   *   copay. That defect is the subject of the wallet-block change; here the
   *   journey simply tells the truth about it and releases on every exit.
   */
  readonly useWallet?: boolean;
  readonly patientId: string;
  readonly patientName: string;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly specialty: string;
  readonly slotId: string;
  readonly clinicId?: string;
  readonly clinicName?: string;
  readonly clinicAddress?: string;
  readonly appointmentType: ConsultMode;
  readonly appointmentDate: string;
  readonly timeSlot: string;
  readonly consultationFee: number;
}
