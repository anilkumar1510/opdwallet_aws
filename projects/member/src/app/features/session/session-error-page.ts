import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SessionFailure, SessionStore } from '../../core/session/session.store';

const COPY: Record<SessionFailure, { title: string; detail: string }> = {
  expired: {
    title: 'Your session has expired',
    detail: 'For your security you have been signed out. Please sign in again to continue.',
  },
  invalid: {
    title: 'Invalid session',
    detail: 'We could not confirm who you are. Please sign in again to continue.',
  },
  unreachable: {
    title: 'We could not verify your session',
    detail: 'The service did not respond. Check your connection and try again.',
  },
};

/**
 * Where a refused session lands — outside the guarded /member tree, so it
 * renders without a session. The reason comes from SessionStore, or from
 * `?reason=` when the page is opened on its own (a reload).
 */
@Component({
  selector: 'opd-session-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-[#f7f7fc] px-5">
      <section class="w-full max-w-[440px] rounded-2xl border border-[#EDF0F7] bg-white p-6 text-center shadow-sm" role="alert">
        <span
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold"
          [class.bg-danger-50]="reason() !== 'unreachable'"
          [class.text-danger-700]="reason() !== 'unreachable'"
          [class.bg-warning-50]="reason() === 'unreachable'"
          [class.text-warning-700]="reason() === 'unreachable'"
          aria-hidden="true"
          >!</span
        >
        <h1 class="mt-4 text-xl font-bold text-ink-900">{{ copy().title }}</h1>
        <p class="mt-2 text-sm text-ink-700">{{ copy().detail }}</p>
        @if (apiMessage(); as message) {
          <p class="mt-3 rounded-xl bg-[#F2F4F8] px-3 py-2 text-xs text-ink-500">{{ message }}</p>
        }
        <button
          type="button"
          class="mt-6 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-60"
          [disabled]="retrying()"
          (click)="tryAgain()"
        >
          {{ retrying() ? 'Checking…' : 'Try again' }}
        </button>
      </section>
    </main>
  `,
})
export class SessionErrorPage {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly queryReason = inject(ActivatedRoute).snapshot.queryParamMap.get('reason');

  protected readonly retrying = signal(false);

  protected readonly reason = computed<SessionFailure>(() => {
    const fromStore = this.session.failure()?.reason;
    if (fromStore) return fromStore;
    return this.queryReason === 'expired' || this.queryReason === 'unreachable' ? this.queryReason : 'invalid';
  });
  protected readonly copy = computed(() => COPY[this.reason()]);
  protected readonly apiMessage = computed(() => this.session.failure()?.message || '');

  /** Checks the session again; a valid one goes back into the app. */
  protected async tryAgain(): Promise<void> {
    this.retrying.set(true);
    const ok = await this.session.retry();
    this.retrying.set(false);
    if (ok) await this.router.navigateByUrl('/member');
  }
}
