import { apiFetch } from '@/lib/api'

export interface Relationship {
  _id: string
  relationshipCode: string
  relationshipName: string
  displayName: string
  isActive: boolean
}

export const relationshipsApi = {
  async getAll(): Promise<Relationship[]> {
    try {
      const response = await apiFetch('/api/relationships')
      if (response.ok) {
        return await response.json()
      } else if (response.status === 401) {
        // User not authenticated, return empty array instead of throwing
        console.log('User not authenticated, returning empty relationships')
        return []
      }
      throw new Error('Failed to fetch relationships')
    } catch (error) {
      console.error('Error fetching relationships:', error)
      throw error
    }
  }
}