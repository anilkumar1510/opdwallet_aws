import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FamilyStore } from '../family/family.store';
import { AppService } from '../http/api.service';
import { SessionStore } from '../session/session.store';

/** habit-opd dispute endpoint; the dev proxy and `apiBaseUrl` decide the host. */
export const DISPUTE_API = {
  resource: 'dispute',
  application: 'habit-opd',
  submit: 'submit',
} as const;

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
  readonly dispute_type: 'GENERAL';
  readonly benefit_category: string;
  readonly selected_reason: string;
  readonly dispute_status: 'OPEN';
  /** What the member typed in "Tell us more". */
  readonly description?: string;
  /** DMS ids of the optional supporting documents. */
  readonly document_ids?: readonly string[];
}

export interface DisputeInput {
  readonly claimId: string;
  /** The claim's category as shown to the member, e.g. "Diagnostics". */
  readonly categoryLabel: string;
  readonly reason: string;
  readonly detail: string;
  readonly documentIds: readonly string[];
}

export type SubmitResult =
  | { readonly ok: true; readonly ticketId: string | null }
  | { readonly ok: false; readonly message: string };

export type UploadResult =
  | { readonly ok: true; readonly documentId: string; readonly name: string }
  | { readonly ok: false; readonly message: string };

/** Same encoding as `new-claim-page.ts`: UTF-8 safe base64 of the JSON. */
export function encodeResource(payload: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
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
      dispute_type: 'GENERAL',
      benefit_category: benefitCategoryOf(input.categoryLabel),
      selected_reason: input.reason,
      dispute_status: 'OPEN',
      ...(description ? { description } : {}),
      ...(input.documentIds.length ? { document_ids: input.documentIds } : {}),
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
      const body = `resource=${encoded}&application=${application}&action=${submit}`;
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
      const id = row?.['ticket_id'] ?? row?.['dispute_id'] ?? row?.['name'];
      return { ok: true, ticketId: typeof id === 'string' ? id : null };
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      return { ok: false, message: 'We could not send your request. Please try again.' };
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
