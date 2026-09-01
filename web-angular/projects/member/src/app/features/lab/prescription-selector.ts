import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import { LabStore } from '../../core/lab/lab.store';
import { LabKind } from '../../core/lab/lab.model';
import { Prescription } from '../../core/records/prescription.model';
import { RecordsStore } from '../../core/records/records.store';

/**
 * Pick a prescription the member already holds and submit it for lab or
 * diagnostics, without uploading a file again.
 *
 * **This lives on the hub, matching the reference.** `web-member` opens a
 * `PrescriptionSelectorModal` from the lab hub and submits inside
 * `handlePrescriptionSelect` (`lab-tests/page.tsx:100-140`). Angular had kept the
 * label and pointed it at `/member/health-records`, which browses records and
 * cannot submit one — the destination was never given the action, so
 * `LAB_API[kind].submitExisting` sat declared with no caller.
 *
 * Building the submit control into the records browser instead would be a flow
 * the reference does not have. The selector belongs here.
 *
 * The host owns its own trigger — the two hubs style it very differently — and
 * calls `open()` on a template reference.
 */
@Component({
  selector: 'opd-prescription-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="mt-5 rounded-2xl border border-[#CDDDFE] bg-white p-5 shadow-sm"
        role="dialog"
        aria-label="Choose a saved prescription"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-[#0E51A2]">Choose a saved prescription</h2>
            <p class="mt-1 text-sm text-ink-500">
              We will send it to the {{ label() }} team, who will build your cart.
            </p>
          </div>
          <button
            type="button"
            class="min-h-touch shrink-0 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
            (click)="close()"
          >
            Close
          </button>
        </div>

        @if (records.loading()) {
          <p class="mt-4 text-sm text-ink-500">Loading your prescriptions…</p>
        } @else if (records.error()) {
          <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
            We could not load your saved prescriptions. Please try again.
          </p>
        } @else if (records.all().length) {
          <ul class="mt-4 space-y-3">
            @for (record of records.all(); track record.id) {
              <li
                class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EDF0F7] p-4"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-[#034DA2]">
                    {{ record.doctorName }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-ink-500">
                    {{ record.sourceLabel }} · {{ record.patientName }}
                  </p>
                </div>
                <button
                  type="button"
                  class="min-h-touch shrink-0 rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
                  [disabled]="store.uploading()"
                  (click)="submit(record)"
                >
                  {{ store.uploading() ? 'Submitting…' : 'Use this one' }}
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="mt-4 text-sm text-ink-500">
            You have no saved prescriptions yet. Upload one instead.
          </p>
        }
      </div>
    }
  `,
})
export class PrescriptionSelector {
  readonly kind = input<LabKind>(LabKind.Lab);

  protected readonly store = inject(LabStore);
  protected readonly records = inject(RecordsStore);
  protected readonly isOpen = signal(false);

  protected readonly label = () => (this.kind() === LabKind.Lab ? 'lab' : 'diagnostics');

  open(): void {
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected async submit(record: Prescription): Promise<void> {
    // Close only on success — a failure leaves the panel open with the store's
    // error rendered by the host, so the member can pick another or retry.
    if (await this.store.submitExisting(record, this.kind())) this.close();
  }
}
