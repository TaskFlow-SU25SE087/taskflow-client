import { NotificationData } from '@/configs/signalr'
import { useSignalR } from '@/contexts/SignalRContext'
import { useCallback } from 'react'

export const useSignalRIntegration = () => {
  const { signalRService, notificationService, isConnected, connectionState } = useSignalR()

  const joinProjectGroup = useCallback(
    async (projectId: string) => {
      if (!isConnected) {
        console.warn('SignalR not connected, cannot join project group')
        return
      }

      try {
        await signalRService.joinProjectGroup(projectId)
        console.log(`✅ Joined project group: ${projectId}`)
      } catch (error) {
        console.error(`❌ Failed to join project group ${projectId}:`, error)
      }
    },
    [signalRService, isConnected]
  )

  const leaveProjectGroup = useCallback(
    async (projectId: string) => {
      if (!isConnected) {
        console.warn('SignalR not connected, cannot leave project group')
        return
      }

      try {
        await signalRService.leaveProjectGroup(projectId)
        console.log(`✅ Left project group: ${projectId}`)
      } catch (error) {
        console.error(`❌ Failed to leave project group ${projectId}:`, error)
      }
    },
    [signalRService, isConnected]
  )

  const listenForTaskUpdates = useCallback(
    (taskId: string, callback: (notification: NotificationData) => void) => {
      const handleNotification = (notification: NotificationData) => {
        if (notification.taskId === taskId) {
          callback(notification)
        }
      }

      notificationService.addListener(handleNotification)

      return () => {
        notificationService.removeListener(handleNotification)
      }
    },
    [notificationService]
  )

  const listenForProjectUpdates = useCallback(
    (projectId: string, callback: (notification: NotificationData) => void) => {
      const handleNotification = (notification: NotificationData) => {
        if (notification.projectId === projectId) {
          callback(notification)
        }
      }

      notificationService.addListener(handleNotification)

      return () => {
        notificationService.removeListener(handleNotification)
      }
    },
    [notificationService]
  )

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      await notificationService.markAsRead(notificationId)
    },
    [notificationService]
  )

  const markAllNotificationsAsRead = useCallback(async () => {
    await notificationService.markAllAsRead()
  }, [notificationService])

  const getNotifications = useCallback(() => {
    return notificationService.getNotifications()
  }, [notificationService])

  const getUnreadCount = useCallback(() => {
    return notificationService.getUnreadCount()
  }, [notificationService])

  return {
    // Connection state
    isConnected,
    connectionState,

    // Project group management
    joinProjectGroup,
    leaveProjectGroup,

    // Notification listening
    listenForTaskUpdates,
    listenForProjectUpdates,

    // Notification management
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getNotifications,
    getUnreadCount,

    // Direct access to services
    signalRService,
    notificationService
  }
}
