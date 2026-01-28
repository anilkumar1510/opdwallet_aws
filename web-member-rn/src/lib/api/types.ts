/**
 * Shared TypeScript interfaces for API responses
 * These types match the backend DTOs and schemas
 */

// ============================================================================
// AUTH & USER TYPES
// ============================================================================

export interface User {
  _id: string
  userId: string
  fullName: string
  email: string
  phoneNumber: string
  role: 'MEMBER' | 'ADMIN' | 'SUPER_ADMIN' | 'DOCTOR' | 'TPA_ADMIN' | 'TPA_USER' | 'FINANCE_USER' | 'OPS'
  bloodGroup?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  message: string
  user: User
  role: string
  token?: string // Added for React Native token-based auth
}

// ============================================================================
// WALLET TYPES
// ============================================================================

export interface WalletBalance {
  allocated: number
  current: number
  consumed: number
  lastUpdated: string
}

export interface CategoryBalance {
  categoryCode: string
  categoryName: string
  allocated: number
  current: number
  consumed: number
  isUnlimited: boolean
  lastTransaction: string
}

export interface UserWallet {
  _id: string
  userId: string
  policyAssignmentId: string
  totalBalance: WalletBalance
  categoryBalances: CategoryBalance[]
  policyYear: string
  effectiveFrom: string
  effectiveTo: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MEMBER & PROFILE TYPES
// ============================================================================

export interface MemberName {
  firstName: string
  lastName: string
}

export interface MemberProfile {
  _id: string
  id?: string
  userId: string
  name: MemberName
  memberId: string
  uhid?: string
  email?: string
  phone?: string
  dob?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  relationship: string
  corporateName?: string
  isPrimary?: boolean
}

export interface DependentProfile extends MemberProfile {
  isPrimary: false
}

export interface PolicyAssignment {
  _id: string
  userId: string
  policyId: {
    _id: string
    id?: string
    policyNumber: string
    effectiveTo?: string
  }
  effectiveTo?: string
  assignment?: PolicyAssignment
}

export interface WalletCategory {
  categoryCode: string
  name: string
  available: number
  total?: number
}

export interface MemberConsumption {
  userId: string
  consumed: number
}

export interface MemberWallet {
  isFloater?: boolean
  totalBalance: {
    allocated: number
    current: number
    consumed: number
  }
  categories?: WalletCategory[]
  memberConsumption?: MemberConsumption[]
}

export interface HealthBenefit {
  categoryCode: string
  name: string
  description?: string
}

export interface MemberProfileResponse extends MemberProfile {
  dependents: DependentProfile[]
  familyMembers?: MemberProfile[]
  assignments: PolicyAssignment[]
  wallet: MemberWallet
  walletCategories: WalletCategory[]
  healthBenefits: HealthBenefit[]
}

// ============================================================================
// GENERIC API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
