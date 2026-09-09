import { toBenefitCategory } from '../domain/codes';
import { money } from '../domain/money';
import { WalletCategoryBalance } from '../wallet/wallet.model';
import { Policy } from './policy';
import { PolicyDetail } from './policy-detail';

/**
 * DUMMY / STATIC policy data — zero backend.
 *
 * The policy card (home) and the policy details page are served from here
 * instead of `member/profile` assignments and `GET policies/:id/current`. Values
 * are the real ones for POL-2026-0008 (Shivam Jha + Sayani Kumari), kept truthful
 * so the screens read correctly. Replace with live data when the backend returns.
 */

/** Both members share one policy; the route id is the real policy id. */
const POLICY_ID = '6a34ca5c4e45325c5a7c06e7';

/**
 * Home "Health Benefits" cards — DUMMY / STATIC, no wallet API.
 *
 * Nine benefits, each with the same construct: ₹5,000 annual sub-limit,
 * ₹500 per-claim limit, ₹400 per-service (transaction) limit. The card shows
 * only the label and the remaining/annual amount; the per-claim/per-service
 * limits surface on the policy details page.
 */
const ANNUAL = 5000;
const PER_CLAIM = 500;

function benefit(code: string, label: string): WalletCategoryBalance {
  return {
    category: toBenefitCategory(code),
    code,
    label,
    allocated: money(ANNUAL),
    available: money(ANNUAL),
    consumed: money(0),
    isUnlimited: false,
    isExhausted: false,
    annualLimit: money(ANNUAL),
    perClaimLimit: money(PER_CLAIM),
  };
}

/**
 * Home "Total Available Balance" card — DUMMY / STATIC, no wallet API.
 * A single ₹40,000 benefit wallet, shown in full (nothing consumed).
 */
export const STATIC_WALLET_TOTAL = {
  available: money(40000),
  allocated: money(40000),
};

/** In the exact order requested. */
export const STATIC_BENEFITS: readonly WalletCategoryBalance[] = [
  benefit('CAT005', 'Online Consultation'),
  benefit('CAT001', 'In-Clinic Consultation'),
  benefit('CAT007', 'Vision'),
  benefit('CAT006', 'Dental'),
  benefit('CAT002', 'Pharmacy'),
  benefit('CAT009', 'Vaccination'),
  benefit('CAT004', 'Pathology'),
  benefit('CAT003', 'Radiology & Cardiology'),
  benefit('CAT008', 'Annual Health Check'),
];

/** Home "Your Policies" carousel — one card per covered member. */
export const STATIC_POLICIES: readonly Policy[] = [
  {
    id: POLICY_ID,
    holderId: 'shivam',
    holderName: 'Shivam Jha',
    policyNumber: 'POL-2026-0008',
    corporate: 'PwC',
    validFrom: new Date('2026-07-01'),
    validTill: new Date('2027-06-30'),
  },
  {
    id: POLICY_ID,
    holderId: 'sayani',
    holderName: 'Sayani Kumari',
    policyNumber: 'POL-2026-0008',
    corporate: 'PwC',
    validFrom: new Date('2026-07-01'),
    validTill: new Date('2027-06-30'),
  },
];

/** Policy details page — the same policy for either card. */
export const STATIC_POLICY_DETAIL: PolicyDetail = {
  policyNumber: 'POL-2026-0008',
  policyName: 'HCL Healthcare OPD Plan 2026-27',
  corporateName: 'PwC',
  validTill: '30 Jun 2027',
  sumInsured: '₹5,000 per benefit, per year',
  copay: '20% on every claim',
  membersCovered: 'Self + Spouse',
  claimWindow: 'File within 45 days of treatment',
  inclusions: [
    { headline: 'Online Consultation', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'In-Clinic Consultation', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'Vision', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'Dental', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'Pharmacy', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'Vaccination', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'Pathology', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'Radiology & Cardiology', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
    { headline: 'Annual Health Check', description: '₹5,000 a year · up to ₹500 per claim · ₹400 per service' },
  ],
  exclusions: [
    { headline: 'Cosmetic procedures', description: 'Not admissible under the OPD policy' },
    { headline: 'Infertility treatment', description: 'Not covered' },
    { headline: 'Inpatient & pre/post hospitalisation', description: 'Covered under your inpatient policy, not OPD' },
    { headline: 'Non-medical expenses', description: 'Registration, administrative and consumable charges' },
  ],
};
