import { AppService } from '../../core/http/api.service';

/**
 * Pharmacy delivery addresses, scoped to `master-management/api/v1/order_address`.
 *
 * Deliberately NOT `core/member/address.ts`: that models a different endpoint
 * (`GET /member/addresses`) with different field names (`addressLine1`, no
 * `street3`, no `country`, no display/code pairing) and is backed by a store that
 * holds no data. The two must not be merged or the field names collide.
 */

/** What the member types into the add-address form. Plaintext, never encrypted. */
export interface PharmacyAddressInput {
  street1: string;
  street2: string;
  street3: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

/** One address as the cards render it, with the street lines already readable. */
export interface PharmacyAddress {
  readonly id: string;
  readonly addressType: string;
  /** Decrypted where possible, raw otherwise — never a blank. */
  readonly lines: readonly string[];
  /**
   * The owning patient's uhid as this row carries it. The primary member's record
   * in GET_FAMILY_LIST has a null uhId, so this is the only place the POST's
   * required `uhId` can come from.
   */
  readonly uhId: string;
  /** The value the booking payload echoes back, exactly as the API represents it. */
  readonly booking: BookingAddress;
}

export interface BookingAddress {
  address_type: string;
  addressType: string;
  street1: string;
  street2: string;
  street3: string;
  city: string;
  cityDisplayName: string;
  state: string;
  stateDisplayName: string;
  country: string;
  countryDisplayName: string;
  pincode: string;
}

/** `address_type` "2" is the only value seen from the pharmacy booking flow. */
export const HOME_ADDRESS_TYPE = '2';

const str = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * The order_address GET answers with flat snake_case rows; the POST nests the same
 * data under `address` and adds `*DisplayName` pairs. Reading either shape through
 * one place is what keeps the cards, the save payload, and the booking payload from
 * drifting apart.
 */
export function toPharmacyAddress(dto: unknown, crypto: AppService, index = 0): PharmacyAddress | null {
  const row = asRecord(dto);
  if (!row) return null;
  const nested = asRecord(row['address']) ?? {};

  const pick = (flatKey: string, nestedKey: string): string =>
    str(nested[nestedKey]) || str(row[flatKey]);

  const street1 = pick('house_flat_no', 'street1');
  const street2 = pick('street', 'street2');
  const street3 = pick('street2', 'street3');
  const city = pick('city', 'city');
  const state = pick('state', 'state');
  const country = str(nested['country']) || str(row['country']);
  const pincode = str(nested['pincode']) || str(row['pin_code']) || str(row['pincode']);
  const addressType = str(nested['address_type']) || str(row['address_type']) || HOME_ADDRESS_TYPE;

  const booking: BookingAddress = {
    address_type: addressType,
    addressType,
    street1,
    street2,
    street3,
    city: str(nested['city']) || city,
    cityDisplayName: str(nested['cityDisplayName']) || titleCase(city),
    state: str(nested['state']) || state,
    stateDisplayName: str(nested['stateDisplayName']) || titleCase(state),
    country: str(nested['country']) || country,
    countryDisplayName: str(nested['countryDisplayName']) || titleCase(country),
    pincode,
  };

  return {
    id: str(row['id']) || str(row['_id']) || str(row['address_id']) || `address-${index}`,
    addressType,
    lines: [street1, street2, street3].filter((line) => line.trim().length > 0),
    uhId: str(row['uhId']),
    booking,
  };
}

/**
 * Builds the `POST order_address` body from what the member typed.
 *
 * Street fields (street1/street2/street3) are sent as plaintext — no
 * encryption step, matching the API's expectation for this endpoint.
 * The flat fields carry the same plaintext the API itself sent in its own sample.
 */
export function toOrderAddressBody(
  input: PharmacyAddressInput,
  patientId: string,
  uhId: string,
): Record<string, unknown> {

  const street1 = input.street1.trim();
  const street2 = input.street2.trim();
  const street3 = input.street3.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  const country = input.country.trim();
  const pincode = input.pincode.trim();

  return {
    patient_id: patientId,
    uhId,
    house_flat_no: street1,
    street: street2,
    street2: street3,
    city,
    state,
    pin_code: pincode,
    country,
    address_type: HOME_ADDRESS_TYPE,
    address: {
      address_type: HOME_ADDRESS_TYPE,
      addressType: HOME_ADDRESS_TYPE,
       street1: street1,
       street2: street2,
       street3: street3,
      city,
      cityDisplayName: titleCase(city),
      state,
      stateDisplayName: titleCase(state),
      country,
      countryDisplayName: titleCase(country),
      pincode,
    },
  };
}

/**
 * Card text. `decryptText` returns '' for anything that is not valid ciphertext
 * (the padding check fails), so an empty result means "this was not encrypted" and
 * the raw value is shown instead — otherwise a plaintext address renders blank.
 * Plaintext values pass through unchanged since they're not ciphertext.
 */
export function addressDisplayLines(address: PharmacyAddress, crypto: AppService): readonly string[] {
  const readable = (value: string): string => {
    if (!value) return '';
    const decrypted = crypto.decryptText(value);
    return decrypted && decrypted.trim().length > 0 ? decrypted : value;
  };
  const cityLine = [address.booking.cityDisplayName, address.booking.stateDisplayName, address.booking.pincode]
    .filter((part) => part.trim().length > 0)
    .join(', ');
  return [...address.lines.map(readable), cityLine].filter((line) => line.trim().length > 0);
}
