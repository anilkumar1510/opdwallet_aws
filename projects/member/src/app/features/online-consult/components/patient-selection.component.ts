import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Patient } from '../../../services/opd-consultation.service';

@Component({
  selector: 'opd-patient-selection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="mb-3 text-sm font-medium text-ink-700">Who is this consultation for?</p>
    <div class="space-y-2">
      @for (p of patients(); track p.id) {
        <button type="button" class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm" 
                [class.border-brand-500]="selectedPatient()?.id === p.id" 
                [class.bg-blue-50]="selectedPatient()?.id === p.id" 
                [class.border-surface-border]="selectedPatient()?.id !== p.id" 
                (click)="patientSelected.emit(p)">
          <span class="font-medium text-ink-900">{{ p.name }} <span class="text-xs text-ink-500">({{ p.rel }})</span></span>
          @if (selectedPatient()?.id === p.id) { <span class="text-brand-700">✓</span> }
        </button>
      }
    </div>
    <p class="mb-3 mt-5 border-t border-surface-border pt-4 text-sm font-medium text-ink-700">Consultation type</p>
    <div class="grid gap-3 sm:grid-cols-2">
      @for (m of ['Video', 'Audio']; track m) {
        <button type="button" class="min-h-touch rounded-xl border px-4 text-sm font-medium" 
                [class.border-brand-500]="mode() === m" 
                [class.bg-blue-50]="mode() === m" 
                [class.text-brand-700]="mode() === m" 
                [class.border-surface-border]="mode() !== m" 
                (click)="modeChanged.emit(m)">{{ m }}</button>
      }
    </div>
  `,
})
export class PatientSelectionComponent {
  patients = input<Patient[]>([]);
  selectedPatient = input<Patient | null>(null);
  mode = input<string>('');
  patientSelected = output<Patient>();
  modeChanged = output<string>();
}