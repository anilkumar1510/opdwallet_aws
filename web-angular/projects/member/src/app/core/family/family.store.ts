import { Injectable, computed, signal } from '@angular/core';

import { Member } from '../member/member.model';
import { STATIC_FAMILY, STATIC_SELF } from '../member/static-member.data';
import { Policy } from '../member/policy';
import { STATIC_POLICIES } from '../member/static-policy.data';

const ACTIVE_MEMBER_KEY = 'opd.activeMemberId';

/**
 * Family + which member the portal is acting for — DUMMY / STATIC, zero backend.
 *
 * Replaces the `member/profile`-derived family and policy assignments. The
 * primary is Shivam; Sayani is a dependant. Public surface unchanged. See
 * REMOVED-APIS.md.
 */
@Injectable({ providedIn: 'root' })
export class FamilyStore {
  private readonly _family = signal<readonly Member[]>(STATIC_FAMILY);
  private readonly _activeId = signal<string | null>(readStored());

  readonly family = this._family.asReadonly();
  readonly loading = signal(false).asReadonly();
  readonly failed = signal(false).asReadonly();

  readonly activeMember = computed<Member | null>(() => {
    const family = this._family();
    const activeId = this._activeId();
    return family.find((m) => m.id === activeId) ?? family[0] ?? null;
  });

  readonly isViewingSelf = computed(() => this.activeMember()?.id === STATIC_SELF.id);

  /** A primary sees the whole family's policies; a dependant sees only their own. */
  readonly allPolicies = computed<readonly Policy[]>(() =>
    STATIC_SELF.isPrimary ? STATIC_POLICIES : STATIC_POLICIES.filter((p) => p.holderId === STATIC_SELF.id),
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
  readonly canSwitch = computed(() => STATIC_SELF.isPrimary && this._family().length > 1);

  load(): Promise<void> {
    return Promise.resolve();
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
