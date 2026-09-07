import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView } from '../../shared/ui/state-views';

/**
 * Flow 7 step 5 — home collection or a visit to the centre.
 *
 * *"Home collection is offered only where the partner services the postal
 * code."* That check already happened: the provider list came from the vendors
 * serving this postal code, so a provider who is here at all can collect here.
 * What still varies is whether they OFFER home collection, which is on their
 * record, and what they charge for it.
 */
@Component({
  selector: 'opd-collection-mode-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', store.area(), 'flow', 'provider']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to providers"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              How should we collect?
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ store.chosenVendor()?.name }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.chosenVendor(); as vendor) {
          <div class="grid gap-4 sm:grid-cols-2">
            @if (vendor.homeCollection) {
              <button
                type="button"
                class="rounded-2xl border border-[#EDF0F7] bg-white p-5 text-left shadow-sm transition-colors hover:border-[#0F5FDC]"
                (click)="choose('HOME')"
              >
                <h2 class="text-base font-semibold text-[#0B2C63]">At home</h2>
                <p class="mt-1 text-sm text-ink-700">
                  Their team comes to you at {{ store.pincode() }}.
                </p>
                <p class="mt-3 text-sm font-semibold text-ink-900">
                  @if (store.chosenTest()?.homeCollectionCharge?.amount) {
                    + {{ money(store.chosenTest()!.homeCollectionCharge) }} collection charge
                  } @else {
                    No extra charge
                  }
                </p>
              </button>
            } @else {
              <!--
                The provider says no to home collection, so this branch is a
                stand-in rather than a booking — but it is still walkable, and
                it carries a tag that follows it to the review screen. Leaving
                it dead meant one of the two answers in step 5 could never be
                shown.
              -->
              <button
                type="button"
                class="rounded-2xl border border-dashed border-surface-border bg-white p-5 text-left transition-colors hover:border-[#0F5FDC]"
                (click)="choose('HOME')"
              >
                <div class="flex items-start justify-between gap-3">
                  <h2 class="text-base font-semibold text-ink-700">At home</h2>
                  <span
                    class="shrink-0 rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700"
                    >Placeholder</span
                  >
                </div>
                <p class="mt-1 text-sm text-ink-500">
                  {{ vendor.name }} does not offer home collection. You can still walk this branch
                  — nothing will be booked.
                </p>
                <p class="mt-3 text-sm font-semibold text-ink-700">
                  + {{ money(store.chosenTest()!.homeCollectionCharge) }} collection charge
                </p>
              </button>
            }

            <button
              type="button"
              class="rounded-2xl border border-[#EDF0F7] bg-white p-5 text-left shadow-sm transition-colors hover:border-[#0F5FDC]"
              (click)="choose('CENTRE')"
            >
              <h2 class="text-base font-semibold text-[#0B2C63]">At their centre</h2>
              <p class="mt-1 text-sm text-ink-700">{{ vendor.address }}</p>
              <p class="mt-3 text-sm font-semibold text-ink-900">No extra charge</p>
            </button>
          </div>
        } @else {
          <opd-empty
            title="No provider chosen"
            detail="Pick a provider first so we know who is collecting."
          />
          <a
            [routerLink]="['/member', store.area(), 'flow']"
            class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
            >Back to tests</a
          >
        }
      </div>
    </div>
  `,
})
export class CollectionModePage {
  protected readonly store = inject(DiagnosticsFlowStore);
  private readonly router = inject(Router);
  protected readonly money = formatMoney;

  protected choose(mode: 'HOME' | 'CENTRE'): void {
    this.store.collection.set(mode);
    // Home from a provider who does not do it is a walkthrough, not a booking.
    this.store.collectionIsPlaceholder.set(
      mode === 'HOME' && this.store.chosenVendor()?.homeCollection !== true,
    );
    void this.router.navigate(['/member', this.store.area(), 'flow', 'slot']);
  }
}
