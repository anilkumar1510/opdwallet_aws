'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransitions } from '@/lib/animations'
import { LoadingSpinner, PageLoader } from '@/components/LoadingSpinner'
import BottomNavigation from '@/components/BottomNavigation'

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

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
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
    }
  }

  if (!user) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top padding for desktop navigation */}
      <div className="hidden lg:block h-16"></div>

      {/* Main content */}
      <main className="overflow-y-auto pb-16 lg:pb-0 lg:pt-0" role="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={pageTransitions}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation (Bottom for Mobile, Top for Desktop) */}
      <BottomNavigation />
    </div>
  )
}