import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Speciality } from '../../../services/opd-consultation.service';

@Component({
  selector: 'opd-specialty-selection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <p class="mb-2 text-sm font-medium text-ink-700">Select speciality</p>
      <div class="grid grid-cols-2 gap-2">
        @for (s of specialities(); track s.speciality_code) {
          <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" 
            [class.border-brand-500]="selectedSpeciality() === s.speciality_code" 
            [class.bg-blue-50]="selectedSpeciality() === s.speciality_code" 
            [class.border-surface-border]="selectedSpeciality() !== s.speciality_code" 
            (click)="specialitySelected.emit(s.speciality_code)">
            {{ s.speciality_name }}
          </button>
        }
      </div>
    </div>
  `,
})
export class SpecialitySelectionComponent {
  specialities = input<Speciality[]>([]);
  selectedSpeciality = input<string>('');
  specialitySelected = output<string>();
}
