import { Injectable, computed, inject, signal } from '@angular/core';

import { BenefitCategory, toBenefitCategory } from '../domain/codes';
import { FamilyStore } from '../family/family.store';
import { findRelationshipInVersion, getPrimaryRelationship } from './policy.mapper';
import { PolicyStore } from './policy.store';

/**
 * How a benefit can be used, as set in the policy configuration: cashless only
 * (book through the portal), claims only (pay the provider and file a
 * claim), or both.
 */
export type ClaimMode = 'cashless' | 'claims' | 'both';

/**
 * Fallback static modes when policy is not yet loaded.
 */
const STATIC_CLAIM_MODES: Readonly<Partial<Record<BenefitCategory, ClaimMode>>> = {
  [BenefitCategory.OnlineConsultation]: 'both',
  [BenefitCategory.InClinicConsultation]: 'both',
  [BenefitCategory.Pharmacy]: 'claims',
  [BenefitCategory.Pathology]: 'both',
  [BenefitCategory.Radiology]: 'both',
  [BenefitCategory.Dental]: 'both',
  [BenefitCategory.Vision]: 'both',
  [BenefitCategory.Vaccination]: 'both',
  [BenefitCategory.HealthPackages]: 'cashless',
};

const DEMO_KEY = 'opd.claimMode.demo';

@Injectable({ providedIn: 'root' })
export class ClaimModeStore {
  private readonly policyStore = inject(PolicyStore);
  private readonly family = inject(FamilyStore);

  /**
   * QA / DEMO override so any permitted mode can be tested manually.
   * Null means the live policy configuration applies.
   */
  readonly demoOverride = signal<ClaimMode | null>(readDemo());

  readonly isOverridden = computed(() => this.demoOverride() !== null);

  /**
   * Whether an active demo override is in effect for a specific category.
   * True only if override is set, allowed by the policy for this category,
   * and differs from the category's policy default.
   */
  isOverriddenFor(category: BenefitCategory): boolean {
    const override = this.demoOverride();
    if (!override) return false;
    const allowed = this.allowedModesFor(category);
    return allowed.includes(override) && override !== this.policyModeFor(category);
  }

  /**
   * Computes the live claim mode for a category from the active policy version:
   * - cashless: true, claims: true  → 'both'
   * - cashless: false, claims: true → 'claims'
   * - cashless: true, claims: false → 'cashless'
   */
  policyModeFor(category: BenefitCategory): ClaimMode {
    const version = this.policyStore.version();
    if (!version) return STATIC_CLAIM_MODES[category] ?? 'both';

    const activeMember = this.family.activeMember();
    const relCode = activeMember?.relationshipCode || (activeMember?.isPrimary ? 'self' : 'self');
    const rel = findRelationshipInVersion(version, relCode) ?? getPrimaryRelationship(version);
    if (!rel?.categories?.length) return STATIC_CLAIM_MODES[category] ?? 'both';

    const match = rel.categories.find(
      (c) => toBenefitCategory(c.category_code) === category,
    );
    if (!match) return STATIC_CLAIM_MODES[category] ?? 'both';

    const isCashless = match.cashless === true;
    const isClaims = match.claims === true;

    if (isCashless && isClaims) return 'both';
    if (isCashless && !isClaims) return 'cashless';
    if (!isCashless && isClaims) return 'claims';

    return STATIC_CLAIM_MODES[category] ?? 'both';
  }

  /**
   * Options provided by the policy for this category. User can only select from these:
   * - If policy provides 'both' (cashless + claims) → ['both', 'cashless', 'claims']
   * - If policy provides 'claims' only → ['claims']
   * - If policy provides 'cashless' only → ['cashless']
   */
  allowedModesFor(category: BenefitCategory): readonly ClaimMode[] {
    const base = this.policyModeFor(category);
    if (base === 'both') {
      return ['both', 'cashless', 'claims'];
    }
    return [base];
  }

  /**
   * The effective claim mode: returns demoOverride if manually set and permitted by the policy,
   * otherwise computes dynamically from the live policy version.
   */
  modeFor(category: BenefitCategory): ClaimMode {
    const policyMode = this.policyModeFor(category);
    const override = this.demoOverride();
    if (!override) return policyMode;

    // Only allow selecting an option that is provided by the policy
    const allowed = this.allowedModesFor(category);
    if (allowed.includes(override)) {
      return override;
    }
    return policyMode;
  }

  allowsCashless(category: BenefitCategory): boolean {
    return this.modeFor(category) !== 'claims';
  }

  allowsClaims(category: BenefitCategory): boolean {
    return this.modeFor(category) !== 'cashless';
  }

  setDemoOverride(mode: ClaimMode | null): void {
    this.demoOverride.set(mode);
    try {
      if (mode) localStorage.setItem(DEMO_KEY, mode);
      else localStorage.removeItem(DEMO_KEY);
    } catch {
      // Ignore; the override still holds for this session.
    }
  }

  resetOverride(): void {
    this.setDemoOverride(null);
  }
}

function readDemo(): ClaimMode | null {
  try {
    const v = localStorage.getItem(DEMO_KEY);
    return v === 'cashless' || v === 'claims' || v === 'both' ? v : null;
  } catch {
    return null;
  }
}
