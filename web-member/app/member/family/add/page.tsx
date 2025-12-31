'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  UserIcon,
  IdentificationIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface FormData {
  // Personal Information
  fullName: string
  relationship: string
  dateOfBirth: string
  gender: string

  // Contact Information
  email: string
  phone: string

  // Coverage Details
  coverageAmount: string
  policyNumber: string

  // Documents
  documents: {
    identityProof: File | null
    addressProof: File | null
    relationshipProof: File | null
  }
}

const relationships = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' }
]

const coverageOptions = [
  { value: '300000', label: '₹3,00,000' },
  { value: '500000', label: '₹5,00,000' },
  { value: '750000', label: '₹7,50,000' },
  { value: '1000000', label: '₹10,00,000' }
]

const steps = [
  { id: 1, name: 'Personal Info', description: 'Basic details' },
  { id: 2, name: 'Contact', description: 'Contact information' },
  { id: 3, name: 'Coverage', description: 'Coverage details' },
  { id: 4, name: 'Documents', description: 'Upload documents' },
  { id: 5, name: 'Review', description: 'Review & submit' }
]

export default function AddFamilyMemberPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    relationship: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    coverageAmount: '',
    policyNumber: '',
    documents: {
      identityProof: null,
      addressProof: null,
      relationshipProof: null
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateFormData = (field: string, value: string | File) => {
    if (field.startsWith('documents.')) {
      const docType = field.replace('documents.', '') as keyof FormData['documents']
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docType]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validation helper functions
  const validatePersonalInfo = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required'
    if (!formData.relationship) errors.relationship = 'Relationship is required'
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'
    if (!formData.gender) errors.gender = 'Gender is required'
    return errors
  }

  const validateContactInfo = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    return errors
  }

  const validateCoverageDetails = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.coverageAmount) errors.coverageAmount = 'Coverage amount is required'
    if (!formData.policyNumber.trim()) errors.policyNumber = 'Policy number is required'
    return errors
  }

  const validateDocuments = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.documents.identityProof) errors['documents.identityProof'] = 'Identity proof is required'
    if (!formData.documents.addressProof) errors['documents.addressProof'] = 'Address proof is required'
    if (formData.relationship !== 'self' && !formData.documents.relationshipProof) {
      errors['documents.relationshipProof'] = 'Relationship proof is required'
    }
    return errors
  }

  const validateStep = (step: number): boolean => {
    let newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        newErrors = validatePersonalInfo()
        break
      case 2:
        newErrors = validateContactInfo()
        break
      case 3:
        newErrors = validateCoverageDetails()
        break
      case 4:
        newErrors = validateDocuments()
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFileUpload = (field: string, file: File | null) => {
    if (file) {
      updateFormData(field, file)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Show success and navigate back
      router.push('/member/family?success=added')
    } catch (error) {
      console.error('Error adding family member:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const FileUploadComponent = ({
    field,
    label,
    required = false,
    accept = ".jpg,.jpeg,.png,.pdf"
  }: {
    field: string,
    label: string,
    required?: boolean,
    accept?: string
  }) => {
    const file = field.startsWith('documents.')
      ? formData.documents[field.replace('documents.', '') as keyof FormData['documents']]
      : null
    const error = errors[field]

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
          {file ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-green-700">{file.name}</span>
              </div>
              <button
                onClick={() => handleFileUpload(field, null)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop
              </div>
              <input
                type="file"
                accept={accept}
                onChange={(e) => handleFileUpload(field, e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center text-sm text-red-600">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // Step rendering functions
  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-500 text-sm">Enter the basic details of the family member</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Full Name *</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            className={`input ${errors.fullName ? 'input-error' : ''}`}
            placeholder="Enter full name"
          />
          {errors.fullName && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.fullName}
            </div>
          )}
        </div>

        <div>
          <label className="label">Relationship *</label>
          <select
            value={formData.relationship}
            onChange={(e) => updateFormData('relationship', e.target.value)}
            className={`input ${errors.relationship ? 'input-error' : ''}`}
          >
            <option value="">Select relationship</option>
            {relationships.map(rel => (
              <option key={rel.value} value={rel.value}>
                {rel.label}
              </option>
            ))}
          </select>
          {errors.relationship && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.relationship}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date of Birth *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
              className={`input ${errors.dateOfBirth ? 'input-error' : ''}`}
            />
            {errors.dateOfBirth && (
              <div className="flex items-center text-sm text-red-600 mt-1">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.dateOfBirth}
              </div>
            )}
          </div>

          <div>
            <label className="label">Gender *</label>
            <select
              value={formData.gender}
              onChange={(e) => updateFormData('gender', e.target.value)}
              className={`input ${errors.gender ? 'input-error' : ''}`}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <div className="flex items-center text-sm text-red-600 mt-1">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.gender}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderContactInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Information</h2>
        <p className="text-gray-500 text-sm">Provide contact details for the family member</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="Enter email address"
          />
          {errors.email && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.email}
            </div>
          )}
        </div>

        <div>
          <label className="label">Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            className={`input ${errors.phone ? 'input-error' : ''}`}
            placeholder="+91 98765 43210"
          />
          {errors.phone && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderCoverageDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coverage Details</h2>
        <p className="text-gray-500 text-sm">Select coverage amount and policy details</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Coverage Amount *</label>
          <select
            value={formData.coverageAmount}
            onChange={(e) => updateFormData('coverageAmount', e.target.value)}
            className={`input ${errors.coverageAmount ? 'input-error' : ''}`}
          >
            <option value="">Select coverage amount</option>
            {coverageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.coverageAmount && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.coverageAmount}
            </div>
          )}
        </div>

        <div>
          <label className="label">Policy Number *</label>
          <input
            type="text"
            value={formData.policyNumber}
            onChange={(e) => updateFormData('policyNumber', e.target.value)}
            className={`input ${errors.policyNumber ? 'input-error' : ''}`}
            placeholder="Enter policy number"
          />
          {errors.policyNumber && (
            <div className="flex items-center text-sm text-red-600 mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.policyNumber}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <IdentificationIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Coverage Information</h4>
              <p className="text-sm text-blue-700 mt-1">
                The coverage amount selected will be subject to policy terms and conditions.
                Additional verification may be required for higher coverage amounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDocumentsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Upload</h2>
        <p className="text-gray-500 text-sm">Upload required documents for verification</p>
      </div>

      <div className="space-y-6">
        <FileUploadComponent
          field="documents.identityProof"
          label="Identity Proof"
          required
        />

        <FileUploadComponent
          field="documents.addressProof"
          label="Address Proof"
          required
        />

        {formData.relationship !== 'self' && (
          <FileUploadComponent
            field="documents.relationshipProof"
            label="Relationship Proof"
            required
          />
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start">
          <DocumentArrowUpIcon className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">Accepted Documents</h4>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• Identity: Aadhaar, PAN Card, Passport, Driving License</li>
              <li>• Address: Utility bills, Bank statements, Aadhaar</li>
              <li>• Relationship: Marriage certificate, Birth certificate, Family ID</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-500 text-sm">Please review all information before submitting</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <UserIcon className="h-4 w-4 mr-2" />
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 text-gray-900 font-medium">{formData.fullName}</span>
            </div>
            <div>
              <span className="text-gray-500">Relationship:</span>
              <span className="ml-2 text-gray-900 font-medium capitalize">{formData.relationship}</span>
            </div>
            <div>
              <span className="text-gray-500">Date of Birth:</span>
              <span className="ml-2 text-gray-900 font-medium">{formData.dateOfBirth}</span>
            </div>
            <div>
              <span className="text-gray-500">Gender:</span>
              <span className="ml-2 text-gray-900 font-medium capitalize">{formData.gender}</span>
            </div>
          </div>
        </div>

        {/* Contact Information Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <PhoneIcon className="h-4 w-4 mr-2" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 text-gray-900 font-medium">{formData.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2 text-gray-900 font-medium">{formData.phone}</span>
            </div>
          </div>
        </div>

        {/* Coverage Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Coverage Details
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Coverage Amount:</span>
              <span className="ml-2 text-gray-900 font-medium">
                ₹{parseInt(formData.coverageAmount || '0').toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Policy Number:</span>
              <span className="ml-2 text-gray-900 font-medium">{formData.policyNumber}</span>
            </div>
          </div>
        </div>

        {/* Documents Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Documents Uploaded
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Identity Proof:</span>
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span>{formData.documents.identityProof?.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Address Proof:</span>
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span>{formData.documents.addressProof?.name}</span>
              </div>
            </div>
            {formData.relationship !== 'self' && formData.documents.relationshipProof && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Relationship Proof:</span>
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span>{formData.documents.relationshipProof.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900">Ready to Submit</h4>
              <p className="text-sm text-green-700 mt-1">
                All required information has been provided. The family member will be added after verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfoStep()
      case 2:
        return renderContactInfoStep()
      case 3:
        return renderCoverageDetailsStep()
      case 4:
        return renderDocumentsStep()
      case 5:
        return renderReviewStep()
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/member/family"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">Back</span>
          </Link>

          <h1 className="text-lg font-semibold text-gray-900">Add Family Member</h1>

          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id < currentStep
                  ? 'bg-teal-600 text-white'
                  : step.id === currentStep
                    ? 'bg-teal-100 text-teal-600 ring-2 ring-teal-600'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {step.id < currentStep ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="text-center mt-2">
                <p className={`text-xs font-medium ${
                  step.id === currentStep ? 'text-teal-600' : 'text-gray-400'
                }`}>
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`absolute top-4 w-full h-0.5 ${
                  step.id < currentStep ? 'bg-teal-600' : 'bg-gray-200'
                }`}
                style={{
                  left: `${((index + 1) / steps.length) * 100}%`,
                  width: `${(1 / steps.length) * 100}%`
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {renderStepContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto flex space-x-4">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 btn-secondary"
            >
              Previous
            </button>
          )}

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              className="flex-1 btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding Member...' : 'Add Family Member'}
            </button>
          )}
        </div>
      </div>

      {/* Bottom spacing for mobile */}
      <div className="h-20" />
    </div>
  )
}