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
  // Lấy userId hiện tại từ sessionStorage
  const storedUser = sessionStorage.getItem('auth_user')
  const currentUserId = storedUser ? JSON.parse(storedUser).id : null
  const [notificationService] = useState(() => new NotificationService(signalRService, currentUserId, showToast))
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [connectionState, setConnectionState] = useState('Disconnected')

  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        console.log('[SignalR] Bắt đầu kết nối...')
        // Connect to real SignalR hub
        await signalRService.connect()
        console.log('[SignalR] Kết nối thành công!')

        // Set up connection state listeners
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

        // Initialize notification service
        await notificationService.initialize();
        const noti = notificationService.getNotifications();
        console.log('[DEBUG] Notifications after fetch:', noti);
        setNotifications(noti);

        // Listen for notification count updates
        const handleCountUpdate = (event: CustomEvent) => {
          // Update notifications list if needed
          setNotifications(notificationService.getNotifications())
        }

        document.addEventListener('notificationCountUpdate', handleCountUpdate as EventListener)

        // Set connected state
        setIsConnected(true)
        setConnectionState('Connected')

        // Join user group nếu đã đăng nhập
        // (Đã bỏ logic joinUserGroup vì backend không hỗ trợ)

        return () => {
          document.removeEventListener('notificationCountUpdate', handleCountUpdate as EventListener)
        }
      } catch (error) {
        console.error('[SignalR] Lỗi khi kết nối:', error)
        setIsConnected(false)
        setConnectionState('Failed')
      }
    }

    initializeSignalR()

    return () => {
      signalRService.disconnect()
    }
  }, [signalRService, notificationService])

  const value: SignalRContextType = {
    signalRService,
    notificationService,
    isConnected,
    notifications,
    connectionState
  }

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
}

export const useSignalR = () => {
  const context = useContext(SignalRContext)
  if (!context) {
    throw new Error('useSignalR must be used within SignalRProvider')
  }
  return context
}
