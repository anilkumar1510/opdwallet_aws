import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FamilyStore } from '../family/family.store';
import { AppError, appError, isAppError } from '../http/app-error';
import { Member } from '../member/member.model';
import { ProfileStore } from '../member/profile.store';
import { Prescription, PrescriptionSource } from '../records/prescription.model';
import { SessionStore } from '../session/session.store';
import { Cart, CartDto, toCart } from './cart';
import { LabEnvelopeDto, LabOrderDto, LabPrescriptionDto } from './lab.dto';
import {
  DIAGNOSTIC_ONLY_API,
  LAB_API,
  toLabOrder,
  toLabPrescription,
  toUploadFormData,
} from './lab.mapper';
import { LabKind, LabOrder, LabPrescription } from './lab.model';

/** Accepted by the upload endpoint; anything else is rejected client-side. */
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Rejects locally before spending an upload. The API answers an oversized or
 * unsupported file with a 500 that reads as "something went wrong", which
 * tells the member nothing about what to do differently.
 *
 * Exported so the upload screen can validate on selection, not on submit.
 */
export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Upload a PDF or a clear photo (JPG, PNG or WebP).';
  }
  if (file.size > MAX_BYTES) {
    return 'That file is larger than 10 MB. Try a smaller scan or photo.';
  }
  return null;
}

export interface UploadOptions {
  readonly kind?: LabKind;
  readonly patient?: Member;
  readonly pincode?: string;
  readonly addressId?: string;
  readonly notes?: string;
  readonly prescriptionDate?: Date;
}

/**
 * Pathology (CAT004) and Radiology (CAT003) — orders and prescriptions.
 *
 * Both categories are the same contract on two endpoint prefixes, so one
 * store serves both, keyed by LabKind.
 *
 * Every list route accepts `userId` and filters on it, so these follow the
 * active family member like the wallet does. Omitting it silently returns the
 * signed-in member's records while a dependent is being viewed.
 */
@Injectable({ providedIn: 'root' })
export class LabStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly family = inject(FamilyStore);
  private readonly profile = inject(ProfileStore);

  private readonly _orders = signal<readonly LabOrder[]>([]);
  private readonly _prescriptions = signal<readonly LabPrescription[]>([]);
  private readonly _carts = signal<readonly Cart[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _partial = signal<readonly string[]>([]);
  private readonly _uploading = signal(false);
  private readonly _uploadError = signal<string | null>(null);
  private readonly _uploadedRef = signal<string | null>(null);

  private loadedKind: LabKind | null = null;
  private loadedFor: string | null = null;

  readonly orders = this._orders.asReadonly();
  readonly prescriptions = this._prescriptions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly partial = this._partial.asReadonly();
  readonly uploading = this._uploading.asReadonly();
  readonly uploadError = this._uploadError.asReadonly();
  /** Reference of the most recent successful upload, for the success notice. */
  readonly uploadedRef = this._uploadedRef.asReadonly();

  /** Prescriptions with no order yet — the member's next action. */
  readonly actionable = computed(() =>
    this._prescriptions().filter((p) => !p.hasOrder && !p.status.isFinal),
  );

  readonly carts = this._carts.asReadonly();

  /**
   * The cart a prescription was digitised into.
   *
   * The lab endpoint never populates `cartId` on a prescription (diagnostics
   * does), so it is matched from the carts list instead — a cart carries the
   * prescription's `_id`. This also yields the business `CART-…` id the cart
   * routes require; the prescription's own `cartId` is a Mongo `_id` and 404s.
   */
  cartFor(prescription: LabPrescription): Cart | null {
    return this._carts().find((cart) => cart.prescriptionId === prescription.id) ?? null;
  }
  /** Carts still awaiting a lab and a slot — the journey's live step. */
  readonly openCarts = computed(() =>
    this._carts().filter((cart) => cart.status !== 'ORDERED' && cart.status !== 'CANCELLED'),
  );

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /**
   * Idempotent per kind and member: revisiting the same screen does not
   * refetch, but switching family member does.
   */
  select(kind: LabKind): void {
    const userId = this.family.activeMember()?.id ?? '';
    if (kind === this.loadedKind && userId === this.loadedFor) return;
    this.loadedKind = kind;
    this.loadedFor = userId;
    void this.load(kind, userId);
  }

  retry(): void {
    if (this.loadedKind) {
      const kind = this.loadedKind;
      this.loadedKind = null;
      this.loadedFor = null;
      this.select(kind);
    }
  }

  /**
   * Uploads a prescription for the active family member, then refreshes the
   * list so the new row appears without a manual reload.
   *
   * Validates the file locally first: the API rejects oversized or unsupported
   * files with a 500 that reads as "something went wrong", which tells the
   * member nothing about what to do differently.
   */
  async upload(file: File, options: UploadOptions = {}): Promise<boolean> {
    const kind = options.kind ?? this.loadedKind ?? LabKind.Lab;
    const patient = options.patient ?? this.family.activeMember();
    if (!patient) return false;

    this._uploadError.set(null);
    this._uploadedRef.set(null);

    const rejection = validateFile(file);
    if (rejection) {
      this._uploadError.set(rejection);
      return false;
    }

    // The endpoint requires a pincode to route sample collection.
    await this.profile.load();
    const pincode = options.pincode ?? this.profile.pincode();
    if (!pincode) {
      this._uploadError.set('Add an address with a pincode to your profile before uploading.');
      return false;
    }

    this._uploading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<LabEnvelopeDto<LabPrescriptionDto>>(
          LAB_API[kind].uploadPrescription,
          toUploadFormData({
            file,
            patientId: patient.id,
            patientName: patient.fullName,
            patientRelationship: patient.relationship,
            pincode,
            addressId: options.addressId,
            notes: options.notes,
            prescriptionDate: options.prescriptionDate,
          }),
        ),
      );
      if (response.success === false) throw appError('server', response.error);

      this._uploadedRef.set(response.data?.prescriptionId ?? '');
      // Refetch so the new prescription shows in the list.
      this.loadedKind = null;
      this.loadedFor = null;
      this.select(kind);
      return true;
    } catch (error: unknown) {
      this._uploadError.set(
        isAppError(error) ? error.message : 'We could not upload that prescription.',
      );
      return false;
    } finally {
      this._uploading.set(false);
    }
  }

  /**
   * Submit a prescription the member already holds, instead of uploading a file.
   *
   * `POST {lab,diagnostics}/prescriptions/submit-existing` takes a FLAT body —
   * checked at the send site, not inferred: every field on
   * `SubmitExistingPrescriptionDto` is a string, `pincode` is the only optional
   * one, and `prescriptionDate` is `@IsDateString()`.
   *
   * `healthRecordId` is the **Mongo `_id`** — the service does
   * `findById(healthRecordId)` and then `new Types.ObjectId(...)` on it, so the
   * business `PRES-…` reference would fail. `Prescription.id` carries `_id`;
   * `Prescription.reference` does not.
   *
   * The reference sends `patientId: 'current'`, `patientName: 'Current Member'`,
   * `patientRelationship: 'Self'` with comments saying the backend will resolve
   * them. **It does not** — the service stores all three verbatim. Sending the
   * active family member instead is what `member-lab`'s patient Rule requires,
   * and is a do-not-port of the reference's own placeholder.
   */
  async submitExisting(record: Prescription, kind: LabKind = LabKind.Lab): Promise<boolean> {
    const patient = this.family.activeMember();
    if (!patient || !record.id) return false;

    this._uploadError.set(null);
    this._uploadedRef.set(null);
    this._uploading.set(true);
    try {
      await this.profile.load();
      const response = await firstValueFrom(
        this.http.post<LabEnvelopeDto<LabPrescriptionDto>>(LAB_API[kind].submitExisting, {
          healthRecordId: record.id,
          prescriptionType: record.source === PrescriptionSource.Digital ? 'DIGITAL' : 'PDF',
          patientId: patient.id,
          patientName: patient.fullName,
          patientRelationship: patient.relationship,
          pincode: this.profile.pincode() ?? '',
          prescriptionDate: (record.issuedAt ?? new Date()).toISOString(),
        }),
      );
      if (response.success === false) throw appError('server', response.error);

      this._uploadedRef.set(response.data?.prescriptionId ?? '');
      // Refetch so the submitted prescription shows in the list, exactly as the
      // upload path does — the reference calls its own fetchData() here too.
      this.loadedKind = null;
      this.loadedFor = null;
      this.select(kind);
      return true;
    } catch (error: unknown) {
      this._uploadError.set(
        isAppError(error) ? error.message : 'We could not submit that prescription.',
      );
      return false;
    } finally {
      this._uploading.set(false);
    }
  }

  /** One order by its business reference (ORD-…), for the detail screen. */
  /**
   * Cancels a placed radiology order — flow 7, step 17.
   *
   * Radiology only: pathology has no cancel endpoint, so the caller must gate
   * on kind rather than discover it through a 404. Returning a message rather
   * than a boolean because the API can succeed AND report a problem: if the
   * booking slot cannot be freed it answers 200 with a `warning`, and a member
   * told only "cancelled" would never learn the slot is still held.
   */
  async cancelOrder(orderId: string, reason: string): Promise<{ ok: boolean; message: string }> {
    if (!orderId) return { ok: false, message: 'That order could not be found.' };
    try {
      const response = await firstValueFrom(
        this.http.post<{ success?: boolean; warning?: string }>(
          DIAGNOSTIC_ONLY_API.cancelOrder(orderId),
          { reason: reason.trim() || 'Cancelled by member' },
        ),
      );
      return {
        ok: true,
        message: response?.warning
          ? 'Order cancelled. The booking slot may still be held — the centre will sort it out.'
          : 'Order cancelled.',
      };
    } catch (error: unknown) {
      return {
        ok: false,
        message: isAppError(error) ? error.message : 'We could not cancel that order.',
      };
    }
  }

  async orderById(orderId: string, kind: LabKind = LabKind.Lab): Promise<LabOrder | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<LabEnvelopeDto<LabOrderDto>>(LAB_API[kind].orderById(orderId)),
      );
      if (response.success === false || !response.data) return null;
      return toLabOrder(response.data, kind);
    } catch {
      return null;
    }
  }

  dismissUploadNotice(): void {
    this._uploadError.set(null);
    this._uploadedRef.set(null);
  }

  private async load(kind: LabKind, userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._partial.set([]);

    const api = LAB_API[kind];
    const failed: string[] = [];
    // Scoped to whoever is being viewed; without it the API answers with the
    // signed-in member's records regardless.
    const options = userId ? { params: { userId } } : {};

    const orders = firstValueFrom(this.http.get<LabEnvelopeDto<LabOrderDto[]>>(api.orders, options))
      .then((response) => {
        // A 200 carrying `success: false` is a failure this API expresses in
        // the body, so it is checked here, not left to the interceptor.
        if (response.success === false) throw appError('server');
        return (response.data ?? []).map((dto) => toLabOrder(dto, kind));
      })
      .catch(() => {
        failed.push('orders');
        return [] as LabOrder[];
      });

    const prescriptions = firstValueFrom(
      this.http.get<LabEnvelopeDto<LabPrescriptionDto[]>>(api.prescriptions, options),
    )
      .then((response) => {
        if (response.success === false) throw appError('server');
        return (response.data ?? []).map((dto) => toLabPrescription(dto, kind));
      })
      .catch(() => {
        failed.push('prescriptions');
        return [] as LabPrescription[];
      });

    // Carts are the live step between prescription and order, so the screen
    // can link straight to one. A failure here just hides that shortcut.
    const carts = firstValueFrom(this.http.get<LabEnvelopeDto<CartDto[]>>(api.carts, options))
      .then((response) => (response.success === false ? [] : (response.data ?? []).map(toCart)))
      .catch(() => [] as Cart[]);

    try {
      const [orderRows, prescriptionRows, cartRows] = await Promise.all([
        orders,
        prescriptions,
        carts,
      ]);
      if (this.loadedKind !== kind) return;
      this._carts.set(cartRows);

      this._orders.set(
        [...orderRows].sort((a, b) => (b.placedAt?.getTime() ?? 0) - (a.placedAt?.getTime() ?? 0)),
      );
      this._prescriptions.set(
        [...prescriptionRows].sort(
          (a, b) => (b.uploadedAt?.getTime() ?? 0) - (a.uploadedAt?.getTime() ?? 0),
        ),
      );
      this._partial.set(failed);
      // Both sources failing is a real failure, not a partial one.
      if (failed.length === 2) this._error.set(appError('server'));
    } catch (error: unknown) {
      if (this.loadedKind !== kind) return;
      this._orders.set([]);
      this._prescriptions.set([]);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedKind === kind) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedKind = null;
    this.loadedFor = null;
    this._orders.set([]);
    this._prescriptions.set([]);
    this._carts.set([]);
    this._error.set(null);
    this._partial.set([]);
    this._uploading.set(false);
    this._uploadError.set(null);
    this._uploadedRef.set(null);
  }
}
