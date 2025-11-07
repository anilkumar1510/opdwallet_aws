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

    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 🔵 [ViewPrescription] Button clicked`)
    console.log(`[${timestamp}] 🔵 [ViewPrescription] Prescription ID:`, prescriptionId)
    console.log(`[${timestamp}] 🔵 [ViewPrescription] Has Prescription:`, hasPrescription)

    try {
      setLoading(true)
      const apiUrl = `/api/member/digital-prescriptions/${prescriptionId}/download-pdf`
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Calling API:`, apiUrl)
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Cookies:`, document.cookie)

      const response = await fetch(apiUrl, {
        credentials: 'include'
      })

      console.log(`[${timestamp}] 🔵 [ViewPrescription] Response status:`, response.status, response.statusText)
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Response headers:`, Object.fromEntries(response.headers.entries()))
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Response OK:`, response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[${timestamp}] ❌ [ViewPrescription] Error response body:`, errorText)
        throw new Error(`Failed to load prescription: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Content-Type:`, contentType)

      const blob = await response.blob()
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Blob size:`, blob.size, 'bytes')
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Blob type:`, blob.type)

      if (blob.size === 0) {
        console.error(`[${timestamp}] ❌ [ViewPrescription] Received empty blob`)
        throw new Error('Received empty prescription file')
      }

      const url = window.URL.createObjectURL(blob)
      console.log(`[${timestamp}] ✅ [ViewPrescription] Created blob URL:`, url)
      console.log(`[${timestamp}] ✅ [ViewPrescription] Opening PDF in new tab`)
      window.open(url, '_blank')
    } catch (err: any) {
      console.error(`[${timestamp}] ❌ [ViewPrescription] Exception:`, err)
      console.error(`[${timestamp}] ❌ [ViewPrescription] Error message:`, err.message)
      console.error(`[${timestamp}] ❌ [ViewPrescription] Error stack:`, err.stack)
      alert(err.message || 'Failed to view prescription')
    } finally {
      setLoading(false)
      console.log(`[${timestamp}] 🔵 [ViewPrescription] Loading complete`)
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
