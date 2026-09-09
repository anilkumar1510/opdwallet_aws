import { Injectable, effect, inject, signal } from '@angular/core';

import { AppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import { PolicyDetail } from './policy-detail';
import { STATIC_POLICY_DETAIL } from './static-policy.data';

/**
 * The full detail of one policy.
 *
 * DUMMY / STATIC — no backend. This used to call `GET policies/:id/current`;
 * that endpoint has been removed from the flow and the detail is now served from
 * `static-policy.data.ts`. The public shape (detail/loading/error/select/retry)
 * is unchanged so the page did not need reworking. See REMOVED-APIS.md.
 */
@Injectable({ providedIn: 'root' })
export class PolicyStore {
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

  /** Idempotent: the policy id is ignored — one static policy is served. */
  select(policyId: string): void {
    if (!policyId || policyId === this.loadedId) return;
    this.loadedId = policyId;
    this._error.set(null);
    this._loading.set(false);
    this._detail.set(STATIC_POLICY_DETAIL);
  }

  retry(): void {
    if (this.loadedId) this._detail.set(STATIC_POLICY_DETAIL);
  }

  private reset(): void {
    this.loadedId = null;
    this._detail.set(null);
    this._error.set(null);
  }
}
