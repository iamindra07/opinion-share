import { supabase } from '../lib/supabase'

export const notificationService = {
  // Fetch notifications for the current user, newest first
  getNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: null }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey (username, display_name, avatar_url),
        post:posts (id, content),
        comment:comments (id, content, post_id)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })

    return { data: data || [], error }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { count: 0, error: null }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false)

    return { count: count || 0, error }
  },

  // Mark a single notification as read
  markAsRead: async (notificationId) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()
    return { data, error }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', user.id)
      .eq('read', false)
    return { error }
  },

  // Create a notification
  createNotification: async ({ recipientId, actorId, type, postId, commentId }) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        post_id: postId,
        comment_id: commentId,
      })
      .select()
      .single()
    return { data, error }
  },
}

export default notificationService