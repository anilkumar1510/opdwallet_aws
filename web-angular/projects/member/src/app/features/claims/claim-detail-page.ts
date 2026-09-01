import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  RESUBMIT_DOCUMENT_TYPES,
  RESUBMIT_MAX_FILES,
  ResubmitDocumentType,
  validateResubmitFile,
} from '../../core/claims/claim.mapper';
import { ClaimDocument } from '../../core/claims/claim.model';
import { ClaimsStore } from '../../core/claims/claims.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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
            <!-- The member's reference (CLM-…), never the route's Mongo _id.
                 The route is addressed by _id because that is what the detail
                 endpoint takes; showing it would leak a storage key. -->
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ claim.value()?.reference }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (claim.isLoading()) {
          <opd-loading label="Loading claim" />
        } @else if (claim.value(); as detail) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ detail.categoryLabel }}</h2>
                <p class="mt-0.5 text-sm text-ink-700">{{ detail.providerName }}</p>
              </div>
              <opd-status-badge [status]="detail.status" />
            </div>

            <dl class="mt-5 space-y-3 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Patient</dt>
                <dd class="font-medium text-ink-900">{{ detail.patientName }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Claim type</dt>
                <dd class="font-medium text-ink-900">{{ detail.typeLabel }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Treatment date</dt>
                <dd class="font-medium text-ink-900">{{ date(detail.treatmentDate) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Submitted</dt>
                <dd class="font-medium text-ink-900">{{ date(detail.submittedAt) }}</dd>
              </div>
            </dl>
          </section>

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Amount</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Claimed</dt>
                <dd class="font-medium text-ink-900">{{ money(detail.billAmount) }}</dd>
              </div>
              @if (detail.approvedAmount; as approved) {
                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="font-semibold text-ink-900">Approved</dt>
                  <dd class="text-lg font-bold text-success-700">{{ money(approved) }}</dd>
                </div>
              } @else {
                <p class="border-t border-surface-border pt-2 text-xs text-ink-500">
                  Not assessed yet.
                </p>
              }
            </dl>
          </section>

          @if (detail.documentCount) {
            <!-- This used to be the COUNT and nothing else: "3 documents submitted
                 with this claim", beside no way to open any of them. The reference
                 lists them and links each one (claims/[id]/page.tsx:495-515). -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">
                {{ detail.documentCount }} document{{ detail.documentCount === 1 ? '' : 's' }}
                submitted with this claim
              </h2>
              @if (downloadError(); as error) {
                <p class="mb-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {{ error }}
                </p>
              }
              <ul class="space-y-2">
                @for (doc of detail.documents; track doc.fileName) {
                  <li
                    class="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2"
                  >
                    <span class="min-w-0">
                      <span class="block text-sm font-medium text-ink-900">{{ doc.label }}</span>
                      <span class="block truncate text-xs text-ink-500">{{ doc.fileName }}</span>
                    </span>
                    @if (doc.downloadPath) {
                      <button
                        type="button"
                        class="flex-shrink-0 text-xs font-medium text-primary-700 underline underline-offset-2 disabled:opacity-60"
                        [disabled]="downloading() === doc.fileName"
                        (click)="download(doc)"
                      >
                        {{ downloading() === doc.fileName ? 'Opening…' : 'Download' }}
                      </button>
                    }
                  </li>
                }
              </ul>
            </section>
          }

          @if (history.value(); as extra) {
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

          @if (detail.statusCode === 'DOCUMENTS_REQUIRED') {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
              <h2 class="text-sm font-semibold text-ink-900">Send the documents requested</h2>
              <p class="mt-1 text-sm text-ink-700">
                The assessor needs more before this claim can be settled. Attach what they asked
                for and it goes back for assessment.
              </p>

              @if (resubmitError(); as error) {
                <p
                  class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700"
                  role="alert"
                >
                  {{ error }}
                </p>
              }

              <label class="mt-3 block">
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
                  (change)="pickFiles($event)"
                  class="mt-1 block w-full text-sm text-ink-700 file:mr-3 file:min-h-touch file:rounded-xl file:border file:border-surface-border file:bg-white file:px-4 file:text-sm file:font-semibold file:text-ink-900"
                />
              </label>

              @if (chosen().length > 0) {
                <ul class="mt-2 flex flex-col gap-1">
                  @for (file of chosen(); track file.name) {
                    <li class="text-sm text-ink-700">{{ file.name }}</li>
                  }
                </ul>
              }

              <label class="mt-3 block">
                <span class="text-sm text-ink-700">Note for the assessor (optional)</span>
                <input
                  type="text"
                  [value]="resubmitNote()"
                  (input)="resubmitNote.set($any($event.target).value)"
                  class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
                />
              </label>

              <button
                type="button"
                class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="chosen().length === 0 || store.submitting()"
                (click)="sendDocuments(detail.reference)"
              >
                {{ store.submitting() ? 'Sending…' : 'Send documents' }}
              </button>
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
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  protected readonly money = formatMoney;

  protected readonly confirming = signal(false);
  protected readonly downloading = signal<string | null>(null);
  protected readonly downloadError = signal<string | null>(null);

  protected readonly chosen = signal<readonly File[]>([]);
  protected readonly documentTypes = RESUBMIT_DOCUMENT_TYPES;
  protected readonly documentType = signal<ResubmitDocumentType>('INVOICE');
  protected readonly resubmitNote = signal('');
  /**
   * Kept apart from `store.submitError()`, which the withdraw block already
   * renders — one shared signal would show a resubmission failure inside the
   * withdraw panel and vice versa.
   */
  protected readonly resubmitError = signal<string | null>(null);

  /**
   * The API caps the upload at 10 files and rejects anything that is not a PDF
   * or an image, with a message about file types that does not name the file.
   * Both are checked here so the member is told which file to change.
   */
  protected pickFiles(event: Event): void {
    const picked = Array.from((event.target as HTMLInputElement).files ?? []);
    this.resubmitError.set(null);
    if (picked.length > RESUBMIT_MAX_FILES) {
      this.resubmitError.set(`Send up to ${RESUBMIT_MAX_FILES} files at a time.`);
      this.chosen.set([]);
      return;
    }
    for (const file of picked) {
      const problem = validateResubmitFile(file);
      if (problem) {
        this.resubmitError.set(`${file.name}: ${problem}`);
        this.chosen.set([]);
        return;
      }
    }
    this.chosen.set(picked);
  }

  /** Business CLM-… reference, like withdraw — not the route's `_id`. */
  protected async sendDocuments(reference: string): Promise<void> {
    this.resubmitError.set(null);
    const sent = await this.store.resubmitDocuments(
      reference,
      this.chosen(),
      this.documentType(),
      this.resubmitNote(),
    );
    if (sent) {
      this.chosen.set([]);
      this.resubmitNote.set('');
      this.claim.reload();
    } else {
      this.resubmitError.set(this.store.submitError());
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

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Not recorded';
  }
}
