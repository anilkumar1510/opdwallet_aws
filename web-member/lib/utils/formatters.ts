/**
 * Formatting utility functions
 * Centralized to avoid duplication across components
 */

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dob: string | undefined | null): string | number => {
  if (!dob) return 'N/A'

  try {
    const today = new Date()
    const birthDate = new Date(dob)

    if (isNaN(birthDate.getTime())) return 'N/A'

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  } catch (error) {
    return 'N/A'
  }
}

/**
 * Format valid till date to readable format
 */
export const formatValidTillDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return 'N/A'

  try {
    const date = new Date(dateStr)

    if (isNaN(date.getTime())) return 'N/A'

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch (error) {
    return 'N/A'
  }
}

/**
 * Format currency to Indian Rupees
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '₹0'

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) return '₹0'

  return `₹${numAmount.toLocaleString('en-IN')}`
}

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date | undefined | null, format: 'short' | 'long' = 'short'): string => {
  if (!date) return 'N/A'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) return 'N/A'

    if (format === 'long') {
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }

    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch (error) {
    return 'N/A'
  }
}

/**
 * Format time to readable string
 */
export const formatTime = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) return 'N/A'

    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'N/A'
  }
}

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return 'N/A'

  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Format as +91-XXXXX-XXXXX for 10 digit numbers
  if (digits.length === 10) {
    return `+91-${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  // Return as is for other formats
  return phone
}
