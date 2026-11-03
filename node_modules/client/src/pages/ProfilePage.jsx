// ProfilePage - Phase 2 & 5: User profiles with follow system, follower/following lists, post deletion
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { profileService } from '../lib/profileService'
import { useAuth } from '../context/AuthContext'
import FollowButton from '../components/FollowButton'
import PostDeleteConfirm from '../components/PostDeleteConfirm'
import FollowersList from '../components/FollowersList'
import FollowingList from '../components/FollowingList'
import { notificationService } from '../lib/notificationService'
import { formatDistanceToNow } from 'date-fns'

export default function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingPost, setDeletingPost] = useState(null)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await profileService.getProfileByUsername(username)
      if (profileError) throw profileError
      setProfile(profileData)

      const { data: postsData, error: postsError } = await profileService.getProfilePosts(profileData.id)
      if (postsError) throw postsError
      setPosts(postsData || [])

      const { count: fc } = await profileService.getFollowerCount(profileData.id)
      setFollowerCount(fc || 0)

      const { count: flc } = await profileService.getFollowingCount(profileData.id)
      setFollowingCount(flc || 0)

      if (user && user.id !== profileData.id) {
        const { data: following } = await profileService.isFollowing(profileData.id)
        setIsFollowing(following || false)
      }
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowChange = (newValue) => {
    setIsFollowing(newValue)
    if (newValue) {
      setFollowerCount((c) => c + 1)
    } else {
      setFollowerCount((c) => Math.max(0, c - 1))
    }
  }

  const handleUpvote = async (postId) => {
    try {
      const { error } = await supabase.from('post_votes').insert({
        post_id: postId,
        user_id: user.id,
      })
      if (error) throw error

      const post = posts.find((p) => p.id === postId)
      if (post && post.author_id !== user.id) {
        await notificationService.createNotification({
          recipientId: post.author_id,
          actorId: user.id,
          type: 'like_post',
          postId: post.id,
        })
      }

      fetchPosts()
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setDeletingPost(null)
    } catch (err) {
      console.error(err.message)
      setDeletingPost(null)
    }
  }

  const handleConfirmDelete = (post) => {
    setDeletingPost(post)
  }

  const handleCloseDelete = () => {
    setDeletingPost(null)
  }

  const isOwnProfile = user && profile && user.id === profile.id

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Profile not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col items-center gap-4">
          <img
            className="avatar w-24 h-24"
            src={
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=random`
            }
            alt={profile.username}
          />
          <h2 className="text-xl font-bold text-neutral-900">{profile.username}</h2>
          {profile.display_name && <p className="text-neutral-500">{profile.display_name}</p>}
          {profile.bio && (
            <p className="mt-2 text-sm text-neutral-700">{profile.bio}</p>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-6 flex justify-center gap-8 text-sm text-neutral-600">
          <div className="text-center cursor-pointer group" onClick={() => setShowFollowers(true)}>
            <div className="font-semibold text-neutral-900">{followerCount}</div>
            <div>Followers</div>
          </div>
          <div className="text-center cursor-pointer group" onClick={() => setShowFollowing(true)}>
            <div className="font-semibold text-neutral-900">{followingCount}</div>
            <div>Following</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-neutral-900">{posts.length}</div>
            <div>Posts</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          {isOwnProfile ? (
            <Link to="/settings" className="flex-1 btn btn-primary">
              Edit profile
            </Link>
          ) : (
            <FollowButton
              targetUserId={profile.id}
              isFollowing={isFollowing}
              onChange={handleFollowChange}
            />
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">{posts.length} Posts</h3>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="card p-4">
                <p className="text-sm text-neutral-900 mb-2">{post.content}</p>
                <div className="flex gap-4 text-xs text-neutral-500 mb-3">
                  {!isOwnProfile && (
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className="flex items-center gap-1 hover:text-brand-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"></path>
                      </svg>
                      <span>{post.upvote_count}</span>
                    </button>
                  )}
                  {isOwnProfile && (
                    <span className="flex items-center gap-1 text-neutral-400">
                      {post.upvote_count}
                    </span>
                  )}
                  <button
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="hover:text-brand-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{post.comment_count} comments</span>
                  </button>
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleConfirmDelete(post)}
                      className="ml-auto hover:text-red-600" title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFollowers && (
        <FollowersList
          targetUserId={profile.id}
          open={showFollowers}
          onClose={() => setShowFollowers(false)}
        />
      )}
      {showFollowing && (
        <FollowingList
          targetUserId={profile.id}
          open={showFollowing}
          onClose={() => setShowFollowing(false)}
        />
      )}
      {deletingPost && (
        <PostDeleteConfirm
          post={deletingPost}
          onConfirm={handleDeletePost}
          onCancel={handleCloseDelete}
        />
      )}
    </div>
  )
}