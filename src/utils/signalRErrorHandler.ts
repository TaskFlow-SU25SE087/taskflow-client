import { SignalRService } from '@/configs/signalr'
import { toast } from '@/hooks/use-toast'

export class SignalRErrorHandler {
  static handleConnectionError(error: any, signalRService: SignalRService) {
    console.error('❌ SignalR Connection Error:', error)

    // Show error notification to user
    toast({
      title: 'Connection Lost',
      description: 'Attempting to reconnect...',
      variant: 'destructive'
    })

    // Auto reconnect
    setTimeout(() => {
      signalRService.connect()
    }, 5000)
  }

  static handleMethodError(error: any, methodName: string) {
    console.error(`❌ SignalR Method Error (${methodName}):`, error)

    toast({
      title: 'Operation Failed',
      description: `Failed to ${methodName}. Please try again.`,
      variant: 'destructive'
    })
  }

  static handleNotificationError(error: any) {
    console.error('❌ Notification Error:', error)

    toast({
      title: 'Notification Error',
      description: 'Failed to process notification. Please refresh the page.',
      variant: 'destructive'
    })
  }

  static handleProjectGroupError(error: any, projectId: string, action: 'join' | 'leave') {
    console.error(`❌ Project Group Error (${action} ${projectId}):`, error)

    toast({
      title: 'Project Group Error',
      description: `Failed to ${action} project group. Notifications may not work properly.`,
      variant: 'destructive'
    })
  }

  static handleReconnectionAttempt(attemptNumber: number, maxAttempts: number) {
    console.log(`🔄 SignalR Reconnection attempt ${attemptNumber}/${maxAttempts}`)

    if (attemptNumber === maxAttempts) {
      toast({
        title: 'Connection Failed',
        description: 'Unable to establish connection. Please refresh the page.',
        variant: 'destructive'
      })
    }
  }

  static handleAuthenticationError() {
    console.error('❌ SignalR Authentication Error')

    toast({
      title: 'Authentication Error',
      description: 'Please log in again to receive real-time notifications.',
      variant: 'destructive'
    })
  }
}
