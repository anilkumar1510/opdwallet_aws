import { memo } from 'react'
import { UserIcon } from '@heroicons/react/24/outline'
import { getRelationshipLabel } from '@/lib/utils/mappers'
import type { MemberProfile } from '@/lib/api/types'

interface DesktopMemberCardProps {
  member: MemberProfile
  isPrimary: boolean
  policyNumber: string
  validTill: string
  corporateName: string
}

const DesktopMemberCard = memo(({
  member,
  isPrimary,
  policyNumber,
  validTill,
  corporateName
}: DesktopMemberCardProps) => {
  return (
    <div className="bg-[#457ec4] rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 rounded-full p-1.5">
            <UserIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-base truncate">
              {member?.name?.firstName} {member?.name?.lastName}
            </div>
            <div className="text-blue-100 text-xs">
              {isPrimary ? 'Primary' : getRelationshipLabel(member?.relationship)}
            </div>
          </div>
        </div>
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
          E-Card
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-100">Member ID</span>
          <span className="font-medium">{member?.memberId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-100">UHID</span>
          <span className="font-medium">{member?.uhid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-100">Valid Till</span>
          <span className="font-medium">{validTill}</span>
        </div>
      </div>
    </div>
  )
})

DesktopMemberCard.displayName = 'DesktopMemberCard'

export default DesktopMemberCard
