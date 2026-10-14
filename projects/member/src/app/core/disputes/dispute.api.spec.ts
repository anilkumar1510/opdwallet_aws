import { HttpClient, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FamilyStore } from '../family/family.store';
import { AppService } from '../http/api.service';
import { SessionStore } from '../session/session.store';
import { DisputeApi, MAX_DOCUMENT_BYTES, benefitCategoryOf, encodeResource } from './dispute.api';

const holder = { fullName: 'Priya Sample', relationship: 'SELF', isPrimary: true };
const patient = { fullName: 'Aarav Sample', relationship: 'child', isPrimary: false };

const decode = (body: string) => {
  const encoded = body.split('&')[0].replace('resource=', '');
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
};

describe('DisputeApi', () => {
  let api: DisputeApi;
  let activeMember: () => unknown;
  let post: ReturnType<typeof vi.fn>;
  let addXsrfToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    post = vi.fn();
    activeMember = () => patient;
    addXsrfToken = vi.fn().mockReturnValue({ headers: {}, responseType: 'text', observe: 'response' });
    TestBed.configureTestingModule({
      providers: [
        DisputeApi,
        { provide: HttpClient, useValue: { post } },
        {
          provide: AppService,
          useValue: { addXsrfToken, getXsrfToken: () => 'sig', getUserTimezone: () => 'Asia/Kolkata', getCurrentTime: () => '1' },
        },
        { provide: FamilyStore, useValue: { activeMember: () => activeMember(), family: () => (activeMember() ? [holder, patient] : []) } },
        { provide: SessionStore, useValue: { member: () => ({ fullName: 'Session Sample', relationship: 'SELF', isPrimary: true }) } },
      ],
    });
    api = TestBed.inject(DisputeApi);
  });

  const text = (body: object, status = 200) => of(new HttpResponse({ body: JSON.stringify(body), status }));
  const input = { claimId: 'OPD-2026-00354', categoryLabel: 'Diagnostics', reason: 'Claim rejected incorrectly', detail: '', documentIds: [] as string[] };

  it('posts to habit-opd/api/v1/dispute with resource, application and action=submit', async () => {
    post.mockReturnValue(text({ errCode: 0, resource: [{ ticket_id: 'GR-CLM-2026-00042' }] }));
    const result = await api.submit(input);

    expect(result).toEqual({ ok: true, ticketId: 'GR-CLM-2026-00042' });
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/habit-opd/api/v1/dispute');
    expect(body).toMatch(/^resource=.+&application=habit-opd&action=submit$/);
    const encoded = body.split('&')[0].replace('resource=', '');
    expect(addXsrfToken).toHaveBeenCalledWith(`${encoded}&action=submit`, true);
  });

  it('sends the claim, members and reason in the encoded resource', async () => {
    post.mockReturnValue(text({ errCode: 0 }));
    await api.submit(input);
    expect(decode(post.mock.calls[0][1])).toEqual({
      claim_id: 'OPD-2026-00354',
      member_name: 'Priya Sample',
      patient_name: 'Aarav Sample',
      relation_to_member: 'CHILD',
      category: 'CLAIM',
      dispute_type: 'GENERAL',
      benefit_category: 'DIAGNOSTICS',
      selected_reason: 'Claim rejected incorrectly',
      dispute_status: 'OPEN',
    });
  });

  it('falls back to the signed-in member when the family list has not loaded', async () => {
    activeMember = () => null;
    post.mockReturnValue(text({ errCode: 0 }));
    await api.submit(input);
    expect(decode(post.mock.calls[0][1])).toMatchObject({ member_name: 'Session Sample', patient_name: 'Session Sample', relation_to_member: 'SELF' });
  });

  it('adds description and document ids only when present', async () => {
    post.mockReturnValue(text({ errCode: 0 }));
    await api.submit({ ...input, detail: '  Amount is wrong  ', documentIds: ['d1', 'd2'] });
    expect(decode(post.mock.calls[0][1])).toMatchObject({ description: 'Amount is wrong', document_ids: ['d1', 'd2'] });
  });

  it('treats HTTP 200 with errCode -1 as a failure and surfaces the message', async () => {
    post.mockReturnValue(text({ errCode: -1, message: 'Claim not found' }));
    expect(await api.submit(input)).toEqual({ ok: false, message: 'Claim not found' });
  });

  it('returns a friendly failure on network errors instead of throwing', async () => {
    post.mockReturnValue(throwError(() => new Error('offline')));
    const result = await api.submit(input);
    expect(result.ok).toBe(false);
  });

  it('keeps the ticket id null when the API does not return one', async () => {
    post.mockReturnValue(text({ errCode: 0, resource: [{}] }));
    expect(await api.submit(input)).toEqual({ ok: true, ticketId: null });
  });

  describe('uploadDocument', () => {
    const file = (size = 10) => new File([new Uint8Array(size)], 'bill.pdf', { type: 'application/pdf' });

    it('uploads to DMS and returns the document id', async () => {
      post.mockReturnValue(of(new HttpResponse({ body: { errCode: 0, resource: [{ document_id: 'doc-9', file_name: 'bill.pdf' }] } })));
      expect(await api.uploadDocument(file())).toEqual({ ok: true, documentId: 'doc-9', name: 'bill.pdf' });
      const [url, form, options] = post.mock.calls[0];
      expect(url).toBe('/dms/api/v1/emrImage');
      expect((form as FormData).get('action')).toBe('add');
      expect(options.headers.get('X-XSRF-TOKEN')).toBe('sig');
    });

    it('rejects a file over 5 MB without calling DMS', async () => {
      const result = await api.uploadDocument(file(MAX_DOCUMENT_BYTES + 1));
      expect(result).toMatchObject({ ok: false });
      expect(post).not.toHaveBeenCalled();
    });

    it('reports a DMS error', async () => {
      post.mockReturnValue(of(new HttpResponse({ body: { errCode: -1, message: 'Unsupported file' } })));
      expect(await api.uploadDocument(file())).toEqual({ ok: false, message: 'Unsupported file' });
    });
  });
});

describe('helpers', () => {
  it('derives benefit_category from the claim category label', () => {
    expect(benefitCategoryOf('Diagnostics')).toBe('DIAGNOSTICS');
    expect(benefitCategoryOf('In-Clinic Consultation')).toBe('IN_CLINIC_CONSULTATION');
    expect(benefitCategoryOf(' Radiology & Cardiology ')).toBe('RADIOLOGY_CARDIOLOGY');
  });

  it('round-trips unicode through the base64 encoding used by the claim submit', () => {
    const payload = { selected_reason: 'Amount ₹1,500 is wrong' };
    expect(JSON.parse(decodeURIComponent(escape(atob(encodeResource(payload)))))).toEqual(payload);
  });
});
