import { useToastContext } from '@/components/ui/ToastContext'
import { NotificationData, SignalRService } from '@/configs/signalr'

export class NotificationService {
  private signalRService: SignalRService
  private notifications: NotificationData[] = []
  private listeners: ((notification: NotificationData) => void)[] = []

  constructor(signalRService: SignalRService) {
    this.signalRService = signalRService
  }

  initialize() {
    this.signalRService.on('ReceiveNotification', (notification: NotificationData) => {
      console.log('📨 New notification received:', notification)

      // Add to notifications list
      this.notifications.unshift(notification)

      // Show toast notification
      this.showToastNotification(notification)

      // Update badge count
      this.updateNotificationBadge()

      // Notify listeners
      this.notifyListeners(notification)
    })
  }

  private showToastNotification(notification: NotificationData) {
    const { showToast } = useToastContext()
    showToast({
      title: 'New Notification',
      description: notification.message,
      duration: 5000
    })
  }

  private updateNotificationBadge() {
    const unreadCount = this.notifications.filter((n) => !n.isRead).length
    document.dispatchEvent(
      new CustomEvent('notificationCountUpdate', {
        detail: { count: unreadCount }
      })
    )
  }

  private notifyListeners(notification: NotificationData) {
    this.listeners.forEach((listener) => listener(notification))
  }

  addListener(callback: (notification: NotificationData) => void) {
    this.listeners.push(callback)
  }

  removeListener(callback: (notification: NotificationData) => void) {
    this.listeners = this.listeners.filter((l) => l !== callback)
  }

  async markAsRead(notificationId: string) {
    try {
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      const token = rememberMe ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken')

      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Update local state
      const notification = this.notifications.find((n) => n.id === notificationId)
      if (notification) {
        notification.isRead = true
        this.updateNotificationBadge()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async markAllAsRead() {
    try {
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      const token = rememberMe ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken')

      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Update local state
      this.notifications.forEach((n) => (n.isRead = true))
      this.updateNotificationBadge()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  getNotifications() {
    return this.notifications
  }

  getUnreadCount() {
    return this.notifications.filter((n) => !n.isRead).length
  }

  clearNotifications() {
    this.notifications = []
    this.updateNotificationBadge()
  }
}
