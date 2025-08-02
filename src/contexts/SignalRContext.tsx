import { useToastContext } from '@/components/ui/ToastContext'
import { NotificationData, SignalRService } from '@/configs/signalr'
import { NotificationService } from '@/services/notificationService'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface SignalRContextType {
  signalRService: SignalRService
  notificationService: NotificationService
  isConnected: boolean
  notifications: NotificationData[]
  connectionState: string
}

const SignalRContext = createContext<SignalRContextType | null>(null)

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToastContext();
  const [signalRService] = useState(() => new SignalRService())
  const [notificationService] = useState(() => new NotificationService(signalRService, showToast))
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [connectionState, setConnectionState] = useState('Disconnected')

  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        console.log('[SignalR] Bắt đầu kết nối...')
        
        // Check if SignalR is enabled before attempting connection
        if (!signalRService.isEnabled()) {
          console.log('[SignalR] SignalR is disabled, skipping connection')
          setConnectionState('Disabled')
          return
        }

        // Connect to primary SignalR hub
        await signalRService.connect()
        
        // Check if connection was successful
        if (signalRService.isConnected()) {
          console.log('[SignalR] Kết nối thành công!')
          setIsConnected(true)
          setConnectionState('Connected')
        } else {
          console.log('[SignalR] Connection failed, SignalR may be disabled')
          setConnectionState('Failed')
        }

        // Set up connection state listeners for primary
        signalRService.on('close', () => {
          setIsConnected(false)
          setConnectionState('Disconnected')
          console.log('🔌 SignalR disconnected')
        })

        signalRService.on('reconnected', () => {
          setIsConnected(true)
          setConnectionState('Connected')
          console.log('🔄 SignalR reconnected')
        })

        signalRService.on('reconnecting', () => {
          setIsConnected(false)
          setConnectionState('Reconnecting')
          console.log('🔄 SignalR reconnecting...')
        })

        // Initialize notification service only if SignalR is connected
        if (signalRService.isConnected()) {
          try {
            await notificationService.initialize();
            const noti = notificationService.getNotifications();
            console.log('[DEBUG] Notifications after fetch:', noti);
            setNotifications(noti);
          } catch (notificationError) {
            console.warn('[SignalR] Failed to initialize notification service:', notificationError)
          }
        } else {
          console.log('[SignalR] Skipping notification service initialization - SignalR not connected')
        }

        // Listen for notification count updates
        const handleCountUpdate = () => {
          // Update notifications list if needed
          setNotifications(notificationService.getNotifications())
        }

        document.addEventListener('notificationCountUpdate', handleCountUpdate)

        return () => {
          document.removeEventListener('notificationCountUpdate', handleCountUpdate)
        }
      } catch (error) {
        console.error('[SignalR] Lỗi khởi tạo:', error)
        setConnectionState('Error')
      }
    }

    initializeSignalR()
  }, [signalRService, notificationService])

  const value: SignalRContextType = {
    signalRService,
    notificationService,
    isConnected,
    notifications,
    connectionState
  }

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  )
}

export const useSignalR = () => {
  const context = useContext(SignalRContext)
  if (!context) {
    throw new Error('useSignalR must be used within a SignalRProvider')
  }
  return context
}
