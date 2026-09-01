import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppError, appError, isAppError } from '../http/app-error';
import {
  AgoraJoinFields,
  AgoraReadiness,
  Consultation,
  JoinConsultationDto,
  READINESS_MESSAGE,
  VIDEO_API,
  agoraReadiness,
  toConsultation,
} from './video';

/**
 * One consultation, fetched for an appointment.
 *
 * `POST video-consultations/join` is a WRITE — it stamps `patientJoinedAt` the
 * first time it is called (`video-consultation.service.ts:238-242`). It is
 * therefore called when the member opens the room, not on hover or prefetch,
 * and never twice for the same appointment in one visit.
 */
@Injectable({ providedIn: 'root' })
export class ConsultationStore {
  private readonly http = inject(HttpClient);

  private readonly _consultation = signal<Consultation | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _notStarted = signal(false);
  private joinedFor: string | null = null;

  readonly consultation = this._consultation.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /**
   * The doctor has not opened the room yet.
   *
   * `join` answers 404 for this, which the generic error view renders as "we
   * could not load this" — implying the portal broke when nothing did. The
   * member is early, and being told that is a different thing from being told
   * something failed.
   */
  readonly notStarted = this._notStarted.asReadonly();

  /** Which piece Agora is missing, if any. */
  readonly readiness = computed<AgoraReadiness>(() =>
    agoraReadiness(this._consultation(), environment.agoraAppId),
  );
  readonly readinessMessage = computed(() => READINESS_MESSAGE[this.readiness()]);
  readonly canJoin = computed(() => this.readiness() === AgoraReadiness.Ready);

  /**
   * The Daily room the rest of the estate uses. Surfaced so the member is not
   * stranded while Agora has no token: the consultation exists and is
   * reachable, just not through this client.
   */
  readonly fallbackRoomUrl = computed(() => this._consultation()?.roomUrl ?? null);

  async open(appointmentId: string): Promise<void> {
    if (!appointmentId || this.joinedFor === appointmentId) return;
    this.joinedFor = appointmentId;
    this._loading.set(true);
    this._error.set(null);
    this._notStarted.set(false);
    try {
      const dto = await firstValueFrom(
        this.http.post<JoinConsultationDto>(VIDEO_API.join, { appointmentId }),
      );
      this._consultation.set(toConsultation(dto ?? {}));
    } catch (error: unknown) {
      this.joinedFor = null;
      this._consultation.set(null);
      const failure = isAppError(error) ? error : appError('notFound');
      if (failure.kind === 'notFound') this._notStarted.set(true);
      else this._error.set(failure);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * A fresh token for a call already running.
   *
   * Agora tokens expire — an hour by default — and a consultation that outlives
   * one is disconnected mid-sentence. The SDK warns 30s ahead via
   * `token-privilege-will-expire`; this is what answers it.
   */
  async freshToken(): Promise<string | null> {
    const id = this._consultation()?.id;
    if (!id) return null;
    try {
      const res = await firstValueFrom(
        this.http.get<AgoraJoinFields>(VIDEO_API.token(id)),
      );
      return res?.token?.trim() || null;
    } catch {
      return null;
    }
  }

  reset(): void {
    this.joinedFor = null;
    this._consultation.set(null);
    this._error.set(null);
    this._notStarted.set(false);
  }
}
