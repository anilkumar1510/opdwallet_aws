import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PolicyDetail } from '../../core/member/policy-detail';
import { PolicyStore } from '../../core/member/policy.store';
import { Disclosure } from '../../shared/ui/disclosure';
import { Icon, IconName } from '../../shared/ui/icon';
import { ErrorView, LoadingView } from '../../shared/ui/state-views';

@Component({
  selector: 'opd-policy-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, LoadingView, ErrorView, Disclosure],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Policy Details</h1>
            @if (store.detail(); as detail) {
              <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ detail.policyName }}</p>
            }
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1240px] px-5 py-6 lg:px-8">
        @if (store.loading()) {
          <opd-loading label="Loading policy" />
        } @else if (store.error(); as error) {
          <opd-error [error]="error" (retry)="store.retry()" />
        } @else if (store.detail(); as detail) {
          <!-- Summary -->
          <section
            class="rounded-2xl border border-[#CDDDFE] p-5 lg:p-6"
            style="background: linear-gradient(180deg,#F3F7FF 0%,#E9F1FF 100%)"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#034DA2]"
                aria-hidden="true"
              >
                <opd-icon name="claims" [size]="22" />
              </span>
              <h2 class="text-lg font-bold text-[#034DA2] lg:text-xl">Policy Summary</h2>
            </div>

            <dl class="mt-4 space-y-3">
              @for (row of summaryRows(detail); track row.label) {
                <div class="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#034DA2]"
                    aria-hidden="true"
                  >
                    <opd-icon [name]="row.icon" [size]="18" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs text-ink-500">{{ row.label }}</dt>
                    <dd class="truncate font-bold text-[#034DA2]">{{ row.value }}</dd>
                  </div>
                </div>
              }
            </dl>
          </section>

          @if (detail.inclusions.length) {
            <section
              class="mt-5 rounded-2xl border border-[#CDDDFE] p-5 lg:p-6"
              style="background: linear-gradient(180deg,#F3F7FF 0%,#E9F1FF 100%)"
            >
              <opd-disclosure
                title="What's Covered"
                [count]="detail.inclusions.length"
                tone="#034DA2"
              >
              <ul class="space-y-3">
                @for (clause of detail.inclusions; track clause.headline) {
                  <li class="rounded-xl bg-white/70 px-4 py-3">
                    <p class="font-semibold text-[#034DA2]">{{ clause.headline }}</p>
                    @if (clause.description) {
                      <p class="mt-0.5 text-sm text-ink-700">{{ clause.description }}</p>
                    }
                  </li>
                }
              </ul>
              </opd-disclosure>
            </section>
          }

          @if (detail.exclusions.length) {
            <section
              class="mt-5 rounded-2xl border border-[#F3D0D0] p-5 lg:p-6"
              style="background: linear-gradient(180deg,#FFF6F6 0%,#FDECEC 100%)"
            >
              <opd-disclosure
                title="What's Not Covered"
                [count]="detail.exclusions.length"
                tone="#B42318"
              >
              <ul class="space-y-3">
                @for (clause of detail.exclusions; track clause.headline) {
                  <li class="rounded-xl bg-white/70 px-4 py-3">
                    <p class="font-semibold text-ink-900">{{ clause.headline }}</p>
                    @if (clause.description) {
                      <p class="mt-0.5 text-sm text-ink-700">{{ clause.description }}</p>
                    }
                  </li>
                }
              </ul>
              </opd-disclosure>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class PolicyDetailsPage {
  /** Bound from the route param via withComponentInputBinding(). */
  readonly policyId = input<string>('');

  protected readonly store = inject(PolicyStore);

  constructor() {
    // The component asks the store what to load; it never fetches itself.
    effect(() => this.store.select(this.policyId()));
  }

  protected summaryRows(detail: PolicyDetail): readonly {
    icon: IconName;
    label: string;
    value: string;
  }[] {
    return [
      { icon: 'claims', label: 'Policy Number', value: detail.policyNumber },
      { icon: 'records', label: 'Corporate Name', value: detail.corporateName },
      { icon: 'bookings', label: 'Valid Till', value: detail.validTill },
    ];
  }
}
