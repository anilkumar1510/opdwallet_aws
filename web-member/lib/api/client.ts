import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

/**
 * Base API client with axios
 * Handles authentication, error handling, and request/response interceptors
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies for auth
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Optional: Add auth token if using bearer tokens
    // const token = localStorage.getItem('authToken')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common HTTP errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      // Forbidden - access denied
      console.error('[API] Access denied:', error.response.data)
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('[API] Server error:', error.response.data)
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('[API] Request timeout')
    }

    return Promise.reject(error)
  }
)

export default apiClient
