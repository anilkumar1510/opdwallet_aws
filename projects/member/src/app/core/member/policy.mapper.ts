import { toBenefitCategory } from '../domain/codes';
import { Money, formatMoney, money } from '../domain/money';
import { WalletCategoryBalance } from '../wallet/wallet.model';
import { Policy } from './policy';
import { PolicyClause, PolicyDetail } from './policy-detail';
import {
  OpdPolicyMemberAssignmentDto,
  OpdPolicyVersionDto,
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
  return version.relationships.find((r) => r.is_primary || r.relationship_code?.toLowerCase() === 'self');
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

export function toWalletTotalFromVersion(version: OpdPolicyVersionDto): {
  available: Money;
  allocated: Money;
} {
  const primary = getPrimaryRelationship(version);
  const limit = primary?.wallet_configuration?.annual_limit ?? 26000;
  return {
    available: money(limit),
    allocated: money(limit),
  };
}

export function toCategoriesFromVersion(version: OpdPolicyVersionDto): readonly WalletCategoryBalance[] {
  const primary = getPrimaryRelationship(version);
  const annualLimit = primary?.wallet_configuration?.annual_limit ?? 26000;
  const rawCategories = primary?.categories ?? [];

  return rawCategories.map((cat) => {
    const subLimit = cat.per_claim_limit && cat.per_claim_limit > 0 ? cat.per_claim_limit : annualLimit;
    return {
      category: toBenefitCategory(cat.category_code),
      code: cat.category_code,
      label: cat.category_name,
      allocated: money(subLimit),
      available: money(subLimit),
      consumed: money(0),
      isUnlimited: false,
      isExhausted: false,
      annualLimit: money(annualLimit),
      perClaimLimit: cat.per_claim_limit ? money(cat.per_claim_limit) : null,
    };
  });
}

export function toPoolsFromVersion(version: OpdPolicyVersionDto): readonly WalletPool[] {
  const primary = getPrimaryRelationship(version);
  const annualLimit = primary?.wallet_configuration?.annual_limit ?? 26000;
  const rawCategories = primary?.categories ?? [];
  const additionalCategories = primary?.additional_claim_categories ?? [];

  // Group by pool_code
  const poolMap = new Map<string, { name: string; categories: WalletPoolCategory[] }>();

  for (const cat of rawCategories) {
    const code = cat.pool_code || 'DEFAULT_POOL';
    const entry = poolMap.get(code) ?? {
      name: cat.pool_name || cat.category_name,
      categories: [],
    };
    entry.categories.push({
      label: cat.category_name,
      used: money(0),
    });
    poolMap.set(code, entry);
  }

  for (const add of additionalCategories) {
    const code = add.claim_pool_code || 'DEFAULT_POOL';
    const entry = poolMap.get(code);
    if (entry) {
      entry.categories.push({
        label: add.claim_category_name,
        used: money(0),
      });
    }
  }

  const pools: WalletPool[] = [];
  for (const [poolCode, data] of poolMap.entries()) {
    pools.push({
      id: poolCode,
      available: money(annualLimit),
      allocated: money(annualLimit),
      description: data.name,
      categories: data.categories,
    });
  }

  return pools;
}
