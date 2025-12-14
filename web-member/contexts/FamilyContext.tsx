'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { logger } from '@/lib/logger'

export interface FamilyMember {
  _id: string
  userId: string
  name: {
    firstName: string
    lastName: string
  }
  relationship: string
  memberId: string
  uhid?: string
  email?: string
  phone?: string
  dob?: string
  gender?: string
  isPrimary: boolean
}

interface FamilyContextType {
  familyMembers: FamilyMember[]
  activeMember: FamilyMember | null
  viewingUserId: string | null
  loggedInUser: FamilyMember | null
  setActiveMember: (member: FamilyMember) => void
  isLoading: boolean
  error: string | null
  canSwitchProfiles: boolean
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [activeMember, setActiveMember] = useState<FamilyMember | null>(null)
  const [loggedInUser, setLoggedInUser] = useState<FamilyMember | null>(null)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canSwitchProfiles, setCanSwitchProfiles] = useState(false)

  useEffect(() => {
    loadFamilyData()
  }, [])

  const loadFamilyData = async () => {
    try {
      setIsLoading(true)

      logger.info('FamilyContext', 'Loading family data')

      // Fetch profile data which includes family members
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      logger.info('FamilyContext', 'Profile response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to load family data')
      }

      const data = await response.json()
      logger.info('FamilyContext', 'Profile data:', {
        userId: data.user._id,
        userName: `${data.user.name?.firstName} ${data.user.name?.lastName}`,
        dependentsCount: data.dependents?.length || 0
      })

      // Map logged-in user
      const primaryUser: FamilyMember = {
        _id: data.user._id,
        userId: data.user._id,
        name: data.user.name,
        relationship: data.user.relationship || 'REL001',
        memberId: data.user.memberId,
        uhid: data.user.uhid,
        email: data.user.email,
        phone: data.user.phone,
        dob: data.user.dob,
        gender: data.user.gender,
        isPrimary: data.user.relationship === 'REL001' || data.user.relationship === 'SELF'
      }

      setLoggedInUser(primaryUser)

      // Map family members (user + dependents)
      const allMembers: FamilyMember[] = [primaryUser]

      if (data.dependents && Array.isArray(data.dependents)) {
        const mappedDependents = data.dependents.map((dep: any) => ({
          _id: dep._id,
          userId: dep._id,
          name: dep.name,
          relationship: dep.relationship || 'Dependent',
          memberId: dep.memberId,
          uhid: dep.uhid,
          email: dep.email,
          phone: dep.phone,
          dob: dep.dob,
          gender: dep.gender,
          isPrimary: false
        }))
        allMembers.push(...mappedDependents)
      }

      setFamilyMembers(allMembers)

      // Determine if user can switch profiles (only primary members with dependents)
      const canSwitch = primaryUser.isPrimary && allMembers.length > 1
      setCanSwitchProfiles(canSwitch)

      // Check for stored viewing user in sessionStorage
      const storedViewingUserId = typeof window !== 'undefined'
        ? sessionStorage.getItem('viewingUserId')
        : null

      let initialMember: FamilyMember | null = null

      if (storedViewingUserId && canSwitch) {
        // Find the stored member
        initialMember = allMembers.find(m => m._id === storedViewingUserId) || null
      }

      // Default to primary user if no valid stored member
      if (!initialMember) {
        initialMember = primaryUser
      }

      setActiveMember(initialMember)
      setViewingUserId(initialMember._id)

      logger.info('FamilyContext', 'Active member set:', {
        memberId: initialMember._id,
        memberName: `${initialMember.name?.firstName} ${initialMember.name?.lastName}`,
        isPrimary: initialMember.isPrimary
      })

    } catch (err) {
      logger.error('FamilyContext', 'Error loading family data:', err)
      setError('Failed to load family data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetActiveMember = (member: FamilyMember) => {
    logger.info('FamilyContext', 'Switching active member to:', {
      memberId: member._id,
      memberName: `${member.name?.firstName} ${member.name?.lastName}`
    })

    setActiveMember(member)
    setViewingUserId(member._id)

    // Store in sessionStorage for session persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('viewingUserId', member._id)
      logger.info('FamilyContext', 'Stored viewingUserId in sessionStorage:', member._id)
    }
  }

  const value: FamilyContextType = {
    familyMembers,
    activeMember,
    viewingUserId,
    loggedInUser,
    setActiveMember: handleSetActiveMember,
    isLoading,
    error,
    canSwitchProfiles
  }

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const context = useContext(FamilyContext)
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider')
  }
  return context
}