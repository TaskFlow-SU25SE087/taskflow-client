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

export const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: getUrlByEnvironment(
    getFirstAvailableUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:5041'),
    import.meta.env.VITE_PROD_API_BASE_URL
  ),
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  // Secondary API Configuration (Port 7029)
  SECONDARY_API_BASE_URL: getUrlByEnvironment(
    getFirstAvailableUrl(import.meta.env.VITE_SECONDARY_API_BASE_URL, 'http://localhost:7029'),
    import.meta.env.VITE_PROD_SECONDARY_API_BASE_URL
  ),
  SECONDARY_API_TIMEOUT: parseInt(import.meta.env.VITE_SECONDARY_API_TIMEOUT || '30000'),

  // SignalR Configuration
  SIGNALR_HUB_URL: getUrlByEnvironment(
    getFirstAvailableUrl(import.meta.env.VITE_SIGNALR_HUB_URL, 'http://localhost:5041/taskHub'),
    import.meta.env.VITE_PROD_SIGNALR_HUB_URL
  ),
  SIGNALR_RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_SIGNALR_RECONNECT_INTERVAL || '5000'),
  SIGNALR_MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_SIGNALR_MAX_RECONNECT_ATTEMPTS || '5'),

  // Secondary SignalR Configuration (Port 7029)
  SECONDARY_SIGNALR_HUB_URL: getUrlByEnvironment(
    getFirstAvailableUrl(import.meta.env.VITE_SECONDARY_SIGNALR_HUB_URL, 'http://localhost:7029/taskHub'),
    import.meta.env.VITE_PROD_SECONDARY_SIGNALR_HUB_URL
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