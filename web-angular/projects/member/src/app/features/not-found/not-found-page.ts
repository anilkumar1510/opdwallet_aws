import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'opd-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-20 text-center">
      <p class="text-3xl font-semibold text-brand-600">404</p>
      <h1 class="text-lg font-semibold text-ink-900">We could not find that page</h1>
      <p class="text-sm text-ink-500">The link may be out of date, or the page may have moved.</p>
      <a
        routerLink="/member"
        class="mt-2 min-h-touch rounded-xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700"
        >Back to home</a
      >
    </div>
  `,
})
export class NotFoundPage {}
