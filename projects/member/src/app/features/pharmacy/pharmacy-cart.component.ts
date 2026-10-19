import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { formatMoney } from '../../core/domain/money';
import type { CartItem } from '../../core/pharmacy/pharmacy';

/**
 * Reusable pharmacy cart display component.
 * Supports both editable (new order) and read-only (past order) modes.
 */
@Component({
  selector: 'opd-pharmacy-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (cartLoading()) {
      <li class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">Loading your cart…</li>
    } @else if (cartError(); as error) {
      <li class="rounded-xl bg-danger-50 px-3 py-3 text-sm text-danger-700" role="alert">
        {{ error }}
        @if (retryLabel()) {
          <button type="button" class="font-medium underline ml-2" (click)="retryClicked.emit()">
            {{ retryLabel() }}
          </button>
        }
      </li>
    } @else if (cartItems().length > 0) {
      @for (item of cartItems(); track item.id) {
        <li class="rounded-xl border border-surface-border px-3 py-2">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-ink-900">{{ item.name }}</p>
              @if (item.isSubstitute) {
                <p class="text-xs text-warning-700">Substitute for {{ item.originalBrand }}</p>
              }
              <p class="text-xs text-ink-500">₹{{ item.unitPrice }} each</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-semibold text-ink-900">₹{{ item.qty * item.unitPrice }}</p>
              @if (editable()) {
                <div class="mt-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="flex h-6 w-6 items-center justify-center rounded-full border border-surface-border text-ink-700"
                    (click)="decrementClicked.emit(item.id)"
                    aria-label="Reduce quantity"
                  >−</button>
                  <span class="text-sm text-ink-900">{{ item.qty }}</span>
                </div>
                <button
                  type="button"
                  class="mt-1 text-xs font-medium text-danger-700 underline"
                  (click)="removeClicked.emit(item.id)"
                >Remove</button>
              } @else {
                <p class="text-xs text-ink-500">Qty: {{ item.qty }}</p>
              }
            </div>
          </div>
        </li>
      }
      @if (!cartItems().length) {
        <li class="rounded-xl bg-surface-sunk px-3 py-3 text-sm text-ink-500">
          {{ emptyMessage() }}
        </li>
      }
    }
  `,
})
export class PharmacyCartComponent {
  readonly cartItems = input.required<readonly CartItem[]>();
  readonly cartLoading = input(false);
  readonly cartError = input<string | null>(null);
  
  // Configuration inputs
  readonly editable = input(false); // Allow decrement/remove actions
  readonly emptyMessage = input("You've removed everything. Add nothing back — reduce only. Restore the cart to continue.");
  readonly retryLabel = input<string | null>(null);
  
  // Event outputs
  readonly decrementClicked = output<string>();
  readonly removeClicked = output<string>();
  readonly retryClicked = output<void>();

  protected readonly money = formatMoney;
}