// FeedPage - Phase 3: Post creation, editing, deletion, New Posts feed
// Following feed will be Phase 5
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import PostEditModal from '../components/PostEditModal'
import PostDeleteConfirm from '../components/PostDeleteConfirm'
import { notificationService } from '../lib/notificationService'

const POST_CHAR_LIMIT = 280

export default function FeedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [userVotes, setUserVotes] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [error, setError] = useState('')
  const [editingPost, setEditingPost] = useState(null)
  const [deletingPost, setDeletingPost] = useState(null)

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
          profiles!author_id (username, display_name, avatar_url, role)
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

  const handleCreatePost = async (e) => {
    e.preventDefault()
    setError('')

    const content = newContent.trim()
    if (!content) {
      setError('Post cannot be empty')
      return
    }
    if (content.length > POST_CHAR_LIMIT) {
      setError(`Post exceeds ${POST_CHAR_LIMIT} character limit`)
      return
    }

    try {
      const { error: err } = await supabase.from('posts').insert({
        author_id: user.id,
        content,
      })
      if (err) throw err
      setNewContent('')
      fetchPosts()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpvote = async (postId) => {
    if (!user) return

    const alreadyVoted = userVotes.has(postId)

    try {
      if (alreadyVoted) {
        // Remove upvote
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
        // Add upvote
        const { error } = await supabase.from('post_votes').insert({
          post_id: postId,
          user_id: user.id,
        })
        if (error) throw error

        // Create notification for post author (if not self-upvote)
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

  const handleEditPost = (post) => {
    setEditingPost(post)
  }

  const handleCloseEdit = () => {
    setEditingPost(null)
  }

  const handlePostUpdated = (newContent) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === editingPost?.id ? { ...p, content: newContent } : p))
    )
    setEditingPost(null)
  }

  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setDeletingPost(null)
    } catch (err) {
      setError(err.message || 'Failed to delete post')
      setDeletingPost(null)
    }
  }

  const handleConfirmDelete = (post) => {
    setDeletingPost(post)
  }

  const handleCloseDelete = () => {
    setDeletingPost(null)
  }

  const isOwnPost = (post) => user && post.author_id === user.id

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading posts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create post form */}
      <div className="card p-4">
        <form onSubmit={handleCreatePost} className="space-y-3">
          <div className="flex gap-3">
            <img
              className="avatar w-10 h-10"
              src="https://ui-avatars.com/api/?name=user&background=random"
              alt="avatar"
            />
            <textarea
              className="flex-1 resize-none border-none bg-transparent focus:ring-0 px-0 py-2 text-sm text-neutral-900 placeholder-neutral-400"
              rows={3}
              placeholder="What's your opinion?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              maxLength={POST_CHAR_LIMIT}
            ></textarea>
            <div className="text-xs text-neutral-400">
              {newContent.length}/{POST_CHAR_LIMIT}
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-auto"
            disabled={!newContent.trim() || newContent.length > POST_CHAR_LIMIT}
          >
            Post
          </button>
        </form>
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Posts list */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No posts yet. Be the first to share your opinion!</p>
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
                <button
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="hover:text-brand-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{post.comment_count} comments</span>
                </button>
                {isOwnPost(post) && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="hover:text-brand-600"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(post)}
                      className="hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {editingPost && (
        <PostEditModal
          post={editingPost}
          onClose={handleCloseEdit}
          onUpdate={handlePostUpdated}
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