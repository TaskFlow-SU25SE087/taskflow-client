import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ENV_CONFIG } from './env'

const axiosClient = axios.create({
  baseURL: ENV_CONFIG.API_BASE_URL,
  timeout: ENV_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Request
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

// Response
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

export default axiosClient
