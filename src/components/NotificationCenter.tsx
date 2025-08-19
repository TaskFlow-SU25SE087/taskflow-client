
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, Bell, Check, CheckCheck, Clock, RefreshCw, Trash, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useSignalR } from '@/contexts/SignalRContext'
import { cn } from '@/lib/utils'

const NotificationCenter: React.FC = () => {
  const { notificationService, notifications } = useSignalR()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
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
      setTimeout(() => {
        fetchNotificationsFromAPI();
      }, 100);
    }

    const handleNotificationMarkedAsRead = () => {
      const newCount = notificationService.getUnreadCount();
      setUnreadCount(newCount);
    }

    const handleAllNotificationsMarkedAsRead = () => {
      setUnreadCount(0);
    }

    document.addEventListener('notificationCountUpdate', handleCountUpdate as EventListener)
    document.addEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener)
    document.addEventListener('forceNotificationUpdate', handleForceNotificationUpdate as EventListener)
    document.addEventListener('notificationsDeleted', handleNotificationsDeleted as EventListener)
    document.addEventListener('notificationMarkedAsRead', handleNotificationMarkedAsRead as EventListener)
    document.addEventListener('allNotificationsMarkedAsRead', handleAllNotificationsMarkedAsRead as EventListener)

    const initialCount = notificationService.getUnreadCount();
    setUnreadCount(initialCount)

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

  useEffect(() => {
    if (notifications.length > 0 && unreadCount === 0) {
      const actualUnreadCount = notificationService.getUnreadCount();
      setUnreadCount(actualUnreadCount);
    }
  }, [notifications.length, unreadCount])

  const fetchNotificationsFromAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      await notificationService.fetchAllNotifications();
      
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
      
      const newCount = notificationService.getUnreadCount();
      setUnreadCount(newCount);
      
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
      setIsMarkingAllRead(true)
      // Call markAsRead for each unread notification
      const unreadNotifications = notifications.filter(n => !n.isRead)
      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n.id)))
      await notificationService.fetchAllNotifications()
      const markAllReadEvent = new CustomEvent('allNotificationsMarkedAsRead', {
        detail: {
          action: 'markAllAsRead',
          timestamp: new Date().toISOString()
        }
      })
      document.dispatchEvent(markAllReadEvent)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleDeleteReadNotifications = async () => {
    try {
      setIsDeleting(true);
      await notificationService.deleteReadNotifications();
      
      await notificationService.fetchAllNotifications();
      
      const newCount = notificationService.getUnreadCount();
      setUnreadCount(newCount);
      
      const deleteEvent = new CustomEvent('notificationsDeleted', {
        detail: { 
          action: 'deleteRead',
          timestamp: new Date().toISOString()
        }
      });
      document.dispatchEvent(deleteEvent);
      
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    } finally {
      setIsDeleting(false);
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

  const getNotificationIcon = (notification: any) => {
    // You can customize this based on notification type
    if (notification.type === 'alert') return <AlertCircle className="h-5 w-5 text-red-500" />
    return <Bell className="h-5 w-5 text-blue-500" />
  }

  return (
    <div className='relative'>
      {/* Notification Trigger */}
      <Button 
        ref={triggerRef}
        variant='ghost' 
        size='icon' 
        className={cn(
          'relative transition-all duration-200 hover:scale-105',
          unreadCount > 0 && 'text-blue-600 hover:text-blue-700'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn(
          'h-5 w-5 transition-all duration-200',
          unreadCount > 0 && 'animate-pulse'
        )} />
        {unreadCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -top-2 -right-2 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center animate-bounce bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white shadow-lg'
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop with blur effect */}
          <div 
            className='fixed inset-0 z-[9990] backdrop-blur-[2px] bg-black/10' 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div 
            ref={dropdownRef}
            className='absolute right-0 top-full mt-3 w-96 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[9991] overflow-hidden animate-in slide-in-from-top-2 duration-200'
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Header with gradient */}
            <div className='relative p-5 border-b border-gray-200/50 bg-gradient-to-r from-slate-50 to-gray-50'>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50'></div>
              <div className='relative flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-white/80 rounded-lg shadow-sm'>
                    <Bell className='h-5 w-5 text-slate-700' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-900'>Notifications</h3>
                    <p className='text-xs text-slate-500 mt-0.5'>
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-1'>
                  {/* Refresh button */}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={fetchNotificationsFromAPI}
                    disabled={isLoading}
                    className='h-8 w-8 p-0 text-slate-600 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-all duration-200'
                    title='Refresh notifications'
                  >
                    <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                  </Button>
                  
                  {/* Mark all read button */}
                  {unreadCount > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingAllRead}
                      className='h-8 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200'
                    >
                      {isMarkingAllRead ? (
                        <RefreshCw className='h-3 w-3 animate-spin mr-1' />
                      ) : (
                        <CheckCheck className='h-3 w-3 mr-1' />
                      )}
                      Mark all read
                    </Button>
                  )}
                  
                  {/* Delete read button */}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleDeleteReadNotifications}
                    disabled={isDeleting}
                    className='h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200'
                    title='Delete read notifications'
                  >
                    {isDeleting ? (
                      <RefreshCw className='h-4 w-4 animate-spin' />
                    ) : (
                      <Trash className='h-4 w-4' />
                    )}
                  </Button>
                  
                  {/* Close button */}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setIsOpen(false)}
                    className='h-8 w-8 p-0 text-slate-500 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className='max-h-[28rem]'>
              {isLoading ? (
                <div className='p-8 text-center'>
                  <div className='flex items-center justify-center mb-4'>
                    <div className='relative'>
                      <div className='w-12 h-12 border-4 border-slate-200 rounded-full'></div>
                      <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0'></div>
                    </div>
                  </div>
                  <p className='text-slate-600 font-medium'>Loading notifications...</p>
                  <p className='text-slate-400 text-sm mt-1'>Please wait a moment</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className='p-8 text-center'>
                  <div className='w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Bell className='h-8 w-8 text-slate-400' />
                  </div>
                  <p className='text-slate-600 font-medium mb-2'>No notifications yet</p>
                  <p className='text-slate-400 text-sm mb-4'>You're all caught up! Check back later for updates.</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={fetchNotificationsFromAPI}
                    className='text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg'
                  >
                    <RefreshCw className='h-4 w-4 mr-2' />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className='p-2'>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'group relative p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 border border-transparent',
                        !notification.isRead 
                          ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 hover:from-blue-100/80 hover:to-indigo-100/80 border-blue-100/50' 
                          : 'bg-white/60 hover:bg-slate-50/80 border-slate-100/50',
                        'hover:shadow-md hover:scale-[1.02]'
                      )}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      {/* Unread indicator line */}
                      {!notification.isRead && (
                        <div className='absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full'></div>
                      )}
                      
                      <div className='flex items-start gap-3 ml-2'>
                        {/* Notification icon */}
                        <div className={cn(
                          'p-2 rounded-lg flex-shrink-0 mt-0.5',
                          !notification.isRead ? 'bg-white/80 shadow-sm' : 'bg-slate-100/80'
                        )}>
                          {getNotificationIcon(notification)}
                        </div>
                        
                        <div className='flex-1 min-w-0'>
                          <p className={cn(
                            'text-sm leading-relaxed break-words',
                            !notification.isRead ? 'text-slate-900 font-medium' : 'text-slate-700'
                          )}>
                            {notification.message}
                          </p>
                          
                          <div className='flex items-center gap-2 mt-2'>
                            <div className='flex items-center gap-1 text-xs text-slate-500'>
                              <Clock className='h-3 w-3' />
                              {formatTime(notification.createdAt)}
                            </div>
                            {!notification.isRead && (
                              <Badge 
                                variant='secondary' 
                                className='px-2 py-0.5 text-xs bg-blue-100 text-blue-700 border-blue-200'
                              >
                                New
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Mark as read button */}
                        {!notification.isRead && (
                          <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 w-7 p-0 text-blue-600 hover:text-white hover:bg-blue-500 rounded-full transition-all duration-200'
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                              title='Mark as read'
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
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className='p-3 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200/50'>
                <p className='text-center text-xs text-slate-500'>
                  {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter
