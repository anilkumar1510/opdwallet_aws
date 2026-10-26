import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AppError, appError } from '../http/app-error';
import { AppService } from '../http/api.service';
import { ClaimCategory } from '../claims/claim.mapper';
import { SessionStore } from '../session/session.store';
import { UserInfoStore } from '../session/userinfo.store';
import { Policy } from './policy';
import { PolicyDetail } from './policy-detail';
import {
  OpdConsumptionCycleDto,
  OpdPolicyMemberAssignmentDto,
  OpdPolicyVersionDto,
  OpdWalletAccountDto,
  PolicyBenefitPoolDto,
} from './policy.dto';
import { WalletPassbookItemDto } from '../wallet/wallet-passbook.dto';
import { EnrichedWalletPassbookItem } from '../wallet/wallet-passbook.model';
import { mapPassbookToEnriched } from '../wallet/wallet-passbook.mapper';
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
import { BenefitCategory, toBenefitCategory } from '../domain/codes';
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
  private readonly userStore = inject(UserInfoStore);

  private readonly _assignment = signal<OpdPolicyMemberAssignmentDto | null>(null);
  private readonly _version = signal<OpdPolicyVersionDto | null>(null);
  private readonly _rawPools = signal<readonly PolicyBenefitPoolDto[]>([]);
  private readonly _consumptionCycles = signal<readonly OpdConsumptionCycleDto[]>([]);
  private readonly _policies = signal<readonly Policy[]>([]);
  private readonly _detail = signal<PolicyDetail | null>(null);
  private readonly _activeRelationshipCode = signal<string>('self');
  private readonly _loading = signal(false);
  private readonly _error = signal<AppError | null>(null);

  private readonly _walletAccount = signal<OpdWalletAccountDto | null>(null);
  private readonly _walletCache = new Map<string, OpdWalletAccountDto>();
  private readonly _activeUhId = signal<string | null>(null);
  private readonly _primaryUhId = signal<string | null>(null);

  private readonly _passbook = signal<readonly WalletPassbookItemDto[]>([]);
  private readonly _passbookLoading = signal<boolean>(false);
  private readonly _passbookLoadingMore = signal<boolean>(false);
  private readonly _passbookError = signal<string | null>(null);
  private readonly _passbookPage = signal<number>(0);
  private readonly _passbookHasMore = signal<boolean>(true);
  private readonly _passbookTotalCount = signal<number | null>(null);

  private lastPassbookUhId: string | null = null;
  private loadedId: string | null = null;
  private lastPatientId: string | null = null;
  private loadedPatientId: string | null = null;

  readonly assignment = this._assignment.asReadonly();
  readonly version = this._version.asReadonly();
  readonly consumptionCycles = this._consumptionCycles.asReadonly();
  readonly policies = this._policies.asReadonly();
  readonly detail = this._detail.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeRelationshipCode = this._activeRelationshipCode.asReadonly();
  readonly walletAccount = this._walletAccount.asReadonly();
  readonly passbook = this._passbook.asReadonly();
  readonly passbookLoading = this._passbookLoading.asReadonly();
  readonly passbookLoadingMore = this._passbookLoadingMore.asReadonly();
  readonly passbookError = this._passbookError.asReadonly();
  readonly passbookPage = this._passbookPage.asReadonly();
  readonly passbookHasMore = this._passbookHasMore.asReadonly();
  readonly passbookTotalCount = this._passbookTotalCount.asReadonly();

  readonly enrichedPassbook = computed<readonly EnrichedWalletPassbookItem[]>(() =>
    mapPassbookToEnriched(this._passbook(), this._consumptionCycles()),
  );

  readonly isCovered = computed(() =>
    isRelationshipCoveredInPolicy(this._activeRelationshipCode(), this._version()),
  );

  readonly isFloater = computed<boolean>(() => {
    return (this._version()?.allocation_type || '').trim().toUpperCase() === 'FLOATER';
  });

  readonly basePolicyLimit = computed<number>(() => {
    const version = this._version();
    if (!version) return 0;
    const primary = getPrimaryRelationship(version);
    const rel = findRelationshipInVersion(version, this._activeRelationshipCode());
    return rel?.wallet_configuration?.annual_limit ?? primary?.wallet_configuration?.annual_limit ?? 26000;
  });

  readonly topupAmount = computed<number>(() => {
    const account = this._walletAccount();
    const base = this.basePolicyLimit();
    if (!account) return 0;
    return Math.max(0, (Number(account.total_topup_amt) || 0) - base);
  });

  readonly walletTotal = computed(() => {
    const account = this._walletAccount();
    const versionTotal = toWalletTotalFromVersion(
      this._version(),
      this._activeRelationshipCode(),
      this._consumptionCycles(),
    );

    if (account) {
      const baseLimit = this.basePolicyLimit() || versionTotal.allocated.amount;
      const topup = Math.max(0, (Number(account.total_topup_amt) || 0) - baseLimit);
      const allocated = baseLimit + topup;
      const available = Number.isFinite(Number(account.avl_bal))
        ? Number(account.avl_bal)
        : versionTotal.available.amount;
      // Preserves actual clinical consumption tracked in opd_consumption_cycle
      const consumed = versionTotal.consumed.amount > 0
        ? versionTotal.consumed
        : money(Math.max(0, allocated - available));

      return {
        available: money(available),
        allocated: money(allocated),
        consumed,
      };
    }
    return versionTotal;
  });

  readonly categories = computed(() =>
    toCategoriesFromVersion(this._version(), this._activeRelationshipCode(), this._consumptionCycles()),
  );

  readonly pools = computed(() =>
    toPoolsFromApiAndVersion(this._rawPools(), this._version(), this._activeRelationshipCode(), this._consumptionCycles()),
  );

  /**
   * The wallet balance a benefit can draw on: its pool's available balance
   * when the policy assigns the benefit to a pool, otherwise the total wallet
   * balance. Cashless payments are capped at this, after co-payment and limit.
   */
  availableBalanceFor(category: BenefitCategory, relationshipCode?: string): number {
    const version = this._version();
    const relCode = (relationshipCode || this._activeRelationshipCode() || 'self').trim().toLowerCase();
    const rel = version ? (findRelationshipInVersion(version, relCode) ?? getPrimaryRelationship(version)) : undefined;
    const cat = rel?.categories?.find(
      (c) => toBenefitCategory(c.category_code) === category || toBenefitCategory(c.category_name) === category,
    );
    const poolCode = cat?.pool_code?.trim().toUpperCase();
    const pool = poolCode
      ? this.pools().find((p) => p.code?.trim().toUpperCase() === poolCode || p.id?.trim().toUpperCase() === poolCode)
      : undefined;
    return pool ? pool.available.amount : this.walletTotal().available.amount;
  }

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
  async load(patientId: string, force = false): Promise<void> {
    if (!patientId) return;
    if (!force && this.loadedPatientId === patientId) {
      return;
    }
    if (this._loading() && this.lastPatientId === patientId) {
      return;
    }
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

      let parsedAssignment: any = null;
      try {
        parsedAssignment = typeof assignmentRes === 'string' ? JSON.parse(assignmentRes) : assignmentRes;
      } catch {
        parsedAssignment = null;
      }
      const assignment: OpdPolicyMemberAssignmentDto | undefined = parsedAssignment?.resource?.[0];

      if (!assignment?.policy_version_id) {
        this.loadedPatientId = patientId;
        this._assignment.set(null);
        this._version.set(null);
        this._rawPools.set([]);
        this._consumptionCycles.set([]);
        this._policies.set([]);
        this._detail.set(null);
        this._walletAccount.set(null);
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
        this.loadedPatientId = patientId;
        void this.resolveAndLoadWallet();
      } else {
        this.loadedPatientId = patientId;
      }
    } catch (err: any) {
      this.loadedPatientId = patientId;
      this._error.set(appError('network', err?.message, err?.status ?? null));
      this._assignment.set(null);
      this._version.set(null);
      this._rawPools.set([]);
      this._consumptionCycles.set([]);
      this._policies.set([]);
      this._detail.set(null);
      this._walletAccount.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Synchronizes member UHID context from FamilyStore and triggers wallet resolution
   * based on the policy version's allocation_type (FLOATER vs INDIVIDUAL).
   */
  async syncMemberWalletContext(activeUhId: string | null, primaryUhId: string | null, forceRefresh: boolean = false): Promise<void> {
    const cleanActive = activeUhId?.trim() || null;
    const cleanPrimary = primaryUhId?.trim() || null;
    this._activeUhId.set(cleanActive);
    this._primaryUhId.set(cleanPrimary);
    await this.resolveAndLoadWallet(forceRefresh);
  }

  /**
   * Resolves the target UHID and fetches the live wallet account (/wallet/api/v1/wallet?queryId=GET_PAGE...).
   *
   * Target UHID resolution rules:
   * 1. FLOATER allocation: Pools at the primary member level (`_primaryUhId()`).
   * 2. INDIVIDUAL allocation: Targets the active selected member (`_activeUhId()`).
   * 3. Fallback: If family list omitted the primary member's UHID, uses `UserInfoStore.getUhid()` from GET_MY_CONFIG.
   */
  private async resolveAndLoadWallet(forceRefresh: boolean = false): Promise<void> {
    const version = this._version();
    const isFloater = (version?.allocation_type || '').trim().toUpperCase() === 'FLOATER';
    // Fallback dynamically to GET_MY_CONFIG UHID if family list did not supply it
    const configUhId = this.userStore.getUhid();
    const targetUhId = isFloater
      ? (this._primaryUhId() || this._activeUhId() || configUhId)
      : (this._activeUhId() || this._primaryUhId() || configUhId);

    if (!targetUhId) {
      this._walletAccount.set(null);
      return;
    }

    if (!forceRefresh && this._walletCache.has(targetUhId)) {
      this._walletAccount.set(this._walletCache.get(targetUhId)!);
      return;
    }

    try {
      const queryArgs = `queryId=GET_PAGE&filter=user_code%3A${encodeURIComponent(targetUhId)}%2Cstatus_id%3Aactive&page_no=0&page_size=0`;
      const walletRes: any = await new Promise((resolve) => {
        this.appService
          .getcall('wallet', 'wallet', queryArgs)
          .subscribe({
            next: (res: any) => resolve(res),
            error: (err: any) => {
              console.error('Failed to load wallet data for uhId:', targetUhId, err);
              resolve(null);
            },
          });
      });

      if (walletRes) {
        const parsed = typeof walletRes === 'string' ? JSON.parse(walletRes) : walletRes;
        const account: OpdWalletAccountDto | undefined = parsed?.resource?.[0];
        if (account) {
          this._walletCache.set(targetUhId, account);
          this._walletAccount.set(account);
          this.fetchWalletPassbook(targetUhId);
          return;
        }
      }
      this._walletAccount.set(null);
    } catch (e) {
      console.error('Error fetching wallet account:', e);
      this._walletAccount.set(null);
    }
  }

  /**
   * Fetches the member's wallet passbook history (/wallet/api/v1/wallet_passbook?queryId=GET_WALLET_PASSBOOK&args=user_code:...&page_no=...&page_size=...).
   * Resolves target UHID via Floater/Individual rules and falls back to GET_MY_CONFIG UHID via UserInfoStore.
   * Supports server-side pagination with initial 10 records and page-by-page navigation.
   */
  fetchWalletPassbook(
    uhId?: string | null,
    pageNo: number = 0,
    pageSize: number = 10,
    append: boolean = false,
  ): void {
    const version = this._version();
    const isFloater = (version?.allocation_type || '').trim().toUpperCase() === 'FLOATER';
    const activeMemberUhId = this._activeUhId();
    const primaryMemberUhId = this._primaryUhId();
    const walletAccountUserCode = this.walletAccount()?.user_code;
    const configUhId = this.userStore.getUhid();

    const targetUhId = uhId?.trim()
      || (isFloater ? (primaryMemberUhId || activeMemberUhId) : (activeMemberUhId || primaryMemberUhId))
      || walletAccountUserCode
      || configUhId;

    if (!targetUhId) {
      return;
    }

    this.lastPassbookUhId = targetUhId;

    if (append) {
      this._passbookLoadingMore.set(true);
    } else {
      this._passbookLoading.set(true);
      this._passbook.set([]);
      this._passbookPage.set(pageNo);
      this._passbookHasMore.set(true);
    }
    this._passbookError.set(null);

    const queryArgs = `queryId=GET_WALLET_PASSBOOK&args=user_code%3A${encodeURIComponent(targetUhId)}&page_no=${pageNo}&page_size=${pageSize}`;
    this.appService
      .getcall('wallet_passbook', 'wallet', queryArgs)
      .subscribe({
        next: (res: any) => {
          console.log(`[WalletPassbook] Response for user_code ${targetUhId} (page ${pageNo}):`, res);
          const parsed = typeof res === 'string' ? JSON.parse(res) : res;
          const items: WalletPassbookItemDto[] = parsed?.resource || parsed?.data || (Array.isArray(parsed) ? parsed : []);

          if (typeof parsed?.count === 'number') {
            this._passbookTotalCount.set(parsed.count);
          } else if (this._passbookTotalCount() === null && items.length < pageSize) {
            this._passbookTotalCount.set(pageNo * pageSize + items.length);
          }

          if (append) {
            this._passbook.update((prev) => {
              const existingIds = new Set(prev.map((i) => i.id).filter(Boolean));
              const newUnique = items.filter((i) => !i.id || !existingIds.has(i.id));
              return [...prev, ...newUnique];
            });
          } else {
            this._passbook.set(items);
          }

          this._passbookPage.set(pageNo);

          // Determine if more records exist on the server
          const totalFromApi = this._passbookTotalCount();
          let hasMore: boolean;
          if (items.length < pageSize) {
            hasMore = false;
          } else if (totalFromApi !== null && totalFromApi !== undefined) {
            hasMore = (pageNo + 1) * pageSize < totalFromApi;
          } else {
            hasMore = true;
          }
          this._passbookHasMore.set(hasMore);

          this._passbookLoading.set(false);
          this._passbookLoadingMore.set(false);
        },
        error: (err: any) => {
          console.error(`[WalletPassbook] Error for user_code ${targetUhId} (page ${pageNo}):`, err);
          this._passbookError.set(err?.message || 'Failed to load passbook');
          this._passbookLoading.set(false);
          this._passbookLoadingMore.set(false);
        },
      });
  }

  /**
   * Navigates to a specific page of wallet passbook records (0-indexed).
   */
  goToPassbookPage(pageNo: number, pageSize: number = 10): void {
    if (pageNo < 0 || this._passbookLoading() || this._passbookLoadingMore()) {
      return;
    }
    const total = this._passbookTotalCount();
    if (total !== null && total !== undefined) {
      const maxPages = Math.max(1, Math.ceil(total / pageSize));
      if (pageNo >= maxPages) return;
    }
    this.fetchWalletPassbook(this.lastPassbookUhId, pageNo, pageSize, false);
  }

  /**
   * Fetches the next page of wallet passbook records and appends them to the current list.
   */
  loadMoreWalletPassbook(pageSize: number = 10): void {
    if (this._passbookLoading() || this._passbookLoadingMore() || !this._passbookHasMore()) {
      return;
    }
    const nextPage = this._passbookPage() + 1;
    this.fetchWalletPassbook(this.lastPassbookUhId, nextPage, pageSize, true);
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
      void this.load(this.lastPatientId, true);
    }
  }

  private reset(): void {
    this.loadedId = null;
    this.lastPatientId = null;
    this.loadedPatientId = null;
    this._assignment.set(null);
    this._version.set(null);
    this._rawPools.set([]);
    this._consumptionCycles.set([]);
    this._policies.set([]);
    this._detail.set(null);
    this._activeRelationshipCode.set('self');
    this._error.set(null);
    this._walletAccount.set(null);
    this._walletCache.clear();
    this._activeUhId.set(null);
    this._primaryUhId.set(null);
  }
}
