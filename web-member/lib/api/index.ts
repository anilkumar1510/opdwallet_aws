/**
 * Centralized API exports
 * Import all domain APIs from this single file
 */

export { default as apiClient } from './client'
export * from './types'

// Domain APIs
export { appointmentsApi } from './appointments'
export { usersApi } from './users'
export { walletApi } from './wallet'
export { labApi } from './lab'
export { claimsApi } from './claims'
export { doctorsApi } from './doctors'
export { transactionsApi } from './transactions'

// Re-export types for convenience
export type {
  User,
  Appointment,
  UserWallet,
  WalletTransaction,
  Claim,
  LabTest,
  LabOrder,
  Doctor,
  DoctorSlot,
  TransactionSummary,
  Payment,
} from './types'
