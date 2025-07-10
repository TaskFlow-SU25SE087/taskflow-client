import { SignalRErrorHandler } from '@/utils/signalRErrorHandler'
import * as signalR from '@microsoft/signalr'

export const SIGNALR_CONFIG = {
  HUB_URL: 'http://localhost:5041/taskhub',
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5
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

  async connect() {
    if (this.isConnecting) return
    this.isConnecting = true
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_CONFIG.HUB_URL, {
          accessTokenFactory: () => {
            const rememberMe = localStorage.getItem('rememberMe') === 'true'
            return rememberMe 
              ? localStorage.getItem('accessToken') || ''
              : sessionStorage.getItem('accessToken') || ''
          }
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Debug)
        .build()

      // Register event handlers
      this.registerEventHandlers()
      
      console.log('[SignalR] Đang kết nối tới:', SIGNALR_CONFIG.HUB_URL)
      await this.connection.start()
      console.log('✅ SignalR Connected!')
      this.reconnectAttempts = 0
    } catch (error) {
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
    if (this.reconnectAttempts < SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++
      SignalRErrorHandler.handleReconnectionAttempt(this.reconnectAttempts, SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS)
      setTimeout(() => this.connect(), SIGNALR_CONFIG.RECONNECT_INTERVAL)
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
    if (!this.connection) {
      throw new Error('SignalR connection not established')
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
    if (!this.isConnected()) {
      console.warn('SignalR chưa kết nối, không thể join group')
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
    if (!this.isConnected()) {
      console.warn('SignalR chưa kết nối, không thể leave group')
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
    if (!this.connection) {
      console.warn('SignalR connection not established, cannot register event listener')
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
}