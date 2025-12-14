/**
 * Claim Form Validation Utilities
 * Extracted from claims/new/page.tsx for better maintainability
 */

export interface ClaimFormData {
  claimType: 'reimbursement' | 'cashless-preauth' | ''
  category: string
  treatmentDate: string
  billAmount: string
  billNumber: string
  treatmentDescription: string
  documents: File[]
  patientName: string
  relationToMember: string
  memberCardNumber: string
}

export interface DocumentPreview {
  file: File
  id: string
  preview?: string
  type: 'image' | 'pdf'
}

export type ValidationErrors = Record<string, string>

/**
 * Validate user/family member selection
 */
export function validateUserSelection(
  selectedUserId: string,
  errors: ValidationErrors
): void {
  if (!selectedUserId) {
    errors.category = 'Please select a family member'
  }
}

/**
 * Validate claim category selection
 */
export function validateCategory(
  category: string,
  errors: ValidationErrors
): void {
  if (!category) {
    errors.category = 'Please select a category'
  }
}

/**
 * Validate treatment date
 */
export function validateTreatmentDate(
  treatmentDate: string,
  errors: ValidationErrors
): void {
  if (!treatmentDate) {
    errors.treatmentDate = 'Treatment date is required'
  }
}

/**
 * Validate bill amount against available balance
 */
export function validateBillAmount(
  billAmount: string,
  availableBalance: number,
  category: string,
  errors: ValidationErrors
): void {
  if (!billAmount || parseFloat(billAmount) <= 0) {
    errors.billAmount = 'Valid bill amount is required'
    return
  }

  // Check wallet balance if category is selected
  if (category) {
    const amount = parseFloat(billAmount)
    if (amount > availableBalance) {
      errors.billAmount = `Amount exceeds available balance ₹${availableBalance.toLocaleString()}`
    }
  }
}

/**
 * Validate consultation documents (prescription + bills)
 */
export function validateConsultDocuments(
  prescriptionFiles: DocumentPreview[],
  billFiles: DocumentPreview[],
  errors: ValidationErrors
): void {
  if (prescriptionFiles.length === 0) {
    errors.documents = 'Please upload at least one prescription document'
  }
  if (billFiles.length === 0) {
    errors.documents = 'Please upload at least one bill document'
  }
}

/**
 * Validate generic documents (for non-consultation claims)
 */
export function validateGenericDocuments(
  documentPreviews: DocumentPreview[],
  errors: ValidationErrors
): void {
  if (documentPreviews.length === 0) {
    errors.documents = 'Please upload at least one document'
  }
}

/**
 * Validate Step 1: Basic claim details
 */
export function validateStep1(
  formData: ClaimFormData,
  selectedUserId: string,
  availableBalance: number,
  errors: ValidationErrors
): void {
  validateUserSelection(selectedUserId, errors)
  validateCategory(formData.category, errors)
  validateTreatmentDate(formData.treatmentDate, errors)
  validateBillAmount(formData.billAmount, availableBalance, formData.category, errors)
}

/**
 * Validate Step 2: Document uploads
 */
export function validateStep2(
  formData: ClaimFormData,
  documentPreviews: DocumentPreview[],
  prescriptionFiles: DocumentPreview[],
  billFiles: DocumentPreview[],
  errors: ValidationErrors
): void {
  const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005'

  if (isConsult) {
    validateConsultDocuments(prescriptionFiles, billFiles, errors)
  } else {
    validateGenericDocuments(documentPreviews, errors)
  }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Get error message for file size validation
 */
export function getFileSizeErrorMessage(maxSizeMB: number = 5): string {
  return `File size must be less than ${maxSizeMB}MB`
}
