/**
 * Shared utility functions for appointment handling
 */

/**
 * Get the status color classes for appointment status badges
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'PENDING_CONFIRMATION':
      return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Format date to readable string
 */
export function formatAppointmentDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Get appointment type display text
 */
export function getAppointmentTypeText(type: string): string {
  return type === 'ONLINE' ? 'Online Consultation' : 'In-Clinic Visit'
}
