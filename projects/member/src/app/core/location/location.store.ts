import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  LOCATION_API,
  Place,
  PlaceDto,
  isLocationError,
  toPlace,
} from './location';

/** The API returns `[]` below this and a search is not worth spending. */
const MIN_QUERY = 2;
/** The endpoint rejects anything outside 1-10 (`location.controller.ts:86`). */
const MAX_RESULTS = 5;

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

  private readonly _place = signal<Place | null>(null);
  private readonly _matches = signal<readonly Place[]>([]);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);

  /** The location currently in force. Null until one is chosen or detected. */
  readonly place = this._place.asReadonly();
  readonly matches = this._matches.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();

  choose(place: Place | null): void {
    this._place.set(place);
    this._matches.set([]);
    this._error.set(null);
  }

  clear(): void {
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
      const payload = await firstValueFrom(
        this.http.get<PlaceDto | { error?: string }>(LOCATION_API.reverseGeocode, {
          params: new HttpParams()
            .set('lat', position.coords.latitude)
            .set('lng', position.coords.longitude),
        }),
      );
      if (isLocationError(payload)) {
        this._error.set('We could not name your location. Enter a postal code instead.');
        return null;
      }
      const place = toPlace(payload as PlaceDto);
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
}
