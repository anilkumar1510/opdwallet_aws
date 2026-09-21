import { Injectable, computed, inject, signal } from '@angular/core';

import { Member } from '../member/member.model';
import { Policy } from '../member/policy';
import { STATIC_POLICIES } from '../member/static-policy.data';
import { FamilyMemberResource, toFamilyMember } from '../member/family-mapper';
import { AppService } from '../http/api.service';
import { SessionStore } from '../session/session.store';

const ACTIVE_MEMBER_KEY = 'opd.activeMemberId';

/**
 * Family + which member the portal is acting for, loaded from
 * `user_relationship_mapping` (GET_FAMILY_LIST) on init. The primary is the
 * member whose record has no relationship_code (or whose mapped_id equals the
 * signed-in user id); everyone else is a dependant. Public surface unchanged.
 * See REMOVED-APIS.md.
 */
@Injectable({ providedIn: 'root' })
export class FamilyStore {
  private readonly _family = signal<readonly Member[]>([]);
  private readonly _activeId = signal<string | null>(readStored());

  private readonly appService = inject(AppService);
  private readonly session = inject(SessionStore);

  readonly family = this._family.asReadonly();
  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  readonly failed = signal(false).asReadonly();

  readonly activeMember = computed<Member | null>(() => {
    const family = this._family();
    const activeId = this._activeId();
    if (activeId) return family.find((m) => m.id === activeId) ?? null;
    return family.find((m) => m.isPrimary) ?? family[0] ?? null;
  });

  readonly isViewingSelf = computed(() => this.activeMember()?.isPrimary === true);

  /** A primary sees the whole family's policies; a dependant sees only their own. */
  // ponytail: faithful port of the old constant-true ternary — static holderIds
  // ('shivam'/'sayani') never match live member ids, so the filter branch is
  // dead until policies come from the backend too.
  readonly allPolicies = computed<readonly Policy[]>(() =>
    this._family().some((m) => m.isPrimary)
      ? STATIC_POLICIES
      : STATIC_POLICIES.filter((p) => p.holderId === this.activeMember()?.id),
  );

  /** The dashboard carousel: entitled policies, with the active member's first. */
  readonly policies = computed<readonly Policy[]>(() => {
    const entitled = this.allPolicies();
    const activeId = this.activeMember()?.id;
    return [
      ...entitled.filter((p) => p.holderId === activeId),
      ...entitled.filter((p) => p.holderId !== activeId),
    ];
  });

  /** Switching is offered only to a primary with dependants. */
  readonly canSwitch = computed(() => this._family().some((m) => m.isPrimary) && this._family().length > 1);

  load(): Promise<void> {
    return new Promise((resolve) => {
      this._loading.set(true);
      this.appService
        .getcall('user_relationship_mapping', 'account-management', 'queryId=GET_FAMILY_LIST&args=&application=account-management')
        .subscribe({
          next: (response: any) => {
            const parsed = JSON.parse(response);
            const resources: FamilyMemberResource[] = parsed?.resource ?? [];
            const userId = this.session.member()?.memberId ?? '';
            this._family.set(resources.map((r) => toFamilyMember(r, userId)));
            this._loading.set(false);
            resolve();
          },
          error: () => {
            this._loading.set(false);
            resolve();
          },
        });
    });
  }

  setActiveMember(member: Member): void {
    if (!this._family().some((m) => m.id === member.id)) return;
    this._activeId.set(member.id);
    writeStored(member.id);
  }
}

function readStored(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_MEMBER_KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string): void {
  try {
    sessionStorage.setItem(ACTIVE_MEMBER_KEY, id);
  } catch {
    /* private browsing / quota — the selection still holds in memory */
  }
}