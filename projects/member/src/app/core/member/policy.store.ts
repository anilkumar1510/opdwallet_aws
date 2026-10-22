import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AppError, appError } from '../http/app-error';
import { AppService } from '../http/api.service';
import { ClaimCategory } from '../claims/claim.mapper';
import { SessionStore } from '../session/session.store';
import { Policy } from './policy';
import { PolicyDetail } from './policy-detail';
import {
  OpdConsumptionCycleDto,
  OpdPolicyMemberAssignmentDto,
  OpdPolicyVersionDto,
  PolicyBenefitPoolDto,
} from './policy.dto';
import {
  findRelationshipInVersion,
  getPrimaryRelationship,
  isRelationshipCoveredInPolicy,
  resolveRelationshipBenefits,
  toCategoriesFromVersion,
  toCombinedClaimCategories,
  toPolicyDetailFromVersion,
  toPolicyFromVersion,
  toPoolsFromApiAndVersion,
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
  private readonly _rawPools = signal<readonly PolicyBenefitPoolDto[]>([]);
  private readonly _consumptionCycles = signal<readonly OpdConsumptionCycleDto[]>([]);
  private readonly _policies = signal<readonly Policy[]>([]);
  private readonly _detail = signal<PolicyDetail | null>(null);
  private readonly _activeRelationshipCode = signal<string>('self');
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);

  private loadedId: string | null = null;
  private lastPatientId: string | null = null;

  readonly assignment = this._assignment.asReadonly();
  readonly version = this._version.asReadonly();
  readonly consumptionCycles = this._consumptionCycles.asReadonly();
  readonly policies = this._policies.asReadonly();
  readonly detail = this._detail.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeRelationshipCode = this._activeRelationshipCode.asReadonly();

  readonly isCovered = computed(() =>
    isRelationshipCoveredInPolicy(this._activeRelationshipCode(), this._version()),
  );

  readonly walletTotal = computed(() =>
    toWalletTotalFromVersion(this._version(), this._activeRelationshipCode(), this._consumptionCycles()),
  );

  readonly categories = computed(() =>
    toCategoriesFromVersion(this._version(), this._activeRelationshipCode(), this._consumptionCycles()),
  );

  readonly pools = computed(() =>
    toPoolsFromApiAndVersion(this._rawPools(), this._version(), this._activeRelationshipCode(), this._consumptionCycles()),
  );

  /**
   * Indicates whether the policy requires both digital and physical original documents
   * for claims (claim_type === 'DIGITAL_PHYSICAL').
   */
  readonly isDigitalPhysicalClaim = computed<boolean>(() => {
    return this._version()?.claim_type?.trim().toUpperCase() === 'DIGITAL_PHYSICAL';
  });

  setActiveRelationship(code: string): void {
    const normalized = (code || 'self').trim().toLowerCase();
    if (this._activeRelationshipCode() !== normalized) {
      this._activeRelationshipCode.set(normalized);
    }
  }

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
        this._rawPools.set([]);
        this._consumptionCycles.set([]);
        this._policies.set([]);
        this._detail.set(null);
        this._loading.set(false);
        return;
      }

      this._assignment.set(assignment);

      // Step 2: Query policy version, benefit pools, and consumption cycles in parallel
      const versionPromise: Promise<any> = new Promise((resolve, reject) => {
        const queryArgs = `queryId=GET_PAGE&filter=id%3A${encodeURIComponent(assignment.policy_version_id)}&page_no=0&page_size=2`;
        this.appService
          .getcall('opd_policy_version', 'habit-opd', queryArgs)
          .subscribe({
            next: (res: any) => resolve(res),
            error: (err: any) => reject(err),
          });
      });

      const policyId = assignment.policy_id;
      const poolsPromise: Promise<any> = policyId
        ? new Promise((resolve) => {
            const queryArgs = `queryId=GET_PAGE&args=noCount%3A1&filter=policy_id%3A${encodeURIComponent(policyId)}&projectionKeys=code%2Cpool_name%2Cpolicy_id%2Cannual_limit&page_size=1000&application=habit-opd`;
            this.appService
              .getcall('opd_benefit_category_pool', 'habit-opd', queryArgs)
              .subscribe({
                next: (res: any) => resolve(res),
                error: (err: any) => {
                  console.error('Failed to load benefit category pools:', err);
                  resolve(null);
                },
              });
          })
        : Promise.resolve(null);

      const consumptionPromise: Promise<any> = new Promise((resolve) => {
        const queryArgs = `queryId=GET_PAGE&filter=patient_id%3A${encodeURIComponent(patientId)}&page_no=0&page_size=1000`;
        this.appService
          .getcall('opd_consumption_cycle', 'habit-opd', queryArgs)
          .subscribe({
            next: (res: any) => resolve(res),
            error: (err: any) => {
              console.error('Failed to load consumption cycles:', err);
              resolve(null);
            },
          });
      });

      const [versionRes, poolsRes, consumptionRes] = await Promise.all([
        versionPromise,
        poolsPromise,
        consumptionPromise,
      ]);

      let parsedCycles: OpdConsumptionCycleDto[] = [];
      if (consumptionRes) {
        const parsed = typeof consumptionRes === 'string' ? JSON.parse(consumptionRes) : consumptionRes;
        parsedCycles = parsed?.resource ?? [];
      }
      this._consumptionCycles.set(parsedCycles);

      const parsedVersion = typeof versionRes === 'string' ? JSON.parse(versionRes) : versionRes;
      const version: OpdPolicyVersionDto | undefined = parsedVersion?.resource?.[0];

      let parsedPools: PolicyBenefitPoolDto[] = [];
      if (poolsRes) {
        const parsed = typeof poolsRes === 'string' ? JSON.parse(poolsRes) : poolsRes;
        parsedPools = parsed?.resource ?? [];
      } else if (version?.policy_id && !policyId) {
        try {
          const queryArgs = `queryId=GET_PAGE&args=noCount%3A1&filter=policy_id%3A${encodeURIComponent(version.policy_id)}&projectionKeys=code%2Cpool_name%2Cpolicy_id%2Cannual_limit&page_size=1000&application=habit-opd`;
          const fallbackRes: any = await new Promise((resolve, reject) => {
            this.appService
              .getcall('opd_benefit_category_pool', 'habit-opd', queryArgs)
              .subscribe({
                next: (res: any) => resolve(res),
                error: (err: any) => reject(err),
              });
          });
          const parsed = typeof fallbackRes === 'string' ? JSON.parse(fallbackRes) : fallbackRes;
          parsedPools = parsed?.resource ?? [];
        } catch {
          // Fallback to version-derived pools handled by mapper
        }
      }

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
        this._rawPools.set(parsedPools);
      }
    } catch (err: any) {
      this._error.set(appError('network', err?.message, err?.status ?? null));
      this._assignment.set(null);
      this._version.set(null);
      this._rawPools.set([]);
      this._consumptionCycles.set([]);
      this._policies.set([]);
      this._detail.set(null);
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
    this._rawPools.set([]);
    this._consumptionCycles.set([]);
    this._policies.set([]);
    this._detail.set(null);
    this._activeRelationshipCode.set('self');
    this._error.set(null);
  }
}
