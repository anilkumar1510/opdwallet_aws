import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ClaimStatus } from '../../core/claims/claim.model';

const TONES: Readonly<Record<string, string>> = {
  neutral: 'bg-gray-100 text-gray-700',
  progress: 'bg-blue-50 text-[#034DA2]',
  positive: 'bg-success-50 text-success-700',
  negative: 'bg-danger-50 text-danger-700',
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
