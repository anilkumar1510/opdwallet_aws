import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SessionStore } from '../../core/session/session.store';

@Component({
  selector: 'opd-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div class="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-soft">
        <h1 class="text-xl font-semibold text-brand-600">OPD Wallet</h1>
        <p class="mt-1 text-sm text-ink-500">Sign in to your health benefits</p>

        <form class="mt-6 space-y-4" (ngSubmit)="submit()">
          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-ink-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="username"
              required
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-ink-700"
              >Password</label
            >
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          @if (session.error(); as error) {
            <p class="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ error.message }}
            </p>
          }

          <button
            type="submit"
            class="min-h-touch w-full rounded-xl bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            [disabled]="session.busy()"
          >
            {{ session.busy() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginPage {
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected email = signal('');
  protected password = signal('');

  protected async submit(): Promise<void> {
    if (this.session.busy()) return;
    const signedIn = await this.session.login(this.email(), this.password());
    if (!signedIn) return;

    // Back to whatever they were trying to reach, not always the home screen.
    await this.router.navigateByUrl(this.session.takeRedirect() ?? '/member');
  }
}
