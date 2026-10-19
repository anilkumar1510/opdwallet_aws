import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ClaimStatus } from '../../core/claims/claim.model';

const TONES: Readonly<Record<string, string>> = {
  neutral: 'bg-gray-100 text-gray-700',
  progress: 'bg-amber-100 text-amber-700',
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-rose-100 text-rose-700',
};

@Component({
  selector: 'opd-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium"
      [class]="classes()"
      >{{ status().label }}</span
    >
  `,
})
export class StatusBadge {
  readonly status = input.required<ClaimStatus>();

  protected readonly classes = computed(() => TONES[this.status().tone] ?? TONES['neutral']);
}
