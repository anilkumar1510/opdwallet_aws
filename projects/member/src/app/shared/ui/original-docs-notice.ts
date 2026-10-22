import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import {
  ClaimDocsStore,
  ORIGINALS_ADDRESS,
  ORIGINALS_DAYS,
} from '../../core/member/claim-docs.store';

/**
 * When the policy needs the original documents as well as the digital ones
 * (claim_type === 'DIGITAL_PHYSICAL'), asks the member — gently — to post them
 * after submitting a claim. Renders nothing under a digital-only policy.
 *
 * `resubmit` is the one-line reminder for a claim that is asking for its
 * documents again; it points at the full notice rather than repeating it.
 */
@Component({
  selector: 'opd-original-docs-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (docs.needsOriginals()) {
      @if (variant() === 'resubmit') {
        <p class="text-xs text-[#034DA2]">
          ✉ Along with the documents, please post the originals to our claims department — they must reach us within {{ days }} days.
        </p>
      } @else {
        <section class="rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-4 text-sm text-ink-700 lg:p-5" aria-label="Original documents">
          <p class="font-semibold text-[#034DA2]">📮 Original documents required</p>
          <p class="mt-1.5">
            Your policy requires the original bills, prescriptions and reports for every claim. After you submit
            {{ variant() === 'list' ? 'a' : 'this' }} claim, please post them to us so they reach us within
            <span class="font-semibold text-ink-900">{{ days }} days</span> of submission:
          </p>
          <address class="mt-2 rounded-xl bg-white px-4 py-3 text-sm not-italic leading-relaxed text-ink-900">
            <span class="font-medium">{{ address.to }}</span><br />
            @for (line of address.lines; track line) {
              {{ line }}<br />
            }
            Contact: <a [href]="telHref" class="text-[#0F5FDC] hover:underline">{{ address.phone }}</a>
          </address>
          <p class="mt-2 text-xs text-ink-500">
            We're sorry for the extra step. Please note the claim can't be processed if the originals don't reach us within
            {{ days }} days.
          </p>
        </section>
      }
    }
  `,
})
export class OriginalDocsNotice {
  /** `claim`: on a claim being filed · `list`: on the claims list · `resubmit`: one line on a claim. */
  readonly variant = input<'claim' | 'list' | 'resubmit'>('claim');

  protected readonly docs = inject(ClaimDocsStore);
  protected readonly address = ORIGINALS_ADDRESS;
  protected readonly days = ORIGINALS_DAYS;
  protected readonly telHref = 'tel:' + ORIGINALS_ADDRESS.phone.replace(/-/g, '');
}
