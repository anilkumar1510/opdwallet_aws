import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BenefitCategory } from '../../core/domain/codes';
import { ClaimMode, ClaimModeStore } from '../../core/member/claim-mode.store';

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
        Your policy covers {{ label() }} by reimbursement only — pay the provider, then file a claim.
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

    <!-- DEMO — the policy's claim mode is not served by the API yet. -->
    <div class="mt-5 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2">
      <p class="text-[11px] font-medium text-warning-700">🧪 Demo — this policy is</p>
      <div class="mt-1.5 flex flex-wrap gap-1.5">
        @for (m of demoModes; track m.value) {
          <button
            type="button"
            class="rounded-full border px-2.5 py-1 text-[11px] font-medium"
            [class.border-warning-700]="current() === m.value"
            [class.bg-white]="current() === m.value"
            [class.text-warning-700]="current() === m.value"
            [class.border-transparent]="current() !== m.value"
            [class.text-ink-500]="current() !== m.value"
            [attr.aria-pressed]="current() === m.value"
            (click)="modes.setDemoOverride(m.value)"
          >{{ m.label }}</button>
        }
      </div>
    </div>
  `,
})
export class ClaimOption {
  readonly category = input.required<BenefitCategory>();
  /** The benefit's name, for the claims-only note. */
  readonly label = input.required<string>();

  protected readonly modes = inject(ClaimModeStore);
  protected readonly claimsOnly = computed(() => !this.modes.allowsCashless(this.category()));
  protected readonly current = computed(() => this.modes.modeFor(this.category()));

  protected readonly demoModes: readonly { value: ClaimMode; label: string }[] = [
    { value: 'cashless', label: 'Cashless only' },
    { value: 'reimbursement', label: 'Claims only' },
    { value: 'both', label: 'Cashless + claims' },
  ];
}
