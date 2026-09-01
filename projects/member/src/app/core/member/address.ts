/**
 * GET /member/addresses. Note this route wraps its payload in
 * `{ success, data }`, unlike claims or appointments — one of three envelope
 * styles across this API.
 */
export interface AddressDto {
  _id?: string;
  addressId?: string;
  addressType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
}

export interface AddressesResponseDto {
  success?: boolean;
  data?: AddressDto[];
}

export interface Address {
  readonly id: string;
  readonly typeLabel: string;
  /** Pre-composed for display; no template joins address parts itself. */
  readonly lines: readonly string[];
  /** Kept separate because lab prescription upload requires it as a field. */
  readonly pincode: string | null;
  /** Kept as fields, not only folded into `lines` — POST member/ahc/orders
      requires city and state separately. */
  readonly city: string | null;
  readonly state: string | null;
  readonly isDefault: boolean;
  /** Raw fields, kept unjoined so the edit form can round-trip them. */
  readonly input: AddressInput;
}

const TYPE_LABELS: Readonly<Record<string, string>> = {
  HOME: 'Home',
  WORK: 'Work',
  OTHER: 'Other',
};

export function toAddress(dto: AddressDto): Address {
  const type = dto.addressType?.trim().toUpperCase();
  return {
    id: dto._id ?? dto.addressId ?? '',
    typeLabel: (type && TYPE_LABELS[type]) || 'Address',
    lines: [
      dto.addressLine1?.trim(),
      dto.addressLine2?.trim(),
      [dto.city?.trim(), dto.state?.trim()].filter(Boolean).join(', '),
      dto.pincode?.trim(),
    ].filter((line): line is string => Boolean(line)),
    pincode: dto.pincode?.trim() || null,
    city: dto.city?.trim() || null,
    state: dto.state?.trim() || null,
    isDefault: dto.isDefault === true,
    input: toAddressInput(dto),
  };
}

/** What the member types in the address form; matches CreateAddressDto. */
export interface AddressInput {
  addressType: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

/** Fills the edit form from an address the API already returned. */
function toAddressInput(dto: AddressDto): AddressInput {
  return {
    addressType: dto.addressType?.trim().toUpperCase() || 'HOME',
    addressLine1: dto.addressLine1 ?? '',
    addressLine2: dto.addressLine2 ?? '',
    city: dto.city ?? '',
    state: dto.state ?? '',
    pincode: dto.pincode ?? '',
    isDefault: dto.isDefault === true,
  };
}
