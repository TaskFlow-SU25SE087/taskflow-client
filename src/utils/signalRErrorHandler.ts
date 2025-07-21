import { useToastContext } from '@/components/ui/ToastContext'
import { SignalRService } from '@/configs/signalr'

export class SignalRErrorHandler {
  static handleConnectionError(error: any, signalRService: SignalRService) {
    console.error('❌ SignalR Connection Error:', error)

    const { showToast } = useToastContext()
    // Show error notification to user
    showToast({
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

    const { showToast } = useToastContext()
    showToast({
      title: 'Operation Failed',
      description: `Failed to ${methodName}. Please try again.`,
      variant: 'destructive'
    })
  }

  static handleNotificationError(error: any) {
    console.error('❌ Notification Error:', error)

    const { showToast } = useToastContext()
    showToast({
      title: 'Notification Error',
      description: 'Failed to process notification. Please refresh the page.',
      variant: 'destructive'
    })
  }

  static handleProjectGroupError(error: any, projectId: string, action: 'join' | 'leave') {
    console.error(`❌ Project Group Error (${action} ${projectId}):`, error)

    const { showToast } = useToastContext()
    showToast({
      title: 'Project Group Error',
      description: `Failed to ${action} project group. Notifications may not work properly.`,
      variant: 'destructive'
    })
  }

  static handleReconnectionAttempt(attemptNumber: number, maxAttempts: number) {
    console.log(`🔄 SignalR Reconnection attempt ${attemptNumber}/${maxAttempts}`)

    const { showToast } = useToastContext()
    if (attemptNumber === maxAttempts) {
      showToast({
        title: 'Connection Failed',
        description: 'Unable to establish connection. Please refresh the page.',
        variant: 'destructive'
      })
    }
  }

  static handleAuthenticationError() {
    console.error('❌ SignalR Authentication Error')

    const { showToast } = useToastContext()
    showToast({
      title: 'Authentication Error',
      description: 'Please log in again to receive real-time notifications.',
      variant: 'destructive'
    })
  }
}
