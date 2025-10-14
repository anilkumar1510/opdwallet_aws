'use client'

import { useEffect } from 'react'
import DoctorNavigation from '@/components/DoctorNavigation'
import { startSessionKeepAlive, stopSessionKeepAlive } from '@/lib/utils/sessionKeepAlive'

export default function DoctorViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Start session keep-alive when layout mounts
    startSessionKeepAlive()

    // Cleanup on unmount
    return () => {
      stopSessionKeepAlive()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavigation />
      <main className="pt-16 md:pt-20">
        {children}
      </main>
    </div>
  )
}
