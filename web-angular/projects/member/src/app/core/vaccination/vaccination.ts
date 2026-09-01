import { Money, money } from '../domain/money';

/**
 * Vaccination (CAT009) — vendor-based booking, same shape as Vision/Dental's
 * clinic-booking contract for slots/validate/create/invoice, but under its own
 * `member/vaccination` prefix and with an extra service-selection step first
 * (which vaccine, before which vendor).
 */
export const VACCINATION_API = {
  services: 'member/vaccination/services',
  vendors: 'member/vaccination/vendors',
  slots: (vendorId: string) => `member/vaccination/vendors/${vendorId}/slots`,
  validate: 'member/vaccination/bookings/validate',
  create: 'member/vaccination/bookings',
  byId: (bookingId: string) => `member/vaccination/bookings/${bookingId}`,
  cancel: (bookingId: string) => `member/vaccination/bookings/${bookingId}/cancel`,
  invoice: (bookingId: string) => `member/vaccination/bookings/${bookingId}/invoice`,
} as const;

export interface VaccineServiceDto {
  _id?: string;
  serviceId?: string;
  code?: string;
  name?: string;
  description?: string;
  vaccineType?: string;
  manufacturer?: string;
  dosesRequired?: number;
  ageGroup?: string;
  coveragePercentage?: number;
  copayAmount?: number;
}

export interface VaccineServicesResponseDto {
  services?: VaccineServiceDto[];
}

export interface VaccineService {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly vaccineType: string | null;
  readonly manufacturer: string | null;
  readonly dosesRequired: number | null;
  /** e.g. "0-5", "18+" — informational only, no client-side filtering logic exists to enforce it. */
  readonly ageGroup: string | null;
}

export function toVaccineService(dto: VaccineServiceDto): VaccineService {
  return {
    id: dto.serviceId ?? dto._id ?? '',
    code: dto.code ?? '',
    name: dto.name?.trim() || 'Vaccine',
    description: dto.description?.trim() ?? '',
    vaccineType: dto.vaccineType?.trim() || null,
    manufacturer: dto.manufacturer?.trim() || null,
    dosesRequired: dto.dosesRequired ?? null,
    ageGroup: dto.ageGroup?.trim() || null,
  };
}

export interface VendorContactInfoDto {
  address?: string;
  phone?: string;
  email?: string;
}

export interface VendorDto {
  _id?: string;
  vendorId?: string;
  name?: string;
  code?: string;
  contactInfo?: VendorContactInfoDto;
  centerVisit?: boolean;
  actualPrice?: number;
  discountedPrice?: number;
  activeSchedulesCount?: number;
  serviceablePincodes?: string[];
}

export interface VendorsResponseDto {
  vendors?: VendorDto[];
}

export interface Vendor {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly phone: string | null;
  readonly price: Money;
  readonly hasSlots: boolean;
}

export function toVendor(dto: VendorDto): Vendor {
  return {
    id: dto.vendorId ?? dto._id ?? '',
    name: dto.name?.trim() || 'Vendor',
    address: dto.contactInfo?.address?.trim() || 'Address not listed',
    phone: dto.contactInfo?.phone?.trim() || null,
    price: money(dto.discountedPrice ?? dto.actualPrice),
    hasSlots: (dto.activeSchedulesCount ?? 0) > 0,
  };
}

export interface ValidateVaccinationBookingInput {
  readonly patientId: string;
  readonly vendorId: string;
  readonly serviceId: string;
  readonly slotId: string;
  readonly price: number;
  readonly appointmentDate: string;
}

export interface CreateVaccinationBookingInput extends ValidateVaccinationBookingInput {
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly appointmentTime: string;
}
