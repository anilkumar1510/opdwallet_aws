import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { GoogleMapsLoader } from '../../core/location/google-maps.loader';
import { environment } from '../../../environments/environment';

/** Fewer characters than this and no search is sent. */
const MIN_QUERY = 3;
/** The search runs when typing pauses, not on every key. */
const SEARCH_DEBOUNCE_MS = 300;
/** Where the map sits before anything is picked. */
const INDIA: google.maps.LatLngLiteral = { lat: 20.59, lng: 78.96 };
const INDIA_ZOOM = 4;
const PICKED_ZOOM = 16;

/** An address line without the country every result here ends with. */
function withoutCountry(address: string | null | undefined): string {
  const text = address?.trim() ?? '';
  return /^India$/i.test(text) ? '' : text.replace(/,\s*India$/i, '');
}

/**
 * The text a pick puts in the field: the row's name and address as the member
 * saw them, without the trailing ", India".
 */
export function placeLabel(main: string, secondary?: string | null): string {
  return [main.trim(), withoutCountry(secondary)].filter(Boolean).join(', ');
}

interface Suggestion {
  readonly main: string;
  readonly secondary: string;
  readonly placeId: string;
}

/** A confirmed pick: the text for the field, and where it is so reopening can show it. */
export interface PickedLocation {
  readonly name: string;
  readonly address: string;
  readonly label: string;
  readonly position: google.maps.LatLngLiteral;
}

/**
 * Find a place on Google Maps and confirm it — the location fields of a new
 * claim open this.
 *
 * Knows nothing about claims: it takes a title and says what happened —
 * `confirmed` with the pick, `cancelled`, or `unavailable` when Maps cannot be
 * used and the host should let the member type instead.
 *
 * A place is chosen only from the search results. The map shows the pick; tapping
 * or panning it never changes the selection. Each open starts from `initial` —
 * the field's current pick, already on the map — or from nothing, so cancelling
 * cannot leak a half-made pick.
 */
@Component({
  selector: 'opd-location-picker-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="onBackdrop($event)"
      >
        <div
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-picker-title"
        >
          <div class="flex items-start justify-between gap-3">
            <h2 id="location-picker-title" class="text-base font-semibold text-[#0E51A2]">{{ title() }}</h2>
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
              (click)="cancelled.emit()"
            >
              Close
            </button>
          </div>

          @if (phase() === 'unavailable') {
            <p class="mt-4 rounded-xl bg-warning-50 px-3 py-3 text-sm text-warning-700" role="alert">
              Map search isn't available right now.
            </p>
            <button
              type="button"
              class="mt-3 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white"
              (click)="unavailable.emit()"
            >
              Type it instead
            </button>
          } @else {
            <label for="location-picker-search" class="sr-only">Search for a place</label>
            <input
              #search
              id="location-picker-search"
              type="search"
              autocomplete="off"
              placeholder="Search for a place"
              class="mt-4 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-500 focus:outline-none"
              [value]="query()"
              (input)="onQuery($any($event.target).value)"
            />

            @if (searching()) {
              <p class="mt-2 text-xs text-ink-500">Searching…</p>
            } @else if (searchError(); as problem) {
              <div class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-700" role="alert">
                {{ problem }}
                <button type="button" class="ml-1 font-semibold underline" (click)="unavailable.emit()">Type it instead</button>
              </div>
            } @else if (noMatchesFor(); as text) {
              <p class="mt-2 text-xs text-ink-500">No places match "{{ text }}".</p>
            }

            @if (suggestions().length) {
              <ul class="mt-2 max-h-48 divide-y divide-surface-border overflow-y-auto rounded-xl border border-surface-border" role="listbox" aria-label="Search results">
                @for (row of suggestions(); track $index) {
                  <li>
                    <button
                      type="button"
                      role="option"
                      class="w-full px-3 py-2 text-left hover:bg-[#EFF4FF]"
                      [attr.aria-selected]="isSelected(row)"
                      [class.bg-[#EFF4FF]]="isSelected(row)"
                      (click)="pick(row)"
                    >
                      <span class="block text-sm font-medium text-ink-900">{{ row.main }}</span>
                      @if (row.secondary) {
                        <span class="block text-xs text-ink-500">{{ row.secondary }}</span>
                      }
                    </button>
                  </li>
                }
              </ul>
            }

            <div class="relative mt-3 h-64 w-full overflow-hidden rounded-xl bg-[#F3F4F6] sm:h-80">
              <div #map class="h-full w-full"></div>
              @if (phase() === 'loading') {
                <p class="absolute inset-0 flex items-center justify-center text-xs text-ink-500">Loading map…</p>
              }
            </div>

            @if (picking()) {
              <p class="mt-3 text-xs text-ink-500">Loading place…</p>
            } @else if (pickError(); as problem) {
              <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-700" role="alert">{{ problem }}</p>
            } @else if (selected(); as place) {
              <div class="mt-3 rounded-xl border border-[#0F5FDC] bg-[#EFF4FF] p-3" aria-live="polite">
                <p class="text-sm font-medium text-ink-900">{{ place.name }}</p>
                @if (place.address) {
                  <p class="mt-0.5 text-xs text-ink-700">{{ place.address }}</p>
                }
              </div>
            }

            <div class="mt-4 flex gap-3">
              <button
                type="button"
                class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
                (click)="cancelled.emit()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="!selected()"
                (click)="confirm()"
              >
                Confirm
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class LocationPickerModal {
  readonly open = input(false);
  readonly title = input('');
  /** The field's current pick; the modal opens with it selected and on the map. */
  readonly initial = input<PickedLocation | null>(null);
  readonly confirmed = output<PickedLocation>();
  readonly cancelled = output<void>();
  /** Maps cannot be used; the host should let the member type the location. */
  readonly unavailable = output<void>();

  private readonly loader = inject(GoogleMapsLoader);
  private readonly injector = inject(Injector);
  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('map');
  private readonly searchEl = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly phase = signal<'loading' | 'ready' | 'unavailable'>('loading');
  protected readonly query = signal('');
  protected readonly suggestions = signal<readonly Suggestion[]>([]);
  protected readonly searching = signal(false);
  protected readonly searchError = signal<string | null>(null);
  protected readonly noMatchesFor = signal<string | null>(null);
  protected readonly picking = signal(false);
  protected readonly pickError = signal<string | null>(null);
  protected readonly selected = signal<PickedLocation | null>(null);

  private map: google.maps.Map | null = null;
  private marker: google.maps.marker.AdvancedMarkerElement | null = null;
  private markers: google.maps.MarkerLibrary | null = null;
  private places: google.maps.PlacesLibrary | null = null;
  // The legacy Places API: the key's project has it, not Places API (New).
  private autocomplete: google.maps.places.AutocompleteService | null = null;
  private details: google.maps.places.PlacesService | null = null;
  /** One Places session per open, ended by the pick's details lookup. */
  private sessionToken: google.maps.places.AutocompleteSessionToken | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  // Each counter lets only the latest open, search or pick write its result.
  private openSeq = 0;
  private searchSeq = 0;
  private pickSeq = 0;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      untracked(() => (isOpen ? this.begin() : this.end()));
    });
    // Google reports a rejected key after the map is drawn, not when it loads.
    effect(() => {
      if (this.loader.keyRejected() && this.open()) untracked(() => this.phase.set('unavailable'));
    });
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    clearTimeout(this.searchTimer);
    this.searchSeq++;
    this.searchError.set(null);
    this.noMatchesFor.set(null);
    const text = value.trim();
    if (text.length < MIN_QUERY) {
      this.suggestions.set([]);
      this.searching.set(false);
      return;
    }
    this.searchTimer = setTimeout(() => void this.search(text), SEARCH_DEBOUNCE_MS);
  }

  protected isSelected(row: Suggestion): boolean {
    return this.selected()?.label === placeLabel(row.main, row.secondary);
  }

  protected async pick(row: Suggestion): Promise<void> {
    const seq = ++this.pickSeq;
    this.selected.set(null);
    this.pickError.set(null);
    this.picking.set(true);
    if (this.marker) this.marker.map = null;
    try {
      const at = await this.locationOf(row.placeId);
      if (seq !== this.pickSeq) return;
      this.showOnMap(at);
      this.selected.set({ name: row.main, address: row.secondary, label: placeLabel(row.main, row.secondary), position: at });
    } catch {
      if (seq !== this.pickSeq) return;
      this.pickError.set('We could not load that place.');
    } finally {
      if (seq === this.pickSeq) this.picking.set(false);
      // The details lookup ends the session; a further search starts a new one.
      if (this.places) this.sessionToken = new this.places.AutocompleteSessionToken();
    }
  }

  protected confirm(): void {
    const place = this.selected();
    if (place) this.confirmed.emit(place);
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelled.emit();
  }

  protected onEscape(): void {
    if (this.open()) this.cancelled.emit();
  }

  private begin(): void {
    this.phase.set('loading');
    this.query.set('');
    this.suggestions.set([]);
    this.searching.set(false);
    this.searchError.set(null);
    this.noMatchesFor.set(null);
    this.picking.set(false);
    this.pickError.set(null);
    this.selected.set(this.initial());
    afterNextRender(() => this.searchEl()?.nativeElement.focus(), { injector: this.injector });
    void this.start();
  }

  private end(): void {
    this.openSeq++;
    this.searchSeq++;
    this.pickSeq++;
    clearTimeout(this.searchTimer);
    this.map = null;
    this.marker = null;
    this.autocomplete = null;
    this.details = null;
    this.sessionToken = null;
  }

  private async start(): Promise<void> {
    const run = ++this.openSeq;
    try {
      await this.loader.load();
      const [maps, markers, places] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('places'),
      ]);
      if (run !== this.openSeq) return;
      const el = this.mapEl()?.nativeElement;
      if (!el) throw new Error('The map container is not on the page.');
      // Reopening a filled field starts on its pick rather than on all of India.
      const current = this.selected();
      this.map = new maps.Map(el, {
        center: current?.position ?? INDIA,
        zoom: current ? PICKED_ZOOM : INDIA_ZOOM,
        mapId: environment.googleMapsMapId || undefined,
        clickableIcons: false,
        gestureHandling: 'cooperative',
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      this.markers = markers;
      this.places = places;
      this.autocomplete = new places.AutocompleteService();
      this.details = new places.PlacesService(this.map);
      this.sessionToken = new places.AutocompleteSessionToken();
      if (current) this.showOnMap(current.position);
      if (this.phase() !== 'unavailable') this.phase.set('ready');
      // The member may have typed while the map was loading.
      const text = this.query().trim();
      if (text.length >= MIN_QUERY) void this.search(text);
    } catch {
      if (run === this.openSeq) this.phase.set('unavailable');
    }
  }

  private async search(text: string): Promise<void> {
    const autocomplete = this.autocomplete;
    if (!autocomplete || !this.sessionToken) return; // runs once the map is ready
    const seq = ++this.searchSeq;
    this.searching.set(true);
    try {
      const predictions = await this.predictions(autocomplete, text);
      if (seq !== this.searchSeq) return;
      const rows = predictions.map((p) => ({
        main: p.structured_formatting?.main_text || p.description,
        secondary: withoutCountry(p.structured_formatting?.secondary_text),
        placeId: p.place_id,
      }));
      this.suggestions.set(rows);
      this.noMatchesFor.set(rows.length ? null : text);
    } catch {
      if (seq !== this.searchSeq) return;
      this.suggestions.set([]);
      this.searchError.set('We could not search right now. Try again.');
    } finally {
      if (seq === this.searchSeq) this.searching.set(false);
    }
  }

  /** Places in India matching the text. "No results" is an empty list, not a failure. */
  private async predictions(
    autocomplete: google.maps.places.AutocompleteService,
    input: string,
  ): Promise<google.maps.places.AutocompletePrediction[]> {
    try {
      const { predictions } = await autocomplete.getPlacePredictions({
        input,
        sessionToken: this.sessionToken ?? undefined,
        componentRestrictions: { country: 'in' },
      });
      return predictions ?? [];
    } catch (error) {
      if ((error as { code?: string } | null)?.code === 'ZERO_RESULTS') return [];
      throw error;
    }
  }

  /** Only the location is fetched: the name and address shown are the row's own. */
  private locationOf(placeId: string): Promise<google.maps.LatLngLiteral> {
    const details = this.details;
    if (!details) return Promise.reject(new Error('Places is not ready.'));
    return new Promise((resolve, reject) =>
      details.getDetails(
        { placeId, fields: ['geometry.location'], sessionToken: this.sessionToken ?? undefined },
        (result, status) => {
          const at = result?.geometry?.location;
          if (status === 'OK' && at) resolve(at.toJSON());
          else reject(new Error(`Place details failed: ${status}`));
        },
      ),
    );
  }

  private showOnMap(at: google.maps.LatLngLiteral): void {
    this.map?.panTo(at);
    this.map?.setZoom(PICKED_ZOOM);
    if (!this.map || !this.markers) return;
    try {
      if (this.marker) {
        this.marker.position = at;
        this.marker.map = this.map;
      } else {
        this.marker = new this.markers.AdvancedMarkerElement({ map: this.map, position: at });
      }
    } catch {
      // Advanced markers need a Map ID; without one the pick still stands.
    }
  }
}
