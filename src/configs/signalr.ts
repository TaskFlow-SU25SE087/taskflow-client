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
  isRead: boolean
  createdAt: string
}

export class SignalRService {
  private connection: signalR.HubConnection | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private signalREnabled = ENV_CONFIG.ENABLE_SIGNALR

  async connect() {
    // Disable SignalR if not enabled or in production without proper server
    if (!this.signalREnabled) {
      console.log('[SignalR] SignalR is disabled')
      return
    }

    // Check if we're in production and don't have a proper SignalR server
    if (ENV_CONFIG.IS_PRODUCTION && SIGNALR_CONFIG.HUB_URL.includes('localhost')) {
      console.warn('[SignalR] Production environment detected but SignalR server is localhost. Disabling SignalR.')
      this.signalREnabled = false
      return
    }

    if (this.isConnecting) return
    this.isConnecting = true
    
    try {
      console.log('[SignalR] Đang kết nối tới:', SIGNALR_CONFIG.HUB_URL)
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_CONFIG.HUB_URL, {
          accessTokenFactory: () => {
            const rememberMe = localStorage.getItem('rememberMe') === 'true'
            return rememberMe ? localStorage.getItem('accessToken') || '' : sessionStorage.getItem('accessToken') || ''
          },
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning) // Change from Debug to Warning for production
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

  async disconnect() {
    if (this.connection) {
      console.log('[SignalR] Ngắt kết nối SignalR')
      await this.connection.stop()
      this.connection = null
    }
  }

  private handleReconnect() {
    if (!this.signalREnabled) return
    
    if (this.reconnectAttempts < SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++
      SignalRErrorHandler.handleReconnectionAttempt(this.reconnectAttempts, SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS)
      setTimeout(() => this.connect(), SIGNALR_CONFIG.RECONNECT_INTERVAL)
    } else {
      console.warn('[SignalR] Max reconnection attempts reached. Disabling SignalR.')
      this.signalREnabled = false
    }
  }

  private registerEventHandlers() {
    if (!this.connection) return

    // Connection state handlers
    this.connection.onclose((error?: any) => {
      console.log('🔌 SignalR disconnected', error)
    })

    this.connection.onreconnected((connectionId?: any) => {
      console.log('🔄 SignalR reconnected', connectionId)
    })

    this.connection.onreconnecting((error?: any) => {
      console.log('🔄 SignalR reconnecting...', error)
    })

    // Lắng nghe sự kiện ReceiveNotification
    this.connection.on('ReceiveNotification', (data: any) => {
      console.log('[SignalR] Nhận thông báo real-time:', data)
      // TODO: Xử lý hiển thị notification ở đây nếu cần
    })
  }

  async invokeMethod(methodName: string, ...args: any[]) {
    if (!this.connection || !this.signalREnabled) {
      throw new Error('SignalR connection not established or disabled')
    }
    try {
      console.log(`[SignalR] Gọi method: ${methodName}`, ...args)
      return await this.connection.invoke(methodName, ...args)
    } catch (error) {
      SignalRErrorHandler.handleMethodError(error, methodName)
      console.error(`[SignalR] Lỗi khi gọi method: ${methodName}`, error)
      throw error
    }
  }

  async joinProjectGroup(projectId: string) {
    if (!this.isConnected() || !this.signalREnabled) {
      console.warn('SignalR chưa kết nối hoặc bị disable, không thể join group')
      return
    }
    try {
      return await this.invokeMethod('JoinProjectGroup', projectId)
    } catch (error) {
      SignalRErrorHandler.handleProjectGroupError(error, projectId, 'join')
      throw error
    }
  }

  async leaveProjectGroup(projectId: string) {
    if (!this.isConnected() || !this.signalREnabled) {
      console.warn('SignalR chưa kết nối hoặc bị disable, không thể leave group')
      return
    }
    try {
      return await this.invokeMethod('LeaveProjectGroup', projectId)
    } catch (error) {
      SignalRErrorHandler.handleProjectGroupError(error, projectId, 'leave')
      throw error
    }
  }

  on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.connection || !this.signalREnabled) {
      console.warn('SignalR connection not established or disabled, cannot register event listener')
      return
    }
    this.connection.on(eventName, callback)
  }

  off(eventName: string, callback?: (...args: any[]) => void) {
    if (!this.connection) return
    if (callback) {
      this.connection.off(eventName, callback)
    } else {
      this.connection.off(eventName)
    }
  }

  getConnectionState() {
    return this.connection?.state || 'Disconnected'
  }

  isConnected() {
    return this.connection?.state === 'Connected'
  }

  isEnabled() {
    return this.signalREnabled
  }
}

