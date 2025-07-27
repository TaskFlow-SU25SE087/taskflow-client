import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSignalR } from '@/contexts/SignalRContext'
import { cn } from '@/lib/utils'
import { Bell, Check, Trash, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const NotificationCenter: React.FC = () => {
  const { notificationService, notifications, isConnected } = useSignalR()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const handleCountUpdate = (event: CustomEvent) => {
      setUnreadCount(event.detail.count)
    }

    document.addEventListener('notificationCountUpdate', handleCountUpdate as EventListener)

    // Initialize unread count
    setUnreadCount(notificationService.getUnreadCount())

    return () => {
      document.removeEventListener('notificationCountUpdate', handleCountUpdate as EventListener)
    }
  }, [notificationService])

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId)
    setUnreadCount(notificationService.getUnreadCount())
  }

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead()
    setUnreadCount(0)
  }

  const handleDeleteReadNotifications = async () => {
    await notificationService.deleteReadNotifications();
    setUnreadCount(notificationService.getUnreadCount());
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
      <Button variant='ghost' size='icon' className='relative' onClick={() => setIsOpen(!isOpen)}>
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

      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white' />
      )}

      {/* Notification Dropdown */}
      {isOpen && (
        <div className='absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-100'>
            <h3 className='font-semibold text-gray-900'>Notifications</h3>
            <div className='flex items-center gap-2'>
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
              <Button variant='ghost' size='icon' onClick={() => setIsOpen(false)} className='h-6 w-6'>
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className='max-h-96'>
            {notifications.length === 0 ? (
              <div className='p-8 text-center text-gray-500'>
                <Bell className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                <p>No notifications</p>
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
      )}
    </div>
  )
}

export default NotificationCenter
