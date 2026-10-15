import { HttpClient, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FamilyStore } from '../family/family.store';
import { AppService } from '../http/api.service';
import { SessionStore } from '../session/session.store';
import { DisputeApi, DisputeDocument, MAX_DOCUMENT_BYTES, benefitCategoryOf, encodeResource, ticketStateOf, toArgSafe, toDisputeDocument } from './dispute.api';

const holder = { fullName: 'Priya Sample', relationship: 'SELF', isPrimary: true };
const patient = { fullName: 'Aarav Sample', relationship: 'child', isPrimary: false };

const decode = (body: string) => {
  const encoded = decodeURIComponent(body.split('&')[0].replace('resource=', ''));
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
};

describe('DisputeApi', () => {
  let api: DisputeApi;
  let activeMember: () => unknown;
  let post: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let addXsrfToken: ReturnType<typeof vi.fn>;
  let getcall: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    post = vi.fn();
    get = vi.fn();
    activeMember = () => patient;
    getcall = vi.fn();
    addXsrfToken = vi.fn().mockReturnValue({ headers: {}, responseType: 'text', observe: 'response' });
    TestBed.configureTestingModule({
      providers: [
        DisputeApi,
        { provide: HttpClient, useValue: { post, get } },
        {
          provide: AppService,
          useValue: { addXsrfToken, getcall, getXsrfToken: () => 'sig', getUserTimezone: () => 'Asia/Kolkata', getCurrentTime: () => '1' },
        },
        { provide: FamilyStore, useValue: { activeMember: () => activeMember(), family: () => (activeMember() ? [holder, patient] : []) } },
        { provide: SessionStore, useValue: { member: () => ({ fullName: 'Session Sample', relationship: 'SELF', isPrimary: true }) } },
      ],
    });
    api = TestBed.inject(DisputeApi);
  });

  const text = (body: object, status = 200) => of(new HttpResponse({ body: JSON.stringify(body), status }));
  const input = { claimId: 'OPD-2026-00354', categoryLabel: 'Diagnostics', reason: 'Claim rejected incorrectly', detail: '', documents: [] as DisputeDocument[] };

  it('posts to habit-opd/api/v1/dispute with resource, application and action=submit', async () => {
    post.mockReturnValue(text({ errCode: 0, resource: [{ ticket_id: 'GR-CLM-2026-00042' }] }));
    const result = await api.submit(input);

    expect(result).toEqual({ ok: true, ticketId: 'GR-CLM-2026-00042', disputeId: null });
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/habit-opd/api/v1/dispute');
    expect(body).toMatch(/^resource=.+&application=habit-opd&action=submit$/);
    const encoded = decodeURIComponent(body.split('&')[0].replace('resource=', ''));
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

  it('sends the words as final_reason and description, and documents, only when present', async () => {
    post.mockReturnValue(text({ errCode: 0 }));
    const doc = toDisputeDocument(new File(['x'], 'bill.pdf', { type: 'application/pdf' }), 'doc-1', 'bill.pdf');
    await api.submit({ ...input, detail: '  Amount is wrong  ', documents: [doc] });
    const sent = decode(post.mock.calls[0][1]);
    expect(sent).toMatchObject({ final_reason: 'Amount is wrong', description: 'Amount is wrong', documents: [doc] });
    post.mockClear();
    await api.submit(input);
    expect(decode(post.mock.calls[0][1])).not.toHaveProperty('documents');
    expect(decode(post.mock.calls[0][1])).not.toHaveProperty('description');
    expect(decode(post.mock.calls[0][1])).not.toHaveProperty('final_reason');
  });

  it('describes a document the way the dispute API stores it', () => {
    const file = new File([new Uint8Array(2048)], 'invoice.png', { type: 'image/png' });
    expect(toDisputeDocument(file, 'fe2e5400-46', 'invoice.png')).toEqual({
      name: 'invoice.png',
      document_id: 'fe2e5400-46',
      document_type: 'OTHER',
      originalname: 'invoice.png',
      verification_status: 'PENDING',
      filetype: 'image/png',
      filesize: '2048',
    });
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
    expect(await api.submit(input)).toEqual({ ok: true, ticketId: null, disputeId: null });
  });

  it('returns the ticket name and the record id from the submit response', async () => {
    post.mockReturnValue(text({ errCode: 0, resource: [{ id: 'uuid-1', name: 'DIS-2026-00393', ticket_id: 'DIS-2026-00393' }] }));
    expect(await api.submit(input)).toEqual({ ok: true, ticketId: 'DIS-2026-00393', disputeId: 'uuid-1' });
  });

  it('URL-encodes the base64 resource in the body so + and / survive', async () => {
    post.mockReturnValue(text({ errCode: 0 }));
    await api.submit({ ...input, reason: '>>>???~~~' });
    expect(post.mock.calls[0][1]).not.toMatch(/resource=[^&]*[+/]/);
  });

  describe('list', () => {
    const row = (n: number, over: object = {}) => ({ id: `id-${n}`, name: `DIS-${n}`, claim_id: `OPD-${n}`, selected_reason: 'r', dispute_status: 'OPEN', g_creation_time: 1000 + n, g_modify_time: 2000 + n, ...over });

    it('reads GET_PAGE on the dispute resource and returns newest first', async () => {
      getcall.mockReturnValue(of(JSON.stringify({ errCode: 0, resource: [row(1), row(3), row(2)] })));
      const result = await api.list();
      expect(getcall).toHaveBeenCalledWith('dispute', 'habit-opd', 'queryId=GET_PAGE&page_no=0&page_size=20');
      expect(result.ok && result.items.map((r) => r.name)).toEqual(['DIS-3', 'DIS-2', 'DIS-1']);
    });

    it('reads every page until one is short', async () => {
      const page = (from: number, n: number) => of(JSON.stringify({ errCode: 0, resource: Array.from({ length: n }, (_, i) => row(from + i)) }));
      getcall.mockReturnValueOnce(page(0, 20)).mockReturnValueOnce(page(20, 20)).mockReturnValueOnce(page(40, 5));
      const result = await api.list();
      expect(getcall).toHaveBeenCalledTimes(3);
      expect(result.ok && result.items).toHaveLength(45);
    });

    it('skips rows with no id or name and keeps the rest', async () => {
      getcall.mockReturnValue(of(JSON.stringify({ errCode: 0, resource: [row(1), { name: 'x' }, { id: 'y' }] })));
      const result = await api.list();
      expect(result.ok && result.items).toHaveLength(1);
    });

    it('reports an invalid session or query instead of an empty list', async () => {
      getcall.mockReturnValue(of(JSON.stringify({ errCode: -1, message: 'Invalid Session' })));
      expect(await api.list()).toEqual({ ok: false, message: 'Invalid Session' });
    });

    it('reports a network or parse failure', async () => {
      getcall.mockReturnValue(throwError(() => new Error('offline')));
      expect((await api.list()).ok).toBe(false);
      getcall.mockReturnValue(of('<html>'));
      expect((await api.list()).ok).toBe(false);
    });
  });

  describe('documents on a record', () => {
    it('maps the stored documents, preferring the original file name', async () => {
      getcall.mockReturnValue(of(JSON.stringify({ errCode: 0, resource: [{ id: 'i', name: 'DIS-1', claim_id: 'C', documents: [
        { document_id: 'd1', name: 'stored.pdf', originalname: 'bill.pdf' },
        { document_id: 'd2', name: 'only-name.png' },
        { name: 'no id, dropped' },
      ] }] })));
      const result = await api.list();
      expect(result.ok && result.items[0].documents).toEqual([
        { documentId: 'd1', name: 'bill.pdf' },
        { documentId: 'd2', name: 'only-name.png' },
      ]);
    });

    it('a record without documents has an empty list', async () => {
      getcall.mockReturnValue(of(JSON.stringify({ errCode: 0, resource: [{ id: 'i', name: 'DIS-1', claim_id: 'C' }] })));
      const result = await api.list();
      expect(result.ok && result.items[0].documents).toEqual([]);
    });
  });

  describe('downloadDocument', () => {
    it('asks DMS for the file by id and saves it under its name', async () => {
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      (URL as any).createObjectURL = vi.fn(() => 'blob:x');
      (URL as any).revokeObjectURL = vi.fn();
      get.mockReturnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })));
      expect(await api.downloadDocument('doc-9', 'bill.pdf')).toEqual({ ok: true });
      expect(get.mock.calls[0][0]).toBe('/dms/api/v1/emrImage/image-response-entity?args=id%3Adoc-9&application=dms');
      expect(click).toHaveBeenCalledTimes(1);
      click.mockRestore();
    });

    it('treats an empty or JSON answer, or a network error, as a failure', async () => {
      get
        .mockReturnValueOnce(of(new Blob([], { type: 'application/pdf' })))
        .mockReturnValueOnce(of(new Blob(['{"status":500}'], { type: 'application/json' })))
        .mockReturnValueOnce(throwError(() => new Error('offline')));
      for (let i = 0; i < 3; i++) expect(await api.downloadDocument('x', 'f.pdf')).toMatchObject({ ok: false });
    });
  });

  describe('messages', () => {
    const msg = (n: number, type: string, textValue = `m${n}`) => ({ id: `m${n}`, sender_type: type, sender_name: type === 'MEMBER' ? 'some-user-id' : 'Support Executive', message_text: textValue, timestamp: 1000 + n });

    it('asks for the dispute by id, encoded, and maps the senders', async () => {
      getcall.mockReturnValue(of(JSON.stringify({ errCode: 0, resource: [msg(2, 'SUPPORT_EXECUTIVE'), msg(1, 'MEMBER')] })));
      const result = await api.messages('abc-1');
      expect(getcall).toHaveBeenCalledWith('dispute', 'habit-opd', 'queryId=GET_DISPUTE_MESSAGES&args=dispute_id%3Aabc-1&page_no=0&page_size=20');
      expect(result.ok && result.items.map((m) => [m.sender, m.senderName, m.text])).toEqual([
        ['MEMBER', 'You', 'm1'], // the member's own name is an id in the API: shown as "You"
        ['SUPPORT', 'Support Executive', 'm2'],
      ]);
    });

    it('reads all pages (45 messages over 3 pages)', async () => {
      const page = (from: number, n: number) => of(JSON.stringify({ errCode: 0, resource: Array.from({ length: n }, (_, i) => msg(from + i, 'MEMBER')) }));
      getcall.mockReturnValueOnce(page(0, 20)).mockReturnValueOnce(page(20, 20)).mockReturnValueOnce(page(40, 5));
      const result = await api.messages('abc-1');
      expect(result.ok && result.items).toHaveLength(45);
    });

    it('drops empty messages and sorts oldest first', async () => {
      getcall.mockReturnValue(of(JSON.stringify({ errCode: 0, resource: [msg(3, 'MEMBER'), msg(1, 'MEMBER', '   '), msg(2, 'MEMBER')] })));
      const result = await api.messages('abc-1');
      expect(result.ok && result.items.map((m) => m.text)).toEqual(['m2', 'm3']);
    });
  });

  describe('reply', () => {
    const dispute = { name: 'DIS-2026-00393', id: 'uuid-1' };

    it('posts action=userReply with the record in resource and the text in args', async () => {
      post.mockReturnValue(text({ errCode: 0 }));
      expect(await api.reply(dispute, 'Please review ₹500 & more')).toEqual({ ok: true });
      const [url, body] = post.mock.calls[0];
      expect(url).toBe('/habit-opd/api/v1/dispute');
      expect(body).toMatch(/&application=habit-opd&action=userReply&args=messageText%3A/);
      expect(decode(body)).toEqual({ resourceType: 'Dispute', name: 'DIS-2026-00393', id: 'uuid-1' });
      expect(decodeURIComponent(body.split('&args=')[1])).toBe('messageText:Please review ₹500 & more');
      const encoded = decodeURIComponent(body.split('&')[0].replace('resource=', ''));
      expect(addXsrfToken).toHaveBeenCalledWith(`${encoded}&action=userReply`, true);
    });

    it('swaps commas and colons, which the backend args parser cannot carry', async () => {
      post.mockReturnValue(text({ errCode: 0 }));
      await api.reply(dispute, 'Note: a, b');
      expect(decodeURIComponent(post.mock.calls[0][1].split('&args=')[1])).toBe('messageText:Note\u2236 a\u201A b');
    });

    it('surfaces the backend message on errCode -1', async () => {
      post.mockReturnValue(text({ errCode: -1, message: 'You have clicked multiple times for the same action, please wait for 3 seconds.' }));
      const result = await api.reply(dispute, 'hi');
      expect(result).toMatchObject({ ok: false });
    });

    it('does not throw on a network error', async () => {
      post.mockReturnValue(throwError(() => new Error('offline')));
      expect((await api.reply(dispute, 'hi')).ok).toBe(false);
    });
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

describe('ticketStateOf', () => {
  it.each([
    ['OPEN', 'awaiting_support'],
    ['Assigned', 'awaiting_support'],
    ['Awaiting executive response', 'awaiting_support'],
    ['Awaiting user response', 'awaiting_member'],
    ['AWAITING_MEMBER_RESPONSE', 'awaiting_member'],
    ['AWAITING_USER_RESPONSE', 'awaiting_member'],
    ['AWAITING_EXECUTIVE_RESPONSE', 'awaiting_support'],
    ['OPEN_UNASSIGNED', 'awaiting_support'],
    ['ASSIGNED', 'awaiting_support'],
    ['RESOLVED', 'closed'],
    ['awaiting-user-response', 'awaiting_member'],
    // the backend's own ids and names
    ['OPEN', 'awaiting_support'],
    ['Open', 'awaiting_support'],
    ['Awaiting Executive Response', 'awaiting_support'],
    ['Awaiting User Response', 'awaiting_member'],
    ['Resolved', 'closed'],
    ['Closed', 'closed'],
    ['Resolved', 'closed'],
    ['CLOSED', 'closed'],
    ['', 'awaiting_support'],
  ])('%s is %s', (status, expected) => {
    expect(ticketStateOf(status)).toBe(expected);
  });
});

describe('toArgSafe', () => {
  it('only touches commas and colons', () => {
    expect(toArgSafe('a, b: c')).toBe('a\u201A b\u2236 c');
    expect(toArgSafe('₹500 "q" it\'s & नमस्ते 😊\nline2')).toBe('₹500 "q" it\'s & नमस्ते 😊\nline2');
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
