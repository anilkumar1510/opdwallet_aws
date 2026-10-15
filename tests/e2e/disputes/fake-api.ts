import { expect, Page } from '@playwright/test';

/**
 * A FAKE of the real dispute API, shared by the grievance browser tests.
 *
 * It behaves like the real backend, as observed: `GET_PAGE` lists the member's
 * disputes, `GET_DISPUTE_MESSAGES` pages a thread (20 a page), `submit` stores
 * the reason, `final_reason` and `documents`, `userReply` takes its text in
 * `args` (name:value, so a comma or colon is rejected) and refuses the same
 * action twice within 3 seconds, and the claims listing pages 20 at a time.
 */

export const DAY = 24 * 60 * 60 * 1000;
export const GUARD_MS = 3000;

export function claimRow(n: number, status: string, label: string, final = false) {
  return {
    claim_id: `OPD-2026-${String(354 - n).padStart(5, '0')}`,
    category: 'Diagnostics',
    provider: 'Sample Lab',
    treatment_date: Date.now() - (n + 1) * DAY,
    original_bill_amount: 1500,
    claim_status: status,
    status: { label, tone: 'neutral', isFinal: final },
  };
}

export const CLAIMS = [
  claimRow(0, 'REJECTED', 'Rejected', true),
  claimRow(1, 'DOCUMENTS_REQUIRED', 'Documents needed'),
  claimRow(2, 'UNDER_REVIEW', 'Under review'),
  claimRow(3, 'UNDER_REVIEW', 'Under review'),
  claimRow(4, 'UNDER_REVIEW', 'Under review'),
  claimRow(5, 'UNDER_REVIEW', 'Under review'),
];

export interface Dispute {
  id: string;
  name: string;
  claim_id: string;
  selected_reason: string;
  dispute_status: string;
  g_creation_time: number;
  g_modify_time: number;
  final_reason?: string;
  documents?: object[];
}
export interface Message {
  id: string;
  dispute_id: string;
  sender_type: 'MEMBER' | 'SUPPORT_EXECUTIVE';
  sender_name: string;
  message_text: string;
  timestamp: number;
}

export class FakeApi {
  disputes: Dispute[] = [];
  messages: Message[] = [];
  submits: Record<string, unknown>[] = [];
  submitHeaders: Record<string, string>[] = [];
  replies: { name: string; text: string }[] = [];
  uploads = 0;
  claims: object[] = CLAIMS;
  failSubmit: 'errCode' | 500 | null = null;
  failReply: string | null = null;
  failList = false;
  /** Reject this many replies (with the 3 s guard message) before accepting. */
  rejectReplies = 0;
  rejectReplyMessage = 'You have clicked multiple times for the same action, please wait for 3 seconds.';
  failMessages = false;
  uploadReply: object | null = null;
  claimPageRequests: number[] = [];
  /** Fail the next request for this page of the claims listing (once). */
  failClaimsPage: number | null = null;
  dmsFetch: 'ok' | 'fail' = 'ok';
  dmsFetches: string[] = [];
  submitDelayMs = 0;
  private lastReplyAt = 0;
  private seq = 0;

  seed(d: Partial<Dispute> & { claim_id: string }, msgs: Array<Pick<Message, 'sender_type' | 'message_text'> & { at?: number }> = []): Dispute {
    const n = ++this.seq;
    const dispute: Dispute = {
      id: `uuid-${n}`,
      name: `DIS-2026-${String(390 + n).padStart(5, '0')}`,
      selected_reason: 'Claim rejected incorrectly',
      dispute_status: 'OPEN',
      g_creation_time: Date.now() - 3600_000,
      g_modify_time: Date.now() - 3600_000,
      ...d,
    };
    this.disputes.push(dispute);
    msgs.forEach((m, i) => this.addMessage(dispute.id, m.sender_type, m.message_text, m.at ?? Date.now() - 3000_000 + i * 1000));
    return dispute;
  }

  addMessage(disputeId: string, type: Message['sender_type'], text: string, at = Date.now()): void {
    this.messages.push({
      id: `m-${this.messages.length + 1}`,
      dispute_id: disputeId,
      sender_type: type,
      sender_name: type === 'MEMBER' ? 'member-user-id' : 'Support Executive',
      message_text: text,
      timestamp: at,
    });
  }

  /** Support answers: what the CRM does through the backend. */
  supportReplies(name: string, text: string, status = 'Awaiting user response'): void {
    const d = this.disputes.find((x) => x.name === name)!;
    this.addMessage(d.id, 'SUPPORT_EXECUTIVE', text);
    d.dispute_status = status;
  }
}

export const json = (body: object) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

export async function mockBackend(page: Page, api = new FakeApi()): Promise<FakeApi> {
  await page.route(/\/(habit-opd|account-management|system-management|master-management)\/api\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const q = url.searchParams;
    const isDispute = url.pathname.endsWith('/habit-opd/api/v1/dispute');

    if (isDispute && req.method() === 'GET') {
      const pageNo = Number(q.get('page_no') ?? 0);
      const size = Number(q.get('page_size') ?? 20);
      const slice = <T>(rows: T[]) => rows.slice(pageNo * size, pageNo * size + size);
      if (q.get('queryId') === 'GET_PAGE') {
        if (api.failList) return route.fulfill(json({ errCode: -1, message: 'Invalid Session' }));
        return route.fulfill(json({ errCode: 0, resource: slice([...api.disputes].reverse()) }));
      }
      if (q.get('queryId') === 'GET_DISPUTE_MESSAGES') {
        if (api.failMessages) return route.fulfill(json({ errCode: -1, message: 'Invalid Query' }));
        const id = (q.get('args') ?? '').replace('dispute_id:', '');
        return route.fulfill(json({ errCode: 0, resource: slice(api.messages.filter((m) => m.dispute_id === id)) }));
      }
    }

    if (isDispute && req.method() === 'POST') {
      const form = new URLSearchParams(req.postData() ?? '');
      const encoded = form.get('resource') ?? '';
      const payload = JSON.parse(decodeURIComponent(escape(Buffer.from(encoded, 'base64').toString('binary'))));
      const action = form.get('action');

      if (action === 'submit') {
        api.submits.push(payload);
        api.submitHeaders.push(req.headers());
        if (api.submitDelayMs) await new Promise((r) => setTimeout(r, api.submitDelayMs));
        if (api.failSubmit === 500) return route.fulfill({ status: 500, body: 'boom' });
        if (api.failSubmit === 'errCode') return route.fulfill(json({ errCode: -1, message: 'Claim not found' }));
        const d = api.seed({ claim_id: payload.claim_id, selected_reason: payload.selected_reason, dispute_status: 'OPEN', g_creation_time: Date.now(), final_reason: payload.final_reason, documents: payload.documents });
        return route.fulfill(json({ errCode: 0, resource: [{ id: d.id, name: d.name, ticket_id: d.name }] }));
      }

      if (action === 'userReply') {
        const args = form.get('args') ?? '';
        const value = args.replace(/^messageText:/, '');
        if (/[,:]/.test(value)) return route.fulfill(json({ errCode: -1, message: 'args can  have only values of format name:value' }));
        if (Date.now() - api['lastReplyAt'] < GUARD_MS) {
          return route.fulfill(json({ errCode: -1, message: 'You have clicked multiple times for the same action, please wait for 3 seconds.' }));
        }
        if (api.rejectReplies > 0) { api.rejectReplies -= 1; return route.fulfill(json({ errCode: -1, message: api.rejectReplyMessage })); }
        if (api.failReply) return route.fulfill(json({ errCode: -1, message: api.failReply }));
        api['lastReplyAt'] = Date.now();
        const d = api.disputes.find((x) => x.id === payload.id)!;
        api.replies.push({ name: payload.name, text: value });
        api.addMessage(d.id, 'MEMBER', value);
        d.dispute_status = 'Awaiting executive response';
        return route.fulfill(json({ errCode: 0, resource: [{ id: d.id, resourceType: 'Dispute', name: d.name }] }));
      }
    }

    if (q.get('queryId') === 'GET_CLAIMS_BY_USER') {
      const pageNo = Number(q.get('page_no') ?? 0);
      const size = Number(q.get('page_size') ?? 20);
      api.claimPageRequests.push(pageNo);
      if (api.failClaimsPage === pageNo) { api.failClaimsPage = null; return route.fulfill(json({ errCode: -1, message: 'boom' })); }
      return route.fulfill(json({ errCode: 0, resource: api.claims.slice(pageNo * size, pageNo * size + size) }));
    }
    if ((q.get('queryId') ?? '').includes('valueset')) return route.fulfill(json({ errCode: 0, resource: [] }));
    return route.fulfill(json({ errCode: -1, message: 'not mocked' }));
  });

  await page.route('**/dms/api/v1/emrImage/image-response-entity**', async (route) => {
    api.dmsFetches.push(decodeURIComponent(new URL(route.request().url()).searchParams.get('args') ?? ''));
    if (api.dmsFetch === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: '{"status":500,"message":null}' });
    return route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4 fake document' });
  });
  await page.route('**/dms/api/v1/emrImage', async (route) => {
    api.uploads += 1;
    await route.fulfill(json(api.uploadReply ?? { errCode: 0, resource: [{ document_id: `doc-${api.uploads}`, file_name: 'bill.pdf' }] }));
  });
  return api;
}

export const claimsSection = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Claims that need your help' }) });
export const servicesSection = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Services you have used' }) });
export const claimRowOf = (page: Page, id: string) => claimsSection(page).locator('li', { hasText: id });

export async function openSupport(page: Page, api?: FakeApi): Promise<FakeApi> {
  const fake = await mockBackend(page, api);
  await page.goto('/member/helpline');
  await expect(claimsSection(page).getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
  return fake;
}

/** Raise a grievance on the newest claim. */
export async function raise(page: Page, reason = 'Claim rejected incorrectly', detail = '') {
  await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
  await page.selectOption('#g-reason', reason);
  if (detail) await page.fill('#g-detail', detail);
  await page.getByRole('button', { name: /Send to support/ }).click();
}

