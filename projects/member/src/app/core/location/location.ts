/**
 * Location lookup — patient-flows flow 2, step 3: "Location is auto detected,
 * or the member searches by postal code. Auto detection uses latitude and
 * longitude."
 *
 * **Where the geocoding actually happens.** These three API routes call
 * `nominatim.openstreetmap.org` **server-side** by default: Google Maps is off
 * unless `ENABLE_GOOGLE_MAPS=true` and a real key is set
 * (`location.service.ts:33-38`).
 *
 * That matters for `audit/05-inherited-api-findings.md` §4, which filed RN's
 * direct device-to-Nominatim call as a compliance finding and called it
 * "unnecessary" because these endpoints exist. Using them is a real improvement
 * — member coordinates leave one server rather than every device, and OSM's
 * rate limit applies to one IP rather than the fleet — but it does **not**
 * remove the third-party dependency the finding is about. Anyone reading that
 * §4 as "solved by wiring these" is reading it too generously.
 *
 * **Failure is reported with HTTP 200.** All three answer `{ error: '…' }` in
 * the body rather than a 4xx (`location.controller.ts:39-47, 58-64`). An
 * `HttpClient` call therefore RESOLVES on "Location not found", so every reader
 * here checks the payload rather than relying on the error channel.
 */
export const LOCATION_API = {
  /** Free-text place search. Returns `[]` for fewer than 2 characters. */
  autocomplete: 'location/autocomplete',
  /** Postal code or place name -> one result. */
  geocode: 'location/geocode',
  /** Device coordinates -> the postal code the clinic list is filtered by. */
  reverseGeocode: 'location/reverse-geocode',
} as const;

/** `GeocodingResult` as the API returns it (`location.service.ts:10-18`). */
export interface PlaceDto {
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

/** The shape the error branch returns, with HTTP 200. */
export interface LocationErrorDto {
  error?: string;
}

export interface Place {
  /** May be empty: a town-level match carries no postal code. */
  readonly pincode: string;
  readonly city: string;
  readonly state: string;
  /** What to show in a list. Falls back through city and state. */
  readonly label: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
}

const num = (value: number | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export function toPlace(dto: PlaceDto): Place {
  const city = dto.city?.trim() ?? '';
  const state = dto.state?.trim() ?? '';
  return {
    pincode: dto.pincode?.trim() ?? '',
    city,
    state,
    label: dto.formattedAddress?.trim() || [city, state].filter(Boolean).join(', ') || 'Unknown place',
    latitude: num(dto.latitude),
    longitude: num(dto.longitude),
  };
}

/**
 * True when the API reported a failure in a 200 body. Kept beside the DTOs
 * because it is a property of this contract, not of the store.
 */
export function isLocationError(payload: unknown): payload is LocationErrorDto {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as LocationErrorDto).error === 'string'
  );
}
