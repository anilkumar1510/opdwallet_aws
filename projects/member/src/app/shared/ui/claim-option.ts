import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BenefitCategory } from '../../core/domain/codes';
import { ClaimModeStore } from '../../core/member/claim-mode.store';

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
  `,
})
export class ClaimOption {
  readonly category = input.required<BenefitCategory>();
  /** The benefit's name, for the claims-only note. */
  readonly label = input.required<string>();
  /**
   * Whether the screen has something to book cashless. Left unset, the policy's
   * claim mode decides; a screen that knows better (e.g. the API offered a
   * bookable package) passes it so the claims-only note does not contradict it.
   */
  readonly cashlessAvailable = input<boolean | null>(null);

  protected readonly modes = inject(ClaimModeStore);
  protected readonly claimsOnly = computed(
    () => !(this.cashlessAvailable() ?? this.modes.allowsCashless(this.category())),
  );
}
