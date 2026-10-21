import { Injectable, signal } from '@angular/core';

/**
 * What a reimbursement claim needs, as set in the policy configuration:
 * digital documents only, or digital plus the original (physical) copies
 * posted to the claims department.
 */
export type ClaimDocsRequirement = 'digital' | 'digital_physical';

/**
 * DUMMY / STATIC policy configuration — the claim-documents flag is not yet
 * served by the API. Digital only (no change to the UI) until it is.
 *
 * TODO(API): read the flag from the policy configuration.
 */
const STATIC_CLAIM_DOCS: ClaimDocsRequirement = 'digital';

/** Where originals are posted, and how long the member has to send them. */
export const ORIGINALS_ADDRESS = {
  to: 'HCL Healthcare – OPD Claims Department',
  lines: ['1st Floor, A-5, Sector-24', 'Noida, Uttar Pradesh 201301, India'],
  phone: '+91-120-4928550',
} as const;
export const ORIGINALS_DAYS = 45;

const DEMO_KEY = 'opd.claimDocs.demo';

@Injectable({ providedIn: 'root' })
export class ClaimDocsStore {
  /** DEMO — overrides the configuration so each case can be tried. */
  readonly demoOverride = signal<ClaimDocsRequirement | null>(readDemo());

  requirement(): ClaimDocsRequirement {
    return this.demoOverride() ?? STATIC_CLAIM_DOCS;
  }

  needsOriginals(): boolean {
    return this.requirement() === 'digital_physical';
  }

  setDemoOverride(value: ClaimDocsRequirement | null): void {
    this.demoOverride.set(value);
    try {
      if (value) localStorage.setItem(DEMO_KEY, value);
      else localStorage.removeItem(DEMO_KEY);
    } catch {
      // Ignore; the override still holds for this session.
    }
  }
}

function readDemo(): ClaimDocsRequirement | null {
  try {
    const v = localStorage.getItem(DEMO_KEY);
    return v === 'digital' || v === 'digital_physical' ? v : null;
  } catch {
    return null;
  }
}
