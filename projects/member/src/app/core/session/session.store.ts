import { Injectable, computed, signal } from '@angular/core';

import { AppError } from '../http/app-error';
import { STATIC_SELF } from '../member/static-member.data';
import { Member } from '../member/member.model';

/**
 * Session — DUMMY / STATIC, zero backend.
 *
 * The login page has been removed: the app is always "authenticated" as the
 * static member (Shivam Jha). No `auth/login`, `auth/me` or `auth/logout` calls.
 * Public surface unchanged so guards and screens did not need reworking. See
 * REMOVED-APIS.md.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _member = signal<Member | null>(STATIC_SELF);

  readonly member = this._member.asReadonly();
  readonly busy = signal(false).asReadonly();
  readonly error = signal<AppError | null>(null).asReadonly();
  readonly resolved = computed(() => true);
  readonly isAuthenticated = computed(() => true);

  async login(_email: string, _password: string): Promise<boolean> {
    return true;
  }

  restore(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async logout(): Promise<void> {
    /* no-op — there is no login to return to */
  }

  terminate(): void {
    /* no-op — the static session never ends */
  }

  captureRedirect(_url: string): void {
    /* no-op */
  }
}
