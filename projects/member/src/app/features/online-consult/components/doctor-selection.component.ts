import { ChangeDetectionStrategy, Component, input, output, model } from '@angular/core';
import { Doctor } from '../../../services/opd-consultation.service';

@Component({
  selector: 'opd-doctor-selection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="mb-2 text-sm font-medium text-ink-700">{{ speciality() }} — available doctors</p>
    <input class="mb-3 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Search doctor by name" [value]="search()" (input)="searchChanged.emit($any($event.target).value)" />
    
    <div class="space-y-2">
      @for (d of doctors(); track d.id) {
        <button type="button" class="w-full rounded-xl border px-4 py-3 text-left" 
                [class.border-brand-500]="selectedDoctor()?.id === d.id" 
                [class.bg-blue-50]="selectedDoctor()?.id === d.id" 
                [class.border-surface-border]="selectedDoctor()?.id !== d.id" 
                (click)="doctorSelected.emit(d)">
          <div class="flex items-start justify-between gap-3">
            <div class="flex gap-3">
              @if (d.profile_path) {
                <img [src]="d.profile_path" [alt]="d.name" class="h-10 w-10 shrink-0 rounded-full object-cover" />
              } @else {
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-sm font-bold text-[#034DA2]">{{ initials(d.name) }}</span>
              }
              <div>
                <p class="text-sm font-semibold text-ink-900">{{ fullName(d.name) }}</p>
                <p class="text-xs text-ink-500">{{ d.qualification }} · {{ d.experience }} yrs</p>
                <p class="text-xs text-ink-500">★ {{ d.rating }} · {{ d.languages }} · {{ d.gender }}</p>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-semibold text-[#034DA2]">₹{{ d.fee }}</p>
              @if (isAboveCeiling(d.fee)) {
                <p class="text-[10px] font-medium text-amber-700">Ceiling ₹{{ ceiling() }}</p>
              }
              <p class="text-xs" [class.text-success-700]="d.nextIn === 'Available now'" [class.text-ink-500]="d.nextIn !== 'Available now'">{{ d.nextIn }}</p>
            </div>
          </div>
        </button>
      }
    </div>
  `,
})
export class DoctorSelectionComponent {
  speciality = input<string>('');
  doctors = input<Doctor[]>([]);
  selectedDoctor = input<Doctor | null>(null);
  ceiling = input<number | null>(null);
  search = model<string>('');
  loading = input<boolean>(false);
  doctorSelected = output<Doctor>();
  searchChanged = output<string>();

  protected isAboveCeiling(fee: number | undefined): boolean {
    const c = this.ceiling();
    return c !== null && c !== undefined && (fee ?? 0) > c;
  }

  protected initials(name: string): string {
    const cleanName = name.replace('Dr. ', '');
    return cleanName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  protected fullName(name: string): string {
    return name.replace('Dr. ', '');
  }
}
