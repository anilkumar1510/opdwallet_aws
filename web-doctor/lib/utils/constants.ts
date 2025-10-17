/**
 * Shared constants across the application
 */

// API Configuration
export const API_TIMEOUT_MS = 10000

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const APPOINTMENTS_PAGE_SIZE = 50

// File Upload
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ALLOWED_PRESCRIPTION_TYPES = ['application/pdf']

// Date Formats
export const DATE_FORMAT_DISPLAY = {
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const,
}

export const DATE_FORMAT_SHORT = {
  year: 'numeric' as const,
  month: 'short' as const,
  day: 'numeric' as const,
}
