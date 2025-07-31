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
  private failedUrls: Set<string> = new Set()

  private constructor() {}

  static getInstance(): UrlManager {
    if (!UrlManager.instance) {
      UrlManager.instance = new UrlManager()
    }
    return UrlManager.instance
  }

  // Check if a URL is available
  private async checkUrlAvailability(url: string): Promise<boolean> {
    // Skip URLs that have failed too many times
    if (this.failedUrls.has(url)) {
      console.log(`[URLManager] Skipping failed URL: ${url}`)
      return false
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
      
      // Try different endpoints for health check
      const endpoints = ['/health', '/api/health', '/', '/api', '/swagger/index.html']
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
      
      if (!isAvailable) {
        console.log(`[URLManager] URL ${url} is not available`)
        this.failedUrls.add(url)
      }
      
      return isAvailable
    } catch (error) {
      console.log(`[URLManager] URL ${url} is not available:`, error)
      this.failedUrls.add(url)
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
    
    // If none available, return localhost as fallback
    const localhostUrl = urls.find(url => url.includes('localhost'))
    if (localhostUrl) {
      console.log(`[URLManager] No URLs available, using localhost fallback: ${localhostUrl}`)
      return localhostUrl
    }
    
    // If no localhost found, return the first one as fallback
    console.warn(`[URLManager] No URLs available, using fallback: ${urls[0]}`)
    return urls[0]
  }

  // Get multiple URLs to try for each service
  private getUrlsForService(serviceName: string): string[] {
    const urlSets = {
      'API_BASE_URL': [
        'http://20.243.177.81:7029',
        'http://localhost:7029',
        'http://localhost:5041'
      ],
      'SECONDARY_API_BASE_URL': [
        'http://localhost:5041',
        'http://20.243.177.81:7029',
        'http://localhost:7029'
      ],
      'SIGNALR_HUB_URL': [
        'http://20.243.177.81:7029/taskHub',
        'http://localhost:7029/taskHub',
        'http://localhost:5041/taskHub'
      ],
      'SECONDARY_SIGNALR_HUB_URL': [
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
        primary: 'http://localhost:5041',
        fallback: 'http://20.243.177.81:7029'
      },
      {
        name: 'SIGNALR_HUB_URL',
        primary: 'http://20.243.177.81:7029/taskHub',
        fallback: 'http://localhost:7029/taskHub'
      },
      {
        name: 'SECONDARY_SIGNALR_HUB_URL',
        primary: 'http://localhost:5041/taskHub',
        fallback: 'http://20.243.177.81:7029/taskHub'
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
    this.failedUrls.clear() // Clear failed URLs cache
    await this.initialize()
  }

  // Check if a specific service has available URLs
  hasAvailableUrls(serviceName: string): boolean {
    const urls = this.getUrlsForService(serviceName)
    return urls.some(url => !this.failedUrls.has(url))
  }
}

export default UrlManager 