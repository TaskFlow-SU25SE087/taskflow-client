import { SignalRErrorHandler } from '@/utils/signalRErrorHandler'
import * as signalR from '@microsoft/signalr'
import { ENV_CONFIG } from './env'

export const SIGNALR_CONFIG = {
  HUB_URL: ENV_CONFIG.SIGNALR_HUB_URL,
  RECONNECT_INTERVAL: ENV_CONFIG.SIGNALR_RECONNECT_INTERVAL,
  MAX_RECONNECT_ATTEMPTS: ENV_CONFIG.SIGNALR_MAX_RECONNECT_ATTEMPTS
}

export const SECONDARY_SIGNALR_CONFIG = {
  HUB_URL: ENV_CONFIG.SECONDARY_SIGNALR_HUB_URL,
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
  private secondaryConnection: signalR.HubConnection | null = null
  private reconnectAttempts = 0
  private secondaryReconnectAttempts = 0
  private isConnecting = false
  private isSecondaryConnecting = false
  private signalREnabled = ENV_CONFIG.ENABLE_SIGNALR

  async connect() {
    // Disable SignalR if not enabled
    if (!this.signalREnabled) {
      console.log('[SignalR] SignalR is disabled')
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
      console.error('[SignalR] Primary connection failed, trying secondary...')
      // Try secondary connection if primary fails
      await this.trySecondaryConnection()
    } finally {
      this.isConnecting = false
    }
  }

  private async trySecondaryConnection() {
    try {
      console.log('[SignalR] Trying secondary connection to:', SECONDARY_SIGNALR_CONFIG.HUB_URL)
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SECONDARY_SIGNALR_CONFIG.HUB_URL, {
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
      console.log('✅ Secondary SignalR Connected!')
      this.reconnectAttempts = 0
    } catch (error) {
      console.error('[SignalR] Secondary connection also failed:', error)
      SignalRErrorHandler.handleConnectionError(error, this)
      this.handleReconnect()
    }
  }

  async connectSecondary() {
    if (this.isSecondaryConnecting) return
    this.isSecondaryConnecting = true
    try {
      this.secondaryConnection = new signalR.HubConnectionBuilder()
        .withUrl(SECONDARY_SIGNALR_CONFIG.HUB_URL, {
          accessTokenFactory: () => {
            const rememberMe = localStorage.getItem('rememberMe') === 'true'
            return rememberMe ? localStorage.getItem('accessToken') || '' : sessionStorage.getItem('accessToken') || ''
          }
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Debug)
        .build()

      // Register secondary event handlers
      this.registerSecondaryEventHandlers()

      console.log('[Secondary SignalR] Đang kết nối tới:', SECONDARY_SIGNALR_CONFIG.HUB_URL)
      await this.secondaryConnection.start()
      console.log('✅ Secondary SignalR Connected!')
      this.secondaryReconnectAttempts = 0
    } catch (error) {
      SignalRErrorHandler.handleConnectionError(error, this)
      this.handleSecondaryReconnect()
    } finally {
      this.isSecondaryConnecting = false
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }
    if (this.secondaryConnection) {
      await this.secondaryConnection.stop()
      this.secondaryConnection = null
    }
  }

  private handleReconnect() {
    if (!this.signalREnabled) return
    
    if (this.reconnectAttempts < SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++
      console.log(`🔄 [SignalR] Reconnecting... Attempt ${this.reconnectAttempts}/${SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS}`)
      setTimeout(() => {
        this.connect()
      }, SIGNALR_CONFIG.RECONNECT_INTERVAL)
    } else {
      console.error('❌ [SignalR] Max reconnection attempts reached')
    }
  }

  private handleSecondaryReconnect() {
    if (this.secondaryReconnectAttempts < SECONDARY_SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.secondaryReconnectAttempts++
      console.log(`🔄 [Secondary SignalR] Reconnecting... Attempt ${this.secondaryReconnectAttempts}/${SECONDARY_SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS}`)
      setTimeout(() => {
        this.connectSecondary()
      }, SECONDARY_SIGNALR_CONFIG.RECONNECT_INTERVAL)
    } else {
      console.error('❌ [Secondary SignalR] Max reconnection attempts reached')
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

  private registerSecondaryEventHandlers() {
    if (!this.secondaryConnection) return

    this.secondaryConnection.onclose(() => {
      console.log('🔌 [Secondary SignalR] Connection closed')
      this.handleSecondaryReconnect()
    })

    this.secondaryConnection.onreconnecting(() => {
      console.log('🔄 [Secondary SignalR] Reconnecting...')
    })

    this.secondaryConnection.onreconnected(() => {
      console.log('✅ [Secondary SignalR] Reconnected!')
      this.secondaryReconnectAttempts = 0
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

  async invokeSecondary(method: string, ...args: any[]) {
    if (this.secondaryConnection) {
      return await this.secondaryConnection.invoke(method, ...args)
    }
    throw new Error('Secondary SignalR connection not available')
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }

  isSecondaryConnected(): boolean {
    return this.secondaryConnection?.state === signalR.HubConnectionState.Connected
  }

  isEnabled() {
    return this.signalREnabled
  }
}

