'use client'

import { SparklesIcon, BeakerIcon, CheckCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface AHCService {
  _id: string
  name: string
  code: string
  category?: string
}

interface AHCPackage {
  _id: string
  packageId: string
  name: string
  effectiveFrom: string
  effectiveTo: string
  labServices: AHCService[]
  diagnosticServices: AHCService[]
  totalLabTests: number
  totalDiagnosticTests: number
  totalTests: number
}

interface AHCPackageCardProps {
  package: AHCPackage
  canBook: boolean
  /** Why booking is unavailable, as reported by the eligibility endpoint. */
  ineligibleReason?: string
  /** Set when the member already has an order for this policy year. */
  existingOrderId?: string
  onBookClick: () => void
}

const BLUE_GRADIENT = 'linear-gradient(180deg, #1a6fd4 0%, #034da2 100%)'
const INK = '#034da2'
const ACCENT = '#1a6fd4'

const PANEL = 'bg-white rounded-[18px] border border-[#e4e9f2]'
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]'

/** One test section: header strip with count, then the full list in two columns. */
function TestPanel({
  title,
  icon,
  count,
  services,
}: {
  title: string
  icon: React.ReactNode
  count: number
  services: AHCService[]
}) {
  return (
    <section className={PANEL}>
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-[#e4e9f2] bg-[#f7f9fd] rounded-t-[18px]">
        {icon}
        <h3 className="flex-1 text-base font-bold" style={{ color: INK }}>
          {title}
        </h3>
        <span
          className="min-w-[34px] text-center text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: '#e8f1fc', color: ACCENT }}
        >
          {count}
        </span>
      </header>

      <ul role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 px-6 py-6">
        {services.map((service) => (
          <li key={service._id} className="flex items-start gap-2.5 text-sm text-[#334155]">
            <CheckCircleIcon className="w-[18px] h-[18px] flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <span>{service.name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** One half of the figure row in the summary panel. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1">
      <div className={EYEBROW}>{label}</div>
      <div className="mt-1.5 text-[28px] leading-none font-bold" style={{ color: INK }}>
        {value}
      </div>
    </div>
  )
}

export function AHCPackageCard({ package: pkg, canBook, ineligibleReason, existingOrderId, onBookClick }: AHCPackageCardProps) {
  const alreadyBooked = Boolean(existingOrderId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const hasLab = pkg.totalLabTests > 0
  const hasDiagnostic = pkg.totalDiagnosticTests > 0

  const statusLabel = canBook ? 'Available' : alreadyBooked ? 'Booked' : 'Unavailable'
  const statusStyle = canBook
    ? { background: '#e8f1fc', color: ACCENT }
    : alreadyBooked
      ? { background: '#fef3d7', color: '#a16207' }
      : { background: '#eef1f6', color: '#64748b' }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <section className={`${PANEL} px-6 pt-6 pb-5`}>
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-[16px] flex items-center justify-center flex-shrink-0"
            style={{ background: BLUE_GRADIENT }}
          >
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className={EYEBROW}>Annual Health Check Package</p>
            <h2 className="mt-1 text-[26px] leading-[1.2] font-bold" style={{ color: INK }}>
              {pkg.name}
            </h2>
          </div>

          <span
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
            style={statusStyle}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>

        <div className="mt-5 pt-5 border-t border-[#e4e9f2]">
          <div className="grid grid-cols-2 divide-x divide-[#e4e9f2]">
            <Figure label="Total Tests" value={String(pkg.totalTests)} />
            <div className="pl-8">
              <Figure label="Valid Until" value={formatDate(pkg.effectiveTo)} />
            </div>
          </div>
        </div>
      </section>

      {/* Lab tests */}
      {hasLab && (
        <TestPanel
          title="Lab Tests"
          icon={<BeakerIcon className="w-5 h-5 flex-shrink-0" style={{ color: ACCENT }} />}
          count={pkg.totalLabTests}
          services={pkg.labServices}
        />
      )}

      {/* Diagnostic tests */}
      {hasDiagnostic && (
        <TestPanel
          title="Diagnostic Tests"
          icon={<ClipboardDocumentCheckIcon className="w-5 h-5 flex-shrink-0" style={{ color: ACCENT }} />}
          count={pkg.totalDiagnosticTests}
          services={pkg.diagnosticServices}
        />
      )}

      {/* Action */}
      <section className={`${PANEL} px-6 py-5`}>
        {!canBook && ineligibleReason && (
          <div className="mb-4 rounded-xl px-4 py-3 border border-[#f5d78e] bg-[#fffaf0]">
            <p className="text-sm font-semibold text-[#8a6100]">
              {alreadyBooked ? 'Already Booked This Year' : 'Booking Unavailable'}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: '#7c6a44' }}>
              {ineligibleReason}
            </p>
            {alreadyBooked && (
              <Link
                href={`/member/bookings?tab=ahc`}
                className="inline-block mt-1.5 text-xs font-semibold hover:underline"
                style={{ color: ACCENT }}
              >
                View Your Booking →
              </Link>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <p className="flex-1 text-sm text-[#64748b] text-pretty">
            This package can be booked{' '}
            <strong className="font-semibold text-[#334155]">once per policy year</strong>.
            {canBook && ' Book now to avail your wellness benefit!'}
          </p>

          <button
            onClick={onBookClick}
            disabled={!canBook}
            className="w-full sm:w-auto flex-shrink-0 py-4 px-8 rounded-xl font-semibold text-white transition-all duration-200 enabled:hover:brightness-110 enabled:active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            style={{
              background: canBook ? BLUE_GRADIENT : '#9ca3af',
              // @ts-expect-error -- CSS custom property for the Tailwind focus ring colour
              '--tw-ring-color': ACCENT,
            }}
          >
            {canBook
              ? 'Book Your Annual Health Check Today'
              : alreadyBooked
                ? 'Cannot Book - Already Booked This Year'
                : 'Booking Unavailable'}
          </button>
        </div>
      </section>
    </div>
  )
}
