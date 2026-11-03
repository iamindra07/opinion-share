// NotificationsPage - Phase 6: Full notifications center with mark-as-read
import { useState, useEffect } from 'react'
import { notificationService } from '../lib/notificationService'
import NotificationItem from '../components/NotificationItem'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [])

  const loadNotifications = async () => {
    try {
      const { data, error } = await notificationService.getNotifications()
      if (error) throw error
      setNotifications(data)
    } catch (err) {
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await notificationService.getUnreadCount()
      if (error) throw error
      setUnreadCount(count)
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(err.message || 'Failed to mark all as read')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-brand-600 hover:underline font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-12 h-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <h3 className="text-lg font-semibold text-neutral-900">No notifications yet</h3>
            <p className="text-neutral-500 text-sm">
              When someone interacts with your content, you'll see it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}