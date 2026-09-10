import { Injectable, computed, signal } from '@angular/core';

import { formatMoney, money } from '../domain/money';
import { AppError } from '../http/app-error';
import {
  ClaimCategory,
  ClaimTimelineEntry,
  CreateClaimInput,
  ResubmitDocumentType,
  TpaNote,
  toStatus,
} from './claim.mapper';
import { Claim, ClaimsSummary } from './claim.model';
import { STATIC_CLAIMS, STATIC_CLAIM_CATEGORIES, buildClaim, staticHistory } from './static-claims.data';

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

  retry(): void {
    /* static — nothing to refetch */
  }

  async categories(): Promise<readonly ClaimCategory[]> {
    return STATIC_CLAIM_CATEGORIES;
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

  private _patch(reference: string, patch: Partial<Claim>): void {
    this._claims.set(this._claims().map((c) => (c.reference === reference ? { ...c, ...patch } : c)));
  }
}
