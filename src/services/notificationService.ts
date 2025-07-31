import { NotificationData, SignalRService } from '@/configs/signalr';

export class NotificationService {
  private signalRService: SignalRService
  private notifications: NotificationData[] = []
  private listeners: ((notification: NotificationData) => void)[] = []
  private showToast: ((toast: { title?: React.ReactNode; description?: React.ReactNode; variant?: 'default' | 'destructive' }) => void) | null = null;

  constructor(signalRService: SignalRService, showToast: ((toast: { title?: React.ReactNode; description?: React.ReactNode; variant?: 'default' | 'destructive' }) => void) | null) {
    this.signalRService = signalRService
    this.showToast = showToast;
  }

  async fetchAllNotifications() {
    try {
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const token = rememberMe ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken');
      
      if (!token) {
        console.log('[NotificationService] No access token available, skipping notification fetch');
        return;
      }
      
      console.log('[DEBUG] Notification token:', token);
      const response = await fetch('/api/Notification', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 500) {
          console.warn('[NotificationService] Server error when fetching notifications, skipping');
          return;
        }
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      this.notifications = Array.isArray(data) ? data : [];
      this.updateNotificationBadge();
    } catch (error) {
      console.warn('[NotificationService] Error fetching notifications:', error);
      // Don't throw error, just log it and continue with empty notifications
    }
  }

  async initialize() {
    try {
      await this.fetchAllNotifications();
      
      // Only set up SignalR listeners if SignalR is enabled and connected
      if (this.signalRService.isEnabled() && this.signalRService.isConnected()) {
        this.signalRService.on('ReceiveNotification', (notification: NotificationData) => {
          // Hiển thị mọi notification cho tất cả user
          console.log('📨 New notification received (no filter):', notification)
          this.notifications.unshift(notification)
          this.showToastNotification(notification)
          this.updateNotificationBadge()
          this.notifyListeners(notification)
        })
      } else {
        console.log('[NotificationService] SignalR not available, skipping notification listeners');
      }
    } catch (error) {
      console.warn('[NotificationService] Error initializing notification service:', error);
    }
  }

  private showToastNotification(notification: NotificationData) {
    if (this.showToast) {
      this.showToast({
        title: 'New Notification',
        description: notification.message
      })
    }
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

      if (!token) {
        console.log('[NotificationService] No access token available, skipping mark as read');
        return;
      }

      const response = await fetch(`/api/Notification/mark-read/${notificationId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn('[NotificationService] Failed to mark notification as read:', response.status);
        return;
      }

      // Update local state
      const notification = this.notifications.find((n) => n.id === notificationId)
      if (notification) {
        notification.isRead = true
        this.updateNotificationBadge()
      }
    } catch (error) {
      console.warn('[NotificationService] Error marking notification as read:', error)
    }
  }

  async deleteReadNotifications() {
    try {
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      const token = rememberMe ? localStorage.getItem('accessToken') : sessionStorage.getItem('accessToken')

      if (!token) {
        console.log('[NotificationService] No access token available, skipping delete read notifications');
        return;
      }

      const response = await fetch('/api/Notification/delete-read', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn('[NotificationService] Failed to delete read notifications:', response.status);
        return;
      }

      // Remove read notifications from local state
      this.notifications = this.notifications.filter((n) => !n.isRead)
      this.updateNotificationBadge()
    } catch (error) {
      console.warn('[NotificationService] Error deleting read notifications:', error)
    }
  }

  async markAllAsRead() {
    // Không gọi API nữa, chỉ cập nhật local
    this.notifications.forEach((n) => (n.isRead = true));
    this.updateNotificationBadge();
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
