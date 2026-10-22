import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Speciality } from '../../../services/opd-consultation.service';

@Component({
  selector: 'opd-speciality-selection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="mb-2 text-sm font-medium text-ink-700">Select speciality</p>
    <div class="grid grid-cols-2 gap-2">
      @for (s of specialities(); track s.speciality_code || s.code || s.id) {
        <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" 
          [class.border-brand-500]="isSelected(s)" 
          [class.bg-blue-50]="isSelected(s)" 
          [class.border-surface-border]="!isSelected(s)" 
          (click)="specialitySelected.emit(s.speciality_code || s.code || '')">
          {{ s.display || s.speciality_name }}
        </button>
      }
    </div>
  `,
})
export class SpecialitySelectionComponent {
  specialities = input<Speciality[]>([]);
  selectedSpeciality = input<string>('');
  specialitySelected = output<string>();

  protected isSelected(s: Speciality): boolean {
    const sel = (this.selectedSpeciality() || '').trim().toLowerCase();
    if (!sel) return false;
    const code = (s.speciality_code || s.code || '').trim().toLowerCase();
    const name = (s.speciality_name || s.display || '').trim().toLowerCase();
    return sel === code || sel === name;
  }
}
