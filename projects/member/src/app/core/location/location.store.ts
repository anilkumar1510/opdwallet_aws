import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  LOCATION_API,
  Place,
  PlaceDto,
  isLocationError,
  toPlace,
} from './location';
import { AppService } from './../../core/http/api.service';
import { UserInfoStore } from './../../core/session/userinfo.store';

/** The API returns `[]` below this and a search is not worth spending. */
const MIN_QUERY = 2;
/** The endpoint rejects anything outside 1-10 (`location.controller.ts:86`). */
const MAX_RESULTS = 5;
/** Fewer characters than this and the address search is not sent. */
const MIN_ADDRESS_QUERY = 3;

/**
 * Where the member is, for the in-clinic doctor list — patient-flows flow 2,
 * step 3.
 *
 * Not session-scoped and deliberately not persisted: the sheet treats location
 * as a choice made per booking, and a remembered postal code from a previous
 * search silently filters a later one.
 *
 * Every method resolves rather than throws. Location is an aid to the clinic
 * list, not a precondition for it — a member who declines the browser prompt or
 * whose lookup fails must still reach the same screen and type a postal code.
 * `error` carries what to say; the caller decides whether to show it.
 */
@Injectable({ providedIn: 'root' })
export class LocationStore {
  private readonly http = inject(HttpClient);
  /** Interceptor-free client for third-party calls. See `reverseGeocode`. */
  private readonly googleHttp = new HttpClient(inject(HttpBackend));

  private readonly _place = signal<Place | null>(null);
  private readonly _matches = signal<readonly Place[]>([]);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);
  /** Separate from `busy` so a running address search does not read as detecting. */
  private readonly _searching = signal(false);
  private searchSeq = 0;
  /** True while a picked address is being geocoded for its coordinates. */
  private readonly _locating = signal(false);
  readonly locating = this._locating.asReadonly();
  private chooseSeq = 0;

  /** The location currently in force. Null until one is chosen or detected. */
  readonly place = this._place.asReadonly();
  readonly matches = this._matches.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly searching = this._searching.asReadonly();
  readonly error = this._error.asReadonly();
  constructor(private appService: AppService, private userInfoStore: UserInfoStore) {}

  /**
   * Adopts a picked place. A pick without coordinates — the address search
   * rows carry none — is geocoded so `place()` always ends up with latitude and
   * longitude for the provider search. The place is shown at once; the
   * coordinates follow, and `locating` is true until they do.
   */
  async choose(place: Place | null): Promise<Place | null> {
    const seq = ++this.chooseSeq;
    this._place.set(place);
    this._matches.set([]);
    this._error.set(null);
    this._locating.set(false);
    if (!place || (place.latitude !== null && place.longitude !== null)) {
      if (place) rememberPlace(place);
      return place;
    }

    this._locating.set(true);
    const coords = await this.coordinatesOf(place);
    // The member picked something else, or cleared, while this was in flight.
    if (seq !== this.chooseSeq) return this._place();
    const located: Place = coords ? { ...place, latitude: coords.lat, longitude: coords.lng } : place;
    this._place.set(located);
    this._locating.set(false);
    rememberPlace(located);
    return located;
  }

  /** The address within its pincode, then the pincode alone. Null when neither resolves. */
  private async coordinatesOf(place: Place): Promise<{ lat: number; lng: number } | null> {
    try {
      const key = await this.googleMapsKey();
      if (!key) return null;
      const components = place.pincode ? `postal_code:${place.pincode}|country:IN` : 'country:IN';
      for (const address of [place.label, place.pincode].filter(Boolean)) {
        const results = await this.geocode(
          new HttpParams().set('address', address).set('components', components).set('key', key),
        );
        const location = results[0]?.geometry?.location;
        if (location && Number.isFinite(location.lat) && Number.isFinite(location.lng)) return location;
      }
    } catch {
      // Coordinates are an aid to the provider search; the pick still stands.
    }
    return null;
  }

  clear(): void {
    this.chooseSeq++;
    this._locating.set(false);
    this._place.set(null);
    this._matches.set([]);
    this._error.set(null);
  }

  /** Place suggestions as the member types. Short queries clear the list. */
  async search(query: string): Promise<void> {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      this._matches.set([]);
      return;
    }
    this._busy.set(true);
    this._error.set(null);
    try {
      const payload = await firstValueFrom(
        this.http.get<PlaceDto[] | { error?: string }>(LOCATION_API.autocomplete, {
          params: new HttpParams().set('query', q).set('limit', MAX_RESULTS),
        }),
      );
      // A 200 body can still be a failure. See location.ts.
      if (isLocationError(payload) || !Array.isArray(payload)) {
        this._matches.set([]);
        this._error.set('We could not search for that place. Enter a postal code instead.');
        return;
      }
      this._matches.set(payload.map(toPlace));
    } catch {
      this._matches.set([]);
      this._error.set('We could not search for that place. Enter a postal code instead.');
    } finally {
      this._busy.set(false);
    }
  }

  /** Resolves a postal code or place name to one location and adopts it. */
  async resolve(query: string): Promise<Place | null> {
    const q = query.trim();
    if (!q) return null;
    this._busy.set(true);
    this._error.set(null);
    try {
      const payload = await firstValueFrom(
        this.http.get<PlaceDto | { error?: string }>(LOCATION_API.geocode, {
          params: new HttpParams().set('query', q),
        }),
      );
      if (isLocationError(payload)) {
        this._error.set(`We could not find "${q}". Check the postal code and try again.`);
        return null;
      }
      const place = toPlace(payload as PlaceDto);
      this._place.set(place);
      this._matches.set([]);
      return place;
    } catch {
      this._error.set('We could not look that up. Try again in a moment.');
      return null;
    } finally {
      this._busy.set(false);
    }
  }

  /**
   * Detects the member's location from the browser and adopts it.
   *
   * The permission prompt is the member's to answer, so a refusal is a normal
   * outcome and says so plainly rather than reading as a fault. Geolocation is
   * also unavailable on an insecure origin, which is why the absence of
   * `navigator.geolocation` is handled rather than assumed impossible.
   *
   * Every step is awaited in sequence — position, then the Maps key, then the
   * reverse geocode — so the returned place is the one the lookup produced.
   */
  async detect(): Promise<Place | null> {
    if (!navigator.geolocation) {
      this._error.set('This browser cannot detect your location. Enter a postal code instead.');
      return null;
    }
    this._busy.set(true);
    this._error.set(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 5 * 60_000,
        });
      });
      const { latitude, longitude } = position.coords;

      const key = await this.googleMapsKey();
      if (!key) {
        this._error.set('We could not name your location. Enter a postal code instead.');
        return null;
      }

      const results = await this.reverseGeocode(latitude, longitude, key);
      const place = placeFromGoogle(results, latitude, longitude);
      if (!place) {
        this._error.set('We could not name your location. Enter a postal code instead.');
        return null;
      }

      sessionStorage.setItem('latitude', String(latitude));
      sessionStorage.setItem('longitude', String(longitude));
      sessionStorage.setItem('selectedCity', place.city);
      sessionStorage.setItem('selectedPincode', place.pincode);
      sessionStorage.setItem('selectedState', place.state);

      this._place.set(place);
      this._matches.set([]);
      return place;
    } catch (error: unknown) {
      const denied =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as GeolocationPositionError).code === 1;
      this._error.set(
        denied
          ? 'Location is off for this site. Enter a postal code instead.'
          : 'We could not detect your location. Enter a postal code instead.',
      );
      return null;
    } finally {
      this._busy.set(false);
    }
  }

  /** Fetched and decrypted once per page load; repeat taps reuse it. */
  private mapsKey: string | null = null;

  private async googleMapsKey(): Promise<string | null> {
    if (this.mapsKey) return this.mapsKey;
    const response = await firstValueFrom(this.getCredentials('google_maps_key'));
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    const resources: any[] = parsed?.resource ?? [];
    if (!resources.length) return null;
    const encryptKey = this.userInfoStore.getUserInfo()?.[0]?.api_encryption_key ?? null;
    this.mapsKey = this.appService.decryptText(resources[0]?.value, encryptKey) || null;
    return this.mapsKey;
  }

  getCredentials(credentialType: string) {
    const queryId = 'GET_CREDENTIALS';
    const arg = '&args=key:' + credentialType + '&application=system-management';
    return this.appService.getcall('third_party_app_credentials', 'system-management', 'queryId=' + queryId + arg);
  }

  /**
   * Google's Geocoding API, called directly. It goes through `HttpBackend`, not
   * the app's `HttpClient`, so the API interceptors stay out of it: they force
   * `withCredentials`, which Google's `Access-Control-Allow-Origin: *` rejects.
   */
  private reverseGeocode(lat: number, lng: number, key: string): Promise<GoogleGeocodeResult[]> {
    return this.geocode(new HttpParams().set('latlng', `${lat},${lng}`).set('key', key));
  }

  /** `ZERO_RESULTS` is a normal answer, not a failure, so it reads as an empty list. */
  private async geocode(params: HttpParams): Promise<GoogleGeocodeResult[]> {
    const response = await firstValueFrom(
      this.googleHttp.get<{ status?: string; results?: GoogleGeocodeResult[] }>(
        'https://maps.googleapis.com/maps/api/geocode/json',
        { params },
      ),
    );
    if (response?.status === 'OK') return response.results ?? [];
    if (response?.status === 'ZERO_RESULTS') return [];
    throw new Error(`Geocoding failed: ${response?.status}`);
  }

  /**
   * Address search by pincode, area or street — the box on the AHC postal step.
   * Below three characters nothing is sent and the list clears. Results land
   * in `matches`; picking one goes through `choose()`, the same `place` that
   * `detect()` fills.
   *
   * Typing fires these in quick succession, so only the latest search may write
   * its results: an older response arriving late is dropped.
   */
  async searchAddresses(query: string): Promise<void> {
    //https://api.wellnessdevhh.hclhealthcare.in/system-management/api/v1/address_data?queryId=GET_ADDRESS_BY_TEXT_SEARCH&
    // args=&search=500082&application=system-management
    const search = query.trim();
    const seq = ++this.searchSeq;
    if (search.length < MIN_ADDRESS_QUERY) {
      this._matches.set([]);
      this._searching.set(false);
      this._error.set(null);
      return;
    }
    const queryId = 'AHC_ADDRESS_SEARCH';
    const applicationName = 'habit-opd';
    const resourceName = 'opd_ahc_booking';
    const args = '';
    this._searching.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(
        this.appService.getcall(
          resourceName,
          applicationName,
          'queryId=' + queryId + '&args=' + args + '&search=' + encodeURIComponent(search) + '&application=' + applicationName,
        ),
      );
      if (seq !== this.searchSeq) return;
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      const resources: any[] = parsed?.resource ?? [];
      const places = resources.map(addressFromRow).filter((p): p is Place => p !== null);
      this._matches.set(places);
      if (!places.length) this._error.set(`No addresses found for "${search}".`);
    } catch {
      if (seq !== this.searchSeq) return;
      this._matches.set([]);
      this._error.set('We could not search addresses right now. Try again in a moment.');
    } finally {
      if (seq === this.searchSeq) this._searching.set(false);
    }
  }
}

interface GoogleGeocodeResult {
  formatted_address?: string;
  address_components?: { long_name: string; short_name: string; types: string[] }[];
  geometry?: { location?: { lat: number; lng: number } };
  /** Present on a postal-code result: the localities the code covers. */
  postcode_localities?: string[];
}

/**
 * Picks pincode, city and state out of Google's results. The first result is
 * not guaranteed to carry a postal code, so each field is taken from the first
 * result that has it.
 */
function placeFromGoogle(results: GoogleGeocodeResult[], lat?: number, lng?: number): Place | null {
  const find = (...types: string[]): string => {
    for (const type of types) {
      for (const result of results) {
        const c = result.address_components?.find((ac) => ac.types.includes(type));
        if (c) return c.long_name || c.short_name;
      }
    }
    return '';
  };
  const pincode = find('postal_code');
  const city = find('locality', 'administrative_area_level_3', 'administrative_area_level_2');
  const state = find('administrative_area_level_1');
  if (!pincode && !city) return null;
  return toPlace({
    pincode,
    city,
    state,
    latitude: lat,
    longitude: lng,
    formattedAddress: results[0]?.formatted_address || [city, pincode].filter(Boolean).join(' - '),
  });
}

/**
 * One row of the address search, e.g.
 * `{ localityDisplayName: 'I.M.Colony', cityDisplayName: 'Hyderabad',
 *    stateDisplayName: 'Telangana', pincodeDisplayName: '500082',
 *    countryDisplayName: 'India' }`. Rows may be wrapped in `data`, as other
 * habit-opd queries are. `label` is the line shown under the pincode:
 * locality, city, state, country.
 */
function addressFromRow(row: any): Place | null {
  const r = row?.data ?? row;
  if (!r || typeof r !== 'object') return null;
  const pick = (...keys: string[]): string => {
    for (const key of keys) {
      const value = r[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return '';
  };
  const street = pick('localityDisplayName');
  const city = pick('cityDisplayName', 'districtDisplayName');
  const state = pick('stateDisplayName');
  const pincode = pick('pincodeDisplayName');
  const country = pick('countryDisplayName');
  if (!street && !city && !pincode) return null;
  // Used when the row carries them; otherwise `choose()` geocodes the pick.
  const coord = (...keys: string[]): number | undefined => {
    const n = parseFloat(pick(...keys));
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    ...toPlace({
      pincode,
      city,
      state,
      latitude: coord('latitude', 'lat'),
      longitude: coord('longitude', 'lng', 'long'),
      formattedAddress: [street, city, state, country].filter(Boolean).join(', '),
    }),
    street,
  };
}

/** Same session keys `detect()` writes, so a picked address reads like a detected one. */
function rememberPlace(place: Place): void {
  try {
    if (place.latitude !== null) sessionStorage.setItem('latitude', String(place.latitude));
    if (place.longitude !== null) sessionStorage.setItem('longitude', String(place.longitude));
    sessionStorage.setItem('selectedCity', place.city);
    sessionStorage.setItem('selectedPincode', place.pincode);
    sessionStorage.setItem('selectedState', place.state);
  } catch {
    // Storage can be unavailable (private mode); the store's signal is the source of truth.
  }
}
