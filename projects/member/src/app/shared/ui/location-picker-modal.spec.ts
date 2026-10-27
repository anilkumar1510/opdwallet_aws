import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationPickerModal, placeLabel } from './location-picker-modal';
import { GoogleMapsLoader } from '../../core/location/google-maps.loader';

interface Row {
  readonly main: string;
  readonly secondary: string;
  readonly fails?: boolean;
}

const APOLLO: Row = { main: 'Apollo Pharmacy', secondary: 'Road No. 1, Banjara Hills, Hyderabad, Telangana, India' };
const MEDPLUS: Row = { main: 'MedPlus', secondary: 'Ameerpet, Hyderabad, Telangana, India' };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Longer than the modal's 300 ms debounce. */
const PAUSE = 350;

/** A promise the test resolves or rejects when it chooses. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A row marked `fails` gets a place id the fake details lookup refuses. */
function prediction(row: Row) {
  return {
    place_id: row.fails ? `fail:${row.main}` : row.main,
    description: `${row.main}, ${row.secondary}`,
    structured_formatting: { main_text: row.main, secondary_text: row.secondary },
  };
}

const response = (...rows: Row[]) => ({ predictions: rows.map(prediction) });

class FakePlacesService {
  getDetails(request: { placeId: string }, callback: (result: unknown, status: string) => void): void {
    if (request.placeId.startsWith('fail:')) callback(null, 'NOT_FOUND');
    else callback({ geometry: { location: { toJSON: () => ({ lat: 17.41, lng: 78.44 }) } } }, 'OK');
  }
}

describe('placeLabel', () => {
  it('joins name and address and drops the trailing ", India"', () => {
    expect(placeLabel(APOLLO.main, APOLLO.secondary)).toBe('Apollo Pharmacy, Road No. 1, Banjara Hills, Hyderabad, Telangana');
  });

  it('returns the name alone when there is no address', () => {
    expect(placeLabel('Hyderabad', '')).toBe('Hyderabad');
    expect(placeLabel('Hyderabad', null)).toBe('Hyderabad');
    expect(placeLabel('Hyderabad', 'India')).toBe('Hyderabad');
  });

  it('never strips "India" from the name itself', () => {
    expect(placeLabel('Gate of India', '')).toBe('Gate of India');
  });
});

describe('LocationPickerModal', () => {
  let fixture: ComponentFixture<LocationPickerModal>;
  let loader: { load: ReturnType<typeof vi.fn>; keyRejected: WritableSignal<boolean> };
  let fetchSuggestions: ReturnType<typeof vi.fn>;
  let mapOptions: unknown[];
  let markerOptions: unknown[];

  const el = () => fixture.nativeElement as HTMLElement;
  const searchBox = () => el().querySelector<HTMLInputElement>('#location-picker-search')!;
  const button = (name: string) =>
    Array.from(el().querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.trim() === name);
  const options = () => Array.from(el().querySelectorAll<HTMLButtonElement>('[role="option"]'));

  async function settle(): Promise<void> {
    await sleep(0);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function type(text: string): Promise<void> {
    searchBox().value = text;
    searchBox().dispatchEvent(new Event('input'));
    await settle();
  }

  async function open(): Promise<void> {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(async () => {
    fetchSuggestions = vi.fn().mockResolvedValue(response(APOLLO, MEDPLUS));
    mapOptions = [];
    markerOptions = [];
    const fakeGoogle = {
      maps: {
        importLibrary: async (name: string) =>
          ({
            maps: {
              Map: class {
                constructor(_el: unknown, options: unknown) {
                  mapOptions.push(options);
                }
                panTo() {}
                setZoom() {}
              },
            },
            marker: {
              AdvancedMarkerElement: class {
                constructor(options: unknown) {
                  markerOptions.push(options);
                }
              },
            },
            places: {
              AutocompleteSessionToken: class {},
              AutocompleteService: class { getPlacePredictions = fetchSuggestions; },
              PlacesService: FakePlacesService,
            },
          })[name],
      },
    };
    Object.assign(globalThis, { google: fakeGoogle });

    loader = { load: vi.fn().mockResolvedValue(undefined), keyRejected: signal(false) };
    await TestBed.configureTestingModule({
      imports: [LocationPickerModal],
      providers: [{ provide: GoogleMapsLoader, useValue: loader }],
    }).compileComponents();
    fixture = TestBed.createComponent(LocationPickerModal);
    fixture.componentRef.setInput('title', 'Doctor location');
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (globalThis as { google?: unknown }).google;
  });

  it('When opened THEN it shows the title and a search box, with the map on all of India', async () => {
    await open();
    expect(el().querySelector('#location-picker-title')?.textContent).toContain('Doctor location');
    expect(searchBox()).toBeTruthy();
    expect(mapOptions.at(-1)).toMatchObject({ zoom: 4 });
    expect(markerOptions.length).toBe(0);
  });

  it("When opened with the field's current pick THEN it is selected, centred and marked on the map", async () => {
    const current = {
      name: 'Apollo Pharmacy',
      address: 'Road No. 1, Banjara Hills, Hyderabad, Telangana',
      label: 'Apollo Pharmacy, Road No. 1, Banjara Hills, Hyderabad, Telangana',
      position: { lat: 17.41, lng: 78.44 },
    };
    fixture.componentRef.setInput('initial', current);
    await open();
    expect(el().textContent).toContain('Road No. 1, Banjara Hills');
    expect(button('Confirm')?.disabled).toBe(false);
    expect(mapOptions.at(-1)).toMatchObject({ center: current.position, zoom: 16 });
    expect(markerOptions.at(-1)).toMatchObject({ position: current.position });
    expect(searchBox().value).toBe('');
    expect(fetchSuggestions).not.toHaveBeenCalled();
  });

  it('When fewer than 3 characters are typed THEN no search is made', async () => {
    await open();
    await type('ap');
    await sleep(PAUSE);
    expect(fetchSuggestions).not.toHaveBeenCalled();
    expect(options().length).toBe(0);
  });

  it('When typing quickly THEN one search runs for the final text, limited to India', async () => {
    await open();
    await type('apo');
    await type('apol');
    await type('apollo');
    await sleep(PAUSE);
    await settle();
    expect(fetchSuggestions).toHaveBeenCalledTimes(1);
    expect(fetchSuggestions.mock.calls[0][0]).toMatchObject({ input: 'apollo', componentRestrictions: { country: 'in' } });
    expect(options().map((o) => o.textContent)).toEqual([
      expect.stringContaining('Apollo Pharmacy'),
      expect.stringContaining('MedPlus'),
    ]);
  });

  it('When an older search answers after a newer one THEN the older answer is ignored', async () => {
    const older = deferred<ReturnType<typeof response>>();
    fetchSuggestions.mockReturnValueOnce(older.promise).mockResolvedValueOnce(response(MEDPLUS));
    await open();
    await type('apollo');
    await sleep(PAUSE);
    await type('medplus');
    await sleep(PAUSE);
    await settle();
    older.resolve(response(APOLLO));
    await settle();
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining('MedPlus')]);
  });

  it('When nothing matches THEN it says so', async () => {
    fetchSuggestions.mockResolvedValue(response());
    await open();
    await type('zzzz');
    await sleep(PAUSE);
    await settle();
    expect(el().textContent).toContain('No places match "zzzz".');
  });

  it('When Places answers ZERO_RESULTS as a rejection THEN it still reads as no matches', async () => {
    fetchSuggestions.mockRejectedValue(Object.assign(new Error('ZERO_RESULTS'), { code: 'ZERO_RESULTS' }));
    await open();
    await type('zzzz');
    await sleep(PAUSE);
    await settle();
    expect(el().textContent).toContain('No places match "zzzz".');
    expect(el().textContent).not.toContain('We could not search right now.');
  });

  it('When the search fails THEN it says so and offers typing instead', async () => {
    fetchSuggestions.mockRejectedValue(new Error('PERMISSION_DENIED'));
    await open();
    await type('apollo');
    await sleep(PAUSE);
    await settle();
    expect(el().textContent).toContain('We could not search right now. Try again.');
    expect(button('Type it instead')).toBeTruthy();
  });

  it('When nothing is picked THEN Confirm is disabled; after a pick, Confirm emits the label and position', async () => {
    const confirmed: unknown[] = [];
    fixture.componentInstance.confirmed.subscribe((pick) => confirmed.push(pick));
    await open();
    expect(button('Confirm')?.disabled).toBe(true);

    await type('apollo');
    await sleep(PAUSE);
    await settle();
    options()[0].click();
    await settle();
    expect(el().textContent).toContain('Apollo Pharmacy');
    expect(button('Confirm')?.disabled).toBe(false);

    button('Confirm')!.click();
    expect(confirmed).toEqual([
      expect.objectContaining({
        label: 'Apollo Pharmacy, Road No. 1, Banjara Hills, Hyderabad, Telangana',
        position: { lat: 17.41, lng: 78.44 },
      }),
    ]);
  });

  it('When the picked place cannot be loaded THEN it says so and Confirm stays disabled', async () => {
    fetchSuggestions.mockResolvedValue(response({ ...APOLLO, fails: true }));
    await open();
    await type('apollo');
    await sleep(PAUSE);
    await settle();
    options()[0].click();
    await settle();
    expect(el().textContent).toContain('We could not load that place.');
    expect(button('Confirm')?.disabled).toBe(true);
  });

  it('When Escape is pressed THEN it emits cancelled', async () => {
    let cancelled = 0;
    fixture.componentInstance.cancelled.subscribe(() => cancelled++);
    await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cancelled).toBe(1);
  });

  it('When Maps fails to load THEN it offers "Type it instead", which emits unavailable', async () => {
    let unavailable = 0;
    fixture.componentInstance.unavailable.subscribe(() => unavailable++);
    loader.load.mockRejectedValue(new Error('no key'));
    await open();
    expect(el().textContent).toContain("Map search isn't available right now.");
    button('Type it instead')!.click();
    expect(unavailable).toBe(1);
  });

  it('When Google rejects the key after the map loaded THEN it switches to "Type it instead"', async () => {
    await open();
    loader.keyRejected.set(true);
    await settle();
    expect(button('Type it instead')).toBeTruthy();
  });
});
