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
  /** "Home" / "Work" / "Other" — the code alone is meaningless to a member. */
  readonly typeLabel: string;
  /** Decrypted where possible, raw otherwise — never a blank. */
  readonly lines: readonly string[];
  /** City, state and pincode joined for display, kept apart from the streets. */
  readonly locality: string;
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

/**
 * Codes seen from order_address. Anything unrecognised falls back to "Other"
 * rather than printing a raw code, which a member cannot act on.
 */
const TYPE_LABELS: Readonly<Record<string, string>> = {
  '1': 'Office',
  '2': 'Home',
  '3': 'Other',
};

function toTypeLabel(addressType: string): string {
  return TYPE_LABELS[addressType] ?? (addressType ? addressType : 'Address');
}

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
export function toPharmacyAddress(dto: unknown, index = 0): PharmacyAddress | null {
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
    typeLabel: toTypeLabel(addressType),
    lines: [street1, street2, street3].filter((line) => line.trim().length > 0),
    locality: [booking.cityDisplayName, booking.stateDisplayName, booking.pincode]
      .filter((part) => part.trim().length > 0)
      .join(', '),
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
 * Street text, decrypted where possible. `decryptText` returns '' both when there
 * is no key and when the padding check rejects the input, so an empty result means
 * "this was not decrypted" and the raw value is shown instead — otherwise a
 * plaintext address renders blank. `unreadable` reports that case so the card can
 * say so rather than display ciphertext as if it were an address.
 */
export function addressDisplayLines(
  address: PharmacyAddress,
  crypto: AppService,
): { lines: readonly string[]; unreadable: number } {
  let unreadable = 0;
  const lines = address.lines
    .map((value) => {
      const { value: decrypted, ok } = crypto.decryptTextResult(value);
      if (ok) return decrypted;
      if (isCiphertext(value)) unreadable++;
      return value;
    })
    .filter((line) => line.trim().length > 0);
  return { lines, unreadable };
}

/**
 * Fills the edit form from a stored address. Streets are decrypted first —
 * prefilling a ciphertext into an input the member is about to edit and save
 * would persist the ciphertext back to the API.
 */
export function toAddressInput(address: PharmacyAddress, crypto: AppService): PharmacyAddressInput {
  const { lines } = addressDisplayLines(address, crypto);
  const booking = address.booking;
  return {
    street1: lines[0] ?? '',
    street2: lines[1] ?? '',
    street3: lines[2] ?? '',
    city: booking.city || booking.cityDisplayName,
    state: booking.state || booking.stateDisplayName,
    country: booking.country || booking.countryDisplayName,
    pincode: booking.pincode,
  };
}

/**
 * Rebuilds an address from edited form values, keeping everything the API owns
 * (id, uhId, address type) untouched.
 *
 * Streets are stored as the form gives them. Re-encrypting here is not possible:
 * `AppService.encrypt` needs a key the portal does not hold, so an encrypted
 * rebuild would throw on every save. Display already falls back to the raw value,
 * so these render as typed.
 */
export function applyAddressInput(address: PharmacyAddress, input: PharmacyAddressInput): PharmacyAddress {
  const type = address.addressType;
  const updated = toPharmacyAddress(
    {
      id: address.id,
      uhId: address.uhId,
      address_type: type,
      address: {
        address_type: type,
        addressType: type,
        street1: input.street1.trim(),
        street2: input.street2.trim(),
        street3: input.street3.trim(),
        city: input.city.trim(),
        cityDisplayName: titleCase(input.city),
        state: input.state.trim(),
        stateDisplayName: titleCase(input.state),
        country: input.country.trim(),
        countryDisplayName: titleCase(input.country),
        pincode: input.pincode.trim(),
      },
    },
  );
  // toPharmacyAddress only rejects a non-object, which the literal above never is.
  return updated ?? address;
}

/** Base64 AES-CBC output: a short first block and a '=' pad tail. */
function isCiphertext(value: string): boolean {
  return /^[A-Za-z0-9+/]{16,}={0,2}$/.test(value.trim());
}
