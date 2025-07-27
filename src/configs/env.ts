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
  const vercelUrl = import.meta.env.VITE_VERCEL_URL
  const customDomain = import.meta.env.VITE_CUSTOM_DOMAIN
  const azureApiUrl = import.meta.env.VITE_AZURE_API_URL
  const productionApiUrl = import.meta.env.VITE_PRODUCTION_API_URL
  
  if (isProd) {
    // Priority: Production API URL > Azure API URL > Custom Domain > Vercel URL
    if (productionApiUrl) {
      return {
        apiUrl: productionApiUrl,
        signalRUrl: `${productionApiUrl}/taskHub`,
        githubRedirect: customDomain ? `${customDomain}/github/callback` : (vercelUrl ? `https://${vercelUrl}/github/callback` : '')
      }
    }
    
    if (azureApiUrl) {
      return {
        apiUrl: azureApiUrl,
        signalRUrl: `${azureApiUrl}/taskHub`,
        githubRedirect: customDomain ? `${customDomain}/github/callback` : (vercelUrl ? `https://${vercelUrl}/github/callback` : '')
      }
    }
    
    // Use custom domain if available, otherwise use Vercel URL
    const baseUrl = customDomain || (vercelUrl ? `https://${vercelUrl}` : '')
    if (baseUrl) {
      return {
        apiUrl: `${baseUrl}/api`,
        signalRUrl: `${baseUrl}/api/taskHub`,
        githubRedirect: `${baseUrl}/github/callback`
      }
    }
  }
  
  return {
    apiUrl: 'http://localhost:5041',
    signalRUrl: 'http://localhost:5041/taskHub',
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