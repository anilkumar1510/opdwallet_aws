import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AppError, appError } from '../http/app-error';
import { Member } from '../member/member.model';
import { Policy } from '../member/policy';
import { PolicyStore } from '../member/policy.store';
import { FamilyMemberResource, Relationship, toFamilyMember } from '../member/family-mapper';
import { isRelationshipCoveredInPolicy } from '../member/policy.mapper';
import { AppService } from '../http/api.service';
import { SessionStore } from '../session/session.store';

const ACTIVE_MEMBER_KEY = 'opd.activeMemberId';

/**
 * Family + which member the portal is acting for, loaded from
 * `user_relationship_mapping` (GET_FAMILY_LIST) live API.
 *
 * Dynamically resolves `user_id` from GET_FAMILY_LIST to load policy assignments
 * via PolicyStore, and generates policy cards filtered by allowed relationships
 * defined in the active opd_policy_version.
 */
@Injectable({ providedIn: 'root' })
export class FamilyStore {
  private readonly _family = signal<readonly Member[]>([]);
  private readonly _activeId = signal<string | null>(readStored());

  private readonly appService = inject(AppService);
  private readonly session = inject(SessionStore);
  private readonly policyStore = inject(PolicyStore);

  readonly family = this._family.asReadonly();
  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  private readonly _error = signal<AppError | null>(null);
  readonly error = this._error.asReadonly();
  readonly failed = signal(false).asReadonly();

  readonly activeMember = computed<Member | null>(() => {
    const family = this._family();
    const activeId = this._activeId();
    if (activeId) return family.find((m) => m.id === activeId) ?? null;
    return family.find((m) => m.isPrimary) ?? family[0] ?? null;
  });

  readonly isViewingSelf = computed(() => this.activeMember()?.isPrimary === true);

  /**
   * Generates policy cards for family members who are covered under the active
   * policy version's allowed relationship types.
   */
  readonly allPolicies = computed<readonly Policy[]>(() => {
    const version = this.policyStore.version();
    const family = this._family();

    if (!version || !family.length) {
      return [];
    }

    const cards: Policy[] = [];
    for (const member of family) {
      const relCode = member.relationshipCode || (member.isPrimary ? 'self' : '');
      if (isRelationshipCoveredInPolicy(relCode, version)) {
        cards.push({
          id: version.id || version.policy_id,
          holderId: member.id,
          holderName: member.fullName,
          policyNumber: version.policy_number,
          corporate: 'HCL Healthcare',
          validFrom: version.effective_from ? new Date(version.effective_from) : null,
          validTill: version.effective_to ? new Date(version.effective_to) : null,
        });
      }
    }

    return cards;
  });

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

  isMemberCovered(member: Member): boolean {
    const version = this.policyStore.version();
    const relCode = member.relationshipCode || (member.isPrimary ? 'self' : '');
    return isRelationshipCoveredInPolicy(relCode, version);
  }

  readonly isCurrentMemberCovered = computed(() => {
    const active = this.activeMember();
    return active ? this.isMemberCovered(active) : false;
  });

  constructor() {
    effect(() => {
      const active = this.activeMember();
      const relCode = active?.relationshipCode || (active?.isPrimary ? 'self' : 'self');
      this.policyStore.setActiveRelationship(relCode);
    });
    void this.load();
  }

  load(): Promise<void> {
    return new Promise((resolve) => {
      this._loading.set(true);
      this._error.set(null);
      this.appService
        .getcall('user_relationship_mapping', 'account-management', 'queryId=GET_FAMILY_LIST&args=&application=account-management')
        .subscribe({
          next: (response: any) => {
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const resources: FamilyMemberResource[] = parsed?.resource ?? [];
            if (resources.length > 0) {
              this.applyFamilyResources(resources);
            } else {
              this._family.set([]);
            }
            this._loading.set(false);
            resolve();
          },
          error: (err: any) => {
            this._family.set([]);
            this._error.set(appError('network', err?.message || 'Failed to load family information', err?.status ?? null));
            this._loading.set(false);
            resolve();
          },
        });
    });
  }

  retry(): void {
    void this.load();
  }

  private applyFamilyResources(resources: FamilyMemberResource[]): void {
    // Dynamic user_id from the live GET_FAMILY_LIST response
    const primaryResource = resources.find(
      (r) => !r.relationship_code || r.relationship_code.toLowerCase() === 'self' || r.mapped_id === r.user_id,
    ) ?? resources[0];
    const dynamicUserId = primaryResource?.user_id ?? primaryResource?.mapped_id;

    if (dynamicUserId) {
      const familyMembers = resources.map((r) => toFamilyMember(r, dynamicUserId));
      familyMembers.sort((a, b) => {
        const aIsSelf = a.isPrimary || a.relationship === Relationship.Self || a.relationshipCode === 'self';
        const bIsSelf = b.isPrimary || b.relationship === Relationship.Self || b.relationshipCode === 'self';
        if (aIsSelf && !bIsSelf) return -1;
        if (!aIsSelf && bIsSelf) return 1;
        return 0;
      });
      this._family.set(familyMembers);

      const primaryMember = familyMembers.find((m) => m.isPrimary);
      if (primaryMember) {
        this.session.setMember(primaryMember);
      }

      // Trigger live policy resolution with the dynamic patient ID
      void this.policyStore.load(dynamicUserId);
    }
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
