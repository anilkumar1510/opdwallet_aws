import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { formatMoney, money } from '../domain/money';
import { AppError } from '../http/app-error';
import {
  ClaimCategory,
  ClaimTimelineEntry,
  CreateClaimInput,
  ResubmitDocumentType,
  TpaNote,
  toStatus,
  CLAIMS_API,
  CLAIM_CATEGORY_VALUESET_ARG,
  toClaimCategoryFromValueset,
  ValuesetEntryDto,
} from './claim.mapper';
import { Claim, ClaimsSummary } from './claim.model';
import { STATIC_CLAIMS, STATIC_CLAIM_CATEGORIES, buildClaim, staticHistory } from './static-claims.data';
import { DashboardAggregateDto } from './claim.dto';
import { AppService } from '../../core/http/api.service';

/**
 * Candidate names for the last-updated column on a GET_CLAIMS_BY_USER row,
 * most specific first.
 *
 * `g_modify_time` is the real one — confirmed against the live payload, which
 * carries no `updated_at` of any spelling. It is the platform's own audit
 * column and is the only field that moves when a claim changes after filing
 * (documents resent, status advanced by the TPA); `submitted_at` is fixed at
 * creation, so sorting on that would leave a just-updated claim buried.
 *
 * The rest are kept as fallbacks because the list payload is untyped and other
 * environments have been seen to name this differently. Creation stamps come
 * last so a row with no update stamp still sorts by something meaningful.
 */
const CLAIM_UPDATED_AT_KEYS = [
  'g_modify_time',
  'updated_at',
  'updatedAt',
  'updated_on',
  'last_updated',
  'last_updated_date',
  'modified_at',
  'g_creation_time',
  'created_at',
  'createdAt',
  'submitted_at',
] as const;

/**
 * Epoch millis for a claim row's last update, or 0 when it carries no usable
 * stamp. Dates arrive as epoch millis for columns the API owns (see how
 * `treatment_date` is posted) but as ISO strings elsewhere, so both are handled.
 */
function updatedAtMillis(row: any): number {
  for (const key of CLAIM_UPDATED_AT_KEYS) {
    const raw = row?.[key];
    if (raw === null || raw === undefined || raw === '') continue;
    const numeric = Number(raw);
    const ms = Number.isNaN(numeric) ? Date.parse(String(raw)) : numeric;
    if (!Number.isNaN(ms)) return ms;
  }
  return 0;
}

/**
 * Claims — DUMMY / STATIC, zero backend.
 *
 * This used to call every `member/claims/*` endpoint (list, summary, categories,
 * create, submit, cancel, timeline, tpa-notes, resubmit-documents, file). All of
 * that is removed; the list lives in memory and the actions mutate it. The public
 * surface is unchanged so the pages did not need reworking. See REMOVED-APIS.md.
 */
@Injectable({ providedIn: 'root' })
export class ClaimsStore {
  private readonly http = inject(HttpClient);
  private readonly _claims = signal<readonly Claim[]>([...STATIC_CLAIMS]);
  private readonly _submitting = signal(false);
  private readonly _submitError = signal<string | null>(null);
  private readonly _capNotice = signal<string | null>(null);
  private seq = 20;

  readonly claims = this._claims.asReadonly();
  readonly loading = signal(false).asReadonly();
  readonly error = signal<AppError | null>(null).asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly submitError = this._submitError.asReadonly();
  readonly capNotice = this._capNotice.asReadonly();

  // New: Dashboard aggregate from GET_DASHBOARD_AGGREGATE endpoint
  private readonly _dashboard = signal<DashboardAggregateDto | null>(null);
  private readonly _dashboardLoading = signal(false);

  private readonly _claimList = signal<any | null>(null);
  private readonly _getClimListData = signal(false);
  
  private readonly _claimDetails = signal<any | null>(null);
  private readonly _getClimDetails = signal(false);

  readonly dashboardLoading = this._dashboardLoading.asReadonly();
  /** True while GET_PAGE for a single claim is in flight. */
  readonly claimDetailsLoading = this._getClimDetails.asReadonly();

  constructor(private appService: AppService){

  }
  readonly summary = computed<ClaimsSummary>(() => {
    const all = this._claims();
    const by = (code: string) => all.filter((c) => c.statusCode === code).length;
    return {
      total: all.length,
      approved: by('APPROVED') + by('PARTIALLY_APPROVED') + by('PAID'),
      inProgress: by('SUBMITTED') + by('UNDER_REVIEW') + by('DRAFT') + by('DOCUMENTS_REQUIRED'),
      rejected: by('REJECTED'),
      claimedAmount: money(all.reduce((s, c) => s + c.billAmount.amount, 0)),
      approvedAmount: money(all.reduce((s, c) => s + (c.approvedAmount?.amount ?? 0), 0)),
    };
  });

  /** Dashboard aggregate from the new GET_DASHBOARD_AGGREGATE endpoint */
  readonly dashboardSummary = computed<{
    total: number;
    inProgress: number;
    claimedAmount: ReturnType<typeof money>;
    approvedAmount: ReturnType<typeof money>;
  } | null>(() => {
    const d = this._dashboard();
    if (!d) return null;
    return {
      total: d.total_claims ?? 0,
      inProgress: d.in_progress ?? 0,
      claimedAmount: money(d.claimed_amount ?? 0),
      approvedAmount: money(d.approved_amount ?? 0),
    };
  });
  readonly clailListData = computed<any>(() => {
    const d = this._claimList();
    if (!d) return null;
    return d;
  });
  readonly claimDetails = computed<any>(() => {
    const d = this._claimDetails();
    if (!d) return null;
    return d;
  });

  retry(): void {
    /* static — nothing to refetch */
  }

  async categories(): Promise<readonly ClaimCategory[]> {
    try {
      const res = await this.appService
        .getcall('valueset', 'system-management', CLAIM_CATEGORY_VALUESET_ARG)
        .toPromise();
      const rows: ValuesetEntryDto[] = JSON.parse(res)?.resource ?? [];
      if (!rows.length) return STATIC_CLAIM_CATEGORIES;
      return rows.map((entry) => toClaimCategoryFromValueset(entry));
    } catch (error) {
      console.error('Failed to load claim categories:', error);
      return STATIC_CLAIM_CATEGORIES;
    }
  }

  async claimById(claimId: string): Promise<Claim | null> {
    return this._claims().find((c) => c.id === claimId || c.reference === claimId) ?? null;
  }

  async history(reference: string): Promise<{
    timeline: readonly ClaimTimelineEntry[];
    notes: readonly TpaNote[];
  }> {
    const c = this._claims().find((x) => x.reference === reference);
    return c ? staticHistory(c) : { timeline: [], notes: [] };
  }

  async cancel(reference: string, _reason?: string): Promise<boolean> {
    this._patch(reference, { statusCode: 'CANCELLED', status: toStatus('CANCELLED'), isCancellable: false });
    return true;
  }

  async resubmitDocuments(
    reference: string,
    _files: readonly File[],
    _documentType: ResubmitDocumentType,
    _notes?: string,
  ): Promise<boolean> {
    // Sending documents moves the claim off DOCUMENTS_REQUIRED, back for review.
    this._patch(reference, { statusCode: 'UNDER_REVIEW', status: toStatus('UNDER_REVIEW') });
    return true;
  }

  async submit(input: CreateClaimInput): Promise<string | null> {
    this._submitting.set(true);
    this._submitError.set(null);
    this._capNotice.set(null);
    try {
      const created = buildClaim(input, ++this.seq);
      // Mirror the real API's cap notice when the bill exceeds the per-claim limit.
      const limit = STATIC_CLAIM_CATEGORIES.find((c) => c.claimCategory === input.category)?.perClaimLimit ?? 0;
      if (limit > 0 && input.billAmount > limit) {
        this._capNotice.set(
          `Your bill of ${formatMoney(money(input.billAmount))} was capped to ${formatMoney(money(limit))}, the per-claim limit.`,
        );
      }
      this._claims.set([created, ...this._claims()]);
      return created.id;
    } finally {
      this._submitting.set(false);
    }
  }

  /** Load dashboard aggregate from GET_DASHBOARD_AGGREGATE endpoint */
  async loadDashboard(): Promise<void> {
    this._dashboardLoading.set(true);
    try {
      const response = await this.http.get<{ errCode: number; message: string; count: number; resource: DashboardAggregateDto[] }>(CLAIMS_API.dashboard).toPromise();
      const data = response?.resource?.[0] ?? null;
      this._dashboard.set(data);
    } catch (error) {
      console.error('Failed to load dashboard aggregate:', error);
      // Fallback to static data
      const all = this._claims();
      const by = (code: string) => all.filter((c) => c.statusCode === code).length;
      this._dashboard.set({
        total_claims: this._claims().length,
        in_progress: by('SUBMITTED') + by('UNDER_REVIEW') + by('DRAFT') + by('DOCUMENTS_REQUIRED'),
        claimed_amount: all.reduce((s, c) => s + c.billAmount.amount, 0),
        approved_amount: all.reduce((s, c) => s + (c.approvedAmount?.amount ?? 0), 0),
      });
    } finally {
      this._dashboardLoading.set(false);
    }
  }

  private _patch(reference: string, patch: Partial<Claim>): void {
    this._claims.set(this._claims().map((c) => (c.reference === reference ? { ...c, ...patch } : c)));
  }
  async getClimListData():Promise<void> {
    this._getClimListData.set(true);
    const pageNo: any = 0;
    const pageSize = 20;
    const arg = "queryId=GET_CLAIMS_BY_USER&page_no="+pageNo+"&page_size="+pageSize;
    try{
      this.appService.getcall('claim','habit-opd', arg).subscribe(res =>{
        const response = JSON.parse(res)
        // Error bodies (`{errCode:-1, message:'Invalid Session'}`) carry no
        // `resource` at all, so this has to be optional or the list throws.
        if(response?.resource?.length > 0){
          this.categories().then((cats) => {
            const byCode = new Map(cats.map((c) => [c.claimCategory, c.name]));
            this._claimList.set(
              response.resource
                .map((row: any) => ({
                  ...row,
                  category:
                    row?.category && byCode.has(row.category) ? byCode.get(row.category) : row?.category,
                  // GET_CLAIMS_BY_USER may name it `provider` or `providerName`.
                  provider: row?.provider ?? row?.providerName ?? '',
                  // The badge needs a ClaimStatus object, not the raw status string.
                  status: toStatus(row?.claim_status ?? row?.status),
                }))
                // Most recently updated first; the API returns rows in its own
                // order, so a claim that just changed would otherwise be buried.
                .sort((a: any, b: any) => updatedAtMillis(b) - updatedAtMillis(a)),
            );
          });
        }
      })
    } catch(error){
      console.error('Failed to load dashboard aggregate:', error);
    }finally{
      this._getClimListData.set(false);
    }
  }
  /**
   * Loads one claim by its business reference (CLM-…) into `claimDetails`.
   * Resolves once the request settles so a caller that has just changed the
   * claim — resending documents, say — can await the refreshed record.
   */
  getClimDetails(climId: string): Promise<void> {
    this._getClimDetails.set(true);
    const arg = "queryId=GET_PAGE&filter=name:"+climId;
    return new Promise<void>((resolve) => {
      this.appService.getcall('claim','habit-opd', arg).subscribe({
        next: (res) => {
          try {
            const response = JSON.parse(res)
            // Error bodies (`{errCode:-1, message:'Invalid Session'}`) carry no
            // `resource` at all, so this has to be optional or the page throws.
            if(response?.resource?.length > 0){
              this._claimDetails.set(response.resource[0]);
            }
          } catch (error) {
            console.error('Failed to parse claim details:', error);
          } finally {
            this._getClimDetails.set(false);
            resolve();
          }
        },
        error: (error) => {
          // The old `try/catch` could never see this — the failure arrives on
          // the stream, not as a throw — so the page span loading for ever.
          console.error('Failed to load claim details:', error);
          this._getClimDetails.set(false);
          resolve();
        },
      })
    });
  }
}