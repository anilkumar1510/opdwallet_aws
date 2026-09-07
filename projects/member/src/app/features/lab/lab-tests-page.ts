import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/domain/money';
import { LabKind, LabPrescription } from '../../core/lab/lab.model';
import { LabStore } from '../../core/lab/lab.store';
import { CONCERNS } from '../../core/diagnostics-flow/diagnostics-flow';
import { PrescriptionSelector } from './prescription-selector';
import { WalletStore } from '../../core/wallet/wallet.store';
import { Icon } from '../../shared/ui/icon';
import { ErrorView, LoadingView } from '../../shared/ui/state-views';
import { StatusBadge } from '../../shared/ui/status-badge';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const DATETIME = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const STEPS: readonly { title: string; detail: string }[] = [
  { title: 'Share the prescription', detail: 'PDF or a clear photo works.' },
  { title: 'Lab builds your cart', detail: 'Usually within 2 hours.' },
  { title: 'Pick a slot', detail: 'Paid from your OPD wallet.' },
];

/** Illustrative, not from the API — same list web-member hardcodes. */
const COVERED_TESTS: readonly string[] = [
  'Complete Blood Count',
  'Thyroid',
  'Liver function',
  'Kidney function',
  'Blood sugar',
  'Lipid profile',
  'Vitamin D & B12',
];

/**
 * Serves Pathology (CAT004) and Radiology (CAT003) — same contract, different
 * endpoint prefix. `kind` comes from the route.
 */
@Component({
  selector: 'opd-lab-tests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, LoadingView, ErrorView, StatusBadge, PrescriptionSelector],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">{{ title() }}</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ subtitle() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1100px] px-5 py-6 lg:px-8">
        <!-- Hero -->
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-bold text-[#0B2C63] lg:text-2xl">
                Turn a prescription into a booking
              </h2>
              <p class="mt-2 max-w-lg text-sm text-ink-700 lg:text-base">
                Upload your doctor's prescription. The lab reads it, builds your cart, and you pick
                a slot &mdash; sample collection at home is included.
              </p>

              <div class="mt-5 flex flex-wrap gap-3">
                <a
                  routerLink="/member/lab-tests/upload"
                  class="flex min-h-touch items-center gap-2 rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2]"
                >
                  <opd-icon name="download" [size]="18" class="rotate-180" />
                  Upload a prescription
                </a>
                <button
                  type="button"
                  class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:border-[#A4BFFE7A]"
                  (click)="selector.open()"
                >
                  Use a saved one
                </button>
              </div>

              <!--
                Flow 7 steps 1 and 2: the card opens on health concerns, not on
                an upload box. Shown above the prescription options rather than
                as a footnote under them — the sheet has no prescription in this
                journey at all, and this is the entrance it describes.
              -->
              <div class="mt-5 border-t border-surface-border pt-4">
                <p class="text-sm font-medium text-ink-900">Or start from what you are checking on</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (concern of concerns; track concern.id) {
                    <a
                      [routerLink]="['/member', kind() === 'LAB' ? 'pathology' : 'radiology', 'flow']"
                      [queryParams]="{ concern: concern.id }"
                      class="inline-flex min-h-touch items-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:border-[#0F5FDC] hover:bg-surface-sunk"
                      >{{ concern.label }}</a
                    >
                  }
                </div>
              </div>

              <opd-prescription-selector #selector [kind]="kind()" />

              @if (store.uploadError(); as error) {
                <p
                  class="mt-3 flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700"
                  role="alert"
                >
                  <span class="flex-1">{{ error }}</span>
                  <button type="button" class="font-medium underline" (click)="store.dismissUploadNotice()">
                    Dismiss
                  </button>
                </p>
              } @else if (store.uploadedRef() !== null) {
                <p
                  class="mt-3 flex items-start gap-2 rounded-xl bg-success-50 px-3 py-2 text-sm text-success-700"
                  role="status"
                >
                  <span class="flex-1"
                    >Prescription uploaded. The lab will build your cart, usually within 2
                    hours.</span
                  >
                  <button type="button" class="font-medium underline" (click)="store.dismissUploadNotice()">
                    Dismiss
                  </button>
                </p>
              }
            </div>

            <div
              class="flex h-[150px] shrink-0 items-center justify-center rounded-xl border border-dashed border-[#CDDDFE] px-6 text-center lg:w-[350px]"
              style="background: repeating-linear-gradient(135deg,#F7FAFF,#F7FAFF 10px,#EEF4FF 10px,#EEF4FF 20px)"
            >
              <p class="font-mono text-xs text-ink-500">
                illustration<br />prescription &rarr; lab &rarr; home visit
              </p>
            </div>
          </div>
        </section>

        <!-- Steps -->
        <ol class="mt-5 grid gap-4 sm:grid-cols-3">
          @for (step of steps; track step.title; let i = $index) {
            <li class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF1FB] text-sm font-semibold text-[#0F5FDC]"
                aria-hidden="true"
                >{{ i + 1 }}</span
              >
              <p class="mt-3 font-semibold text-[#0B2C63]">{{ step.title }}</p>
              <p class="mt-1 text-sm text-ink-700">{{ step.detail }}</p>
            </li>
          }
        </ol>

        <!-- Covered by your wallet -->
        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <div class="flex items-start gap-4">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FB] text-[#0F5FDC]"
              aria-hidden="true"
            >
              <opd-icon name="lab" [size]="24" />
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold text-[#0E51A2] lg:text-base">
                Covered by your wallet
              </h3>
              <p class="mt-0.5 text-xs text-ink-700 lg:text-sm">
                Accurate, timely results from certified laboratories
              </p>

              <div class="mt-3 flex flex-wrap gap-2">
                @for (test of coveredTests; track test) {
                  <span class="rounded-full bg-[#F2F6FD] px-3 py-1.5 text-sm text-[#0E51A2]">{{
                    test
                  }}</span>
                }
                <span class="rounded-full bg-[#F2F6FD] px-3 py-1.5 text-sm text-ink-500"
                  >+ 60 more</span
                >
              </div>

              @if (balance(); as category) {
                <p class="mt-4 text-sm text-ink-700">
                  <span class="font-semibold text-[#0B2C63]">{{
                    category.isUnlimited ? 'Unlimited' : money(category.available)
                  }}</span>
                  available under this benefit
                  @if (!category.isUnlimited) {
                    <span class="text-ink-500"> of {{ money(category.allocated) }}</span>
                  }
                </p>
              }
            </div>
          </div>
        </section>

        <a
          [routerLink]="['/member', kind() === 'LAB' ? 'lab-tests' : 'diagnostics', 'orders']"
          class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl border border-[#C9D8F0] bg-white px-5 text-sm font-semibold text-[#0E51A2] transition-colors hover:bg-[#F5F8FF] lg:text-[15px]"
        >
          View {{ kind() === 'LAB' ? 'lab' : 'diagnostic' }} bookings
        </a>

        <!-- Real data: only rendered when the member actually has some -->
        @if (store.loading()) {
          <opd-loading label="Loading your tests" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else {
          @if (store.partial().length) {
            <p
              class="mt-5 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700"
              role="status"
            >
              Could not load {{ store.partial().join(' and ') }}. Everything else is shown below.
            </p>
          }

          <!-- Every cart, not just open ones: web-member lists them all, and an
               ordered cart is still the record of what was booked. -->
          @if (store.carts().length) {
            <section class="mt-6">
              <h2 class="mb-3 flex items-center gap-2 text-[18px] font-medium text-[#1c1c1c]">
                <span class="text-[#0F5FDC]" aria-hidden="true">
                  <opd-icon name="cart" [size]="22" />
                </span>
                Your Carts ({{ store.carts().length }})
              </h2>
              <ul class="space-y-3">
                @for (cart of store.carts(); track cart.id) {
                  <li class="rounded-2xl border-[1.5px] border-[#0F5FDC] bg-white p-4 shadow-sm">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold text-[#034DA2]">
                          {{ cart.items.length }} test{{ cart.items.length === 1 ? '' : 's' }} added
                        </p>
                        <p class="mt-0.5 truncate text-xs text-ink-500">
                          Cart ID: {{ cart.id }}
                        </p>
                        <p class="mt-0.5 truncate text-xs text-ink-500">
                          Created: {{ date(cart.createdAt) }}
                        </p>
                      </div>
                      <div class="flex shrink-0 flex-col items-end gap-2">
                        <span class="rounded-full bg-[#F2F6FD] px-2 py-1 text-xs text-[#0E51A2]">{{
                          cart.status
                        }}</span>
                        <!-- The reference sends this to bookings?tab=lab; the
                             cart screen is the thing actually being reviewed. -->
                        <a
                          [routerLink]="['/member', basePath(), 'cart', cart.id]"
                          class="text-sm font-medium text-[#0F5FDC] hover:underline"
                          >Review Cart &rarr;</a
                        >
                      </div>
                    </div>
                  </li>
                }
              </ul>
            </section>
          }

          @if (store.actionable().length) {
            <section class="mt-6">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Ready to order</h2>
              <ul class="space-y-3">
                @for (prescription of store.actionable(); track prescription.id) {
                  <li class="rounded-2xl border-[1.5px] border-[#0F5FDC] bg-white p-4 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold text-[#034DA2]">
                          {{ prescription.sourceLabel }} prescription
                        </p>
                        <p class="mt-0.5 truncate text-xs text-ink-500">
                          {{ prescription.reference }} · {{ date(prescription.uploadedAt) }}
                        </p>
                      </div>
                      <opd-status-badge [status]="prescription.status" />
                    </div>
                  </li>
                }
              </ul>
            </section>
          }

          @if (store.orders().length) {
            <section class="mt-6">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Your orders</h2>
              <ul class="space-y-3">
                @for (order of store.orders(); track order.id) {
                  <li class="rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-base font-semibold text-[#034DA2]">
                          {{ order.vendorName }}
                        </p>
                        <p class="mt-0.5 truncate text-xs text-ink-500">
                          {{ order.reference }} · {{ date(order.placedAt) }}
                        </p>

                        <ul class="mt-2 space-y-0.5">
                          @for (test of order.tests; track test.id) {
                            <li class="flex justify-between gap-3 text-sm">
                              <span class="truncate text-ink-700">{{ test.name }}</span>
                              <span class="shrink-0 text-ink-500">{{ money(test.price) }}</span>
                            </li>
                          }
                        </ul>

                        @if (order.collectionLabel || order.collectionAt) {
                          <p class="mt-2 text-xs text-ink-500">
                            {{ order.collectionLabel }}
                            @if (order.collectionAt) {
                              · {{ dateTime(order.collectionAt) }}
                            }
                          </p>
                        }
                        @if (order.reportCount) {
                          <p class="mt-1 text-xs font-medium text-success-700">
                            {{ order.reportCount }} report{{ order.reportCount === 1 ? '' : 's' }}
                            available
                          </p>
                        }
                      </div>

                      <div class="shrink-0 text-right">
                        <opd-status-badge [status]="order.status" />
                        <p class="mt-2 text-base font-semibold text-[#303030]">
                          {{ money(order.total) }}
                        </p>
                        <p class="text-xs text-ink-500">
                          {{ money(order.fromWallet) }} wallet · {{ money(order.youPay) }} you
                        </p>
                      </div>
                    </div>
                  </li>
                }
              </ul>
            </section>
          }

          @if (store.prescriptions().length) {
            <section class="mt-6">
              <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Your prescriptions</h2>
              <ul
                class="divide-y divide-surface-border overflow-hidden rounded-2xl border border-[#EDF0F7] bg-white shadow-sm"
              >
                @for (prescription of store.prescriptions(); track prescription.id) {
                  <li class="px-4 py-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-ink-900">
                          {{ prescription.fileName }}
                        </p>
                        <p class="mt-0.5 text-xs text-ink-500">
                          {{ prescription.patientName }} ·
                          {{ date(prescription.uploadedAt) }}
                          @if (prescription.orderCount) {
                            · {{ prescription.orderCount }} order{{
                              prescription.orderCount === 1 ? '' : 's'
                            }}
                          }
                        </p>
                      </div>
                      <div class="flex shrink-0 items-center gap-2">
                        <opd-status-badge [status]="prescription.status" />
                        @if (isReady(prescription)) {
                          <span class="text-success-700" aria-hidden="true">&#10003;</span>
                        }
                      </div>
                    </div>

                    <!-- Only once the lab has digitised it into a cart. -->
                    @if (isReady(prescription)) {
                      <a
                        [routerLink]="cartLink(prescription)"
                        [queryParams]="{ tab: bookingsTab() }"
                        class="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95"
                        style="background: linear-gradient(135deg,#1A6FD4 0%,#3E8DE8 100%)"
                        >Review Cart</a
                      >
                    }
                  </li>
                }
              </ul>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class LabTestsPage {
  /** Flow 7 step 2's tabs, on the card itself so it is the first screen. */
  protected readonly concerns = CONCERNS;

  /** 'LAB' or 'DIAGNOSTIC', supplied by the route's data. */
  readonly kind = input<LabKind>(LabKind.Lab);

  protected readonly store = inject(LabStore);
  private readonly wallet = inject(WalletStore);

  protected readonly money = formatMoney;
  protected readonly steps = STEPS;
  protected readonly coveredTests = COVERED_TESTS;

  constructor() {
    effect(() => this.store.select(this.kind()));
  }

  protected readonly title = computed(() =>
    this.kind() === LabKind.Lab ? 'Lab Tests' : 'Radiology & Cardiology',
  );

  protected readonly subtitle = computed(() =>
    this.kind() === LabKind.Lab ? 'Book lab tests with ease' : 'Book scans and cardiology tests',
  );

  /** Preselects the matching filter on the bookings screen. */
  protected readonly bookingsTab = computed(() =>
    this.kind() === LabKind.Lab ? 'lab' : 'diagnostic',
  );

  /** Route prefix for this kind, so cart links stay on the right journey. */
  protected readonly basePath = computed(() =>
    this.kind() === LabKind.Lab ? 'lab-tests' : 'diagnostics',
  );

  /** The wallet category funding this screen, so the balance is in context. */
  protected readonly balance = computed(() => {
    const code = this.kind() === LabKind.Lab ? 'CAT004' : 'CAT003';
    return this.wallet.wallet()?.categories.find((category) => category.code === code);
  });

  /** A cart exists only once the lab has digitised the prescription. */
  protected isReady(prescription: LabPrescription): boolean {
    return (
      prescription.statusCode === 'DIGITIZED' &&
      (prescription.cartId !== null || this.store.cartFor(prescription) !== null)
    );
  }

  /**
   * Deep-links to the cart when one is still listed; otherwise the bookings
   * screen, which is where web-member sends this button.
   */
  protected cartLink(prescription: LabPrescription): unknown[] {
    const cart = this.store.cartFor(prescription);
    return cart ? ['/member', this.basePath(), 'cart', cart.id] : ['/member', 'bookings'];
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }

  protected dateTime(value: Date): string {
    return DATETIME.format(value);
  }
}
