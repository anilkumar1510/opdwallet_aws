'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CameraIcon,
  DocumentPlusIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  HeartIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  EyeIcon as EyeCareIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useFamily } from '@/contexts/FamilyContext'

interface FormData {
  claimType: 'reimbursement' | 'cashless-preauth' | ''
  category: string
  treatmentDate: string
  providerName: string
  providerLocation: string
  billAmount: string
  billNumber: string
  treatmentDescription: string
  documents: File[]
  patientName: string
  relationToMember: string
  memberCardNumber: string
}

interface DocumentPreview {
  file: File
  id: string
  preview?: string
  type: 'image' | 'pdf'
}

const CLAIM_CATEGORIES = [
  {
    id: 'consultation',
    name: 'Consult',
    description: 'Doctor visits & consultations',
    icon: DocumentTextIcon,
    color: 'bg-blue-600',
    categoryCode: 'CAT001',
    isActive: true
  },
  {
    id: 'diagnostics',
    name: 'Lab',
    description: 'Tests, scans & reports',
    icon: HeartIcon,
    color: 'bg-red-600',
    categoryCode: 'CAT002',
    isActive: false // Dummy for now
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'Medicines & prescriptions',
    icon: BeakerIcon,
    color: 'bg-green-600',
    categoryCode: 'CAT003',
    isActive: false // Dummy for now
  }
]

export default function NewClaimPage() {
  const { activeMember } = useFamily()
  const [currentStep, setCurrentStep] = useState(1)
  const [walletData, setWalletData] = useState<any>(null)
  const [walletRules, setWalletRules] = useState<any>(null)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [formData, setFormData] = useState<FormData>({
    claimType: 'reimbursement',
    category: '',
    treatmentDate: '',
    providerName: '',
    providerLocation: '',
    billAmount: '',
    billNumber: '',
    treatmentDescription: '',
    documents: [],
    patientName: '',
    relationToMember: 'self',
    memberCardNumber: ''
  })
  const [documentPreviews, setDocumentPreviews] = useState<DocumentPreview[]>([])
  const [prescriptionFiles, setPrescriptionFiles] = useState<DocumentPreview[]>([])
  const [billFiles, setBillFiles] = useState<DocumentPreview[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  const [estimatedReimbursement, setEstimatedReimbursement] = useState(0)

  // Touch/swipe handling
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch family members on component mount
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const response = await fetch('/api/member/profile', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()

          // Build family members list
          const members = [
            {
              userId: data.user._id,
              name: `${data.user.name.firstName} ${data.user.name.lastName}`,
              memberId: data.user.memberId,
              isPrimary: true,
              relationship: 'Self'
            },
            ...data.dependents.map((dep: any) => ({
              userId: dep._id,
              name: `${dep.name.firstName} ${dep.name.lastName}`,
              memberId: dep.memberId,
              isPrimary: false,
              relationship: dep.relationship
            }))
          ]

          setFamilyMembers(members)
          // Auto-select the active member from context (or fallback to logged-in user)
          setSelectedUserId(activeMember?._id || data.user._id)
        }
      } catch (error) {
        console.error('Error fetching family members:', error)
      }
    }
    fetchFamilyMembers()
  }, [activeMember])

  // Helper function to get available balance for selected category
  const getAvailableBalance = (): number => {
    if (!walletData || !formData.category) return 0

    const categoryMap: Record<string, string> = {
      'consultation': 'CONSULTATION',
      'diagnostics': 'DIAGNOSTICS',
      'pharmacy': 'PHARMACY'
    }

    const mappedCategory = categoryMap[formData.category]
    const categoryBalance = walletData.balancesByCategory?.find(
      (b: any) => b.category === mappedCategory
    )

    return categoryBalance?.balance || 0
  }

  // Helper function to handle user selection change
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId)
    const member = familyMembers.find(m => m.userId === userId)
    if (member) {
      setFormData(prev => ({
        ...prev,
        patientName: member.name,
        relationToMember: member.relationship
      }))
    }
  }

  // Fetch wallet data when user is selected
  useEffect(() => {
    if (!selectedUserId) return

    const fetchWalletData = async () => {
      try {
        const response = await fetch(`/api/wallet/balance?userId=${selectedUserId}`, {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setWalletData(data)
          console.log('Wallet data fetched:', data)
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error)
      }
    }
    fetchWalletData()
  }, [selectedUserId])

  // Auto-save draft
  const saveDraft = useCallback(async () => {
    try {
      localStorage.setItem('claimDraft', JSON.stringify(formData))
      setIsDraftSaved(true)
      setTimeout(() => setIsDraftSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [formData])

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('claimDraft')
      if (draft) {
        setFormData(JSON.parse(draft))
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const diffX = touchStartX.current - touchEndX
    const diffY = touchStartY.current - touchEndY

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0 && currentStep < 3) {
        // Swipe left - next step
        if (validateStep(currentStep)) {
          setCurrentStep(currentStep + 1)
        }
      } else if (diffX < 0 && currentStep > 1) {
        // Swipe right - previous step
        setCurrentStep(currentStep - 1)
      }
    }

    touchStartX.current = 0
    touchStartY.current = 0
  }

  // Helper function to validate user selection
  const validateUserSelection = (errors: Record<string, string>) => {
    if (!selectedUserId) {
      errors.category = 'Please select a family member'
    }
  }

  // Helper function to validate category selection
  const validateCategory = (errors: Record<string, string>) => {
    if (!formData.category) {
      errors.category = 'Please select a category'
    }
  }

  // Helper function to validate treatment date
  const validateTreatmentDate = (errors: Record<string, string>) => {
    if (!formData.treatmentDate) {
      errors.treatmentDate = 'Treatment date is required'
    }
  }

  // Helper function to validate provider name
  const validateProviderName = (errors: Record<string, string>) => {
    if (!formData.providerName.trim()) {
      errors.providerName = 'Provider name is required'
    }
  }

  // Helper function to validate bill amount
  const validateBillAmount = (errors: Record<string, string>) => {
    if (!formData.billAmount || parseFloat(formData.billAmount) <= 0) {
      errors.billAmount = 'Valid bill amount is required'
      return
    }

    // Check wallet balance for all categories
    if (formData.category) {
      const amount = parseFloat(formData.billAmount)
      const availableBalance = getAvailableBalance()
      if (amount > availableBalance) {
        errors.billAmount = `Amount exceeds available balance ₹${availableBalance.toLocaleString()}`
      }
    }
  }

  // Helper function to validate step 1 fields
  const validateStep1 = (errors: Record<string, string>) => {
    validateUserSelection(errors)
    validateCategory(errors)
    validateTreatmentDate(errors)
    validateProviderName(errors)
    validateBillAmount(errors)
  }

  // Helper function to validate consultation documents
  const validateConsultDocuments = (errors: Record<string, string>) => {
    if (prescriptionFiles.length === 0) {
      errors.documents = 'Please upload at least one prescription document'
    }
    if (billFiles.length === 0) {
      errors.documents = 'Please upload at least one bill document'
    }
  }

  // Helper function to validate generic documents
  const validateGenericDocuments = (errors: Record<string, string>) => {
    if (documentPreviews.length === 0) {
      errors.documents = 'Please upload at least one document'
    }
  }

  // Helper function to validate step 2 documents
  const validateStep2 = (errors: Record<string, string>) => {
    const isConsult = formData.category === 'consultation'
    if (isConsult) {
      validateConsultDocuments(errors)
    } else {
      validateGenericDocuments(errors)
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      validateStep1(newErrors)
    } else if (step === 2) {
      validateStep2(newErrors)
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(3, currentStep + 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(Math.max(1, currentStep - 1))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({...prev, documents: 'File size must be less than 5MB'}))
        return
      }

      const id = Math.random().toString(36).substr(2, 9)
      const preview: DocumentPreview = {
        file,
        id,
        type: file.type.startsWith('image/') ? 'image' : 'pdf'
      }

      if (preview.type === 'image') {
        const reader = new FileReader()
        reader.onload = (e) => {
          preview.preview = e.target?.result as string
          setDocumentPreviews(prev => [...prev, preview])
        }
        reader.readAsDataURL(file)
      } else {
        setDocumentPreviews(prev => [...prev, preview])
      }

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, file]
      }))
    })
  }

  const removeDocument = (id: string) => {
    const docToRemove = documentPreviews.find(doc => doc.id === id)
    if (docToRemove) {
      setDocumentPreviews(prev => prev.filter(doc => doc.id !== id))
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.filter(file => file !== docToRemove.file)
      }))
    }
  }

  const captureFromCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      // Create a simple camera capture interface
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()

      // This would typically open a camera modal
      // For now, we'll just trigger file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement
        handleFileUpload(target.files)
      }
      input.click()

      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.error('Camera access failed:', error)
      // Fallback to file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement
        handleFileUpload(target.files)
      }
      input.click()
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      // Map frontend category to backend ClaimCategory enum
      const categoryMap: Record<string, string> = {
        'consultation': 'CONSULTATION',
        'diagnostics': 'DIAGNOSTICS',
        'pharmacy': 'PHARMACY'
      }

      // Prepare form data for multipart upload
      const formDataToSend = new FormData()

      // Add userId for the selected family member
      formDataToSend.append('userId', selectedUserId)

      // Add claim fields
      formDataToSend.append('claimType', 'REIMBURSEMENT')
      formDataToSend.append('category', categoryMap[formData.category] || 'CONSULTATION')
      formDataToSend.append('treatmentDate', formData.treatmentDate)
      formDataToSend.append('providerName', formData.providerName)
      formDataToSend.append('billAmount', formData.billAmount)

      if (formData.providerLocation) {
        formDataToSend.append('providerLocation', formData.providerLocation)
      }
      if (formData.billNumber) {
        formDataToSend.append('billNumber', formData.billNumber)
      }
      if (formData.treatmentDescription) {
        formDataToSend.append('treatmentDescription', formData.treatmentDescription)
      }

      // Get the selected family member's name for patientName
      const selectedMember = familyMembers.find(m => m.userId === selectedUserId)
      if (selectedMember) {
        formDataToSend.append('patientName', selectedMember.name)
        formDataToSend.append('relationToMember', selectedMember.relationship)
      }

      // Add files based on category with explicit document types
      const isConsult = formData.category === 'consultation'
      if (isConsult) {
        // For Consult: Add prescription and bill files with specific field names
        prescriptionFiles.forEach((doc) => {
          formDataToSend.append('prescriptionFiles', doc.file)
        })
        billFiles.forEach((doc) => {
          formDataToSend.append('billFiles', doc.file)
        })
      } else {
        // For Lab/Pharmacy: Add generic documents
        documentPreviews.forEach((doc) => {
          formDataToSend.append('documents', doc.file)
        })
      }

      console.log('Submitting claim with userId:', selectedUserId)

      // Step 1: Create the claim
      const createResponse = await fetch('/api/member/claims', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.message || 'Failed to create claim')
      }

      const createResult = await createResponse.json()
      const claimId = createResult.claim.claimId

      console.log('Claim created:', claimId)

      // Step 2: Submit the claim (this will debit the wallet)
      const submitResponse = await fetch(`/api/member/claims/${claimId}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json()
        throw new Error(errorData.message || 'Failed to submit claim')
      }

      const submitResult = await submitResponse.json()
      console.log('Claim submitted successfully:', submitResult)

      // Clear draft after successful submission
      localStorage.removeItem('claimDraft')

      // Redirect to claims list or show success message
      window.location.href = '/member/claims'

    } catch (error: any) {
      console.error('Submission failed:', error)
      alert(`Failed to submit claim: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercentage = (currentStep / 3) * 100


  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ink-900 mb-2">Treatment Details</h2>
        <p className="text-sm text-ink-500">Provide information about your treatment</p>
      </div>

      {/* Family Member Selection */}
      {familyMembers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Select Family Member *
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
            className="w-full h-touch px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {familyMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name} {member.isPrimary ? '(Self)' : `(${member.relationship})`}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-600 mt-1">
            Select who the treatment is for
          </p>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-2">
          Treatment Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className={cn(
            "w-full h-touch px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent appearance-none bg-white",
            errors.category ? "border-danger" : "border-surface-border"
          )}
        >
          <option value="">Select a category</option>
          {CLAIM_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-danger text-sm mt-1 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {errors.category}
          </p>
        )}

        {/* Show available balance for selected category */}
        {formData.category && walletData && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Available Balance:</span>
              <span className="text-lg font-bold text-blue-600">
                ₹{getAvailableBalance().toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Treatment Date */}
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-2">
          Treatment Date *
        </label>
        <input
          type="date"
          value={formData.treatmentDate}
          onChange={(e) => setFormData(prev => ({ ...prev, treatmentDate: e.target.value }))}
          className={cn(
            "w-full h-touch px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent",
            errors.treatmentDate ? "border-danger" : "border-surface-border"
          )}
          max={new Date().toISOString().split('T')[0]}
        />
        {errors.treatmentDate && (
          <p className="text-danger text-sm mt-1 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {errors.treatmentDate}
          </p>
        )}
      </div>

      {/* Provider Details */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            Provider Name *
          </label>
          <input
            type="text"
            value={formData.providerName}
            onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
            placeholder="Hospital/Clinic name"
            className={cn(
              "w-full h-touch px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent",
              errors.providerName ? "border-danger" : "border-surface-border"
            )}
          />
          {errors.providerName && (
            <p className="text-danger text-sm mt-1 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.providerName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.providerLocation}
            onChange={(e) => setFormData(prev => ({ ...prev, providerLocation: e.target.value }))}
            placeholder="City, State"
            className="w-full h-touch px-4 py-3 border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Amount and Bill Number */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            Bill Amount (₹) *
          </label>
          <input
            type="number"
            value={formData.billAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, billAmount: e.target.value }))}
            placeholder="0"
            className={cn(
              "w-full h-touch px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent",
              errors.billAmount ? "border-danger" : "border-surface-border"
            )}
          />
          {errors.billAmount && (
            <p className="text-danger text-sm mt-1 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.billAmount}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            Bill Number
          </label>
          <input
            type="text"
            value={formData.billNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
            placeholder="Invoice #"
            className="w-full h-touch px-4 py-3 border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Treatment Description */}
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-2">
          Treatment Description
        </label>
        <textarea
          value={formData.treatmentDescription}
          onChange={(e) => setFormData(prev => ({ ...prev, treatmentDescription: e.target.value }))}
          placeholder="Brief description of treatment received"
          rows={3}
          className="w-full px-4 py-3 border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
        />
      </div>

    </div>
  )

  const handlePrescriptionUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      type: file.type.startsWith('image/') ? 'image' as const : 'pdf' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    setPrescriptionFiles(prev => [...prev, ...newFiles])
  }

  const handleBillUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      type: file.type.startsWith('image/') ? 'image' as const : 'pdf' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    setBillFiles(prev => [...prev, ...newFiles])
  }

  const removePrescriptionFile = (id: string) => {
    setPrescriptionFiles(prev => prev.filter(doc => doc.id !== id))
  }

  const removeBillFile = (id: string) => {
    setBillFiles(prev => prev.filter(doc => doc.id !== id))
  }

  const renderStep3 = () => {
    const isConsult = formData.category === 'consultation'

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink-900 mb-2">Upload Documents</h2>
          <p className="text-sm text-ink-500">
            {isConsult ? 'Upload prescription and bills separately' : 'Add bills and reports'}
          </p>
        </div>

        {isConsult ? (
          <>
            {/* Prescription Upload Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-ink-900 mb-3">Prescription Documents *</h3>
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-white">
                <DocumentPlusIcon className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                <p className="text-xs text-ink-600 mb-3">Upload prescription from doctor</p>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.multiple = true
                      input.accept = 'image/*,application/pdf'
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        handlePrescriptionUpload(target.files)
                      }
                      input.click()
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Choose Files
                  </button>

                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.capture = 'environment'
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        handlePrescriptionUpload(target.files)
                      }
                      input.click()
                    }}
                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center text-sm"
                  >
                    <CameraIcon className="h-4 w-4 mr-1" />
                    Camera
                  </button>
                </div>

                <p className="text-xs text-ink-400 mt-2">PDF, JPG, PNG up to 5MB</p>
              </div>

              {/* Prescription Previews */}
              {prescriptionFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {prescriptionFiles.map((doc) => (
                    <div key={doc.id} className="flex items-center p-2 bg-white rounded-lg border border-blue-200">
                      <div className="flex-shrink-0 mr-2">
                        {doc.type === 'image' && doc.preview ? (
                          <img src={doc.preview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center">
                            <DocumentTextIcon className="h-5 w-5 text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-900 truncate">{doc.file.name}</p>
                        <p className="text-xs text-ink-500">{(doc.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => removePrescriptionFile(doc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bills Upload Section */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-ink-900 mb-3">Bill Documents *</h3>
              <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center bg-white">
                <DocumentPlusIcon className="h-10 w-10 text-green-400 mx-auto mb-3" />
                <p className="text-xs text-ink-600 mb-3">Upload consultation bills</p>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.multiple = true
                      input.accept = 'image/*,application/pdf'
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        handleBillUpload(target.files)
                      }
                      input.click()
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Choose Files
                  </button>

                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.capture = 'environment'
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        handleBillUpload(target.files)
                      }
                      input.click()
                    }}
                    className="px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center text-sm"
                  >
                    <CameraIcon className="h-4 w-4 mr-1" />
                    Camera
                  </button>
                </div>

                <p className="text-xs text-ink-400 mt-2">PDF, JPG, PNG up to 5MB</p>
              </div>

              {/* Bill Previews */}
              {billFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {billFiles.map((doc) => (
                    <div key={doc.id} className="flex items-center p-2 bg-white rounded-lg border border-green-200">
                      <div className="flex-shrink-0 mr-2">
                        {doc.type === 'image' && doc.preview ? (
                          <img src={doc.preview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center">
                            <DocumentTextIcon className="h-5 w-5 text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-900 truncate">{doc.file.name}</p>
                        <p className="text-xs text-ink-500">{(doc.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => removeBillFile(doc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Generic Upload Area for Lab/Pharmacy */}
            <div className="border-2 border-dashed border-surface-border rounded-2xl p-8 text-center">
              <DocumentPlusIcon className="h-12 w-12 text-ink-300 mx-auto mb-4" />
              <p className="text-sm text-ink-600 mb-4">
                Drag and drop files here or tap to browse
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.multiple = true
                    input.accept = 'image/*,application/pdf'
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement
                      handleFileUpload(target.files)
                    }
                    input.click()
                  }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
                >
                  Choose Files
                </button>

                <button
                  onClick={captureFromCamera}
                  className="px-4 py-2 border border-brand-600 text-brand-600 rounded-xl hover:bg-brand-50 transition-colors flex items-center justify-center"
                >
                  <CameraIcon className="h-4 w-4 mr-2" />
                  Camera
                </button>
              </div>

              <p className="text-xs text-ink-400 mt-3">
                Supports PDF, JPG, PNG up to 5MB each
              </p>
            </div>

            {/* Document Previews */}
            {documentPreviews.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-ink-900">Uploaded Documents</h3>
                <div className="grid grid-cols-1 gap-3">
                  {documentPreviews.map((doc) => (
                    <div key={doc.id} className="flex items-center p-3 bg-surface-alt rounded-xl border border-surface-border">
                      <div className="flex-shrink-0 mr-3">
                        {doc.type === 'image' && doc.preview ? (
                          <img
                            src={doc.preview}
                            alt="Document preview"
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="h-6 w-6 text-red-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">
                          {doc.file.name}
                        </p>
                        <p className="text-xs text-ink-500">
                          {(doc.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-2">
                        {doc.type === 'image' && (
                          <button
                            onClick={() => {
                              // Open preview modal
                              const modal = document.createElement('div')
                              modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4'
                              modal.innerHTML = `
                                <div class="relative max-w-full max-h-full">
                                  <img src="${doc.preview}" class="max-w-full max-h-full rounded-lg" />
                                  <button class="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full">×</button>
                                </div>
                              `
                              modal.onclick = () => document.body.removeChild(modal)
                              document.body.appendChild(modal)
                            }}
                            className="p-2 text-ink-400 hover:text-brand-600"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="p-2 text-ink-400 hover:text-danger"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const renderStep4 = () => {
    const isConsult = formData.category === 'consultation'
    const totalDocuments = isConsult
      ? prescriptionFiles.length + billFiles.length
      : documentPreviews.length

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink-900 mb-2">Review & Submit</h2>
          <p className="text-sm text-ink-500">Please verify all details before submitting</p>
        </div>

      {/* Wallet Rules Display */}
      {walletRules && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 p-4">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Your OPD Wallet Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-ink-500">Annual Limit</p>
              <p className="font-bold text-indigo-700">₹{walletRules.totalAnnualAmount?.toLocaleString() || '0'}</p>
            </div>
            {walletRules.copay && (
              <div>
                <p className="text-ink-500">Your Co-pay</p>
                <p className="font-bold text-purple-700">
                  {walletRules.copay.mode === 'PERCENT'
                    ? `${walletRules.copay.value}%`
                    : `₹${walletRules.copay.value}`}
                </p>
              </div>
            )}
            {walletRules.perClaimLimit && (
              <div>
                <p className="text-ink-500">Per Claim Cap</p>
                <p className="font-bold text-blue-700">₹{walletRules.perClaimLimit.toLocaleString()}</p>
              </div>
            )}
            {walletRules.partialPaymentEnabled && (
              <div>
                <p className="text-ink-500">Partial Payment</p>
                <p className="font-bold text-green-700">Allowed</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Claim Summary */}
      <Card className="p-0">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Claim Type</span>
            <span className="text-sm font-medium text-ink-900 capitalize">
              {formData.claimType.replace('-', ' ')}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Category</span>
            <span className="text-sm font-medium text-ink-900">
              {CLAIM_CATEGORIES.find(c => c.id === formData.category)?.name}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Treatment Date</span>
            <span className="text-sm font-medium text-ink-900">
              {new Date(formData.treatmentDate).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Provider</span>
            <span className="text-sm font-medium text-ink-900 text-right">
              {formData.providerName}
              {formData.providerLocation && (
                <div className="text-xs text-ink-500">{formData.providerLocation}</div>
              )}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Bill Amount</span>
            <span className="text-lg font-bold text-ink-900">
              ₹{parseFloat(formData.billAmount || '0').toLocaleString()}
            </span>
          </div>

          {estimatedReimbursement > 0 && (
            <div className="flex justify-between items-start pt-2 border-t border-surface-border">
              <span className="text-sm text-brand-600">Estimated Reimbursement</span>
              <span className="text-lg font-bold text-brand-600">
                ₹{estimatedReimbursement.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start">
            <span className="text-sm text-ink-500">Documents</span>
            <span className="text-sm font-medium text-ink-900">
              {totalDocuments} file{totalDocuments !== 1 ? 's' : ''} uploaded
            </span>
          </div>
        </div>
      </Card>

      {/* Terms Agreement */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-brand-700">
            <p className="font-medium mb-1">Verification & Terms</p>
            <p>
              By submitting this claim, you confirm that all information provided is
              accurate and complete. False claims may result in policy termination.
            </p>
          </div>
        </div>
      </div>

      {/* Expected Processing Time */}
      <div className="flex items-center space-x-3 p-4 bg-surface-alt rounded-xl">
        <ClockIcon className="h-5 w-5 text-ink-400" />
        <div className="text-sm text-ink-600">
          <span className="font-medium">Expected processing time:</span> 3-5 business days
        </div>
      </div>
    </div>
    )
  }

  const steps = [
    { number: 1, title: 'Details', completed: currentStep > 1 },
    { number: 2, title: 'Documents', completed: currentStep > 2 },
    { number: 3, title: 'Review', completed: currentStep > 3 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-surface-border">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/member/reimbursements"
            className="flex items-center text-ink-500 hover:text-ink-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span className="text-sm">Back</span>
          </Link>

          <h1 className="text-lg font-semibold text-ink-900">New Claim</h1>

          <div className="flex items-center space-x-2">
            {isDraftSaved && (
              <div className="flex items-center text-xs text-success">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Saved
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    step.completed
                      ? 'bg-brand-600 text-white'
                      : currentStep === step.number
                      ? 'bg-brand-100 text-brand-700 border-2 border-brand-600'
                      : 'bg-gray-200 text-gray-500'
                  )}>
                    {step.completed ? <CheckCircleIcon className="h-4 w-4" /> : step.number}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-8 mx-2 transition-all",
                    step.completed ? 'bg-brand-600' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Progress percentage */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-brand-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1"
      >
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
          {currentStep === 3 && renderStep4()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-surface-border p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={cn(
              "flex items-center px-4 py-2 rounded-xl font-medium transition-all",
              currentStep === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-ink-600 hover:bg-surface-alt"
            )}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium transition-all"
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "flex items-center px-6 py-3 rounded-xl font-medium transition-all",
                isSubmitting
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-brand-600 text-white hover:bg-brand-700"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Claim'
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}