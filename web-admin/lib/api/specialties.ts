import { apiFetch } from '../api'

export interface Specialty {
  _id: string
  specialtyId: string
  code: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
  displayOrder?: number
  createdAt: string
  updatedAt: string
}

export interface CreateSpecialtyData {
  code: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
  displayOrder: number
}

export interface UpdateSpecialtyData {
  code?: string
  name?: string
  description?: string
  icon?: string
  isActive?: boolean
  displayOrder?: number
}

export const specialtiesApi = {
  // Get all specialties (for dropdowns - active only)
  getAll: async () => {
    const response = await apiFetch('/api/specialties')
    if (!response.ok) throw new Error('Failed to fetch specialties')
    return response.json()
  },

  // Get all specialties for admin (including inactive)
  getAllForAdmin: async (): Promise<Specialty[]> => {
    const response = await apiFetch('/api/specialties/all')
    if (!response.ok) throw new Error('Failed to fetch specialties')
    return response.json()
  },

  // Get specialty by specialtyId
  getOne: async (specialtyId: string) => {
    const response = await apiFetch(`/api/specialties/${specialtyId}`)
    if (!response.ok) throw new Error('Failed to fetch specialty')
    return response.json()
  },

  // Create new specialty
  create: async (data: CreateSpecialtyData) => {
    const response = await apiFetch('/api/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create specialty')
    }
    return response.json()
  },

  // Update specialty
  update: async (id: string, data: UpdateSpecialtyData) => {
    const response = await apiFetch(`/api/specialties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update specialty')
    }
    return response.json()
  },

  // Toggle active status
  toggleActive: async (id: string) => {
    const response = await apiFetch(`/api/specialties/${id}/toggle-active`, {
      method: 'PATCH',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to toggle status')
    }
    return response.json()
  },

  // Delete specialty
  delete: async (id: string) => {
    const response = await apiFetch(`/api/specialties/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete specialty')
    }
    return response.json()
  },
}

export default specialtiesApi
