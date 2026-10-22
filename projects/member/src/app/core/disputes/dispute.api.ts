import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FamilyStore } from '../family/family.store';
import { AppService } from '../http/api.service';
import { SessionStore } from '../session/session.store';

/** habit-opd dispute endpoint; the dev proxy and `apiBaseUrl` decide the host. */
export const DISPUTE_API = {
  resource: 'opd_dispute',
  application: 'habit-opd',
  submit: 'submit',
  /** Replies live on the chat resource (the dispute resource no longer takes `userReply`). */
  chatResource: 'opd_dispute_chat',
} as const;

/** DMS endpoint that returns a stored file by id. */
export const DMS_FETCH_URL = '/dms/api/v1/emrImage/image-response-entity';

/** DMS endpoint the claim flow already uses for uploads. */
export const DMS_UPLOAD_URL = '/dms/api/v1/emrImage';

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

/** The JSON that goes inside the base64 `resource` field. */
export interface DisputeSubmitPayload {
  readonly claim_id: string;
  readonly member_name: string;
  readonly patient_name: string;
  readonly relation_to_member: string;
  readonly category: 'CLAIM';
  readonly benefit_category: string;
  readonly selected_reason: string;
  readonly dispute_status: 'OPEN';
  /**
   * What the member typed in "Tell us more", sent as `description` (the backend
   * passes it to the support system). `final_reason` is not sent: it is the
   * support executive's resolution and stays blank until a ticket is closed.
   * Tickets raised before 21 Oct 2026 still carry the member's words there.
   */
  readonly description?: string;
  /** The optional supporting documents, as the dispute API stores them. */
  readonly documents?: readonly DisputeDocument[];
}

/** One supporting document on a dispute (uploaded to DMS first). */
export interface DisputeDocument {
  readonly name: string;
  readonly document_id: string;
  readonly document_type: 'INVOICE' | 'PRESCRIPTION' | 'REPORT' | 'OTHER';
  readonly originalname: string;
  readonly verification_status: 'PENDING';
  readonly filetype: string;
  readonly filesize: string;
}

/** A DMS upload result and its file, as a dispute document. */
export function toDisputeDocument(file: File, documentId: string, uploadedName: string): DisputeDocument {
  return {
    name: uploadedName || file.name,
    document_id: documentId,
    document_type: 'OTHER',
    originalname: file.name,
    verification_status: 'PENDING',
    filetype: file.type,
    filesize: String(file.size),
  };
}

export interface DisputeInput {
  readonly claimId: string;
  /** The claim's category as shown to the member, e.g. "Diagnostics". */
  readonly categoryLabel: string;
  /** The claim's own category code (AHC, LABS, PHARMACY, …) when known; sent as `benefit_category`. */
  readonly categoryCode?: string | null;
  readonly reason: string;
  readonly detail: string;
  readonly documents: readonly DisputeDocument[];
}

export type SubmitResult =
  | { readonly ok: true; readonly ticketId: string | null; readonly disputeId: string | null }
  | { readonly ok: false; readonly message: string };

/** A grievance as the backend stores it (`GET_PAGE` on the dispute resource). */
export interface DisputeRecord {
  /** Business id shown to the member, e.g. DIS-2026-00390. */
  readonly name: string;
  /** Record uuid, needed for messages and replies. */
  readonly id: string;
  readonly claimId: string;
  readonly reason: string;
  /** Display text from the backend, e.g. "Awaiting executive response". */
  readonly status: string;
  readonly createdAt: Date;
  readonly modifiedAt: Date;
  readonly finalReason: string | null;
  readonly lastMessageSender: string | null;
  /** Documents the member attached when raising it. */
  readonly documents: readonly { readonly documentId: string; readonly name: string }[];
}

export interface DisputeMessage {
  readonly id: string;
  readonly sender: 'MEMBER' | 'SUPPORT';
  /** Shown for support; the member's own messages read "You". */
  readonly senderName: string;
  readonly text: string;
  readonly at: Date;
}

export type ListResult<T> =
  | { readonly ok: true; readonly items: readonly T[] }
  | { readonly ok: false; readonly message: string };

export type ReplyResult = { readonly ok: true } | { readonly ok: false; readonly message: string };

export type TicketState = 'awaiting_support' | 'awaiting_member' | 'closed';

/**
 * The member-facing state from the backend's status text. Anything resolved or
 * closed is closed; "awaiting user/member" means support has replied; every
 * other status (new, assigned, awaiting executive) is still with support.
 */
export function ticketStateOf(status: string): TicketState {
  // Display text ("Awaiting user response") and codes (AWAITING_USER_RESPONSE,
  // awaiting-user-response) both reach this: compare on words only.
  const s = status.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  if (/\b(resolved|closed|closure|completed|cancel(l)?ed)\b/.test(s)) return 'closed';
  if (/\bawaiting (user|member|patient|customer)\b/.test(s)) return 'awaiting_member';
  return 'awaiting_support';
}

/** Shown when DMS has no such document (it answers 500 or 404 for an unknown id). */
const GONE = 'This document is no longer available.';

const PAGE_SIZE = 20;
const MAX_PAGES = 25;

export type UploadResult =
  | { readonly ok: true; readonly documentId: string; readonly name: string }
  | { readonly ok: false; readonly message: string };

/** Same encoding as `new-claim-page.ts`: UTF-8 safe base64 of the JSON. */
export function encodeResource(payload: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

/**
 * The backend reads `args` as comma-separated `name:value` pairs, so a comma or a
 * colon in a reply is rejected (or silently cuts the text). Until it supports
 * escaping, the two are swapped for lookalikes: a low-9 quote (U+201A) and the
 * ratio sign (U+2236). Everything else (rupee, quotes, newlines, Hindi, emoji,
 * ampersands) goes through unchanged.
 */
/** Older replies (before the backend read `message_text`) have lookalikes for commas and colons. */
export function toArgSafe(text: string): string {
  return text.replace(/,/g, '\u201A').replace(/:/g, '\u2236');
}

/** "In-Clinic Consultation" becomes IN_CLINIC_CONSULTATION, "Diagnostics" DIAGNOSTICS. */
export function benefitCategoryOf(label: string): string {
  return label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * The portal's side of the grievance API, for reimbursement claims.
 *
 * Only `submit` and the document upload exist on the backend today. Reading
 * tickets and chat history back is a separate API that has not been shared yet.
 */
@Injectable({ providedIn: 'root' })
export class DisputeApi {
  private readonly http = inject(HttpClient);
  private readonly appService = inject(AppService);
  private readonly family = inject(FamilyStore);
  private readonly session = inject(SessionStore);

  buildPayload(input: DisputeInput): DisputeSubmitPayload {
    // The family list can fail to load; the signed-in member is the fallback so a
    // grievance is never sent without a name.
    const patient = this.family.activeMember() ?? this.session.member();
    const holder = this.family.family().find((m) => m.isPrimary) ?? this.session.member() ?? patient;
    const description = input.detail.trim();
    return {
      claim_id: input.claimId,
      member_name: holder?.fullName ?? '',
      patient_name: patient?.fullName ?? '',
      relation_to_member: String(patient?.relationship ?? 'SELF').toUpperCase(),
      category: 'CLAIM',
      benefit_category: input.categoryCode?.trim() || benefitCategoryOf(input.categoryLabel),
      selected_reason: input.reason,
      dispute_status: 'OPEN',
      ...(description ? { description } : {}),
      ...(input.documents.length ? { documents: input.documents } : {}),
    };
  }

  /**
   * Form-urlencoded `resource` + `application` + `action`, signed over
   * `resource&action=…` exactly like the claim submit. The backend answers 200
   * with `errCode: -1` on failure, so the status alone is not enough.
   */
  async submit(input: DisputeInput): Promise<SubmitResult> {
    try {
      const { resource, application, submit } = DISPUTE_API;
      const encoded = encodeResource(this.buildPayload(input));
      const body = `resource=${encodeURIComponent(encoded)}&application=${application}&action=${submit}`;
      const options = this.appService.addXsrfToken(`${encoded}&action=${submit}`, true);
      const response = await firstValueFrom(
        this.http.post(`/${application}/api/v1/${resource}`, body, options),
      );
      let parsed: { errCode?: number; message?: string; resource?: Array<Record<string, unknown>> } = {};
      try {
        parsed = JSON.parse(response.body ?? '{}');
      } catch {
        // A non-JSON 200 with no error marker counts as accepted.
      }
      if (parsed.errCode === -1) {
        return { ok: false, message: parsed.message || 'We could not send your request. Please try again.' };
      }
      const row = parsed.resource?.[0];
      const name = row?.['name'] ?? row?.['ticket_id'];
      const id = row?.['id'] ?? row?.['dispute_id'];
      return {
        ok: true,
        ticketId: typeof name === 'string' ? name : null,
        disputeId: typeof id === 'string' ? id : null,
      };
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      return { ok: false, message: 'We could not send your request. Please try again.' };
    }
  }

  /** Every grievance the signed-in member has raised, newest first. */
  async list(): Promise<ListResult<DisputeRecord>> {
    const rows = await this.pages('queryId=GET_PAGE');
    if (!rows.ok) return rows;
    return {
      ok: true,
      items: rows.items
        .map(toRecord)
        .filter((r): r is DisputeRecord => r !== null)
        // A page can repeat rows if the backend's sort key moves between requests.
        .filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }

  /** The whole thread of one grievance, oldest first (all pages). */
  async messages(disputeId: string): Promise<ListResult<DisputeMessage>> {
    const rows = await this.pages(`queryId=GET_DISPUTE_MESSAGES&args=${encodeURIComponent(`dispute_id:${disputeId}`)}`);
    if (!rows.ok) return rows;
    return {
      ok: true,
      items: rows.items
        .map(toMessage)
        .filter((m): m is DisputeMessage => m !== null)
        .sort((a, b) => a.at.getTime() - b.at.getTime()),
    };
  }

  /**
   * The member's reply: `action=userReply` on the chat resource, the text verbatim
   * in the resource's `message_text` (commas and colons included; the backend no
   * longer reads `args`). The backend flips the ticket back to support.
   */
  reply(dispute: { name: string; id: string }, text: string): Promise<ReplyResult> {
    return this.act(
      DISPUTE_API.chatResource,
      { resourceType: 'DisputeChat', dispute_id: dispute.id, message_text: text },
      'userReply',
      undefined,
      'We could not send your reply. Please try again.',
    );
  }

  /** The member closes their own ticket as resolved: `action=userResolve`, identified by `name` only (no text, no reopen). */
  resolve(dispute: { name: string }): Promise<ReplyResult> {
    return this.act(
      DISPUTE_API.resource,
      { resourceType: 'Dispute', name: dispute.name },
      'userResolve',
      undefined,
      'We could not close the ticket. Please try again.',
    );
  }

  /** One signed `dispute` action on an existing ticket. */
  private async act(
    resource: string,
    payload: Record<string, string>,
    action: string,
    args: string | undefined,
    failure: string,
    retried = false,
  ): Promise<ReplyResult> {
    try {
      const { application } = DISPUTE_API;
      const encoded = encodeResource(payload);
      const body =
        `resource=${encodeURIComponent(encoded)}&application=${application}&action=${action}` +
        (args === undefined ? '' : `&args=${encodeURIComponent(args)}`);
      const options = this.appService.addXsrfToken(`${encoded}&action=${action}`, true);
      const response = await firstValueFrom(
        this.http.post(`/${application}/api/v1/${resource}`, body, options),
      );
      let parsed: { errCode?: number; message?: string } = {};
      try {
        parsed = JSON.parse(response.body ?? '{}');
      } catch {
        // A non-JSON 200 with no error marker counts as accepted.
      }
      if (parsed.errCode === -1) {
        // The backend refuses the same action twice inside 3 seconds: wait it out and send once more.
        if (!retried && /wait for \d+ second/i.test(parsed.message ?? '')) {
          await new Promise((resolve) => setTimeout(resolve, 3_200));
          return this.act(resource, payload, action, args, failure, true);
        }
        return { ok: false, message: parsed.message || failure };
      }
      return { ok: true };
    } catch (error) {
      console.error(`Failed dispute action ${action}:`, error);
      return { ok: false, message: failure };
    }
  }

  /** Reads every page of a dispute query (20 a page) and returns the raw rows. */
  private async pages(query: string): Promise<ListResult<Record<string, any>>> {
    const all: Record<string, any>[] = [];
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const res = await firstValueFrom(
          this.appService.getcall(DISPUTE_API.resource, DISPUTE_API.application, `${query}&page_no=${page}&page_size=${PAGE_SIZE}`),
        );
        const body = JSON.parse(res);
        // An invalid session or query answers {errCode:-1} with no `resource`.
        if (body?.errCode === -1) return { ok: false, message: body.message || 'Could not load your tickets.' };
        const rows: Record<string, any>[] = body?.resource ?? [];
        all.push(...rows);
        if (rows.length < PAGE_SIZE) break;
      }
      return { ok: true, items: all };
    } catch (error) {
      console.error('Failed to read disputes:', error);
      return { ok: false, message: 'Could not load your tickets.' };
    }
  }

  /** Downloads a document stored in DMS (the member's session is the credential). */
  async downloadDocument(documentId: string, fileName: string): Promise<ReplyResult> {
    try {
      const blob = await firstValueFrom(
        this.http.get(`${DMS_FETCH_URL}?args=${encodeURIComponent(`id:${documentId}`)}&application=dms`, { responseType: 'blob' }),
      );
      // An error answers with JSON, not the file.
      if (!blob.size || blob.type.includes('json')) return { ok: false, message: GONE };
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      return { ok: true };
    } catch (error) {
      console.error('Failed to download dispute document:', error);
      // The document service answers HTTP 500 (not 404) for an id it does not have.
      const status = (error as { status?: number })?.status;
      return { ok: false, message: status === 404 || status === 500 ? GONE : 'We could not open that document. Please try again.' };
    }
  }

  /** Uploads one supporting document to DMS and returns its id. */
  async uploadDocument(file: File): Promise<UploadResult> {
    if (file.size > MAX_DOCUMENT_BYTES) {
      return { ok: false, message: `${file.name} is larger than 5 MB.` };
    }
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('fileName', file.name);
      form.append('action', 'add');
      // The claim upload signs the file bytes, so this does the same.
      const signature = this.appService.getXsrfToken(await file.arrayBuffer(), true);
      const response = await firstValueFrom(
        this.http.post<{ errCode?: number; message?: string; resource?: Array<{ document_id?: string; file_name?: string }> }>(
          DMS_UPLOAD_URL,
          form,
          {
            headers: new HttpHeaders()
              .set('X-XSRF-TOKEN', String(signature))
              .set('timezone', this.appService.getUserTimezone())
              .set('current_time', this.appService.getCurrentTime())
              .set('host_name', window.location.host),
            observe: 'response',
          },
        ),
      );
      const row = response.body?.resource?.[0];
      if (response.body?.errCode === 0 && row?.document_id) {
        return { ok: true, documentId: row.document_id, name: row.file_name ?? file.name };
      }
      return { ok: false, message: response.body?.message || `Could not upload ${file.name}.` };
    } catch (error) {
      console.error('Failed to upload dispute document:', error);
      return { ok: false, message: `Could not upload ${file.name}. Please try again.` };
    }
  }
}

function toDate(raw: unknown): Date {
  const n = Number(raw);
  const d = new Date(Number.isNaN(n) ? String(raw) : n);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function toRecord(row: Record<string, any>): DisputeRecord | null {
  const name = row['name'] ?? row['ticket_id'];
  if (!name || !row['id']) return null;
  return {
    name: String(name),
    id: String(row['id']),
    claimId: String(row['claim_id'] ?? ''),
    reason: String(row['selected_reason'] ?? ''),
    status: String(row['dispute_status'] ?? ''),
    createdAt: toDate(row['g_creation_time']),
    modifiedAt: toDate(row['g_modify_time'] ?? row['g_creation_time']),
    finalReason: row['final_reason'] ? String(row['final_reason']) : null,
    lastMessageSender: row['last_message_sender'] ? String(row['last_message_sender']) : null,
    documents: (Array.isArray(row['documents']) ? row['documents'] : [])
      .filter((d: any) => d?.document_id)
      .map((d: any) => ({ documentId: String(d.document_id), name: String(d.originalname || d.name || 'Document') })),
  };
}

function toMessage(row: Record<string, any>): DisputeMessage | null {
  const text = row['message_text'];
  if (typeof text !== 'string' || !text.trim()) return null;
  const member = String(row['sender_type'] ?? '').toUpperCase() === 'MEMBER';
  return {
    id: String(row['id'] ?? `${row['timestamp']}-${text.slice(0, 8)}`),
    sender: member ? 'MEMBER' : 'SUPPORT',
    senderName: member ? 'You' : String(row['sender_name'] || 'Support team'),
    text,
    at: toDate(row['timestamp'] ?? row['g_creation_time']),
  };
}
