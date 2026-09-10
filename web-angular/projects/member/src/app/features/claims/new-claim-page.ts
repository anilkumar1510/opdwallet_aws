import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClaimsStore } from '../../core/claims/claims.store';
import { ClaimCategory } from '../../core/claims/claim.mapper';
import { claimRulesFor } from '../../core/claims/claim-rules';
import {
  DentalSubType,
  DocSlotKey,
  documentSlotsFor,
  isDentalCategory,
  locationFieldsFor,
} from '../../core/claims/document-requirements';
import { relationshipLabel } from '../../core/domain/codes';
import { formatMoney, money } from '../../core/domain/money';
import {
  BankDetailsStore,
  isValidAccountNumber,
  isValidIfsc,
} from '../../core/member/bank-details.store';
import { FamilyStore } from '../../core/family/family.store';
import { Member } from '../../core/member/member.model';

const MAX_BYTES = 5 * 1024 * 1024;

const STEPS = [
  { n: 1 as const, label: 'Details' },
  { n: 2 as const, label: 'Documents' },
  { n: 3 as const, label: 'Review' },
];

/** Submit a reimbursement claim, in three steps: details, documents, review. */
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

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <!-- Step indicator -->
        <ol class="mb-6 flex items-center gap-2">
          @for (s of steps; track s.n) {
            <li class="flex flex-1 items-center gap-2">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                [class.bg-[#0F5FDC]]="step() >= s.n"
                [class.text-white]="step() >= s.n"
                [class.bg-surface-border]="step() < s.n"
                [class.text-ink-500]="step() < s.n"
                >{{ s.n }}</span
              >
              <span
                class="text-sm font-medium"
                [class.text-ink-900]="step() >= s.n"
                [class.text-ink-500]="step() < s.n"
                >{{ s.label }}</span
              >
              @if (!$last) {
                <span class="h-px flex-1 bg-surface-border"></span>
              }
            </li>
          }
        </ol>

        <form (ngSubmit)="onPrimary()">
          <!-- ── Step 1 · Details ─────────────────────────────────────────── -->
          @if (step() === 1) {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">Treatment details</h2>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="patient" class="mb-1 block text-sm font-medium text-ink-700">Patient</label>
                  <select id="patient" name="patient" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="patientId()" (ngModelChange)="patientId.set($event)">
                    @for (member of family.family(); track member.id) {
                      <option [value]="member.id">{{ member.fullName }} ({{ relationship(member) }})</option>
                    }
                  </select>
                </div>

                <div>
                  <label for="category" class="mb-1 block text-sm font-medium text-ink-700">Category</label>
                  <select id="category" name="category" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="category()" (ngModelChange)="category.set($event)">
                    <option value="">Select a category</option>
                    @for (option of categories(); track option.id) {
                      <option [value]="option.claimCategory">{{ option.name }}{{ option.isPlaceholder ? ' (test — not on plan)' : '' }}</option>
                    }
                  </select>
                  @if (selectedCategory(); as chosen) {
                    @if (chosen.isPlaceholder) {
                      <p class="mt-1 text-xs text-warning-700">Test category — not configured on this member's plan. The flow works; a real submission would be rejected.</p>
                    } @else if (chosen.perClaimLimit > 0) {
                      <p class="mt-1 text-xs text-ink-500">Up to {{ amount(chosen.perClaimLimit) }} per claim</p>
                    }
                  }
                </div>

                @if (isDental()) {
                  <div class="sm:col-span-2">
                    <span class="mb-1 block text-sm font-medium text-ink-700">Dental claim type</span>
                    <div class="flex gap-2">
                      @for (option of dentalOptions; track option.value) {
                        <button type="button" class="min-h-touch flex-1 rounded-xl border px-3 text-sm font-medium" [class.border-brand-500]="dentalSubType() === option.value" [class.bg-blue-50]="dentalSubType() === option.value" [class.text-brand-700]="dentalSubType() === option.value" [class.border-surface-border]="dentalSubType() !== option.value" [class.text-ink-700]="dentalSubType() !== option.value" (click)="dentalSubType.set(option.value)">{{ option.label }}</button>
                      }
                    </div>
                    <p class="mt-1 text-xs text-ink-500">A procedure needs a lab / diagnostic report; a consultation does not.</p>
                  </div>
                }

                <div>
                  <label for="claimType" class="mb-1 block text-sm font-medium text-ink-700">Claim type</label>
                  <select id="claimType" name="claimType" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="claimType()" (ngModelChange)="claimType.set($event)">
                    <option value="REIMBURSEMENT">Reimbursement</option>
                    <option value="CASHLESS_PREAUTH">Cashless pre-authorisation</option>
                  </select>
                </div>

                <div>
                  <label for="treatmentDate" class="mb-1 block text-sm font-medium text-ink-700">Treatment date</label>
                  <input id="treatmentDate" name="treatmentDate" type="date" [max]="today" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="treatmentDate()" (ngModelChange)="treatmentDate.set($event)" />
                </div>

                <!-- Location fields per category (matrix): one for consults /
                     dental / vaccination, two for pharmacy, pathology, radiology,
                     vision. Second location is a PLACEHOLDER param. -->
                @for (field of locationFields(); track field.key) {
                  <div>
                    <label [attr.for]="field.key" class="mb-1 block text-sm font-medium text-ink-700">{{ field.label }}</label>
                    <input [id]="field.key" [name]="field.key" [placeholder]="field.placeholder" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="locationValue(field.key)" (ngModelChange)="setLocation(field.key, $event)" [ngModelOptions]="{ standalone: true }" />
                  </div>
                }

                <div>
                  <label for="billAmount" class="mb-1 block text-sm font-medium text-ink-700">Bill amount</label>
                  <input id="billAmount" name="billAmount" type="number" min="1" inputmode="numeric" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="billAmount()" (ngModelChange)="billAmount.set($event)" />
                  @if (overLimit()) {
                    <p class="mt-1 text-xs text-warning-700">Above the {{ amount(selectedCategory()!.perClaimLimit) }} per-claim limit — the excess will not be reimbursed.</p>
                  }
                </div>

                <div>
                  <label for="billNumber" class="mb-1 block text-sm font-medium text-ink-700">Bill number (optional)</label>
                  <input id="billNumber" name="billNumber" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="billNumber()" (ngModelChange)="billNumber.set($event)" />
                </div>

                <div class="sm:col-span-2">
                  <label for="description" class="mb-1 block text-sm font-medium text-ink-700">Description (optional)</label>
                  <textarea id="description" name="description" rows="3" placeholder="What was the treatment for?" class="w-full rounded-xl border border-surface-border bg-white p-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="description()" (ngModelChange)="description.set($event)"></textarea>
                </div>
              </div>
            </section>
          }

          <!-- ── Step 2 · Documents (+ payout bank account) ───────────────── -->
          @if (step() === 2) {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-1 text-base font-semibold text-[#0E51A2] lg:text-lg">Documents</h2>
              <p class="mb-4 text-xs text-ink-500">What's needed depends on the category you chose.</p>

              @for (slot of docSlots(); track slot.key) {
                <div class="mb-4">
                  <input type="file" class="sr-only" multiple accept="image/*,.pdf" [id]="'doc-' + slot.key" (change)="onFilesChosen(slot.key, $event)" />
                  <label [attr.for]="'doc-' + slot.key" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-6 text-center transition-colors hover:border-[#0F5FDC]">
                    <span class="block font-medium text-[#0B2C63]">{{ slot.label }}</span>
                    <span class="mt-1 block text-xs" [class.text-danger-700]="slot.requirement === 'required'" [class.text-ink-500]="slot.requirement !== 'required'">{{ slot.requirement === 'required' ? 'Required' : 'Optional' }} — PDF or photos, up to 5 MB each</span>
                  </label>
                  @if (filesFor(slot.key).length) {
                    <ul class="mt-3 space-y-2">
                      @for (file of filesFor(slot.key); track file.name) {
                        <li class="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2 text-sm">
                          <span class="min-w-0 truncate text-ink-900">{{ file.name }}</span>
                          <button type="button" class="shrink-0 text-xs font-medium text-danger-700 underline" (click)="remove(slot.key, file)">Remove</button>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="mt-2 text-xs text-ink-500">No {{ slot.noun }} added yet.</p>
                  }
                </div>
              }

              @if (fileError(); as error) {
                <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ error }}</p>
              }
            </section>

            <!-- Payout bank account. PLACEHOLDER — held locally, no API yet. -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-1 text-base font-semibold text-[#0E51A2] lg:text-lg">Bank account for payout</h2>
              @if (bank.hasDetails()) {
                <p class="text-sm text-ink-700">Reimbursement will be paid to <span class="font-medium text-ink-900">{{ bank.maskedAccount() }}</span> at {{ bank.details()?.bankName }}. Manage this in your Profile.</p>
              } @else {
                <p class="mb-4 text-xs text-ink-500">Asked once and saved for every future claim. Approved money is credited here, not to the wallet.</p>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label for="bankHolder" class="mb-1 block text-sm font-medium text-ink-700">Account holder name</label>
                    <input id="bankHolder" name="bankHolder" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="bankHolder()" (ngModelChange)="bankHolder.set($event)" [ngModelOptions]="{ standalone: true }" />
                  </div>
                  <div>
                    <label for="bankAccount" class="mb-1 block text-sm font-medium text-ink-700">Account number</label>
                    <input id="bankAccount" name="bankAccount" inputmode="numeric" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="bankAccount()" (ngModelChange)="bankAccount.set($event)" [ngModelOptions]="{ standalone: true }" />
                  </div>
                  <div>
                    <label for="bankIfsc" class="mb-1 block text-sm font-medium text-ink-700">IFSC code</label>
                    <input id="bankIfsc" name="bankIfsc" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm uppercase focus:border-brand-500 focus:outline-none" [ngModel]="bankIfsc()" (ngModelChange)="bankIfsc.set($event)" [ngModelOptions]="{ standalone: true }" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="bankName" class="mb-1 block text-sm font-medium text-ink-700">Bank name</label>
                    <input id="bankName" name="bankName" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="bankName()" (ngModelChange)="bankName.set($event)" [ngModelOptions]="{ standalone: true }" />
                  </div>
                  <div class="sm:col-span-2">
                    <span class="mb-1 block text-sm font-medium text-ink-700">Cancelled cheque</span>
                    <input type="file" class="sr-only" accept="image/*,.pdf" id="cheque" (change)="onChequeChosen($event)" />
                    <label for="cheque" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-5 text-center transition-colors hover:border-[#0F5FDC]">
                      <span class="block font-medium text-[#0B2C63]">{{ chequeFile() ? 'Replace cancelled cheque' : 'Upload cancelled cheque' }}</span>
                      <span class="mt-1 block text-xs text-danger-700">Required — a cancelled cheque or passbook page. PDF or photo, up to 5 MB.</span>
                    </label>
                    @if (chequeFile(); as file) {
                      <p class="mt-2 truncate text-sm text-ink-900">{{ file.name }}</p>
                    }
                    @if (chequeError(); as error) {
                      <p class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ error }}</p>
                    }
                  </div>
                </div>
              }
            </section>
          }

          <!-- ── Step 3 · Review ──────────────────────────────────────────── -->
          @if (step() === 3) {
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">Review your claim</h2>
              <dl class="space-y-3 text-sm">
                @for (row of summaryRows(); track row.label) {
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                    <dt class="text-ink-500">{{ row.label }}</dt>
                    <dd class="text-right font-medium text-ink-900">{{ row.value }}</dd>
                  </div>
                }
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-500">Documents</dt>
                  <dd class="text-right font-medium text-ink-900">{{ documentCount() }} attached</dd>
                </div>
              </dl>
            </section>

            <!-- Payment breakdown — the money rules. Per-claim limit is known;
                 co-payment and per-transaction limit are confirmed at
                 adjudication (no client-side figure). -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="mb-4 text-base font-semibold text-[#0E51A2] lg:text-lg">Payment breakdown</h2>
              @if (estimate(); as est) {
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Bill amount</dt>
                    <dd class="font-medium text-ink-900">{{ amount(est.bill) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Per-claim limit</dt>
                    <dd class="font-medium text-ink-900">{{ est.perClaim !== null ? amount(est.perClaim) : 'No limit' }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">
                      Per-transaction limit
                      @if (!est.txnReal) {
                        <span class="text-[11px] text-warning-700">· placeholder</span>
                      }
                    </dt>
                    <dd class="font-medium text-ink-900">{{ est.perTxn !== null ? amount(est.perTxn) : 'No limit' }}</dd>
                  </div>
                  <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                    <dt class="text-ink-700">Eligible amount</dt>
                    <dd class="font-medium text-ink-900">{{ amount(est.eligible) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">
                      Co-payment{{ est.copayMode === 'PERCENT' ? ' (' + est.copayValue + '%)' : '' }}
                      @if (!est.copayReal) {
                        <span class="text-[11px] text-warning-700">· placeholder</span>
                      }
                    </dt>
                    <dd class="font-medium text-danger-700">− {{ amount(est.copayAmount) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Reimbursable amount</dt>
                    <dd class="font-medium text-ink-900">{{ amount(est.reimbursable) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                    <dt class="font-semibold text-ink-900">Estimated wallet deduction</dt>
                    <dd class="font-semibold text-success-700">{{ est.balanceKnown ? amount(est.walletDeduction) : '—' }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="font-semibold text-ink-900">Estimated out-of-pocket</dt>
                    <dd class="font-semibold text-ink-900">{{ est.balanceKnown ? amount(est.outOfPocket) : '—' }}</dd>
                  </div>
                </dl>
                <p class="mt-3 text-xs text-ink-500">
                  Estimates.
                  @if (!est.copayReal || !est.txnReal) {
                    Rows marked <span class="text-warning-700">placeholder</span> are not from this
                    policy yet.
                  }
                  The final co-payment, capping and deductible are confirmed when the claim is
                  adjudicated.
                </p>
                @if (!est.balanceKnown) {
                  <p class="mt-1 text-xs text-warning-700">
                    Wallet figures are hidden because this category has no balance configured for this member (test category).
                  </p>
                }
              }
            </section>
          }

          @if (overBalance()) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">Amount exceeds available balance {{ amount(categoryBalance()!.amount) }}</p>
          }
          @if (problem(); as message) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ message }}</p>
          }
          @if (store.submitError(); as error) {
            <p class="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ error }}</p>
          }

          <div class="mt-5 flex flex-wrap gap-3">
            @if (step() > 1) {
              <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]" (click)="back()">Back</button>
            }
            <button type="submit" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2] disabled:opacity-50" [disabled]="!canSubmit()">
              {{ step() < 3 ? 'Continue' : (store.submitting() ? 'Submitting…' : 'Submit claim') }}
            </button>
            @if (step() === 1) {
              <a routerLink="/member/claims" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]">Cancel</a>
            }
          </div>
        </form>
      </div>
    </div>
  `,
})
export class NewClaimPage {
  protected readonly store = inject(ClaimsStore);
  protected readonly family = inject(FamilyStore);
  protected readonly bank = inject(BankDetailsStore);
  private readonly router = inject(Router);

  protected readonly steps = STEPS;
  protected readonly step = signal<1 | 2 | 3>(1);
  protected readonly problem = signal<string | null>(null);

  protected readonly categories = signal<readonly ClaimCategory[]>([]);
  protected readonly patientId = signal('');
  protected readonly category = signal('');
  protected readonly dentalSubType = signal<DentalSubType>('consultation');
  protected readonly dentalOptions = [
    { value: 'consultation' as const, label: 'Consultation' },
    { value: 'procedure' as const, label: 'Procedure' },
  ];
  protected readonly claimType = signal('REIMBURSEMENT');
  protected readonly treatmentDate = signal('');
  protected readonly providerName = signal('');
  /** PLACEHOLDER param — second location for two-location categories. */
  protected readonly purchaseLocation = signal('');
  protected readonly billAmount = signal<number | null>(null);
  protected readonly billNumber = signal('');
  protected readonly description = signal('');

  protected readonly prescriptionFiles = signal<readonly File[]>([]);
  protected readonly billFiles = signal<readonly File[]>([]);
  protected readonly reportFiles = signal<readonly File[]>([]);
  protected readonly otherFiles = signal<readonly File[]>([]);
  protected readonly fileError = signal<string | null>(null);

  protected readonly bankHolder = signal('');
  protected readonly bankAccount = signal('');
  protected readonly bankIfsc = signal('');
  protected readonly bankName = signal('');
  protected readonly chequeFile = signal<File | null>(null);
  protected readonly chequeError = signal<string | null>(null);

  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly amount = (value: number) => formatMoney(money(value));

  constructor() {
    void this.store.categories().then((rows) => this.categories.set(rows));

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

  protected readonly docSlots = computed(() =>
    documentSlotsFor(this.category(), this.dentalSubType()),
  );
  protected readonly isDental = computed(() => isDentalCategory(this.category()));
  protected readonly locationFields = computed(() => locationFieldsFor(this.category()));

  protected readonly overLimit = computed(() => {
    const chosen = this.selectedCategory();
    const amount = this.billAmount();
    return Boolean(chosen && chosen.perClaimLimit > 0 && amount && amount > chosen.perClaimLimit);
  });

  protected readonly categoryBalance = computed(() => {
    const chosen = this.selectedCategory();
    if (!chosen || chosen.isPlaceholder) return null;
    // DUMMY — static per-category balance (₹5,000), no wallet API.
    return money(5000);
  });

  protected readonly overBalance = computed(() => {
    const balance = this.categoryBalance();
    const amount = this.billAmount();
    return Boolean(balance && amount && amount > balance.amount);
  });

  /**
   * The money breakdown for the review step. Per-claim limit is real; the
   * per-transaction limit and co-payment % are PLACEHOLDER policy values
   * (`claimRulesFor`) so the calculation is live. The server confirms the finals.
   *
   * Order of gates: bill → per-claim cap → per-transaction cap → co-payment →
   * reimbursable → wallet debit (bounded by balance) → out-of-pocket.
   */
  protected readonly estimate = computed(() => {
    const bill = this.billAmount() ?? 0;
    const chosen = this.selectedCategory();
    const rules = claimRulesFor(this.category());

    const perClaim = chosen && chosen.perClaimLimit > 0 ? chosen.perClaimLimit : null;
    const afterClaim = perClaim !== null ? Math.min(bill, perClaim) : bill;

    // Per-transaction limit: real from the plan config when the API sent it,
    // otherwise the placeholder rule.
    const txnReal = !!chosen && chosen.perTransactionLimit !== null;
    const perTxn = txnReal
      ? chosen!.perTransactionLimit
      : rules.perTransactionLimit > 0
        ? rules.perTransactionLimit
        : null;
    const eligible = perTxn !== null ? Math.min(afterClaim, perTxn) : afterClaim;

    // Co-payment: real from the wallet config when present, otherwise placeholder.
    const copayReal = !!chosen && chosen.copayValue !== null;
    const copayMode: 'PERCENT' | 'FLAT' = copayReal ? chosen!.copayMode! : 'PERCENT';
    const copayValue = copayReal ? chosen!.copayValue! : rules.copayPercent;
    const copayAmount =
      copayMode === 'PERCENT'
        ? Math.round((eligible * copayValue) / 100)
        : Math.min(copayValue, eligible);
    const reimbursable = Math.max(0, eligible - copayAmount);

    const balance = this.categoryBalance();
    const balanceAmount = balance ? balance.amount : null;
    const walletDeduction =
      balanceAmount !== null ? Math.min(reimbursable, balanceAmount) : reimbursable;
    const outOfPocket = Math.max(0, bill - walletDeduction);

    return {
      bill,
      perClaim,
      afterClaim,
      capped: perClaim !== null && bill > perClaim,
      perTxn,
      txnReal,
      txnCapped: perTxn !== null && afterClaim > perTxn,
      eligible,
      copayReal,
      copayMode,
      copayValue,
      copayAmount,
      reimbursable,
      walletDeduction,
      outOfPocket,
      balanceKnown: balanceAmount !== null,
    };
  });

  protected readonly documentCount = computed(() =>
    this.docSlots().reduce((sum, slot) => sum + this.filesFor(slot.key).length, 0),
  );

  /** Read-back rows for the review step. */
  protected readonly summaryRows = computed(() => {
    const patient = this.family.family().find((m) => m.id === this.patientId());
    const chosen = this.selectedCategory();
    const rows: { label: string; value: string }[] = [
      { label: 'Patient', value: patient?.fullName ?? '—' },
      { label: 'Category', value: chosen?.name ?? '—' },
    ];
    if (this.isDental()) {
      rows.push({ label: 'Dental type', value: this.dentalSubType() === 'procedure' ? 'Procedure' : 'Consultation' });
    }
    rows.push({ label: 'Claim type', value: this.claimType() === 'CASHLESS_PREAUTH' ? 'Cashless pre-authorisation' : 'Reimbursement' });
    rows.push({ label: 'Treatment date', value: this.treatmentDate() || '—' });
    for (const field of this.locationFields()) {
      const value = this.locationValue(field.key).trim();
      if (value) rows.push({ label: field.label.replace(' (optional)', ''), value });
    }
    if (this.billNumber().trim()) rows.push({ label: 'Bill number', value: this.billNumber().trim() });
    if (this.description().trim()) rows.push({ label: 'Description', value: this.description().trim() });
    return rows;
  });

  /** In-flight guard only; step completeness is checked on Continue / Submit. */
  protected readonly canSubmit = computed(() => !this.store.submitting());

  // ── Step validation ────────────────────────────────────────────────────

  private missingStep1(): string | null {
    if (this.patientId() === '') return 'Choose which patient this claim is for.';
    if (this.category() === '') return 'Choose a claim category.';
    for (const field of this.locationFields()) {
      if (field.required && this.locationValue(field.key).trim() === '') {
        return `Enter the ${field.label.toLowerCase()}.`;
      }
    }
    if (this.treatmentDate() === '') return 'Choose the treatment date.';
    if ((this.billAmount() ?? 0) <= 0) return 'Enter the bill amount.';
    if (this.overBalance())
      return `Amount exceeds available balance ${this.amount(this.categoryBalance()!.amount)}.`;
    return null;
  }

  private missingStep2(): string | null {
    for (const slot of this.docSlots()) {
      if (slot.requirement === 'required' && this.filesFor(slot.key).length === 0) {
        return `Attach the ${slotNoun(slot.key)}.`;
      }
    }
    return this.missingBankField();
  }

  private missingBankField(): string | null {
    if (this.bank.hasDetails()) return null;
    if (this.bankHolder().trim() === '') return 'Enter the account holder name.';
    if (!isValidAccountNumber(this.bankAccount())) return 'Enter a valid account number (9–18 digits).';
    if (!isValidIfsc(this.bankIfsc())) return 'Enter a valid IFSC code (e.g. HDFC0001234).';
    if (this.bankName().trim() === '') return 'Enter the bank name.';
    if (!this.chequeFile()) return 'Upload a cancelled cheque.';
    return null;
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  /** The single submit control: advances a step, or files the claim on step 3. */
  protected onPrimary(): void {
    if (this.step() === 3) {
      void this.submit();
      return;
    }
    const missing = this.step() === 1 ? this.missingStep1() : this.missingStep2();
    if (missing) {
      this.problem.set(missing);
      return;
    }
    this.problem.set(null);
    this.step.set((this.step() + 1) as 1 | 2 | 3);
  }

  protected back(): void {
    this.problem.set(null);
    if (this.step() > 1) this.step.set((this.step() - 1) as 1 | 2 | 3);
  }

  // ── Field helpers ──────────────────────────────────────────────────────

  protected relationship(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  protected locationValue(key: 'providerName' | 'purchaseLocation'): string {
    return key === 'providerName' ? this.providerName() : this.purchaseLocation();
  }

  protected setLocation(key: 'providerName' | 'purchaseLocation', value: string): void {
    (key === 'providerName' ? this.providerName : this.purchaseLocation).set(value);
  }

  protected filesFor(kind: DocSlotKey): readonly File[] {
    switch (kind) {
      case 'prescription':
        return this.prescriptionFiles();
      case 'bill':
        return this.billFiles();
      case 'report':
        return this.reportFiles();
      case 'other':
        return this.otherFiles();
    }
  }

  private setFiles(kind: DocSlotKey, next: readonly File[]): void {
    ({
      prescription: this.prescriptionFiles,
      bill: this.billFiles,
      report: this.reportFiles,
      other: this.otherFiles,
    })[kind].set(next);
  }

  protected onFilesChosen(kind: DocSlotKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = Array.from(input.files ?? []);
    input.value = '';
    const tooBig = chosen.find((file) => file.size > MAX_BYTES);
    this.fileError.set(tooBig ? `${tooBig.name} is larger than 5 MB.` : null);
    this.setFiles(kind, [...this.filesFor(kind), ...chosen.filter((file) => file.size <= MAX_BYTES)]);
  }

  protected remove(kind: DocSlotKey, file: File): void {
    this.setFiles(kind, this.filesFor(kind).filter((candidate) => candidate !== file));
  }

  protected onChequeChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = (input.files ?? [])[0] ?? null;
    input.value = '';
    if (file && file.size > MAX_BYTES) {
      this.chequeError.set(`${file.name} is larger than 5 MB.`);
      return;
    }
    this.chequeError.set(null);
    this.chequeFile.set(file);
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    // Guard the whole form, in case a later step was reached and an earlier
    // field was cleared.
    const missing = this.missingStep1() ?? this.missingStep2();
    if (missing) {
      this.problem.set(missing);
      this.step.set(this.missingStep1() ? 1 : 2);
      return;
    }
    this.problem.set(null);

    const patient = this.family.family().find((member) => member.id === this.patientId());
    if (!patient) return;

    if (!this.bank.hasDetails()) {
      const cheque = this.chequeFile();
      // TODO(API): the cheque FILE must be uploaded — only its name is kept.
      if (cheque) console.info('[PLACEHOLDER] cancelled cheque captured, not yet uploaded:', cheque.name);
      this.bank.save({
        accountHolderName: this.bankHolder(),
        accountNumber: this.bankAccount(),
        ifsc: this.bankIfsc(),
        bankName: this.bankName(),
        cancelledChequeName: cheque?.name ?? '',
      });
    }

    // TODO(API): purchaseLocation (second location) is captured but not sent.
    if (this.purchaseLocation().trim()) {
      console.info('[PLACEHOLDER] purchaseLocation captured, not yet sent:', this.purchaseLocation().trim());
    }

    const documents = this.docSlots().flatMap((slot) => [...this.filesFor(slot.key)]);

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
      documents,
    });

    if (createdId === null) return;
    await this.router.navigate(['/member/claims', createdId]);
  }
}

function slotNoun(kind: DocSlotKey): string {
  switch (kind) {
    case 'prescription':
      return 'prescription';
    case 'bill':
      return 'bill or invoice';
    case 'report':
      return 'lab / diagnostic report';
    case 'other':
      return 'supporting document';
  }
}
