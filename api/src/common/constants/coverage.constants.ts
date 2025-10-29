// Category IDs - these are the primary identifiers stored in database.categoryId field
// Used in: wallets, transactions, claims, plan configs
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

// Category ID (CAT001) to benefit key (in-clinic-consultation) mapping
// Used to look up plan config benefits by category
export const CATEGORY_ID_TO_BENEFIT_KEY: Record<string, string> = {
  'CAT001': 'in-clinic-consultation',
  'CAT005': 'online-consultation',
  'CAT002': 'pharmacy',
  'CAT003': 'diagnostics',
  'CAT004': 'labs',
};

// Benefit key (in-clinic-consultation) to category ID (CAT001) mapping
// Used to convert plan config benefits to category IDs for database queries
export const BENEFIT_KEY_TO_CATEGORY_ID: Record<string, string> = {
  'in-clinic-consultation': 'CAT001',
  'online-consultation': 'CAT005',
  'pharmacy': 'CAT002',
  'diagnostics': 'CAT003',
  'labs': 'CAT004',
};

// Deprecated alias for backwards compatibility
export const CATEGORY_CODE_TO_KEY = CATEGORY_ID_TO_BENEFIT_KEY;

// Appointment type to category code mapping
export const APPOINTMENT_TYPE_TO_CATEGORY: Record<string, string> = {
  'IN_CLINIC': 'CAT001',
  'ONLINE': 'CAT005',
};

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

// Service code prefixes for each category (by category ID)
export const SERVICE_CODE_PREFIXES: Record<string, string> = {
  'CAT001': 'CON',  // IN_CLINIC_CONSULTATION
  'CAT005': 'CON',  // ONLINE_CONSULTATION
  'CAT002': 'PHA',  // PHARMACY
  'CAT003': 'LAB',  // DIAGNOSTICS
  'CAT004': 'LAB',  // LABS
} as const;