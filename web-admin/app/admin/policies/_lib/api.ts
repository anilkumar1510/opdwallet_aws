import { apiFetch } from '@/lib/api'
import { PolicyListResponse, PolicyQueryParams, Policy } from './types'
import { buildQueryString } from './query'

export async function fetchPolicies(params: PolicyQueryParams): Promise<PolicyListResponse> {
  console.log('[DEBUG fetchPolicies] Starting with params:', params)

  const queryString = buildQueryString(params)
  console.log('[DEBUG fetchPolicies] Built query string:', queryString)

  const url = `/api/policies${queryString ? `?${queryString}` : ''}`
  console.log('[DEBUG fetchPolicies] Full URL:', url)

  try {
    const response = await apiFetch(url)
    console.log('[DEBUG fetchPolicies] Response status:', response.status)
    console.log('[DEBUG fetchPolicies] Response ok:', response.ok)
    console.log('[DEBUG fetchPolicies] Response headers:', response.headers)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DEBUG fetchPolicies] Error response body:', errorText)
      throw new Error(`Failed to fetch policies: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[DEBUG fetchPolicies] Response data:', data)
    console.log('[DEBUG fetchPolicies] Data type:', typeof data)
    console.log('[DEBUG fetchPolicies] Is array:', Array.isArray(data))

    // Handle both array response and paginated response
    if (Array.isArray(data)) {
      // Simple array response from backend
      console.log('[DEBUG fetchPolicies] Processing as array, length:', data.length)
      const result = {
        data: data,
        items: data,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        total: data.length
      }
      console.log('[DEBUG fetchPolicies] Returning array result:', result)
      return result
    } else {
      // Paginated response with data/items property
      console.log('[DEBUG fetchPolicies] Processing as paginated response')
      console.log('[DEBUG fetchPolicies] data.data:', data.data)
      console.log('[DEBUG fetchPolicies] data.items:', data.items)
      const result = {
        data: data.data || data.items || [],
        items: data.items || data.data || [],
        page: data.page || params.page || 1,
        pageSize: data.pageSize || params.pageSize || 20,
        total: data.total || 0
      }
      console.log('[DEBUG fetchPolicies] Returning paginated result:', result)
      return result
    }
  } catch (error) {
    console.error('[DEBUG fetchPolicies] Caught error:', error)
    throw error
  }
}

export async function fetchPolicyById(id: string): Promise<Policy> {
  const response = await apiFetch(`/api/policies/${id}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch policy: ${response.status}`)
  }

  return response.json()
}

