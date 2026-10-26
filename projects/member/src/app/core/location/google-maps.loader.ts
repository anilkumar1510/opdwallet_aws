import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

import { LocationStore } from './location.store';

const MAPS_SCRIPT = 'https://maps.googleapis.com/maps/api/js';
/** The global the Maps script calls once it is ready (`callback=` on its URL). */
const READY_CALLBACK = '__opdGoogleMapsReady';
/** A script that neither loads nor errors is treated as failed after this. */
const LOAD_TIMEOUT_MS = 15_000;

type MapsWindow = Window & {
  google?: { maps?: { importLibrary?: unknown } };
  /** Google calls this when it rejects the key — bad key, referrer or API not enabled. */
  gm_authFailure?: () => void;
  [READY_CALLBACK]?: () => void;
};

/**
 * Loads the Google Maps JavaScript API for the claim location picker: once per
 * page load, and only when a member first opens the picker.
 *
 * The key is the `Places_API_KEY` credential, fetched and decrypted by
 * `LocationStore`. The same key serves the Places library, which runs through
 * the loaded SDK, so nothing else is fetched.
 *
 * A failed load is not remembered, so the next open tries again. A rejected key
 * is different: Google reports it after the script has loaded, usually when the
 * first map is drawn, and the script cannot be loaded a second time. So a
 * rejection sticks for the page load and `keyRejected` tells an open picker to
 * fall back to typing.
 *
 * When Maps is already on the page — loaded elsewhere, or a fake installed by
 * an e2e test — nothing is fetched.
 */
@Injectable({ providedIn: 'root' })
export class GoogleMapsLoader {
  private readonly location = inject(LocationStore);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private loading: Promise<void> | null = null;
  private readonly _keyRejected = signal(false);
  readonly keyRejected = this._keyRejected.asReadonly();

  load(): Promise<void> {
    if (!this.isBrowser) return Promise.reject(new Error('Google Maps needs a browser.'));
    if (this._keyRejected()) return Promise.reject(new Error('Google rejected the Maps key.'));
    if ((window as MapsWindow).google?.maps?.importLibrary) return Promise.resolve();
    this.loading ??= this.loadScript().catch((error: unknown) => {
      this.loading = null;
      throw error;
    });
    return this.loading;
  }

  private async loadScript(): Promise<void> {
    const key = await this.location.placesApiKey();
    if (!key) throw new Error('No Google Maps key came back.');

    const w = window as MapsWindow;
    const script = this.document.createElement('script');
    script.src = `${MAPS_SCRIPT}?${new URLSearchParams({ key, v: 'weekly', loading: 'async', callback: READY_CALLBACK })}`;
    script.async = true;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => fail('The Google Maps script did not load in time.'), LOAD_TIMEOUT_MS);
      const settle = () => {
        clearTimeout(timer);
        delete w[READY_CALLBACK];
      };
      const fail = (message: string) => {
        settle();
        script.remove();
        reject(new Error(message));
      };
      w[READY_CALLBACK] = () => {
        settle();
        resolve();
      };
      w.gm_authFailure = () => {
        this._keyRejected.set(true);
        fail('Google rejected the Maps key.');
      };
      script.onerror = () => fail('The Google Maps script did not load.');
      this.document.head.appendChild(script);
    });
  }
}
