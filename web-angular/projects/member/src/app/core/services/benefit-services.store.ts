import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import {
  BENEFIT_SERVICES_API,
  BenefitService,
  BenefitServicesResponseDto,
  toBenefitServices,
} from './benefit-services';

/**
 * Bookable services for one benefit category at a time (Vision, Dental).
 *
 * Distinguishes "your cover has lapsed" from a real failure, because the API
 * signals the former with a 404 that would otherwise read as a broken screen.
 */
@Injectable({ providedIn: 'root' })
export class BenefitServicesStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _services = signal<readonly BenefitService[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);
  private readonly _noCover = signal(false);

  private loadedFor: string | null = null;
  /** Concurrent callers share one request; route redirects can mount twice. */
  private inFlight: Promise<void> | null = null;

  readonly services = this._services.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** The member has no policy assignment currently in force. */
  readonly noCover = this._noCover.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /** Idempotent per category. */
  select(categoryId: string): void {
    if (!categoryId || categoryId === this.loadedFor) return;
    this.loadedFor = categoryId;
    this.inFlight ??= this.load(categoryId).finally(() => {
      this.inFlight = null;
    });
  }

  retry(): void {
    if (this.loadedFor) {
      const categoryId = this.loadedFor;
      this.loadedFor = null;
      this.select(categoryId);
    }
  }

  private async load(categoryId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._noCover.set(false);

    try {
      const response = await firstValueFrom(
        this.http.get<BenefitServicesResponseDto>(BENEFIT_SERVICES_API.services(categoryId)),
      );
      if (this.loadedFor !== categoryId) return;
      this._services.set(toBenefitServices(response));
    } catch (error: unknown) {
      if (this.loadedFor !== categoryId) return;
      this._services.set([]);

      // 404 here means "no policy assignment in force", not "missing screen".
      if (isAppError(error) && error.kind === 'notFound') {
        this._noCover.set(true);
      } else {
        this._error.set(isAppError(error) ? error : appError('server'));
      }
    } finally {
      if (this.loadedFor === categoryId) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedFor = null;
    this.inFlight = null;
    this._services.set([]);
    this._error.set(null);
    this._noCover.set(false);
  }
}
