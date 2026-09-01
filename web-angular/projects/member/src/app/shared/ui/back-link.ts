import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A way back from a destination screen.
 *
 * The reference carries one on 21 pages; Angular had one on three, and a runtime
 * sweep found eight nav-reachable screens with no way back but the browser
 * control.
 *
 * **It navigates to a FIXED parent, not through history**, and that is the whole
 * point of this component. The first version called `Location.back()`, which
 * retraces whatever the member did — so a member who had moved between, say, the
 * wallet and the transaction history using the bottom nav filled their history
 * with alternating entries, and pressing back walked back through them one at a
 * time. It looked like the two screens were looping and home was unreachable.
 * That is not a bug in history.back(); it is history.back() working, applied to
 * screens that are destinations rather than steps.
 *
 * A destination has one sensible parent. `/member` is the default because every
 * screen this sits on is reachable from the home screen; pass `to` where a
 * screen belongs under something else.
 *
 * Journey screens (AHC, lab, clinic booking) are deliberately NOT using this —
 * they point at the previous STEP via their own `routerLink`, which is correct
 * for a wizard.
 */
@Component({
  selector: 'opd-back-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="to()"
      class="-ml-2 mb-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-surface-muted"
      aria-label="Go back"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
  `,
})
export class BackLink {
  /** Where back goes. A destination screen has one parent; history has many. */
  readonly to = input<string>('/member');
}
