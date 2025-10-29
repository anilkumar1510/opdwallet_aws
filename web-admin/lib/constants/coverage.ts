// Canonical keys (do not localize these) - used as categoryId in database
export const CATEGORY_KEYS = {
  IN_CLINIC_CONSULTATION: 'IN_CLINIC_CONSULTATION',
  ONLINE_CONSULTATION: 'ONLINE_CONSULTATION',
  PHARMACY: 'PHARMACY',
  DIAGNOSTICS: 'DIAGNOSTICS',
  LABS: 'LABS',
} as const;

export type CategoryKey = keyof typeof CATEGORY_KEYS;

// Optional human codes (for display/seed only)
export const CATEGORY_CODES = {
  IN_CLINIC_CONSULTATION: 'CAT001',
  ONLINE_CONSULTATION: 'CAT005',
  PHARMACY: 'CAT002',
  DIAGNOSTICS: 'CAT003',
  LABS: 'CAT004',
} as const;

// Benefits → Categories mapping (what Benefits tab emits)
export const BENEFIT_TO_CATEGORY: Record<string, CategoryKey[]> = {
  'in-clinic-consultation': ['IN_CLINIC_CONSULTATION'],
  'online-consultation': ['ONLINE_CONSULTATION'],
  pharmacy: ['PHARMACY'],
  diagnostics: ['DIAGNOSTICS'],
  labs: ['LABS'],
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