'use client'

import { useState } from 'react'
import { EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ViewPrescriptionButtonProps {
  prescriptionId: string
  hasPrescription?: boolean
  className?: string
}

export default function ViewPrescriptionButton({
  prescriptionId,
  hasPrescription = false,
  className = ''
}: ViewPrescriptionButtonProps) {
  const [loading, setLoading] = useState(false)

  if (!hasPrescription) {
    return null
  }

  const handleViewPrescription = async () => {
    if (loading) return

    try {
      setLoading(true)
      const response = await fetch(`/api/member/digital-prescriptions/${prescriptionId}/download-pdf`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load prescription')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      alert(err.message || 'Failed to view prescription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleViewPrescription}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm ${className}`}
    >
      <EyeIcon className="h-5 w-5" />
      {loading ? 'Loading...' : 'View Prescription'}
    </button>
  )
}

// Prescription badge component for showing on appointment cards
export function PrescriptionBadge({ hasPrescription }: { hasPrescription?: boolean }) {
  if (!hasPrescription) return null

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
      <CheckCircleIcon className="h-4 w-4" />
      <span className="text-xs font-medium">Prescription Available</span>
    </div>
  )
}
