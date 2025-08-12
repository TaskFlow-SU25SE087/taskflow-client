import axiosClient from '@/configs/axiosClient';
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
      console.log('[NotificationService] Starting to fetch notifications...');
      
      // Use axios client instead of fetch for better error handling and base URL management
      // Note: The vite proxy is configured for /api, so we need to use /api/Notification
      const response = await axiosClient.get('/api/Notification');
      
      console.log('[NotificationService] Response received:', response);
      
      if (response.data) {
        this.notifications = Array.isArray(response.data) ? response.data : [];
        console.log('[NotificationService] Notifications fetched successfully:', this.notifications.length);
      } else {
        console.warn('[NotificationService] No data in response');
        this.notifications = [];
      }
      
      this.updateNotificationBadge();
    } catch (error: any) {
      console.error('[NotificationService] Error fetching notifications:', error);
      
      // Log specific error details
      if (error.response) {
        console.error('[NotificationService] Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('[NotificationService] Request error:', error.request);
      } else {
        console.error('[NotificationService] Error message:', error.message);
      }
      
      // Don't throw error, just log it and continue with empty notifications
      this.notifications = [];
    }
  }

  async initialize() {
    try {
      console.log('[NotificationService] Initializing notification service...');
      
      // Always try to fetch notifications first, regardless of SignalR status
      await this.fetchAllNotifications();
      
      // Only set up SignalR listeners if SignalR is enabled and connected
      if (this.signalRService.isEnabled() && this.signalRService.isConnected()) {
        console.log('[NotificationService] Setting up SignalR notification listeners...');
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
        console.log('[NotificationService] SignalR enabled:', this.signalRService.isEnabled());
        console.log('[NotificationService] SignalR connected:', this.signalRService.isConnected());
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

      const response = await axiosClient.post(`/api/Notification/mark-read/${notificationId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 200) {
        // Update local state
        const notification = this.notifications.find((n) => n.id === notificationId)
        if (notification) {
          notification.isRead = true
          this.updateNotificationBadge()
        }
      } else {
        console.warn('[NotificationService] Failed to mark notification as read:', response.status);
      }
    } catch (error: any) {
      console.warn('[NotificationService] Error marking notification as read:', error)
      if (error.response) {
        console.warn('[NotificationService] Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.warn('[NotificationService] Request error:', error.request);
      } else {
        console.warn('[NotificationService] Error message:', error.message);
      }
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

      const response = await axiosClient.delete('/api/Notification/delete-read', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 200) {
        // Remove read notifications from local state
        this.notifications = this.notifications.filter((n) => !n.isRead)
        this.updateNotificationBadge()
      } else {
        console.warn('[NotificationService] Failed to delete read notifications:', response.status);
      }
    } catch (error: any) {
      console.warn('[NotificationService] Error deleting read notifications:', error)
      if (error.response) {
        console.warn('[NotificationService] Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.warn('[NotificationService] Request error:', error.request);
      } else {
        console.warn('[NotificationService] Error message:', error.message);
      }
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
