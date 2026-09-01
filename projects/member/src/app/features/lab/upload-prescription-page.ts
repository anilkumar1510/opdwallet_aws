import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { relationshipLabel } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { LabKind } from '../../core/lab/lab.model';
import { LabStore, validateFile } from '../../core/lab/lab.store';
import { Member } from '../../core/member/member.model';
import { ProfileStore } from '../../core/member/profile.store';
import { Icon } from '../../shared/ui/icon';

/** Step 1 of the lab journey: prescription -> cart -> vendor -> slot -> order. */
@Component({
  selector: 'opd-upload-prescription-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            [routerLink]="['/member', basePath()]"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            [attr.aria-label]="'Back to ' + basePath()"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Upload Prescription</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Upload your lab test prescription</p>
          </div>
        </div>
      </header>

      <form class="mx-auto max-w-[820px] px-5 py-6 lg:px-8" (ngSubmit)="submit()">
        <!-- 1. File -->
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">
            Select Prescription File
          </h2>

          <input
            #fileInput
            type="file"
            class="sr-only"
            accept="image/*,.pdf"
            (change)="onFileChosen($event)"
          />

          <button
            type="button"
            class="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-10 text-center transition-colors hover:border-[#0F5FDC]"
            (click)="fileInput.click()"
          >
            <span class="text-[#0F5FDC]" aria-hidden="true">
              <opd-icon name="download" [size]="28" class="rotate-180" />
            </span>
            @if (file(); as chosen) {
              <span class="font-medium text-ink-900">{{ chosen.name }}</span>
              <span class="text-xs text-ink-500">{{ sizeLabel(chosen) }} · tap to change</span>
            } @else {
              <span class="font-medium text-[#0B2C63]">Choose a file</span>
              <span class="text-xs text-ink-500">PDF or a clear photo, up to 10 MB</span>
            }
          </button>

          @if (fileError(); as error) {
            <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }
        </section>

        <!-- 2. Patient -->
        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">
            Patient Information
          </h2>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="patient" class="mb-1 block text-sm font-medium text-ink-700"
                >Patient</label
              >
              <select
                id="patient"
                name="patient"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="patientId()"
                (ngModelChange)="patientId.set($event)"
              >
                @for (member of family.family(); track member.id) {
                  <option [value]="member.id">
                    {{ member.fullName }} ({{ relationship(member) }})
                  </option>
                }
              </select>
            </div>

            <div>
              <label for="date" class="mb-1 block text-sm font-medium text-ink-700"
                >Prescription date</label
              >
              <input
                id="date"
                name="date"
                type="date"
                [max]="today"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="prescriptionDate()"
                (ngModelChange)="prescriptionDate.set($event)"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="address" class="mb-1 block text-sm font-medium text-ink-700"
                >Collection address</label
              >
              @if (profile.addresses().length) {
                <select
                  id="address"
                  name="address"
                  class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                  [ngModel]="addressId()"
                  (ngModelChange)="addressId.set($event)"
                >
                  <option value="">Select an address</option>
                  @for (address of profile.addresses(); track address.id) {
                    <option [value]="address.id">
                      {{ address.typeLabel }} — {{ address.lines.join(', ') }}
                    </option>
                  }
                </select>
              } @else {
                <p class="rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
                  No saved address. Add one in your
                  <a routerLink="/member/profile" class="font-medium underline">profile</a> first —
                  the lab needs a pincode to collect your sample.
                </p>
              }
            </div>

            <div class="sm:col-span-2">
              <label for="notes" class="mb-1 block text-sm font-medium text-ink-700"
                >Notes (optional)</label
              >
              <textarea
                id="notes"
                name="notes"
                rows="3"
                placeholder="Any specific instructions or information..."
                class="w-full rounded-xl border border-surface-border bg-white p-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="notes()"
                (ngModelChange)="notes.set($event)"
              ></textarea>
            </div>
          </div>
        </section>

        @if (submitProblem(); as problem) {
          <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

        @if (store.uploadError(); as error) {
          <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
            {{ error }}
          </p>
        }

        <div class="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50"
            [disabled]="!canSubmit()"
          >
            {{ store.uploading() ? 'Uploading…' : 'Upload prescription' }}
          </button>
          <a
            [routerLink]="['/member', basePath()]"
            class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
            >Cancel</a
          >
        </div>

        <p class="mt-4 flex items-center gap-2 text-sm text-ink-500">
          <span aria-hidden="true">&rarr;</span>
          <span>Next: select a lab partner and book your slot</span>
        </p>
      </form>
    </div>
  `,
})
export class UploadPrescriptionPage {
  /**
   * 'LAB' or 'DIAGNOSTIC', from route data. This component serves both upload
   * routes and used to hardcode LAB, so a diagnostics upload POSTed to
   * member/lab/prescriptions/upload and then returned the member to the lab hub
   * — where their prescription was not, because it had been filed as a lab one.
   */
  readonly kind = input<LabKind>(LabKind.Lab);

  protected readonly store = inject(LabStore);
  protected readonly basePath = computed(() =>
    this.kind() === LabKind.Lab ? 'lab-tests' : 'diagnostics',
  );
  protected readonly family = inject(FamilyStore);
  protected readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);

  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly patientId = signal('');
  protected readonly addressId = signal('');
  protected readonly notes = signal('');
  /** Empty by default — the member states the date, we do not assume today. */
  protected readonly prescriptionDate = signal('');

  /** A prescription cannot be dated in the future. */
  protected readonly today = new Date().toISOString().slice(0, 10);

  constructor() {
    void this.profile.load();

    // Default the patient to whoever the portal is acting for, and the address
    // to the default one — ONCE each.
    //
    // These read the signal they write, so "only when empty" is not a guard: the
    // effect re-runs on the member's own clearing and puts the value straight
    // back, and the field cannot be emptied. Session 25 found and fixed exactly
    // this on the ONLINE contact number ("the effect fought the user"); the same
    // shape was still here. It also made *Incomplete submission is refused*
    // undriveable for the address — clearing the select uploaded a real
    // prescription instead of being refused.
    let patientPrefilled = false;
    let addressPrefilled = false;
    effect(() => {
      const active = this.family.activeMember();
      if (active && !patientPrefilled && !this.patientId()) {
        patientPrefilled = true;
        this.patientId.set(active.id);
      }
    });
    effect(() => {
      const addresses = this.profile.addresses();
      if (!addresses.length || addressPrefilled || this.addressId()) return;
      addressPrefilled = true;
      this.addressId.set((addresses.find((a) => a.isDefault) ?? addresses[0]).id);
    });
  }

  /**
   * Set when submission cannot proceed, so the screen says what is missing
   * instead of leaving an inert button. Same pattern as
   * `appointment-confirm-page.confirmProblem` and `vendor-booking-page`'s
   * address guard — enabled control, validation on attempt, the problem named.
   *
   * This form used to gate the button on `canSubmit()` and say nothing, which is
   * `appointment-confirm-page.ts:403-405`'s failure with the click removed: the
   * member is left to work out which of four fields is at fault.
   */
  /**
   * True once the member has tried to submit. Before that the form stays quiet;
   * after it, the CURRENT first unmet requirement is shown.
   *
   * Storing the message instead left it on screen after the member fixed the
   * field — the screen asserting something no longer true, which is the same
   * family as `21-degraded-not-declared.md`. Recomputing means it clears itself.
   */
  protected readonly attempted = signal(false);
  protected readonly submitProblem = computed(() =>
    this.attempted() ? this.missingField() : null,
  );

  /**
   * Only the in-flight guard. Completeness is checked on attempt so it can be
   * reported — a disabled control cannot explain itself.
   */
  protected readonly canSubmit = computed(() => !this.store.uploading());

  /** First missing field, named. Matches the order the form presents them in. */
  protected missingField(): string | null {
    if (this.file() === null) return 'Choose a prescription file to upload.';
    if (this.patientId() === '') return 'Choose which patient this prescription is for.';
    // The API requires prescriptionDate, so it must be chosen, not defaulted.
    if (this.prescriptionDate() === '') return 'Choose the date on the prescription.';
    if (this.addressId() === '')
      return this.profile.addresses().length
        ? 'Choose a collection address.'
        : 'Add an address with a pincode to your profile — the lab needs one to collect your sample.';
    return null;
  }

  protected relationship(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  protected sizeLabel(file: File): string {
    const mb = file.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  }

  protected onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = input.files?.[0] ?? null;
    input.value = '';
    if (!chosen) return;

    // Validate on selection rather than on submit, so the member finds out
    // immediately instead of after filling the rest of the form.
    const rejection = validateFile(chosen);
    this.fileError.set(rejection);
    this.file.set(rejection ? null : chosen);
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.attempted.set(true);
    if (this.missingField()) return;

    const chosen = this.file();
    if (!chosen) return;

    const patient = this.family.family().find((member) => member.id === this.patientId());
    const address = this.profile.addresses().find((a) => a.id === this.addressId());

    const uploaded = await this.store.upload(chosen, {
      kind: this.kind(),
      patient,
      addressId: address?.id,
      pincode: address?.pincode ?? undefined,
      notes: this.notes(),
      prescriptionDate: new Date(this.prescriptionDate()),
    });

    if (uploaded) await this.router.navigate(['/member', this.basePath()]);
  }
}
