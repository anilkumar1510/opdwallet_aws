'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowsRightLeftIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'
import { useFamily } from '@/contexts/FamilyContext'
import SwitchProfileModal from './SwitchProfileModal'

interface ProfileDropdownProps {
  user?: any
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { activeMember, loggedInUser, canSwitchProfiles } = useFamily()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showDropdown])

  const getInitials = () => {
    if (activeMember?.name) {
      const first = activeMember.name.firstName?.charAt(0)?.toUpperCase() || ''
      return first
    }
    return 'U'
  }

  const getFullName = () => {
    if (activeMember?.name) {
      return `${activeMember.name.firstName} ${activeMember.name.lastName}`.trim()
    }
    return 'User'
  }

  const getEmail = () => {
    return activeMember?.email || loggedInUser?.email || ''
  }

  const isViewingOtherProfile = () => {
    return activeMember && loggedInUser && activeMember._id !== loggedInUser._id
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('viewingUserId')
      }

      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSwitchProfiles = () => {
    setShowDropdown(false)
    setShowSwitchModal(true)
  }

  const handleViewProfile = () => {
    setShowDropdown(false)
    router.push('/member/profile')
  }

  const handleViewServices = () => {
    setShowDropdown(false)
    router.push('/member/services')
  }

  // Navigate to services page to view all available services

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
        aria-label="User menu"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200" style={{ backgroundColor: '#0a529f' }}>
          {getInitials()}
        </div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {getFullName()}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {getEmail()}
            </p>
            {isViewingOtherProfile() && (
              <p className="text-xs text-brand-600 font-medium mt-1">
                Viewing as {activeMember?.name?.firstName}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Switch Profiles - Only show if user can switch profiles */}
            {canSwitchProfiles && (
              <button
                onClick={handleSwitchProfiles}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowsRightLeftIcon className="h-5 w-5 mr-3 text-gray-400" />
                Switch Profiles
              </button>
            )}

            {/* Profile */}
            <button
              onClick={handleViewProfile}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400" />
              Profile
            </button>

            {/* Services */}
            <button
              onClick={handleViewServices}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RectangleStackIcon className="h-5 w-5 mr-3 text-gray-400" />
              All Services
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-gray-100" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Switch Profile Modal */}
      <SwitchProfileModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      />
    </div>
  )
}
