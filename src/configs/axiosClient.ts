import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ENV_CONFIG } from './env'

// Removed unused getBaseURL function

const axiosClient = axios.create({
  baseURL: 'http://localhost:7029', // Default fallback
  timeout: ENV_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Secondary axios client for port 7029
const secondaryAxiosClient = axios.create({
  baseURL: 'http://localhost:5041', // Default fallback
  timeout: ENV_CONFIG.SECONDARY_API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Function to update baseURL after URL Manager is initialized
export const updateAxiosBaseURL = () => {
  const newBaseURL = ENV_CONFIG.API_BASE_URL
  const newSecondaryBaseURL = ENV_CONFIG.SECONDARY_API_BASE_URL
  
  console.log('[AXIOS] Updating baseURL to:', newBaseURL)
  console.log('[AXIOS] Updating secondary baseURL to:', newSecondaryBaseURL)
  
  axiosClient.defaults.baseURL = newBaseURL
  secondaryAxiosClient.defaults.baseURL = newSecondaryBaseURL
}

// Helper function to show timeout notification
const showTimeoutNotification = (url: string) => {
  console.warn(`⏰ [axiosClient] Request timeout for: ${url}`)
  // Note: Toast notifications should be handled in the component level
  // where the API call is made, not in the axios interceptor
}

// Request interceptor for primary client
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only log in development
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      console.log('🌐 [axiosClient] Request interceptor called')
      console.log('📤 [axiosClient] Request URL:', config.url)
      console.log('📤 [axiosClient] Request method:', config.method?.toUpperCase())
      console.log('📤 [axiosClient] Request headers:', config.headers)
      console.log('📤 [axiosClient] Request data:', config.data)
    }

    // Get access token from storage
    const rememberMe = localStorage.getItem('rememberMe') === 'true'
    const accessToken = rememberMe 
      ? localStorage.getItem('accessToken') 
      : sessionStorage.getItem('accessToken')

    if (accessToken) {
      if (ENV_CONFIG.IS_DEVELOPMENT) {
        console.log('🔑 [axiosClient] Adding Authorization header with token')
      }
      config.headers.Authorization = `Bearer ${accessToken}`
    } else {
      if (ENV_CONFIG.IS_DEVELOPMENT) {
        console.log('⚠️ [axiosClient] No access token found in storage')
      }
    }

    if (ENV_CONFIG.IS_DEVELOPMENT) {
      console.log('📤 [axiosClient] Final request config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ [axiosClient] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Request interceptor for secondary client
secondaryAxiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('🌐 [secondaryAxiosClient] Request interceptor called')
    console.log('📤 [secondaryAxiosClient] Request URL:', config.url)
    console.log('📤 [secondaryAxiosClient] Request method:', config.method?.toUpperCase())

    // Get access token from session storage
    const accessToken = sessionStorage.getItem('accessToken')

    if (accessToken) {
      console.log('🔑 [secondaryAxiosClient] Adding Authorization header with token')
      config.headers.Authorization = `Bearer ${accessToken}`
    } else {
      console.log('⚠️ [secondaryAxiosClient] No access token found in session storage')
    }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ [secondaryAxiosClient] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for primary client
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      console.log('✅ [axiosClient] Response interceptor called')
      console.log('📥 [axiosClient] Response URL:', response.config.url)
      console.log('📥 [axiosClient] Response status:', response.status)
      console.log('📥 [axiosClient] Response headers:', response.headers)
      console.log('📥 [axiosClient] Response data:', response.data)
    }
    return response
  },
  (error: AxiosError) => {
    console.error('❌ [axiosClient] Response interceptor error:', error)

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('⏰ [axiosClient] Request timeout detected')
      showTimeoutNotification(error.config?.url || 'unknown')
      
      // Return a more user-friendly error
      return Promise.reject({
        ...error,
        message: 'Request timeout. Please check your connection and try again.',
        isTimeout: true
      })
    }

    if (error.response) {
      const { status, data } = error.response
      console.error('📡 [axiosClient] Error response status:', status)
      console.error('📡 [axiosClient] Error response data:', data)

      if (status === 401) {
        console.error('🔒 [axiosClient] Unauthorized - removing token')
        localStorage.removeItem('accessToken')
        sessionStorage.removeItem('accessToken')
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      } else if (status === 403) {
        console.error('🚫 [axiosClient] Forbidden - You do not have permission to perform this action.')
      } else if (status === 500) {
        console.error('💥 [axiosClient] Internal server error. Please try again later.')
      }
    } else if (error.request) {
      console.error('🌐 [axiosClient] Network error - No response received:', error.request)
      
      // Check if it's a localhost connection in production
      if (ENV_CONFIG.IS_PRODUCTION && error.config?.url?.includes('localhost')) {
        console.error('🚨 [axiosClient] Production environment trying to connect to localhost. Check your API_BASE_URL configuration.')
      }
    } else {
      console.error('⚙️ [axiosClient] Request setup error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Response interceptor for secondary client
secondaryAxiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ [secondaryAxiosClient] Response interceptor called')
    console.log('📥 [secondaryAxiosClient] Response URL:', response.config.url)
    console.log('📥 [secondaryAxiosClient] Response status:', response.status)
    return response
  },
  (error: AxiosError) => {
    console.error('❌ [secondaryAxiosClient] Response interceptor error:', error)

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('⏰ [secondaryAxiosClient] Request timeout detected')
      showTimeoutNotification(error.config?.url || 'unknown')
      
      return Promise.reject({
        ...error,
        message: 'Request timeout. Please check your connection and try again.',
        isTimeout: true
      })
    }

    if (error.response) {
      const { status, data } = error.response
      console.error('📡 [secondaryAxiosClient] Error response status:', status)
      console.error('📡 [secondaryAxiosClient] Error response data:', data)

      if (status === 401) {
        console.error('🔒 [secondaryAxiosClient] Unauthorized - removing token')
        localStorage.removeItem('token')
      } else if (status === 403) {
        console.error('🚫 [secondaryAxiosClient] Forbidden - You do not have permission to perform this action.')
      } else if (status === 500) {
        console.error('💥 [secondaryAxiosClient] Internal server error. Please try again later.')
      }
    } else if (error.request) {
      console.error('🌐 [secondaryAxiosClient] Network error - No response received:', error.request)
    } else {
      console.error('⚙️ [secondaryAxiosClient] Request setup error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default axiosClient
export { secondaryAxiosClient }
