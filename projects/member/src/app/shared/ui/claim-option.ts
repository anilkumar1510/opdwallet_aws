import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BenefitCategory } from '../../core/domain/codes';
import { ClaimMode, ClaimModeStore } from '../../core/member/claim-mode.store';
import { PolicyStore } from '../../core/member/policy.store';

/**
 * The reimbursement route on a benefit's landing screen, under its cashless
 * button. Shown when the policy allows claims for the benefit; when it allows
 * claims only, it is the primary action and says why there is nothing to book.
 */
@Component({
  selector: 'opd-claim-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (claimsOnly()) {
      <p class="mb-3 rounded-xl border border-[#CDDDFE] bg-[#F3F7FF] px-4 py-3 text-sm text-[#034DA2]">
        Your policy covers {{ label() }} by claims only — pay the provider, then file a claim.
      </p>
    }
    @if (modes.allowsClaims(category())) {
      <a
        routerLink="/member/claims"
        class="flex min-h-touch w-full items-center justify-center rounded-xl px-6 text-sm font-semibold"
        [class.mt-3]="!claimsOnly()"
        [class.bg-[#0F5FDC]]="claimsOnly()"
        [class.text-white]="claimsOnly()"
        [class.hover:bg-[#034DA2]]="claimsOnly()"
        [class.border]="!claimsOnly()"
        [class.border-[#0F5FDC]]="!claimsOnly()"
        [class.bg-white]="!claimsOnly()"
        [class.text-[#0F5FDC]]="!claimsOnly()"
        [class.hover:bg-blue-50]="!claimsOnly()"
        >File a claim →</a
      >
      @if (!claimsOnly()) {
        <p class="mt-2 text-center text-xs text-ink-500">Paid the provider yourself? Claim it back.</p>
      }
    }

    <!-- Dynamic Policy Coverage & QA Test Override -->
    <div class="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 min-w-0">
          <span
            class="inline-block h-2 w-2 rounded-full shrink-0"
            [class.bg-emerald-500]="!isOverridden()"
            [class.bg-amber-500]="isOverridden()"
          ></span>
          <span class="text-xs font-semibold text-slate-800 truncate">
            {{ policyNumber() ? policyNumber() + ' Coverage' : 'Policy Coverage' }}:
          </span>
          <span
            class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
            [class.bg-blue-50]="policyMode() === 'both'"
            [class.text-[#034DA2]]="policyMode() === 'both'"
            [class.bg-amber-50]="policyMode() === 'claims'"
            [class.text-amber-800]="policyMode() === 'claims'"
            [class.bg-emerald-50]="policyMode() === 'cashless'"
            [class.text-emerald-800]="policyMode() === 'cashless'"
          >
            {{ modeLabel(policyMode()) }}
          </span>
        </div>
        @if (isOverridden()) {
          <button
            type="button"
            class="text-[11px] font-medium text-[#034DA2] underline hover:text-[#023877]"
            (click)="modes.resetOverride()"
          >
            Reset
          </button>
        }
      </div>

      <!-- QA Testing Controls: Only show options provided by policy -->
      <div class="mt-2.5 border-t border-slate-100 pt-2">
        <div class="flex items-center justify-between gap-1 mb-1.5">
          @if (isOverridden()) {
            <span class="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Active Override</span>
          }
        </div>
        <div class="flex flex-wrap gap-1.5">
          @for (m of availableModes(); track m.value) {
            <button
              type="button"
              class="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all"
              [class.border-[#034DA2]]="current() === m.value && !isOverridden()"
              [class.bg-[#034DA2]]="current() === m.value && !isOverridden()"
              [class.text-white]="current() === m.value && !isOverridden()"
              [class.border-amber-600]="current() === m.value && isOverridden()"
              [class.bg-amber-600]="current() === m.value && isOverridden()"
              [class.text-white]="current() === m.value && isOverridden()"
              [class.border-slate-200]="current() !== m.value"
              [class.text-slate-600]="current() !== m.value"
              [class.hover:bg-slate-50]="current() !== m.value"
              (click)="selectMode(m.value)"
            >
              {{ m.label }}@if (m.value === policyMode()) { (Default) }
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class ClaimOption {
  readonly category = input.required<BenefitCategory>();
  /** The benefit's name, for the claims-only note. */
  readonly label = input.required<string>();

  protected readonly modes = inject(ClaimModeStore);
  protected readonly policyStore = inject(PolicyStore);

  protected readonly claimsOnly = computed(() => !this.modes.allowsCashless(this.category()));
  protected readonly current = computed(() => this.modes.modeFor(this.category()));
  protected readonly policyMode = computed(() => this.modes.policyModeFor(this.category()));
  protected readonly isOverridden = computed(() => this.modes.isOverriddenFor(this.category()));

  protected readonly policyNumber = computed(() => this.policyStore.version()?.policy_number ?? null);

  protected readonly availableModes = computed(() => {
    const allowed = this.modes.allowedModesFor(this.category());
    return allowed.map((val) => ({
      value: val,
      label: this.modeLabel(val),
    }));
  });

  protected selectMode(mode: ClaimMode): void {
    if (mode === this.policyMode()) {
      this.modes.resetOverride();
    } else {
      this.modes.setDemoOverride(mode);
    }
  }

  protected modeLabel(mode: ClaimMode): string {
    switch (mode) {
      case 'claims':
        return 'Claims';
      case 'cashless':
        return 'Cashless';
      case 'both':
        return 'Cashless + claims';
    }
  }
}
