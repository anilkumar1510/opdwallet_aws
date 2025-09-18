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
    name: 'OPD Consultation',
    description: 'Doctor visits & consultations',
    icon: DocumentTextIcon,
    color: 'bg-blue-600',
    reimbursementRate: 0.8,
    limit: 30000
  },
  {
    id: 'diagnostics',
    name: 'Lab & Diagnostics',
    description: 'Tests, scans & reports',
    icon: HeartIcon,
    color: 'bg-red-600',
    reimbursementRate: 0.9,
    limit: 25000
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'Medicines & prescriptions',
    icon: BeakerIcon,
    color: 'bg-green-600',
    reimbursementRate: 0.75,
    limit: 20000
  },
  {
    id: 'dental',
    name: 'Dental Care',
    description: 'Dental treatments',
    icon: BuildingOfficeIcon,
    color: 'bg-purple-600',
    reimbursementRate: 0.7,
    limit: 15000
  },
  {
    id: 'vision',
    name: 'Vision Care',
    description: 'Eye care & glasses',
    icon: EyeCareIcon,
    color: 'bg-pink-600',
    reimbursementRate: 0.65,
    limit: 10000
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Preventive & wellness',
    icon: SparklesIcon,
    color: 'bg-indigo-600',
    reimbursementRate: 0.6,
    limit: 8000
  }
]

export default function NewClaimPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [walletRules, setWalletRules] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({
    claimType: '',
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  const [estimatedReimbursement, setEstimatedReimbursement] = useState(0)

  // Touch/swipe handling
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch wallet rules on component mount
  useEffect(() => {
    const fetchWalletRules = async () => {
      try {
        const response = await fetch('/api/member/wallet-rules', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setWalletRules(data)
        }
      } catch (error) {
        console.error('Error fetching wallet rules:', error)
      }
    }
    fetchWalletRules()
  }, [])

  // Auto-save draft functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.values(formData).some(value =>
        Array.isArray(value) ? value.length > 0 : value !== ''
      )) {
        saveDraft()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [formData])

  // Calculate estimated reimbursement
  useEffect(() => {
    if (formData.category && formData.billAmount) {
      const category = CLAIM_CATEGORIES.find(cat => cat.id === formData.category)
      const amount = parseFloat(formData.billAmount) || 0
      if (category) {
        const estimated = Math.min(amount * category.reimbursementRate, category.limit)
        setEstimatedReimbursement(estimated)
      }
    }
  }, [formData.category, formData.billAmount])

  const saveDraft = async () => {
    try {
      localStorage.setItem('claimDraft', JSON.stringify(formData))
      setIsDraftSaved(true)
      setTimeout(() => setIsDraftSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

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
      if (diffX > 0 && currentStep < 4) {
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.claimType) {
          newErrors.claimType = 'Please select a claim type'
        }
        break
      case 2:
        if (!formData.category) {
          newErrors.category = 'Please select a category'
        }
        if (!formData.treatmentDate) {
          newErrors.treatmentDate = 'Treatment date is required'
        }
        if (!formData.providerName.trim()) {
          newErrors.providerName = 'Provider name is required'
        }
        if (!formData.billAmount || parseFloat(formData.billAmount) <= 0) {
          newErrors.billAmount = 'Valid bill amount is required'
        }
        break
      case 3:
        if (documentPreviews.length === 0) {
          newErrors.documents = 'Please upload at least one document'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(4, currentStep + 1))
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Clear draft after successful submission
      localStorage.removeItem('claimDraft')

      // Redirect to success page or show success message
      console.log('Claim submitted successfully:', formData)

    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercentage = (currentStep / 4) * 100

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ink-900 mb-2">Choose Claim Type</h2>
        <p className="text-sm text-ink-500">Select how you'd like to process your claim</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setFormData(prev => ({ ...prev, claimType: 'reimbursement' }))}
          className={cn(
            "w-full p-6 border-2 rounded-2xl transition-all text-left",
            formData.claimType === 'reimbursement'
              ? "border-brand-600 bg-brand-50"
              : "border-surface-border hover:border-brand-600"
          )}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center">
                <CurrencyRupeeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900 mb-1">Reimbursement</h3>
              <p className="text-sm text-ink-500 mb-2">
                You've already paid for the treatment and want to get reimbursed
              </p>
              <div className="flex items-center text-xs text-brand-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Submit bills & get money back
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFormData(prev => ({ ...prev, claimType: 'cashless-preauth' }))}
          className={cn(
            "w-full p-6 border-2 rounded-2xl transition-all text-left",
            formData.claimType === 'cashless-preauth'
              ? "border-brand-600 bg-brand-50"
              : "border-surface-border hover:border-brand-600"
          )}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900 mb-1">Cashless Pre-Authorization</h3>
              <p className="text-sm text-ink-500 mb-2">
                Get approval before treatment to avoid upfront payment
              </p>
              <div className="flex items-center text-xs text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                No payment required at hospital
              </div>
            </div>
          </div>
        </button>
      </div>

      {errors.claimType && (
        <div className="flex items-center space-x-2 text-danger text-sm">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{errors.claimType}</span>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ink-900 mb-2">Treatment Details</h2>
        <p className="text-sm text-ink-500">Provide information about your treatment</p>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-3">
          Treatment Category *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {CLAIM_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
              className={cn(
                "p-4 border-2 rounded-xl transition-all text-left",
                formData.category === category.id
                  ? "border-brand-600 bg-brand-50"
                  : "border-surface-border hover:border-brand-600"
              )}
            >
              <div className={`${category.color} p-2 rounded-lg inline-block mb-2`}>
                <category.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium text-ink-900">{category.name}</p>
              <p className="text-xs text-ink-500">{category.description}</p>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="text-danger text-sm mt-1 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {errors.category}
          </p>
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

      {/* Estimated Reimbursement */}
      {estimatedReimbursement > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <InformationCircleIcon className="h-5 w-5 text-brand-600" />
            <span className="text-sm font-medium text-brand-700">Estimated Reimbursement</span>
          </div>
          <p className="text-lg font-bold text-brand-600">
            ₹{estimatedReimbursement.toLocaleString()}
          </p>
          <p className="text-xs text-brand-600 mt-1">
            Based on your selected category and bill amount
          </p>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-ink-900 mb-2">Upload Documents</h2>
        <p className="text-sm text-ink-500">Add bills, prescriptions, and reports</p>
      </div>

      {/* Upload Area */}
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

      {/* Required Documents List */}
      <div className="bg-surface-alt rounded-xl p-4">
        <h4 className="text-sm font-medium text-ink-900 mb-3">Required Documents</h4>
        <ul className="space-y-2 text-sm text-ink-600">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-brand-600 rounded-full mr-2" />
            Original bills/invoices
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-brand-600 rounded-full mr-2" />
            Doctor's prescription (if applicable)
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-brand-600 rounded-full mr-2" />
            Diagnostic reports (if applicable)
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-brand-600 rounded-full mr-2" />
            Discharge summary (for IPD claims)
          </li>
        </ul>
      </div>

      {errors.documents && (
        <div className="flex items-center space-x-2 text-danger text-sm">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{errors.documents}</span>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
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
              {documentPreviews.length} file{documentPreviews.length !== 1 ? 's' : ''} uploaded
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

  const steps = [
    { number: 1, title: 'Claim Type', completed: currentStep > 1 },
    { number: 2, title: 'Details', completed: currentStep > 2 },
    { number: 3, title: 'Documents', completed: currentStep > 3 },
    { number: 4, title: 'Review', completed: currentStep > 4 }
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
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
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

          {currentStep < 4 ? (
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

      {/* Load Draft Button - Show only on first load */}
      {currentStep === 1 && !formData.claimType && (
        <div className="fixed bottom-24 right-4 z-30">
          <button
            onClick={loadDraft}
            className="flex items-center px-4 py-2 bg-white border border-surface-border rounded-xl shadow-soft text-sm font-medium text-ink-600 hover:bg-surface-alt"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Load Draft
          </button>
        </div>
      )}
    </div>
  )
}