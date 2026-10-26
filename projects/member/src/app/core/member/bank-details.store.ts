import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AppService } from '../http/api.service';
import { ConsentModalService } from '../consent/consent-modal.service';

/**
 * The member's payout bank account, fetched directly from the backend API:
 * - GET habit-opd/api/v1/opd_profile_details?queryId=GET_PROFILE_DETAILS_BY_USER&page_no=0&page_size=20
 * - POST habit-opd/api/v1/opd_profile_details (action: upsert)
 * - POST /dms/api/v1/emrImage (cheque upload)
 */

export interface BankDetails {
  readonly id?: string;
  readonly accountHolderName: string;
  readonly accountNumber: string;
  readonly ifsc: string;
  readonly bankName: string;
  readonly patientName?: string;
  readonly paymentMode?: string;
  readonly isDefault?: boolean;
  readonly adjudicationStatus?: string;
  /**
   * Cancelled-cheque proof document name or ID.
   */
  readonly cancelledChequeName: string;
  readonly cancelledChequeDocumentId?: string;
}

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
  private readonly http = inject(HttpClient);
  private readonly appService = inject(AppService);
  private readonly router = inject(Router, { optional: true });
  private readonly consentService = inject(ConsentModalService);

  private readonly _details = signal<BankDetails | null>(null);
  private readonly _verification = signal<BankVerification | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _saving = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly details = this._details.asReadonly();
  readonly hasDetails = computed(() => this._details() !== null);
  readonly verification = this._verification.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Where the payout account stands. 'unverified' is details on record that
   * were never sent for verification — they must be submitted before a claim.
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

  constructor() {
    void this.load();
  }

  /**
   * Load profile details exclusively from the backend API (GET_PROFILE_DETAILS_BY_USER).
   */
  async load(): Promise<BankDetails | null> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const arg = 'queryId=GET_PROFILE_DETAILS_BY_USER&page_no=0&page_size=20';
      const raw = await firstValueFrom(
        this.appService.getcall('opd_profile_details', 'habit-opd', arg),
      );
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const rows: any[] = parsed?.resource ?? [];

      if (rows && rows.length > 0) {
        const defaultRow = rows.find((r: any) => r.is_default) ?? rows[0];
        const details: BankDetails = {
          id: defaultRow.id,
          accountHolderName: defaultRow.account_holder_name ?? '',
          accountNumber: defaultRow.account_number ?? '',
          ifsc: defaultRow.ifsc_code ?? '',
          bankName: defaultRow.bank_name ?? '',
          patientName: defaultRow.patient_name ?? '',
          paymentMode: defaultRow.payment_mode ?? 'BANK_TRANSFER',
          isDefault: defaultRow.is_default ?? true,
          cancelledChequeName: defaultRow.cancelled_cheque_document_id ?? '',
          cancelledChequeDocumentId: defaultRow.cancelled_cheque_document_id ?? '',
          adjudicationStatus: defaultRow.adjudicationStatus ?? defaultRow.status ?? '',
        };

        this._details.set(details);

        const adjStatus = (defaultRow.adjudicationStatus ?? defaultRow.status ?? '').toUpperCase();
        let status: BankVerificationStatus = 'pending';
        if (adjStatus === 'APPROVED' || adjStatus === 'VERIFIED') {
          status = 'approved';
        } else if (adjStatus === 'REJECTED') {
          status = 'rejected';
        } else {
          status = 'pending';
        }

        const verification: BankVerification = {
          status,
          submittedAt: defaultRow.g_creation_time
            ? new Date(Number(defaultRow.g_creation_time)).toISOString()
            : new Date().toISOString(),
          decidedAt:
            (status === 'approved' || status === 'rejected') && defaultRow.g_modify_time
              ? new Date(Number(defaultRow.g_modify_time)).toISOString()
              : null,
          reasons: Array.isArray(defaultRow.rejection_reasons) ? defaultRow.rejection_reasons : [],
        };
        this._verification.set(verification);
        return details;
      } else {
        this._details.set(null);
        this._verification.set(null);
        return null;
      }
    } catch (err: any) {
      console.error('Failed to load profile details:', err);
      return this._details();
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Open the consent modal when the API message carries a consent URL.
   * Returns true only when a token was found and the modal opened.
   */
  private tryConsent(message: string): boolean {
    if (!message) return false;
    return this.consentService.openFromApiMessage(message, {
      onSuccess: () => {
        // Consent captured — reload profile details once the modal has
        // finished closing, so the re-prompt (if any) can't stack on it.
        setTimeout(() => void this.load(), 1500);
      },
    });
  }

  /** The API's error message — from an HTTP error envelope or a thrown Error. */
  private apiMessage(err: any): string {
    const body = err?.error ?? err;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body)?.message ?? '';
      } catch {
        return '';
      }
    }
    return body?.message ?? '';
  }

  /**
   * Upload cancelled cheque file to DMS /dms/api/v1/emrImage.
   */
  async uploadCancelledCheque(file: File): Promise<string> {
    const content = await new Promise<unknown>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('action', 'add');

    const encrypted = this.appService.getXsrfToken(content, true);
    const res: any = await firstValueFrom(
      this.http.post('/dms/api/v1/emrImage', formData, {
        headers: new HttpHeaders()
          .set('X-XSRF-TOKEN', String(encrypted))
          .set('timezone', this.appService.getUserTimezone())
          .set('current_time', this.appService.getCurrentTime())
          .set('current_url', this.router?.url ?? '')
          .set('host_name', window.location.host),
        responseType: 'json',
        observe: 'response' as 'response',
      }),
    );

    if (res?.body?.errCode !== 0 && res?.body?.errCode !== undefined) {
      throw new Error(res?.body?.message ?? 'Cheque upload rejected');
    }
    const uploaded = res?.body?.resource?.[0];
    return uploaded?.document_id ?? '';
  }

  /**
   * Upsert bank details via action: upsert on habit-opd/api/v1/opd_profile_details.
   * After saving to the server, always reloads directly from the API.
   */
  async upsert(details: BankDetails, chequeFile?: File | null): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      let chequeDocId = details.cancelledChequeDocumentId ?? '';
      if (chequeFile) {
        try {
          chequeDocId = await this.uploadCancelledCheque(chequeFile);
        } catch (e) {
          console.warn('Cheque upload failed, proceeding with upsert:', e);
        }
      }

      const payload = {
        patient_name: details.patientName || details.accountHolderName.trim(),
        payment_mode: details.paymentMode || 'BANK_TRANSFER',
        is_default: true,
        account_holder_name: details.accountHolderName.trim(),
        account_number: details.accountNumber.trim(),
        ifsc_code: details.ifsc.trim().toUpperCase(),
        bank_name: details.bankName.trim(),
        cancelled_cheque_document_id: chequeDocId || details.cancelledChequeName || '',
        adjudicationStatus: 'PENDING_VERIFICATION',
      };

      const url = '/habit-opd/api/v1/opd_profile_details';
      let encodedResourceData = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      let params = 'resource=' + encodedResourceData;
      params += '&application=habit-opd&action=upsert';
      encodedResourceData += '&action=upsert';
      const options = this.appService.addXsrfToken(encodedResourceData, true);

      const res: any = await firstValueFrom(this.http.post(url, params, options));
      const resBody = typeof res?.body === 'string' ? JSON.parse(res.body) : res?.body;
      if (resBody?.errCode !== 0 && resBody?.errCode !== undefined) {
        throw new Error(resBody?.message ?? 'Failed to save bank details');
      }

      // No local state mutation — fetch fresh profile data directly from the API
      await this.load();
      return true;
    } catch (err: any) {
      // A missing consent comes back as errCode -1 with the consent URL in the
      // message (same convention as claim submit), e.g. "Consent not accepted.
      // Please complete consent at: https://consent.habithealth.com/?token=…".
      // Open the consent modal instead of surfacing an error — the user
      // re-saves after consenting.
      if (this.tryConsent(this.apiMessage(err))) {
        return false;
      }
      console.error('Failed to upsert bank details:', err);
      this._error.set(err?.message ?? 'Failed to save bank details');
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  save(details: BankDetails, chequeFile?: File | null): Promise<boolean> {
    return this.upsert(details, chequeFile);
  }

  submitForVerification(details: BankDetails, chequeFile?: File | null): Promise<boolean> {
    return this.upsert(details, chequeFile);
  }

  clear(): void {
    this._details.set(null);
    this._verification.set(null);
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
