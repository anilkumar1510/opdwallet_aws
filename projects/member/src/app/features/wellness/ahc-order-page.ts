import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AhcStore } from '../../core/ahc/ahc.store';
import { AHC_API, AhcLeg } from '../../core/ahc/ahc';
import { formatMoney, money } from '../../core/domain/money';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * A placed annual health check order — patient-flows flow 8, after step 10.
 *
 * This route was a placeholder until the API's ownership check was fixed: it
 * populated `userId` into a document and compared it as a string, so every
 * member was told their own order was unauthorised.
 *
 * Reports are listed and openable. The API's `reports/:orderId/{lab,diagnostic}`
 * routes return metadata, and the `/download` routes beside them stream the
 * file — so the screen knows a report exists before it offers to open it, and
 * the thing it opens is the one it described.
 */
@Component({
  selector: 'opd-ahc-order-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/wellness"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to health check"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Your health check
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ order.value()?.orderId }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (order.isLoading()) {
          <opd-loading label="Loading your health check" />
        } @else if (order.value(); as detail) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold text-[#0B2C63]">{{ detail.packageName }}</h2>
                <p class="mt-0.5 text-sm text-ink-700">Booked {{ date(detail.placedAt) }}</p>
              </div>
              <span
                class="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#034DA2]"
                >{{ detail.statusLabel }}</span
              >
            </div>

            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Package total</dt>
                <dd class="font-medium text-ink-900">{{ amount(detail.total) }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Paid from wallet</dt>
                <dd class="font-medium text-ink-900">{{ amount(detail.walletPaid) }}</dd>
              </div>
              @if (detail.copayPaid > 0) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">You paid</dt>
                  <dd class="font-medium text-ink-900">{{ amount(detail.copayPaid) }}</dd>
                </div>
              }
            </dl>
          </section>

          @if (downloadError(); as problem) {
            <p class="mt-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
              {{ problem }}
            </p>
          }

          @for (leg of legs(detail); track leg.title) {
            @if (leg.value.booked) {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">{{ leg.title }}</h2>
                  <span class="text-xs font-medium text-ink-500">{{ leg.value.statusLabel }}</span>
                </div>
                <p class="mt-1 text-sm text-ink-700">{{ leg.value.vendorName }}</p>
                @if (leg.value.whenLabel) {
                  <p class="text-sm text-ink-500">{{ leg.value.whenLabel }}</p>
                }

                @if (leg.value.report; as report) {
                  <div
                    class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-success-50 px-4 py-3"
                  >
                    <span class="min-w-0 text-sm text-success-700">{{ report.name }} is ready.</span>
                    <button
                      type="button"
                      class="shrink-0 text-xs font-medium text-success-700 underline underline-offset-2 disabled:opacity-60"
                      [disabled]="downloading() === leg.key"
                      (click)="openReport(detail.orderId, leg.key, report.name)"
                    >
                      {{ downloading() === leg.key ? 'Opening...' : 'Open' }}
                    </button>
                  </div>
                } @else {
                  <p class="mt-4 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                    The report is not ready yet. It appears here once the centre uploads it.
                  </p>
                }
              </section>
            }
          }
        } @else {
          <opd-empty
            title="Health check not found"
            detail="We could not find that health check order."
          />
        }
      </div>
    </div>
  `,
})
export class AhcOrderPage {
  readonly orderId = input<string>('');

  private readonly store = inject(AhcStore);
  private readonly http = inject(HttpClient);

  protected readonly downloading = signal<string | null>(null);
  protected readonly downloadError = signal<string | null>(null);

  protected readonly order = resource({
    params: () => ({ id: this.orderId() }),
    loader: ({ params }) => this.store.orderById(params.id),
  });

  /** Both legs in one list so the template renders them identically. */
  protected legs(detail: { lab: AhcLeg; diagnostic: AhcLeg }) {
    return [
      { title: 'Pathology', key: 'lab' as const, value: detail.lab },
      { title: 'Radiology', key: 'diagnostic' as const, value: detail.diagnostic },
    ];
  }

  /**
   * Fetches the leg's latest report and hands it to the browser. Blob rather
   * than a plain link, matching the claims and lab downloads: the route is
   * behind the session cookie, and a failure is said out loud instead of
   * opening a blank tab.
   */
  protected async openReport(
    orderId: string,
    leg: 'lab' | 'diagnostic',
    name: string,
  ): Promise<void> {
    this.downloadError.set(null);
    this.downloading.set(leg);
    try {
      const url =
        leg === 'lab' ? AHC_API.labReportFile(orderId) : AHC_API.diagnosticReportFile(orderId);
      const blob = await firstValueFrom(this.http.get(url, { responseType: 'blob' }));
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      this.downloadError.set('We could not open that report. Try again in a moment.');
    } finally {
      this.downloading.set(null);
    }
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }

  protected amount(value: number): string {
    return formatMoney(money(value));
  }
}
