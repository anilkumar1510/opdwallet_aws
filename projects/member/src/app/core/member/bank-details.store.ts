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
const VERIFICATION_KEY = 'opd.bankVerification.placeholder';

/**
 * Bank details are verified by an adjudicator before the first claim can be
 * filed. DUMMY / STATIC — there is no adjudication API yet; the decision is
 * simulated from the claim screen and held in localStorage.
 *
 * TODO(API) — replace with the adjudicator's verdict on the bank-details record:
 *   GET member/profile/bank-details -> { ..., verification: BankVerification }
 */
export type BankVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface BankVerification {
  readonly status: BankVerificationStatus;
  readonly submittedAt: string;
  readonly decidedAt: string | null;
  /** Set when rejected; one or more of BANK_REJECTION_REASONS. */
  readonly reasons: readonly string[];
}

/** Everything an adjudicator can reject a payout account for. */
export const BANK_REJECTION_REASONS: readonly string[] = [
  "Account holder name doesn't match the member's name on the policy.",
  "The account is in someone else's name — payouts go only to the member's own account.",
  "Account number and IFSC don't match — no such account at this branch.",
  'IFSC code is invalid, or the branch has been merged or closed.',
  "Bank name doesn't match the IFSC code.",
  'The account is closed, dormant or frozen.',
  "The bank couldn't confirm the account (verification transfer failed).",
  "This account type can't receive payouts (e.g. NRE/NRO, PPF, loan or wallet account).",
  'The cancelled cheque or passbook page is blurred, cropped or unreadable.',
  'The cheque is not marked "Cancelled".',
  "The proof doesn't show the account number, IFSC and account holder name.",
  'The proof belongs to a different account than the one entered.',
  'The proof appears to be edited or tampered with.',
];

@Injectable({ providedIn: 'root' })
export class BankDetailsStore {
  private readonly _details = signal<BankDetails | null>(readStored());
  private readonly _verification = signal<BankVerification | null>(readVerification());

  readonly details = this._details.asReadonly();
  readonly hasDetails = computed(() => this._details() !== null);
  readonly verification = this._verification.asReadonly();

  /**
   * Where the payout account stands. 'unverified' is details on record that
   * were never sent for verification (saved from Profile, or before
   * verification existed) — they must be submitted before a claim.
   */
  readonly verificationStatus = computed<'none' | 'unverified' | BankVerificationStatus>(() => {
    if (!this._details()) return 'none';
    return this._verification()?.status ?? 'unverified';
  });
  /** Claims can be filed only against an approved account. */
  readonly isApproved = computed(() => this.verificationStatus() === 'approved');

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
    // Changed details are no longer the ones that were verified.
    this.setVerification(null);
  }

  /** Saves the details and sends them to the adjudicator. */
  submitForVerification(details: BankDetails): void {
    this.save(details);
    this.setVerification({
      status: 'pending',
      submittedAt: new Date().toISOString(),
      decidedAt: null,
      reasons: [],
    });
  }

  /** DUMMY — stands in for the adjudicator's decision. */
  simulateDecision(status: 'approved' | 'rejected', reasons: readonly string[] = []): void {
    const current = this._verification();
    if (!current) return;
    this.setVerification({
      ...current,
      status,
      decidedAt: new Date().toISOString(),
      reasons: status === 'rejected' ? [...reasons] : [],
    });
  }

  private setVerification(next: BankVerification | null): void {
    this._verification.set(next);
    try {
      if (next) localStorage.setItem(VERIFICATION_KEY, JSON.stringify(next));
      else localStorage.removeItem(VERIFICATION_KEY);
    } catch {
      // Ignore; the state still holds in memory for this session.
    }
  }

  clear(): void {
    this._details.set(null);
    this.setVerification(null);
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

function readVerification(): BankVerification | null {
  try {
    const raw = localStorage.getItem(VERIFICATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BankVerification>;
    if (parsed.status !== 'pending' && parsed.status !== 'approved' && parsed.status !== 'rejected') {
      return null;
    }
    return {
      status: parsed.status,
      submittedAt: parsed.submittedAt ?? '',
      decidedAt: parsed.decidedAt ?? null,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    };
  } catch {
    return null;
  }
}
