import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { MemberProfileDto } from '../member/member.dto';
import { MEMBER_API, toFamily } from '../member/member.mapper';
import { Member } from '../member/member.model';
import { Policy, toPolicies } from '../member/policy';
import { SessionStore } from '../session/session.store';

const ACTIVE_MEMBER_KEY = 'opd.activeMemberId';

/**
 * Which family member the portal is currently acting for.
 *
 * This is the single source of truth: no screen picks a different member.
 * Dependent stores derive from `activeMember()` so a switch invalidates them
 * without any event wiring.
 */
@Injectable({ providedIn: 'root' })
export class FamilyStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _family = signal<readonly Member[]>([]);
  private readonly _allPolicies = signal<readonly Policy[]>([]);
  private readonly _activeId = signal<string | null>(null);
  private readonly _loading = signal(false);
  /** Family data failing must not block the member's own screens. */
  private readonly _failed = signal(false);

  private loadingFamily: Promise<void> | null = null;

  readonly family = this._family.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly failed = this._failed.asReadonly();

  /**
   * Falls back to the signed-in member whenever the stored selection is not in
   * the current family - a dependent who has since been removed must not leave
   * the portal pointing at nobody.
   */
  readonly activeMember = computed<Member | null>(() => {
    const family = this._family();
    const signedIn = this.session.member();
    if (!signedIn) return null;

    const activeId = this._activeId();
    return family.find((member) => member.id === activeId) ?? signedIn;
  });

  readonly isViewingSelf = computed(() => this.activeMember()?.id === this.session.member()?.id);

  /**
   * Every policy the signed-in member is entitled to see: the whole family's
   * for a primary, their own for a dependent. Screens that list the family as
   * a whole want this one.
   */
  readonly allPolicies = computed<readonly Policy[]>(() => {
    const all = this._allPolicies();
    const signedIn = this.session.member();
    if (signedIn?.isPrimary) return all;
    return all.filter((policy) => policy.holderId === signedIn?.id);
  });

  /**
   * The dashboard's carousel: every policy the member may see, with whoever is
   * being viewed at the front. Switching to a dependent leads with their card
   * rather than leaving the primary's first, and still keeps the rest.
   */
  readonly policies = computed<readonly Policy[]>(() => {
    const entitled = this.allPolicies();
    const activeId = this.activeMember()?.id;
    return [
      ...entitled.filter((policy) => policy.holderId === activeId),
      ...entitled.filter((policy) => policy.holderId !== activeId),
    ];
  });

  /** Switching is offered only to a primary member who has dependents. */
  readonly canSwitch = computed(
    () => (this.session.member()?.isPrimary ?? false) && this._family().length > 1,
  );

  constructor() {
    effect(() => {
      if (this.session.isAuthenticated()) {
        void this.load();
      } else {
        // Sign-out must leave nothing behind for the next member on this device.
        this.reset();
      }
    });
  }

  load(): Promise<void> {
    this.loadingFamily ??= this.runLoad().finally(() => {
      this.loadingFamily = null;
    });
    return this.loadingFamily;
  }

  private async runLoad(): Promise<void> {
    this._loading.set(true);
    this._failed.set(false);
    try {
      const dto = await firstValueFrom(this.http.get<MemberProfileDto>(MEMBER_API.profile));
      const { family } = toFamily(dto);
      this._family.set(family);
      this._allPolicies.set(toPolicies(dto.assignments));
      this._activeId.set(this.readStoredId());
    } catch {
      // Degrade to "just me": activeMember falls back to the signed-in member.
      this._family.set([]);
      this._allPolicies.set([]);
      this._failed.set(true);
    } finally {
      this._loading.set(false);
    }
  }

  setActiveMember(member: Member): void {
    if (!this._family().some((candidate) => candidate.id === member.id)) return;
    this._activeId.set(member.id);
    this.writeStoredId(member.id);
  }

  private reset(): void {
    this._family.set([]);
    this._allPolicies.set([]);
    this._activeId.set(null);
    this._failed.set(false);
    this.clearStoredId();
  }

  // sessionStorage, not localStorage: the selection is scoped to this tab and
  // this session, and must not survive into a different member's sign-in.
  private readStoredId(): string | null {
    try {
      return sessionStorage.getItem(ACTIVE_MEMBER_KEY);
    } catch {
      return null;
    }
  }

  private writeStoredId(id: string): void {
    try {
      sessionStorage.setItem(ACTIVE_MEMBER_KEY, id);
    } catch {
      // Private browsing or a full quota. The selection still holds in memory.
    }
  }

  private clearStoredId(): void {
    try {
      sessionStorage.removeItem(ACTIVE_MEMBER_KEY);
    } catch {
      // Nothing to do; in-memory state is already cleared.
    }
  }
}
