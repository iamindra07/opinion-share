import { supabase } from '../lib/supabase'

export const profileService = {
  // Get a profile by username
  getProfileByUsername: async (username) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    return { data, error }
  },

  // Get a profile by user ID
  getProfileById: async (id) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Get posts for a profile
  getProfilePosts: async (authorId) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get follower count
  getFollowerCount: async (followingId) => {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', followingId)
    return { count, error }
  },

  // Get following count
  getFollowingCount: async (followerId) => {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', followerId)
    return { count, error }
  },

  // Check if current user follows a target user
  isFollowing: async (targetUserId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: false, error: null }

    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()
    return { data: !!data, error }
  },

  // Follow or unfollow a user via RPC
  toggleFollow: async (targetUserId) => {
    const { error } = await supabase.rpc('toggle_follow', {
      target_user_id: targetUserId,
    })
    return { error }
  },

  // Update the current user's profile
  updateProfile: async (updates) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    return { data, error }
  },

  // Get followers of a user
  getFollowers: async (followingId) => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (username, display_name, avatar_url)
      `)
      .eq('following_id', followingId)
    return { data, error }
  },

  // Get users a user is following
  getFollowing: async (followerId) => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (username, display_name, avatar_url)
      `)
      .eq('follower_id', followerId)
    return { data, error }
  },
}

export default profileService