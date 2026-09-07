import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  DiagnosticTest,
  DiagnosticVendor,
} from '../../core/diagnostics-flow/diagnostics-flow';
import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { formatMoney } from '../../core/domain/money';
import { EmptyView } from '../../shared/ui/state-views';

/** See the class comment: placeholders, to be deleted when the real fields land. */
const SAMPLE_ACCREDITATIONS = ['NABL accredited', 'NABH accredited', 'ISO 9001'] as const;
const SAMPLE_TURNAROUNDS = ['Same day', '24 hours', '24 to 48 hours'] as const;

/**
 * Flow 7 step 4 — the provider: *"List shows price, distance, accreditation and
 * report turnaround time."*
 *
 * All four columns the sheet asks for are on screen, and each says what kind
 * of thing it is:
 *
 *   price          — real, from that provider's own price list.
 *   distance       — real as far as it goes: the list is built from who serves
 *                    this postal code, so "serves your area" is true. There is
 *                    no kilometre figure because nothing holds coordinates.
 *   accreditation  — PLACEHOLDER. Not held anywhere.
 *   turnaround     — PLACEHOLDER. Not held anywhere.
 *
 * The last two are stand-ins, at the product owner's request, so the comparison
 * can be seen whole. They are the only invented values in the journey, and
 * three things keep that from becoming a lie a member acts on: each cell wears
 * a Placeholder tag, the note under the table names them and says not to choose
 * on them, and the values are derived from the vendor id rather than
 * randomised, so nothing shifts between two looks at the same screen.
 *
 * They must not survive contact with real providers. Once a vendor record
 * carries accreditation and turnaround, delete `SAMPLE_ACCREDITATIONS`,
 * `SAMPLE_TURNAROUNDS` and both helpers below, and read the fields.
 */
@Component({
  selector: 'opd-provider-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1000px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', store.area(), 'flow', 'test']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to the test"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Choose a provider
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ store.chosenTest()?.name }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1000px] px-5 py-6 lg:px-8">
        @if (store.providersForTest().length) {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr class="border-b border-surface-border text-left">
                  <th class="px-3 py-2 font-semibold text-ink-900">Provider</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Price</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Distance</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Accreditation</th>
                  <th class="px-3 py-2 font-semibold text-ink-900">Report in</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                @for (row of store.providersForTest(); track row.vendor.id) {
                  <tr class="border-b border-rule-soft align-top">
                    <td class="px-3 py-3">
                      <span class="block font-medium text-ink-900">{{ row.vendor.name }}</span>
                      <span class="block text-xs text-ink-500">{{ row.vendor.address }}</span>
                    </td>
                    <td class="px-3 py-3 font-semibold text-ink-900">
                      {{ money(row.quote.price) }}
                    </td>
                    <!--
                      Distance is the one of the three that can be answered
                      truthfully: the provider list is built from who serves
                      this postal code, so "serves your area" is a fact, not a
                      guess. A figure in kilometres would not be — nothing holds
                      a provider's coordinates.
                    -->
                    <td class="px-3 py-3">
                      <span class="text-ink-900">Serves your area</span>
                      <span class="block text-xs text-ink-500">{{ store.pincode() }}</span>
                    </td>
                    <!--
                      Accreditation and turnaround are shown as placeholders and
                      say so on the cell. Neither is on the vendor record, and
                      inventing a plausible value — "NABL", "24 hours" — would
                      put a claim about a real clinic in front of a member who
                      would reasonably act on it. A placeholder that admits what
                      it is can be compared; a fabricated one cannot be
                      corrected.
                    -->
                    <td class="px-3 py-3">
                      <span class="text-ink-900">{{ accreditation(row.vendor.id) }}</span>
                      <span
                        class="mt-1 inline-block rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700"
                        >Placeholder</span
                      >
                    </td>
                    <td class="px-3 py-3">
                      <span class="text-ink-900">{{ turnaround(row.vendor.id) }}</span>
                      <span
                        class="mt-1 inline-block rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700"
                        >Placeholder</span
                      >
                    </td>
                    <td class="px-3 py-3">
                      <button
                        type="button"
                        class="inline-flex min-h-touch items-center rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white hover:bg-[#034DA2]"
                        (click)="choose(row.vendor, row.quote)"
                      >
                        Choose
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="mt-4 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
            Anything marked <span class="font-semibold">Placeholder</span> is made up to show the
            comparison — these providers have not told us their accreditation or how long reports
            take, so do not choose on those two. Price is theirs and current, and distance means
            they serve your postal code.
          </p>
        } @else {
          <opd-empty
            title="No provider for that test"
            detail="Go back and pick a test, or try a different postal code."
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
export class ProviderPage {
  protected readonly store = inject(DiagnosticsFlowStore);
  private readonly router = inject(Router);
  protected readonly money = formatMoney;

  /**
   * Derived from the vendor id, not drawn at random: the same provider shows
   * the same sample value every time, so a member who looks twice is not shown
   * two different answers about the same clinic.
   */
  private pick<T>(vendorId: string, options: readonly T[]): T {
    const sum = [...vendorId].reduce((total, char) => total + char.charCodeAt(0), 0);
    return options[sum % options.length];
  }

  protected accreditation(vendorId: string): string {
    return this.pick(vendorId, SAMPLE_ACCREDITATIONS);
  }

  protected turnaround(vendorId: string): string {
    return this.pick(vendorId, SAMPLE_TURNAROUNDS);
  }

  protected choose(vendor: DiagnosticVendor, quote: DiagnosticTest): void {
    this.store.chosenVendor.set(vendor);
    // The quote replaces the one picked earlier: price is per provider, and
    // this is the provider the member actually chose.
    this.store.chosenTest.set(quote);
    void this.router.navigate(['/member', this.store.area(), 'flow', 'collection']);
  }
}
