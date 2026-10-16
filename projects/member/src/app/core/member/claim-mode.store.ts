import { Injectable, signal } from '@angular/core';

import { BenefitCategory } from '../domain/codes';

/**
 * How a benefit can be used, as set in the policy configuration: cashless only
 * (book through the portal), reimbursement only (pay the provider and file a
 * claim), or both.
 */
export type ClaimMode = 'cashless' | 'reimbursement' | 'both';

/**
 * DUMMY / STATIC policy configuration — the per-benefit claim mode is not yet
 * served by the API. Every benefit allows both until it is.
 *
 * TODO(API): read the mode per benefit from the policy configuration.
 */
const STATIC_CLAIM_MODES: Readonly<Partial<Record<BenefitCategory, ClaimMode>>> = {
  [BenefitCategory.OnlineConsultation]: 'both',
  [BenefitCategory.InClinicConsultation]: 'both',
  [BenefitCategory.Pharmacy]: 'both',
  [BenefitCategory.Pathology]: 'both',
  [BenefitCategory.Radiology]: 'both',
  [BenefitCategory.Dental]: 'both',
  [BenefitCategory.Vision]: 'both',
  [BenefitCategory.Vaccination]: 'both',
  [BenefitCategory.HealthPackages]: 'both',
};

const DEMO_KEY = 'opd.claimMode.demo';

@Injectable({ providedIn: 'root' })
export class ClaimModeStore {
  /**
   * DEMO — a policy-wide override so each case can be tried before the API
   * exists. Null means the configuration above applies.
   */
  readonly demoOverride = signal<ClaimMode | null>(readDemo());

  modeFor(category: BenefitCategory): ClaimMode {
    return this.demoOverride() ?? STATIC_CLAIM_MODES[category] ?? 'both';
  }

  allowsCashless(category: BenefitCategory): boolean {
    return this.modeFor(category) !== 'reimbursement';
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
}

function readDemo(): ClaimMode | null {
  try {
    const v = localStorage.getItem(DEMO_KEY);
    return v === 'cashless' || v === 'reimbursement' || v === 'both' ? v : null;
  } catch {
    return null;
  }
}
