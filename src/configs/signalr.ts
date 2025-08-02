import { SignalRErrorHandler } from '@/utils/signalRErrorHandler'
import * as signalR from '@microsoft/signalr'
import { ENV_CONFIG } from './env'

export const SIGNALR_CONFIG = {
  HUB_URL: ENV_CONFIG.SIGNALR_HUB_URL,
  RECONNECT_INTERVAL: ENV_CONFIG.SIGNALR_RECONNECT_INTERVAL,
  MAX_RECONNECT_ATTEMPTS: ENV_CONFIG.SIGNALR_MAX_RECONNECT_ATTEMPTS
}



export interface NotificationData {
  id: string
  userId: string
  projectId: string
  taskId?: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export class SignalRService {
  private connection: signalR.HubConnection | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private signalREnabled = ENV_CONFIG.ENABLE_SIGNALR
  private connectionDisabled = false

  async connect() {
    // Disable SignalR if not enabled or if connection has been disabled due to failures
    if (!this.signalREnabled || this.connectionDisabled) {
      console.log('[SignalR] SignalR is disabled or connection disabled due to failures')
      return
    }

    // Check if we're in production and don't have a proper SignalR server
    if (ENV_CONFIG.IS_PRODUCTION && (SIGNALR_CONFIG.HUB_URL.includes('localhost') || !SIGNALR_CONFIG.HUB_URL)) {
      console.warn('[SignalR] Production environment detected but SignalR server is not properly configured. Disabling SignalR.')
      this.signalREnabled = false
      return
    }

    if (this.isConnecting) return
    this.isConnecting = true
    
    try {
      console.log('[SignalR] Environment:', ENV_CONFIG.IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT')
      console.log('[SignalR] Config HUB_URL:', SIGNALR_CONFIG.HUB_URL)
      console.log('[SignalR] ENV_CONFIG.SIGNALR_HUB_URL:', ENV_CONFIG.SIGNALR_HUB_URL)
      console.log('[SignalR] Đang kết nối tới:', SIGNALR_CONFIG.HUB_URL)
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_CONFIG.HUB_URL, {
          accessTokenFactory: () => {
            const rememberMe = localStorage.getItem('rememberMe') === 'true'
            return rememberMe ? localStorage.getItem('accessToken') || '' : sessionStorage.getItem('accessToken') || ''
          },
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build()

      // Register event handlers
      this.registerEventHandlers()

      await this.connection.start()
      console.log('✅ SignalR Connected!')
      this.reconnectAttempts = 0
    } catch (error) {
      console.error('[SignalR] Connection failed:', error)
      SignalRErrorHandler.handleConnectionError(error, this)
      this.handleReconnect()
    } finally {
      this.isConnecting = false
    }
  }

  // Secondary connection methods (disabled for single API setup)
  async connectSecondary() {
    console.log('[SignalR] Secondary connection is disabled in single API setup')
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }
  }

  private handleReconnect() {
    if (!this.signalREnabled || this.connectionDisabled) return
    
    if (this.reconnectAttempts < SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++
      console.log(`🔄 [SignalR] Reconnecting... Attempt ${this.reconnectAttempts}/${SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS}`)
      setTimeout(() => {
        this.connect()
      }, SIGNALR_CONFIG.RECONNECT_INTERVAL)
    } else {
      console.error('❌ [SignalR] Max reconnection attempts reached. Disabling SignalR to prevent endless retries.')
      this.connectionDisabled = true
      this.signalREnabled = false
    }
  }



  private registerEventHandlers() {
    if (!this.connection) return

    this.connection.onclose(() => {
      console.log('🔌 [SignalR] Connection closed')
      this.handleReconnect()
    })

    this.connection.onreconnecting(() => {
      console.log('🔄 [SignalR] Reconnecting...')
    })

    this.connection.onreconnected(() => {
      console.log('✅ [SignalR] Reconnected!')
      this.reconnectAttempts = 0
    })
  }



  on(event: string, callback: (...args: any[]) => void) {
    if (this.connection) {
      this.connection.on(event, callback)
    }
    if (this.secondaryConnection) {
      this.secondaryConnection.on(event, callback)
    }
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (this.connection) {
      this.connection.off(event, callback)
    }
    if (this.secondaryConnection) {
      this.secondaryConnection.off(event, callback)
    }
  }

  async invoke(method: string, ...args: any[]) {
    if (this.connection) {
      return await this.connection.invoke(method, ...args)
    }
    throw new Error('SignalR connection not available')
  }

  // Secondary methods (disabled for single API setup)
  async invokeSecondary(method: string, ...args: any[]) {
    throw new Error('Secondary SignalR connection is disabled in single API setup')
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }

  // Secondary connection check (disabled for single API setup)
  isSecondaryConnected(): boolean {
    return false
  }

  isEnabled() {
    return this.signalREnabled && !this.connectionDisabled
  }

  // Method to re-enable SignalR if needed
  reEnable() {
    this.connectionDisabled = false
    this.signalREnabled = true
    this.reconnectAttempts = 0
    this.secondaryReconnectAttempts = 0
  }
}

