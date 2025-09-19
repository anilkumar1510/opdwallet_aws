// Canonical keys (do not localize these) - used as categoryId in database
export const CATEGORY_KEYS = {
  CONSULTATION: 'CONSULTATION',
  PHARMACY: 'PHARMACY',
  DIAGNOSTICS: 'DIAGNOSTICS',
} as const;

export type CategoryKey = keyof typeof CATEGORY_KEYS;

// Optional human codes (for display/seed only)
export const CATEGORY_CODES = {
  CONSULTATION: 'CAT001',
  PHARMACY: 'CAT002',
  DIAGNOSTICS: 'CAT003',
} as const;

// Benefits → Categories mapping (what Benefits tab emits)
export const BENEFIT_TO_CATEGORY: Record<string, CategoryKey[]> = {
  consultation: ['CONSULTATION'],
  pharmacy: ['PHARMACY'],
  diagnostics: ['DIAGNOSTICS'],
  // Other benefits (AHC, dental, etc.) map when they gain coverage in future
};

// Service code prefixes for each category
export const SERVICE_CODE_PREFIXES = {
  CONSULTATION: 'CON',
  PHARMACY: 'PHA',
  DIAGNOSTICS: 'LAB',
} as const;