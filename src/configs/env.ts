// Environment Configuration
// Helper function to get first available URL from multiple options
const getFirstAvailableUrl = (envValue: string | undefined, fallback: string): string => {
  if (!envValue) return fallback
  
  // Split by || and get the first non-empty URL
  const urls = envValue.split('||').map(url => url.trim()).filter(url => url)
  return urls[0] || fallback
}

// Helper function to get URL based on environment
const getUrlByEnvironment = (devUrl: string, prodUrl: string | undefined): string => {
  const isProd = import.meta.env.PROD
  return isProd && prodUrl ? prodUrl : devUrl
}

// Helper function to get URL with fallback options
const getUrlWithFallback = (primaryUrl: string, fallbackUrl: string): string => {
  // You can set this to 'local' or 'deployed' to switch between environments
  const preferredEnvironment = import.meta.env.VITE_PREFERRED_ENVIRONMENT || 'deployed'
  
  if (preferredEnvironment === 'local') {
    return primaryUrl
  } else {
    return fallbackUrl
  }
}

export const ENV_CONFIG = {
  // API Configuration (Port 7029 - Primary - Backend đang chạy)
  API_BASE_URL: getUrlWithFallback(
    'http://localhost:7029',
    'http://20.243.177.81:7029'
  ),
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  // Secondary API Configuration (Port 5041 - Backup)
  SECONDARY_API_BASE_URL: getUrlWithFallback(
    'http://localhost:5041',
    'http://20.243.177.81:5041'
  ),
  SECONDARY_API_TIMEOUT: parseInt(import.meta.env.VITE_SECONDARY_API_TIMEOUT || '30000'),

  // SignalR Configuration (Port 7029 - Primary - Backend đang chạy)
  SIGNALR_HUB_URL: getUrlWithFallback(
    'http://localhost:7029/taskHub',
    'http://20.243.177.81:7029/taskHub'
  ),
  SIGNALR_RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_SIGNALR_RECONNECT_INTERVAL || '5000'),
  SIGNALR_MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_SIGNALR_MAX_RECONNECT_ATTEMPTS || '5'),

  // Secondary SignalR Configuration (Port 5041 - Backup)
  SECONDARY_SIGNALR_HUB_URL: getUrlWithFallback(
    'http://localhost:5041/taskHub',
    'http://20.243.177.81:5041/taskHub'
  ),

  // Development Server
  DEV_SERVER_PORT: parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '3000'),

  // GitHub OAuth
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  GITHUB_REDIRECT_URI: import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:3000/github/callback',

  // Feature Flags
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  ENABLE_SIGNALR: import.meta.env.VITE_ENABLE_SIGNALR !== 'false',
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