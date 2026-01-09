'use client'

import { useState, useEffect } from 'react'
import { SparklesIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AHCPackageCard } from '@/components/ahc/AHCPackageCard'

interface AHCPackage {
  _id: string
  packageId: string
  name: string
  effectiveFrom: string
  effectiveTo: string
  labServices: Array<{
    _id: string
    name: string
    code: string
    category?: string
  }>
  diagnosticServices: Array<{
    _id: string
    name: string
    code: string
    category?: string
  }>
  totalLabTests: number
  totalDiagnosticTests: number
  totalTests: number
}

interface Eligibility {
  isEligible: boolean
  reason?: string
  existingOrderId?: string
}

export default function WellnessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null)
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAhcData()
  }, [])

  const fetchAhcData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch AHC package
      const packageResponse = await fetch('/api/member/ahc/package', {
        credentials: 'include'
      })

      if (!packageResponse.ok) {
        if (packageResponse.status === 404) {
          // No AHC package assigned
          setError('No AHC package assigned to your policy')
          return
        }
        throw new Error('Failed to fetch AHC package')
      }

      const packageData = await packageResponse.json()
      setAhcPackage(packageData.data)

      // Fetch eligibility
      const eligibilityResponse = await fetch('/api/member/ahc/eligibility', {
        credentials: 'include'
      })

      if (!eligibilityResponse.ok) {
        throw new Error('Failed to check eligibility')
      }

      const eligibilityData = await eligibilityResponse.json()
      setEligibility(eligibilityData.data)
    } catch (err: any) {
      console.error('Error fetching AHC data:', err)
      setError(err.message || 'Failed to load wellness data')
      toast.error('Failed to load wellness data')
    } finally {
      setLoading(false)
    }
  }

  const handleBookClick = () => {
    if (!ahcPackage) return

    // Store package info in sessionStorage for booking flow
    sessionStorage.setItem('ahc_package', JSON.stringify(ahcPackage))

    // Determine navigation based on package contents
    console.log('[Wellness] AHC Package data:', JSON.stringify(ahcPackage, null, 2))
    console.log('[Wellness] totalLabTests:', ahcPackage.totalLabTests)
    console.log('[Wellness] totalDiagnosticTests:', ahcPackage.totalDiagnosticTests)
    console.log('[Wellness] labServices length:', ahcPackage.labServices?.length)
    console.log('[Wellness] diagnosticServices length:', ahcPackage.diagnosticServices?.length)

    const hasLabTests = ahcPackage.totalLabTests > 0
    const hasDiagnosticTests = ahcPackage.totalDiagnosticTests > 0

    console.log('[Wellness] hasLabTests:', hasLabTests)
    console.log('[Wellness] hasDiagnosticTests:', hasDiagnosticTests)

    if (hasLabTests) {
      // If package has lab tests, start with lab booking (will flow to diagnostic if needed)
      console.log('[Wellness] Navigating to lab booking page')
      router.push('/member/ahc/booking')
    } else if (hasDiagnosticTests) {
      // If package has only diagnostic tests, go directly to diagnostic booking
      console.log('[Wellness] Navigating to diagnostic booking page')
      router.push('/member/ahc/booking/diagnostic')
    } else {
      // Should not happen, but handle gracefully
      console.log('[Wellness] No tests found in package')
      toast.error('Package has no tests configured')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
          <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/member">
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
                </button>
              </Link>
              <div className="flex-1">
                <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Wellness Services</h1>
                <p className="text-xs lg:text-sm text-gray-600">Access wellness and preventive care services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ahcPackage) {
    return (
      <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
          <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/member">
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
                </button>
              </Link>
              <div className="flex-1">
                <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Wellness Services</h1>
                <p className="text-xs lg:text-sm text-gray-600">Access wellness and preventive care services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error/No Package */}
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-8 lg:py-12">
          <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}>
            {/* Icon */}
            <div
              className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
                border: '1px solid rgba(95, 161, 113, 0.3)',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <SparklesIcon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
            </div>

            {/* Message */}
            <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#0E51A2' }}>
              {error === 'No AHC package assigned to your policy' ? 'No Wellness Package' : 'Not Available'}
            </h2>
            <p className="text-base lg:text-lg text-gray-700 mb-6 max-w-md mx-auto">
              {error === 'No AHC package assigned to your policy'
                ? 'Your policy does not have a wellness package assigned. Please contact your administrator for more information.'
                : error || 'Wellness services are not available at this time. Please try again later.'}
            </p>

            {/* Retry Button */}
            <button
              onClick={fetchAhcData}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/member">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Wellness Services</h1>
              <p className="text-xs lg:text-sm text-gray-600">Access wellness and preventive care services</p>
            </div>
          </div>
        </div>
      </div>

      {/* AHC Package Card */}
      <div className="max-w-[480px] mx-auto lg:max-w-3xl px-4 lg:px-6 py-8 lg:py-12">
        <AHCPackageCard
          package={ahcPackage}
          canBook={eligibility?.isEligible || false}
          lastBooking={
            eligibility?.existingOrderId
              ? {
                  orderId: eligibility.existingOrderId,
                  bookedAt: new Date().toISOString(),
                }
              : undefined
          }
          onBookClick={handleBookClick}
        />
      </div>
    </div>
  )
}
