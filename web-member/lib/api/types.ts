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
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export interface Appointment {
  _id: string
  appointmentId: string
  appointmentNumber: string
  userId: string
  patientName: string
  patientId: string
  doctorId: string
  doctorName: string
  specialty: string
  clinicName?: string
  clinicAddress?: string
  appointmentType: 'IN_CLINIC' | 'ONLINE'
  appointmentDate: string
  timeSlot: string
  consultationFee: number
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  requestedAt: string
  hasPrescription?: boolean
  prescriptionId?: string
  contactNumber?: string
  callPreference?: string
}

export interface CreateAppointmentDto {
  doctorId: string
  patientId: string
  patientName: string
  clinicId?: string
  appointmentType: 'IN_CLINIC' | 'ONLINE'
  appointmentDate: string
  slotId: string
  contactNumber?: string
  callPreference?: string
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

export interface WalletTransaction {
  _id: string
  userId: string
  userWalletId: string
  transactionId: string
  type: 'DEBIT' | 'CREDIT' | 'REFUND' | 'ADJUSTMENT' | 'INITIALIZATION'
  amount: number
  categoryCode?: string
  previousBalance: {
    total: number
    category?: number
  }
  newBalance: {
    total: number
    category?: number
  }
  serviceType?: string
  serviceProvider?: string
  bookingId?: string
  notes?: string
  processedAt: string
  isReversed: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// CLAIM TYPES
// ============================================================================

export interface ClaimDocument {
  fileName: string
  originalName: string
  fileType: string
  fileSize: number
  filePath: string
  uploadedAt: string
  documentType: 'INVOICE' | 'PRESCRIPTION' | 'REPORT' | 'DISCHARGE_SUMMARY' | 'OTHER'
}

export interface Claim {
  _id: string
  claimId: string
  userId: string
  memberName: string
  memberId: string
  patientName: string
  relationToMember: string
  claimType: 'REIMBURSEMENT' | 'CASHLESS_PREAUTH'
  category: string
  treatmentDate: string
  providerName: string
  providerLocation?: string
  billAmount: number
  billNumber?: string
  treatmentDescription?: string
  documents: ClaimDocument[]
  status: string
  approvedAmount?: number
  reimbursableAmount?: number
  paymentStatus?: string
  submittedAt: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateClaimDto {
  patientName: string
  relationToMember: string
  claimType: 'REIMBURSEMENT' | 'CASHLESS_PREAUTH'
  category: string
  treatmentDate: string
  providerName: string
  providerLocation?: string
  billAmount: number
  billNumber?: string
  treatmentDescription?: string
}

// ============================================================================
// LAB TYPES
// ============================================================================

export interface LabTest {
  _id: string
  testId: string
  testName: string
  category: string
  price: number
  description?: string
  preparationInstructions?: string
  reportDeliveryTime: string
  isActive: boolean
}

export interface LabOrder {
  _id: string
  orderId: string
  userId: string
  patientName: string
  tests: Array<{
    testId: string
    testName: string
    price: number
  }>
  totalAmount: number
  prescriptionUrl?: string
  status: 'PENDING' | 'CONFIRMED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  scheduledDate?: string
  scheduledTime?: string
  address?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface TransactionSummary {
  _id: string
  transactionId: string
  userId: string
  serviceType: 'APPOINTMENT' | 'CLAIM' | 'LAB_ORDER' | 'PHARMACY'
  serviceId: string
  serviceReferenceId: string
  serviceName: string
  serviceDate: string
  totalAmount: number
  walletAmount: number
  selfPaidAmount: number
  copayAmount: number
  paymentMethod: string
  status: 'PENDING_PAYMENT' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// DOCTOR TYPES
// ============================================================================

export interface Doctor {
  _id: string
  doctorId: string
  fullName: string
  email: string
  phoneNumber: string
  specialization: string
  qualifications: string[]
  experience: number
  consultationFee: number
  availableForOnlineConsult: boolean
  rating?: number
  isActive: boolean
}

export interface DoctorSlot {
  _id: string
  slotId: string
  doctorId: string
  clinicId?: string
  slotDate: string
  slotTime: string
  slotType: 'IN_CLINIC' | 'ONLINE'
  isBooked: boolean
  isActive: boolean
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Payment {
  _id: string
  paymentId: string
  userId: string
  amount: number
  paymentType: 'COPAY' | 'OUT_OF_POCKET' | 'FULL_PAYMENT' | 'PARTIAL_PAYMENT' | 'TOP_UP'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  serviceType?: 'APPOINTMENT' | 'CLAIM' | 'LAB_ORDER' | 'PHARMACY' | 'WALLET_TOPUP'
  serviceId?: string
  serviceReferenceId?: string
  description?: string
  paymentMethod: string
  transactionId?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
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
