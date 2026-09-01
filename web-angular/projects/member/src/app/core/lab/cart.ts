import { toDate } from '../domain/codes';
import { Money, money } from '../domain/money';

/**
 * Lab cart and vendor comparison — screens 2 and 3 of the journey.
 *
 * The lab builds the cart after digitising a prescription; the member then
 * picks a vendor and a slot.
 *
 * Route params take the **business** id (`CART-…`), not the Mongo `_id`.
 * Passing `_id` returns 404.
 *
 * Both routes wrap their payload as `{ success, data }`.
 */
export interface CartItemDto {
  serviceId?: string;
  serviceName?: string;
  serviceCode?: string;
  category?: string;
}

export interface CartDto {
  _id?: string;
  cartId?: string;
  prescriptionId?: string;
  patientName?: string;
  pincode?: string;
  serviceType?: string;
  items?: CartItemDto[];
  selectedVendorIds?: string[];
  status?: string;
  createdAt?: string;
}

export interface VendorPricingDto {
  serviceId?: string;
  serviceName?: string;
  serviceCode?: string;
  actualPrice?: number;
  discountedPrice?: number;
}

export interface CartVendorDto {
  _id?: string;
  vendorId?: string;
  name?: string;
  code?: string;
  homeCollection?: boolean;
  centerVisit?: boolean;
  homeCollectionCharges?: number;
  pricing?: VendorPricingDto[];
  totalActualPrice?: number;
  totalDiscountedPrice?: number;
  totalWithHomeCollection?: number;
}

export interface CartItem {
  readonly id: string;
  readonly name: string;
  readonly code: string;
}

export interface Cart {
  /** Business id — use this in URLs. */
  readonly id: string;
  readonly prescriptionId: string;
  readonly patientName: string;
  readonly pincode: string;
  readonly items: readonly CartItem[];
  readonly status: string;
  readonly createdAt: Date | null;
}

export interface VendorPrice {
  readonly serviceId: string;
  readonly name: string;
  readonly listPrice: Money;
  readonly payablePrice: Money;
}

export interface CartVendor {
  /** Mongo _id. */
  readonly id: string;
  /** Business id (VENDOR-002) — what the route and pricing/slot calls use. */
  readonly vendorId: string;
  readonly code: string;
  readonly name: string;
  readonly offersHomeCollection: boolean;
  readonly offersCenterVisit: boolean;
  readonly homeCollectionCharge: Money;
  readonly prices: readonly VendorPrice[];
  readonly listTotal: Money;
  readonly payableTotal: Money;
  readonly totalWithHomeCollection: Money;
  /** Saving against list price, for the "you save" line. Zero when none. */
  readonly saving: Money;
}

/**
 * A collection slot. GET member/{lab,diagnostics}/vendors/:vendorId/slots
 * requires **both** `pincode` and `date` — omit the pincode and it answers with
 * an empty list rather than an error, which reads as "no slots that day".
 *
 * Capacity is `maxBookings` minus `currentBookings`; there is no `isAvailable`
 * field.
 */
export interface SlotDto {
  slotId?: string;
  date?: string;
  /** "MORNING", "AFTERNOON" … with the hours in startTime/endTime. */
  timeSlot?: string;
  startTime?: string;
  endTime?: string;
  maxBookings?: number;
  currentBookings?: number;
  isActive?: boolean;
}

export interface Slot {
  readonly id: string;
  /** "08:00 – 12:00", or the raw band when hours are missing. */
  readonly label: string;
  /** Raw date string, sent back verbatim when placing the order. */
  readonly date: string;
  /** Raw time slot label, likewise sent back verbatim. */
  readonly timeSlot: string;
  readonly at: Date | null;
  readonly isAvailable: boolean;
}

export function toSlot(dto: SlotDto, index: number): Slot {
  const booked = dto.currentBookings ?? 0;
  const capacity = dto.maxBookings;

  return {
    id: dto.slotId ?? String(index),
    date: dto.date ?? '',
    timeSlot: dto.timeSlot ?? '',
    label: [dto.startTime, dto.endTime].filter(Boolean).join(' – ') || (dto.timeSlot ?? ''),
    at: toDate(dto.date),
    // Absent capacity means unconstrained, not unavailable.
    isAvailable: dto.isActive !== false && (capacity === undefined || booked < capacity),
  };
}

/** Body for POST member/lab/orders, matching web-member's payload exactly. */
export interface PlaceOrderInput {
  readonly cartId: string;
  /** The vendor's Mongo _id — not the VENDOR-… business id. */
  readonly vendorId: string;
  readonly collectionType: 'HOME_COLLECTION' | 'CENTER_VISIT';
  /**
   * `CollectionAddressDto`, a nested class — NOT a formatted string. Sending a
   * string returns 400 "nested property collectionAddress must be either object
   * or array". Every listed field is `@IsNotEmpty()`; only `addressLine2` is
   * optional. Same shape and the same mistake as `POST member/ahc/orders`.
   */
  readonly collectionAddress?: {
    readonly fullName: string;
    readonly phone: string;
    readonly addressLine1: string;
    readonly pincode: string;
    readonly city: string;
    readonly state: string;
  };
  readonly collectionDate?: string;
  readonly collectionTime?: string;
  readonly slotId?: string;
}

export function toCart(dto: CartDto): Cart {
  return {
    id: dto.cartId ?? '',
    prescriptionId: dto.prescriptionId ?? '',
    patientName: dto.patientName?.trim() || 'Member',
    pincode: dto.pincode?.trim() || '',
    items: (dto.items ?? [])
      .map((item, index) => ({
        id: item.serviceId ?? item.serviceCode ?? String(index),
        name: item.serviceName?.trim() ?? '',
        code: item.serviceCode ?? '',
      }))
      .filter((item) => item.name.length > 0),
    status: dto.status?.trim().toUpperCase() ?? '',
    createdAt: toDate(dto.createdAt),
  };
}

export function toCartVendor(dto: CartVendorDto): CartVendor {
  const listTotal = money(dto.totalActualPrice);
  const payableTotal = money(dto.totalDiscountedPrice);

  return {
    id: dto._id ?? dto.vendorId ?? '',
    vendorId: dto.vendorId ?? dto._id ?? '',
    code: dto.code ?? '',
    name: dto.name?.trim() || 'Lab',
    offersHomeCollection: dto.homeCollection === true,
    offersCenterVisit: dto.centerVisit === true,
    homeCollectionCharge: money(dto.homeCollectionCharges),
    prices: (dto.pricing ?? []).map((price, index) => ({
      serviceId: price.serviceId ?? String(index),
      name: price.serviceName?.trim() ?? '',
      listPrice: money(price.actualPrice),
      // The discounted price is what the member is actually charged.
      payablePrice: money(price.discountedPrice ?? price.actualPrice),
    })),
    listTotal,
    payableTotal,
    totalWithHomeCollection: money(dto.totalWithHomeCollection ?? dto.totalDiscountedPrice),
    saving: money(Math.max(0, listTotal.amount - payableTotal.amount)),
  };
}
