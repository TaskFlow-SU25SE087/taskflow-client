import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ENV_CONFIG } from './env'

const axiosClient = axios.create({
  // Set immediately from env to avoid race conditions on first requests
  baseURL: ENV_CONFIG.API_BASE_URL,
  timeout: ENV_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Prevent multiple simultaneous 401 redirects causing reload loops
let isHandlingUnauthorized = false

// Function to update baseURL after URL Manager is initialized
export const updateAxiosBaseURL = () => {
  const newBaseURL = ENV_CONFIG.API_BASE_URL

  console.log('[AXIOS] Updating baseURL to:', newBaseURL)

  axiosClient.defaults.baseURL = newBaseURL
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

    // Get access token from storage (prefer persistent localStorage, fallback to sessionStorage)
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

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

// Response interceptor for primary client
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Detect cases where a frontend HTML page is returned instead of JSON (common when baseURL is wrong)
    const contentType = (response.headers as any)['content-type'] || (response.headers as any)['Content-Type']
    const looksLikeHtml = typeof response.data === 'string' && /<!doctype html>|<html[\s\S]*>/i.test(response.data)
    if ((contentType && String(contentType).includes('text/html')) || looksLikeHtml) {
      const url = response.config?.url || 'unknown'
      console.error(
        '🚨 [axiosClient] HTML response detected for API request. Check API_BASE_URL or proxy configuration. URL:',
        url
      )
      return Promise.reject({
        message: 'Received HTML instead of JSON from API. Check API_BASE_URL.',
        isHtmlResponse: true,
        url
      })
    }
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
      const { status, data } = error.response as any
      console.error('📡 [axiosClient] Error response status:', status)
      console.error('📡 [axiosClient] Error response data:', data)

      if (status === 401) {
        const url = error.config?.url || ''
        const apiCode = data?.code
        const message: string = (data?.message || '').toString().toLowerCase()

        const isLoginRequest = url.includes('/auth/login')
        const isAuthMe = url.includes('/auth/me')
        const isTokenRefresh = url.includes('/auth/token/refresh')

        // Heuristic: backend returns code 9002 and message 'Unauthorized access' for resource-level auth
        const looksLikeResourceUnauthorized = apiCode === 9002 || message.includes('unauthorized access')

        if (looksLikeResourceUnauthorized || isLoginRequest) {
          // Do not nuke tokens or redirect; let the caller handle (e.g., show empty state)
          if (ENV_CONFIG.IS_DEVELOPMENT) {
            console.warn('🔐 [axiosClient] 401 treated as resource-level unauthorized; no redirect.')
          }
        } else if (isAuthMe || isTokenRefresh) {
          // Token invalid/expired or refresh failed: clear and soft-redirect
          if (!isHandlingUnauthorized) {
            isHandlingUnauthorized = true
            try {
              delete axiosClient.defaults.headers.common['Authorization']
            } catch {}
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('currentProjectId')
            sessionStorage.removeItem('accessToken')
            sessionStorage.removeItem('auth_user')
            sessionStorage.removeItem('otp_verified')
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.replace('/login')
            }
            // allow future 401s to be handled again after navigation settles
            setTimeout(() => {
              isHandlingUnauthorized = false
            }, 1500)
          }
        } else {
          // Generic 401 from other endpoints: do not redirect; surface error only
          if (ENV_CONFIG.IS_DEVELOPMENT) {
            console.warn('🔐 [axiosClient] Generic 401 on', url, '- passing error through without redirect.')
          }
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
        console.error(
          '🚨 [axiosClient] Production environment trying to connect to localhost. Check your API_BASE_URL configuration.'
        )
      }
    } else {
      console.error('⚙️ [axiosClient] Request setup error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default axiosClient
