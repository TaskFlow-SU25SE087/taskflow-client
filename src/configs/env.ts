// Environment Configuration
export const ENV_CONFIG = {
  // ========================================
  // DEVELOPMENT SERVER CONFIGURATION
  // ========================================
  DEV_SERVER_PORT: parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '3000'),

  // ========================================
  // API CONFIGURATION (Cổng duy nhất)
  // ========================================
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  // ========================================
  // SIGNALR CONFIGURATION (Cổng duy nhất)
  // ========================================
  SIGNALR_HUB_URL: import.meta.env.VITE_SIGNALR_HUB_URL || '',
  SIGNALR_RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_SIGNALR_RECONNECT_INTERVAL || '5000'),
  SIGNALR_MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_SIGNALR_MAX_RECONNECT_ATTEMPTS || '5'),

  // ========================================
  // GITHUB OAUTH CONFIGURATION
  // ========================================
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  GITHUB_REDIRECT_URI: import.meta.env.VITE_GITHUB_REDIRECT_URI || '',

  // ========================================
  // FEATURE FLAGS & DEBUGGING
  // ========================================
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  ENABLE_SIGNALR: import.meta.env.VITE_ENABLE_SIGNALR !== 'false',

  // ========================================
  // STORAGE KEYS
  // ========================================
  ACCESS_TOKEN_KEY: import.meta.env.VITE_ACCESS_TOKEN_KEY || 'accessToken',
  REMEMBER_ME_KEY: import.meta.env.VITE_REMEMBER_ME_KEY || 'rememberMe',

  // ========================================
  // ENVIRONMENT
  // ========================================
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD
}

// Log the configuration for debugging
console.log('[ENV_CONFIG] Environment configuration loaded:', {
  API_BASE_URL: ENV_CONFIG.API_BASE_URL,
  SIGNALR_HUB_URL: ENV_CONFIG.SIGNALR_HUB_URL,
  DEV_SERVER_PORT: ENV_CONFIG.DEV_SERVER_PORT,
  IS_DEVELOPMENT: ENV_CONFIG.IS_DEVELOPMENT,
  ENABLE_DEBUG_LOGS: ENV_CONFIG.ENABLE_DEBUG_LOGS,
  ENABLE_SIGNALR: ENV_CONFIG.ENABLE_SIGNALR
});

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