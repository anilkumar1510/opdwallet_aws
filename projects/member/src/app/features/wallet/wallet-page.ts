import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { formatMoney, money } from '../../core/domain/money';
import { STATIC_WALLET_TOTAL } from '../../core/member/static-policy.data';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

/**
 * Wallet — DUMMY / STATIC, redesigned, zero backend.
 *
 * Replaces the WalletStore / FamilyStore / transactions-ledger version. The hero
 * pool and the per-benefit limits are served from static-policy.data.ts. See
 * REMOVED-APIS.md.
 */
@Component({
  selector: 'opd-wallet-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BackLink, PageHeader],
  template: `
    <opd-page-header title="Wallet" subtitle="Shivam Jha" />

    <div class="mx-auto w-full max-w-[720px] px-5 pb-8 pt-6 lg:px-8">
      <div class="mb-4 hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Wallet</h1>
        <p class="mt-0.5 text-sm text-ink-500">Shivam Jha · Cover until 30 Jun 2027</p>
      </div>

      <!-- ── Hero balance ────────────────────────────────────────────────── -->
      <section
        class="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm"
        style="background: linear-gradient(135deg,#1F77E0 0%,#0E51A2 60%,#08356E 100%)"
      >
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div class="absolute -bottom-14 -left-6 h-40 w-40 rounded-full bg-white/5"></div>

        <div class="relative">
          <p class="text-xs font-medium uppercase tracking-wide text-white/70">Available balance</p>
          <p class="mt-1 text-4xl font-bold leading-none">{{ amount(total.available) }}</p>
          <p class="mt-1 text-xs text-white/70">of {{ amount(total.allocated) }} allocated this year</p>

          <div class="mt-5 h-2.5 overflow-hidden rounded-full bg-white/20">
            <div class="h-full rounded-full bg-[#7EE3B8]" [style.width.%]="usedPercent()"></div>
          </div>
          <div class="mt-2 flex justify-between text-xs text-white/80">
            <span>{{ usedPercent() }}% used</span>
            <span>{{ amount(total.available) }} left</span>
          </div>
        </div>
      </section>

      <!-- ── Stat tiles ──────────────────────────────────────────────────── -->
      <div class="mt-4 grid grid-cols-3 gap-3">
        <div class="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)">
          <p class="text-xs text-ink-500">Allocated</p>
          <p class="mt-1 text-lg font-semibold text-[#034DA2]">{{ amount(total.allocated) }}</p>
        </div>
        <div class="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)">
          <p class="text-xs text-ink-500">Used</p>
          <p class="mt-1 text-lg font-semibold text-[#303030]">{{ amount(used()) }}</p>
        </div>
        <div class="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center" style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)">
          <p class="text-xs text-ink-500">Left</p>
          <p class="mt-1 text-lg font-semibold text-success-700">{{ amount(total.available) }}</p>
        </div>
      </div>

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
  protected readonly total = STATIC_WALLET_TOTAL;

  protected readonly used = computed(() =>
    money(Math.max(0, this.total.allocated.amount - this.total.available.amount)),
  );

  protected readonly usedPercent = computed(() => {
    const a = this.total.allocated.amount;
    return a ? Math.round(((a - this.total.available.amount) / a) * 100) : 0;
  });
}
