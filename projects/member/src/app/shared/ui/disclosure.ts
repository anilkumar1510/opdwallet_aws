import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A collapsible section.
 *
 * Built on native `<details>`/`<summary>` rather than a signal and a click
 * handler: the browser gives keyboard operation, the correct ARIA semantics,
 * find-in-page that opens the section containing the match, and open/closed
 * state without any of it being written here. A hand-rolled accordion would be
 * more code and would need every one of those added back.
 *
 * `count` is shown beside the title so a closed section still says how much is
 * inside — a collapsed section with no count makes the member open it to find
 * out whether it was worth opening.
 */
@Component({
  selector: 'opd-disclosure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="group" [open]="startOpen()">
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-1 py-1"
      >
        <span class="flex items-center gap-2">
          <span class="text-base font-semibold" [style.color]="tone()">{{ title() }}</span>
          @if (count() !== null) {
            <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-700">
              {{ count() }}
            </span>
          }
        </span>
        <!-- Rotates with the native open state; no binding needed. -->
        <svg
          class="h-5 w-5 shrink-0 text-ink-500 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div class="mt-3">
        <ng-content />
      </div>
    </details>
  `,
  styles: [
    `
      /* Safari still paints its own triangle without this. */
      summary::-webkit-details-marker {
        display: none;
      }
    `,
  ],
})
export class Disclosure {
  readonly title = input.required<string>();
  /** Shown as a pill beside the title. Null hides it. */
  readonly count = input<number | null>(null);
  readonly tone = input<string>('#034DA2');
  readonly startOpen = input<boolean>(false);
}
