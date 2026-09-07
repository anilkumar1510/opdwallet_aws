import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { relationshipLabel } from '../../core/domain/codes';
import {
  BankDetailsStore,
  isValidAccountNumber,
  isValidIfsc,
} from '../../core/member/bank-details.store';
import { FamilyStore } from '../../core/family/family.store';
import { ProfileStore } from '../../core/member/profile.store';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

@Component({
  selector: 'opd-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LoadingView, EmptyView, BackLink, PageHeader],
  template: `
    <opd-page-header title="Profile" subtitle="Your details and saved addresses" />

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <div class="hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Profile</h1>
        <p class="mt-0.5 text-sm text-ink-500">Your details and saved addresses</p>
      </div>

      @if (member(); as person) {
        <section
          class="mt-5 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-5"
          style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-[#0E51A2]"
              style="background: linear-gradient(261.92deg, rgba(223,232,255,.75) 4.4%, rgba(189,209,255,.75) 91.97%); border: 1px solid #A4BFFE7A"
              aria-hidden="true"
              >{{ person.initials }}</span
            >
            <div class="min-w-0">
              <p class="truncate text-lg font-semibold text-[#034DA2]">{{ person.fullName }}</p>
              <p class="text-sm text-ink-500">{{ relationship() }}</p>
            </div>
          </div>

          <dl class="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            @for (row of details(); track row.label) {
              <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                <dt class="text-sm text-ink-500">{{ row.label }}</dt>
                <dd class="truncate text-sm font-medium text-ink-900">{{ row.value }}</dd>
              </div>
            }
          </dl>
        </section>

        <section class="mt-6">
          <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Saved addresses</h2>

          @if (addresses.loading()) {
            <opd-loading label="Loading addresses" />
          } @else if (addresses.error()) {
            <opd-empty
              title="Addresses unavailable"
              detail="We could not load your saved addresses right now."
            />
          } @else if (addresses.addresses().length) {
            <ul class="grid gap-3 sm:grid-cols-2">
              @for (address of addresses.addresses(); track address.id) {
                <li
                  class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                  style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-[#034DA2]">{{ address.typeLabel }}</span>
                    @if (address.isDefault) {
                      <span class="rounded-md bg-success-50 px-1.5 py-0.5 text-xs font-medium text-success-700"
                        >Default</span
                      >
                    }
                  </div>
                  <p class="mt-1 text-sm text-ink-700">{{ address.lines.join(', ') }}</p>
                </li>
              }
            </ul>
          } @else {
            <opd-empty title="No saved addresses" detail="Addresses you save appear here." />
          }
        </section>

        <!-- Payout bank account for reimbursement claims. PLACEHOLDER — held
             locally, no API yet (bank-details.store / PLACEHOLDER-APIS.md). -->
        <section class="mt-6">
          <h2 class="mb-3 text-[18px] font-medium text-[#1c1c1c]">Bank account for reimbursements</h2>
          <div
            class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-5"
            style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
          >
            @if (bank.hasDetails() && !editingBank()) {
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                  <dt class="text-ink-500">Account holder</dt>
                  <dd class="font-medium text-ink-900">{{ bank.details()?.accountHolderName }}</dd>
                </div>
                <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                  <dt class="text-ink-500">Account number</dt>
                  <dd class="font-medium text-ink-900">{{ bank.maskedAccount() }}</dd>
                </div>
                <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                  <dt class="text-ink-500">IFSC</dt>
                  <dd class="font-medium text-ink-900">{{ bank.details()?.ifsc }}</dd>
                </div>
                <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                  <dt class="text-ink-500">Bank</dt>
                  <dd class="font-medium text-ink-900">{{ bank.details()?.bankName }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-500">Cancelled cheque</dt>
                  <dd class="truncate font-medium text-ink-900">
                    {{ bank.details()?.cancelledChequeName || 'Not uploaded' }}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                class="mt-4 min-h-touch rounded-xl border border-surface-border px-5 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
                (click)="startEdit()"
              >
                Edit
              </button>
            } @else {
              <p class="mb-4 text-xs text-ink-500">
                Approved reimbursement money is credited to this account, not to the wallet.
              </p>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label for="pHolder" class="mb-1 block text-sm font-medium text-ink-700">Account holder name</label>
                  <input id="pHolder" name="pHolder" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="bankHolder()" (ngModelChange)="bankHolder.set($event)" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label for="pAccount" class="mb-1 block text-sm font-medium text-ink-700">Account number</label>
                  <input id="pAccount" name="pAccount" inputmode="numeric" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="bankAccount()" (ngModelChange)="bankAccount.set($event)" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label for="pIfsc" class="mb-1 block text-sm font-medium text-ink-700">IFSC code</label>
                  <input id="pIfsc" name="pIfsc" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm uppercase focus:border-brand-500 focus:outline-none" [ngModel]="bankIfsc()" (ngModelChange)="bankIfsc.set($event)" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div class="sm:col-span-2">
                  <label for="pBank" class="mb-1 block text-sm font-medium text-ink-700">Bank name</label>
                  <input id="pBank" name="pBank" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [ngModel]="bankName()" (ngModelChange)="bankName.set($event)" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div class="sm:col-span-2">
                  <span class="mb-1 block text-sm font-medium text-ink-700">Cancelled cheque</span>
                  <input type="file" class="sr-only" accept="image/*,.pdf" id="pCheque" (change)="onChequeChosen($event)" />
                  <label for="pCheque" class="block w-full cursor-pointer rounded-xl border-2 border-dashed border-[#CDDDFE] bg-[#F7FAFF] px-6 py-5 text-center transition-colors hover:border-[#0F5FDC]">
                    <span class="block font-medium text-[#0B2C63]">
                      {{ chequeFile() || existingCheque() ? 'Replace cancelled cheque' : 'Upload cancelled cheque' }}
                    </span>
                    <span class="mt-1 block text-xs text-ink-500">Required — PDF or photo, up to 5 MB.</span>
                  </label>
                  @if (chequeFile()?.name || existingCheque(); as name) {
                    <p class="mt-2 truncate text-sm text-ink-900">{{ name }}</p>
                  }
                  @if (chequeError(); as error) {
                    <p class="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ error }}</p>
                  }
                </div>
              </div>

              @if (bankProblem(); as problem) {
                <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ problem }}</p>
              }

              <div class="mt-4 flex gap-3">
                <button
                  type="button"
                  class="min-h-touch rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                  (click)="saveBank()"
                >
                  Save bank details
                </button>
                @if (bank.hasDetails()) {
                  <button
                    type="button"
                    class="min-h-touch rounded-xl border border-surface-border px-5 text-sm font-semibold text-ink-900"
                    (click)="editingBank.set(false)"
                  >
                    Cancel
                  </button>
                }
              </div>
            }
          </div>
        </section>
      } @else {
        <opd-loading label="Loading profile" />
      }
    </div>
  `,
})
export class ProfilePage {
  private readonly family = inject(FamilyStore);
  protected readonly addresses = inject(ProfileStore);
  protected readonly bank = inject(BankDetailsStore);

  protected readonly editingBank = signal(false);
  protected readonly bankHolder = signal('');
  protected readonly bankAccount = signal('');
  protected readonly bankIfsc = signal('');
  protected readonly bankName = signal('');
  protected readonly bankProblem = signal<string | null>(null);
  protected readonly chequeFile = signal<File | null>(null);
  protected readonly chequeError = signal<string | null>(null);
  /** The cheque already on record, kept if the member does not replace it. */
  protected readonly existingCheque = signal('');

  protected readonly member = computed(() => this.family.activeMember());

  /** Load the saved values into the form before editing. */
  protected startEdit(): void {
    const current = this.bank.details();
    this.bankHolder.set(current?.accountHolderName ?? '');
    this.bankAccount.set(current?.accountNumber ?? '');
    this.bankIfsc.set(current?.ifsc ?? '');
    this.bankName.set(current?.bankName ?? '');
    this.existingCheque.set(current?.cancelledChequeName ?? '');
    this.chequeFile.set(null);
    this.chequeError.set(null);
    this.bankProblem.set(null);
    this.editingBank.set(true);
  }

  protected onChequeChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = (input.files ?? [])[0] ?? null;
    input.value = '';
    if (file && file.size > 5 * 1024 * 1024) {
      this.chequeError.set(`${file.name} is larger than 5 MB.`);
      return;
    }
    this.chequeError.set(null);
    this.chequeFile.set(file);
  }

  protected saveBank(): void {
    if (this.bankHolder().trim() === '') return this.bankProblem.set('Enter the account holder name.');
    if (!isValidAccountNumber(this.bankAccount()))
      return this.bankProblem.set('Enter a valid account number (9–18 digits).');
    if (!isValidIfsc(this.bankIfsc()))
      return this.bankProblem.set('Enter a valid IFSC code (e.g. HDFC0001234).');
    if (this.bankName().trim() === '') return this.bankProblem.set('Enter the bank name.');

    // A new upload wins; otherwise keep whatever cheque was already on record.
    const chequeName = this.chequeFile()?.name || this.existingCheque();
    if (!chequeName) return this.bankProblem.set('Upload a cancelled cheque.');
    // TODO(API): upload the cheque FILE — only its name is stored. See PLACEHOLDER-APIS.md.
    if (this.chequeFile()) {
      console.info('[PLACEHOLDER] cancelled cheque captured, not yet uploaded:', this.chequeFile()!.name);
    }

    this.bank.save({
      accountHolderName: this.bankHolder(),
      accountNumber: this.bankAccount(),
      ifsc: this.bankIfsc(),
      bankName: this.bankName(),
      cancelledChequeName: chequeName,
    });
    this.bankProblem.set(null);
    this.editingBank.set(false);
  }

  protected readonly relationship = computed(() => {
    const person = this.member();
    return person ? relationshipLabel(person.relationship) : '';
  });

  protected readonly details = computed(() => {
    const person = this.member();
    if (!person) return [];
    return [
      { label: 'Member ID', value: person.memberId || '—' },
      { label: 'UHID', value: person.uhid ?? '—' },
      { label: 'Email', value: person.email ?? '—' },
      { label: 'Phone', value: person.phone ?? '—' },
      { label: 'Date of birth', value: person.dateOfBirth ? DATE.format(person.dateOfBirth) : '—' },
      { label: 'Gender', value: person.gender ? this.titleCase(person.gender) : '—' },
    ];
  });

  private titleCase(value: string): string {
    return value.charAt(0) + value.slice(1).toLowerCase();
  }
}
