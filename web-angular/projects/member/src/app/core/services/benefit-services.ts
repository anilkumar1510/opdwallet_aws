import { BenefitCategory } from '../domain/codes';

/**
 * Bookable services for a benefit category — what Vision and Dental list as
 * "Book Now" cards.
 *
 * GET /member/benefits/:categoryId/services returns
 * `{ categoryId, services, total }` — a fourth envelope style, alongside
 * `{ success, data }`, `{ message, <name> }` and bare arrays. Source:
 * api/src/modules/plan-config/member-services.controller.ts
 *
 * It answers **404 "No active policy assignment found for this user"** when
 * the member's cover has lapsed — the service requires effectiveFrom <= now
 * <= effectiveTo. That is an expected state, not a fault, and the screen says
 * so rather than showing a generic error.
 */
export const BENEFIT_SERVICES_API = {
  services: (categoryId: string) => `member/benefits/${categoryId}/services`,
  specialties: (categoryId: string) => `member/benefits/${categoryId}/specialties`,
} as const;

export interface BenefitServiceDto {
  _id?: string;
  code?: string;
  name?: string;
  description?: string;
}

export interface BenefitServicesResponseDto {
  categoryId?: string;
  services?: BenefitServiceDto[];
  total?: number;
}

/**
 * Tolerates both the documented envelope and a bare array, so a shape change
 * degrades to an empty list rather than a TypeError the member sees as
 * "something went wrong at our end".
 */
export function toBenefitServices(
  response: BenefitServicesResponseDto | BenefitServiceDto[] | null | undefined,
): readonly BenefitService[] {
  const rows = Array.isArray(response) ? response : (response?.services ?? []);
  return rows.map(toBenefitService);
}

export interface BenefitService {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
}

export function toBenefitService(dto: BenefitServiceDto, index: number): BenefitService {
  return {
    id: dto._id ?? dto.code ?? String(index),
    code: dto.code ?? '',
    name: dto.name?.trim() || 'Service',
    description: dto.description?.trim() || null,
  };
}

/** Copy per area, matching web-member's vision and dental pages verbatim. */
export const SERVICE_SCREEN_COPY = {
  VISION: {
    title: 'Vision Services',
    subtitle: 'Browse and book vision care services',
    emptyTitle: 'No Vision Services Available',
  },
  DENTAL: {
    title: 'Dental Services',
    subtitle: 'Browse and book dental care services covered by your policy',
    emptyTitle: 'No Dental Services Available',
  },
} as const;

/** Where "Book Now" goes for each category, matching web-member's routes. */
export function bookingPath(category: BenefitCategory, serviceCode: string): string {
  const base =
    category === BenefitCategory.Vision
      ? '/member/vision/clinics'
      : '/member/dental/clinics';
  return `${base}?serviceCode=${encodeURIComponent(serviceCode)}`;
}
