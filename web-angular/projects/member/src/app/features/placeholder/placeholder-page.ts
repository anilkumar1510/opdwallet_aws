import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map } from 'rxjs';

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
 *   'not-issued' — a document the flow promises that nothing generates yet: a
 *      receipt, a cashless letter. Distinct from 'no-api' because the journey
 *      around it works and only the artefact is missing.
 *   'with-us' — the step is real, it works, and it is OURS. Operations do it.
 *      Nothing is missing and there is nothing for the member to press; what
 *      they need is to know who they are waiting on. Distinct from every other
 *      reason here, which are all things that are absent.
 *   'not-modelled' — the thing is described, and the data model has no place
 *      to put it. Distinct from 'no-api', which is a missing endpoint over an
 *      existing shape: this needs a schema decision first, so a screen alone
 *      would not finish it.
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
      @if (reason() === 'not-modelled') {
        <p class="text-sm text-ink-500">
          Cover is held per member today, so a benefit cannot yet be shared across your family.
          Yours is your own — nobody else's visits come out of it, and none of theirs come out of
          yours.
        </p>
      } @else if (reason() === 'with-us') {
        <p class="text-sm text-ink-500">
          This one is ours, not yours. Our team confirms the slot with the clinic, and your booking
          moves to confirmed when they do — usually the same day. Nothing is charged while you wait.
        </p>
      } @else if (reason() === 'not-issued') {
        <p class="text-sm text-ink-500">
          We do not produce this yet. Your booking is unaffected — ask the clinic if you need it in
          writing.
        </p>
      } @else if (reason() === 'api-broken') {
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

  /**
   * A route may name the missing thing in `data.title`, or leave it to a `kind`
   * segment when one placeholder stands in for several documents. Without the
   * fallback those pages would all be headed the same, and a member looking for
   * a cashless letter could not tell they had reached the right page.
   */
  protected readonly title = toSignal(
    combineLatest([this.route.data, this.route.paramMap]).pipe(
      map(([data, params]) => {
        const named = data['title'] as string | undefined;
        if (named) return named;
        const kind = params.get('kind');
        if (!kind) return 'Coming soon';
        const words = kind.replace(/-/g, ' ');
        return words.charAt(0).toUpperCase() + words.slice(1);
      }),
    ),
    { initialValue: 'Coming soon' },
  );

  protected readonly reason = toSignal(
    this.route.data.pipe(map((data) => (data['reason'] as string | undefined) ?? 'not-migrated')),
    { initialValue: 'not-migrated' },
  );
}
