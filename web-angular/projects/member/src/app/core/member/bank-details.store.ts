import { Injectable, computed, signal } from '@angular/core';

/**
 * The member's payout bank account, captured once and reused on every claim.
 *
 * PLACEHOLDER STORE — there is no API behind this yet. Reimbursement credits go
 * to the member's bank account (patient-flows section 9), and the spec mandates
 * capturing the details once on the first claim and saving them to the profile.
 * Until the endpoints exist this holds the details in memory and mirrors them to
 * localStorage so they survive a reload and the flow is testable end to end.
 *
 * TODO(API) — replace the localStorage read/write with:
 *   GET  member/profile/bank-details            -> BankDetails | null
 *   PUT  member/profile/bank-details {accountHolderName, accountNumber, ifsc, bankName}
 * See web-angular/PLACEHOLDER-APIS.md.
 */

export interface BankDetails {
  readonly accountHolderName: string;
  readonly accountNumber: string;
  readonly ifsc: string;
  readonly bankName: string;
  /**
   * Cancelled-cheque proof. PLACEHOLDER — only the file NAME is kept (a File
   * cannot be persisted to localStorage). The bytes must go to an upload
   * endpoint; see PLACEHOLDER-APIS.md. Empty string means none on record.
   */
  readonly cancelledChequeName: string;
}

const STORAGE_KEY = 'opd.bankDetails.placeholder';

@Injectable({ providedIn: 'root' })
export class BankDetailsStore {
  private readonly _details = signal<BankDetails | null>(readStored());

  readonly details = this._details.asReadonly();
  readonly hasDetails = computed(() => this._details() !== null);

  /** Last four digits only, for display once saved. */
  readonly maskedAccount = computed(() => {
    const account = this._details()?.accountNumber ?? '';
    return account ? `•••• ${account.slice(-4)}` : '';
  });

  save(details: BankDetails): void {
    const trimmed: BankDetails = {
      accountHolderName: details.accountHolderName.trim(),
      accountNumber: details.accountNumber.trim(),
      ifsc: details.ifsc.trim().toUpperCase(),
      bankName: details.bankName.trim(),
      cancelledChequeName: details.cancelledChequeName.trim(),
    };
    this._details.set(trimmed);
    writeStored(trimmed);
  }

  clear(): void {
    this._details.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore private-browsing / quota failures; in-memory state is cleared.
    }
  }
}

/** A 4-char bank + 0 + 6-char branch IFSC, validated client-side only. */
export function isValidIfsc(value: string): boolean {
  return /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(value.trim());
}

/** Digits only, 9–18 long — the usual Indian account-number range. */
export function isValidAccountNumber(value: string): boolean {
  return /^\d{9,18}$/.test(value.trim());
}

function readStored(): BankDetails | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BankDetails>;
    if (!parsed.accountNumber || !parsed.ifsc) return null;
    return {
      accountHolderName: parsed.accountHolderName ?? '',
      accountNumber: parsed.accountNumber,
      ifsc: parsed.ifsc,
      bankName: parsed.bankName ?? '',
      cancelledChequeName: parsed.cancelledChequeName ?? '',
    };
  } catch {
    return null;
  }
}

function writeStored(details: BankDetails): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
  } catch {
    // Ignore; the details still hold in memory for this session.
  }
}
