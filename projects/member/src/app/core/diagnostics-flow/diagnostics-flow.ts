import { Money, money } from '../domain/money';

/**
 * The test-first diagnostics journey — patient-flows flow 7, steps 1 to 17.
 *
 * A second way into pathology and radiology, alongside the prescription route
 * the portal already had. The sheet describes this one: concerns, then a test,
 * then a provider, then collection, then a slot, and the order goes on HOLD for
 * adjudication before any money moves.
 *
 * Everything here reads from the member's own endpoints. Three things the sheet
 * asks for have no member-facing source and are marked on screen where they
 * appear rather than quietly left out:
 *
 *   health concerns  — no grouping exists. `CONCERNS` below is a stand-in.
 *   preparation, sample type, turnaround — master-test data is admin only.
 *   distance, accreditation — not on the vendor record.
 */
export const DIAGNOSTICS_FLOW_API = {
  vendors: (area: FlowArea, pincode: string) =>
    `member/${area === 'radiology' ? 'diagnostics' : 'lab'}/vendors/available?pincode=${encodeURIComponent(pincode)}`,
  pricing: (area: FlowArea, vendorId: string) =>
    `member/${area === 'radiology' ? 'diagnostics' : 'lab'}/vendors/${vendorId}/pricing`,
  slots: (area: FlowArea, vendorId: string, pincode: string, date: string) =>
    `member/${area === 'radiology' ? 'diagnostics' : 'lab'}/vendors/${vendorId}/slots` +
    `?pincode=${encodeURIComponent(pincode)}&date=${encodeURIComponent(date)}`,
} as const;

/** Pathology on one card, radiology with cardiology on the other — step 1. */
export type FlowArea = 'pathology' | 'radiology';

export interface HealthConcern {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  /** Matched against the test name and code; empty means "everything else". */
  readonly match: readonly string[];
}

/**
 * Step 2's tabs. A stand-in: nothing in the data groups tests by concern, and
 * the sheet's own examples (diabetes, thyroid, heart, full body) are what it
 * asks for. Every test a provider prices still appears — anything a concern
 * does not claim falls into the last group, so the catalogue is never hidden
 * behind a guess about which box it belongs in.
 */
export const CONCERNS: readonly HealthConcern[] = [
  { id: 'diabetes', label: 'Diabetes', blurb: 'Sugar, HbA1c and related checks', match: ['diabet', 'glucose', 'hba1c', 'sugar'] },
  { id: 'thyroid', label: 'Thyroid', blurb: 'Thyroid function', match: ['thyroid', 'tsh', 't3', 't4'] },
  { id: 'heart', label: 'Heart', blurb: 'Cardiac and lipid checks', match: ['cardi', 'lipid', 'cholesterol', 'ecg', 'echo', 'tmt'] },
  { id: 'full-body', label: 'Full body', blurb: 'Broad panels and health checks', match: ['full body', 'complete', 'cbc', 'profile', 'panel'] },
  { id: 'other', label: 'Everything else', blurb: 'The rest of the catalogue', match: [] },
];

/**
 * What each concern would hold, for tabs no nearby provider prices yet.
 *
 * Shown as placeholders and never bookable: a member cannot order a test no
 * provider near them has quoted, and offering it would end at an empty provider
 * list two screens later. They are here so an empty tab still says what belongs
 * under it rather than looking like a dead category.
 *
 * Delete a row the moment a provider prices that test — the real catalogue
 * always wins, and these only appear when it is empty.
 */
export const PLACEHOLDER_TESTS: Readonly<Record<string, readonly string[]>> = {
  diabetes: ['Fasting blood sugar', 'HbA1c', 'Post-prandial glucose'],
  thyroid: ['TSH', 'Free T3', 'Free T4'],
  heart: ['Lipid profile', 'ECG', 'Echocardiogram'],
  'full-body': ['Complete blood count', 'Liver function', 'Kidney function'],
  other: ['Vitamin D', 'Vitamin B12', 'Urine routine'],
};

/**
 * A chooseable stand-in for a test no nearby provider prices.
 *
 * The price is derived from the name rather than drawn at random, so the same
 * placeholder test costs the same every time it is opened — a demo that shows
 * two prices for one test invites exactly the question it is meant to avoid.
 * It is a plausible figure and nothing more, which is why `isPlaceholder`
 * follows it to every screen that shows it.
 */
export function placeholderTest(name: string): DiagnosticTest {
  const seed = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  const amount = 300 + (seed % 12) * 100;
  return {
    id: `placeholder:${name}`,
    code: '',
    name,
    price: money(amount),
    listPrice: money(amount),
    homeCollectionCharge: money(50),
    vendorId: '',
    vendorName: '',
    isPlaceholder: true,
  };
}

export function concernFor(id: string): HealthConcern {
  return CONCERNS.find((c) => c.id === id) ?? CONCERNS[CONCERNS.length - 1];
}

/** True when this test belongs under that concern — see `CONCERNS`. */
export function matchesConcern(test: DiagnosticTest, concern: HealthConcern): boolean {
  const haystack = `${test.name} ${test.code}`.toLowerCase();
  if (concern.match.length) return concern.match.some((needle) => haystack.includes(needle));
  // "Everything else": whatever no other concern claimed.
  return !CONCERNS.some(
    (other) => other.match.length && other.match.some((needle) => haystack.includes(needle)),
  );
}

export interface DiagnosticTest {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly price: Money;
  readonly listPrice: Money;
  readonly homeCollectionCharge: Money;
  /** Which provider quoted this price — a test is only priced per vendor. */
  readonly vendorId: string;
  readonly vendorName: string;
  /**
   * True when nobody near the member prices this and the whole card is a
   * stand-in. Carried through the journey so every screen after it can say so
   * — the alternative is a demo that looks identical to a real order.
   */
  readonly isPlaceholder?: boolean;
}

export interface DiagnosticVendor {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly homeCollection: boolean;
  readonly centerVisit: boolean;
  readonly homeCollectionCharge: Money;
}

interface VendorDto {
  _id?: string;
  vendorId?: string;
  name?: string;
  contactInfo?: { address?: string };
  homeCollection?: boolean;
  centerVisit?: boolean;
  homeCollectionCharges?: number;
}

interface PricingDto {
  serviceId?: string;
  serviceName?: string;
  serviceCode?: string;
  actualPrice?: number;
  discountedPrice?: number;
  homeCollectionCharges?: number;
  isActive?: boolean;
}

export function toVendor(dto: VendorDto): DiagnosticVendor {
  return {
    id: dto.vendorId ?? dto._id ?? '',
    name: dto.name?.trim() || 'Provider',
    address: dto.contactInfo?.address?.trim() || 'Address not listed',
    homeCollection: dto.homeCollection === true,
    centerVisit: dto.centerVisit !== false,
    homeCollectionCharge: money(dto.homeCollectionCharges),
  };
}

export function toTests(vendor: DiagnosticVendor, rows: readonly PricingDto[]): DiagnosticTest[] {
  return rows
    .filter((row) => row.isActive !== false)
    .map((row) => ({
      id: `${vendor.id}:${row.serviceCode ?? row.serviceId ?? ''}`,
      code: row.serviceCode ?? '',
      name: row.serviceName?.trim() || 'Test',
      // The discounted price is what the member is charged where one is set.
      price: money(row.discountedPrice ?? row.actualPrice),
      listPrice: money(row.actualPrice),
      homeCollectionCharge: money(row.homeCollectionCharges ?? vendor.homeCollectionCharge.amount),
      vendorId: vendor.id,
      vendorName: vendor.name,
    }));
}

export interface DiagnosticSlot {
  readonly id: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly isAvailable: boolean;
}

export function toSlots(rows: readonly Record<string, any>[]): DiagnosticSlot[] {
  return rows.map((row, index) => ({
    id: String(row['slotId'] ?? row['_id'] ?? index),
    date: String(row['date'] ?? ''),
    startTime: String(row['startTime'] ?? ''),
    endTime: String(row['endTime'] ?? ''),
    // Absent means available: the endpoint returns what it is offering.
    isAvailable: row['isAvailable'] !== false && row['available'] !== false,
  }));
}
