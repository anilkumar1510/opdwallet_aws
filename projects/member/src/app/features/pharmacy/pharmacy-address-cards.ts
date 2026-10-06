import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

import { Icon, IconName } from '../../shared/ui/icon';
import { PharmacyAddress } from './pharmacy-address.model';

/**
 * The saved delivery addresses as a horizontally scrolling strip, with an
 * add-address card kept last so the member is never blocked by an empty list.
 *
 * Nothing is pre-selected: the member says where the order goes, every time.
 */
@Component({
  selector: 'opd-pharmacy-address-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="flex items-stretch gap-2 overflow-x-auto pb-2" role="list">
      <button
        type="button"
        class="flex min-h-touch w-56 shrink-0 flex-col justify-center rounded-lg border-2 border-dashed border-[#CDDDFE] p-2.5 text-left text-[#0B2C63] transition-colors hover:bg-[#F7FAFF]"
        (click)="addRequested.emit()"
      >
        <span class="flex items-center gap-1.5">
          <opd-icon name="plus" [size]="14" />
          <span class="text-xs font-semibold">Add address</span>
        </span>
        <span class="mt-1 text-xs leading-snug text-ink-500">
          Deliver to somewhere new
        </span>
      </button>

      @for (address of addresses(); track address.id) {
        <div
          role="listitem"
          class="flex w-56 shrink-0 flex-col rounded-lg border p-2.5 text-left"
          [style.border-color]="address.id === selectedId() ? '#0F5FDC' : '#E5E7EB'"
          [style.background]="address.id === selectedId() ? '#EFF4FF' : '#FFFFFF'"
        >
          <div class="flex items-center gap-1.5">
            <opd-icon [name]="iconFor(address)" [size]="14" class="text-[#0E51A2]" />
            <p class="flex-1 truncate text-xs font-semibold text-[#0E51A2]">{{ address.typeLabel }}</p>
          </div>

          <div class="mt-1 flex-1">
            <p class="break-words text-xs leading-snug text-ink-900">{{ streetFor(address) }}</p>

            <p class="mt-1.5 border-t border-[#E5E7EB] pt-1.5 text-xs leading-snug text-ink-500">
              {{ address.locality }}
            </p>
          </div>

          <button
            type="button"
            class="mt-2 w-full shrink-0 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors"
            [style.border-color]="address.id === selectedId() ? '#0F5FDC' : '#0F5FDC4D'"
            [style.background]="address.id === selectedId() ? '#0F5FDC' : 'transparent'"
            [style.color]="address.id === selectedId() ? '#FFFFFF' : '#0F5FDC'"
            [attr.aria-pressed]="address.id === selectedId()"
            (click)="selectedId.set(address.id)"
          >
            {{ address.id === selectedId() ? '✓ Delivery address' : 'Deliver here' }}
          </button>
        </div>
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

  protected iconFor(address: PharmacyAddress): IconName {
    switch (address.typeLabel) {
      case 'Home':
        return 'home';
      case 'Office':
        return 'user';
      default:
        return 'userCircle';
    }
  }

  /**
   * street3 only. street1/street2 arrive double-encrypted and the portal holds no
   * key for them, so they would render as base64; street3 is plaintext and is
   * the only street line a member can actually read.
   */
  protected streetFor(address: PharmacyAddress): string {
    return address.booking.street3;
  }
}
