import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Claim } from '../../core/claims/claim.model';
import { ClaimsStore } from '../../core/claims/claims.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

@Component({
  selector: 'opd-claims-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, ErrorView, EmptyView, StatusBadge, BackLink, PageHeader],
  template: `
    <opd-page-header
      title="Claims"
      [subtitle]="'Reimbursements for ' + (store.claims().length ? patientName() : 'this member')"
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
            Reimbursements for {{ store.claims().length ? patientName() : 'this member' }}
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
        @if (store.summary(); as summary) {
          <div class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Total claims</p>
              <p class="mt-1 text-2xl font-semibold text-[#034DA2]">{{ summary.total }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">In progress</p>
              <p class="mt-1 text-2xl font-semibold text-[#303030]">{{ summary.inProgress }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Claimed</p>
              <p class="mt-1 text-2xl font-semibold text-[#303030]">{{ money(summary.claimedAmount) }}</p>
            </div>
            <div class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)">
              <p class="text-xs text-ink-500">Approved</p>
              <p class="mt-1 text-2xl font-semibold text-success-700">{{ money(summary.approvedAmount) }}</p>
            </div>
          </div>
        }

        <!-- The API caps a bill above the per-claim limit on submit and says so
             only in that response; without this the member would see a smaller
             claimed amount than they filed, with no explanation. -->
        @if (store.capNotice(); as notice) {
          <p class="mt-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="status">
            {{ notice }}
          </p>
        }

        @if (store.claims().length) {
          <ul class="mt-6 space-y-3">
            @for (claim of store.claims(); track claim.id) {
              <li
                class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
              >
                <a
                  [routerLink]="['/member/claims', claim.id]"
                  class="flex items-start justify-between gap-3"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-base font-semibold text-[#034DA2]">
                      {{ claim.categoryLabel }}
                    </p>
                    <p class="mt-0.5 truncate text-sm text-ink-700">{{ claim.providerName }}</p>
                    <p class="mt-1 text-xs text-ink-500">
                      {{ claim.reference }} · {{ date(claim.treatmentDate) }}
                      @if (claim.documentCount) {
                        · {{ claim.documentCount }} document{{ claim.documentCount === 1 ? '' : 's' }}
                      }
                    </p>
                  </div>
                  <div class="shrink-0 text-right">
                    <opd-status-badge [status]="claim.status" />
                    <p class="mt-2 text-lg font-semibold text-[#303030]">
                      {{ money(claim.billAmount) }}
                    </p>
                    @if (claim.approvedAmount; as approved) {
                      <p class="text-xs text-success-700">{{ money(approved) }} approved</p>
                    }
                  </div>
                </a>
              </li>
            }
          </ul>
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
export class ClaimsPage {
  protected readonly store = inject(ClaimsStore);
  protected readonly money = formatMoney;

  protected patientName(): string {
    return this.store.claims()[0]?.patientName ?? 'this member';
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }

  protected trackClaim(claim: Claim): string {
    return claim.id;
  }
}
