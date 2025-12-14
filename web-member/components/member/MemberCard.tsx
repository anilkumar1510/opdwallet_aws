import { memo } from 'react'
import { UserIcon } from '@heroicons/react/24/outline'
import { calculateAge } from '@/lib/utils/formatters'
import { getRelationshipLabel } from '@/lib/utils/mappers'
import type { MemberProfile } from '@/lib/api/types'

interface MemberCardProps {
  member: MemberProfile
  isPrimary: boolean
  policyNumber: string
  validTill: string
  corporateName: string
}

const MemberCard = memo(({
  member,
  isPrimary,
  policyNumber,
  validTill,
  corporateName
}: MemberCardProps) => {
  return (
    <div className="bg-[#457ec4] rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <span className="font-semibold text-lg">
            {member?.name?.firstName} {member?.name?.lastName}
          </span>
        </div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
          OPD E-Card
        </span>
      </div>

      <div className="space-y-2 text-white/90">
        <div className="flex justify-between">
          <span className="text-sm">Age</span>
          <span className="font-medium">{calculateAge(member?.dob)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Member ID</span>
          <span className="font-medium">{member?.memberId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">UHID</span>
          <span className="font-medium">{member?.uhid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Policy Number</span>
          <span className="font-medium">{policyNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Valid Till</span>
          <span className="font-medium">{validTill}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Corporate Name</span>
          <span className="font-medium">{corporateName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Relationship</span>
          <span className="font-medium">
            {isPrimary ? 'Primary Member' : getRelationshipLabel(member?.relationship)}
          </span>
        </div>
      </div>
    </div>
  )
})

MemberCard.displayName = 'MemberCard'

export default MemberCard
