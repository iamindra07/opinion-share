// NewPostsPage - Phase 3: Latest posts from all users
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { notificationService } from '../lib/notificationService'

export default function NewPostsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [userVotes, setUserVotes] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
    fetchUserVotes()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!author_id (username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserVotes = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('post_votes')
        .select('post_id')
        .eq('user_id', user.id)

      if (error) throw error
      const votedPostIds = new Set(data?.map((v) => v.post_id) || [])
      setUserVotes(votedPostIds)
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleUpvote = async (postId) => {
    if (!user) return

    const alreadyVoted = userVotes.has(postId)

    try {
      if (alreadyVoted) {
        const { error } = await supabase
          .from('post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
        if (error) throw error

        setUserVotes((prev) => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })

        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, upvote_count: Math.max(0, p.upvote_count - 1) } : p
          )
        )
      } else {
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

        setUserVotes((prev) => {
          const next = new Set(prev)
          next.add(postId)
          return next
        })

        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, upvote_count: p.upvote_count + 1 } : p
          )
        )
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading posts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-neutral-900">New Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">No posts yet.</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card p-4 hover:shadow-md relative">
            <div className="flex gap-3 mb-3">
              <img
                className="avatar w-8 h-8"
                src="https://ui-avatars.com/api/?name=user&background=random"
                alt="avatar"
              />
              <div>
                <Link to={`/profile/${post.profiles?.username}`} className="text-sm font-semibold text-neutral-900 hover:underline">
                  {post.profiles?.username || 'Unknown user'}
                </Link>
                <p className="text-xs text-neutral-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-900 mb-3">{post.content}</p>
            <div className="flex gap-4 text-xs text-neutral-500 mb-3">
              {!(
                user && post.author_id === user.id
              ) && (
                <button
                  onClick={() => handleUpvote(post.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    userVotes.has(post.id)
                      ? 'text-brand-600 hover:text-brand-700'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      userVotes.has(post.id) ? 'fill-brand-600' : 'fill-none'
                    }`}
                    stroke={userVotes.has(post.id) ? 'brand-600' : 'currentColor'}
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"></path>
                  </svg>
                  <span>{post.upvote_count}</span>
                </button>
              )}
              {user && post.author_id === user.id && (
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
            </div>
          </div>
        ))
      )}
    </div>
  )
}