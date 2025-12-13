import { UserIcon } from '@heroicons/react/24/outline'

interface OPDECardProps {
  member: any
  policyNumber: string
  validTill: string
  corporateName: string
  policyId?: string
  onClick?: () => void
}

// Helper function to calculate age from DOB
const calculateAge = (dob: string) => {
  if (!dob) return 'N/A'
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default function OPDECard({
  member,
  policyNumber,
  validTill,
  corporateName,
  policyId,
  onClick
}: OPDECardProps) {
  const fullName = `${member?.name?.firstName || ''} ${member?.name?.lastName || ''}`.trim()
  const age = calculateAge(member?.dob)

  return (
    <div
      className="relative rounded-3xl p-8 text-white shadow-2xl min-w-[280px] sm:min-w-[340px] cursor-pointer hover:shadow-[0_25px_70px_-20px_rgba(15,23,42,0.6)] hover:scale-[1.015] transition-all duration-500 overflow-hidden border border-white/10"
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 40%, #172554 70%, #0f172a 100%)',
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* Subtle shine overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

      {/* Beautiful soft-edged bubbles */}
      {/* Large bubble - top right with soft glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-blue-500/20 rounded-full blur-2xl"></div>
        <div className="absolute inset-4 bg-gradient-to-br from-cyan-300/25 to-blue-400/15 rounded-full blur-xl"></div>
      </div>

      {/* Medium bubble - bottom left with soft edges */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/35 to-indigo-500/20 rounded-full blur-xl"></div>
        <div className="absolute inset-3 bg-gradient-to-tr from-sky-300/30 to-indigo-400/18 rounded-full blur-lg"></div>
      </div>

      {/* Small accent bubble - top center */}
      <div className="absolute top-1/4 right-1/3 w-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-300/40 to-cyan-500/25 rounded-full blur-xl"></div>
        <div className="absolute inset-2 bg-gradient-to-bl from-blue-200/35 to-cyan-400/20 rounded-full blur-lg"></div>
      </div>

      {/* Floating bubble - center right */}
      <div className="absolute top-1/2 right-8 w-20 h-20 opacity-80">
        <div className="absolute inset-0 bg-gradient-to-tl from-indigo-300/35 to-sky-400/30 rounded-full blur-lg"></div>
        <div className="absolute inset-1.5 bg-white/8 rounded-full blur-md"></div>
      </div>

      {/* Small decorative bubble - bottom center */}
      <div className="absolute bottom-1/3 left-1/3 w-16 h-16 opacity-75">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/40 to-blue-400/30 rounded-full blur-md"></div>
        <div className="absolute inset-1 bg-white/10 rounded-full blur-sm"></div>
      </div>

      {/* Tiny accent bubble - top left area */}
      <div className="absolute top-2/3 left-1/4 w-12 h-12 opacity-70">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-300/35 to-indigo-300/30 rounded-full blur-sm"></div>
        <div className="absolute inset-0.5 bg-white/12 rounded-full blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Name and Age */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-full p-3.5 shadow-xl border border-white/20">
              <UserIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <div className="font-bold text-xl tracking-wide text-white drop-shadow-sm">{fullName || 'N/A'}</div>
            <div className="text-sm text-blue-200/90 font-medium">Age: {age} years</div>
          </div>
        </div>

        {/* Divider with gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6"></div>

        {/* Policy Details */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center group">
            <span className="text-sm text-blue-200/80 font-medium">Policy Number</span>
            <span className="font-semibold text-base text-white group-hover:text-blue-100 transition-colors">{policyNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center group">
            <span className="text-sm text-blue-200/80 font-medium">Valid Till</span>
            <span className="font-semibold text-base text-white group-hover:text-blue-100 transition-colors">{validTill || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-start group">
            <span className="text-sm text-blue-200/80 font-medium">Corporate</span>
            <span className="font-semibold text-base text-right truncate ml-2 max-w-[60%] text-white group-hover:text-blue-100 transition-colors">{corporateName || 'N/A'}</span>
          </div>
        </div>

        {/* Subtle accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 via-blue-400/30 to-blue-500/20"></div>
      </div>
    </div>
  )
}
