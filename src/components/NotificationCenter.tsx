import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSignalR } from '@/contexts/SignalRContext'
import { cn } from '@/lib/utils'
import { Bell, Check, RefreshCw, Trash } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const NotificationCenter: React.FC = () => {
  const { notificationService, notifications } = useSignalR()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleCountUpdate = (event: CustomEvent) => {
      setUnreadCount(event.detail.count)
    }

    const handleNotificationsUpdated = () => {
      const newUnreadCount = notificationService.getUnreadCount();
      setUnreadCount(newUnreadCount);
    }

    const handleForceNotificationUpdate = (event: CustomEvent) => {
      const { unreadCount } = event.detail;
      setUnreadCount(unreadCount);
    }

    const handleNotificationsDeleted = () => {
      // Refresh notifications list after deletion
      setTimeout(() => {
        fetchNotificationsFromAPI();
      }, 100);
    }

    const handleNotificationMarkedAsRead = () => {
      // Update unread count after marking as read
      const newCount = notificationService.getUnreadCount();
      setUnreadCount(newCount);
    }

    const handleAllNotificationsMarkedAsRead = () => {
      // Update unread count after marking all as read
      setUnreadCount(0);
    }

    document.addEventListener('notificationCountUpdate', handleCountUpdate as EventListener)
    document.addEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener)
    document.addEventListener('forceNotificationUpdate', handleForceNotificationUpdate as EventListener)
    document.addEventListener('notificationsDeleted', handleNotificationsDeleted as EventListener)
    document.addEventListener('notificationMarkedAsRead', handleNotificationMarkedAsRead as EventListener)
    document.addEventListener('allNotificationsMarkedAsRead', handleAllNotificationsMarkedAsRead as EventListener)

    // Initialize unread count
    const initialCount = notificationService.getUnreadCount();
    setUnreadCount(initialCount)

    // Force fetch notifications from API when component mounts
    setTimeout(() => {
      fetchNotificationsFromAPI();
    }, 100);

    return () => {
      document.removeEventListener('notificationCountUpdate', handleCountUpdate as EventListener)
      document.removeEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener)
      document.removeEventListener('forceNotificationUpdate', handleForceNotificationUpdate as EventListener)
      document.removeEventListener('notificationsDeleted', handleNotificationsDeleted as EventListener)
      document.removeEventListener('notificationMarkedAsRead', handleNotificationMarkedAsRead as EventListener)
      document.removeEventListener('allNotificationsMarkedAsRead', handleAllNotificationsMarkedAsRead as EventListener)
    }
  }, [])

  // Separate effect for notifications changes
  useEffect(() => {
    // If we have notifications but unread count is 0, update it
    if (notifications.length > 0 && unreadCount === 0) {
      const actualUnreadCount = notificationService.getUnreadCount();
      setUnreadCount(actualUnreadCount);
    }
  }, [notifications.length, unreadCount])

  const fetchNotificationsFromAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      await notificationService.fetchAllNotifications();
      
      // Force update unread count after successful fetch
      const newUnreadCount = notificationService.getUnreadCount();
      setUnreadCount(newUnreadCount);
      
    } catch (error) {
      console.error('[NotificationCenter] Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [notificationService]);



  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update unread count immediately
      const newCount = notificationService.getUnreadCount();
      setUnreadCount(newCount);
      
      // Trigger a custom event to notify other components
      const markReadEvent = new CustomEvent('notificationMarkedAsRead', {
        detail: { 
          notificationId,
          action: 'markAsRead',
          timestamp: new Date().toISOString()
        }
      });
      document.dispatchEvent(markReadEvent);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update unread count immediately
      setUnreadCount(0);
      
      // Force refresh notifications to update UI
      await notificationService.fetchAllNotifications();
      
      // Trigger a custom event to notify other components
      const markAllReadEvent = new CustomEvent('allNotificationsMarkedAsRead', {
        detail: { 
          action: 'markAllAsRead',
          timestamp: new Date().toISOString()
        }
      });
      document.dispatchEvent(markAllReadEvent);
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  const handleDeleteReadNotifications = async () => {
    try {
      // Delete read notifications
      await notificationService.deleteReadNotifications();
      
      // Force refresh notifications from API to get updated list
      await notificationService.fetchAllNotifications();
      
      // Update unread count
      const newCount = notificationService.getUnreadCount();
      setUnreadCount(newCount);
      
      // Trigger a custom event to notify other components
      const deleteEvent = new CustomEvent('notificationsDeleted', {
        detail: { 
          action: 'deleteRead',
          timestamp: new Date().toISOString()
        }
      });
      document.dispatchEvent(deleteEvent);
      
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className='relative'>
      {/* Notification Trigger */}
      <Button 
        ref={triggerRef}
        variant='ghost' 
        size='icon' 
        className='relative' 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className='h-5 w-5' />
        {unreadCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center'
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Overlay for click outside */}
          <div 
            className='fixed inset-0 z-[9990]' 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div 
            ref={dropdownRef}
            className='absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-[9991]'
          >
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-100'>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900'>Notifications</h3>
              </div>
              <div className='flex items-center gap-2'>
                {/* Refresh button */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={fetchNotificationsFromAPI}
                  disabled={isLoading}
                  className='text-blue-600 hover:text-blue-700'
                  title='Refresh notifications'
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleMarkAllAsRead}
                    className='text-xs text-blue-600 hover:text-blue-700'
                  >
                    Mark all read
                  </Button>
                )}
                {/* Nút Delete read chuyển thành icon */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleDeleteReadNotifications}
                  className='text-red-600 hover:text-red-700'
                  title='Delete read'
                >
                  <Trash className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className='max-h-96'>
              {isLoading ? (
                <div className='p-8 text-center text-gray-500'>
                  <RefreshCw className='h-8 w-8 mx-auto mb-2 text-gray-300 animate-spin' />
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className='p-8 text-center text-gray-500'>
                  <Bell className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                  <p>No notifications</p>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={fetchNotificationsFromAPI}
                    className='mt-2 text-blue-600 hover:text-blue-700'
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className='divide-y divide-gray-100 max-h-96 overflow-y-auto'>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                        !notification.isRead && 'bg-blue-50'
                      )}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm text-gray-900 leading-relaxed'>{notification.message}</p>
                          <p className='text-xs text-gray-500 mt-1'>{formatTime(notification.createdAt)}</p>
                        </div>
                        {!notification.isRead && (
                          <div className='flex items-center gap-2 ml-2'>
                            <div className='w-2 h-2 bg-blue-500 rounded-full' />
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6'
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                            >
                              <Check className='h-3 w-3' />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter
