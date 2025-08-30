import { useToastContext } from '@/components/ui/ToastContext'
import { NotificationData, SignalRService } from '@/configs/signalr'
import { AuthContext } from '@/hooks/useAuthContext'
import { NotificationService } from '@/services/notificationService'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface SignalRContextType {
  signalRService: SignalRService
  notificationService: NotificationService
  isConnected: boolean
  notifications: NotificationData[]
  connectionState: string
  forceSyncNotifications: () => void
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
    const initializeServices = async () => {
      if (isAuthenticated && !authLoading) {
        try {
          console.log('[SignalR] Starting SignalR connection...')
          await signalRService.connect()
          
          try {
            console.log('[SignalR] Initializing notification service...');
            await notificationService.initialize();
            const noti = notificationService.getNotifications();
            console.log('[DEBUG] Notifications after fetch:', noti);
            setNotifications(noti);
            
            // Force update notifications state after initialization
            setTimeout(() => {
              const currentNotifications = notificationService.getNotifications();
              console.log('[SignalR] Force updating notifications state:', currentNotifications.length);
              setNotifications(currentNotifications);
            }, 100);
            
          } catch (notificationError) {
            console.warn('[SignalR] Failed to initialize notification service:', notificationError)
            setNotifications([]);
          }
        } catch (error) {
          console.error('[SignalR] Failed to connect:', error)
        }
      }
    }

    initializeServices()
  }, [signalRService, notificationService, isAuthenticated, authLoading])

  // Add event listeners for notifications updates
  useEffect(() => {
    const handleNotificationsUpdated = (event: CustomEvent) => {
      console.log('[SignalR] Notifications updated event received:', event.detail);
      const currentNotifications = notificationService.getNotifications();
      console.log('[SignalR] Updating notifications state with:', currentNotifications.length);
      setNotifications(currentNotifications);
    }

    const handleForceNotificationUpdate = (event: CustomEvent) => {
      console.log('[SignalR] Force notification update event received:', event.detail);
      const { notifications: newNotifications } = event.detail;
      console.log('[SignalR] Force updating notifications state with:', newNotifications.length);
      setNotifications(newNotifications);
    }

    // Listen for notification updates
    document.addEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener);
    document.addEventListener('forceNotificationUpdate', handleForceNotificationUpdate as EventListener);

    return () => {
      document.removeEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener);
      document.removeEventListener('forceNotificationUpdate', handleForceNotificationUpdate as EventListener);
    }
  }, []) // Empty dependency array - only run once

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

  const forceSyncNotifications = useCallback(() => {
    console.log('[SignalR] Force syncing notifications...');
    const currentNotifications = notificationService.getNotifications();
    console.log('[SignalR] Current notifications in service:', currentNotifications.length);
    setNotifications(currentNotifications);
  }, [notificationService])

  const value: SignalRContextType = {
    signalRService,
    notificationService,
    isConnected,
    notifications,
    connectionState,
    forceSyncNotifications
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
