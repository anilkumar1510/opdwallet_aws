'use client'

import { useState, useEffect } from 'react'
import { SparklesIcon, ChevronLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
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

type LoadError = { kind: 'no-package' } | { kind: 'failed'; message: string }

// Width of the content column. The header sits flush left and does not use this.
const CONTAINER = 'max-w-[480px] mx-auto lg:max-w-3xl px-4 lg:px-6'

function WellnessHeader() {
  return (
    <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
      <div className="px-6 py-[18px]">
        <div className="flex items-center gap-3.5">
          <Link href="/member" aria-label="Back to dashboard">
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500">
              <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-[1.25]" style={{ color: '#0E51A2' }}>Wellness Services</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Access wellness and preventive care services</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Mirrors the four stacked panels of the package card so the layout doesn't jump. */
function WellnessSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-[168px] rounded-[18px] bg-white border border-[#e4e9f2]" />
      <div className="h-[260px] rounded-[18px] bg-white border border-[#e4e9f2]" />
      <div className="h-[160px] rounded-[18px] bg-white border border-[#e4e9f2]" />
      <div className="h-[92px] rounded-[18px] bg-white border border-[#e4e9f2]" />
    </div>
  )
}

export default function WellnessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null)
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [error, setError] = useState<LoadError | null>(null)

  useEffect(() => {
    fetchAhcData()
  }, [])

  const fetchAhcData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch AHC package
      const packageResponse = await fetch('/api/member/ahc/package', {
        credentials: 'include'
      })

      if (!packageResponse.ok) {
        if (packageResponse.status === 404) {
          // No AHC package assigned
          setError({ kind: 'no-package' })
          return
        }
        throw new Error('Failed to fetch AHC package')
      }

      const packageData = await packageResponse.json()
      setAhcPackage(packageData.data)

      // Eligibility is supplementary: if it fails we still show the package,
      // just without a booking decision.
      try {
        const eligibilityResponse = await fetch('/api/member/ahc/eligibility', {
          credentials: 'include'
        })

        if (!eligibilityResponse.ok) {
          throw new Error('Failed to check eligibility')
        }

        const eligibilityData = await eligibilityResponse.json()
        setEligibility(eligibilityData.data)
      } catch (eligibilityErr) {
        console.error('Error checking AHC eligibility:', eligibilityErr)
        setEligibility({
          isEligible: false,
          reason: 'We could not confirm your eligibility right now. Please try again.'
        })
      }
    } catch (err: any) {
      console.error('Error fetching AHC data:', err)
      setError({ kind: 'failed', message: err.message || 'Failed to load wellness data' })
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
    if (ahcPackage.totalLabTests > 0) {
      // If package has lab tests, start with lab booking (will flow to diagnostic if needed)
      router.push('/member/ahc/booking')
    } else if (ahcPackage.totalDiagnosticTests > 0) {
      // If package has only diagnostic tests, go directly to diagnostic booking
      router.push('/member/ahc/booking/diagnostic')
    } else {
      toast.error('Package has no tests configured')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
        <WellnessHeader />

        {/* Loading */}
        <div className={`${CONTAINER} pt-10 pb-20`}>
          <WellnessSkeleton />
        </div>
      </div>
    )
  }

  if (error || !ahcPackage) {
    const isNoPackage = error?.kind === 'no-package' || !ahcPackage

    return (
      <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
        <WellnessHeader />

        {/* Error/No Package */}
        <div className={`${CONTAINER} pt-10 pb-20`}>
          <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
            background: 'linear-gradient(135deg, rgba(224, 233, 255, 0.48) 0%, rgba(200, 216, 255, 0.48) 100%)',
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
              {isNoPackage ? 'No Wellness Package' : 'Not Available'}
            </h2>
            <p className="text-base lg:text-lg text-gray-700 mb-6 max-w-md mx-auto">
              {isNoPackage
                ? 'Your policy does not have a wellness package assigned. Please contact your administrator for more information.'
                : (error?.kind === 'failed' && error.message) || 'Wellness services are not available at this time. Please try again later.'}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchAhcData}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
                style={{
                  background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
                  boxShadow: '-2px 11px 46.1px 0px #0000000D'
                }}
              >
                <ArrowPathIcon className="w-5 h-5" />
                Retry
              </button>
              <Link
                href="/member"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-white border-2 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                style={{ color: '#0E51A2', borderColor: '#86ACD8' }}
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <WellnessHeader />

      {/* AHC Package Card */}
      <div className={`${CONTAINER} pt-10 pb-20`}>
        <AHCPackageCard
          package={ahcPackage}
          canBook={eligibility?.isEligible || false}
          ineligibleReason={eligibility && !eligibility.isEligible ? eligibility.reason : undefined}
          existingOrderId={eligibility?.existingOrderId}
          onBookClick={handleBookClick}
        />
      </div>
    </div>
  )
}
