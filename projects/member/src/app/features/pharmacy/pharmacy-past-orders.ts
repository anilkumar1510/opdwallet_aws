import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

import { StatusBadge } from '../../shared/ui/status-badge';
import { PharmacyOrder } from './pharmacy-order.model';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const money = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/**
 * The member's past pharmacy bookings, one card per row from
 * GET_PHARMACY_CART_BY_USER. Cards keep the visual treatment of the previous inline
 * list but only render fields the payload actually carries.
 */
@Component({
  selector: 'opd-pharmacy-past-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadge],
  template: `
    <ul class="mt-3 space-y-3">
      @for (order of orders(); track order.id) {
        <button
          type="button"
          (click)="onOrderClick(order)"
          class="w-full text-left rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4 transition-colors hover:border-[#A4BFFE7A] hover:bg-[#F3F7FF]"
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
              <p class="mt-1 text-xs text-[#034DA2] font-medium">
                {{ order.status === 'APPROVED' ? 'View cart →' : 'View details →' }}
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
        </button>
      }
    </ul>
  `,
})
export class PharmacyPastOrders {
  readonly orders = input.required<readonly PharmacyOrder[]>();
  readonly orderClicked = output<PharmacyOrder>();

  private readonly router = inject(Router);

  protected dateFor(order: PharmacyOrder): string {
    return order.createdAt > 0 ? DATE.format(new Date(order.createdAt)) : '';
  }

  /** The API's status vocabulary is not the app's ClaimStatus, so map defensively. */
  protected statusFor(status: string) {
    const normalized = status.trim().toLowerCase();
    if (normalized.includes('cancel') || normalized.includes('reject') || normalized.includes('fail')) return { label: status, tone: 'negative' as const, isFinal: true };
    if (normalized.includes('deliver') || normalized.includes('complete') || normalized.includes('success') || normalized.includes('approve')) return { label: status, tone: 'positive' as const, isFinal: false };
    if (normalized.includes('ready') || normalized.includes('dispatch') || normalized.includes('pending') || normalized.includes('process')) {
      return { label: status, tone: 'progress' as const, isFinal: false };
    }
    return { label: status, tone: 'neutral' as const, isFinal: false };
  }

  protected readonly money = money;

  protected onOrderClick(order: PharmacyOrder): void {
    if (order.status === 'APPROVED') {
      this.router.navigate(['/member/pharmacy/orders', order.name, 'cart'], {
        queryParams: { patientId: order.patientId },
      });
    } else {
      this.router.navigate(['/member/pharmacy/orders', order.name, 'rejection']);
    }
  }
}
