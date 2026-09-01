import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { FamilyStore } from '../../core/family/family.store';
import { formatMoney } from '../../core/domain/money';
import { ProfileStore } from '../../core/member/profile.store';
import { PharmacyStore } from '../../core/pharmacy/pharmacy.store';
import { AddressPicker } from '../../shared/ui/address-picker';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

/**
 * Steps 1-4: click Pharmacy, upload a prescription (or skip it and consult a
 * doctor instead), search and add medicines, submit the cart on hold. One
 * screen — the sheet's four steps are short enough that a route each would
 * scatter them for no reason.
 */
@Component({
  selector: 'opd-pharmacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LoadingView, EmptyView, AddressPicker],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            (click)="goBack()"
          >&larr;</button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Pharmacy</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Order your medicines</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 py-6 lg:px-8">
        @if (!hasPrescriptionChoice()) {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="mb-3 text-base font-semibold text-[#0E51A2]">Do you have a prescription?</h2>
            <div class="space-y-2">
              <label
                class="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl border border-surface-border px-4 py-3"
              >
                <input
                  type="file"
                  class="hidden"
                  accept="image/*,.pdf"
                  (change)="onPrescriptionChosen($event)"
                />
                <span class="text-sm font-medium text-ink-900">Upload prescription</span>
              </label>
              <button
                type="button"
                class="flex min-h-touch w-full items-center justify-center rounded-xl border border-dashed border-[#0F5FDC] px-4 text-sm font-medium text-[#0F5FDC] hover:bg-blue-50"
                (click)="skipPrescription()"
              >
                I don't have a prescription — search medicines directly
              </button>
              <a
                routerLink="/member/online-consult/specialties"
                class="flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm text-ink-700 hover:border-[#0F5FDC]"
              >
                I need to consult a doctor first
              </a>
            </div>
          </section>
        } @else {
          <div class="mb-3 flex gap-2">
            <input
              name="search"
              placeholder="Search medicines"
              class="min-h-touch flex-1 rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
              (keyup.enter)="search()"
            />
            <button
              type="button"
              class="min-h-touch rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
              (click)="search()"
            >
              Search
            </button>
          </div>

          @if (store.medicinesLoading()) {
            <opd-loading label="Loading medicines" />
          } @else if (store.medicines().length) {
            <ul class="space-y-3">
              @for (medicine of store.medicines(); track medicine.id) {
                <li class="flex items-center justify-between gap-3 rounded-2xl border border-[#EDF0F7] bg-white p-4 shadow-sm">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-[#0B2C63]">{{ medicine.name }}</p>
                    <p class="text-xs text-ink-500">
                      {{ medicine.category }}
                      @if (medicine.packSize) {
                        · {{ medicine.packSize }}
                      }
                      @if (medicine.requiresPrescription) {
                        · Requires prescription
                      }
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-3">
                    <span class="text-sm font-semibold text-[#034DA2]">{{ money(medicine.price) }}</span>
                    <button
                      type="button"
                      class="min-h-touch rounded-xl bg-[#0F5FDC] px-3 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-40"
                      [disabled]="!medicine.inStock"
                      (click)="addToCart(medicine.id)"
                    >
                      Add
                    </button>
                  </div>
                </li>
              }
            </ul>
          } @else {
            <opd-empty title="No medicines found" detail="Try a different search term." />
          }

          @if (store.cart(); as cart) {
            @if (cart.items.length) {
              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="mb-3 text-base font-semibold text-[#0E51A2]">Delivery address</h2>
                <opd-address-picker [(selectedId)]="addressId" />
              </section>

              <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
                <h2 class="mb-3 text-base font-semibold text-[#0E51A2]">Your cart</h2>
                <ul class="space-y-2">
                  @for (item of cart.items; track item.medicineId) {
                    <li class="flex items-center justify-between gap-3 text-sm">
                      <span class="min-w-0 truncate text-ink-900">{{ item.name }} x{{ item.quantity }}</span>
                      <div class="flex shrink-0 items-center gap-3">
                        <span class="font-medium text-ink-900">{{ money(item.lineTotal) }}</span>
                        <button
                          type="button"
                          class="text-xs text-danger-700 hover:underline"
                          (click)="removeFromCart(item.medicineId)"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  }
                </ul>
                <div class="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                  <span class="font-semibold text-ink-900">Total</span>
                  <span class="text-lg font-bold text-[#0B2C63]">{{ money(cart.total) }}</span>
                </div>
                @if (cart.hasUnmetPrescriptionRequirement) {
                  <p class="mt-2 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">
                    Some items need a prescription you haven't uploaded — they'll be removed when reviewed.
                  </p>
                }
                @if (submitProblem(); as problem) {
                  <p class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                    {{ problem }}
                  </p>
                }
                @if (store.orderError(); as error) {
                  <p class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                    {{ error }}
                  </p>
                }
                <button
                  type="button"
                  class="mt-4 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50"
                  [disabled]="store.submitting()"
                  (click)="submit()"
                >
                  {{ store.submitting() ? 'Submitting…' : 'Submit for review' }}
                </button>
              </section>
            }
          }
        }
      </div>
    </div>
  `,
})
export class PharmacyPage {
  protected readonly store = inject(PharmacyStore);
  private readonly family = inject(FamilyStore);
  protected readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);

  protected readonly money = formatMoney;
  protected readonly query = signal('');
  protected readonly addressId = signal('');
  protected readonly attempted = signal(false);
  protected readonly hasPrescriptionChoice = computed(() => this.store.cart() !== null);

  protected readonly submitProblem = computed(() => (this.attempted() ? this.missingField() : null));

  constructor() {
    // Re-entering this route (e.g. via the header/browser back button, or the
    // home card) should always re-ask the prescription question — the
    // in-progress cart, if any, is resumed once they answer again.
    this.store.clearCart();

    void this.profile.load();

    // No address prefill: the member picks where this order goes, every time.
  }

  private missingField(): string | null {
    if (!this.addressId()) return 'Choose a delivery address before submitting.';
    return null;
  }

  protected goBack(): void {
    if (this.hasPrescriptionChoice()) {
      this.store.clearCart();
    } else {
      void this.router.navigate(['/member']);
    }
  }

  protected async onPrescriptionChosen(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    await this.startCart(file?.name);
  }

  protected async skipPrescription(): Promise<void> {
    await this.startCart(undefined);
  }

  private async startCart(prescriptionFileName: string | undefined): Promise<void> {
    const patient = this.family.activeMember();
    if (!patient) return;
    await this.store.openCart(patient.id, patient.fullName, prescriptionFileName);
    await this.store.searchMedicines();
  }

  protected search(): void {
    void this.store.searchMedicines(this.query());
  }

  protected addToCart(medicineId: string): void {
    void this.store.addItem(medicineId, 1);
  }

  protected removeFromCart(medicineId: string): void {
    void this.store.removeItem(medicineId);
  }

  protected async submit(): Promise<void> {
    this.attempted.set(true);
    if (this.missingField()) return;

    const address = this.profile.addresses().find((a) => a.id === this.addressId());
    if (!address) return;
    const member = this.family.activeMember();

    const order = await this.store.submitCart({
      fullName: member?.fullName ?? '',
      phone: member?.phone ?? '',
      addressLine1: address.lines[0] ?? '',
      pincode: address.pincode ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
    });
    if (order) await this.router.navigate(['/member/pharmacy/orders', order.id]);
  }
}
