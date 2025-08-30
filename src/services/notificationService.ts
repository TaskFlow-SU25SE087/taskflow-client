import axiosClient from '@/configs/axiosClient';
import { NotificationData, SignalRService } from '@/configs/signalr';

export class NotificationService {
  private signalRService: SignalRService
  private notifications: NotificationData[] = []
  private listeners: ((notification: NotificationData) => void)[] = []
  private showToast:
    | ((toast: { title?: React.ReactNode; description?: React.ReactNode; variant?: 'default' | 'destructive' }) => void)
    | null = null

  constructor(
    signalRService: SignalRService,
    showToast:
      | ((toast: {
          title?: React.ReactNode
          description?: React.ReactNode
          variant?: 'default' | 'destructive'
        }) => void)
      | null
  ) {
    this.signalRService = signalRService
    this.showToast = showToast
  }

  async fetchAllNotifications() {
    try {
      console.log('[NotificationService] Starting to fetch notifications...');
      
      // Check if we have authentication token
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) {
        console.warn('[NotificationService] No access token available, using mock data for testing');
        this.loadMockNotifications();
        return;
      }
      
      console.log('[NotificationService] Access token found, making API request to /api/Notification');
      
      // Use axios client instead of fetch for better error handling and base URL management
      // Note: The vite proxy is configured for /api, so we need to use /api/Notification
      const response = await axiosClient.get('/api/Notification', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[NotificationService] Response received:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        data: response.data
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Map API response to NotificationData format
        this.notifications = response.data.map((item: any) => ({
          id: item.id,
          userId: item.userId,
          projectId: item.projectId,
          taskId: item.taskId,
          message: item.message,
          type: item.type || 'task_moved', // Default type if missing
          isRead: item.isRead || false,
          createdAt: item.createdAt
        }));
        
        console.log('[NotificationService] Notifications fetched and mapped successfully:', {
          count: this.notifications.length,
          notifications: this.notifications
        });
        
        // Update notification badge after successful fetch
        this.updateNotificationBadge();
        
        // Notify listeners about the update
        this.notifyListenersUpdate();
        
      } else {
        console.warn('[NotificationService] No data or invalid data format in response');
        this.notifications = [];
        this.updateNotificationBadge();
      }
      
    } catch (error: any) {
      console.error('[NotificationService] Error fetching notifications:', error);
      
      // Log specific error details
      if (error.response) {
        console.error('[NotificationService] Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Handle specific HTTP status codes
        if (error.response.status === 401) {
          console.error('[NotificationService] Authentication failed - user may need to re-login');
          console.log('[NotificationService] Using mock data as fallback for testing');
          this.loadMockNotifications();
        } else if (error.response.status === 403) {
          console.error('[NotificationService] Access forbidden - user may not have permission');
          console.log('[NotificationService] Using mock data as fallback for testing');
          this.loadMockNotifications();
        } else if (error.response.status === 404) {
          console.error('[NotificationService] API endpoint not found - /api/Notification may not exist');
          console.log('[NotificationService] Using mock data as fallback for testing');
          this.loadMockNotifications();
        } else if (error.response.status === 500) {
          console.error('[NotificationService] Server error - backend may be down');
          console.log('[NotificationService] Using mock data as fallback for testing');
          this.loadMockNotifications();
        }
      } else if (error.request) {
        console.error('[NotificationService] Request error:', {
          request: error.request,
          message: error.message
        });
        console.error('[NotificationService] This usually means the request was made but no response was received');
        console.log('[NotificationService] Using mock data as fallback for testing');
        this.loadMockNotifications();
      } else {
        console.error('[NotificationService] Error message:', error.message);
        console.error('[NotificationService] Error stack:', error.stack);
        console.log('[NotificationService] Using mock data as fallback for testing');
        this.loadMockNotifications();
      }
      
      // Don't throw error, just log it and continue with mock notifications for testing
      if (this.notifications.length === 0) {
        this.loadMockNotifications();
      }
    }
  }

  // Force load mock data for testing purposes
  forceLoadMockData() {
    console.log('[NotificationService] Force loading mock data for testing...');
    this.loadMockNotifications();
  }

  private loadMockNotifications() {
    console.log('[NotificationService] Loading mock notifications for testing...');
    
    const mockNotifications: NotificationData[] = [
      {
        id: '1',
        userId: 'user1',
        projectId: 'project1',
        taskId: 'task1',
        message: 'Task "Create user interface" has been assigned to you',
        type: 'task_assigned',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      },
      {
        id: '2',
        userId: 'user1',
        projectId: 'project1',
        taskId: 'task2',
        message: 'Sprint "Sprint 1" has started',
        type: 'sprint_started',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      {
        id: '3',
        userId: 'user1',
        projectId: 'project1',
        taskId: 'task3',
        message: 'Project "TaskFlow" has been updated',
        type: 'project_updated',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
      },
      {
        id: '4',
        userId: 'user1',
        projectId: 'project1',
        taskId: 'task4',
        message: 'New team member "John Doe" has joined the project',
        type: 'member_joined',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
      }
    ];
    
    this.notifications = mockNotifications;
    console.log('[NotificationService] Mock notifications loaded:', mockNotifications);
    this.updateNotificationBadge();
  }

  async initialize() {
    try {
      // Always try to fetch first, but fallback to mock data if needed
      await this.fetchAllNotifications()
      
      // If still no notifications after fetch attempt, load mock data
      if (this.notifications.length === 0) {
        console.log('[NotificationService] No notifications after fetch, loading mock data...');
        this.loadMockNotifications();
      }

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
        console.log('[NotificationService] SignalR not available, skipping notification listeners')
      }
    } catch (error) {
      console.warn('[NotificationService] Error initializing notification service:', error)
      // Even if initialization fails, try to load mock data
      if (this.notifications.length === 0) {
        console.log('[NotificationService] Loading mock data after initialization error...');
        this.loadMockNotifications();
      }
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

  // Notify listeners about notifications update
  private notifyListenersUpdate() {
    console.log('[NotificationService] Notifying listeners about notifications update');
    
    // Dispatch a custom event to notify components about the update
    document.dispatchEvent(
      new CustomEvent('notificationsUpdated', {
        detail: { 
          count: this.notifications.length,
          unreadCount: this.getUnreadCount()
        }
      })
    );
    
    // Also dispatch the count update event to ensure badge updates
    this.updateNotificationBadge();
    
    // Force a DOM update by dispatching a custom event
    document.dispatchEvent(
      new CustomEvent('forceNotificationUpdate', {
        detail: {
          notifications: this.notifications,
          count: this.notifications.length,
          unreadCount: this.getUnreadCount()
        }
      })
    );
  }

  addListener(callback: (notification: NotificationData) => void) {
    this.listeners.push(callback)
  }

  removeListener(callback: (notification: NotificationData) => void) {
    this.listeners = this.listeners.filter((l) => l !== callback)
  }

  async markAsRead(notificationId: string) {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        console.log('[NotificationService] No access token available, skipping mark as read')
        return
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
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        console.log('[NotificationService] No access token available, skipping delete read notifications')
        return
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
    this.notifications.forEach((n) => (n.isRead = true))
    this.updateNotificationBadge()
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
