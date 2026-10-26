import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleMapsLoader } from './google-maps.loader';
import { LocationStore } from './location.store';

type TestWindow = Window & {
  google?: unknown;
  gm_authFailure?: () => void;
  __opdGoogleMapsReady?: () => void;
};

const w = window as TestWindow;
const mapsScripts = () => document.querySelectorAll<HTMLScriptElement>('script[src^="https://maps.googleapis.com/maps/api/js"]');
/** Lets the key lookup resolve and the script get appended. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('GoogleMapsLoader', () => {
  let loader: GoogleMapsLoader;
  let location: { placesApiKey: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    location = { placesApiKey: vi.fn().mockResolvedValue('places-key') };
    TestBed.configureTestingModule({
      providers: [GoogleMapsLoader, { provide: LocationStore, useValue: location }],
    });
    loader = TestBed.inject(GoogleMapsLoader);
  });

  afterEach(() => {
    // Settle a load a test left pending, so its timeout does not fire later.
    w.__opdGoogleMapsReady?.();
    mapsScripts().forEach((s) => s.remove());
    delete w.google;
    delete w.gm_authFailure;
    delete w.__opdGoogleMapsReady;
  });

  it('When Maps is already on the page THEN load resolves without asking for a key', async () => {
    w.google = { maps: { importLibrary: () => undefined } };
    await expect(loader.load()).resolves.toBeUndefined();
    expect(location.placesApiKey).not.toHaveBeenCalled();
    expect(mapsScripts().length).toBe(0);
  });

  it('When load is called twice at once THEN one key lookup and one script serve both', async () => {
    const first = loader.load();
    const second = loader.load();
    await flush();
    expect(location.placesApiKey).toHaveBeenCalledTimes(1);
    expect(mapsScripts().length).toBe(1);
    w.__opdGoogleMapsReady?.();
    await expect(Promise.all([first, second])).resolves.toBeDefined();
  });

  it('When the script is injected THEN its URL carries the Places key and the ready callback', async () => {
    void loader.load();
    await flush();
    const src = new URL(mapsScripts()[0].src);
    expect(src.searchParams.get('key')).toBe('places-key');
    expect(src.searchParams.get('callback')).toBe('__opdGoogleMapsReady');
    expect(src.searchParams.get('loading')).toBe('async');
  });

  it('When no key comes back THEN load rejects, and the next load asks again', async () => {
    location.placesApiKey.mockResolvedValueOnce(null);
    await expect(loader.load()).rejects.toThrow();
    expect(mapsScripts().length).toBe(0);

    void loader.load();
    await flush();
    expect(location.placesApiKey).toHaveBeenCalledTimes(2);
    expect(mapsScripts().length).toBe(1);
  });

  it('When the script fails to load THEN load rejects, and the next load injects a fresh script', async () => {
    const attempt = loader.load();
    await flush();
    mapsScripts()[0].dispatchEvent(new Event('error'));
    await expect(attempt).rejects.toThrow();
    expect(mapsScripts().length).toBe(0);

    void loader.load();
    await flush();
    expect(mapsScripts().length).toBe(1);
  });

  it('When Google rejects the key THEN load rejects, keyRejected is set, and later loads reject without retrying', async () => {
    const attempt = loader.load();
    await flush();
    w.gm_authFailure?.();
    await expect(attempt).rejects.toThrow();
    expect(loader.keyRejected()).toBe(true);

    await expect(loader.load()).rejects.toThrow();
    expect(location.placesApiKey).toHaveBeenCalledTimes(1);
  });

  it('When Google rejects the key after Maps has loaded THEN keyRejected is set', async () => {
    const attempt = loader.load();
    await flush();
    w.__opdGoogleMapsReady?.();
    await attempt;
    w.gm_authFailure?.();
    expect(loader.keyRejected()).toBe(true);
  });
});
