import { Injectable, computed, inject } from '@angular/core';

import { PolicyStore } from './policy.store';

/**
 * What a reimbursement claim needs, as set in the policy configuration:
 * digital documents only, or digital plus the original (physical) copies
 * posted to the claims department.
 */
export type ClaimDocsRequirement = 'digital' | 'digital_physical';

/** Where originals are posted, and how long the member has to send them. */
export const ORIGINALS_ADDRESS = {
  to: 'HCL Healthcare – OPD Claims Department',
  lines: ['1st Floor, A-5, Sector-24', 'Noida, Uttar Pradesh 201301, India'],
  phone: '+91-120-4928550',
} as const;
export const ORIGINALS_DAYS = 45;

@Injectable({ providedIn: 'root' })
export class ClaimDocsStore {
  private readonly policyStore = inject(PolicyStore);

  /**
   * Evaluates dynamically against the active policy version's claim_type.
   * If claim_type === 'DIGITAL_PHYSICAL', original physical copies are required.
   */
  readonly needsOriginals = computed<boolean>(() => {
    return this.policyStore.isDigitalPhysicalClaim();
  });

  requirement(): ClaimDocsRequirement {
    return this.needsOriginals() ? 'digital_physical' : 'digital';
  }
}
