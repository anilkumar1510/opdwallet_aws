import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AppError, appError, isAppError } from '../http/app-error';
import { LoginResponseDto, UserDto } from '../member/member.dto';
import { AUTH_API, toMember, toMemberFromLogin } from '../member/member.mapper';
import { Member } from '../member/member.model';

type SessionState = 'unknown' | 'authenticated' | 'anonymous';

/**
 * The single source of truth for who is signed in.
 *
 * `unknown` is the state before session restore has finished. Routing must
 * wait for it to resolve, otherwise a valid session flashes the login screen.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _state = signal<SessionState>('unknown');
  private readonly _member = signal<Member | null>(null);
  private readonly _busy = signal(false);
  private readonly _error = signal<AppError | null>(null);

  /** Set when a guard turns a member away, so login can send them back. */
  private redirectUrl: string | null = null;

  /** Concurrent callers share one restore rather than each firing a request. */
  private restoring: Promise<boolean> | null = null;

  readonly member = this._member.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();
  readonly resolved = computed(() => this._state() !== 'unknown');
  readonly isAuthenticated = computed(() => this._state() === 'authenticated');

  async login(email: string, password: string): Promise<boolean> {
    this._busy.set(true);
    this._error.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponseDto>(AUTH_API.login, { email, password }),
      );
      this.accept(toMemberFromLogin(response));
      return true;
    } catch (error: unknown) {
      // A rejected credential is not "your session ended" - it is a failed
      // attempt, and must read as one.
      const failure = isAppError(error) ? error : appError('server');
      this._error.set(
        failure.kind === 'unauthorized'
          ? appError('validation', 'That email or password was not recognised.', failure.status)
          : failure,
      );
      this.clear();
      return false;
    } finally {
      this._busy.set(false);
    }
  }

  /**
   * Resolves the session from the cookie the browser already holds. Returns
   * false rather than throwing - an absent session is an ordinary outcome, not
   * an error to show the member.
   */
  restore(): Promise<boolean> {
    this.restoring ??= this.runRestore().finally(() => {
      this.restoring = null;
    });
    return this.restoring;
  }

  private async runRestore(): Promise<boolean> {
    try {
      const dto = await firstValueFrom(this.http.get<UserDto>(AUTH_API.me));
      // No placeholder identity on failure, unlike the reference portal's
      // ResponsiveLayout, which presents a mock user when /auth/me fails.
      this.accept(toMember(dto));
      return true;
    } catch {
      this.clear();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(AUTH_API.logout, {}));
    } catch {
      // The cookie may already be gone. Local state is cleared regardless -
      // failing to reach logout must not strand a member in a signed-in shell.
    }
    this.terminate();
  }

  /**
   * Ends the session and takes the member to the login screen.
   *
   * The single place session termination happens, per member-session's Rule:
   * any API response reporting an invalid session must produce the same outcome
   * regardless of which screen issued the request. Sign-out and a rejected
   * session are the same ending, so they share this one path rather than each
   * caller remembering to navigate.
   *
   * Navigation is via Router, not `window.location.href` as the reference
   * portal does - assigning location discards Angular's router state.
   *
   * Idempotent: concurrent 401s from several in-flight requests end the session
   * once and navigate once.
   */
  terminate(): void {
    if (this._state() === 'anonymous') return;
    this.clear();
    void this.router.navigate(['/login']);
  }

  captureRedirect(url: string): void {
    this.redirectUrl = url;
  }

  takeRedirect(): string | null {
    const url = this.redirectUrl;
    this.redirectUrl = null;
    return url;
  }

  private accept(member: Member): void {
    this._member.set(member);
    this._state.set('authenticated');
    this._error.set(null);
  }

  private clear(): void {
    this._member.set(null);
    this._state.set('anonymous');
  }
}
