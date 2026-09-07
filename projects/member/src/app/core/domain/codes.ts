/**
 * Code translation lives here and nowhere else. The API sends coded values
 * (REL003, CAT002); no component ever receives one.
 *
 * Unknown codes degrade to a neutral label rather than throwing or rendering
 * the raw code. An API adding a relationship or category must not be able to
 * blank a member's screen.
 *
 * Const objects rather than `enum`: they erase cleanly under type-stripping,
 * so this module stays runnable outside the Angular build (see codes.check.ts).
 */

export const Relationship = {
  Self: 'SELF',
  Spouse: 'SPOUSE',
  Son: 'SON',
  Daughter: 'DAUGHTER',
  Father: 'FATHER',
  Mother: 'MOTHER',
  Brother: 'BROTHER',
  Sister: 'SISTER',
  FatherInLaw: 'FATHER_IN_LAW',
  MotherInLaw: 'MOTHER_IN_LAW',
  Unknown: 'UNKNOWN',
} as const;

export type Relationship = (typeof Relationship)[keyof typeof Relationship];

const RELATIONSHIP_BY_CODE: ReadonlyMap<string, Relationship> = new Map([
  ['REL001', Relationship.Self],
  ['SELF', Relationship.Self],
  ['REL002', Relationship.Spouse],
  ['SPOUSE', Relationship.Spouse],
  ['REL003', Relationship.Son],
  ['SON', Relationship.Son],
  ['REL004', Relationship.Daughter],
  ['DAUGHTER', Relationship.Daughter],
  ['REL005', Relationship.Father],
  ['FATHER', Relationship.Father],
  ['REL006', Relationship.Mother],
  ['MOTHER', Relationship.Mother],
  ['REL007', Relationship.Brother],
  ['BROTHER', Relationship.Brother],
  ['REL008', Relationship.Sister],
  ['SISTER', Relationship.Sister],
  ['REL009', Relationship.FatherInLaw],
  ['FATHER_IN_LAW', Relationship.FatherInLaw],
  ['REL010', Relationship.MotherInLaw],
  ['MOTHER_IN_LAW', Relationship.MotherInLaw],
]);

const RELATIONSHIP_LABELS: Readonly<Record<Relationship, string>> = {
  [Relationship.Self]: 'Self',
  [Relationship.Spouse]: 'Spouse',
  [Relationship.Son]: 'Son',
  [Relationship.Daughter]: 'Daughter',
  [Relationship.Father]: 'Father',
  [Relationship.Mother]: 'Mother',
  [Relationship.Brother]: 'Brother',
  [Relationship.Sister]: 'Sister',
  [Relationship.FatherInLaw]: 'Father-in-law',
  [Relationship.MotherInLaw]: 'Mother-in-law',
  // Neutral and member-safe. Never the raw code.
  [Relationship.Unknown]: 'Family member',
};

export function toRelationship(code: string | null | undefined): Relationship {
  if (!code) return Relationship.Unknown;
  return RELATIONSHIP_BY_CODE.get(code.trim().toUpperCase()) ?? Relationship.Unknown;
}

export function relationshipLabel(relationship: Relationship): string {
  return RELATIONSHIP_LABELS[relationship];
}

/** The primary member is the one the policy is issued to. */
export function isPrimary(relationship: Relationship): boolean {
  return relationship === Relationship.Self;
}

/**
 * Codes verified against the `category_master` collection, NOT against
 * web-member/lib/utils/mappers.ts — that file is stale and disagrees from
 * CAT004 onwards (it has CAT004=Dental, CAT005=Vision, CAT006=Dental&Vision,
 * CAT007=Wellness and no CAT008/CAT009). Real bookings confirm the master:
 * a dental service carries CAT006 and a vision service carries CAT007.
 */
export const BenefitCategory = {
  InClinicConsultation: 'IN_CLINIC_CONSULTATION',
  Pharmacy: 'PHARMACY',
  Radiology: 'RADIOLOGY',
  Pathology: 'PATHOLOGY',
  OnlineConsultation: 'ONLINE_CONSULTATION',
  Dental: 'DENTAL',
  Vision: 'VISION',
  HealthPackages: 'HEALTH_PACKAGES',
  Vaccination: 'VACCINATION',
  Unknown: 'UNKNOWN',
} as const;

export type BenefitCategory = (typeof BenefitCategory)[keyof typeof BenefitCategory];

const CATEGORY_BY_CODE: ReadonlyMap<string, BenefitCategory> = new Map([
  ['CAT001', BenefitCategory.InClinicConsultation],
  ['IN_CLINIC_CONSULTATION', BenefitCategory.InClinicConsultation],
  ['CONSULTATION', BenefitCategory.InClinicConsultation],
  ['CAT002', BenefitCategory.Pharmacy],
  ['PHARMACY', BenefitCategory.Pharmacy],
  ['CAT003', BenefitCategory.Radiology],
  ['RADIOLOGY', BenefitCategory.Radiology],
  ['DIAGNOSTICS', BenefitCategory.Radiology],
  // The claims API (memberclaims REVERSE_CATEGORY_MAP) labels CAT003
  // DIAGNOSTIC_SERVICES and CAT004 LABORATORY_SERVICES; without these two the
  // real categories resolve to Unknown, so their document/location rules fall
  // back to the default and the category dropdown shows a duplicate placeholder.
  ['DIAGNOSTIC_SERVICES', BenefitCategory.Radiology],
  ['CAT004', BenefitCategory.Pathology],
  ['PATHOLOGY', BenefitCategory.Pathology],
  ['LAB', BenefitCategory.Pathology],
  ['LABORATORY_SERVICES', BenefitCategory.Pathology],
  ['CAT005', BenefitCategory.OnlineConsultation],
  ['ONLINE_CONSULTATION', BenefitCategory.OnlineConsultation],
  ['CAT006', BenefitCategory.Dental],
  ['DENTAL', BenefitCategory.Dental],
  ['DENTAL_SERVICES', BenefitCategory.Dental],
  ['CAT007', BenefitCategory.Vision],
  ['VISION', BenefitCategory.Vision],
  ['VISION_CARE', BenefitCategory.Vision],
  ['CAT008', BenefitCategory.HealthPackages],
  ['HEALTH_PACKAGES', BenefitCategory.HealthPackages],
  ['WELLNESS', BenefitCategory.HealthPackages],
  ['WELLNESS_PROGRAMS', BenefitCategory.HealthPackages],
  ['CAT009', BenefitCategory.Vaccination],
  ['VACCINATION', BenefitCategory.Vaccination],
]);

const CATEGORY_LABELS: Readonly<Record<BenefitCategory, string>> = {
  [BenefitCategory.InClinicConsultation]: 'In-Clinic Consultation',
  [BenefitCategory.Pharmacy]: 'Pharmacy',
  [BenefitCategory.Radiology]: 'Radiology & Cardiology',
  [BenefitCategory.Pathology]: 'Pathology (Labs)',
  [BenefitCategory.OnlineConsultation]: 'Online Consultation',
  [BenefitCategory.Dental]: 'Dental Services',
  [BenefitCategory.Vision]: 'Vision Care',
  [BenefitCategory.HealthPackages]: 'Health Packages',
  [BenefitCategory.Vaccination]: 'Vaccination',
  [BenefitCategory.Unknown]: 'Other benefit',
};

export function toBenefitCategory(code: string | null | undefined): BenefitCategory {
  if (!code) return BenefitCategory.Unknown;
  return CATEGORY_BY_CODE.get(code.trim().toUpperCase()) ?? BenefitCategory.Unknown;
}

/**
 * The API's own name always wins when it sends one. The enum exists to decide
 * routing and icons, not to rename a member's benefit — that is what made a
 * stale code table show "Dental" over a pathology balance.
 */
export function benefitCategoryLabel(
  category: BenefitCategory,
  apiSuppliedName?: string | null,
): string {
  return apiSuppliedName?.trim() || CATEGORY_LABELS[category];
}

/** Parses an API date string, returning null rather than an Invalid Date. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
