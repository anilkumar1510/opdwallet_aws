import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { formatMoney } from '../../core/domain/money';
import { LabKind, LabOrder, LabReport } from '../../core/lab/lab.model';
import { REPORT_DOWNLOAD_API } from '../../core/lab/lab.mapper';
import { LabStore } from '../../core/lab/lab.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const DATETIME = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** Screen 6: one order, its tests, collection details and payment split. */
@Component({
  selector: 'opd-lab-order-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView, StatusBadge],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath(), 'orders']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to orders"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Order Details</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ orderId() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (order.isLoading()) {
          <opd-loading label="Loading order" />
        } @else if (order.value(); as detail) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ detail.vendorName }}</h2>
                <p class="mt-0.5 text-xs text-ink-500">Placed {{ date(detail.placedAt) }}</p>
              </div>
              <opd-status-badge [status]="detail.status" />
            </div>

            <ul class="mt-4 divide-y divide-surface-border border-t border-surface-border">
              @for (test of detail.tests; track test.id) {
                <li class="flex items-center justify-between gap-3 py-3 text-sm">
                  <span class="min-w-0 truncate text-ink-900">{{ test.name }}</span>
                  <span class="shrink-0 font-medium text-ink-700">{{ money(test.price) }}</span>
                </li>
              }
            </ul>
          </section>

          @if (detail.collectionLabel || detail.collectionAt) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Collection</h2>
              <dl class="space-y-2 text-sm">
                @if (detail.collectionLabel) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Type</dt>
                    <dd class="font-medium text-ink-900">{{ detail.collectionLabel }}</dd>
                  </div>
                }
                @if (detail.collectionAt; as at) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Scheduled</dt>
                    <dd class="font-medium text-ink-900">{{ dateTime(at) }}</dd>
                  </div>
                }
              </dl>
            </section>
          }

          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">Payment</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Total</dt>
                <dd class="font-medium text-ink-900">{{ money(detail.total) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Paid from wallet</dt>
                <dd class="font-medium text-success-700">{{ money(detail.fromWallet) }}</dd>
              </div>
              <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                <dt class="font-semibold text-ink-900">You pay</dt>
                <dd class="text-lg font-bold text-[#0B2C63]">{{ money(detail.youPay) }}</dd>
              </div>
              @if (detail.paymentStatus; as payment) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Status</dt>
                  <dd><opd-status-badge [status]="payment" /></dd>
                </div>
              }
            </dl>
          </section>

          <!--
            Sheet flow 7, step 15 - "Report delivered ... stored in health
            records". Reports are listed and openable on both kinds now; the
            API gained a download route that loads the order, checks ownership
            and streams the file. Before that this showed a bare count beside no
            way to open anything - the same defect fixed once already on claims.
          -->
          @if (detail.reports.length) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:text-lg">
                {{ detail.reports.length }} report{{ detail.reports.length === 1 ? '' : 's' }} for
                this order
              </h2>

              @if (downloadError(); as problem) {
                <p class="mb-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                  {{ problem }}
                </p>
              }

              <ul class="space-y-2">
                @for (report of detail.reports; track report.id) {
                  <li
                    class="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2"
                  >
                    <span class="min-w-0">
                      <span class="block truncate text-sm font-medium text-ink-900">{{
                        report.name
                      }}</span>
                      @if (report.uploadedAt; as at) {
                        <span class="block text-xs text-ink-500">{{ dateTime(at) }}</span>
                      }
                    </span>
                    <button
                      type="button"
                      class="flex-shrink-0 text-xs font-medium text-primary-700 underline underline-offset-2 disabled:opacity-60"
                      [disabled]="downloading() === report.id"
                      (click)="downloadReport(detail.reference, report)"
                    >
                      {{ downloading() === report.id ? 'Opening...' : 'Open' }}
                    </button>
                  </li>
                }
              </ul>
            </section>
          }

          @if (canCancel(detail)) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
              @if (cancelMessage(); as note) {
                <p class="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-[#034DA2]" role="status">
                  {{ note }}
                </p>
              }

              @if (confirming()) {
                <p class="text-sm font-medium text-ink-900">Cancel this order?</p>
                <p class="mt-1 text-sm text-ink-700">
                  Your slot is released and any amount taken is returned to your wallet.
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
                    [disabled]="cancelling()"
                    (click)="cancelOrder(detail.reference)"
                  >
                    {{ cancelling() ? 'Cancelling…' : 'Yes, cancel it' }}
                  </button>
                  <button
                    type="button"
                    class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
                    [disabled]="cancelling()"
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
                  Cancel this order
                </button>
              }
            </section>
          }
        } @else {
          <opd-empty title="Order not found" detail="We could not find that order." />
        }
      </div>
    </div>
  `,
})
export class LabOrderDetailPage {
  readonly orderId = input<string>('');
  readonly kind = input<LabKind>(LabKind.Lab);

  private readonly store = inject(LabStore);
  private readonly http = inject(HttpClient);
  protected readonly money = formatMoney;

  protected readonly basePath = computed(() =>
    this.kind() === LabKind.Lab ? 'lab-tests' : 'diagnostics',
  );

  protected readonly order = resource({
    params: () => ({ id: this.orderId(), kind: this.kind() }),
    loader: ({ params }) => this.store.orderById(params.id, params.kind),
  });

  protected readonly downloading = signal<string | null>(null);
  protected readonly downloadError = signal<string | null>(null);
  protected readonly confirming = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly reason = signal('');
  protected readonly cancelMessage = signal<string | null>(null);

  /**
   * Radiology only — pathology has no cancel endpoint at all — and only while
   * the order is still in play. `status.isFinal` already encodes the terminal
   * states (completed, cancelled), so this does not re-list them and drift.
   */
  protected canCancel(detail: LabOrder): boolean {
    return this.kind() === LabKind.Diagnostic && !detail.status.isFinal;
  }

  /**
   * Fetches one report and hands it to the browser.
   *
   * Blob rather than a plain link, matching the claims download: the route is
   * behind the session cookie, and a failure is said out loud instead of
   * opening a blank tab. Takes the BUSINESS orderId - `reference`, not `id`.
   */
  protected async downloadReport(reference: string, report: LabReport): Promise<void> {
    this.downloadError.set(null);
    this.downloading.set(report.id);
    try {
      const blob = await firstValueFrom(
        this.http.get(REPORT_DOWNLOAD_API[this.kind()](reference, report.id), {
          responseType: 'blob',
        }),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      this.downloadError.set('We could not open that report. Try again in a moment.');
    } finally {
      this.downloading.set(null);
    }
  }

  /**
   * Takes the BUSINESS orderId (DIAG-ORD-…), which the model calls `reference`.
   * `detail.id` is the Mongo _id and the endpoint does not accept it.
   */
  protected async cancelOrder(reference: string): Promise<void> {
    this.cancelling.set(true);
    this.cancelMessage.set(null);
    try {
      const result = await this.store.cancelOrder(reference, this.reason());
      this.cancelMessage.set(result.message);
      if (result.ok) {
        this.confirming.set(false);
        this.order.reload();
      }
    } finally {
      this.cancelling.set(false);
    }
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }

  protected dateTime(value: Date): string {
    return DATETIME.format(value);
  }
}
