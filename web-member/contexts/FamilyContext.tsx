'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface FamilyMember {
  id: number
  name: string
  relationship: string
  memberId: string
  uhid: string
  age: number
  email: string
  phone: string
  status: string
  coverage: number
  used: number
  isPrimary: boolean
  walletBalance?: number
  avatar?: string
  corporateName?: string
  benefitsUsed?: {
    consultations: number
    medicines: number
    diagnostics: number
  }
}

interface FamilyContextType {
  familyMembers: FamilyMember[]
  activeMember: FamilyMember
  setActiveMember: (member: FamilyMember) => void
  setActiveMemberById: (id: number) => void
  isLoading: boolean
  error: string | null
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

// Sample family data - in a real app this would come from an API
const sampleFamilyMembers: FamilyMember[] = [
  {
    id: 1,
    name: 'John Doe',
    relationship: 'Self',
    memberId: 'MEM002',
    uhid: 'UH2024002',
    age: 35,
    email: 'john.doe@company.com',
    phone: '+91 98765 43210',
    status: 'active',
    coverage: 500000,
    used: 125000,
    isPrimary: true,
    walletBalance: 2500,
    corporateName: 'Google Inc.',
    benefitsUsed: {
      consultations: 8,
      medicines: 15,
      diagnostics: 3
    }
  },
  {
    id: 2,
    name: 'Jane Doe',
    relationship: 'Spouse',
    memberId: 'MEM003',
    uhid: 'UH2024003',
    age: 32,
    email: 'jane.doe@email.com',
    phone: '+91 98765 43211',
    status: 'active',
    coverage: 500000,
    used: 45000,
    isPrimary: false,
    walletBalance: 1800,
    corporateName: 'Google Inc.',
    benefitsUsed: {
      consultations: 5,
      medicines: 8,
      diagnostics: 2
    }
  },
  {
    id: 3,
    name: 'Emily Doe',
    relationship: 'Child',
    memberId: 'MEM004',
    uhid: 'UH2024004',
    age: 8,
    email: '-',
    phone: '-',
    status: 'active',
    coverage: 500000,
    used: 12000,
    isPrimary: false,
    walletBalance: 500,
    corporateName: 'Google Inc.',
    benefitsUsed: {
      consultations: 3,
      medicines: 5,
      diagnostics: 1
    }
  },
  {
    id: 4,
    name: 'Robert Doe',
    relationship: 'Parent',
    memberId: 'MEM005',
    uhid: 'UH2024005',
    age: 65,
    email: 'robert.doe@email.com',
    phone: '+91 98765 43212',
    status: 'pending',
    coverage: 300000,
    used: 0,
    isPrimary: false,
    walletBalance: 0,
    corporateName: 'Microsoft Corporation',
    benefitsUsed: {
      consultations: 0,
      medicines: 0,
      diagnostics: 0
    }
  }
]

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [activeMember, setActiveMember] = useState<FamilyMember>({} as FamilyMember)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate loading family data
    const loadFamilyData = async () => {
      try {
        setIsLoading(true)
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 500))

        setFamilyMembers(sampleFamilyMembers)

        // Get stored active member or default to primary member
        const storedActiveMemberId = localStorage.getItem('activeMemberId')
        const initialMember = storedActiveMemberId
          ? sampleFamilyMembers.find(m => m.id === parseInt(storedActiveMemberId))
          : sampleFamilyMembers.find(m => m.isPrimary)

        setActiveMember(initialMember || sampleFamilyMembers[0])
      } catch (err) {
        setError('Failed to load family data')
      } finally {
        setIsLoading(false)
      }
    }

    loadFamilyData()
  }, [])

  const handleSetActiveMember = (member: FamilyMember) => {
    setActiveMember(member)
    localStorage.setItem('activeMemberId', member.id.toString())
  }

  const setActiveMemberById = (id: number) => {
    const member = familyMembers.find(m => m.id === id)
    if (member) {
      handleSetActiveMember(member)
    }
  }

  const value: FamilyContextType = {
    familyMembers,
    activeMember,
    setActiveMember: handleSetActiveMember,
    setActiveMemberById,
    isLoading,
    error
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