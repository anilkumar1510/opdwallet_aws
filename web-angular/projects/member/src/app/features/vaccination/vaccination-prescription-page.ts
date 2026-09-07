import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The dental upload's limits, repeated here so a rejected file is named. */
const ACCEPTED = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Flow 6 step 3 — "Upload prescription, optional".
 *
 * The sheet is unusually blunt about this one: *"Vaccination does not need a
 * prescription."* It is offered because some members have one and expect to be
 * asked, not because anything downstream requires it.
 *
 * Nothing stores it yet, and that is a real gap rather than an oversight worth
 * hiding: the upload happens BEFORE a booking exists — before the provider and
 * the slot are even chosen — so there is no record to attach it to. Giving it
 * one means carrying the file through three more screens and saving it when the
 * booking is created, plus a `prescription` field on the vaccination booking
 * like dental's. Until then the step says so, and skipping is the honest
 * default: the journey behaves identically either way.
 */
@Component({
  selector: 'opd-vaccination-prescription-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/vaccination"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to vaccines"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Your prescription
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Optional — you can skip this
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
            Do you have a prescription?
          </h2>
          <p class="mt-1 text-sm text-ink-700">
            You do not need one for a vaccination. Add it only if your doctor gave you one and you
            would like it on file.
          </p>

          @if (error(); as problem) {
            <p class="mt-3 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
              {{ problem }}
            </p>
          }

          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
            (change)="pick($event)"
            class="mt-4 block w-full text-sm text-ink-700 file:mr-3 file:min-h-touch file:rounded-xl file:border file:border-surface-border file:bg-white file:px-4 file:text-sm file:font-semibold file:text-ink-900"
          />

          @if (chosen(); as file) {
            <!--
              Says what will happen to the file, before the member relies on it
              being kept. Nothing carries it past this screen.
            -->
            <p class="mt-3 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700">
              {{ file.name }} — we cannot keep this yet. Bring it with you to the appointment; the
              vendor will want to see the paper copy anyway.
            </p>
          }

          <a
            [routerLink]="['/member/vaccination/vendors']"
            [queryParams]="{ serviceId: serviceId() }"
            class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
            >{{ chosen() ? 'Continue' : 'Skip and choose a provider' }}</a
          >
        </section>
      </div>
    </div>
  `,
})
export class VaccinationPrescriptionPage {
  readonly serviceId = input<string>('');

  protected readonly chosen = signal<File | null>(null);
  protected readonly error = signal<string | null>(null);

  /**
   * Checked even though the file goes nowhere: the limits are the ones the
   * upload will enforce when it exists, and a member who picks a 40 MB scan
   * should learn that here rather than at the step that finally rejects it.
   */
  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error.set(null);

    if (file && !ACCEPTED.includes(file.type)) {
      this.error.set('Upload a PDF or a photo (JPG, PNG, GIF or WebP).');
      this.chosen.set(null);
      input.value = '';
      return;
    }
    if (file && file.size > MAX_BYTES) {
      this.error.set('That file is larger than 15 MB. Try a smaller scan or photo.');
      this.chosen.set(null);
      input.value = '';
      return;
    }
    this.chosen.set(file);
  }
}
