import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'opd-consult-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
      <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
        <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="back.emit()">←</button>
        <div class="min-w-0">
          <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Online Consultation</h1>
          <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Video or audio with a network doctor</p>
        </div>
      </div>
    </header>
  `,
})
export class ConsultHeaderComponent {
  back = output<void>();
}
