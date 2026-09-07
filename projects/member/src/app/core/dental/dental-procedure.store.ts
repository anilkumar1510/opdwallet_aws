import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { isAppError } from '../http/app-error';
import {
  DENTAL_PROCEDURE_API,
  DentalProcedure,
  DentalProcedureDto,
  toDentalProcedure,
} from './dental-procedure';

/** Every route here wraps its payload as `{ success, data }`. */
interface Envelope<T> {
  success?: boolean;
  data?: T;
}

/**
 * The procedure route — flow 4 steps 18 to 27 on the member's side.
 *
 * Adjudication is not here and never will be: approving your own estimate
 * removes the entire control the route exists for. That lives on ops.
 *
 * Every method resolves rather than throws. The API refuses several things on
 * purpose — no procedure was recommended, one is already in progress, the
 * estimate is missing — and each is a message the member needs to read.
 */
@Injectable({ providedIn: 'root' })
export class DentalProcedureStore {
  private readonly http = inject(HttpClient);

  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();

  clearError(): void {
    this._error.set(null);
  }

  async byId(procedureId: string): Promise<DentalProcedure | null> {
    if (!procedureId) return null;
    try {
      const response = await firstValueFrom(
        this.http.get<Envelope<DentalProcedureDto>>(DENTAL_PROCEDURE_API.byId(procedureId)),
      );
      return response?.data ? toDentalProcedure(response.data) : null;
    } catch {
      return null;
    }
  }

  /** The open procedure for a consultation, if one exists. */
  async forBooking(bookingId: string): Promise<DentalProcedure | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<Envelope<DentalProcedureDto[]>>(DENTAL_PROCEDURE_API.list),
      );
      return (
        (response?.data ?? [])
          .map(toDentalProcedure)
          .find((p) => p.bookingId === bookingId && p.isOpen) ?? null
      );
    } catch {
      return null;
    }
  }

  /** Step 18 — the estimate the dentist quoted. Nothing is charged. */
  async addEstimate(input: {
    bookingId: string;
    estimateAmount: number;
    procedureNotes?: string;
  }): Promise<DentalProcedure | null> {
    return this.run(async () => {
      const response = await firstValueFrom(
        this.http.post<Envelope<DentalProcedureDto>>(DENTAL_PROCEDURE_API.create, input),
      );
      return response?.data ? toDentalProcedure(response.data) : null;
    }, 'We could not save that estimate.');
  }

  /** Steps 24-26 — slot at the same clinic, then pay. */
  async schedule(
    procedureId: string,
    input: { appointmentDate: string; appointmentTime: string },
  ): Promise<DentalProcedure | null> {
    return this.run(async () => {
      const response = await firstValueFrom(
        this.http.post<Envelope<DentalProcedureDto>>(
          DENTAL_PROCEDURE_API.schedule(procedureId),
          input,
        ),
      );
      return response?.data ? toDentalProcedure(response.data) : null;
    }, 'We could not book that procedure.');
  }

  /** Development only — see `DENTAL_PROCEDURE_API.demoAdvance`. */
  async demoAdvance(procedureId: string): Promise<DentalProcedure | null> {
    return this.run(async () => {
      const response = await firstValueFrom(
        this.http.post<Envelope<DentalProcedureDto>>(
          DENTAL_PROCEDURE_API.demoAdvance(procedureId),
          {},
        ),
      );
      return response?.data ? toDentalProcedure(response.data) : null;
    }, 'We could not move that procedure on.');
  }

  /**
   * The API's own message wins over the fallback wherever it sends one: its
   * refusals explain what to do, and a generic message throws that away.
   */
  private async run(
    action: () => Promise<DentalProcedure | null>,
    fallback: string,
  ): Promise<DentalProcedure | null> {
    this._busy.set(true);
    this._error.set(null);
    try {
      return await action();
    } catch (error: unknown) {
      this._error.set(isAppError(error) ? error.message : fallback);
      return null;
    } finally {
      this._busy.set(false);
    }
  }
}
