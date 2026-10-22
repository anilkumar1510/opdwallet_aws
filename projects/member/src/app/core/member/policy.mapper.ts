import { BenefitCategory, toBenefitCategory } from '../domain/codes';
import { Money, formatMoney, money } from '../domain/money';
import { ClaimCategory } from '../claims/claim.mapper';
import { WalletCategoryBalance } from '../wallet/wallet.model';
import { Policy } from './policy';
import { PolicyClause, PolicyDetail } from './policy-detail';
import {
  OpdConsumptionCycleDto,
  OpdPolicyMemberAssignmentDto,
  OpdPolicyVersionDto,
  PolicyBenefitPoolDto,
  PolicyCategoryDto,
  PolicyRelationshipDto,
} from './policy.dto';
import { WalletPool, WalletPoolCategory } from './wallet-pool.model';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return 'No expiry';
  try {
    return DATE_FORMATTER.format(new Date(timestamp));
  } catch {
    return 'No expiry';
  }
}

export function getPrimaryRelationship(version: OpdPolicyVersionDto): PolicyRelationshipDto | undefined {
  return version.relationships.find((r) => r.is_primary === true) ?? version.relationships.find((r) => r.relationship_code?.toLowerCase() === 'self');
}

/**
 * Converts a category or additional claim category name into an uppercase slug code
 * (e.g. "AYUSH Consultation" -> "AYUSH_CONSULTATION", "Physiotherapy" -> "PHYSIOTHERAPY").
 */
export function toCategorySlug(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Resolves a relationship's benefits, inheriting categories and additional_claim_categories
 * from the primary relationship if benefit_set === 'INHERIT_FROM_PRIMARY'.
 */
export function resolveRelationshipBenefits(
  relationship: PolicyRelationshipDto,
  primaryRelationship: PolicyRelationshipDto | undefined,
): PolicyRelationshipDto {
  if (relationship.is_primary || relationship.benefit_set !== 'INHERIT_FROM_PRIMARY' || !primaryRelationship) {
    return relationship;
  }

  return {
    ...relationship,
    wallet_configuration: relationship.wallet_configuration ?? primaryRelationship.wallet_configuration,
    categories: relationship.categories?.length ? relationship.categories : primaryRelationship.categories,
    additional_claim_categories_enabled:
      relationship.additional_claim_categories_enabled ?? primaryRelationship.additional_claim_categories_enabled,
    additional_claim_categories:
      relationship.additional_claim_categories?.length
        ? relationship.additional_claim_categories
        : primaryRelationship.additional_claim_categories,
  };
}

/**
 * Finds and resolves the matching relationship in the policy version for a given relationship code.
 */
export function findRelationshipInVersion(
  version: OpdPolicyVersionDto | null | undefined,
  relationshipCode: string | undefined,
): PolicyRelationshipDto | undefined {
  if (!version?.relationships?.length) return undefined;
  const primary = getPrimaryRelationship(version);
  const code = (relationshipCode || 'self').trim().toLowerCase().replace(/[-_]/g, '');

  if (code === 'self') {
    return primary ?? version.relationships[0];
  }

  const match = version.relationships.find((r) => {
    const rCode = (r.relationship_code || '').trim().toLowerCase().replace(/[-_]/g, '');
    if (rCode === code) return true;
    if (code === 'child' && (rCode === 'son' || rCode === 'daughter' || rCode === 'child')) return true;
    if ((code === 'son' || code === 'daughter') && rCode === 'child') return true;
    if (code === 'spouse' && (rCode === 'husband' || rCode === 'wife' || rCode === 'spouse')) return true;
    if ((code === 'husband' || code === 'wife') && rCode === 'spouse') return true;
    return false;
  });

  if (!match) return undefined;
  return resolveRelationshipBenefits(match, primary);
}

/**
 * Builds combined claim categories from a relationship's standard categories
 * (filtered by claims: true) and its additional_claim_categories (mapped with uppercase slug codes).
 */
export function toCombinedClaimCategories(relationship: PolicyRelationshipDto | undefined): ClaimCategory[] {
  if (!relationship) return [];

  const standardCategories: ClaimCategory[] = (relationship.categories ?? [])
    .filter((c) => c.claims === true)
    .map((c) => ({
      id: c.category_code,
      name: c.category_name,
      claimCategory: c.category_code,
      perClaimLimit: c.per_claim_limit ?? 0,
      copayMode: (c.co_payment_mode === 'PERCENT' ? 'PERCENT' : c.co_payment_mode === 'FLAT' ? 'FLAT' : null) as
        | 'PERCENT'
        | 'FLAT'
        | null,
      copayValue: c.co_payment_value ?? null,
      perTransactionLimit: c.per_transaction_limit ?? null,
      isPlaceholder: false,
    }));

  const additionalCategories: ClaimCategory[] = (relationship.additional_claim_categories ?? []).map((add) => {
    const slug = toCategorySlug(add.claim_category_name);
    return {
      id: slug,
      name: add.claim_category_name,
      claimCategory: slug,
      perClaimLimit: add.claim_per_claim_limit ?? 0,
      copayMode: null,
      copayValue: null,
      perTransactionLimit: null,
      isPlaceholder: false,
    };
  });

  // De-duplicate by claimCategory to avoid duplicate codes
  const seen = new Set<string>();
  const combined: ClaimCategory[] = [];
  for (const cat of [...standardCategories, ...additionalCategories]) {
    if (!seen.has(cat.claimCategory)) {
      seen.add(cat.claimCategory);
      combined.push(cat);
    }
  }

  return combined;
}

/**
 * Determines whether a relationship type is allowed/covered under this policy version.
 */
export function isRelationshipCoveredInPolicy(
  relationshipCode: string | undefined,
  version: OpdPolicyVersionDto | null | undefined,
): boolean {
  if (!version?.relationships?.length) return false;

  const code = (relationshipCode || 'self').trim().toLowerCase().replace(/[-_]/g, '');

  const match = version.relationships.find((r) => {
    const rCode = (r.relationship_code || '').trim().toLowerCase().replace(/[-_]/g, '');
    if (rCode === code) return true;

    // Cross-aliases: 'child' matches 'son', 'daughter', 'child'
    if (code === 'child' && (rCode === 'son' || rCode === 'daughter' || rCode === 'child')) return true;
    if ((code === 'son' || code === 'daughter') && rCode === 'child') return true;

    // Cross-aliases: 'spouse' matches 'husband', 'wife', 'spouse'
    if (code === 'spouse' && (rCode === 'husband' || rCode === 'wife' || rCode === 'spouse')) return true;
    if ((code === 'husband' || code === 'wife') && rCode === 'spouse') return true;

    return false;
  });

  if (!match) return false;
  return match.covered !== false;
}

export function toPolicyFromVersion(
  assignment: OpdPolicyMemberAssignmentDto | null | undefined,
  version: OpdPolicyVersionDto,
  holderId: string,
  holderName: string,
): Policy {
  const fromMs = assignment?.effective_from ?? version.effective_from;
  const toMs = assignment?.effective_to ?? version.effective_to;

  return {
    id: version.id || version.policy_id,
    holderId,
    holderName,
    policyNumber: version.policy_number,
    corporate: 'HCL Healthcare',
    validFrom: fromMs ? new Date(fromMs) : null,
    validTill: toMs ? new Date(toMs) : null,
  };
}

export function toPolicyDetailFromVersion(version: OpdPolicyVersionDto): PolicyDetail {
  const primary = getPrimaryRelationship(version);
  const annualLimit = primary?.wallet_configuration?.annual_limit ?? 26000;
  const copayVal = primary?.wallet_configuration?.copay_value;
  const copayType = primary?.wallet_configuration?.copay_type;
  const copayText = copayVal && copayVal > 0
    ? `${copayVal}${copayType === 'PERCENT' ? '%' : ''} co-payment`
    : 'No Co-payment';

  const coveredMembersText = Array.from(
    new Set(
      version.relationships
        .filter((r) => r.is_primary || r.covered !== false)
        .map((r) => r.relationship_name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ).join('+ ');

  const inclusions: PolicyClause[] = (version.inclusions ?? []).map((inc) => ({
    headline: inc.headline?.trim() || 'Covered Benefit',
    description: inc.description?.trim() || null,
  }));

  const exclusions: PolicyClause[] = (version.exclusions ?? []).map((exc) => ({
    headline: exc.headline?.trim() || 'Exclusion',
    description: exc.description?.trim() || null,
  }));

  return {
    policyNumber: version.policy_number,
    policyName: version.policy_name,
    corporateName: 'HCL Healthcare',
    validTill: formatTimestamp(version.effective_to),
    sumInsured: `${formatMoney(money(annualLimit))} (Floater)`,
    copay: copayText,
    membersCovered: coveredMembersText || 'Self + Dependants',
    claimWindow: `File within ${version.claim_expiry ?? 45} days of treatment`,
    inclusions,
    exclusions,
  };
}

export interface CategoryConsumptionSummary {
  readonly byBenefitCategory: ReadonlyMap<BenefitCategory, number>;
  readonly byRawCode: ReadonlyMap<string, number>;
  readonly totalConsumed: number;
}

/**
 * Consolidates category consumption from `opd_consumption_cycle` records.
 * Multiple consumption events for the same category are summed together.
 */
export function consolidateCategoryConsumption(
  cycles: readonly OpdConsumptionCycleDto[] | null | undefined,
): CategoryConsumptionSummary {
  const byBenefitCategory = new Map<BenefitCategory, number>();
  const byRawCode = new Map<string, number>();
  let totalConsumed = 0;

  if (!cycles?.length) {
    return { byBenefitCategory, byRawCode, totalConsumed: 0 };
  }

  for (const cycle of cycles) {
    const status = (cycle.to_status || '').trim().toUpperCase();
    if (status !== 'CONSUMED') {
      continue;
    }

    const rawCode = (cycle.category_code || '').trim().toUpperCase();
    const amount = Number(cycle.delta_amount ?? cycle.covered_amount ?? 0);
    if (!rawCode || isNaN(amount) || amount <= 0) continue;

    totalConsumed += amount;

    // Consolidate multiple consumption amounts under the raw category code
    const currentRaw = byRawCode.get(rawCode) ?? 0;
    byRawCode.set(rawCode, currentRaw + amount);

    // Also consolidate under standard BenefitCategory
    const benCat = toBenefitCategory(rawCode);
    if (benCat !== BenefitCategory.Unknown) {
      const currentBen = byBenefitCategory.get(benCat) ?? 0;
      byBenefitCategory.set(benCat, currentBen + amount);
    }
  }

  return { byBenefitCategory, byRawCode, totalConsumed };
}

export function getCategoryConsumedAmount(
  categoryCode: string | undefined,
  categoryName: string | undefined,
  summary: CategoryConsumptionSummary,
): number {
  const rawCode = (categoryCode || '').trim().toUpperCase();
  if (rawCode && summary.byRawCode.has(rawCode)) {
    return summary.byRawCode.get(rawCode)!;
  }
  const benCatFromCode = toBenefitCategory(categoryCode);
  if (benCatFromCode !== BenefitCategory.Unknown && summary.byBenefitCategory.has(benCatFromCode)) {
    return summary.byBenefitCategory.get(benCatFromCode)!;
  }
  const benCatFromName = toBenefitCategory(categoryName);
  if (benCatFromName !== BenefitCategory.Unknown && summary.byBenefitCategory.has(benCatFromName)) {
    return summary.byBenefitCategory.get(benCatFromName)!;
  }
  return 0;
}

export function toWalletTotalFromVersion(
  version: OpdPolicyVersionDto | null | undefined,
  relationshipCode: string = 'self',
  consumption?: readonly OpdConsumptionCycleDto[] | null,
): {
  available: Money;
  allocated: Money;
  consumed: Money;
} {
  if (!version || !isRelationshipCoveredInPolicy(relationshipCode, version)) {
    return {
      available: money(0),
      allocated: money(0),
      consumed: money(0),
    };
  }

  const primary = getPrimaryRelationship(version);
  const rel = findRelationshipInVersion(version, relationshipCode);
  const limit = rel?.wallet_configuration?.annual_limit ?? primary?.wallet_configuration?.annual_limit ?? 26000;
  const summary = consolidateCategoryConsumption(consumption);
  const totalConsumed = summary.totalConsumed;
  const available = Math.max(0, limit - totalConsumed);

  return {
    available: money(available),
    allocated: money(limit),
    consumed: money(totalConsumed),
  };
}

export function toCategoriesFromVersion(
  version: OpdPolicyVersionDto | null | undefined,
  relationshipCode: string = 'self',
  consumption?: readonly OpdConsumptionCycleDto[] | null,
): readonly WalletCategoryBalance[] {
  if (!version || !isRelationshipCoveredInPolicy(relationshipCode, version)) {
    return [];
  }

  const primary = getPrimaryRelationship(version);
  const rel = findRelationshipInVersion(version, relationshipCode) ?? primary;
  const annualLimit = rel?.wallet_configuration?.annual_limit ?? primary?.wallet_configuration?.annual_limit ?? 26000;
  const rawCategories = rel?.categories ?? primary?.categories ?? [];
  const summary = consolidateCategoryConsumption(consumption);

  return rawCategories.map((cat) => {
    const subLimit = cat.per_claim_limit && cat.per_claim_limit > 0 ? cat.per_claim_limit : annualLimit;
    const consumedAmount = getCategoryConsumedAmount(cat.category_code, cat.category_name, summary);
    const availableAmount = Math.max(0, subLimit - consumedAmount);

    return {
      category: toBenefitCategory(cat.category_code),
      code: cat.category_code,
      label: cat.category_name,
      allocated: money(subLimit),
      available: money(availableAmount),
      consumed: money(consumedAmount),
      isUnlimited: false,
      isExhausted: availableAmount === 0 && subLimit > 0,
      annualLimit: money(annualLimit),
      perClaimLimit: cat.per_claim_limit ? money(cat.per_claim_limit) : null,
      cashless: cat.cashless === true,
      claims: cat.claims === true,
    };
  });
}

export function toPoolsFromVersion(
  version: OpdPolicyVersionDto | null | undefined,
  relationshipCode: string = 'self',
  consumption?: readonly OpdConsumptionCycleDto[] | null,
): readonly WalletPool[] {
  if (!version || !isRelationshipCoveredInPolicy(relationshipCode, version)) {
    return [];
  }

  const summary = consolidateCategoryConsumption(consumption);
  const primary = getPrimaryRelationship(version);
  const rel = findRelationshipInVersion(version, relationshipCode) ?? primary;
  const annualLimit = rel?.wallet_configuration?.annual_limit ?? primary?.wallet_configuration?.annual_limit ?? 26000;
  const rawCategories = rel?.categories ?? primary?.categories ?? [];
  const additionalCategories = rel?.additional_claim_categories ?? primary?.additional_claim_categories ?? [];

  // Group by pool_code
  const poolMap = new Map<string, { name: string; categories: WalletPoolCategory[]; poolConsumed: number }>();

  for (const cat of rawCategories) {
    const code = cat.pool_code || 'DEFAULT_POOL';
    const entry = poolMap.get(code) ?? {
      name: cat.pool_name || cat.category_name,
      categories: [],
      poolConsumed: 0,
    };
    const catConsumed = getCategoryConsumedAmount(cat.category_code, cat.category_name, summary);
    entry.poolConsumed += catConsumed;
    entry.categories.push({
      label: cat.category_name,
      used: money(catConsumed),
    });
    poolMap.set(code, entry);
  }

  for (const add of additionalCategories) {
    const code = add.claim_pool_code || 'DEFAULT_POOL';
    const entry = poolMap.get(code);
    if (entry) {
      const catConsumed = getCategoryConsumedAmount(undefined, add.claim_category_name, summary);
      entry.poolConsumed += catConsumed;
      entry.categories.push({
        label: add.claim_category_name,
        used: money(catConsumed),
      });
    }
  }

  const pools: WalletPool[] = [];
  const sortedCodes = Array.from(poolMap.keys()).sort((a, b) => a.localeCompare(b));
  for (const poolCode of sortedCodes) {
    const data = poolMap.get(poolCode)!;
    const availableAmount = Math.max(0, annualLimit - data.poolConsumed);
    pools.push({
      id: poolCode,
      code: poolCode,
      available: money(availableAmount),
      allocated: money(annualLimit),
      consumed: money(data.poolConsumed),
      description: data.name,
      categories: data.categories,
    });
  }

  return pools;
}

/**
 * Builds wallet pools from the live opd_benefit_category_pool API and maps
 * categories defined in the policy version under each pool, sorted ascending by pool code.
 * Calculates pool-level consumption by consolidating multiple consumption cycles for each category.
 */
export function toPoolsFromApiAndVersion(
  poolsDto: readonly PolicyBenefitPoolDto[] | null | undefined,
  version: OpdPolicyVersionDto | null | undefined,
  relationshipCode: string = 'self',
  consumption?: readonly OpdConsumptionCycleDto[] | null,
): readonly WalletPool[] {
  if (!version || !isRelationshipCoveredInPolicy(relationshipCode, version)) {
    return [];
  }

  if (!poolsDto || poolsDto.length === 0) {
    return toPoolsFromVersion(version, relationshipCode, consumption);
  }

  const summary = consolidateCategoryConsumption(consumption);
  const primary = getPrimaryRelationship(version);
  const rel = findRelationshipInVersion(version, relationshipCode) ?? primary;
  const rawCategories = rel?.categories ?? primary?.categories ?? [];
  const additionalCategories = rel?.additional_claim_categories ?? primary?.additional_claim_categories ?? [];

  // Sort pools ascending by code (POOL-0004, POOL-0005, POOL-0006)
  const sorted = [...poolsDto].sort((a, b) => (a.code || '').localeCompare(b.code || ''));

  return sorted.map((pool) => {
    const matchingCategories: WalletPoolCategory[] = [];
    let poolConsumedAmount = 0;

    for (const cat of rawCategories) {
      if (cat.pool_code === pool.code) {
        const catConsumed = getCategoryConsumedAmount(cat.category_code, cat.category_name, summary);
        poolConsumedAmount += catConsumed;
        matchingCategories.push({
          label: cat.category_name,
          used: money(catConsumed),
        });
      }
    }

    for (const add of additionalCategories) {
      if (add.claim_pool_code === pool.code) {
        const catConsumed = getCategoryConsumedAmount(undefined, add.claim_category_name, summary);
        poolConsumedAmount += catConsumed;
        matchingCategories.push({
          label: add.claim_category_name,
          used: money(catConsumed),
        });
      }
    }

    const availableAmount = Math.max(0, pool.annual_limit - poolConsumedAmount);

    return {
      id: pool.code,
      code: pool.code,
      available: money(availableAmount),
      allocated: money(pool.annual_limit),
      consumed: money(poolConsumedAmount),
      description: pool.pool_name,
      categories: matchingCategories,
    };
  });
}
