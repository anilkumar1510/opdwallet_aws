import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { StatusBadge } from '../../shared/ui/status-badge';
import { PharmacyOrder } from './pharmacy-order.model';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const money = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/**
 * The member's past pharmacy bookings, one card per row from
 * GET_PHARMACY_BY_USER. Cards keep the visual treatment of the previous inline
 * list but only render fields the payload actually carries.
 */
@Component({
  selector: 'opd-pharmacy-past-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadge],
  template: `
    <ul class="mt-3 space-y-3">
      @for (order of orders(); track order.id) {
        <li
          class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
          style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-semibold text-[#034DA2]">Medicine order</p>
              <p class="mt-0.5 truncate text-sm text-ink-700">Prescription {{ order.name }}</p>
              @if (order.locality) {
                <p class="mt-0.5 truncate text-sm text-ink-700">{{ order.locality }}</p>
              }
              <p class="mt-1 text-xs text-ink-500">
                {{ order.id === order.name ? '' : order.id + ' · ' }}{{ dateFor(order) }}
                @if (order.totalItems !== null) {
                  · {{ order.totalItems }} item{{ order.totalItems === 1 ? '' : 's' }}
                }
              </p>
            </div>
            <div class="shrink-0 text-right">
              @if (order.status) {
                <opd-status-badge [status]="statusFor(order.status)" />
              }
              @if (order.totalAmount !== null) {
                <p class="mt-2 text-lg font-semibold text-[#303030]">{{ money(order.totalAmount) }}</p>
              }
            </div>
          </div>
        </li>
      }
    </ul>
  `,
})
export class PharmacyPastOrders {
  readonly orders = input.required<readonly PharmacyOrder[]>();

  protected dateFor(order: PharmacyOrder): string {
    return order.createdAt > 0 ? DATE.format(new Date(order.createdAt)) : '';
  }

  /** The API's status vocabulary is not the app's ClaimStatus, so map defensively. */
  protected statusFor(status: string) {
    const normalized = status.trim().toLowerCase();
    if (normalized.includes('cancel')) return { label: status, tone: 'negative' as const, isFinal: true };
    if (normalized.includes('deliver')) return { label: status, tone: 'positive' as const, isFinal: false };
    if (normalized.includes('ready') || normalized.includes('dispatch')) {
      return { label: status, tone: 'progress' as const, isFinal: false };
    }
    return { label: status, tone: 'neutral' as const, isFinal: false };
  }

  protected readonly money = money;
}