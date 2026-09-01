import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LabKind, LabPrescription } from '../../core/lab/lab.model';
import { LabStore } from '../../core/lab/lab.store';
import { PrescriptionSelector } from './prescription-selector';
import { Icon } from '../../shared/ui/icon';
import { ErrorView, LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Diagnostics has its own layout in web-member — Get Started tiles plus a
 * Recent Prescriptions list — rather than the lab screen's marketing hero.
 */
@Component({
  selector: 'opd-diagnostics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, LoadingView, ErrorView, PrescriptionSelector],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Diagnostic Services</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Book diagnostic imaging &amp; tests</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        <!-- Get Started -->
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:mb-4 lg:text-lg">
            Get Started
          </h2>

          <div class="grid gap-4 sm:grid-cols-2">
            <a
              routerLink="/member/diagnostics/upload"
              class="rounded-2xl p-5 text-white transition-opacity hover:opacity-95"
              style="background: linear-gradient(135deg,#1A6FD4 0%,#3E8DE8 100%)"
            >
              <span class="mb-3 block" aria-hidden="true">
                <opd-icon name="download" [size]="28" class="rotate-180" />
              </span>
              <span class="mb-1 block text-sm font-semibold lg:text-base"
                >Upload New Prescription</span
              >
              <span class="block text-sm text-white/85">Upload a new prescription from your device</span>
            </a>

            <button
              type="button"
              class="rounded-2xl border border-[#CDDDFE] bg-white p-5 text-left transition-colors hover:border-[#0F5FDC]"
              (click)="selector.open()"
            >
              <span class="mb-3 block text-[#0F5FDC]" aria-hidden="true">
                <opd-icon name="records" [size]="28" />
              </span>
              <span class="mb-1 block text-sm font-semibold text-[#0E51A2] lg:text-base"
                >Use Existing Prescription</span
              >
              <span class="block text-sm text-ink-600">Select from your health records</span>
            </button>
          </div>

          <opd-prescription-selector #selector [kind]="diagnosticKind" />

          <!-- The lab hub has carried these two notices since it was written;
               this hub never had them, so a submit that failed said nothing and
               one that succeeded said nothing either. -->
          @if (store.uploadError(); as error) {
            <p
              class="mt-4 flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700"
              role="alert"
            >
              <span class="flex-1">{{ error }}</span>
              <button type="button" class="font-medium underline" (click)="store.dismissUploadNotice()">
                Dismiss
              </button>
            </p>
          } @else if (store.uploadedRef() !== null) {
            <p
              class="mt-4 flex items-start gap-2 rounded-xl bg-success-50 px-3 py-2 text-sm text-success-700"
              role="status"
            >
              <span class="flex-1"
                >Prescription submitted. The diagnostics team will build your cart.</span
              >
              <button type="button" class="font-medium underline" (click)="store.dismissUploadNotice()">
                Dismiss
              </button>
            </p>
          }
        </section>

        @if (store.loading()) {
          <opd-loading label="Loading prescriptions" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else {
          <!-- The lab hub has carried this disclosure since it was written; this
               hub is a separate component and never got it, so a failed orders
               fetch rendered as a completely normal screen. -->
          @if (store.partial().length) {
            <p
              class="mt-5 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700"
              role="status"
            >
              Could not load {{ store.partial().join(' and ') }}. Everything else is shown below.
            </p>
          }

          <!-- Every cart, not just open ones — web-member applies no filter. -->
          @if (store.carts().length) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-[#0E51A2] lg:text-lg">
                <span class="text-[#0F5FDC]" aria-hidden="true">
                  <opd-icon name="cart" [size]="22" />
                </span>
                Your Carts ({{ store.carts().length }})
              </h2>

              <ul class="space-y-3">
                @for (cart of store.carts(); track cart.id) {
                  <li class="rounded-xl border border-[#E1E9F5] bg-[#FBFCFF] p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-[#0E51A2] lg:text-base">
                          {{ cart.items.length }} test{{ cart.items.length === 1 ? '' : 's' }} added
                        </p>
                        <p class="truncate text-xs text-ink-600 lg:text-sm">Cart ID: {{ cart.id }}</p>
                        <p class="mt-1 truncate text-xs text-ink-500">
                          Created: {{ date(cart.createdAt) }}
                        </p>
                      </div>
                      <div class="flex shrink-0 flex-col items-end gap-2">
                        <span class="rounded-full bg-[#F2F6FD] px-2 py-1 text-xs text-[#0E51A2]">{{
                          cart.status
                        }}</span>
                        <a
                          [routerLink]="['/member/diagnostics/cart', cart.id]"
                          class="text-xs font-medium text-[#0F5FDC] hover:underline lg:text-sm"
                          >Review Cart &rarr;</a
                        >
                      </div>
                    </div>
                  </li>
                }
              </ul>
            </section>
          }

          @if (recent().length) {
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-3 text-base font-semibold text-[#0E51A2] lg:mb-4 lg:text-lg">
                Recent Prescriptions
              </h2>

              <div class="space-y-3">
                @for (prescription of recent(); track prescription.id) {
                  <div class="rounded-xl border border-[#EDF0F7] p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-[#0E51A2] lg:text-base">
                          {{ prescription.fileName }}
                        </p>
                        <p class="mt-1 text-xs text-ink-500 lg:text-sm">
                          Uploaded: {{ date(prescription.uploadedAt) }}
                        </p>
                      </div>

                      <div class="flex shrink-0 items-center gap-2">
                        <span
                          class="rounded-full px-2 py-1 text-xs font-medium"
                          [class]="badgeClass(prescription)"
                          >{{ prescription.statusCode }}</span
                        >
                        @if (isReady(prescription)) {
                          <span class="text-success-700" aria-hidden="true">&#10003;</span>
                        }
                      </div>
                    </div>

                    @if (isReady(prescription)) {
                      <a
                        [routerLink]="cartLink(prescription)"
                        [queryParams]="{ tab: 'diagnostic' }"
                        class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95"
                        style="background: linear-gradient(135deg,#1A6FD4 0%,#3E8DE8 100%)"
                        >Review Cart</a
                      >
                    }
                  </div>
                }
              </div>
            </section>
          }

          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: 'diagnostic' }"
            class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95 lg:text-base"
            style="background: linear-gradient(135deg,#1A6FD4 0%,#3E8DE8 100%)"
          >
            View Diagnostic Bookings
          </a>
        }
      </div>
    </div>
  `,
})
export class DiagnosticsPage {
  protected readonly store = inject(LabStore);
  /** This screen is diagnostics-only; the route carries no `kind` to bind. */
  protected readonly diagnosticKind = LabKind.Diagnostic;

  constructor() {
    effect(() => this.store.select(LabKind.Diagnostic));
  }

  /** The reference lists the two most recent. */
  protected readonly recent = computed(() => this.store.prescriptions().slice(0, 2));

  /** A cart only exists once the prescription is digitised. */
  protected isReady(prescription: LabPrescription): boolean {
    return (
      prescription.statusCode === 'DIGITIZED' &&
      (prescription.cartId !== null || this.store.cartFor(prescription) !== null)
    );
  }

  /** The cart screen when the cart is still listed, else bookings. */
  protected cartLink(prescription: LabPrescription): unknown[] {
    const cart = this.store.cartFor(prescription);
    return cart ? ['/member/diagnostics/cart', cart.id] : ['/member', 'bookings'];
  }

  protected badgeClass(prescription: LabPrescription): string {
    switch (prescription.statusCode) {
      case 'DIGITIZED':
        return 'bg-success-50 text-success-700';
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-danger-50 text-danger-700';
      default:
        return 'bg-warning-50 text-warning-700';
    }
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Not recorded';
  }
}
