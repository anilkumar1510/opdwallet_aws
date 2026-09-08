import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
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
        @if (store.cartActionError(); as problem) {
          <p class="mb-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

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
              <!--
                "I don't have a prescription — search medicines directly" used
                to sit here. Flow 5 has no such route: a prescription is the
                only thing the member submits, and the cart is built from it by
                someone who has checked it against the policy. A member with no
                prescription is sent to a doctor, which is what the sheet says.
              -->
              <a
                routerLink="/member/online-consult/specialties"
                class="flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm text-ink-700 hover:border-[#0F5FDC]"
              >
                I need to consult a doctor first
              </a>
            </div>
          </section>
        } @else {
          <!--
            Steps 3 and 4, where the member has nothing to do.
            
            Their prescription is queued, an adjudicator reads it and builds the
            cart, and only then is there something to review. That waiting used
            to be invisible: the old screen jumped straight to a medicine search
            because the member built the cart themselves.
          -->
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
              @if (store.cart()?.items?.length) {
                Your cart is ready
              } @else {
                We are reading your prescription
              }
            </h2>
            <p class="mt-1 text-sm text-ink-700">
              @if (store.cart()?.items?.length) {
                Built from your prescription, with only what your plan covers. You can remove
                anything you do not want — but nothing can be added, because everything here has
                already been checked.
              } @else {
                Someone checks it against your policy and builds your cart. Nothing is charged
                while that happens, and we will tell you the moment it is ready.
              }
            </p>

            @if (sentPrescriptionId(); as reference) {
              <p class="mt-3 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                Prescription {{ reference }}
              </p>
            }

            <!--
              Step 4 for a demonstration.
              
              Building the cart is an adjudicator's job and deliberately not the
              member's. Nobody is in that queue on a demo database, so without
              this the journey stops at the upload and the remaining eleven
              steps cannot be shown. The API refuses it outside development, and
              the stand-in takes the first few covered medicines rather than
              reading the prescription — which no code here can do.
            -->
            @if (sentPrescriptionId() && !store.cart()?.items?.length) {
              <div class="mt-4 border-t border-surface-border pt-4">
                <div class="flex items-start justify-between gap-3">
                  <p class="text-xs text-ink-500">
                    For demonstrations: stand in for the adjudicator and build the cart.
                  </p>
                  <span
                    class="shrink-0 rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700"
                    >Placeholder</span
                  >
                </div>
                <button
                  type="button"
                  class="mt-2 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk disabled:opacity-60"
                  [disabled]="building()"
                  (click)="buildCartForDemo()"
                >
                  {{ building() ? 'Building…' : 'Generate the cart (demo)' }}
                </button>
                <p class="mt-2 text-xs text-ink-500">
                  It takes the first few covered medicines. A real adjudicator reads what your
                  doctor actually wrote.
                </p>
              </div>
            }
          </section>

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
                      <div class="flex shrink-0 items-center gap-2">
                        <!--
                          Amount first, then the control. Right-aligned figures
                          give a column to read down, and putting the button
                          after them keeps it hard against the digits instead of
                          across the gap a short price leaves behind.
                        -->
                        <span class="w-14 text-right font-medium tabular-nums text-ink-900">{{
                          money(item.lineTotal)
                        }}</span>
                        <!--
                          Down only. The cart was checked against the
                          prescription before the member ever saw it, so adding
                          to it would put back something that was never checked
                          — the API refuses an increase outright.

                          At one it takes the line out rather than sitting there
                          greyed out. Down from one IS gone, the API already
                          treats a quantity of zero that way. That also makes a
                          separate Remove redundant — one control, one
                          direction, which is the whole rule of this cart.
                        -->
                        <button
                          type="button"
                          class="flex h-7 w-7 items-center justify-center rounded-full border border-surface-border text-ink-900 hover:bg-surface-sunk"
                          [attr.aria-label]="
                            item.quantity <= 1 ? 'Remove ' + item.name : 'Reduce ' + item.name
                          "
                          [title]="
                            item.quantity <= 1 ? 'Take this out of the cart' : 'Reduce the quantity'
                          "
                          (click)="reduce(item.medicineId, item.quantity)"
                        >
                          &minus;
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
  protected readonly sentPrescriptionId = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly building = signal(false);
  protected readonly query = signal('');
  protected readonly addressId = signal('');
  protected readonly attempted = signal(false);
  /**
   * The member has done their part once a prescription is with us.
   *
   * This used to mean "a cart exists", which was right when the member built
   * the cart themselves. The cart now arrives later and from someone else, so
   * waiting for it here left the screen asking again for a prescription that
   * had already been sent.
   */
  protected readonly hasPrescriptionChoice = computed(
    () => this.sentPrescriptionId() !== null || this.store.cart() !== null,
  );

  protected readonly submitProblem = computed(() => (this.attempted() ? this.missingField() : null));

  constructor() {
    // Re-entering this route picks up the cart that was built for you rather
    // than asking for the prescription again. Asking again was right when the
    // member built the cart themselves; now it sends them to upload a second
    // copy of a prescription that is already with us — which the duplicate
    // check then refuses, leaving them stuck.
    effect(() => {
      const patient = this.family.activeMember();
      if (patient) void this.store.loadOpenCart(patient.id);
    });

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
    const patient = this.family.activeMember();
    if (!file || !patient) return;

    this.sending.set(true);
    try {
      const prescriptionId = await this.store.uploadPrescription(
        file,
        patient.id,
        patient.fullName,
      );
      if (prescriptionId) this.sentPrescriptionId.set(prescriptionId);
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Step 4 done here, for demonstrations — see the button's own comment.
   *
   * A real adjudicator reads the prescription and decides what goes in. This
   * takes the first few covered medicines instead, which is why the screen
   * says so rather than presenting the result as a decision about the member's
   * actual prescription.
   */
  protected async buildCartForDemo(): Promise<void> {
    const prescriptionId = this.sentPrescriptionId();
    const patient = this.family.activeMember();
    if (!prescriptionId || !patient) return;

    this.building.set(true);
    try {
      const cartId = await this.store.demoBuildCart(prescriptionId);
      if (cartId) await this.store.openCart(patient.id, patient.fullName, prescriptionId);
    } finally {
      this.building.set(false);
    }
  }

  /** Step 8: down only. The API refuses anything else. */
  protected reduce(medicineId: string, quantity: number): void {
    void this.store.reduceItem(medicineId, Math.max(0, quantity - 1));
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
