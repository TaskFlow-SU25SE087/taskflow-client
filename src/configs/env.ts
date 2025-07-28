// Environment Configuration
// Helper function to get first available URL from multiple options
const getFirstAvailableUrl = (envValue: string | undefined, fallback: string): string => {
  if (!envValue) return fallback
  
  // Split by || and get the first non-empty URL
  const urls = envValue.split('||').map(url => url.trim()).filter(url => url)
  return urls[0] || fallback
}

// Get production URLs based on environment
const getProductionUrls = () => {
  const isProd = import.meta.env.PROD
  
  // Always use the configured API URL from environment variables
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  const signalRHubUrl = import.meta.env.VITE_SIGNALR_HUB_URL
  
  if (isProd && apiBaseUrl) {
    return {
      apiUrl: apiBaseUrl,
      signalRUrl: signalRHubUrl || `${apiBaseUrl}/taskHub`,
      githubRedirect: import.meta.env.VITE_GITHUB_REDIRECT_URI || ''
    }
  }
  
  return {
    apiUrl: 'http://localhost:7029',
    signalRUrl: 'http://localhost:7029/taskHub',
    githubRedirect: 'http://localhost:3000/github/callback'
  }
}

const productionUrls = getProductionUrls()

export const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: getFirstAvailableUrl(import.meta.env.VITE_API_BASE_URL, productionUrls.apiUrl),
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),

  // SignalR Configuration
  SIGNALR_HUB_URL: getFirstAvailableUrl(import.meta.env.VITE_SIGNALR_HUB_URL, productionUrls.signalRUrl),
  SIGNALR_RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_SIGNALR_RECONNECT_INTERVAL || '5000'),
  SIGNALR_MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_SIGNALR_MAX_RECONNECT_ATTEMPTS || '5'),

  // Development Server
  DEV_SERVER_PORT: parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '3000'),

  // GitHub OAuth
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  GITHUB_REDIRECT_URI: getFirstAvailableUrl(import.meta.env.VITE_GITHUB_REDIRECT_URI, productionUrls.githubRedirect),

  // Feature Flags
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  ENABLE_SIGNALR: import.meta.env.VITE_ENABLE_SIGNALR !== 'false',

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