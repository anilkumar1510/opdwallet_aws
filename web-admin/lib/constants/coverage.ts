// Category IDs - these are the primary identifiers stored in database.categoryId field
export const CATEGORY_IDS = {
  IN_CLINIC_CONSULTATION: 'CAT001',
  ONLINE_CONSULTATION: 'CAT005',
  PHARMACY: 'CAT002',
  DIAGNOSTICS: 'CAT003',
  LABS: 'CAT004',
} as const;

export type CategoryKey = keyof typeof CATEGORY_IDS;

// Deprecated: Use CATEGORY_IDS instead
export const CATEGORY_KEYS = CATEGORY_IDS;
export const CATEGORY_CODES = CATEGORY_IDS;

// Benefits → Categories mapping (what Benefits tab emits)
// Now returns category IDs (CAT001) instead of keys (IN_CLINIC_CONSULTATION)
export const BENEFIT_TO_CATEGORY: Record<string, string[]> = {
  'in-clinic-consultation': ['CAT001'],
  'online-consultation': ['CAT005'],
  pharmacy: ['CAT002'],
  diagnostics: ['CAT003'],
  labs: ['CAT004'],
  // Other benefits (AHC, dental, etc.) map when they gain coverage in future
};

// Service code prefixes for each category
export const SERVICE_CODE_PREFIXES = {
  IN_CLINIC_CONSULTATION: 'CON',
  ONLINE_CONSULTATION: 'CON',
  PHARMACY: 'PHA',
  DIAGNOSTICS: 'LAB',
  LABS: 'LAB',
} as const;