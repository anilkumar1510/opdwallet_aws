import { ChangeDetectionStrategy, Component, input, output, model } from '@angular/core';
import { Slot } from '../../../services/opd-consultation.service';

@Component({
  selector: 'opd-slot-selection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-5 border-t border-surface-border pt-4">
      <p class="mb-2 text-sm font-medium text-ink-700">Select date and time</p>
      
      <!-- Date selection -->
      <div class="scrollbar-hide mb-3 flex gap-2 overflow-x-auto">
        @for (d of dates(); track d) {
          <button type="button" class="min-h-touch shrink-0 rounded-full border px-4 text-sm" 
                  [class.border-brand-500]="selectedDate() === d" 
                  [class.bg-blue-50]="selectedDate() === d" 
                  [class.border-surface-border]="selectedDate() !== d" 
                  (click)="dateSelected.emit(d)">
            {{ d }}
          </button>
        }
      </div>

      <!-- Time slot selection -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        @for (s of slots(); track s.id) {
          <button type="button" class="min-h-touch rounded-xl border px-3 text-sm" 
                  [class.border-brand-500]="selectedSlotId() === s.id" 
                  [class.bg-blue-50]="selectedSlotId() === s.id" 
                  [class.border-surface-border]="selectedSlotId() !== s.id" 
                  (click)="slotSelected.emit(s)">
            {{ formatTime(s.slot_start_time) }}
          </button>
        }
      </div>
    </div>
  `,
})
export class SlotSelectionComponent {
  dates = input<string[]>([]);
  slots = input<Slot[]>([]);
  selectedDate = input<string>('');
  selectedSlotId = input<string | undefined>('');
  dateSelected = output<string>();
  slotSelected = output<Slot>();

  formatTime(timestamp: number | undefined): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
