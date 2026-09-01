import { ChangeDetectionStrategy, Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Address, AddressInput } from '../../core/member/address';
import { ProfileStore } from '../../core/member/profile.store';

/**
 * Pick a saved address, edit one, or add a new one — the whole address step of
 * a journey in one control.
 *
 * Nothing is pre-selected: the member says where a delivery or a home
 * collection goes, every time. `selectedId` is empty until they choose, so the
 * host screen can hold its submit until it has an answer.
 */
@Component({
  selector: 'opd-address-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (profile.addresses().length) {
      <ul class="space-y-2">
        @for (address of profile.addresses(); track address.id) {
          <li class="flex items-center gap-2">
            <button
              type="button"
              class="w-full rounded-xl border p-3 text-left transition-colors"
              [style.border-color]="address.id === selectedId() ? '#0F5FDC' : '#E5E7EB'"
              [style.background]="address.id === selectedId() ? '#EFF4FF' : 'transparent'"
              [attr.aria-pressed]="address.id === selectedId()"
              (click)="selectedId.set(address.id)"
            >
              <p class="text-sm font-medium text-ink-900">{{ address.typeLabel }}</p>
              <p class="mt-0.5 text-sm text-ink-700">{{ address.lines.join(', ') }}</p>
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[#0F5FDC] hover:bg-blue-50"
              [attr.aria-label]="'Edit ' + address.typeLabel + ' address'"
              (click)="edit(address)"
            >
              Edit
            </button>
          </li>
        }
      </ul>
    } @else if (!form()) {
      <p class="rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
        No saved address yet — add the one this should go to.
      </p>
    }

    @if (form(); as draft) {
      <form class="mt-3 space-y-2 rounded-xl border border-[#E5E7EB] p-3" (ngSubmit)="save()">
        <select
          class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
          aria-label="Address type"
          name="addressType"
          [ngModel]="draft.addressType"
          (ngModelChange)="patch({ addressType: $event })"
        >
          <option value="HOME">Home</option>
          <option value="WORK">Work</option>
          <option value="OTHER">Other</option>
        </select>
        <input
          class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
          placeholder="Flat / house, street"
          aria-label="Address line 1"
          name="addressLine1"
          [ngModel]="draft.addressLine1"
          (ngModelChange)="patch({ addressLine1: $event })"
        />
        <input
          class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
          placeholder="Area, landmark (optional)"
          aria-label="Address line 2"
          name="addressLine2"
          [ngModel]="draft.addressLine2"
          (ngModelChange)="patch({ addressLine2: $event })"
        />
        <div class="flex gap-2">
          <input
            class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
            placeholder="City"
            aria-label="City"
            name="city"
            [ngModel]="draft.city"
            (ngModelChange)="patch({ city: $event })"
          />
          <input
            class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
            placeholder="State"
            aria-label="State"
            name="state"
            [ngModel]="draft.state"
            (ngModelChange)="patch({ state: $event })"
          />
        </div>
        <input
          class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
          placeholder="Pincode"
          aria-label="Pincode"
          inputmode="numeric"
          maxlength="6"
          name="pincode"
          [ngModel]="draft.pincode"
          (ngModelChange)="patch({ pincode: $event })"
        />
        @if (problem(); as text) {
          <p class="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
            {{ text }}
          </p>
        }
        <div class="flex gap-2">
          <button
            type="submit"
            class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
            [disabled]="profile.saving()"
          >
            {{ profile.saving() ? 'Saving...' : 'Save address' }}
          </button>
          <button
            type="button"
            class="min-h-touch rounded-xl border border-surface-border px-4 text-sm font-medium text-ink-700"
            (click)="cancel()"
          >
            Cancel
          </button>
        </div>
      </form>
    } @else {
      <button
        type="button"
        class="mt-3 min-h-touch w-full rounded-xl border border-dashed border-[#0F5FDC] px-4 text-sm font-medium text-[#0F5FDC] hover:bg-blue-50"
        (click)="addNew()"
      >
        + Add a new address
      </button>
    }
  `,
})
export class AddressPicker {
  /** Two-way: the address the host screen will use. Empty until chosen. */
  readonly selectedId = model('');

  protected readonly profile = inject(ProfileStore);

  /** null = not editing; otherwise the draft being added or edited. */
  protected readonly form = signal<AddressInput | null>(null);
  protected readonly problem = signal<string | null>(null);
  /** The address being edited; null while adding a new one. */
  private readonly editingId = signal<string | null>(null);

  constructor() {
    void this.profile.load();
  }

  protected addNew(): void {
    this.editingId.set(null);
    this.problem.set(null);
    this.form.set({
      addressType: 'HOME',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
    });
  }

  protected edit(address: Address): void {
    this.editingId.set(address.id);
    this.problem.set(null);
    this.form.set({ ...address.input });
  }

  protected cancel(): void {
    this.form.set(null);
    this.editingId.set(null);
    this.problem.set(null);
  }

  protected patch(change: Partial<AddressInput>): void {
    const draft = this.form();
    if (draft) this.form.set({ ...draft, ...change });
  }

  protected async save(): Promise<void> {
    const draft = this.form();
    if (!draft) return;

    const problem = this.draftProblem(draft);
    this.problem.set(problem);
    if (problem) return;

    const saved = await this.profile.save(
      { ...draft, addressLine2: draft.addressLine2?.trim() || undefined },
      this.editingId() ?? undefined,
    );
    if (!saved) {
      this.problem.set('Could not save this address. Try again.');
      return;
    }

    // Use what they just typed — an explicit choice, not a guess.
    this.selectedId.set(saved.id);
    this.cancel();
  }

  private draftProblem(draft: AddressInput): string | null {
    if (!draft.addressLine1.trim()) return 'Enter the flat / house and street.';
    if (!draft.city.trim()) return 'Enter the city.';
    if (!draft.state.trim()) return 'Enter the state.';
    // The API rejects anything else with a 400 — say so before the round trip.
    if (!/^[0-9]{6}$/.test(draft.pincode.trim())) return 'Pincode must be 6 digits.';
    return null;
  }
}
