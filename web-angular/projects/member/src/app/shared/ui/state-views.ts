import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppError } from '../../core/http/app-error';

@Component({
  selector: 'opd-loading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"
        aria-hidden="true"
      ></div>
      <p class="text-sm text-ink-500">{{ label() }}</p>
    </div>
  `,
})
export class LoadingView {
  readonly label = input('Loading');
}

/**
 * The retry action is only offered when retrying could plausibly help — a
 * validation failure will fail again unchanged.
 */
@Component({
  selector: 'opd-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center" role="alert">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-2xl text-danger-700"
        aria-hidden="true"
      >
        !
      </div>
      <div>
        <p class="font-medium text-ink-900">We could not load this</p>
        <p class="mt-1 max-w-sm text-sm text-ink-500">{{ error().message }}</p>
      </div>
      @if (error().retryable) {
        <button
          type="button"
          class="min-h-touch rounded-xl bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700"
          (click)="retry.emit()"
        >
          Try again
        </button>
      }
    </div>
  `,
})
export class ErrorView {
  readonly error = input.required<AppError>();
  readonly retry = output<void>();
}

@Component({
  selector: 'opd-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p class="font-medium text-ink-700">{{ title() }}</p>
      @if (detail(); as text) {
        <p class="max-w-sm text-sm text-ink-500">{{ text }}</p>
      }
    </div>
  `,
})
export class EmptyView {
  readonly title = input.required<string>();
  readonly detail = input<string | null>(null);
}
