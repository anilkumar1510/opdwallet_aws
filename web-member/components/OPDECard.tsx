import { UserIcon } from '@heroicons/react/24/outline'

interface OPDECardProps {
  member: any
  policyNumber: string
  validTill: string
  corporateName: string
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
  corporateName
}: OPDECardProps) {
  const fullName = `${member?.name?.firstName || ''} ${member?.name?.lastName || ''}`.trim()
  const age = calculateAge(member?.dob)

  return (
    <div
      className="rounded-2xl p-6 text-white shadow-lg min-w-[280px] sm:min-w-[320px]"
      style={{ backgroundColor: '#0a529f' }}
    >
      {/* Name and Age */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-white/20 rounded-full p-2">
          <UserIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="font-semibold text-lg">{fullName || 'N/A'}</div>
          <div className="text-sm text-white/80">Age: {age}</div>
        </div>
      </div>

      {/* Policy Details */}
      <div className="space-y-2 text-white/90">
        <div className="flex justify-between text-sm">
          <span>Policy Number</span>
          <span className="font-medium">{policyNumber || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Valid Till</span>
          <span className="font-medium">{validTill || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Corporate Name</span>
          <span className="font-medium truncate ml-2">{corporateName || 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}
