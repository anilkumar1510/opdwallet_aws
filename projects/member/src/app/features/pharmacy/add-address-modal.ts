import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AppService } from '../../core/http/api.service';
import { PharmacyAddressInput } from './pharmacy-address.model';

/**
 * Add-address form. Reactive rather than template-driven so validation state is
 * inspectable by the host and the submit path can refuse an incomplete address
 * before any request is made.
 */
@Component({
  selector: 'opd-add-address-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-address-title"
        >
          <div class="flex items-start justify-between gap-3">
            <h2 id="add-address-title" class="text-base font-semibold text-[#0E51A2]">Add a delivery address</h2>
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
              (click)="cancelled.emit()"
            >
              Close
            </button>
          </div>

          <form class="mt-4 space-y-3" [formGroup]="form" (ngSubmit)="submit()">
            <label class="block">
              <span class="text-sm font-medium text-ink-700">Flat / house, street</span>
              <input
                class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                formControlName="street1"
                autocomplete="address-line1"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-ink-700">Area, landmark</span>
              <input
                class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                formControlName="street2"
                autocomplete="address-line2"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-ink-700">Nearby (optional)</span>
              <input
                class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                formControlName="street3"
              />
            </label>
            <div class="flex gap-3">
              <label class="block flex-1">
                <span class="text-sm font-medium text-ink-700">City</span>
                <input
                  class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                  formControlName="city"
                  autocomplete="address-level2"
                />
              </label>
              <label class="block flex-1">
                <span class="text-sm font-medium text-ink-700">State</span>
                <input
                  class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                  formControlName="state"
                  autocomplete="address-level1"
                />
              </label>
            </div>
            <div class="flex gap-3">
              <label class="block flex-1">
                <span class="text-sm font-medium text-ink-700">Pincode</span>
                <input
                  class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                  formControlName="pincode"
                  inputmode="numeric"
                  maxlength="6"
                  autocomplete="postal-code"
                />
              </label>
              <label class="block flex-1">
                <span class="text-sm font-medium text-ink-700">Country</span>
                <input
                  class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
                  formControlName="country"
                  autocomplete="country-name"
                />
              </label>
            </div>

            @if (fieldError(); as message) {
              <p class="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ message }}</p>
            }
            @if (saveError(); as message) {
              <p class="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ message }}</p>
            }

            <div class="flex gap-3">
              <button
                type="submit"
                class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
                [disabled]="saving()"
              >
                {{ saving() ? 'Saving…' : 'Save address' }}
              </button>
              <button
                type="button"
                class="min-h-touch rounded-xl border border-surface-border px-4 text-sm font-medium text-ink-700"
                (click)="cancelled.emit()"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AddAddressModal {
  readonly open = input(false);
  readonly saving = input(false);
  readonly saveError = input<string | null>(null);

  readonly saved = output<PharmacyAddressInput>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly crypto = inject(AppService);

  protected readonly form = this.fb.nonNullable.group({
    street1: ['', Validators.required],
    street2: [''],
    street3: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    country: ['', Validators.required],
  });

  private readonly _fieldError = signal<string | null>(null);
  protected readonly fieldError = this._fieldError.asReadonly();

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this._fieldError.set('Fill in the flat / house, city, state, country, and a 6-digit pincode.');
      return;
    }
    this._fieldError.set(null);
    this.saved.emit(this.form.getRawValue());
  }
}
