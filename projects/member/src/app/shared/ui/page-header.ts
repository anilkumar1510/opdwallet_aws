import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The phone's screen header: the same blue field the home screen's greeting
 * sits on, carrying a way back and the screen's name.
 *
 * Phone only. Above lg the pages keep their own black title, which is the
 * reference portal's desktop layout — this is not a second header there.
 *
 * `back` is a fixed parent, not history, for the reason spelled out in
 * BackLink: these are destinations, not steps.
 */
@Component({
  selector: 'opd-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div
      class="lg:hidden"
      style="background: linear-gradient(180deg,#1F77E0 0%,#0E51A2 100%)"
    >
      <div class="mx-auto flex max-w-[480px] items-center gap-1 px-5 pb-4 pt-3">
        <a
          [routerLink]="back()"
          class="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          aria-label="Go back"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-[18px] font-medium leading-[1.2] text-white">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="truncate text-[12px] leading-[1.2] text-white/80">{{ subtitle() }}</p>
          }
        </div>

        <!-- Screen-specific action, e.g. Claims' "New claim". -->
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly back = input('/member');
}
