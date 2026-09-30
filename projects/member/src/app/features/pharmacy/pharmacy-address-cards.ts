import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';

import { AppService } from '../../core/http/api.service';
import { PharmacyAddress, addressDisplayLines } from './pharmacy-address.model';

/**
 * The saved delivery addresses as a horizontally scrolling strip, with an
 * add-address card kept last so the member is never blocked by an empty list.
 *
 * Nothing is pre-selected: the member says where the order goes, every time.
 */
@Component({
  selector: 'opd-pharmacy-address-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-2 overflow-x-auto pb-2" role="list">
      <button
        type="button"
        class="min-h-touch w-56 shrink-0 rounded-lg border-2 border-dashed border-[#CDDDFE] p-2.5 text-left text-[#0B2C63] hover:bg-[#F7FAFF]"
        (click)="addRequested.emit()"
      >
        <p class="text-sm font-semibold">+ Add address</p>
        <p class="mt-0.5 text-xs text-ink-500">Deliver to somewhere new</p>
      </button>

      @for (address of addresses(); track address.id) {
        <button
          type="button"
          role="listitem"
          class="min-h-touch w-56 shrink-0 rounded-lg border p-2.5 text-left transition-colors"
          [style.border-color]="address.id === selectedId() ? '#0F5FDC' : '#E5E7EB'"
          [style.background]="address.id === selectedId() ? '#EFF4FF' : '#FFFFFF'"
          [attr.aria-pressed]="address.id === selectedId()"
          (click)="selectedId.set(address.id)"
        >
          <p class="text-xs font-semibold text-[#0E51A2]">
            {{ address.addressType === '2' ? 'Home' : address.addressType }}
          </p>
          @for (line of linesFor(address); track line) {
            <p class="mt-0.5 truncate text-xs text-ink-700">{{ line }}</p>
          }
          @if (address.id === selectedId()) {
            <p class="mt-0.5 text-xs font-medium text-[#0F5FDC]">✓ Delivery address</p>
          }
        </button>
      }
    </div>

    @if (!addresses().length) {
      <p class="mt-1.5 rounded-lg bg-warning-50 px-3 py-1.5 text-xs text-warning-700">
        You have no saved delivery addresses yet — add one to continue.
      </p>
    }

    @if (loadFailed()) {
      <p class="mt-1.5 rounded-lg bg-danger-50 px-3 py-1.5 text-xs text-danger-700" role="alert">
        We could not load your saved addresses. You can still add a new one.
      </p>
    }
  `,
})
export class PharmacyAddressCards {
  readonly addresses = input.required<readonly PharmacyAddress[]>();
  readonly loadFailed = input(false);

  /** Two-way: the address the booking payload will carry. */
  readonly selectedId = model('');
  readonly addRequested = output<void>();

  private readonly crypto = inject(AppService);

  protected linesFor(address: PharmacyAddress): readonly string[] {
    return addressDisplayLines(address, this.crypto);
  }
}
