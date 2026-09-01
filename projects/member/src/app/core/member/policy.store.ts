import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { MEMBER_API } from './member.mapper';
import { PolicyDetail, PolicyDetailDto, toPolicyDetail } from './policy-detail';

/** The full detail of one policy, keyed by id. */
@Injectable({ providedIn: 'root' })
export class PolicyStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _detail = signal<PolicyDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);

  private loadedId: string | null = null;

  readonly detail = this._detail.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /** Idempotent: navigating back to the same policy does not refetch. */
  select(policyId: string): void {
    if (!policyId || policyId === this.loadedId) return;
    this.loadedId = policyId;
    void this.load(policyId);
  }

  retry(): void {
    if (this.loadedId) void this.load(this.loadedId);
  }

  private async load(policyId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const dto = await firstValueFrom(
        this.http.get<PolicyDetailDto>(MEMBER_API.policyCurrent(policyId)),
      );
      // Discard a slow response for a policy the member has navigated away from.
      if (this.loadedId !== policyId) return;
      this._detail.set(toPolicyDetail(dto));
    } catch (error: unknown) {
      if (this.loadedId !== policyId) return;
      this._detail.set(null);
      this._error.set(isAppError(error) ? error : appError('server'));
    } finally {
      if (this.loadedId === policyId) this._loading.set(false);
    }
  }

  private reset(): void {
    this.loadedId = null;
    this._detail.set(null);
    this._error.set(null);
  }
}
