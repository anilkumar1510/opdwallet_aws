import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClaimsStore } from './claims.store';
import { AppService } from '../../core/http/api.service';

describe('ClaimsStore — category label mapping', () => {
  let store: ClaimsStore;
  let appService: { getcall: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    appService = { getcall: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        ClaimsStore,
        { provide: AppService, useValue: appService },
        { provide: HttpClient, useValue: {} },
      ],
    });
    store = TestBed.inject(ClaimsStore);
  });

  describe('Given the claim_category valueset returns mapped entries', () => {
    beforeEach(async () => {
      appService.getcall.mockReturnValue(
        of(JSON.stringify({ resource: [
          { code: 'CAT001', display: 'In-Clinic Consultation' },
          { code: 'CAT002', display: 'Pharmacy' },
          { code: 'CAT003', display: 'Radiology & Cardiology' },
        ] }))
      );
      await store.loadCategoryLabels();
    });

    it('When getCategoryDisplay is called with a known code THEN it returns the valueset display name', () => {
      expect(store.getCategoryDisplay('CAT001')).toBe('In-Clinic Consultation');
      expect(store.getCategoryDisplay('CAT002')).toBe('Pharmacy');
      expect(store.getCategoryDisplay('CAT003')).toBe('Radiology & Cardiology');
    });

    it('When getCategoryDisplay is called with an unknown code THEN it falls back to the raw code', () => {
      expect(store.getCategoryDisplay('UNKNOWN_CODE')).toBe('UNKNOWN_CODE');
      expect(store.getCategoryDisplay('CAT999')).toBe('CAT999');
    });

    it('When getCategoryDisplay is called with undefined or empty THEN it returns empty string', () => {
      expect(store.getCategoryDisplay(undefined)).toBe('');
      expect(store.getCategoryDisplay('')).toBe('');
    });
  });

  describe('Given the claim_category valueset returns no entries', () => {
    beforeEach(async () => {
      appService.getcall.mockReturnValue(of(JSON.stringify({ resource: [] })));
      await store.loadCategoryLabels();
    });

    it('When getCategoryDisplay is called THEN it falls back to the raw code', () => {
      expect(store.getCategoryDisplay('CAT001')).toBe('CAT001');
      expect(store.getCategoryDisplay('ANY_CODE')).toBe('ANY_CODE');
    });
  });

  describe('Given the claim_category valueset request fails', () => {
    beforeEach(async () => {
      appService.getcall.mockReturnValue(throwError(() => new Error('Network error')));
      await store.loadCategoryLabels();
    });

    it('When getCategoryDisplay is called THEN it falls back to the raw code', () => {
      expect(store.getCategoryDisplay('CAT001')).toBe('CAT001');
      expect(store.getCategoryDisplay('ANY_CODE')).toBe('ANY_CODE');
    });
  });
});