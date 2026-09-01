/**
 * Runnable check for the code-translation boundary. No framework.
 *
 *   node projects/member/src/app/core/domain/codes.check.ts
 *
 * This guards the promise the mapper layer makes to every screen: a raw API
 * code never reaches a member, and an unknown code degrades instead of
 * throwing. Excluded from the app build via tsconfig.app.json.
 */
import assert from 'node:assert/strict';

import {
  BenefitCategory,
  Relationship,
  benefitCategoryLabel,
  isPrimary,
  relationshipLabel,
  toBenefitCategory,
  toDate,
  toRelationship,
} from './codes.ts';
import { formatCompact, formatMoney, isZero, money } from './money.ts';

// Coded and spelled forms both resolve, and casing/whitespace do not matter.
assert.equal(toRelationship('REL003'), Relationship.Son);
assert.equal(toRelationship('SON'), Relationship.Son);
assert.equal(toRelationship(' rel003 '), Relationship.Son);
assert.equal(toRelationship('REL001'), Relationship.Self);

// Unknown, empty, and absent codes degrade to a neutral member-safe label.
for (const input of ['REL999', '', null, undefined]) {
  const resolved = toRelationship(input);
  assert.equal(resolved, Relationship.Unknown);
  assert.equal(relationshipLabel(resolved), 'Family member');
}
// The raw code must never survive into a label.
assert.ok(!relationshipLabel(toRelationship('REL999')).includes('REL999'));

assert.equal(isPrimary(toRelationship('REL001')), true);
assert.equal(isPrimary(toRelationship('REL003')), false);

// Every code in the category_master collection, verified against the DB.
// web-member/lib/utils/mappers.ts disagrees from CAT004 on and is stale —
// mapping CAT004 to Dental put "Dental" over a pathology balance.
const MASTER: readonly [string, BenefitCategory][] = [
  ['CAT001', BenefitCategory.InClinicConsultation],
  ['CAT002', BenefitCategory.Pharmacy],
  ['CAT003', BenefitCategory.Radiology],
  ['CAT004', BenefitCategory.Pathology],
  ['CAT005', BenefitCategory.OnlineConsultation],
  ['CAT006', BenefitCategory.Dental],
  ['CAT007', BenefitCategory.Vision],
  ['CAT008', BenefitCategory.HealthPackages],
  ['CAT009', BenefitCategory.Vaccination],
];
for (const [code, expected] of MASTER) {
  assert.equal(toBenefitCategory(code), expected, `${code} must map to ${expected}`);
}
// Real booking payloads confirm the two that were previously wrong.
assert.equal(toBenefitCategory('CAT006'), BenefitCategory.Dental);
assert.equal(toBenefitCategory('CAT007'), BenefitCategory.Vision);
assert.equal(toBenefitCategory('pharmacy'), BenefitCategory.Pharmacy);

// The API's own name always wins, so a wrong code table cannot rename a
// member's benefit. The canonical label is only a fallback.
assert.equal(benefitCategoryLabel(BenefitCategory.Pathology), 'Pathology (Labs)');
assert.equal(benefitCategoryLabel(BenefitCategory.Pathology, 'Pathology (Lab)'), 'Pathology (Lab)');
assert.equal(benefitCategoryLabel(BenefitCategory.Dental, 'Dental Services'), 'Dental Services');

const unknownCategory = toBenefitCategory('CAT042');
assert.equal(unknownCategory, BenefitCategory.Unknown);
assert.equal(benefitCategoryLabel(unknownCategory, 'Physiotherapy'), 'Physiotherapy');
assert.equal(benefitCategoryLabel(unknownCategory, '   '), 'Other benefit');
assert.equal(benefitCategoryLabel(unknownCategory, null), 'Other benefit');

// Dates parse, and unusable input is null rather than an Invalid Date.
assert.ok(toDate('2026-08-05T10:30:00.000Z') instanceof Date);
assert.equal(toDate('not-a-date'), null);
assert.equal(toDate(''), null);
assert.equal(toDate(undefined), null);

// Money never yields NaN, and always formats as currency.
assert.equal(money(1250).amount, 1250);
assert.equal(money(undefined).amount, 0);
assert.equal(money(Number.NaN).amount, 0);
assert.equal(isZero(money(0)), true);
assert.ok(formatMoney(money(1250)).includes('1,250'));
assert.ok(/[^\d,.\s]/.test(formatMoney(money(1250))), 'formatted money carries a currency symbol');

// The dashboard's short cap. Thousands lowercase; lakh must not, or a cap of
// one lakh prints as "1l" and reads as a one.
assert.equal(formatCompact(money(20000)), '20k');
assert.equal(formatCompact(money(1000)), '1k');
assert.equal(formatCompact(money(100000)), '1L');
assert.equal(formatCompact(money(0)), '0');

console.log('codes.check.ts: all assertions passed');
