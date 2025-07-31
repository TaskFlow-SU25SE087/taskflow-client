// URL Manager Service
// Manages automatic fallback between localhost and deployed backend

interface UrlConfig {
  primary: string
  fallback: string
  name: string
}

class UrlManager {
  private static instance: UrlManager
  private currentUrls: Map<string, string> = new Map()
  private isInitialized = false

  private constructor() {}

  static getInstance(): UrlManager {
    if (!UrlManager.instance) {
      UrlManager.instance = new UrlManager()
    }
    return UrlManager.instance
  }

  // Check if a URL is available
  private async checkUrlAvailability(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      // Try different endpoints for health check
      const endpoints = ['/health', '/api/health', '/', '/api']
      let isAvailable = false
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${url}${endpoint}`, {
            method: 'GET',
            signal: controller.signal
          })
          
          if (response.ok || response.status < 500) {
            isAvailable = true
            break
          }
        } catch (endpointError) {
          // Continue to next endpoint
          continue
        }
      }
      
      clearTimeout(timeoutId)
      return isAvailable
    } catch (error) {
      console.log(`[URLManager] URL ${url} is not available:`, error)
      return false
    }
  }

  // Get the first available URL from a list
  private async getFirstAvailableUrl(urls: string[]): Promise<string> {
    for (const url of urls) {
      if (await this.checkUrlAvailability(url)) {
        console.log(`[URLManager] Using available URL: ${url}`)
        return url
      }
    }
    
    // If none available, return the first one as fallback
    console.log(`[URLManager] No URLs available, using fallback: ${urls[0]}`)
    return urls[0]
  }

  // Get multiple URLs to try for each service
  private getUrlsForService(serviceName: string): string[] {
    const urlSets = {
      'API_BASE_URL': [
        'http://20.243.177.81:7029',
        'http://localhost:7029',
        'http://20.243.177.81:5041',
        'http://localhost:5041'
      ],
      'SECONDARY_API_BASE_URL': [
        'http://20.243.177.81:5041',
        'http://localhost:5041',
        'http://20.243.177.81:7029',
        'http://localhost:7029'
      ],
      'SIGNALR_HUB_URL': [
        'http://20.243.177.81:7029/taskHub',
        'http://localhost:7029/taskHub',
        'http://20.243.177.81:5041/taskHub',
        'http://localhost:5041/taskHub'
      ],
      'SECONDARY_SIGNALR_HUB_URL': [
        'http://20.243.177.81:5041/taskHub',
        'http://localhost:5041/taskHub',
        'http://20.243.177.81:7029/taskHub',
        'http://localhost:7029/taskHub'
      ]
    }
    
    return urlSets[serviceName as keyof typeof urlSets] || ['http://localhost:7029']
  }

  // Initialize URL manager
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('[URLManager] Initializing URL manager...')

    const urlConfigs: UrlConfig[] = [
      {
        name: 'API_BASE_URL',
        primary: 'http://20.243.177.81:7029',
        fallback: 'http://localhost:7029'
      },
      {
        name: 'SECONDARY_API_BASE_URL',
        primary: 'http://20.243.177.81:5041',
        fallback: 'http://localhost:5041'
      },
      {
        name: 'SIGNALR_HUB_URL',
        primary: 'http://20.243.177.81:7029/taskHub',
        fallback: 'http://localhost:7029/taskHub'
      },
      {
        name: 'SECONDARY_SIGNALR_HUB_URL',
        primary: 'http://20.243.177.81:5041/taskHub',
        fallback: 'http://localhost:5041/taskHub'
      }
    ]

    // Check availability for each URL configuration
    for (const config of urlConfigs) {
      const urlsToTry = this.getUrlsForService(config.name)
      const availableUrl = await this.getFirstAvailableUrl(urlsToTry)
      this.currentUrls.set(config.name, availableUrl)
    }

    this.isInitialized = true
    console.log('[URLManager] URL manager initialized:', Object.fromEntries(this.currentUrls))
  }

  // Get current URL for a specific service
  getUrl(serviceName: string): string {
    return this.currentUrls.get(serviceName) || ''
  }

  // Get all current URLs
  getAllUrls(): Record<string, string> {
    return Object.fromEntries(this.currentUrls)
  }

  // Force refresh URLs
  async refresh(): Promise<void> {
    this.isInitialized = false
    await this.initialize()
  }
}

export default UrlManager 