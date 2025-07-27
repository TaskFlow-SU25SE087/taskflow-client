import { SignalRService } from '@/configs/signalr'

export class SignalRErrorHandler {
  static handleConnectionError(error: any, signalRService: SignalRService) {
    console.error('❌ SignalR Connection Error:', error)

    // Auto reconnect
    setTimeout(() => {
      signalRService.connect()
    }, 5000)
  }

  static handleMethodError(error: any, methodName: string) {
    console.error(`❌ SignalR Method Error (${methodName}):`, error)
  }

  static handleNotificationError(error: any) {
    console.error('❌ Notification Error:', error)
  }

  static handleProjectGroupError(error: any, projectId: string, action: 'join' | 'leave') {
    console.error(`❌ Project Group Error (${action} ${projectId}):`, error)
  }

  static handleReconnectionAttempt(attemptNumber: number, maxAttempts: number) {
    console.log(`🔄 SignalR Reconnection attempt ${attemptNumber}/${maxAttempts}`)
  }

  static handleAuthenticationError() {
    console.error('❌ SignalR Authentication Error')
  }
}
