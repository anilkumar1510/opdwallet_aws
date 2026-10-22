import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AppService } from '../http/api.service';
import { AppError, isAppError } from '../http/app-error';
import { STATIC_SELF } from '../member/static-member.data';
import { Member } from '../member/member.model';
import { UserInfoStore } from './userinfo.store';

/**
 * Why a session was refused:
 * - `expired`     — the API said the session has ended (401/403, or a message saying so)
 * - `invalid`     — HTTP 200 but no configuration came back, or an error message
 * - `unreachable` — the check itself could not complete (network, 5xx); retryable
 */
export type SessionFailure = 'expired' | 'invalid' | 'unreachable';

type SessionState =
  | { status: 'checking' }
  | { status: 'valid' }
  | { status: 'failed'; reason: SessionFailure; message: string };

/** The page a refused session lands on. Outside the guarded /member tree. */
export const SESSION_ERROR_PATH = '/session-error';

const ACCOUNT_URL = 'www.habithealth.com';

/** An API message that means the session itself has ended. */
const SESSION_ENDED = /session.{0,20}(expired|invalid|timed? ?out|not found)|invalid session|not logged in|login required/i;

/**
 * The member's session.
 *
 * The browser holds an HttpOnly `session_id` cookie, which scripts cannot read
 * — so its presence is not checked here. Instead the session is proved by
 * GET_MY_CONFIG (application_master), which the cookie accompanies: a 200 with
 * a configuration row is a live session; anything else is not.
 *
 * Checked once per page load (authGuard awaits it); any API call that later
 * reports the session has ended calls `terminate()`.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(AppService);
  private readonly userStore = inject(UserInfoStore);
  private readonly router = inject(Router);

  private readonly _state = signal<SessionState>({ status: 'checking' });
  private readonly _member = signal<Member | null>(STATIC_SELF);
  private checking: Promise<boolean> | null = null;

  readonly member = this._member.asReadonly();
  readonly busy = computed(() => this._state().status === 'checking');
  readonly resolved = computed(() => this._state().status !== 'checking');
  readonly isAuthenticated = computed(() => this._state().status === 'valid');
  /** Why the session was refused, for the error page. */
  readonly failure = computed(() => {
    const state = this._state();
    return state.status === 'failed' ? { reason: state.reason, message: state.message } : null;
  });
  readonly error = computed<AppError | null>(() => null);

  /** Validates the session once; later callers share the same check. */
  restore(): Promise<boolean> {
    this.checking ??= this.validate();
    return this.checking;
  }

  /** Runs the check again — the error page's "Try again". */
  retry(): Promise<boolean> {
    this.checking = null;
    this._state.set({ status: 'checking' });
    return this.restore();
  }

  /**
   * Ends the session because an API said it is no longer valid, and shows the
   * error page. Only the first call navigates.
   */
  terminate(reason: SessionFailure = 'expired', message = ''): void {
    if (this._state().status === 'failed') return;
    this.fail(reason, message);
    void this.router.navigate([SESSION_ERROR_PATH], { queryParams: { reason } });
  }

  async login(_email: string, _password: string): Promise<boolean> {
    return this.restore();
  }

  async logout(): Promise<void> {
    /* no sign-out endpoint in this portal; the platform owns the session */
  }

  captureRedirect(_url: string): void {
    /* no login page to return from */
  }

  private async validate(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.api.getcall(
          'application_master',
          'account-management',
          `queryId=GET_MY_CONFIG&args=dummy:dummy,account_url:${ACCOUNT_URL}&application=account-management`,
        ),
      );
      let parsed: any;
      try {
        parsed = typeof response === 'string' ? JSON.parse(response) : response;
      } catch {
        // A 200 that is not JSON — typically a login page served in its place.
        return this.fail('invalid', '');
      }
      const resources: any[] = Array.isArray(parsed?.resource) ? parsed.resource : [];
      const message = typeof parsed?.message === 'string' ? parsed.message.trim() : '';
      const errCode = Number(parsed?.errCode ?? 0);
      if (!resources.length || (Number.isFinite(errCode) && errCode !== 0)) {
        return this.fail(/expire|timed? ?out/i.test(message) ? 'expired' : 'invalid', message);
      }
      await this.userStore.setUserInfo(resources);
      this._state.set({ status: 'valid' });
      return true;
    } catch (error) {
      return this.fail(failureOf(error), messageOf(error));
    }
  }

  private fail(reason: SessionFailure, message: string): false {
    this._state.set({ status: 'failed', reason, message });
    this.userStore.clear();
    return false;
  }
}

/** 401/403 mean the session ended; network and server faults mean we could not tell. */
function failureOf(error: unknown): SessionFailure {
  const status = error instanceof HttpErrorResponse ? error.status : isAppError(error) ? error.status : null;
  if (status === 401 || status === 403) return 'expired';
  if (isAppError(error) && error.kind === 'unauthorized') return 'expired';
  if (status !== null && status >= 400 && status < 500) return 'invalid';
  return 'unreachable';
}

function messageOf(error: unknown): string {
  if (isAppError(error)) return error.kind === 'network' || error.kind === 'server' ? '' : error.message;
  return '';
}

/** Whether an API response body says the session has ended (for the interceptor). */
export function bodySaysSessionEnded(body: unknown): string | null {
  let parsed: any = body;
  if (typeof body === 'string') {
    if (!/session|log(ged )?in/i.test(body)) return null;
    try {
      parsed = JSON.parse(body);
    } catch {
      return null;
    }
  }
  const message = typeof parsed?.message === 'string' ? parsed.message : '';
  const errCode = Number(parsed?.errCode ?? 0);
  return errCode !== 0 && SESSION_ENDED.test(message) ? message : null;
}
