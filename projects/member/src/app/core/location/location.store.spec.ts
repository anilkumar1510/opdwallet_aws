import { TestBed } from '@angular/core/testing';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationStore } from './location.store';
import { Place } from './location';
import { AppService } from '../http/api.service';
import { UserInfoStore } from '../session/userinfo.store';

describe('LocationStore — third-party credential keys', () => {
  let store: LocationStore;
  let appService: { getcall: ReturnType<typeof vi.fn>; decryptText: ReturnType<typeof vi.fn> };

  const credentials = (...values: string[]) =>
    of(JSON.stringify({ resource: values.map((value) => ({ value })) }));

  beforeEach(() => {
    appService = {
      getcall: vi.fn(),
      decryptText: vi.fn((value: string, key: string) => `plain(${value},${key})`),
    };
    TestBed.configureTestingModule({
      providers: [
        LocationStore,
        { provide: AppService, useValue: appService },
        { provide: UserInfoStore, useValue: { getUserInfo: () => [{ api_encryption_key: 'member-key' }] } },
        { provide: HttpClient, useValue: {} },
        { provide: HttpBackend, useValue: {} },
      ],
    });
    store = TestBed.inject(LocationStore);
  });

  describe('Given the credentials service returns an encrypted Places key', () => {
    beforeEach(() => appService.getcall.mockReturnValue(credentials('cipher')));

    it('When placesApiKey is called THEN it asks third_party_app_credentials for Places_API_KEY', async () => {
      await store.placesApiKey();
      expect(appService.getcall).toHaveBeenCalledWith(
        'third_party_app_credentials',
        'system-management',
        expect.stringContaining('key:Places_API_KEY'),
      );
    });

    it("When placesApiKey is called THEN it decrypts resource[0].value with the member's api_encryption_key", async () => {
      await expect(store.placesApiKey()).resolves.toBe('plain(cipher,member-key)');
      expect(appService.decryptText).toHaveBeenCalledWith('cipher', 'member-key');
    });

    it('When placesApiKey is called twice THEN the second call is served from memory', async () => {
      await store.placesApiKey();
      await expect(store.placesApiKey()).resolves.toBe('plain(cipher,member-key)');
      expect(appService.getcall).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given the credentials service returns no resource', () => {
    beforeEach(() => appService.getcall.mockReturnValue(credentials()));

    it('When placesApiKey is called THEN it resolves null, and the next call asks again', async () => {
      await expect(store.placesApiKey()).resolves.toBeNull();
      await store.placesApiKey();
      expect(appService.getcall).toHaveBeenCalledTimes(2);
    });
  });

  describe('Given geocoding runs after the Places key was fetched', () => {
    const place: Place = { pincode: '500082', city: 'Hyderabad', state: 'Telangana', label: 'I.M. Colony', latitude: null, longitude: null };

    it('When coordinatesOf is called THEN it still asks for google_maps_key', async () => {
      appService.getcall.mockReturnValueOnce(credentials('cipher')).mockReturnValueOnce(credentials());
      await store.placesApiKey();
      await expect(store.coordinatesOf(place)).resolves.toBeNull();
      expect(appService.getcall).toHaveBeenLastCalledWith(
        'third_party_app_credentials',
        'system-management',
        expect.stringContaining('key:google_maps_key'),
      );
    });
  });
});
