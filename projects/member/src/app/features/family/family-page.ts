import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { relationshipLabel } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { Member } from '../../core/member/member.model';
import { Policy } from '../../core/member/policy';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Pure view over FamilyStore — no fetching of its own. The store already holds
 * the family and their policies from /member/profile.
 */
@Component({
  selector: 'opd-family-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingView, EmptyView, BackLink, PageHeader],
  template: `
    <opd-page-header title="Family" subtitle="Everyone covered under your policy" />

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <div class="hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Family</h1>
        <p class="mt-0.5 text-sm text-ink-500">Everyone covered under your policy</p>
      </div>

      @if (family.loading()) {
        <opd-loading label="Loading family" />
      } @else if (family.failed()) {
        <opd-empty
          title="Family details unavailable"
          detail="We could not load your family right now. Your own screens still work."
        />
      } @else if (family.family().length) {
        <ul class="mt-5 grid gap-3 sm:grid-cols-2">
          @for (member of family.family(); track member.id) {
            <li
              class="rounded-2xl border-[1.5px] bg-white p-4"
              [class]="
                member.id === activeId()
                  ? 'border-[#0F5FDC]'
                  : 'border-[#E5E7EB]'
              "
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
            >
              <div class="flex items-start gap-3">
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#0E51A2]"
                  style="background: linear-gradient(261.92deg, rgba(223,232,255,.75) 4.4%, rgba(189,209,255,.75) 91.97%); border: 1px solid #A4BFFE7A"
                  aria-hidden="true"
                  >{{ member.initials }}</span
                >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-base font-semibold text-[#034DA2]">
                    {{ member.fullName }}
                  </p>
                  <p class="text-sm text-ink-700">{{ label(member) }}</p>
                  <dl class="mt-2 space-y-1 text-xs text-ink-500">
                    <div class="flex justify-between gap-2">
                      <dt>Member ID</dt>
                      <dd class="truncate font-medium text-ink-700">{{ member.memberId || '—' }}</dd>
                    </div>
                    @if (member.uhid) {
                      <div class="flex justify-between gap-2">
                        <dt>UHID</dt>
                        <dd class="truncate font-medium text-ink-700">{{ member.uhid }}</dd>
                      </div>
                    }
                    <div class="flex justify-between gap-2">
                      <dt>Policy</dt>
                      <dd class="truncate font-medium text-ink-700">{{ policyNumber(member) }}</dd>
                    </div>
                    <div class="flex justify-between gap-2">
                      <dt>Covered till</dt>
                      <dd class="truncate font-medium text-ink-700">{{ coveredTill(member) }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              @if (family.canSwitch()) {
                <button
                  type="button"
                  class="mt-3 min-h-touch w-full rounded-xl border border-surface-border text-sm font-medium transition-colors"
                  [class]="
                    member.id === activeId()
                      ? 'bg-blue-50 text-[#034DA2]'
                      : 'bg-white text-ink-700 hover:border-[#A4BFFE7A]'
                  "
                  [disabled]="member.id === activeId()"
                  (click)="family.setActiveMember(member)"
                >
                  {{ member.id === activeId() ? 'Currently viewing' : 'View their benefits' }}
                </button>
              }
            </li>
          }
        </ul>
      } @else {
        <opd-empty title="No family members" detail="Dependents added to your policy appear here." />
      }
    </div>
  `,
})
export class FamilyPage {
  protected readonly family = inject(FamilyStore);

  protected readonly activeId = computed(() => this.family.activeMember()?.id);

  /**
   * Every policy, not FamilyStore.policies() — this screen lists one row per
   * family member, so it still needs the others' policies while the portal is
   * viewing a single dependent.
   */
  private readonly policiesByHolder = computed(
    () => new Map<string, Policy>(this.family.allPolicies().map((p) => [p.holderId, p])),
  );

  protected label(member: Member): string {
    return relationshipLabel(member.relationship);
  }

  protected policyNumber(member: Member): string {
    return this.policiesByHolder().get(member.id)?.policyNumber ?? '—';
  }

  protected coveredTill(member: Member): string {
    const till = this.policiesByHolder().get(member.id)?.validTill;
    return till ? DATE.format(till) : '—';
  }
}
