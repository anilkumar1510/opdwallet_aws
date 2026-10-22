import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppService } from '../http/api.service';
import { AppError, appError } from '../http/app-error';
import { UserInfoStore } from '../session/userinfo.store';

/** Reports per page of AHC_REPORT_RETRIEVAL. */
export const REPORTS_PAGE_SIZE = 10;

/** One diagnostic report row of AHC_REPORT_RETRIEVAL. */
export interface DiagnosticReport {
  id: string;
  title: string;
  providerName: string;
  reportedAt: Date | null;
  /** Fetched from dms to show the report; null when the row has none. */
  documentId: string | null;
  raw: any;
}

/** The selected report's file, ready for the viewer. */
export interface ReportDocument {
  /** Object URL of the file; revoked when another report is opened. */
  url: string;
  kind: 'pdf' | 'image';
  fileName: string;
}

const text = (value: unknown): string => (value === undefined || value === null ? '' : String(value).trim());

/** First non-empty of `keys` on `row`. */
function pick(row: any, ...keys: string[]): string {
  for (const key of keys) {
    const value = text(row?.[key]);
    if (value) return value;
  }
  return '';
}

/** Epoch ms (number or digits) or a date string. */
function toDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = /^\d+$/.test(raw) ? new Date(Number(raw)) : new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Field names other than `uploadedDocumentId` are best guesses at an
 * AHC_REPORT_RETRIEVAL row — confirm against a live response and trim.
 */
function toReport(row: any, index: number): DiagnosticReport {
  const d = row?.data ?? row ?? {};
  return {
    id: pick(row, 'id') || pick(d, 'id', '_id', 'uploadedDocumentId') || 'report-' + index,
    title: pick(d, 'serviceItemName', 'service_item_name', 'test_name', 'testName', 'report_name', 'reportName', 'serviceName') || 'Diagnostic report',
    providerName: pick(d, 'provider_name', 'providerName', 'center_name', 'lab_name'),
    reportedAt: toDate(
      d.report_date ?? d.reportDate ?? d.uploaded_date ?? d.uploadedDate ?? d.serviceStartTime ?? d.serviceDate ?? d.created_at ?? d.createdAt,
    ),
    documentId: pick(d, 'uploadedDocumentId') || null,
    raw: d,
  };
}

/** Recognises a PDF, PNG, JPEG or WebP by its first bytes, for bodies sent as octet-stream. */
async function sniff(blob: Blob): Promise<'pdf' | 'image' | null> {
  if (blob.type === 'application/pdf') return 'pdf';
  if (blob.type.startsWith('image/')) return 'image';
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const ascii = String.fromCharCode(...head);
  if (ascii.startsWith('%PDF')) return 'pdf';
  if (head[0] === 0x89 && ascii.slice(1, 4) === 'PNG') return 'image';
  if (head[0] === 0xff && head[1] === 0xd8) return 'image';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image';
  return null;
}

/**
 * Diagnostic reports for Health Records: the paged AHC_REPORT_RETRIEVAL list,
 * and the selected report's file from dms `emrImage/image-response-entity`.
 */
@Injectable({ providedIn: 'root' })
export class DiagnosticReportsStore {
  private readonly api = inject(AppService);
  private readonly userStore = inject(UserInfoStore);

  private readonly _reports = signal<DiagnosticReport[]>([]);
  private readonly _page = signal(0);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _document = signal<ReportDocument | null>(null);
  private readonly _documentLoading = signal(false);
  private readonly _documentError = signal<string | null>(null);
  private listSeq = 0;
  private documentSeq = 0;

  readonly reports = this._reports.asReadonly();
  /** Zero-based. */
  readonly page = this._page.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly document = this._document.asReadonly();
  readonly documentLoading = this._documentLoading.asReadonly();
  readonly documentError = this._documentError.asReadonly();
  readonly selected = computed(() => this._reports().find((r) => r.id === this._selectedId()) ?? null);
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this._total() / REPORTS_PAGE_SIZE)));

  /** Loads a page and opens its first report. */
  async load(page = 0): Promise<void> {
    const uhid = this.userStore.userInfo()?.[0]?.user_roles?.[0]?.uhid;
    const seq = ++this.listSeq;
    this._loading.set(true);
    this._error.set(null);
    if (!uhid) {
      this._reports.set([]);
      this._total.set(0);
      this._loading.set(false);
      this.clearDocument();
      return;
    }
    try {
      const applicationName = 'habit-opd';
      const query =
        'queryId=AHC_REPORT_RETRIEVAL' +
        '&args=uhId:' + uhid + ',mode_of_appointment:opd_network'+
        '&cread_scope_level=account' +
        '&page_no=' + page +
        '&page_size=' + REPORTS_PAGE_SIZE +
        '&filter=' +
        '&application=' + applicationName;
      const response = await firstValueFrom(this.api.getcall('opd_ahc_booking', applicationName, query));
      if (seq !== this.listSeq) return;
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      const rows: any[] = Array.isArray(parsed?.resource) ? parsed.resource : [];
      const reports = rows.map(toReport);
      // `count` is taken as the total across pages when it is larger than this
      // page. When it is not, a full page means there may be another one.
      const count = Number(parsed?.count ?? parsed?.total ?? parsed?.totalCount);
      const seen = page * REPORTS_PAGE_SIZE + reports.length;
      const total = Number.isFinite(count) && count > seen ? count : seen + (reports.length === REPORTS_PAGE_SIZE ? 1 : 0);
      this._reports.set(reports);
      this._page.set(page);
      this._total.set(total);
      if (reports.length) void this.select(reports[0]);
      else this.clearDocument();
    } catch {
      if (seq !== this.listSeq) return;
      this._reports.set([]);
      this._error.set(appError('server', 'We could not load your diagnostic reports. Please try again.'));
      this.clearDocument();
    } finally {
      if (seq === this.listSeq) this._loading.set(false);
    }
  }

  goToPage(page: number): void {
    const last = this.pageCount() - 1;
    const next = Math.min(Math.max(0, page), last);
    if (next !== this._page() || !this._reports().length) void this.load(next);
  }

  /** Highlights the report and loads its file into the viewer. */
  async select(report: DiagnosticReport): Promise<void> {
    if (this._selectedId() === report.id && (this._document() || this._documentLoading())) return;
    const seq = ++this.documentSeq;
    this._selectedId.set(report.id);
    this.revoke();
    this._documentError.set(null);
    if (!report.documentId) {
      this._documentLoading.set(false);
      this._documentError.set('This report has no document attached yet.');
      return;
    }
    this._documentLoading.set(true);
    try {
      const blob = await firstValueFrom(
        this.api.getBlob('emrImage/image-response-entity', 'dms', 'args=id:' + report.documentId + '&application=dms'),
      );
      if (seq !== this.documentSeq) return;
      const kind = await sniff(blob);
      if (seq !== this.documentSeq) return;
      if (!kind || !blob.size) {
        this._documentError.set('This report cannot be shown here.');
        return;
      }
      // An octet-stream body is re-typed so the browser renders it instead of downloading it.
      const type = kind === 'pdf' ? 'application/pdf' : blob.type.startsWith('image/') ? blob.type : 'image/png';
      const typed = blob.type === type ? blob : new Blob([blob], { type });
      this._document.set({
        url: URL.createObjectURL(typed),
        kind,
        fileName: (report.title || 'report').replace(/[^\w.-]+/g, '-') + (kind === 'pdf' ? '.pdf' : ''),
      });
    } catch {
      if (seq === this.documentSeq) this._documentError.set('We could not load this report. Please try again.');
    } finally {
      if (seq === this.documentSeq) this._documentLoading.set(false);
    }
  }

  /** Loads the selected report's file again after an error. */
  retryDocument(): void {
    const report = this.selected();
    if (!report) return;
    this._selectedId.set(null);
    void this.select(report);
  }

  private clearDocument(): void {
    this.documentSeq++;
    this._selectedId.set(null);
    this.revoke();
    this._documentLoading.set(false);
    this._documentError.set(null);
  }

  private revoke(): void {
    const current = this._document();
    if (current) URL.revokeObjectURL(current.url);
    this._document.set(null);
  }
}
