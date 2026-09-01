import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Destinations that exist in the navigation but are not built yet. Keeps
 * navigation parity honest — every listed destination routes somewhere real —
 * without pretending the feature exists.
 *
 * Two different gaps land here and they are not interchangeable, so the reason
 * is a route input rather than fixed copy:
 *
 *   'not-migrated' (default) — built in `web-member`, not moved over yet. The
 *      member can still do it in the current portal.
 *   'no-api' — described in the patient-flows sheet and built NOWHERE, because
 *      the endpoints do not exist. Telling the member to use the current portal
 *      would be false; there is nothing to send them to.
 *   'api-broken' — the endpoint EXISTS and does not work. Distinct from
 *      'no-api' on purpose: nothing here needs designing or specifying, and the
 *      screen is a few hours' work once the endpoint answers. Recording it as
 *      "not built" would send someone to design a feature that is already
 *      designed, and hide a defect behind a roadmap item.
 */
@Component({
  selector: 'opd-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-20 text-center">
      <h1 class="text-lg font-semibold text-ink-900">{{ title() }}</h1>
      @if (reason() === 'api-broken') {
        <p class="text-sm text-ink-500">
          This is not working yet. The screen is ready; the service behind it is
          returning an error, and it will appear here once that is fixed.
        </p>
      } @else if (reason() === 'no-api') {
        <p class="text-sm text-ink-500">
          This part of the journey is not available yet. It is not in the current member portal
          either — the service behind it has still to be built.
        </p>
      } @else {
        <p class="text-sm text-ink-500">
          This part of the portal has not moved over yet. It is still available in the current member
          portal.
        </p>
      }
      <a routerLink="/member/wallet" class="text-sm font-medium text-brand-700 underline"
        >Go to your wallet</a
      >
    </div>
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['title'] as string | undefined) ?? 'Coming soon')),
    { initialValue: 'Coming soon' },
  );

  protected readonly reason = toSignal(
    this.route.data.pipe(map((data) => (data['reason'] as string | undefined) ?? 'not-migrated')),
    { initialValue: 'not-migrated' },
  );
}
