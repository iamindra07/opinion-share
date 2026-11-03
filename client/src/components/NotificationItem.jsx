// NotificationItem - Phase 6: Individual notification with type-specific display and navigation
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../lib/notificationService'
import { Bell, ThumbsUp, MessageSquare, UserPlus, Reply } from 'lucide-react'

const TYPE_CONFIG = {
  like_post: { label: 'liked your post', icon: ThumbsUp, color: 'text-brand-600' },
  like_comment: { label: 'liked your comment', icon: ThumbsUp, color: 'text-brand-600' },
  comment_post: { label: 'commented on your post', icon: MessageSquare, color: 'text-neutral-600' },
  reply_comment: { label: 'replied to your comment', icon: Reply, color: 'text-neutral-600' },
  follow_user: { label: 'followed you', icon: UserPlus, color: 'text-brand-600' },
}

export default function NotificationItem({ notification, onRead }) {
  const [markingRead, setMarkingRead] = useState(false)
  const navigate = useNavigate()
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.like_post
  const Icon = config.icon

  const handleMarkRead = async () => {
    // Navigate immediately regardless of read status
    if (notification.post_id) {
      navigate(`/post/${notification.post_id}`)
    } else if (notification.comment_id) {
      navigate(
        notification.comment?.post_id
          ? `/post/${notification.comment.post_id}`
          : '/feed'
      )
    } else if (notification.type === 'follow_user') {
      navigate(`/profile/${notification.actor?.username}`)
    }

    // Mark as read only if not already read
    if (notification.read) return

    setMarkingRead(true)
    try {
      await notificationService.markAsRead(notification.id)
      onRead && onRead(notification.id)
    } catch (err) {
      console.error(err.message)
    } finally {
      setMarkingRead(false)
    }
  }

  return (
    <div
      onClick={handleMarkRead}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
        notification.read
          ? 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
          : 'bg-brand-50 border-brand-100 hover:bg-brand-100'
      }`}
    >
      <div className={`flex-shrink-0 p-1.5 rounded-lg bg-neutral-100 ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-neutral-900">
            {notification.actor?.username || 'A user'}
          </span>
          <span className={`text-xs ${config.color} font-medium`}>{config.label}</span>
          <span className="ml-auto text-xs text-neutral-400">
            {new Date(notification.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notification.post && (
            <span className="text-xs text-neutral-500 truncate max-w-[200px]">
              "{" + notification.post.content.slice(0, 60) + (notification.post.content.length > 60 ? '...' : '') + "}"
            </span>
          )}
          {!notification.post && notification.comment && (
            <span className="text-xs text-neutral-500 truncate max-w-[200px]">
              "{" + notification.comment.content.slice(0, 60) + (notification.comment.content.length > 60 ? '...' : '') + "}"
            </span>
          )}
        </div>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-brand-600" />
        </div>
      )}
    </div>
  )
}