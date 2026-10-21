import { Injectable, effect, inject, signal } from '@angular/core';

import { AppError, appError } from '../http/app-error';
import { AppService } from '../http/api.service';
import { ClaimCategory } from '../claims/claim.mapper';
import { SessionStore } from '../session/session.store';
import { Policy } from './policy';
import { PolicyDetail } from './policy-detail';
import {
  OpdPolicyMemberAssignmentDto,
  OpdPolicyVersionDto,
} from './policy.dto';
import {
  findRelationshipInVersion,
  getPrimaryRelationship,
  resolveRelationshipBenefits,
  toCategoriesFromVersion,
  toCombinedClaimCategories,
  toPolicyDetailFromVersion,
  toPolicyFromVersion,
  toPoolsFromVersion,
  toWalletTotalFromVersion,
} from './policy.mapper';
import { WalletPool } from './wallet-pool.model';
import { Money, money } from '../domain/money';
import { WalletCategoryBalance } from '../wallet/wallet.model';

/**
 * Manages the member's assigned policy and policy version from live APIs:
 * 1. GET habit-opd/api/v1/opd_policy_member_assignment?queryId=GET_PAGE&filter=patient_id:{patientId}&page_no=0&page_size=2
 * 2. Extracts `policy_version_id` from the member assignment.
 * 3. GET habit-opd/api/v1/opd_policy_version?queryId=GET_PAGE&filter=id:{policy_version_id}&page_no=0&page_size=2
 * 4. Updates signals for the policy card, policy detail, wallet total, benefit categories, and benefit pools.
 */
@Injectable({ providedIn: 'root' })
export class PolicyStore {
  private readonly appService = inject(AppService);
  private readonly session = inject(SessionStore);

  private readonly _assignment = signal<OpdPolicyMemberAssignmentDto | null>(null);
  private readonly _version = signal<OpdPolicyVersionDto | null>(null);
  private readonly _policies = signal<readonly Policy[]>([]);
  private readonly _detail = signal<PolicyDetail | null>(null);
  private readonly _walletTotal = signal<{ available: Money; allocated: Money }>({
    available: money(0),
    allocated: money(0),
  });
  private readonly _categories = signal<readonly WalletCategoryBalance[]>([]);
  private readonly _pools = signal<readonly WalletPool[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);

  private loadedId: string | null = null;
  private lastPatientId: string | null = null;

  readonly assignment = this._assignment.asReadonly();
  readonly version = this._version.asReadonly();
  readonly policies = this._policies.asReadonly();
  readonly detail = this._detail.asReadonly();
  readonly walletTotal = this._walletTotal.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly pools = this._pools.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) {
        this.reset();
      }
    });
  }

  /**
   * Loads the assigned policy version for a given patientId from the live APIs.
   */
  async load(patientId: string): Promise<void> {
    if (!patientId) return;
    this.lastPatientId = patientId;
    this._loading.set(true);
    this._error.set(null);

    try {
      // Step 1: Query member policy assignment
      const assignmentRes: any = await new Promise((resolve, reject) => {
        const queryArgs = `queryId=GET_PAGE&filter=patient_id%3A${encodeURIComponent(patientId)}&page_no=0&page_size=2`;
        this.appService
          .getcall('opd_policy_member_assignment', 'habit-opd', queryArgs)
          .subscribe({
            next: (res: any) => resolve(res),
            error: (err: any) => reject(err),
          });
      });

      const parsedAssignment = typeof assignmentRes === 'string' ? JSON.parse(assignmentRes) : assignmentRes;
      const assignment: OpdPolicyMemberAssignmentDto | undefined = parsedAssignment?.resource?.[0];

      if (!assignment?.policy_version_id) {
        this._assignment.set(null);
        this._version.set(null);
        this._policies.set([]);
        this._detail.set(null);
        this._walletTotal.set({ available: money(0), allocated: money(0) });
        this._categories.set([]);
        this._pools.set([]);
        this._loading.set(false);
        return;
      }

      this._assignment.set(assignment);

      // Step 2: Query policy version by policy_version_id
      const versionRes: any = await new Promise((resolve, reject) => {
        const queryArgs = `queryId=GET_PAGE&filter=id%3A${encodeURIComponent(assignment.policy_version_id)}&page_no=0&page_size=2`;
        this.appService
          .getcall('opd_policy_version', 'habit-opd', queryArgs)
          .subscribe({
            next: (res: any) => resolve(res),
            error: (err: any) => reject(err),
          });
      });

      const parsedVersion = typeof versionRes === 'string' ? JSON.parse(versionRes) : versionRes;
      const version: OpdPolicyVersionDto | undefined = parsedVersion?.resource?.[0];

      if (version) {
        const primary = getPrimaryRelationship(version);
        const normalizedRelationships = (version.relationships ?? []).map((rel) =>
          resolveRelationshipBenefits(rel, primary),
        );
        const normalizedVersion: OpdPolicyVersionDto = {
          ...version,
          relationships: normalizedRelationships,
        };

        this._version.set(normalizedVersion);

        const member = this.session.member();
        const holderId = member?.id ?? patientId;
        const holderName = member?.fullName ?? 'Member';

        const policy = toPolicyFromVersion(assignment, normalizedVersion, holderId, holderName);
        this._policies.set([policy]);

        this._detail.set(toPolicyDetailFromVersion(normalizedVersion));
        this._walletTotal.set(toWalletTotalFromVersion(normalizedVersion));
        this._categories.set(toCategoriesFromVersion(normalizedVersion));
        this._pools.set(toPoolsFromVersion(normalizedVersion));
      }
    } catch (err: any) {
      this._error.set(appError('network', err?.message, err?.status ?? null));
      this._assignment.set(null);
      this._version.set(null);
      this._policies.set([]);
      this._detail.set(null);
      this._walletTotal.set({ available: money(0), allocated: money(0) });
      this._categories.set([]);
      this._pools.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Returns combined claim categories (standard categories with claims: true + additional_claim_categories)
   * for a given member relationship code under the active policy version.
   */
  getClaimCategoriesForRelationship(relationshipCode: string | undefined): readonly ClaimCategory[] {
    const version = this._version();
    if (!version) return [];
    const rel = findRelationshipInVersion(version, relationshipCode);
    return toCombinedClaimCategories(rel);
  }

  /**
   * Sets active detail by policyId.
   */
  select(policyId: string): void {
    if (!policyId || policyId === this.loadedId) return;
    this.loadedId = policyId;
    this._error.set(null);

    const version = this._version();
    if (version) {
      this._detail.set(toPolicyDetailFromVersion(version));
    } else {
      this._detail.set(null);
    }
  }

  retry(): void {
    if (this.lastPatientId) {
      void this.load(this.lastPatientId);
    }
  }

  private reset(): void {
    this.loadedId = null;
    this.lastPatientId = null;
    this._assignment.set(null);
    this._version.set(null);
    this._policies.set([]);
    this._detail.set(null);
    this._walletTotal.set({ available: money(0), allocated: money(0) });
    this._categories.set([]);
    this._pools.set([]);
    this._error.set(null);
  }
}
