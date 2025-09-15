'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BottomTabBar } from '@/components/navigation/BottomTabBar'
import { Sidebar } from '@/components/navigation/Sidebar'
import { MobileHeader } from '@/components/navigation/MobileHeader'
import { FamilyProvider } from '@/contexts/FamilyContext'

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // For development, use mock user when API is not available
        setUser({
          name: { fullName: 'John Doe', firstName: 'John' },
          email: 'john.doe@example.com',
          memberId: 'OPD000001'
        })
      }
    } catch (error) {
      // For development, use mock user when API is not available
      console.log('API not available, using mock user')
      setUser({
        name: { fullName: 'John Doe', firstName: 'John' },
        email: 'john.doe@example.com',
        memberId: 'OPD000001'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-brand-600 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-4 text-ink-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <FamilyProvider>
      <div className="min-h-screen bg-surface-alt">
        {/* Desktop Sidebar */}
        <Sidebar user={user} onLogout={handleLogout} />

        {/* Mobile Header */}
        <MobileHeader user={user} />

        {/* Main Content */}
        <div className="md:pl-64 lg:pl-72">
          <main className="min-h-screen pb-20 md:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomTabBar tabs={[]} />
      </div>
    </FamilyProvider>
  )
}