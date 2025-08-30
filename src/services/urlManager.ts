// URL Manager Service - Simplified for single API
class UrlManager {
  private static instance: UrlManager
  private isInitialized = false

  private constructor() {}

  static getInstance(): UrlManager {
    if (!UrlManager.instance) {
      UrlManager.instance = new UrlManager()
    }
    return UrlManager.instance
  }

  // Initialize URL manager (simplified)
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('[URLManager] Initializing URL manager...')
    this.isInitialized = true
    console.log('[URLManager] URL manager initialized')
  }

  // Get current URL for a specific service (not used in single API setup)
  getUrl(_serviceName: string): string {
    return ''
  }

  // Get all current URLs (not used in single API setup)
  getAllUrls(): Record<string, string> {
    return {}
  }

  // Force refresh URLs (not used in single API setup)
  async refresh(): Promise<void> {
    this.isInitialized = false
    await this.initialize()
  }

  // Check if a specific service has available URLs (not used in single API setup)
  hasAvailableUrls(_serviceName: string): boolean {
    return false
  }
}

export default UrlManager 