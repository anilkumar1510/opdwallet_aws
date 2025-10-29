// Category IDs - these are the primary identifiers used everywhere
// Used in: database categoryId field, wallets, transactions, claims, plan config benefit keys
export const CATEGORY_IDS = {
  IN_CLINIC_CONSULTATION: 'CAT001',
  ONLINE_CONSULTATION: 'CAT005',
  PHARMACY: 'CAT002',
  DIAGNOSTICS: 'CAT003',
  LABS: 'CAT004',
} as const;

export type CategoryKey = keyof typeof CATEGORY_IDS;

// Display names for frontend (UI labels only)
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'CAT001': 'In-Clinic Consultation',
  'CAT005': 'Online Consultation',
  'CAT002': 'Pharmacy',
  'CAT003': 'Diagnostics',
  'CAT004': 'Labs',
};

// Appointment type to category ID mapping
export const APPOINTMENT_TYPE_TO_CATEGORY: Record<string, string> = {
  'IN_CLINIC': 'CAT001',
  'ONLINE': 'CAT005',
};

// Service code prefixes for each category (by category ID)
export const SERVICE_CODE_PREFIXES: Record<string, string> = {
  'CAT001': 'CON',  // IN_CLINIC_CONSULTATION
  'CAT005': 'CON',  // ONLINE_CONSULTATION
  'CAT002': 'PHA',  // PHARMACY
  'CAT003': 'LAB',  // DIAGNOSTICS
  'CAT004': 'LAB',  // LABS
} as const;