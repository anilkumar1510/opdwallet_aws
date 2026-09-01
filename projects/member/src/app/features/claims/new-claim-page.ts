import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClaimsStore } from '../../core/claims/claims.store';
import { ClaimCategory } from '../../core/claims/claim.mapper';
import { relationshipLabel } from '../../core/domain/codes';
import { formatMoney, money } from '../../core/domain/money';
import { FamilyStore } from '../../core/family/family.store';
import { Member } from '../../core/member/member.model';
import { WalletStore } from '../../core/wallet/wallet.store';

const MAX_BYTES = 10 * 1024 * 1024;

type DocKind = 'prescription' | 'bill';

/** Submit a reimbursement claim. */
@Component({
  selector: 'opd-new-claim-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/claims"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to claims"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">New Claim</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Submit a reimbursement claim</p>
          </div>
        </div>
      </header>

      <form class="mx-auto max-w-[820px] px-5 py-6 lg:px-8" (ngSubmit)="submit()">
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">Treatment details</h2>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="patient" class="mb-1 block text-sm font-medium text-ink-700">Patient</label>
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
              <label for="category" class="mb-1 block text-sm font-medium text-ink-700"
                >Category</label
              >
              <select
                id="category"
                name="category"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="category()"
                (ngModelChange)="category.set($event)"
              >
                <option value="">Select a category</option>
                @for (option of categories(); track option.id) {
                  <option [value]="option.claimCategory">{{ option.name }}</option>
                }
              </select>
              @if (selectedCategory(); as chosen) {
                @if (chosen.perClaimLimit > 0) {
                  <p class="mt-1 text-xs text-ink-500">
                    Up to {{ amount(chosen.perClaimLimit) }} per claim
                  </p>
                }
              }
            </div>

            <div>
              <label for="claimType" class="mb-1 block text-sm font-medium text-ink-700"
                >Claim type</label
              >
              <select
                id="claimType"
                name="claimType"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="claimType()"
                (ngModelChange)="claimType.set($event)"
              >
                <option value="REIMBURSEMENT">Reimbursement</option>
                <option value="CASHLESS_PREAUTH">Cashless pre-authorisation</option>
              </select>
            </div>

            <div>
              <label for="treatmentDate" class="mb-1 block text-sm font-medium text-ink-700"
                >Treatment date</label
              >
              <input
                id="treatmentDate"
                name="treatmentDate"
                type="date"
                [max]="today"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="treatmentDate()"
                (ngModelChange)="treatmentDate.set($event)"
              />
            </div>

            <div>
              <label for="provider" class="mb-1 block text-sm font-medium text-ink-700"
                >Provider</label
              >
              <input
                id="provider"
                name="provider"
                placeholder="Clinic, hospital or pharmacy"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="providerName()"
                (ngModelChange)="providerName.set($event)"
              />
            </div>

            <div>
              <label for="billAmount" class="mb-1 block text-sm font-medium text-ink-700"
                >Bill amount</label
              >
              <input
                id="billAmount"
                name="billAmount"
                type="number"
                min="1"
                inputmode="numeric"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="billAmount()"
                (ngModelChange)="billAmount.set($event)"
              />
              @if (overLimit()) {
                <p class="mt-1 text-xs text-warning-700">
                  Above the {{ amount(selectedCategory()!.perClaimLimit) }} per-claim limit — the
                  excess will not be reimbursed.
                </p>
              }
            </div>

            <div>
              <label for="billNumber" class="mb-1 block text-sm font-medium text-ink-700"
                >Bill number (optional)</label
              >
              <input
                id="billNumber"
                name="billNumber"
                class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="billNumber()"
                (ngModelChange)="billNumber.set($event)"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="description" class="mb-1 block text-sm font-medium text-ink-700"
                >Description (optional)</label
              >
              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="What was the treatment for?"
                class="w-full rounded-xl border border-surface-border bg-white p-3 text-sm focus:border-brand-500 focus:outline-none"
                [ngModel]="description()"
                (ngModelChange)="description.set($event)"
              ></textarea>
            </div>
          </div>
        </section>

        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">Documents</h2>

          <!-- Two controls, two checks: the reference requires at least one
               prescription AND at least one bill, and a single combined picker
               cannot express that. -->
          @for (kind of docKinds; track kind.key) {
            <div class="mb-4">
              <input
                type="file"
                class="sr-only"
                multiple
                accept="image/*,.pdf"
                [id]="'doc-' + kind.key"
                (change)="onFilesChosen(kind.key, $event)"
              />
              <label
                [attr.for]="'doc-' + kind.key"
                class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-6 text-center transition-colors hover:border-[#0F5FDC]"
              >
                <span class="block font-medium text-[#0B2C63]">{{ kind.label }}</span>
                <span class="mt-1 block text-xs text-ink-500">Required — PDF or photos, up to 10 MB each</span>
              </label>

              @if (filesFor(kind.key).length) {
                <ul class="mt-3 space-y-2">
                  @for (file of filesFor(kind.key); track file.name) {
                    <li
                      class="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2 text-sm"
                    >
                      <span class="min-w-0 truncate text-ink-900">{{ file.name }}</span>
                      <button
                        type="button"
                        class="shrink-0 text-xs font-medium text-danger-700 underline"
                        (click)="remove(kind.key, file)"
                      >
                        Remove
                      </button>
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-2 text-xs text-ink-500">No {{ kind.noun }} added yet.</p>
              }
            </div>
          }

          @if (fileError(); as error) {
            <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error }}
            </p>
          }

        </section>

        @if (overBalance()) {
          <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
            Amount exceeds available balance {{ amount(categoryBalance()!.amount) }}
          </p>
        }

        @if (submitProblem(); as problem) {
          <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

        @if (store.submitError(); as error) {
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
            {{ store.submitting() ? 'Submitting…' : 'Submit claim' }}
          </button>
          <a
            routerLink="/member/claims"
            class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
            >Cancel</a
          >
        </div>
      </form>
    </div>
  `,
})
export class NewClaimPage {
  protected readonly store = inject(ClaimsStore);
  protected readonly family = inject(FamilyStore);
  private readonly wallet = inject(WalletStore);
  private readonly router = inject(Router);

  protected readonly categories = signal<readonly ClaimCategory[]>([]);
  protected readonly patientId = signal('');
  protected readonly category = signal('');
  protected readonly claimType = signal('REIMBURSEMENT');
  protected readonly treatmentDate = signal('');
  protected readonly providerName = signal('');
  protected readonly billAmount = signal<number | null>(null);
  protected readonly billNumber = signal('');
  protected readonly description = signal('');
  protected readonly prescriptionFiles = signal<readonly File[]>([]);
  protected readonly billFiles = signal<readonly File[]>([]);
  protected readonly docKinds = [
    { key: 'prescription' as const, label: 'Add prescriptions', noun: 'prescriptions' },
    { key: 'bill' as const, label: 'Add bills', noun: 'bills' },
  ];
  protected readonly fileError = signal<string | null>(null);

  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly amount = (value: number) => formatMoney(money(value));

  constructor() {
    void this.store.categories().then((rows) => this.categories.set(rows));

    // Prefill the patient ONCE.
    //
    // This effect reads the signal it writes, so "only when empty" is not a
    // guard: the member clears the field, the effect re-runs and puts the value
    // straight back, and the field cannot be emptied. Third instance of the
    // shape — the ONLINE contact number (session 25) and both upload prefills
    // (session 41) were the same two lines. Found by
    // `audit/30-effect-self-write-scan.mjs` rather than by reading.
    let patientPrefilled = false;
    effect(() => {
      const active = this.family.activeMember();
      if (active && !patientPrefilled && !this.patientId()) {
        patientPrefilled = true;
        this.patientId.set(active.id);
      }
    });
  }

  protected readonly selectedCategory = computed(() =>
    this.categories().find((option) => option.claimCategory === this.category()),
  );

  /** Warned about, not blocked — the API decides what it reimburses. */
  protected readonly overLimit = computed(() => {
    const chosen = this.selectedCategory();
    const amount = this.billAmount();
    return Boolean(chosen && chosen.perClaimLimit > 0 && amount && amount > chosen.perClaimLimit);
  });

  /**
   * Available balance for the chosen category, or null when it cannot be resolved.
   *
   * Distinct from `overLimit` (the per-claim limit, warned about) and from
   * `capNotice` (what the API actually capped, reported afterwards). Those two
   * answer "does this claim exceed policy limits"; this answers "can this member
   * afford it now". The reference checks it before submission and names the
   * figure, so omitting it would drop a guard the member currently has.
   */
  protected readonly categoryBalance = computed(() => {
    const chosen = this.selectedCategory();
    const wallet = this.wallet.wallet();
    if (!chosen || !wallet) return null;
    const match = wallet.categories.find(
      (row) => row.code === this.category() || row.code === chosen.id,
    );
    // Unlimited categories have no balance to exceed.
    return match && !match.isUnlimited ? match.available : null;
  });

  /** Blocks submission, unlike overLimit. Silent when the balance is unknown. */
  protected readonly overBalance = computed(() => {
    const balance = this.categoryBalance();
    const amount = this.billAmount();
    return Boolean(balance && amount && amount > balance.amount);
  });

  /**
   * Set when submission cannot proceed, so the screen names what is missing
   * instead of leaving an inert button — the pattern
   * `appointment-confirm-page.confirmProblem` and the upload form already use.
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

  /** Only the in-flight guard; completeness is checked on attempt so it can be reported. */
  protected readonly canSubmit = computed(() => !this.store.submitting());

  /** First unmet requirement, named. Follows the order the form presents them in. */
  protected missingField(): string | null {
    if (this.patientId() === '') return 'Choose which patient this claim is for.';
    if (this.category() === '') return 'Choose a claim category.';
    if (this.treatmentDate() === '') return 'Choose the treatment date.';
    if (this.providerName().trim() === '') return 'Enter the provider name.';
    if ((this.billAmount() ?? 0) <= 0) return 'Enter the bill amount.';
    if (this.overBalance())
      return `Amount exceeds available balance ${this.amount(this.categoryBalance()!.amount)}.`;
    if (this.prescriptionFiles().length === 0) return 'Attach the prescription.';
    if (this.billFiles().length === 0) return 'Attach the bill.';
    return null;
  }

  protected relationship(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  protected filesFor(kind: DocKind): readonly File[] {
    return kind === 'prescription' ? this.prescriptionFiles() : this.billFiles();
  }

  private setFiles(kind: DocKind, next: readonly File[]): void {
    (kind === 'prescription' ? this.prescriptionFiles : this.billFiles).set(next);
  }

  protected onFilesChosen(kind: DocKind, event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = Array.from(input.files ?? []);
    input.value = '';

    const tooBig = chosen.find((file) => file.size > MAX_BYTES);
    this.fileError.set(tooBig ? `${tooBig.name} is larger than 10 MB.` : null);
    this.setFiles(kind, [...this.filesFor(kind), ...chosen.filter((file) => file.size <= MAX_BYTES)]);
  }

  protected remove(kind: DocKind, file: File): void {
    this.setFiles(kind, this.filesFor(kind).filter((candidate) => candidate !== file));
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.attempted.set(true);
    if (this.missingField()) return;

    // `missingField()` already covers an empty patient; this only catches an id
    // that is set but no longer in the family list, and `attempted` is true by
    // now so the computed message is on screen either way.
    const patient = this.family.family().find((member) => member.id === this.patientId());
    if (!patient) return;

    const createdId = await this.store.submit({
      userId: patient.id,
      patientName: patient.fullName,
      relationToMember: patient.relationship,
      claimType: this.claimType(),
      category: this.category(),
      treatmentDate: this.treatmentDate(),
      providerName: this.providerName().trim(),
      billAmount: this.billAmount() ?? 0,
      billNumber: this.billNumber().trim(),
      treatmentDescription: this.description().trim(),
      documents: [...this.prescriptionFiles(), ...this.billFiles()],
    });

    if (createdId === null) return;
    // The detail route takes the Mongo _id, not the CLM-… reference.
    await this.router.navigate(['/member/claims', createdId]);
  }
}
