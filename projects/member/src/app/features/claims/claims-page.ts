import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Claim } from '../../core/claims/claim.model';
import { ClaimsStore } from '../../core/claims/claims.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';
import { OriginalDocsNotice } from '../../shared/ui/original-docs-notice';
import { WalletPagination } from '../../shared/ui/wallet-pagination';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const CLAIMS_PAGE_SIZE = 10;

@Component({
  selector: 'opd-claims-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView, StatusBadge, BackLink, PageHeader, OriginalDocsNotice, WalletPagination],
  template: `
    <opd-page-header
      title="Claims"
      [subtitle]="'Reimbursements for ' + (store.claims.length ? patientName() : 'this member')"
    >
      <a
        routerLink="/member/claims/new"
        class="flex h-9 shrink-0 items-center rounded-full bg-white/20 px-4 text-[13px] font-semibold text-white"
        >New claim</a
      >
    </opd-page-header>

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <!-- Desktop keeps the reference portal's own black title. -->
      <div class="hidden flex-wrap items-start justify-between gap-3 lg:flex">
        <div class="min-w-0">
          <opd-back-link />
          <h1 class="text-2xl font-bold text-black lg:text-3xl">Claims</h1>
          <p class="mt-0.5 text-sm text-ink-500">
            Reimbursements for {{ store.claims.length ? patientName() : 'this member' }}
          </p>
        </div>
        <a
          routerLink="/member/claims/new"
          class="flex min-h-touch shrink-0 items-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
          >New claim</a
        >
      </div>

      @if (store.loading()) {
        <opd-loading label="Loading claims" />
      } @else if (store.error(); as error) {
        <opd-error [error]="error" (retry)="store.retry()" />
      } @else {
        @if (store.dashboardLoading()) {
          <opd-loading label="Loading dashboard" />
        } @else if (store.dashboardSummary(); as dashboard) {
          <div class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Total claims</p>
              <p class="mt-1 text-2xl font-semibold text-[#034DA2]">{{ dashboard.total }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">In progress</p>
              <p class="mt-1 text-2xl font-semibold text-[#303030]">{{ dashboard.inProgress }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Claimed</p>
              <p class="mt-1 text-2xl font-semibold text-[#303030]">{{ money(dashboard.claimedAmount) }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Approved</p>
              <p class="mt-1 text-2xl font-semibold text-success-700">{{ money(dashboard.approvedAmount) }}</p>
            </div>
          </div>
        }

        <!-- The API caps a bill above the per-claim limit on submit and says so
             only in that response; without this the member would see a smaller
             claimed amount than they filed, with no explanation. -->
        <!-- Policy needs originals as well as digital copies (renders nothing otherwise). -->
        <div class="mt-5">
          <opd-original-docs-notice variant="list" />
        </div>

        @if (store.capNotice(); as notice) {
          <p class="mt-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="status">
            {{ notice }}
          </p>
        }

        @if (store.getClimListDataLoading() && (!store.clailListData() || !store.clailListData().length)) {
          <div class="mt-6 space-y-3">
            <div class="h-20 animate-pulse rounded-2xl bg-white/70"></div>
            <div class="h-20 animate-pulse rounded-2xl bg-white/70"></div>
            <div class="h-20 animate-pulse rounded-2xl bg-white/70"></div>
          </div>
        } @else if (store.clailListData() && store.clailListData().length) {
          <ul class="mt-6 space-y-3">
            @for (claim of store.clailListData(); track claim.claim_id || claim.id || $index) {
              <li
                class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
              >
                <a
                  [routerLink]="['/member/claims', claim.claim_id || claim.id]"
                  class="flex items-start justify-between gap-3"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-base font-semibold text-[#034DA2]">
                      {{ claim?.category }}
                    </p>
                    <p class="mt-0.5 truncate text-sm text-ink-700">{{ claim?.provider }}</p>
                    <p class="mt-1 text-xs text-ink-500">
                      {{ claim?.claim_id || claim?.id }} · {{ date(claim?.treatment_date) }}
                      @if (claim?.documents && claim?.documents?.length) {
                        · {{ claim?.documents.length }} document{{ claim?.documents.length === 1 ? '' : 's' }}
                      }
                    </p>
                  </div>
                  <div class="shrink-0 text-right">
                    <opd-status-badge [status]="claim.status" />
                    <p class="mt-2 text-lg font-semibold text-[#303030]">
                      {{ money({ amount: claim?.original_bill_amount, currency: 'INR'})}}
                    </p>
                    @if (claim?.approvedAmount; as approved) {
                      <p class="text-xs text-success-700">{{ money(approved) }} approved</p>
                    }
                  </div>
                </a>
                <!-- A claim asking for its documents again also needs the originals. -->
                @if (asksForDocuments(claim)) {
                  <div class="mt-2 border-t border-[#EDF0F7] pt-2">
                    <opd-original-docs-notice variant="resubmit" />
                  </div>
                }
              </li>
            }
          </ul>

          <opd-wallet-pagination
            [page]="store.claimsPage()"
            [pageSize]="pageSize"
            [total]="store.totalClaimsCount()"
            [hasMore]="store.claimsHasMore()"
            [loading]="store.getClimListDataLoading()"
            ariaLabel="Claims pages"
            (pageChange)="onPageChange($event)"
          />
        } @else {
          <opd-empty
            title="No claims yet"
            detail="Reimbursement claims you submit will appear here."
          />
        }
      }
    </div>
  `,
})
export class ClaimsPage implements OnInit {
  protected readonly store = inject(ClaimsStore);
  protected readonly money = formatMoney;

  protected readonly pageSize = CLAIMS_PAGE_SIZE;

  ngOnInit(): void {
    void this.store.loadDashboard();
    void this.store.getClimListData(0, this.pageSize);
  }

  protected onPageChange(targetPage: number): void {
    this.store.goToClaimsPage(targetPage, this.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected patientName(): string {
    return 'this member';
  }

  /** Documents needed, or a resubmission asked for — either way the documents again. */
  protected asksForDocuments(claim: { claim_status?: string; status?: { label?: string } } | null): boolean {
    const raw = `${claim?.claim_status ?? ''} ${claim?.status?.label ?? ''}`.toUpperCase();
    return /DOCUMENTS_REQUIRED|DOCUMENTS NEEDED|RESUBMI/.test(raw);
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }

  protected trackClaim(claim: Claim): string {
    return claim.id;
  }
}
