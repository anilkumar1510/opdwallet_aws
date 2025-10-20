'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface Specialty {
  specialtyId: string
  name: string
  description?: string
  isActive: boolean
}

interface SpecialtiesContextType {
  specialties: Specialty[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

const SpecialtiesContext = createContext<SpecialtiesContextType | undefined>(undefined)

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000

interface SpecialtiesProviderProps {
  children: ReactNode
}

export function SpecialtiesProvider({ children }: SpecialtiesProviderProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchSpecialties = useCallback(async (force = false) => {
    // Check if we should use cached data
    const now = Date.now()
    if (!force && specialties.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiFetch('/api/specialties')
      if (response.ok) {
        const data = await response.json()
        setSpecialties(data)
        setLastFetchTime(now)

        // Store in localStorage for persistence across page refreshes
        if (typeof window !== 'undefined') {
          localStorage.setItem('specialties_cache', JSON.stringify({
            data,
            timestamp: now
          }))
        }
      } else if (response.status === 401) {
        // Don't throw error for unauthenticated requests
        console.log('User not authenticated, skipping specialties fetch')
        setLoading(false)
        return
      } else {
        throw new Error('Failed to fetch specialties')
      }
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch specialties:', err)
    } finally {
      setLoading(false)
    }
  }, [specialties.length, lastFetchTime])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('specialties_cache')
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          const now = Date.now()

          // Use cached data if it's still valid
          if ((now - timestamp) < CACHE_DURATION) {
            setSpecialties(data)
            setLastFetchTime(timestamp)
            setLoading(false)
            return
          }
        } catch (err) {
          // Invalid cache, fetch fresh data
          console.warn('Invalid specialties cache:', err)
        }
      }
    }

    // Fetch fresh data
    fetchSpecialties()
  }, [fetchSpecialties])

  const refresh = async () => {
    await fetchSpecialties(true)
  }

  return (
    <SpecialtiesContext.Provider value={{ specialties, loading, error, refresh }}>
      {children}
    </SpecialtiesContext.Provider>
  )
}

export function useSpecialties() {
  const context = useContext(SpecialtiesContext)
  if (context === undefined) {
    throw new Error('useSpecialties must be used within a SpecialtiesProvider')
  }
  return context
}