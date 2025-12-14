import apiClient from './client'
import { Appointment, CreateAppointmentDto, ApiResponse } from './types'
import { logger } from '../logger'

/**
 * Appointments API
 * Handles all appointment-related operations for members
 */
export const appointmentsApi = {
  /**
   * Get user appointments by type
   */
  getUserAppointments: async (
    userId: string,
    type?: 'IN_CLINIC' | 'ONLINE'
  ): Promise<Appointment[]> => {
    const { data } = await apiClient.get<Appointment[]>(
      `/appointments/user/${userId}`,
      { params: { type } }
    )
    return data
  },

  /**
   * Get ongoing appointments for user
   */
  getOngoing: async (userId: string): Promise<Appointment[]> => {
    const { data } = await apiClient.get<Appointment[]>(
      `/appointments/user/${userId}/ongoing`
    )
    return data
  },

  /**
   * Get appointment by ID
   */
  getById: async (appointmentId: string): Promise<Appointment> => {
    const { data } = await apiClient.get<{ appointment: Appointment }>(
      `/appointments/${appointmentId}`
    )
    return data.appointment
  },

  /**
   * Create new appointment
   */
  create: async (dto: CreateAppointmentDto): Promise<Appointment> => {
    const { data } = await apiClient.post<{ message: string; appointment: Appointment }>(
      '/appointments',
      dto
    )
    return data.appointment
  },

  /**
   * Cancel appointment (user-initiated)
   */
  cancel: async (appointmentId: string): Promise<void> => {
    await apiClient.patch(`/appointments/${appointmentId}/user-cancel`)
  },

  /**
   * Check if appointment has prescription
   */
  hasPrescription: async (appointmentId: string): Promise<boolean> => {
    try {
      const appointment = await this.getById(appointmentId)
      return appointment.hasPrescription || false
    } catch (error) {
      logger.error('AppointmentsAPI', 'Failed to check prescription:', error)
      return false
    }
  },
}

export default appointmentsApi
