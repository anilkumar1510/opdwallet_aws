import { BenefitCategory, toBenefitCategory } from '../domain/codes';

/**
 * Co-payment % and per-transaction limit per category, used to compute the
 * Review-step breakdown so the member sees the money rules before submitting.
 *
 * PLACEHOLDER VALUES — these are NOT the member's real policy terms. There is no
 * claims cover-check / policy-config endpoint yet (see PLACEHOLDER-APIS.md), so
 * these stand in to make the calculation live. Every screen that shows them
 * labels them "placeholder". Replace `claimRulesFor` with the API response when
 * `POST member/claims/estimate` exists.
 */

export interface ClaimRules {
  /** Member's share, as a percentage of the eligible amount. */
  readonly copayPercent: number;
  /** Cap on a single transaction/bill. 0 = no per-transaction cap. */
  readonly perTransactionLimit: number;
}

const PLACEHOLDER_RULES: Partial<Record<BenefitCategory, ClaimRules>> = {
  [BenefitCategory.InClinicConsultation]: { copayPercent: 10, perTransactionLimit: 1500 },
  [BenefitCategory.OnlineConsultation]: { copayPercent: 10, perTransactionLimit: 1000 },
  [BenefitCategory.Pharmacy]: { copayPercent: 20, perTransactionLimit: 2000 },
  [BenefitCategory.Pathology]: { copayPercent: 10, perTransactionLimit: 3000 },
  [BenefitCategory.Radiology]: { copayPercent: 10, perTransactionLimit: 5000 },
  [BenefitCategory.Vision]: { copayPercent: 20, perTransactionLimit: 5000 },
  [BenefitCategory.Dental]: { copayPercent: 20, perTransactionLimit: 5000 },
  [BenefitCategory.Vaccination]: { copayPercent: 0, perTransactionLimit: 2000 },
};

const DEFAULT_RULES: ClaimRules = { copayPercent: 10, perTransactionLimit: 0 };

export function claimRulesFor(categoryCode: string | null | undefined): ClaimRules {
  return PLACEHOLDER_RULES[toBenefitCategory(categoryCode)] ?? DEFAULT_RULES;
}
