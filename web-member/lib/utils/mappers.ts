/**
 * Mapping utility functions
 * Centralized mappings for relationships, categories, etc.
 */

import {
  UserIcon,
  HeartIcon,
  CubeIcon,
  BeakerIcon,
  EyeIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'

/**
 * Get relationship label from code
 */
export const getRelationshipLabel = (relationshipCode: string | undefined | null): string => {
  if (!relationshipCode) return 'Unknown'

  const relationshipMap: Record<string, string> = {
    'REL001': 'Self',
    'SELF': 'Self',
    'REL002': 'Spouse',
    'SPOUSE': 'Spouse',
    'REL003': 'Son',
    'SON': 'Son',
    'REL004': 'Daughter',
    'DAUGHTER': 'Daughter',
    'REL005': 'Father',
    'FATHER': 'Father',
    'REL006': 'Mother',
    'MOTHER': 'Mother',
    'REL007': 'Brother',
    'BROTHER': 'Brother',
    'REL008': 'Sister',
    'SISTER': 'Sister',
    'REL009': 'Father-in-law',
    'FATHER_IN_LAW': 'Father-in-law',
    'REL010': 'Mother-in-law',
    'MOTHER_IN_LAW': 'Mother-in-law'
  }

  return relationshipMap[relationshipCode] || relationshipCode
}

/**
 * Get category icon component from category code
 */
export const getCategoryIcon = (categoryCode: string | undefined | null) => {
  if (!categoryCode) return UserIcon

  const iconMap: Record<string, any> = {
    'CONSULTATION': UserIcon,
    'CAT001': UserIcon,
    'PHARMACY': CubeIcon,
    'CAT002': CubeIcon,
    'DIAGNOSTICS': BeakerIcon,
    'CAT003': BeakerIcon,
    'DENTAL': EyeIcon,
    'CAT004': EyeIcon,
    'VISION': EyeIcon,
    'CAT005': EyeIcon,
    'DENTAL_VISION': EyeIcon,
    'CAT006': EyeIcon,
    'WELLNESS': ClipboardDocumentCheckIcon,
    'CAT007': ClipboardDocumentCheckIcon
  }

  return iconMap[categoryCode] || UserIcon
}

/**
 * Get category name from code
 */
export const getCategoryName = (categoryCode: string | undefined | null): string => {
  if (!categoryCode) return 'Unknown'

  const categoryMap: Record<string, string> = {
    'CONSULTATION': 'Consultation',
    'CAT001': 'Consultation',
    'PHARMACY': 'Pharmacy',
    'CAT002': 'Pharmacy',
    'DIAGNOSTICS': 'Diagnostics',
    'CAT003': 'Diagnostics',
    'DENTAL': 'Dental',
    'CAT004': 'Dental',
    'VISION': 'Vision',
    'CAT005': 'Vision',
    'DENTAL_VISION': 'Dental & Vision',
    'CAT006': 'Dental & Vision',
    'WELLNESS': 'Wellness',
    'CAT007': 'Wellness'
  }

  return categoryMap[categoryCode] || categoryCode
}

/**
 * Get status badge color
 */
export const getStatusColor = (status: string | undefined | null): string => {
  if (!status) return 'gray'

  const statusColorMap: Record<string, string> = {
    'PENDING': 'yellow',
    'APPROVED': 'green',
    'REJECTED': 'red',
    'SUBMITTED': 'blue',
    'PROCESSING': 'blue',
    'COMPLETED': 'green',
    'CANCELLED': 'red',
    'CONFIRMED': 'green',
    'SCHEDULED': 'blue',
    'ACTIVE': 'green',
    'INACTIVE': 'gray',
    'PAID': 'green',
    'UNPAID': 'red'
  }

  return statusColorMap[status.toUpperCase()] || 'gray'
}
