'use client'

import { useState, useEffect } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  claimNumber?: string
  priority: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

interface NotificationBellProps {
  theme?: 'light' | 'dark'
}

export default function NotificationBell({ theme = 'light' }: NotificationBellProps) {
  const isDark = theme === 'dark'
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=10', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBellClick = () => {
    setShowDropdown(!showDropdown)
    if (!showDropdown) {
      fetchNotifications()
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      })
      if (response.ok) {
        setNotifications(notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        credentials: 'include',
      })
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600'
      case 'HIGH':
        return 'text-orange-600'
      case 'MEDIUM':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={handleBellClick}
        className={`relative p-2 rounded-full transition-all ${
          isDark
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-gray-600 hover:text-gray-900 bg-white shadow-sm hover:shadow-md'
        }`}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className={`h-6 w-6 ${isDark ? 'text-white' : 'text-blue-600'}`} />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setShowDropdown(false)
              }
            }}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      role="button"
                      tabIndex={0}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification._id)
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (!notification.isRead) {
                            markAsRead(notification._id)
                          }
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl
                          }
                        }
                      }}
                    >
                      <div className="flex items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-semibold ${getPriorityColor(notification.priority)}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            {notification.message}
                          </p>
                          {notification.claimNumber && (
                            <p className="text-xs text-gray-500 mb-1">
                              Claim: {notification.claimNumber}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <a
                  href="/member/notifications"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  View all notifications
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
