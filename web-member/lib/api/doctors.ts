import apiClient from './client'
import { Doctor, DoctorSlot } from './types'

/**
 * Doctors API
 * Handles doctor search, profiles, and slot availability
 */
export const doctorsApi = {
  /**
   * Get all active doctors
   */
  getAll: async (params?: {
    specialization?: string
    city?: string
    availableForOnlineConsult?: boolean
    search?: string
  }): Promise<Doctor[]> => {
    const { data } = await apiClient.get<Doctor[]>('/doctors', { params })
    return data
  },

  /**
   * Get doctor by ID
   */
  getById: async (doctorId: string): Promise<Doctor> => {
    const { data } = await apiClient.get<{ doctor: Doctor }>(`/doctors/${doctorId}`)
    return data.doctor
  },

  /**
   * Search doctors by specialty
   */
  searchBySpecialty: async (
    specialty: string,
    city?: string
  ): Promise<Doctor[]> => {
    const { data } = await apiClient.get<Doctor[]>('/doctors/search/specialty', {
      params: { specialty, city },
    })
    return data
  },

  /**
   * Get doctor available slots
   */
  getSlots: async (
    doctorId: string,
    params?: {
      date?: string
      slotType?: 'IN_CLINIC' | 'ONLINE'
      clinicId?: string
    }
  ): Promise<DoctorSlot[]> => {
    const { data } = await apiClient.get<DoctorSlot[]>(
      `/doctor-slots/doctor/${doctorId}`,
      { params }
    )
    return data
  },

  /**
   * Get slot by ID
   */
  getSlotById: async (slotId: string): Promise<DoctorSlot> => {
    const { data } = await apiClient.get<{ slot: DoctorSlot }>(
      `/doctor-slots/${slotId}`
    )
    return data.slot
  },

  /**
   * Get all specializations
   */
  getSpecializations: async (): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>('/specialties')
    return data
  },

  /**
   * Get doctors by clinic
   */
  getByClinic: async (clinicId: string): Promise<Doctor[]> => {
    const { data } = await apiClient.get<Doctor[]>(`/clinics/${clinicId}/doctors`)
    return data
  },
}

export default doctorsApi
