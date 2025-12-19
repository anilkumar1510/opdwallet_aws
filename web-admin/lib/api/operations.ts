import { apiFetch } from '../api'

/**
 * Operations API
 * For operations portal - member management, lab prescriptions, etc.
 */
export const operationsApi = {
  // Member Operations
  searchMembers: async (params: { search?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString())

    const response = await apiFetch(`/api/ops/members/search?${searchParams}`)
    return response.json()
  },

  getMemberById: async (id: string) => {
    const response = await apiFetch(`/api/ops/members/${id}`)
    return response.json()
  },

  getMemberDependents: async (id: string) => {
    const response = await apiFetch(`/api/ops/members/${id}/dependents`)
    return response.json()
  },

  // Lab Prescription Operations
  getPrescriptions: async (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/ops/lab/prescriptions?${searchParams}`)
    return response.json()
  },

  getPrescriptionById: async (id: string) => {
    const response = await apiFetch(`/api/ops/lab/prescriptions/${id}`)
    return response.json()
  },

  digitizePrescription: async (id: string, tests: string[]) => {
    const response = await apiFetch(`/api/ops/lab/prescriptions/${id}/digitize`, {
      method: 'POST',
      body: JSON.stringify({ tests }),
    })
    return response.json()
  },

  // Lab Orders
  getLabOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/ops/lab/orders?${searchParams}`)
    return response.json()
  },

  // Dental Bookings Operations
  getDentalBookings: async (params?: {
    status?: string
    clinicId?: string
    serviceCode?: string
    dateFrom?: string
    dateTo?: string
    searchTerm?: string
    page?: number
    limit?: number
  }) => {
    console.log('[OperationsAPI] getDentalBookings - Params:', params)
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.clinicId) searchParams.set('clinicId', params.clinicId)
    if (params?.serviceCode) searchParams.set('serviceCode', params.serviceCode)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params?.searchTerm) searchParams.set('searchTerm', params.searchTerm)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await apiFetch(`/api/admin/dental-bookings?${searchParams}`)
    const result = await response.json()
    console.log('[OperationsAPI] getDentalBookings - Results:', result.data?.length, 'bookings')
    return result
  },

  confirmDentalBooking: async (bookingId: string) => {
    console.log('[OperationsAPI] Confirming dental booking:', bookingId)
    const response = await apiFetch(`/api/admin/dental-bookings/${bookingId}/confirm`, {
      method: 'PATCH',
    })
    const result = await response.json()
    console.log('[OperationsAPI] Booking confirmed:', bookingId)
    return result
  },

  cancelDentalBooking: async (bookingId: string, reason: string) => {
    console.log('[OperationsAPI] Cancelling dental booking:', bookingId, 'Reason:', reason)
    const response = await apiFetch(`/api/admin/dental-bookings/${bookingId}/admin-cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
    const result = await response.json()
    console.log('[OperationsAPI] Booking cancelled:', bookingId)
    return result
  },

  rescheduleDentalBooking: async (
    bookingId: string,
    data: { slotId: string; appointmentDate: string; appointmentTime: string; reason: string }
  ) => {
    console.log('[OperationsAPI] Rescheduling dental booking:', bookingId, data)
    const response = await apiFetch(`/api/admin/dental-bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await response.json()
    console.log('[OperationsAPI] Booking rescheduled:', bookingId)
    return result
  },

  markDentalBookingCompleted: async (bookingId: string) => {
    console.log('[OperationsAPI] Marking dental booking completed:', bookingId)
    const response = await apiFetch(`/api/admin/dental-bookings/${bookingId}/complete`, {
      method: 'PATCH',
    })
    const result = await response.json()
    console.log('[OperationsAPI] Booking marked completed:', bookingId)
    return result
  },

  markDentalBookingNoShow: async (bookingId: string) => {
    console.log('[OperationsAPI] Marking dental booking no-show:', bookingId)
    const response = await apiFetch(`/api/admin/dental-bookings/${bookingId}/no-show`, {
      method: 'PATCH',
    })
    const result = await response.json()
    console.log('[OperationsAPI] Booking marked no-show:', bookingId)
    return result
  },
}

export default operationsApi
