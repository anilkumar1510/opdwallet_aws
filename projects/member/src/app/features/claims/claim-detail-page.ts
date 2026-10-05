import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  ClaimTimelineEntry,
  RESUBMIT_DOCUMENT_TYPES,
  RESUBMIT_MAX_FILES,
  ResubmitDocumentType,
  TpaNote,
  toStatus,
  validateResubmitFile,
} from '../../core/claims/claim.mapper';
import { Claim, ClaimStatus, StatusTone } from '../../core/claims/claim.model';
import { ClaimDocument } from '../../core/claims/claim.model';
import { ClaimsStore } from '../../core/claims/claims.store';
import { BankDetailsStore } from '../../core/member/bank-details.store';
import { formatMoney, money } from '../../core/domain/money';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';
import { AppService } from '../../core/http/api.service';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Test-scenario tables (frontend-only placeholders) ──────────────────────
type ScenarioKey =
  | 'live'
  | 'review'
  | 'docs'
  | 'approved'
  | 'partial'
  | 'rejected'
  | 'processing'
  | 'paid'
  | 'closed';

const SCENARIO_STATUS: Record<
  Exclude<ScenarioKey, 'live'>,
  { code: string; label: string; tone: StatusTone; isFinal: boolean; cancellable: boolean }
> = {
  review: { code: 'UNDER_REVIEW', label: 'Under review', tone: 'progress', isFinal: false, cancellable: true },
  docs: { code: 'DOCUMENTS_REQUIRED', label: 'Documents needed', tone: 'negative', isFinal: false, cancellable: true },
  approved: { code: 'APPROVED', label: 'Approved', tone: 'positive', isFinal: false, cancellable: false },
  partial: { code: 'PARTIALLY_APPROVED', label: 'Partially approved', tone: 'positive', isFinal: false, cancellable: false },
  rejected: { code: 'REJECTED', label: 'Rejected', tone: 'negative', isFinal: true, cancellable: false },
  processing: { code: 'PAYMENT_PROCESSING', label: 'Payment processing', tone: 'progress', isFinal: false, cancellable: false },
  paid: { code: 'PAYMENT_COMPLETED', label: 'Paid', tone: 'positive', isFinal: true, cancellable: false },
  closed: { code: 'CLOSED', label: 'Closed', tone: 'neutral', isFinal: true, cancellable: false },
};

/**
 * Statuses a member may still withdraw from. The GET_PAGE payload carries no
 * `isCancellable` flag, so on live data it is derived from the status code —
 * only the scenario switcher supplies one of its own.
 */
const CANCELLABLE_STATUSES = new Set(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED']);

/** Fraction of the bill shown as approved per scenario; null = leave unchanged. */
const APPROVED_FACTOR: Record<ScenarioKey, number | null> = {
  live: null,
  review: null,
  docs: null,
  approved: 1,
  partial: 0.6,
  rejected: null,
  processing: 1,
  paid: 1,
  closed: null,
};

/** `PARTIALLY_VERIFIED` → `Partially verified`, for codes with no label table. */
function humaniseCode(value: string | undefined): string {
  if (!value) return '';
  const spaced = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** One claim, its documents and assessment. */
@Component({
  selector: 'opd-claim-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView, StatusBadge],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/claims"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to claims"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Claim Details</h1>
            <!-- The member's reference (CLM-…). Read from the loaded payload,
                 not the static claim resource, which is keyed by a different
                 id and so left this line blank for every real claim. -->
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ displayClaim()?.claim_id ?? claimId() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.claimDetailsLoading() && !displayClaim()) {
          <opd-loading label="Loading claim" />
        } @else if (displayClaim(); as detail) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ store.getCategoryDisplay(detail.category) }}</h2>
                <p class="mt-0.5 text-sm text-ink-700">{{ detail.provider }}</p>
              </div>
              <opd-status-badge [status]="status(detail.claim_status)" />
            </div>

            <dl class="mt-5 space-y-3 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Patient</dt>
                <dd class="font-medium text-ink-900">{{ decryptText(detail.patient_name) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Claim type</dt>
                <dd class="font-medium text-ink-900">{{ detail.claim_type }}</dd>
              </div>
              @if (detail.dental_claim_type) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Dental claim type</dt>
                  <dd class="font-medium text-ink-900">{{ dentalClaimTypeLabel(detail.dental_claim_type) }}</dd>
                </div>
              }
              @if (detail.pharmacy) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Pharmacy</dt>
                  <dd class="font-medium text-ink-900">{{ detail.pharmacy }}</dd>
                </div>
              }
              @if (detail.optician) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Optician</dt>
                  <dd class="font-medium text-ink-900">{{ detail.optician }}</dd>
                </div>
              }
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Treatment date</dt>
                <dd class="font-medium text-ink-900">{{ date(detail.treatment_date) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Submitted</dt>
                <dd class="font-medium text-ink-900">{{ date(detail.submitted_at) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Why the claim needs attention. Placed directly under the
               summary because it is the first thing a member wants when they
               see Rejected or Documents required, not something to hunt for
               below the amounts. -->
          @if (actionReason(detail); as reason) {
            <section
              class="mt-5 rounded-2xl border border-danger-200 bg-danger-50 p-5 lg:p-6"
              role="alert"
            >
              <h2 class="mb-2 text-base font-semibold text-danger-700 lg:text-lg">
                {{ actionReasonHeading(detail) }}
              </h2>
              <p class="text-sm text-ink-900">{{ reason }}</p>
            </section>
          }

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Amount</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Claimed</dt>
                <dd class="font-medium text-ink-900">{{ money({ amount: detail.original_bill_amount, currency: 'INR'}) }}</dd>
              </div>
              <!-- Presence, not truthiness: an assessed claim may well be
                   approved for 0, and reading that as "not assessed" hid the
                   outcome on every such claim. -->
              @if (hasApprovedAmount(detail)) {
                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="font-semibold text-ink-900">Approved</dt>
                  <dd class="text-lg font-bold text-success-700">{{ money({ amount: detail.approved_amount, currency: 'INR'}) }}</dd>
                </div>
              } @else {
                <p class="border-t border-surface-border pt-2 text-xs text-ink-500">
                  Not assessed yet.
                </p>
              }
            </dl>
          </section>

          <!-- Payment / credit. Shown once the claim reaches a payout stage.
               PLACEHOLDER — the claim payload carries no payment fields yet
               (paymentStatus/paymentId/transactionId/paymentDate/
               paymentReferenceNumber/paymentMode). See PLACEHOLDER-APIS.md. -->
          @if (isPaymentStage(detail.claim_status)) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Payment</h2>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Status</dt>
                  <dd class="font-medium text-ink-900">{{ status(detail.claim_status).label }}</dd>
                </div>
                @if (hasApprovedAmount(detail)) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Amount credited</dt>
                    <dd class="font-medium text-success-700">{{ money({ amount: detail.approved_amount, currency: 'INR'}) }}</dd>
                  </div>
                }
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid to</dt>
                  <dd class="font-medium text-ink-900">
                    {{ bank.hasDetails() ? bank.maskedAccount() : 'Bank account on file' }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Payment reference</dt>
                  <dd class="text-ink-500">Awaiting payout details</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Credited on</dt>
                  <dd class="text-ink-500">Awaiting payout details</dd>
                </div>
              </dl>
              <p class="mt-3 text-xs text-warning-700">
                Payment reference and date will appear once the payout details are available.
              </p>
            </section>
          }

          @if (detail?.documents && detail?.documents?.length) {
            <!-- This used to be the COUNT and nothing else: "3 documents submitted
                 with this claim", beside no way to open any of them. The reference
                 lists them and links each one (claims/[id]/page.tsx:495-515). -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">
                {{ detail?.documents?.length }} document{{ detail?.documents?.length === 1 ? '' : 's' }}
                submitted with this claim
              </h2>
              @if (downloadError(); as error) {
                <p class="mb-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {{ error }}
                </p>
              }
              <ul class="space-y-2">
                @for (doc of detail.documents; track docKey(doc)) {
                  <li
                    class="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2"
                  >
                    <span class="min-w-0">
                      <span class="block text-sm font-medium text-ink-900">{{ documentTypeLabel(doc.document_type) }}</span>
                      <span class="block truncate text-xs text-ink-500">
                        {{ doc.originalname }}
                        @if (fileSize(doc.filesize); as size) {
                          &middot; {{ size }}
                        }
                      </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-3">
                      <!-- Document verification status — COMMENTED OUT.
                           Every document comes back PENDING from the store, so the
                           badge told the member nothing and read as though their
                           paperwork was stuck.

                      @if (doc.verification_status) {
                        <span class="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                          {{ documentStatusLabel(doc.verification_status) }}
                        </span>
                      }
                      -->
                      @if (doc.downloadPath) {
                        <button
                          type="button"
                          class="text-xs font-medium text-primary-700 underline underline-offset-2 disabled:opacity-60"
                          [disabled]="downloading() === doc.fileName"
                          (click)="download(doc)"
                        >
                          {{ downloading() === doc.fileName ? 'Opening…' : 'Download' }}
                        </button>
                      }
                    </span>
                  </li>
                }
              </ul>
            </section>
          }

          @if (displayHistory(); as extra) {
            @if (extra.timeline.length) {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">Progress</h2>
                <ol class="space-y-4">
                  @for (entry of extra.timeline; track $index) {
                    <li class="flex gap-3">
                      <span
                        class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0F5FDC]"
                        aria-hidden="true"
                      ></span>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-ink-900">{{ entry.status.label }}</p>
                        <p class="mt-0.5 text-xs text-ink-500">
                          {{ date(entry.changedAt) }} &middot; {{ entry.changedBy }}
                        </p>
                        @if (entry.reason) {
                          <p class="mt-1 text-sm text-ink-700">{{ entry.reason }}</p>
                        }
                      </div>
                    </li>
                  }
                </ol>
              </section>
            }

            @if (extra.notes.length) {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">
                  Notes from the assessor
                </h2>
                <ul class="space-y-3">
                  @for (note of extra.notes; track $index) {
                    <li class="rounded-xl bg-[#F5F8FF] px-4 py-3">
                      <p class="text-xs font-medium text-[#0E51A2]">{{ note.typeLabel }}</p>
                      <p class="mt-1 text-sm text-ink-900">{{ note.message }}</p>
                      @if (note.at) {
                        <p class="mt-1 text-xs text-ink-500">{{ date(note.at) }}</p>
                      }
                    </li>
                  }
                </ul>
              </section>
            }
          }

           @if (detail.claim_status === 'DOCUMENTS_REQUIRED') {
             <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
               <h2 class="text-sm font-semibold text-ink-900">Send the documents requested</h2>
               @if (actionReason(detail); as reason) {
                 <p class="mt-1 text-sm text-ink-700">{{ reason }}</p>
               } @else {
                 <p class="mt-1 text-sm text-ink-700">
                   The assessor needs more before this claim can be settled. Attach what they asked
                   for and it goes back for assessment.
                 </p>
               }

              @if (resubmitError(); as error) {
                <p
                  class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700"
                  role="alert"
                >
                  {{ error }}
                </p>
              }

              <!-- What is already on the claim. Sending documents replaces the
                   whole documents array, so anything crossed off here is left
                   out of that array and comes off the claim. -->
              @if (detail?.documents?.length) {
                <div class="mt-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Already on this claim
                  </p>
                  <ul class="mt-2 space-y-2">
                    @for (doc of detail.documents; track docKey(doc)) {
                      <li
                        class="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                        [class]="isRemoved(doc) ? 'border-dashed border-surface-border opacity-60' : 'border-surface-border'"
                      >
                        <span class="min-w-0">
                          <span
                            class="block text-sm font-medium text-ink-900"
                            [class.line-through]="isRemoved(doc)"
                            >{{ documentTypeLabel(doc.document_type) }}</span
                          >
                          <span class="block truncate text-xs text-ink-500">{{ doc.originalname }}</span>
                        </span>
                        @if (isRemoved(doc)) {
                          <button
                            type="button"
                            class="shrink-0 text-xs font-medium text-primary-700 underline underline-offset-2"
                            (click)="restoreDocument(doc)"
                          >
                            Undo
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-ink-500 hover:bg-danger-50 hover:text-danger-700"
                            [attr.aria-label]="'Remove ' + doc.originalname"
                            (click)="removeDocument(doc)"
                          >
                            &times;
                          </button>
                        }
                      </li>
                    }
                  </ul>
                </div>
              }

              <label class="mt-4 block">
                <span class="text-sm text-ink-700">What are you sending?</span>
                <select
                  [value]="documentType()"
                  (change)="documentType.set($any($event.target).value)"
                  class="mt-1 min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
                >
                  @for (type of documentTypes; track type.value) {
                    <option [value]="type.value">{{ type.label }}</option>
                  }
                </select>
              </label>

              <label class="mt-3 block">
                <span class="text-sm text-ink-700">Files (PDF or photo, up to 10)</span>
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  [disabled]="uploading() || sendingDocuments()"
                  (change)="pickFiles($event)"
                  class="mt-1 block w-full text-sm text-ink-700 file:mr-3 file:min-h-touch file:rounded-xl file:border file:border-surface-border file:bg-white file:px-4 file:text-sm file:font-semibold file:text-ink-900"
                />
              </label>

              @if (uploading()) {
                <p class="mt-2 flex items-center gap-2 text-sm text-ink-700" role="status">
                  <span
                    class="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
                    aria-hidden="true"
                  ></span>
                  Uploading…
                </p>
              }

              <!-- Uploaded to the document store but not yet attached to the
                   claim; crossing one off here simply drops it from the array. -->
              @if (pendingDocuments().length) {
                <div class="mt-3">
                  <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Ready to send
                  </p>
                  <ul class="mt-2 space-y-2">
                    @for (doc of pendingDocuments(); track doc.document_id) {
                      <li
                        class="flex items-center justify-between gap-3 rounded-xl border border-[#0F5FDC]/40 bg-[#F5F8FF] px-3 py-2"
                      >
                        <span class="min-w-0">
                          <span class="block text-sm font-medium text-ink-900">{{ documentTypeLabel(doc.document_type) }}</span>
                          <span class="block truncate text-xs text-ink-500">
                            {{ doc.originalname }}
                            @if (fileSize(doc.filesize); as size) {
                              &middot; {{ size }}
                            }
                          </span>
                        </span>
                        <button
                          type="button"
                          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-ink-500 hover:bg-danger-50 hover:text-danger-700"
                          [attr.aria-label]="'Remove ' + doc.originalname"
                          (click)="removePendingDocument(doc)"
                        >
                          &times;
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }

              <button
                type="button"
                class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="!canSendDocuments()"
                (click)="sendDocuments()"
              >
                {{ sendingDocuments() ? 'Sending…' : 'Send documents' }}
              </button>
              <p class="mt-2 text-center text-xs text-ink-500">
                {{ documentsToSend().length }} document{{ documentsToSend().length === 1 ? '' : 's' }}
                will be on this claim after sending.
              </p>
            </section>
          }

          @if (detail.isCancellable) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
              @if (store.submitError(); as error) {
                <p class="mb-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                  {{ error }}
                </p>
              }

              @if (confirming()) {
                <p class="text-sm font-medium text-ink-900">Withdraw this claim?</p>
                <p class="mt-1 text-sm text-ink-700">
                  It will stop being assessed. You can submit a new claim for the same treatment.
                </p>

                <label class="mt-3 block">
                  <span class="text-sm text-ink-700">Reason (optional)</span>
                  <input
                    type="text"
                    [value]="reason()"
                    (input)="reason.set($any($event.target).value)"
                    placeholder="Cancelled by member"
                    class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
                  />
                </label>

                <div class="mt-3 flex gap-3">
                  <button
                    type="button"
                    class="min-h-touch flex-1 rounded-xl bg-danger-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                    [disabled]="store.submitting()"
                    (click)="cancelClaim(detail.reference)"
                  >
                    {{ store.submitting() ? 'Cancelling…' : 'Yes, withdraw it' }}
                  </button>
                  <button
                    type="button"
                    class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
                    [disabled]="store.submitting()"
                    (click)="confirming.set(false)"
                  >
                    Keep it
                  </button>
                </div>
              } @else {
                <button
                  type="button"
                  class="min-h-touch w-full rounded-xl border border-danger-600 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50"
                  (click)="confirming.set(true)"
                >
                  Cancel this claim
                </button>
              }
            </section>
          }
        } @else {
          <opd-empty title="Claim not found" detail="We could not find that claim." />
        }
      </div>
    </div>
  `,
})
export class ClaimDetailPage {
  readonly claimId = input<string>('');

  protected readonly store = inject(ClaimsStore);
  protected readonly bank = inject(BankDetailsStore);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly appService = inject(AppService);
  protected readonly money = formatMoney;
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.route.paramMap.subscribe(params => {
      const reference = params.get('claimId');

      console.log('Claim Reference:', reference);

      if (reference) {
        void this.store.getClimDetails(reference);
        void this.store.loadActionReasons();
        void this.store.loadCategoryLabels();
      }
    });
  }
  /** Payout-stage statuses that surface the (placeholder) Payment section. */
  private static readonly PAYMENT_STAGES = new Set([
    'PAYMENT_PENDING',
    'PAYMENT_PROCESSING',
    'PAYMENT_COMPLETED',
    'PAYMENT_DONE',
    'PAID',
  ]);
  protected isPaymentStage(statusCode: string): boolean {
    return ClaimDetailPage.PAYMENT_STAGES.has(statusCode);
  }

  protected readonly confirming = signal(false);
  protected readonly downloading = signal<string | null>(null);
  protected readonly downloadError = signal<string | null>(null);

  protected readonly documentTypes = RESUBMIT_DOCUMENT_TYPES;
  protected readonly documentType = signal<ResubmitDocumentType>('INVOICE');
  /**
   * Kept apart from `store.submitError()`, which the withdraw block already
   * renders — one shared signal would show a resubmission failure inside the
   * withdraw panel and vice versa.
   */
  protected readonly resubmitError = signal<string | null>(null);

  /** Uploaded to the document store, not yet written onto the claim. */
  protected readonly pendingDocuments = signal<readonly any[]>([]);
  /** Existing claim documents the member has crossed off. */
  protected readonly removedDocumentKeys = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly uploading = signal(false);
  protected readonly sendingDocuments = signal(false);

  /**
   * Identity for a document row. `document_id` is what the claim payload refers
   * to, but the sample data shows rows that carry only a filename, so fall back
   * rather than key every such row on `undefined` and treat them as one.
   */
  protected docKey(doc: any): string {
    return String(doc?.document_id ?? doc?.id ?? doc?.originalname ?? doc?.name ?? '');
  }

  protected isRemoved(doc: any): boolean {
    return this.removedDocumentKeys().has(this.docKey(doc));
  }

  protected removeDocument(doc: any): void {
    const next = new Set(this.removedDocumentKeys());
    next.add(this.docKey(doc));
    this.removedDocumentKeys.set(next);
  }

  protected restoreDocument(doc: any): void {
    const next = new Set(this.removedDocumentKeys());
    next.delete(this.docKey(doc));
    this.removedDocumentKeys.set(next);
  }

  protected removePendingDocument(doc: any): void {
    const key = this.docKey(doc);
    this.pendingDocuments.update((list) => list.filter((d) => this.docKey(d) !== key));
  }

  /** What the claim's `documents` array becomes: kept originals, then new uploads. */
  protected readonly documentsToSend = computed<readonly any[]>(() => {
    const existing: readonly any[] = this.store.claimDetails()?.documents ?? [];
    const removed = this.removedDocumentKeys();
    return [...existing.filter((doc) => !removed.has(this.docKey(doc))), ...this.pendingDocuments()];
  });

  /**
   * Sending is worth doing when something has actually changed — a new upload,
   * or an existing document crossed off — and nothing else is in flight.
   */
  protected readonly canSendDocuments = computed(
    () =>
      !this.uploading() &&
      !this.sendingDocuments() &&
      (this.pendingDocuments().length > 0 || this.removedDocumentKeys().size > 0),
  );

  protected documentTypeLabel(value: string | undefined): string {
    return RESUBMIT_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? humaniseCode(value);
  }

  protected dentalClaimTypeLabel(value: string | undefined): string {
    return humaniseCode(value);
  }

  protected documentStatusLabel(value: string | undefined): string {
    return humaniseCode(value);
  }

  /** `filesize` arrives as a string of bytes, and sometimes as an empty one. */
  protected fileSize(value: string | number | undefined): string | null {
    const bytes = Number(value);
    if (!value || Number.isNaN(bytes) || bytes <= 0) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * The API caps the upload at 10 files and rejects anything that is not a PDF
   * or an image, with a message about file types that does not name the file.
   * Both are checked here so the member is told which file to change.
   */
  /**
   * Picks files, validates them, and uploads each one to the document store
   * straight away. The claim itself is only updated when the member presses
   * Send, so an upload that is then crossed off never reaches the claim.
   */
  protected async pickFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    // Let the same file be chosen again after it has been removed.
    input.value = '';
    this.resubmitError.set(null);
    if (!picked.length) return;

    if (picked.length + this.pendingDocuments().length > RESUBMIT_MAX_FILES) {
      this.resubmitError.set(`Send up to ${RESUBMIT_MAX_FILES} files at a time.`);
      return;
    }
    for (const file of picked) {
      const problem = validateResubmitFile(file);
      if (problem) {
        this.resubmitError.set(`${file.name}: ${problem}`);
        return;
      }
    }

    this.uploading.set(true);
    try {
      for (const file of picked) await this.uploadDocument(file);
    } catch (error) {
      console.error('Failed to upload claim document:', error);
      this.resubmitError.set('We could not upload that file. Please try again.');
    } finally {
      this.uploading.set(false);
    }
  }

  /**
   * Same call the new-claim form makes: multipart to the document store, which
   * answers with the `document_id` the claim payload refers to. The XSRF token
   * is signed over the file's bytes there, so it is read the same way here.
   */
  private async uploadDocument(file: File): Promise<void> {
    const content = await new Promise<unknown>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('action', 'add');

    const encrypted = this.appService.getXsrfToken(content, true);
    const res: any = await firstValueFrom(
      this.http.post('/dms/api/v1/emrImage', formData, {
        headers: new HttpHeaders()
          .set('X-XSRF-TOKEN', String(encrypted))
          .set('timezone', this.appService.getUserTimezone())
          .set('current_time', this.appService.getCurrentTime())
          .set('current_url', this.router.url)
          .set('host_name', window.location.host),
        responseType: 'json',
        observe: 'response' as 'response',
      }),
    );

    if (res?.body?.errCode !== 0) {
      throw new Error(res?.body?.message ?? 'Upload rejected');
    }
    const uploaded = res.body.resource?.[0];
    this.pendingDocuments.update((list) => [
      ...list,
      {
        name: uploaded?.file_name,
        document_id: uploaded?.document_id,
        document_type: this.documentType(),
        originalname: uploaded?.file_name ?? file.name,
        verification_status: 'PENDING',
        filetype: file.type,
        filesize: file.size,
      },
    ]);
  }

  /**
   * Writes the claim back with its new `documents` array. The API replaces the
   * array wholesale, so it is sent as "documents kept" + "documents uploaded" —
   * which is also what makes crossing an existing one off actually remove it.
   */
  protected async sendDocuments(): Promise<void> {
    const base = this.store.claimDetails();
    if (!base || !this.canSendDocuments()) return;

    this.resubmitError.set(null);
    this.sendingDocuments.set(true);

    const payload = { ...base, documents: this.documentsToSend() };
    let encodedResourceData = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    let params = 'resource=' + encodedResourceData;
    params += '&application=habit-opd&action=uploadDocument';
    // Signed over the body plus the action, exactly as the new-claim submit does.
    encodedResourceData += '&action=uploadDocument';
    const options = this.appService.addXsrfToken(encodedResourceData, true);

    try {
      // Relative so the dev proxy can reach the API; the new-claim form still
      // posts an absolute URL, which only works where CORS allows it.
      await firstValueFrom(this.http.post('habit-opd/api/v1/claim', params, options));
      this.pendingDocuments.set([]);
      this.removedDocumentKeys.set(new Set());
      await this.store.getClimDetails(this.claimId());
    } catch (error) {
      console.error('Failed to send claim documents:', error);
      this.resubmitError.set('We could not send those documents. Please try again.');
    } finally {
      this.sendingDocuments.set(false);
    }
  }

  /**
   * Fetch one claim document and hand it to the browser. Same shape as the
   * booking invoice: no navigation, a file arrives, and a failure is said out
   * loud rather than swallowed — which matters here because every stored
   * `filePath` in this database is a macOS path from another machine.
   */
  protected async download(doc: ClaimDocument): Promise<void> {
    if (!doc.downloadPath) return;
    this.downloadError.set(null);
    this.downloading.set(doc.fileName);
    try {
      const blob = await firstValueFrom(
        this.http.get(doc.downloadPath, { responseType: 'blob' }),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      this.downloadError.set('We could not open that document. Please try again.');
    } finally {
      this.downloading.set(null);
    }
  }

  protected readonly reason = signal('');

  protected readonly claim = resource({
    params: () => this.claimId(),
    loader: ({ params }) => (params ? this.store.claimById(params) : Promise.resolve(null)),
  });

  /**
   * Keyed off the loaded claim's business reference, not the route param —
   * these two routes take CLM-… while the route carries the Mongo _id.
   */
  protected readonly history = resource({
    params: () => this.claim.value()?.reference ?? '',
    loader: ({ params }) =>
      params ? this.store.history(params) : Promise.resolve({ timeline: [], notes: [] }),
  });

  // ── TEST SCENARIO SWITCHER (frontend-only, placeholder) ─────────────────
  //
  // Overrides the loaded claim so every backend outcome can be previewed. All
  // data below is invented; nothing is persisted. Remove before production.

  protected readonly scenarioKey = signal<ScenarioKey>('live');
  protected readonly scenarios: ReadonlyArray<{ key: ScenarioKey; label: string }> = [
    { key: 'live', label: 'Live (real data)' },
    { key: 'review', label: 'Under review' },
    { key: 'docs', label: 'Documents required' },
    { key: 'approved', label: 'Approved (full)' },
    { key: 'partial', label: 'Partially approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'processing', label: 'Payment processing' },
    { key: 'paid', label: 'Paid' },
    { key: 'closed', label: 'Closed' },
  ];

  protected currentScenarioLabel(): string {
    return this.scenarios.find((s) => s.key === this.scenarioKey())?.label ?? '';
  }

  /**
   * The claim shown on screen — real, or patched into the chosen scenario.
   *
   * Every field here is the API's own snake_case. The override used to write
   * `approvedAmount` while the template reads `approved_amount`, so the
   * simulated figure never appeared, and it derived that figure from
   * `base.billAmount.amount` — a shape the GET_PAGE payload does not have, so
   * picking any approving scenario threw before it could render.
   */
  protected readonly displayClaim = computed<any | null>(() => {
    const base = this.store.claimDetails()
    if (!base) return null;

    const key = this.scenarioKey();
    if (key === 'live') {
      return { ...base, isCancellable: CANCELLABLE_STATUSES.has(base.claim_status) };
    }

    const s = SCENARIO_STATUS[key];
    const factor = APPROVED_FACTOR[key];
    const billed = Number(base.original_bill_amount ?? 0);
    return {
      ...base,
      claim_status: s.code,
      approved_amount: factor !== null ? Math.round(billed * factor) : base.approved_amount,
      isCancellable: s.cancellable,
    };
  });

  /** Timeline + assessor notes for the chosen scenario, or the real ones. */
  protected readonly displayHistory = computed<{
    timeline: readonly ClaimTimelineEntry[];
    notes: readonly TpaNote[];
  } | null>(() => {
    const key = this.scenarioKey();
    if (key === 'live') return this.history.value() ?? null;
    const now = new Date();
    const step = (label: string, tone: StatusTone, reason: string | null = null): ClaimTimelineEntry => ({
      status: { label, tone, isFinal: false },
      changedAt: now,
      changedBy: 'TPA · Assessor',
      reason,
    });
    const note = (typeLabel: string, message: string): TpaNote => ({ typeLabel, message, at: now });

    const base: ClaimTimelineEntry[] = [step('Submitted', 'progress'), step('Under review', 'progress')];
    switch (key) {
      case 'review':
        return { timeline: [step('Submitted', 'progress'), step('With assessor', 'progress'), step('Under review', 'progress')], notes: [] };
      case 'docs':
        return {
          timeline: [...base, step('Documents needed', 'negative')],
          notes: [note('Documents requested', 'Please upload a clearer, itemised invoice showing the provider details and the total.')],
        };
      case 'approved':
        return { timeline: [...base, step('Approved', 'positive')], notes: [note('Approved', 'Approved in full. The amount will be credited to your bank account.')] };
      case 'partial':
        return {
          timeline: [...base, step('Partially approved', 'positive')],
          notes: [note('Partial approval', 'Amount exceeds the per-claim limit; the limit has been approved. The rest is not payable.')],
        };
      case 'rejected':
        return {
          timeline: [...base, step('Rejected', 'negative')],
          notes: [note('Rejected', 'Claim submission window has lapsed — the claim was submitted more than 45 days after the treatment date.')],
        };
      case 'processing':
        return { timeline: [...base, step('Approved', 'positive'), step('Payment processing', 'progress')], notes: [note('Payment', 'Your reimbursement is being paid to your bank account.')] };
      case 'paid':
        return { timeline: [...base, step('Approved', 'positive'), step('Paid', 'positive')], notes: [note('Payment', 'Your reimbursement has been credited to your bank account.')] };
      case 'closed':
        return { timeline: [...base, step('Closed', 'neutral')], notes: [] };
      default:
        return { timeline: [], notes: [] };
    }
  });

  /**
   * Takes the business reference, not the route's id — the cancel endpoint
   * wants CLM-… while the detail endpoint that loaded this claim wants _id.
   */
  protected async cancelClaim(reference: string): Promise<void> {
    if (await this.store.cancel(reference, this.reason())) {
      // web-member returns to the list, where the new status is visible.
      void this.router.navigate(['/member/claims']);
    }
  }

  /**
   * `treatment_date` and `submitted_at` arrive from GET_PAGE as epoch millis,
   * while the timeline entries are still `Date`s — both reach this one helper,
   * so an unusable value has to read as "Not recorded" rather than as a number.
   */
  protected date(value: Date | number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return 'Not recorded';
    const numeric = Number(value);
    const parsed =
      value instanceof Date ? value : new Date(Number.isNaN(numeric) ? String(value) : numeric);
    return Number.isNaN(parsed.getTime()) ? 'Not recorded' : DATE.format(parsed);
  }

  /**
   * Whether the claim carries an assessed amount at all.
   *
   * A nil check on purpose. `approved_amount` is 0 on most assessed claims in
   * this account, and a truthiness test sent every one of them down the "Not
   * assessed yet." branch — including claims the TPA had already approved.
   */
  protected hasApprovedAmount(claim: any): boolean {
    const value = claim?.approved_amount;
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * The assessor's reason for the current status, from `claim_action_reason`.
   *
   * Returns '' for anything that is not a rejected claim with a reason on it,
   * so the block stays away rather than showing an empty red panel. The field
   * is absent from the payload today — the section appears the moment the API
   * starts sending it, and nothing changes here.
   */
  protected actionReason(claim: any): string {
    const status = claim?.claim_status;
    if (status !== 'REJECTED' && status !== 'DOCUMENTS_REQUIRED') return '';
    const reason = claim?.claim_action_reason;
    if (typeof reason !== 'string') return '';
    return this.store.getActionReasonDisplay(reason.trim());
  }

  protected actionReasonHeading(claim: any): string {
    return claim?.claim_status === 'REJECTED' ? 'Why this claim was rejected' : 'Documents needed';
  }

  /** StatusBadge takes a ClaimStatus; the payload only carries the raw code. */
  protected status(code: string): ClaimStatus {
    return toStatus(code);
  }

  decryptText(encText: string){
   return this.appService.decryptText(encText);
  }
}

