// Environment Configuration
import UrlManager from '../services/urlManager'

// Get URL with automatic fallback
const getUrlWithFallback = (primaryUrl: string, fallbackUrl: string): string => {
  const urlManager = UrlManager.getInstance()
  const serviceName = primaryUrl.includes('taskHub') ? 'SIGNALR_HUB_URL' : 'API_BASE_URL'
  
  // Try to get from URL manager first
  const managedUrl = urlManager.getUrl(serviceName)
  if (managedUrl) {
    console.log(`[ENV_CONFIG] Using URL from manager for ${serviceName}: ${managedUrl}`)
    return managedUrl
  }
  
  // If URL manager not initialized yet, use fallback
  console.log(`[ENV_CONFIG] URL manager not ready for ${serviceName}, using fallback: ${fallbackUrl}`)
  return fallbackUrl
}

// Check if we should disable SignalR based on environment
const shouldDisableSignalR = (): boolean => {
  // Disable SignalR if explicitly set to false
  if (import.meta.env.VITE_ENABLE_SIGNALR === 'false') {
    return true
  }
  
  // Enable SignalR by default since server is available
  // Only disable if explicitly set to false
  return false
}

export const ENV_CONFIG = {
  // API Configuration (Port 7029 - Primary - Backend đang chạy)
  API_BASE_URL: getUrlWithFallback(
    'http://20.243.177.81:7029',
    'http://20.243.177.81:7029'
  ),
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  // Secondary API Configuration (Port 5041 - Backup)
  SECONDARY_API_BASE_URL: getUrlWithFallback(
    'http://localhost:5041',
    'http://localhost:5041'
  ),
  SECONDARY_API_TIMEOUT: parseInt(import.meta.env.VITE_SECONDARY_API_TIMEOUT || '30000'),

  // SignalR Configuration (Port 7029 - Primary - Backend đang chạy)
  SIGNALR_HUB_URL: getUrlWithFallback(
    'http://20.243.177.81:7029/taskHub',
    'http://20.243.177.81:7029/taskHub'
  ),
  SIGNALR_RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_SIGNALR_RECONNECT_INTERVAL || '5000'),
  SIGNALR_MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_SIGNALR_MAX_RECONNECT_ATTEMPTS || '5'),

  // Secondary SignalR Configuration (Port 5041 - Backup)
  SECONDARY_SIGNALR_HUB_URL: getUrlWithFallback(
    'http://localhost:5041/taskHub',
    'http://localhost:5041/taskHub'
  ),

  // Development Server
  DEV_SERVER_PORT: parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '3000'),

  // GitHub OAuth
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  GITHUB_REDIRECT_URI: import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:3000/github/callback',

  // Feature Flags
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  ENABLE_SIGNALR: !shouldDisableSignalR(),
  ENABLE_SECONDARY_API: import.meta.env.VITE_ENABLE_SECONDARY_API === 'true',

  // Storage Keys
  ACCESS_TOKEN_KEY: import.meta.env.VITE_ACCESS_TOKEN_KEY || 'accessToken',
  REMEMBER_ME_KEY: import.meta.env.VITE_REMEMBER_ME_KEY || 'rememberMe',

  // Environment
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD
}

// Helper functions
export const isDevelopment = () => ENV_CONFIG.IS_DEVELOPMENT
export const isProduction = () => ENV_CONFIG.IS_PRODUCTION
export const isDebugEnabled = () => ENV_CONFIG.ENABLE_DEBUG_LOGS
export const isSignalREnabled = () => ENV_CONFIG.ENABLE_SIGNALR

// Debug logging
export const debugLog = (message: string, ...args: any[]) => {
  if (isDebugEnabled()) {
    console.log(`[DEBUG] ${message}`, ...args)
  }
}

export const debugError = (message: string, ...args: any[]) => {
  if (isDebugEnabled()) {
    console.error(`[DEBUG ERROR] ${message}`, ...args)
  }
} 