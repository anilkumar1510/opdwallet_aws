import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'opd-consult-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!started()) {
      <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
        <p class="text-sm text-ink-700">Online Consultation coverage</p>
        <p class="mt-1 text-2xl font-bold text-[#034DA2]">₹5,000 <span class="text-sm font-normal text-ink-500">left this year</span></p>
        <p class="mt-1 text-xs text-ink-500">Up to ₹{{ perTxn }} per consultation from wallet · {{ copayPct }}% co-payment</p>
      </div>

      <button type="button" class="min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start.emit()">
        Find a doctor →
      </button>
    }
  `,
})
export class ConsultBannerComponent {
  started = input<boolean>(false);
  perTxn = input<number>(300);
  copayPct = input<number>(20);
  start = output<void>();
}
