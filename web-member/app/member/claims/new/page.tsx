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
import {
  ClaimFormData,
  DocumentPreview,
  validateStep1,
  validateStep2,
  validateFileSize,
  getFileSizeErrorMessage
} from '@/lib/utils/claimValidation'
import { DocumentUploadSection } from '@/components/claims/DocumentUploadSection'
import { TreatmentDetailsSection } from '@/components/claims/TreatmentDetailsSection'
import { ClaimReviewSection } from '@/components/claims/ClaimReviewSection'

// Icon mapping for category codes
const CATEGORY_ICON_MAP: Record<string, any> = {
  'CAT001': { icon: DocumentTextIcon, color: 'bg-blue-600' },      // In-Clinic Consultation
  'CAT002': { icon: BeakerIcon, color: 'bg-green-600' },           // Pharmacy
  'CAT003': { icon: HeartIcon, color: 'bg-red-600' },              // Diagnostic Services
  'CAT004': { icon: BuildingOfficeIcon, color: 'bg-purple-600' },  // Laboratory Services
  'CAT005': { icon: DocumentTextIcon, color: 'bg-indigo-600' },    // Online Consultation
  'CAT006': { icon: SparklesIcon, color: 'bg-pink-600' },          // Dental Services
  'CAT007': { icon: EyeCareIcon, color: 'bg-yellow-600' },         // Vision Care
  'CAT008': { icon: ShieldCheckIcon, color: 'bg-teal-600' },       // Wellness Programs
}

// Claim category mapping for form submission
const CLAIM_CATEGORY_MAP: Record<string, string> = {
  'CAT001': 'IN_CLINIC_CONSULTATION',
  'CAT002': 'PHARMACY',
  'CAT003': 'DIAGNOSTIC_SERVICES',
  'CAT004': 'LABORATORY_SERVICES',
  'CAT005': 'ONLINE_CONSULTATION',
  'CAT006': 'DENTAL_SERVICES',
  'CAT007': 'VISION_CARE',
  'CAT008': 'WELLNESS_PROGRAMS'
}

export default function NewClaimPage() {
  const { activeMember } = useFamily()
  const [currentStep, setCurrentStep] = useState(1)
  const [walletData, setWalletData] = useState<any>(null)
  const [walletRules, setWalletRules] = useState<any>(null)
  const [availableCategories, setAvailableCategories] = useState<any[]>([])
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [formData, setFormData] = useState<ClaimFormData>({
    claimType: 'reimbursement',
    category: '',
    treatmentDate: '',
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
          const selectedId = activeMember?._id || data.user._id
          setSelectedUserId(selectedId)
        }
      } catch (error) {
        console.error('Error fetching family members:', error)
      }
    }
    fetchFamilyMembers()
  }, [activeMember])

  // Helper function to get available balance for selected category
  const getAvailableBalance = (): number => {
    if (!walletData || !formData.category) {
      return 0
    }

    // formData.category now directly contains the category code (CAT001, CAT002, etc.)
    const categoryBalance = walletData.categories?.find(
      (b: any) => b.categoryCode === formData.category
    )

    return categoryBalance?.available || 0
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

  // Fetch wallet data and available categories when user is selected
  useEffect(() => {
    if (!selectedUserId) return

    const fetchData = async () => {
      try {
        // Fetch wallet balance
        const walletResponse = await fetch(`/api/wallet/balance?userId=${selectedUserId}`, {
          credentials: 'include',
        })

        if (walletResponse.ok) {
          const data = await walletResponse.json()
          setWalletData(data)

          // Set wallet rules for per-claim limit warnings
          if (data.config) {
            setWalletRules({
              totalAnnualAmount: data.config.wallet?.totalAnnualAmount,
              perClaimLimit: data.config.wallet?.perClaimLimit,
              copay: data.config.wallet?.copay,
              partialPaymentEnabled: data.config.wallet?.partialPaymentEnabled,
              categoryLimits: data.config.benefits || {}
            })
          }
        }

        // Fetch available claim categories from new endpoint
        const categoriesResponse = await fetch('/api/member/claims/available-categories', {
          credentials: 'include',
        })

        if (categoriesResponse.ok) {
          const categories = await categoriesResponse.json()

          // Enrich categories with icons
          const enrichedCategories = categories.map((cat: any) => {
            const iconConfig = CATEGORY_ICON_MAP[cat.categoryId] || {
              icon: DocumentTextIcon,
              color: 'bg-gray-600'
            }

            return {
              id: cat.claimCategory,
              name: cat.name,
              description: cat.description,
              icon: iconConfig.icon,
              color: iconConfig.color,
              categoryCode: cat.categoryId,
              categoryId: cat.categoryId,
              claimCategory: cat.claimCategory,
              annualLimit: cat.annualLimit,
              perClaimLimit: cat.perClaimLimit,
              isActive: true
            }
          })

          setAvailableCategories(enrichedCategories)
        } else {
          console.error('Failed to fetch categories:', categoriesResponse.status, categoriesResponse.statusText)
          const errorText = await categoriesResponse.text()
          console.error('Error response:', errorText)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
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

  // Validation functions now imported from lib/utils/claimValidation.ts

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      const availableBalance = getAvailableBalance()
      validateStep1(formData, selectedUserId, availableBalance, newErrors)
    } else if (step === 2) {
      validateStep2(formData, documentPreviews, prescriptionFiles, billFiles, newErrors)
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
      if (!validateFileSize(file, 5)) {
        setErrors(prev => ({...prev, documents: getFileSizeErrorMessage(5)}))
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
      // Get the claim category from the selected category
      const selectedCategory = availableCategories.find(cat => cat.categoryId === formData.category)
      const claimCategory = selectedCategory?.claimCategory || CLAIM_CATEGORY_MAP[formData.category]

      // Prepare form data for multipart upload
      const formDataToSend = new FormData()

      // Add userId for the selected family member
      formDataToSend.append('userId', selectedUserId)

      // Add claim fields
      formDataToSend.append('claimType', 'REIMBURSEMENT')
      formDataToSend.append('category', claimCategory || 'IN_CLINIC_CONSULTATION')
      formDataToSend.append('treatmentDate', formData.treatmentDate)
      formDataToSend.append('providerName', 'Self Service')
      formDataToSend.append('billAmount', formData.billAmount)
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
      // Both in-clinic and online consultations need prescription + bill files
      const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005'
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

      // Show success message with cap info if applicable
      if (submitResult.wasCapped) {
        alert(
          `Claim submitted successfully!\n\n` +
          `Note: Your bill amount of ₹${submitResult.originalBillAmount.toLocaleString()} ` +
          `was capped to ₹${submitResult.cappedAmount.toLocaleString()} ` +
          `as it exceeded the per-claim limit of ₹${submitResult.perClaimLimitApplied.toLocaleString()}.`
        )
      }

      // Redirect to claims list
      window.location.href = '/member/claims'

    } catch (error: any) {
      console.error('Submission failed:', error)
      alert(`Failed to submit claim: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercentage = (currentStep / 3) * 100


  const handleFormDataChange = (updates: Partial<ClaimFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const renderStep2 = () => (
    <TreatmentDetailsSection
      formData={formData}
      familyMembers={familyMembers}
      selectedUserId={selectedUserId}
      availableCategories={availableCategories}
      walletData={walletData}
      walletRules={walletRules}
      errors={errors}
      onFormDataChange={handleFormDataChange}
      onUserChange={handleUserChange}
      getAvailableBalance={getAvailableBalance}
    />
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
    const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005'

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink-900 mb-2">Upload Documents</h2>
          <p className="text-sm text-ink-500">
            {isConsult ? 'Upload prescription and bills separately' : 'Add bills and reports'}
          </p>
        </div>

        <DocumentUploadSection
          isConsultation={isConsult}
          prescriptionFiles={prescriptionFiles}
          billFiles={billFiles}
          documentPreviews={documentPreviews}
          onPrescriptionUpload={handlePrescriptionUpload}
          onBillUpload={handleBillUpload}
          onFileUpload={handleFileUpload}
          onRemovePrescription={removePrescriptionFile}
          onRemoveBill={removeBillFile}
          onRemoveDocument={removeDocument}
          onCameraCapture={captureFromCamera}
        />
      </div>
    )
  }

  const renderStep4 = () => (
    <ClaimReviewSection
      formData={formData}
      availableCategories={availableCategories}
      walletRules={walletRules}
      estimatedReimbursement={estimatedReimbursement}
      prescriptionFiles={prescriptionFiles}
      billFiles={billFiles}
      documentPreviews={documentPreviews}
    />
  )

  const steps = [
    { number: 1, title: 'Details', completed: currentStep > 1 },
    { number: 2, title: 'Documents', completed: currentStep > 2 },
    { number: 3, title: 'Review', completed: currentStep > 3 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4 lg:p-5">
          <Link
            href="/member"
            className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors"
          >
            <div className="flex items-center justify-center w-9 h-9 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <ArrowLeftIcon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Back</span>
          </Link>

          <div className="text-center">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">New Claim</h1>
            <p className="text-xs text-gray-500">Step {currentStep} of 3</p>
          </div>

          <div className="w-20">
            {isDraftSaved && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-semibold">Saved</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 lg:px-5 pb-4 lg:pb-5">
          <div className="flex items-center mb-3 w-full">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-10 w-10 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center text-sm font-semibold transition-all",
                    step.completed
                      ? 'bg-green-600 text-white'
                      : currentStep === step.number
                      ? 'bg-brand-500 text-white ring-2 ring-blue-200'
                      : 'bg-gray-200 text-gray-500'
                  )}>
                    {step.completed ? <CheckCircleIcon className="h-5 w-5 lg:h-6 lg:w-6" /> : step.number}
                  </div>
                  <span className={cn(
                    "text-xs lg:text-sm font-medium hidden sm:block whitespace-nowrap",
                    step.completed || currentStep === step.number ? 'text-gray-900' : 'text-gray-400'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-1 flex-1 mx-2 lg:mx-3 rounded-full transition-all",
                    step.completed ? 'bg-green-600' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-brand-500 rounded-full transition-all duration-500"
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
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:p-5 shadow-lg">
        <div className="flex items-center justify-between max-w-2xl mx-auto gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={cn(
              "flex items-center gap-2 px-5 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold text-sm lg:text-base transition-all",
              currentStep === 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
            )}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 lg:px-10 py-3 lg:py-4 bg-brand-500 text-white rounded-xl font-semibold text-sm lg:text-base shadow-md hover:bg-brand-600 hover:shadow-lg transition-all"
            >
              <span>Next Step</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-3 px-8 lg:px-10 py-3 lg:py-4 rounded-xl font-semibold text-sm lg:text-base shadow-md transition-all",
                isSubmitting
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-6 w-6" />
                  <span>Submit Claim</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}