import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'opd-consult-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
      <p class="text-sm text-ink-700">Online Consultation coverage</p>
      <p class="mt-1 text-2xl font-bold text-[#034DA2]">₹5,000 <span class="text-sm font-normal text-ink-500">left this year</span></p>
      <p class="mt-1 text-xs text-ink-500">Up to ₹{{ perTxn() }} per consultation from wallet · {{ copayPct() }}% co-payment</p>
    </div>
  `,
})
export class ConsultBannerComponent {
  perTxn = input<number>(0);
  copayPct = input<number>(0);
}
