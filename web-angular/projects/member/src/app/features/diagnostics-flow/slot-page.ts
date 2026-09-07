import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DiagnosticSlot } from '../../core/diagnostics-flow/diagnostics-flow';
import { DiagnosticsFlowStore } from '../../core/diagnostics-flow/diagnostics-flow.store';
import { LoadingView } from '../../shared/ui/state-views';

/**
 * Flow 7 step 6 — *"Slots are provider specific and follow a booking buffer."*
 *
 * The slots come from the provider's own endpoint, so both of those are theirs
 * to enforce rather than ours to imitate. Where they publish nothing for a day,
 * the page says so instead of offering times nobody can honour.
 */
@Component({
  selector: 'opd-diagnostics-slot-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', store.area(), 'flow', 'collection']"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Pick a time
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ store.collection() === 'HOME' ? 'Collection at home' : 'Visit to the centre' }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <label class="block sm:max-w-[240px]">
            <span class="text-sm font-medium text-ink-900">Which day?</span>
            <input
              type="date"
              [value]="date()"
              [min]="today"
              (input)="pick($any($event.target).value)"
              class="mt-1 min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm text-ink-900 outline-none focus:border-[#0F5FDC]"
            />
          </label>

          @if (date()) {
            @if (store.loading()) {
              <opd-loading label="Loading times" />
            } @else if (store.slots().length) {
              <div class="mt-4 flex flex-wrap gap-2">
                @for (slot of store.slots(); track slot.id) {
                  <button
                    type="button"
                    class="min-h-touch rounded-xl border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                    [class]="
                      slot.id === store.chosenSlot()?.id
                        ? 'border-[#0F5FDC] bg-[#0F5FDC] text-white'
                        : 'border-surface-border text-ink-900 hover:bg-surface-sunk'
                    "
                    [disabled]="!slot.isAvailable"
                    (click)="select(slot)"
                  >
                    {{ slot.startTime }}@if (slot.endTime) {
                      <span class="font-normal"> – {{ slot.endTime }}</span>
                    }
                  </button>
                }
              </div>
            } @else {
              <p class="mt-4 text-sm text-ink-500">
                {{ store.chosenVendor()?.name }} has published no times for that day. Try another.
              </p>
            }
          }

          <button
            type="button"
            class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white disabled:opacity-60"
            [disabled]="!store.chosenSlot()"
            (click)="next()"
          >
            Review your order
          </button>
        </section>
      </div>
    </div>
  `,
})
export class DiagnosticsSlotPage {
  protected readonly store = inject(DiagnosticsFlowStore);
  private readonly router = inject(Router);

  protected readonly date = signal('');
  protected readonly today = new Date().toISOString().slice(0, 10);

  /** A time from one day means nothing on another, so changing the day clears it. */
  protected pick(value: string): void {
    this.date.set(value);
    this.store.chosenSlot.set(null);
    void this.store.loadSlots(value);
  }

  protected select(slot: DiagnosticSlot): void {
    this.store.chosenSlot.set(slot);
  }

  protected next(): void {
    void this.router.navigate(['/member', this.store.area(), 'flow', 'review']);
  }
}
