'use client'

import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useFamily, FamilyMember } from '@/contexts/FamilyContext'

interface SwitchProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SwitchProfileModal({ isOpen, onClose }: SwitchProfileModalProps) {
  const { familyMembers, activeMember, setActiveMember } = useFamily()

  if (!isOpen) return null

  const handleSelectMember = (member: FamilyMember) => {
    if (member._id === activeMember?._id) {
      // Already viewing this member, just close
      onClose()
      return
    }

    // Set the active member
    setActiveMember(member)

    // Close modal and reload page to fetch new data
    onClose()
    window.location.reload()
  }

  const getInitials = (member: FamilyMember) => {
    const first = member.name?.firstName?.charAt(0)?.toUpperCase() || ''
    const last = member.name?.lastName?.charAt(0)?.toUpperCase() || ''
    return `${first}${last}` || 'U'
  }

  const getFullName = (member: FamilyMember) => {
    return `${member.name?.firstName || ''} ${member.name?.lastName || ''}`.trim() || 'User'
  }

  const getRelationshipLabel = (relationship: string) => {
    const map: { [key: string]: string } = {
      'REL001': 'Primary Member',
      'SELF': 'Primary Member',
      'REL002': 'Spouse',
      'REL003': 'Child',
      'REL004': 'Parent',
      'REL005': 'Other'
    }
    return map[relationship] || relationship
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[70vh] my-auto overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Switch Profile</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-gray-600 mb-4">
              Select a family member to view their profile and wallet information
            </p>

            <div className="space-y-3">
              {familyMembers.map((member) => {
                const isActive = member._id === activeMember?._id
                return (
                  <button
                    key={member._id}
                    onClick={() => handleSelectMember(member)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-50 border-2 border-brand-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 ${
                        isActive ? 'bg-brand-600' : 'bg-gray-400'
                      }`}
                    >
                      {getInitials(member)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{getFullName(member)}</p>
                        {isActive && (
                          <CheckCircleIcon className="h-5 w-5 text-brand-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{getRelationshipLabel(member.relationship)}</p>
                      {member.memberId && (
                        <p className="text-xs text-gray-500 mt-0.5">ID: {member.memberId}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              The page will reload to show the selected member's data
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
