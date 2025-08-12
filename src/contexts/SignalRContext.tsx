import { useToastContext } from '@/components/ui/ToastContext'
import { NotificationData, SignalRService } from '@/configs/signalr'
import { AuthContext } from '@/hooks/useAuthContext'
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
  const authContext = useContext(AuthContext);
  const { isAuthenticated, authLoading } = authContext || { isAuthenticated: false, authLoading: true };
  const [signalRService] = useState(() => new SignalRService())
  const [notificationService] = useState(() => new NotificationService(signalRService, showToast))
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [connectionState, setConnectionState] = useState('Disconnected')

  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          console.log('[SignalR] Waiting for auth to finish loading...')
          return
        }

        // If user is not authenticated, disconnect if connected
        if (!isAuthenticated) {
          console.log('[SignalR] User not authenticated, disconnecting SignalR if connected')
          if (signalRService.isConnected()) {
            await signalRService.disconnect()
          }
          setIsConnected(false)
          setConnectionState('NotAuthenticated')
          return
        }

        console.log('[SignalR] User authenticated, bắt đầu kết nối...')
        
        // Check if SignalR is enabled before attempting connection
        if (!signalRService.isEnabled()) {
          console.log('[SignalR] SignalR is disabled, skipping connection')
          setConnectionState('Disabled')
          return
        }

        // Double-check authentication at SignalR service level
        if (!signalRService.isAuthenticated()) {
          console.log('[SignalR] SignalR service reports user not authenticated, skipping connection')
          setConnectionState('NotAuthenticated')
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

        // Set up connection state listeners for connection state changes
        signalRService.on('connectionStateChanged', (state: string) => {
          setConnectionState(state)
          console.log(`[SignalR] Connection state changed to: ${state}`)
        })

        // Set up connection state listeners for connection state updates
        signalRService.on('connectionStateUpdate', (state: string) => {
          setConnectionState(state)
          console.log(`[SignalR] Connection state updated to: ${state}`)
        })

        // Initialize notification service regardless of SignalR connection status
        try {
          console.log('[SignalR] Initializing notification service...');
          await notificationService.initialize();
          const noti = notificationService.getNotifications();
          console.log('[DEBUG] Notifications after fetch:', noti);
          setNotifications(noti);
        } catch (notificationError) {
          console.warn('[SignalR] Failed to initialize notification service:', notificationError)
          // Even if notification service fails, we can still show empty notifications
          setNotifications([]);
        }

        // Only set up SignalR-specific features if connected
        if (signalRService.isConnected()) {
          console.log('[SignalR] SignalR connected, setting up additional features...');
        } else {
          console.log('[SignalR] SignalR not connected, but notification service initialized');
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
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message?.includes('401')) {
            console.error('[SignalR] Authentication failed. User may need to re-login.')
            setConnectionState('AuthFailed')
          } else if (error.message?.includes('timeout')) {
            console.error('[SignalR] Connection timeout. Server may be down or slow.')
            setConnectionState('Timeout')
          } else if (error.message?.includes('WebSocket failed to connect')) {
            console.error('[SignalR] WebSocket connection failed. Server may not support WebSockets or is down.')
            setConnectionState('WebSocketFailed')
          }
        }
      }
    }

    initializeSignalR()

    // Cleanup function to disconnect when component unmounts or auth changes
    return () => {
      if (signalRService.isConnected()) {
        console.log('[SignalR] Cleaning up SignalR connection')
        signalRService.disconnect()
      }
      
      // Remove event listeners
      signalRService.off('close', () => {})
      signalRService.off('reconnected', () => {})
      signalRService.off('reconnecting', () => {})
      signalRService.off('connectionStateChanged', () => {})
      signalRService.off('connectionStateUpdate', () => {})
    }
  }, [signalRService, notificationService, isAuthenticated, authLoading])

  // Handle logout - disconnect SignalR when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading && signalRService.isConnected()) {
      console.log('[SignalR] User logged out, disconnecting SignalR')
      signalRService.disconnect()
      setIsConnected(false)
      setConnectionState('Disconnected')
    }
  }, [isAuthenticated, authLoading, signalRService])

  // Handle login - re-enable SignalR when user logs in
  useEffect(() => {
    if (isAuthenticated && !authLoading && !signalRService.isConnected()) {
      console.log('[SignalR] User logged in, re-enabling SignalR')
      signalRService.reEnable()
      // The main useEffect will handle the connection
    }
  }, [isAuthenticated, authLoading, signalRService])

  // Handle connection retry for specific error states
  useEffect(() => {
    if (connectionState === 'AuthFailed' || connectionState === 'Timeout' || connectionState === 'WebSocketFailed') {
      const retryTimeout = setTimeout(() => {
        if (isAuthenticated && !authLoading) {
          console.log('[SignalR] Retrying connection after error...')
          setConnectionState('Retrying')
          // The main useEffect will handle the retry
        }
      }, 5000) // Wait 5 seconds before retry

      return () => clearTimeout(retryTimeout)
    }
  }, [connectionState, isAuthenticated, authLoading])

  // Monitor authentication state changes and update SignalR accordingly
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        console.log('[SignalR] User authenticated, enabling SignalR')
        signalRService.reEnable()
      } else {
        console.log('[SignalR] User not authenticated, disabling SignalR')
        if (signalRService.isConnected()) {
          signalRService.disconnect()
        }
        signalRService.forceDisable()
        setConnectionState('NotAuthenticated')
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, authLoading, signalRService])

  const value: SignalRContextType = {
    signalRService,
    notificationService,
    isConnected,
    notifications,
    connectionState
  }

  // Debug logging for connection state changes
  useEffect(() => {
    console.log(`[SignalR] Connection state changed to: ${connectionState}`)
    console.log(`[SignalR] Is connected: ${isConnected}`)
    console.log(`[SignalR] Is authenticated: ${isAuthenticated}`)
    console.log(`[SignalR] Auth loading: ${authLoading}`)
  }, [connectionState, isConnected, isAuthenticated, authLoading])

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
