import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'opd-wizard-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-bold text-[#034DA2]">{{ title() }}</h2>
      <span class="text-xs text-ink-500">Step {{ stepIndex() + 1 }} of {{ totalSteps() }}</span>
    </div>

    <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
      <ng-content></ng-content>
    </section>

    @if (showBackNext()) {
      <div class="mt-5 flex gap-3">
        <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]" (click)="back.emit()">Back</button>
        <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="next.emit()">{{ primaryLabel() }}</button>
      </div>
    }
  `,
})
export class WizardStepComponent {
  title = input<string>('');
  stepIndex = input<number>(0);
  totalSteps = input<number>(0);
  showBackNext = input<boolean>(true);
  primaryLabel = input<string>('Continue');
  back = output<void>();
  next = output<void>();
}
