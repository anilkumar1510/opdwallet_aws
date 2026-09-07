import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { formatMoney, money } from '../domain/money';
import { FamilyStore } from '../family/family.store';
import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { WalletStore } from '../wallet/wallet.store';
import { ClaimDto, ClaimsResponseDto, ClaimsSummaryDto } from './claim.dto';
import {
  CLAIMS_API,
  ClaimCategory,
  ClaimCategoryDto,
  ClaimTimelineDto,
  ClaimTimelineEntry,
  CreateClaimInput,
  TpaNote,
  TpaNotesDto,
  toClaim,
  toClaimTimeline,
  toTpaNotes,
  toClaimCategory,
  toClaimFormData,
  toClaimsSummary,
  toResubmitFormData,
  withPlaceholderCategories,
  ResubmitDocumentType,
} from './claim.mapper';
import { Claim, ClaimsSummary } from './claim.model';

const PAGE_SIZE = 20;

/** Claims for whichever family member is active. */
@Injectable({ providedIn: 'root' })
export class ClaimsStore {
  private readonly http = inject(HttpClient);
  private readonly family = inject(FamilyStore);
  private readonly session = inject(SessionStore);
  private readonly wallet = inject(WalletStore);

  private readonly _claims = signal<readonly Claim[]>([]);
  private readonly _summary = signal<ClaimsSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _submitting = signal(false);
  private readonly _submitError = signal<string | null>(null);
  private readonly _capNotice = signal<string | null>(null);

  private loadedFor: string | null = null;

  readonly claims = this._claims.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly submitError = this._submitError.asReadonly();
  /** Set when the API capped the bill to the per-claim limit on submit. */
  readonly capNotice = this._capNotice.asReadonly();

  constructor() {
    effect(() => {
      const activeId = this.family.activeMember()?.id ?? null;
      if (!this.session.isAuthenticated()) {
        this.reset();
        return;
      }
      if (!activeId || activeId === this.loadedFor) return;
      this.loadedFor = activeId;
      void this.load(activeId);
    });
  }

  retry(): void {
    const activeId = this.family.activeMember()?.id;
    if (activeId) void this.load(activeId);
  }

  /**
   * Claim categories for the form: the plan's configured ones, then a
   * PLACEHOLDER for every canonical category the plan is missing so the flow can
   * be tested against all of them. If the API call fails the member still gets
   * the full placeholder set rather than an empty dropdown.
   */
  async categories(): Promise<readonly ClaimCategory[]> {
    try {
      const rows = await firstValueFrom(
        this.http.get<ClaimCategoryDto[]>(CLAIMS_API.availableCategories),
      );
      const configured = (rows ?? [])
        .filter((row) => row.claimEnabled !== false)
        .map(toClaimCategory);
      return withPlaceholderCategories(configured);
    } catch {
      return withPlaceholderCategories([]);
    }
  }

  async claimById(claimId: string): Promise<Claim | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ claim?: ClaimDto } | ClaimDto>(CLAIMS_API.byId(claimId)),
      );
      const dto = (response as { claim?: ClaimDto }).claim ?? (response as ClaimDto);
      return dto ? toClaim(dto) : null;
    } catch {
      return null;
    }
  }

  /**
   * Status history and assessor notes for one claim, fetched together because
   * the detail screen shows both or neither. Empty on failure — these are
   * supporting panels, not the claim itself.
   */
  async history(reference: string): Promise<{
    timeline: readonly ClaimTimelineEntry[];
    notes: readonly TpaNote[];
  }> {
    if (!reference) return { timeline: [], notes: [] };
    const [timeline, notes] = await Promise.all([
      firstValueFrom(this.http.get<ClaimTimelineDto>(CLAIMS_API.timeline(reference)))
        .then(toClaimTimeline)
        .catch(() => [] as readonly ClaimTimelineEntry[]),
      firstValueFrom(this.http.get<TpaNotesDto>(CLAIMS_API.tpaNotes(reference)))
        .then(toTpaNotes)
        .catch(() => [] as readonly TpaNote[]),
    ]);
    return { timeline, notes };
  }

  /**
   * Withdraws a claim. Takes the business reference (CLM-…), not Claim.id —
   * this endpoint and the detail endpoint want different id forms.
   *
   * Returns true on success; on failure `submitError` carries the API's own
   * message, which explains why a particular claim could not be cancelled.
   */
  async cancel(reference: string, reason: string): Promise<boolean> {
    if (!reference) return false;
    this._submitting.set(true);
    this._submitError.set(null);
    try {
      await firstValueFrom(
        this.http.patch(CLAIMS_API.cancel(reference), {
          reason: reason.trim() || 'Cancelled by member',
        }),
      );
      // Refetch so the list and summary reflect the new status.
      const activeId = this.family.activeMember()?.id;
      this.loadedFor = null;
      if (activeId) {
        this.loadedFor = activeId;
        void this.load(activeId);
      }
      // Cancelling releases the wallet block; reload so the balance returns.
      this.wallet.retry();
      return true;
    } catch (error: unknown) {
      this._submitError.set(
        isAppError(error) ? error.message : 'We could not cancel that claim.',
      );
      return false;
    } finally {
      this._submitting.set(false);
    }
  }

  /**
   * Sends the documents the assessor asked for, moving the claim off
   * DOCUMENTS_REQUIRED. Patient-flows flow 9: "additional documents requested"
   * was the one branch of the claim journey the member could see and not act on
   * — the status rendered as "Documents needed" and nothing offered a way back.
   *
   * Takes the business CLM-… id, like `cancel` and `timeline` and unlike
   * `byId`. Reuses `submitting`/`submitError` rather than adding a second pair
   * of flags: no screen runs this and a filing at the same time.
   */
  async resubmitDocuments(
    reference: string,
    files: readonly File[],
    documentType: ResubmitDocumentType,
    notes?: string,
  ): Promise<boolean> {
    if (!reference || files.length === 0) return false;
    this._submitting.set(true);
    this._submitError.set(null);
    try {
      await firstValueFrom(
        this.http.post(
          CLAIMS_API.resubmitDocuments(reference),
          toResubmitFormData(files, documentType, notes),
        ),
      );
      // Refetch so the status leaves "Documents needed" without a manual reload.
      const activeId = this.family.activeMember()?.id;
      this.loadedFor = null;
      if (activeId) {
        this.loadedFor = activeId;
        void this.load(activeId);
      }
      return true;
    } catch (error: unknown) {
      this._submitError.set(
        isAppError(error) ? error.message : 'We could not send those documents.',
      );
      return false;
    } finally {
      this._submitting.set(false);
    }
  }

  /**
   * Files a claim. Returns its Mongo `_id` - what the detail route needs - or
   * null with `submitError` set.
   *
   * Both ids matter here and they are not interchangeable: the submit endpoint
   * takes the business `claimId` (CLM-...), while `byId` and therefore the detail
   * route take the `_id`. Navigating with the business id renders "Claim not
   * found" over a claim that was filed successfully.
   *
   * Two calls, matching web-member: POST creates the claim as a DRAFT, then
   * POST :claimId/submit moves it to SUBMITTED and debits the wallet. Creating
   * alone leaves a draft nobody assesses, so a failure on the second step is
   * reported even though the first succeeded.
   */
  async submit(input: CreateClaimInput): Promise<string | null> {
    this._submitting.set(true);
    this._submitError.set(null);
    this._capNotice.set(null);
    try {
      const created = await firstValueFrom(
        this.http.post<Record<string, unknown>>(CLAIMS_API.create, toClaimFormData(input)),
      );
      const claim = (created['claim'] as Record<string, unknown> | undefined) ?? created;
      const reference = String(claim['claimId'] ?? '');
      if (!reference) throw appError('server');
      // Kept separately: the submit call below needs the business reference,
      // the caller needs the _id to navigate.
      const mongoId = String(claim['_id'] ?? '') || reference;

      const submitted = await firstValueFrom(
        this.http.post<Record<string, unknown>>(CLAIMS_API.submit(reference), {}),
      );

      // The API silently caps a bill above the per-claim limit; the member is
      // told what they will actually be assessed for.
      if (submitted?.['wasCapped'] === true) {
        this._capNotice.set(
          `Your bill of ${formatMoney(money(submitted['originalBillAmount'] as number))} was capped to ` +
            `${formatMoney(money(submitted['cappedAmount'] as number))}, the per-claim limit of ` +
            `${formatMoney(money(submitted['perClaimLimitApplied'] as number))}.`,
        );
      }

      // Refresh the list so the new claim appears without a manual reload.
      this.loadedFor = null;
      const activeId = this.family.activeMember()?.id;
      if (activeId) {
        this.loadedFor = activeId;
        void this.load(activeId);
      }
      // Submit blocks/debits the wallet server-side; reload it so the reduced
      // balance shows without a manual refresh. No effect on a placeholder
      // category, which has no wallet bucket.
      this.wallet.retry();
      return mongoId;
    } catch (error: unknown) {
      this._submitError.set(
        isAppError(error) ? error.message : 'We could not submit that claim.',
      );
      return null;
    } finally {
      this._submitting.set(false);
    }
  }

  private async load(userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    const params = new HttpParams().set('userId', userId);

    try {
      const [list, summary] = await Promise.all([
        firstValueFrom(
          this.http.get<ClaimsResponseDto>(CLAIMS_API.list, {
            params: params.set('limit', PAGE_SIZE),
          }),
        ),
        // A failing summary must not cost the member their claim list.
        firstValueFrom(this.http.get<ClaimsSummaryDto>(CLAIMS_API.summary, { params })).catch(
          () => null,
        ),
      ]);

      if (this.loadedFor !== userId) return;
      this._claims.set((list.claims ?? []).map(toClaim));
      this._summary.set(summary ? toClaimsSummary(summary) : null);
    } catch (error: unknown) {
      if (this.loadedFor !== userId) return;
      this._claims.set([]);
      this._summary.set(null);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedFor === userId) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedFor = null;
    this._claims.set([]);
    this._summary.set(null);
    this._error.set(null);
  }
}
