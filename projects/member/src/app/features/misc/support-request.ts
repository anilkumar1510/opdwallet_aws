import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';

import { FamilyStore } from '../../core/family/family.store';

const SUPPORT_EMAIL = 'support@opdwallet.com';

/**
 * The questions the support desk would have to ask anyway.
 *
 * "Ask for help" used to open a bare `mailto:` with the reference in the body and
 * an empty line under "Please describe what you need help with". That leaves the
 * member facing a blank email and the desk facing a reply that says "my claim was
 * rejected" and nothing else — which costs a round trip before anyone can act.
 *
 * Three questions, and no more than three:
 *   1. **what kind of problem** — a fixed list, because the desk routes on this
 *      and free text does not route
 *   2. **what happened** — the part only the member knows
 *   3. **where to reach them** — prefilled from the profile, editable, because
 *      the number on file is not always the one they want to be called on
 *
 * Everything else the desk needs (reference, status, amount, date) the portal
 * already knows and passes as context — asking the member to retype it would be
 * asking a question whose answer is on the screen behind the form.
 *
 * **There is still no ticket API** (`audit/39-support-screen.md`). The answers
 * compose a `mailto:`. The form is the honest half of a ticket: the questions are
 * real even when the transport is email.
 */
@Component({
  selector: 'opd-support-request',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-3 rounded-xl border border-[#86ACD8] bg-[#F5F8FF] p-3">
      <fieldset>
        <legend class="text-xs font-semibold text-ink-900">What do you need help with?</legend>
        <div class="mt-2 space-y-1.5">
          @for (option of topics(); track option) {
            <label class="flex items-start gap-2 text-xs text-ink-900">
              <input
                type="radio"
                class="mt-0.5"
                [name]="group"
                [value]="option"
                [checked]="topic() === option"
                (change)="topic.set(option)"
              />
              <span>{{ option }}</span>
            </label>
          }
        </div>
      </fieldset>

      <label class="mt-3 block text-xs font-semibold text-ink-900" [attr.for]="group + '-detail'">
        Tell us what happened
      </label>
      <textarea
        [id]="group + '-detail'"
        rows="3"
        class="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs"
        placeholder="What went wrong, and what would you like done?"
        [value]="detail()"
        (input)="detail.set($any($event.target).value)"
      ></textarea>

      <label class="mt-2 block text-xs font-semibold text-ink-900" [attr.for]="group + '-phone'">
        Best number to reach you
      </label>
      <input
        [id]="group + '-phone'"
        type="tel"
        inputmode="tel"
        class="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs"
        [value]="phone()"
        (input)="phone.set($any($event.target).value)"
      />

      @if (!valid()) {
        <p class="mt-2 text-xs text-ink-500">{{ missing() }}</p>
      }

      <div class="mt-3 flex gap-2">
        <a
          class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          [class.bg-\[\#0F5FDC\]]="valid()"
          [class.bg-ink-300]="!valid()"
          [class.pointer-events-none]="!valid()"
          [attr.aria-disabled]="!valid()"
          [attr.href]="valid() ? mailto() : null"
          >Send to support</a
        >
        <button
          type="button"
          class="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-900"
          (click)="cancelled.emit()"
        >
          Cancel
        </button>
      </div>
    </div>
  `,
})
export class SupportRequest {
  /** Distinguishes radio groups and label ids when several forms are on one page. */
  readonly group = `support-${Math.random().toString(36).slice(2, 8)}`;

  readonly subject = input.required<string>();
  /** Reference, status, date — what the portal knows and the member should not retype. */
  readonly context = input.required<readonly string[]>();
  readonly topics = input.required<readonly string[]>();

  readonly cancelled = output<void>();

  private readonly family = inject(FamilyStore);

  protected readonly topic = signal('');
  protected readonly detail = signal('');
  protected readonly phone = signal(this.family.activeMember()?.phone ?? '');

  protected readonly valid = computed(
    () => this.topic() !== '' && this.detail().trim().length >= 10 && this.phone().trim().length >= 6,
  );

  /** Names the missing piece rather than just disabling the button. */
  protected readonly missing = computed(() => {
    if (!this.topic()) return 'Choose what you need help with.';
    if (this.detail().trim().length < 10) return 'Add a little more detail — at least a sentence.';
    return 'Add a number we can reach you on.';
  });

  protected mailto(): string {
    const member = this.family.activeMember();
    const body = [
      ...this.context(),
      `Member: ${member?.fullName ?? ''}`,
      `Contact: ${this.phone().trim()}`,
      '',
      `Issue: ${this.topic()}`,
      '',
      this.detail().trim(),
      '',
    ].join('\n');
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(this.subject())}&body=${encodeURIComponent(body)}`;
  }
}
