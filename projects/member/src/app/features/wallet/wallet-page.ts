import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { formatMoney, money } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { PolicyStore } from '../../core/member/policy.store';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';
import { EmptyView, ErrorView } from '../../shared/ui/state-views';

/**
 * Wallet — connected to PolicyStore, reflecting the active HCL policy floater balance.
 */
@Component({
  selector: 'opd-wallet-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BackLink, PageHeader, ErrorView, EmptyView],
  template: `
    <opd-page-header title="Wallet" [subtitle]="memberName()" />

    <div class="mx-auto w-full max-w-[720px] px-5 pb-8 pt-6 lg:px-8">
      <div class="mb-4 hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Wallet</h1>
        <p class="mt-0.5 text-sm text-ink-500">
          {{ memberName() }}
          @if (validTill(); as till) {
            · Cover until {{ till }}
          }
        </p>
      </div>

      @if (isLoading()) {
        <!-- ── SKELETON: Hero balance ────────────────────────────────────── -->
        <section class="relative overflow-hidden rounded-3xl bg-slate-200/90 p-6 animate-pulse" role="status" aria-label="Loading wallet balance">
          <div class="h-3.5 w-32 rounded bg-slate-300"></div>
          <div class="mt-3 h-10 w-48 rounded bg-slate-300"></div>
          <div class="mt-2 h-3.5 w-40 rounded bg-slate-300"></div>

          <div class="mt-6 h-2.5 rounded-full bg-slate-300"></div>
          <div class="mt-3 flex justify-between">
            <div class="h-3.5 w-16 rounded bg-slate-300"></div>
            <div class="h-3.5 w-20 rounded bg-slate-300"></div>
          </div>
        </section>

        <!-- ── SKELETON: Stat tiles ──────────────────────────────────────── -->
        <div class="mt-4 grid grid-cols-3 gap-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center animate-pulse">
              <div class="mx-auto h-3 w-16 rounded bg-slate-200"></div>
              <div class="mx-auto mt-2 h-6 w-20 rounded bg-slate-200"></div>
            </div>
          }
        </div>
      } @else if (error(); as err) {
        <opd-error [error]="err" (retry)="retry()" />
      } @else if (!hasPolicy()) {
        <opd-empty
          title="No active wallet"
          detail="No OPD policy or wallet is currently assigned to this account."
        />
      } @else {
        <!-- ── Hero balance ────────────────────────────────────────────────── -->
        <section
          class="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm"
          style="background: linear-gradient(135deg,#1F77E0 0%,#0E51A2 60%,#08356E 100%)"
        >
          <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
          <div class="absolute -bottom-14 -left-6 h-40 w-40 rounded-full bg-white/5"></div>

          <div class="relative">
            <p class="text-xs font-medium uppercase tracking-wide text-white/70">Available balance</p>
            <p class="mt-1 text-4xl font-bold leading-none">{{ amount(total().available) }}</p>
            <p class="mt-1 text-xs text-white/70">of {{ amount(total().allocated) }} allocated this year</p>

            <div class="mt-5 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div class="h-full rounded-full bg-[#7EE3B8]" [style.width.%]="usedPercent()"></div>
            </div>
            <div class="mt-2 flex justify-between text-xs text-white/80">
              <span>{{ usedPercent() }}% used</span>
              <span>{{ amount(total().available) }} left</span>
            </div>
          </div>
        </section>

        <!-- ── Stat tiles ──────────────────────────────────────────────────── -->
        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)">
            <p class="text-xs text-ink-500">Allocated</p>
            <p class="mt-1 text-lg font-semibold text-[#034DA2]">{{ amount(total().allocated) }}</p>
          </div>
          <div class="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)">
            <p class="text-xs text-ink-500">Used</p>
            <p class="mt-1 text-lg font-semibold text-[#303030]">{{ amount(used()) }}</p>
          </div>
          <div class="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)">
            <p class="text-xs text-ink-500">Left</p>
            <p class="mt-1 text-lg font-semibold text-success-700">{{ amount(total().available) }}</p>
          </div>
        </div>
      }

      <!-- ── Recent activity ─────────────────────────────────────────────── -->
      <section class="mt-6">
        <h2 class="mb-3 text-[17px] font-semibold text-[#1c1c1c]">Recent activity</h2>
        <div class="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
          <p class="text-2xl">🧾</p>
          <p class="mt-2 text-sm font-medium text-ink-900">No transactions yet</p>
          <p class="mt-0.5 text-xs text-ink-500">Wallet debits and credits from your bookings and claims will appear here.</p>
        </div>
      </section>
    </div>
  `,
})
export class WalletPage {
  protected readonly amount = formatMoney;
  protected readonly policyStore = inject(PolicyStore);
  protected readonly family = inject(FamilyStore);

  protected readonly memberName = computed(() => this.family.activeMember()?.fullName ?? 'Member');
  protected readonly validTill = computed(() => this.policyStore.detail()?.validTill ?? null);

  protected readonly isLoading = computed(() => this.family.loading() || this.policyStore.loading());
  protected readonly error = computed(() => this.policyStore.error() ?? this.family.error());

  protected readonly total = computed(() => this.policyStore.walletTotal());

  protected readonly hasPolicy = computed(() => !!this.policyStore.version() && this.total().allocated.amount > 0);

  protected readonly used = computed(() =>
    money(Math.max(0, this.total().allocated.amount - this.total().available.amount)),
  );

  protected readonly usedPercent = computed(() => {
    const a = this.total().allocated.amount;
    return a ? Math.round(((a - this.total().available.amount) / a) * 100) : 0;
  });

  protected retry(): void {
    if (this.family.error()) {
      this.family.retry();
    } else {
      this.policyStore.retry();
    }
  }
}
