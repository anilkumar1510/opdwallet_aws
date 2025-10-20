import apiClient from './client'
import { LabTest, LabOrder } from './types'

/**
 * Lab Tests API
 * Handles lab diagnostic tests and orders
 */
export const labApi = {
  /**
   * Get all active lab tests
   */
  getTests: async (params?: {
    category?: string
    search?: string
    city?: string
  }): Promise<LabTest[]> => {
    const { data } = await apiClient.get<LabTest[]>('/lab/services', { params })
    return data
  },

  /**
   * Get lab test by ID
   */
  getTestById: async (testId: string): Promise<LabTest> => {
    const { data } = await apiClient.get<LabTest>(`/lab/services/${testId}`)
    return data
  },

  /**
   * Get user lab orders
   */
  getUserOrders: async (userId: string): Promise<LabOrder[]> => {
    const { data } = await apiClient.get<LabOrder[]>(`/lab/orders/user/${userId}`)
    return data
  },

  /**
   * Get lab order by ID
   */
  getOrderById: async (orderId: string): Promise<LabOrder> => {
    const { data } = await apiClient.get<{ order: LabOrder }>(`/lab/orders/${orderId}`)
    return data.order
  },

  /**
   * Create lab order
   */
  createOrder: async (orderData: {
    tests: Array<{ testId: string; testName: string; price: number }>
    patientName: string
    patientId?: string
    scheduledDate?: string
    scheduledTime?: string
    address?: string
    prescriptionFile?: File
  }): Promise<LabOrder> => {
    const formData = new FormData()

    formData.append('tests', JSON.stringify(orderData.tests))
    formData.append('patientName', orderData.patientName)
    if (orderData.patientId) formData.append('patientId', orderData.patientId)
    if (orderData.scheduledDate) formData.append('scheduledDate', orderData.scheduledDate)
    if (orderData.scheduledTime) formData.append('scheduledTime', orderData.scheduledTime)
    if (orderData.address) formData.append('address', orderData.address)
    if (orderData.prescriptionFile) formData.append('prescription', orderData.prescriptionFile)

    const { data } = await apiClient.post<{ message: string; order: LabOrder }>(
      '/lab/orders',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return data.order
  },

  /**
   * Upload prescription for lab order
   */
  uploadPrescription: async (orderId: string, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('prescription', file)

    const { data } = await apiClient.post<{ message: string; prescriptionUrl: string }>(
      `/lab/orders/${orderId}/prescription`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return data.prescriptionUrl
  },

  /**
   * Cancel lab order
   */
  cancelOrder: async (orderId: string): Promise<void> => {
    await apiClient.patch(`/lab/orders/${orderId}/cancel`)
  },

  /**
   * Get lab test categories
   */
  getCategories: async (): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>('/lab/categories')
    return data
  },

  /**
   * Get available vendors for tests in a city
   */
  getVendors: async (city: string, testIds: string[]): Promise<any[]> => {
    const { data } = await apiClient.post<any[]>('/lab/vendors/available', {
      city,
      testIds,
    })
    return data
  },
}

export default labApi
