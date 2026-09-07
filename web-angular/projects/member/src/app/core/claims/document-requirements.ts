import { BenefitCategory, toBenefitCategory } from '../domain/codes';

/**
 * Which documents a member must upload at claim submission, driven by the
 * claim category — the matrix from the patient-flows sheet, section 9.
 *
 * Before this the upload step demanded exactly one prescription and one bill
 * for EVERY category, which was wrong three ways: Pathology / Radiology /
 * Dental-procedure need a lab report that had no slot, Vaccination made the
 * prescription optional yet the form forced it, and there was no optional slot
 * for "any other supporting document". This table is the single source of truth
 * for all of that; the form renders and validates off it.
 */

export type DocRequirement = 'required' | 'optional' | 'hidden';

/** Dental splits into two rows in the matrix; the category master does not, so
 *  the member picks the sub-type on the form and it drives the report slot. */
export type DentalSubType = 'consultation' | 'procedure';

/** The four upload slots. `bill` is the invoice; `other` is always optional. */
export type DocSlotKey = 'prescription' | 'bill' | 'report' | 'other';

export interface DocSlot {
  readonly key: DocSlotKey;
  readonly label: string;
  readonly noun: string;
  readonly requirement: DocRequirement;
}

export interface LocationField {
  /** Sent to the create endpoint. `providerName` is the existing param; the
   *  second location is a PLACEHOLDER param — see PLACEHOLDER-APIS.md. */
  readonly key: 'providerName' | 'purchaseLocation';
  readonly label: string;
  readonly placeholder: string;
  readonly required: boolean;
}

const SLOT_META: Record<DocSlotKey, { label: string; noun: string }> = {
  prescription: { label: 'Add prescriptions', noun: 'prescriptions' },
  bill: { label: 'Add bills / invoices', noun: 'bills' },
  report: { label: 'Add lab / diagnostic reports', noun: 'reports' },
  other: { label: 'Add any other supporting document', noun: 'documents' },
};

function slot(key: DocSlotKey, requirement: DocRequirement): DocSlot {
  return { key, requirement, ...SLOT_META[key] };
}

/**
 * Report is required for Pathology, Radiology & Cardiology and Dental-procedure;
 * hidden everywhere else. Prescription is optional for Vaccination and required
 * elsewhere. Invoice is always required. The `other` slot is always optional.
 */
export function documentSlotsFor(
  categoryCode: string | null | undefined,
  dentalSubType: DentalSubType = 'consultation',
): readonly DocSlot[] {
  const category = toBenefitCategory(categoryCode);

  const reportRequired =
    category === BenefitCategory.Pathology ||
    category === BenefitCategory.Radiology ||
    (category === BenefitCategory.Dental && dentalSubType === 'procedure');

  const prescription: DocRequirement =
    category === BenefitCategory.Vaccination ? 'optional' : 'required';

  return [
    slot('bill', 'required'),
    slot('prescription', prescription),
    slot('report', reportRequired ? 'required' : 'hidden'),
    slot('other', 'optional'),
  ].filter((s) => s.requirement !== 'hidden');
}

/** Dental is the one category whose document rule needs a sub-type from the UI. */
export function isDentalCategory(categoryCode: string | null | undefined): boolean {
  return toBenefitCategory(categoryCode) === BenefitCategory.Dental;
}

/**
 * The Location column of the section-9 matrix, per category:
 *   Teleconsult / Offline consult    → doctor location (one)
 *   Dental (consult or procedure)     → clinic location (one)
 *   Pharmacy                          → clinic + pharmacy (two)
 *   Pathology / Radiology-Cardiology  → doctor + diagnostic centre (two)
 *   Vision                            → clinic + optician (two)
 *   Vaccination                       → not required (one, optional)
 * The second location has no API field yet — captured and held as a placeholder
 * param (see PLACEHOLDER-APIS.md).
 */
export function locationFieldsFor(categoryCode: string | null | undefined): readonly LocationField[] {
  const category = toBenefitCategory(categoryCode);

  switch (category) {
    case BenefitCategory.Pharmacy:
      return [
        { key: 'providerName', label: 'Clinic (where prescribed)', placeholder: 'Clinic or doctor', required: true },
        { key: 'purchaseLocation', label: 'Pharmacy (where bought)', placeholder: 'Pharmacy name', required: true },
      ];
    case BenefitCategory.Vision:
      return [
        { key: 'providerName', label: 'Clinic (where eye power prescribed)', placeholder: 'Clinic or doctor', required: true },
        { key: 'purchaseLocation', label: 'Optician (where eyewear bought)', placeholder: 'Optician name', required: true },
      ];
    case BenefitCategory.Pathology:
    case BenefitCategory.Radiology:
      return [
        { key: 'providerName', label: 'Doctor / clinic location', placeholder: 'Clinic or doctor', required: true },
        { key: 'purchaseLocation', label: 'Diagnostic centre location', placeholder: 'Diagnostic centre name', required: true },
      ];
    case BenefitCategory.OnlineConsultation:
    case BenefitCategory.InClinicConsultation:
      return [
        { key: 'providerName', label: 'Doctor location', placeholder: 'Clinic or hospital', required: true },
      ];
    case BenefitCategory.Dental:
      return [
        { key: 'providerName', label: 'Clinic location', placeholder: 'Dental clinic', required: true },
      ];
    case BenefitCategory.Vaccination:
      // Matrix: location not required for vaccination.
      return [
        { key: 'providerName', label: 'Provider (optional)', placeholder: 'Clinic or centre', required: false },
      ];
    default:
      return [
        { key: 'providerName', label: 'Provider', placeholder: 'Clinic, hospital or pharmacy', required: true },
      ];
  }
}
