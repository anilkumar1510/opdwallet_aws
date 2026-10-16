import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { PharmacyOrderService } from './pharmacy-order.service';
import { PharmacyOrder } from './pharmacy-order.model';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Prescription Rejection screen — shows why a prescription was rejected.
 */
@Component({
  selector: 'opd-pharmacy-rejection-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusBadge],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div class="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            (click)="goBack()"
            class="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Back to past orders"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-gray-900">Prescription Status</h1>
          <div class="w-10"></div>
        </div>
      </header>

      <main class="max-w-md mx-auto px-4 py-4 pb-20">
        @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <svg class="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        } @else if (order()) {
          <div class="space-y-4">
            <!-- Hero Section -->
            <section class="bg-red-50 rounded-2xl p-5 border border-red-100">
              <div class="flex flex-col items-center text-center">
                <!-- Warning Icon -->
                <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <!-- Status Badge -->
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 mb-3">
                  Rejected
                </span>

                <!-- Heading -->
                <h2 class="text-xl font-bold text-gray-900 mb-2">Prescription Rejected</h2>

                <!-- Description -->
                <p class="text-gray-600 text-sm leading-relaxed">
                  Your prescription could not be processed by our pharmacy team. Please review the details below.
                </p>
              </div>
            </section>

            <!-- Prescription Details Card -->
            <section class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Prescription Details
              </h3>
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <dt class="text-gray-500">Booking ID</dt>
                  <dd class="font-medium text-gray-900 font-mono">{{ order()!.name }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500">UHID</dt>
                  <dd class="font-medium text-gray-900 font-mono">{{ order()!.uhid || '—' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500">Prescription Submitted</dt>
                  <dd class="font-medium text-gray-900">{{ formatDateTime(order()!.createdAt) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500">Status</dt>
                  <dd class="font-medium">
                    <opd-status-badge [status]="statusFor(order()?.status ?? '')" />
                  </dd>
                </div>
              </dl>
            </section>

            <!-- Rejection Details Card -->
            <section class="bg-red-50 rounded-2xl p-5 border border-red-200">
              <h3 class="font-semibold text-red-800 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Reason for Rejection
              </h3>

              <!-- Rejection Reason -->
              <div class="mb-4">
                <dt class="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Reason</dt>
                <dd class="text-red-800 bg-white p-3 rounded-lg border border-red-200 text-sm leading-relaxed">
                  {{ order()!.rejectionReason || 'No reason provided' }}
                </dd>
              </div>

              <!-- Rejection Comments -->
              @if (order()!.rejectionComments) {
                <div>
                  <dt class="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Comments</dt>
                  <dd class="text-red-800 bg-white p-3 rounded-lg border border-red-200 text-sm leading-relaxed">
                    {{ order()!.rejectionComments }}
                  </dd>
                </div>
              }
            </section>

            <!-- What You Can Do Next Section -->
            <section class="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <h3 class="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What You Can Do Next
              </h3>
              <ul class="space-y-2 text-sm text-blue-700">
                <li class="flex items-center gap-2">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Upload a new prescription with correct details</span>
                </li>
                <li class="flex items-center gap-2">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Contact support if you believe this is incorrect</span>
                </li>
              </ul>
            </section>

            <!-- Action Buttons -->
            <div class="space-y-3 pt-2">
              <!-- Primary CTA -->
              <a
                [routerLink]="['/member/pharmacy']"
                class="block w-full min-h-[52px] flex items-center justify-center rounded-xl bg-red-600 text-white font-semibold text-base hover:bg-red-700 transition-colors"
              >
                Upload New Prescription
              </a>

              <!-- Secondary CTA -->
              <button
                type="button"
                (click)="goBack()"
                class="block w-full min-h-[52px] flex items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Back to Past Orders
              </button>
            </div>
          </div>
        } @else {
          <!-- Not found / Error state -->
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 01-5.656 0M12 20h.01m-7.07-7.07a4 4 0 010-5.656M12 20h.01m0-8.07a4 4 0 00-5.656-5.656" />
            </svg>
            <h2 class="mt-4 text-lg font-semibold text-gray-900">Prescription not found</h2>
            <p class="mt-2 text-gray-500">This prescription record may have been removed or doesn't exist.</p>
            <a
              [routerLink]="['/member/pharmacy']"
              class="mt-6 inline-flex items-center justify-center min-h-[52px] rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Pharmacy
            </a>
          </div>
        }
      </main>
    </div>
  `,
})
export class PharmacyRejectionPage {
  private readonly orderService = inject(PharmacyOrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly bookingName = computed(() => this.route.snapshot.paramMap.get('bookingName') || '');

  protected readonly loading = signal(true);
  protected readonly order = signal<PharmacyOrder | null>(null);

  constructor() {
    this.loadOrder();
  }

  protected formatDateTime(timestamp: number): string {
    return timestamp > 0 ? DATE.format(new Date(timestamp)) : '—';
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

  protected async loadOrder(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.orderService.list(0, 50);
      const found = result.orders.find(o => o.name === this.bookingName());
      this.order.set(found ?? null);
    } catch {
      this.order.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/member/pharmacy']);
  }
}