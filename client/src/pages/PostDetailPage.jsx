// PostDetailPage - Phase 4: Post detail with threaded comments, replies, upvoting, edit/delete
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import PostEditModal from '../components/PostEditModal'
import PostDeleteConfirm from '../components/PostDeleteConfirm'
import CommentThread from '../components/CommentThread'
import { notificationService } from '../lib/notificationService'

export default function PostDetailPage() {
  const { postId } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [topLevelComments, setTopLevelComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [editingPost, setEditingPost] = useState(null)
  const [deletingPost, setDeletingPost] = useState(null)

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!author_id (username, display_name, avatar_url)
        `)
        .eq('id', postId)
        .single()

      if (postError) throw postError
      setPost(postData)

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          reply_count,
          profiles!author_id (username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError
      setTopLevelComments(commentsData || [])
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    const content = commentContent.trim()
    if (!content) return

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        content,
      })
      if (error) throw error

      // Create notification for post author (if not self-comment)
      if (post && post.author_id !== user.id) {
        await notificationService.createNotification({
          recipientId: post.author_id,
          actorId: user.id,
          type: 'comment_post',
          postId: post.id,
        })
      }

      setCommentContent('')
      fetchPost()
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
    setPost((prev) => (prev ? { ...prev, content: newContent } : prev))
    setEditingPost(null)
  }

  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      window.location.href = '/feed'
    } catch (err) {
      console.error(err.message || 'Failed to delete post')
      setDeletingPost(null)
    }
  }

  const handleConfirmDelete = (post) => {
    setDeletingPost(post)
  }

  const handleCloseDelete = () => {
    setDeletingPost(null)
  }

  const handleCommentUpdated = (commentId, action) => {
    if (action === 'increment') {
      setPost((prev) => (prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev))
    } else if (action === 'decrement') {
      setPost((prev) => (prev ? { ...prev, comment_count: Math.max(0, prev.comment_count - 1) } : prev))
    }
  }

  const handleCommentDeleted = (commentId) => {
    setTopLevelComments((prev) => prev.filter((c) => c.id !== commentId))
    handleCommentUpdated(commentId, 'decrement')
  }

  const isOwnPost = user && post && post.author_id === user.id

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading post...</p>
      </div>
    )
  }

  if (!post) {
    return <div className="text-center py-20"><p className="text-neutral-500">Post not found.</p></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div className="card p-4">
        <div className="flex gap-3 mb-3">
          <img className="avatar w-8 h-8" src="https://ui-avatars.com/api/?name=user&background=random" alt="avatar" />
          <div className="flex items-center gap-2">
            <Link to={`/profile/${post.profiles?.username}`} className="text-sm font-semibold text-neutral-900 hover:underline">
              {post.profiles?.username || 'Unknown user'}
            </Link>
            {isOwnPost && (
              <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded">You</span>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        <p className="text-lg text-neutral-900 mb-3">{post.content}</p>
        <div className="flex gap-4 text-xs text-neutral-500">
          <span>{post.upvote_count} upvotes</span>
          <span>{post.comment_count} comments</span>
          {isOwnPost && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditPost(post)}
                className="hover:text-brand-600" title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button
                onClick={() => handleConfirmDelete(post)}
                className="hover:text-red-600" title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 pb-4">
        <textarea
          className="flex-1 input resize-none"
          rows={2}
          placeholder="Add a comment..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
        ></textarea>
        <button
          onClick={handleAddComment}
          className="btn btn-primary px-4 disabled:opacity-50 disabled:pointer-events-none"
          disabled={!commentContent.trim()}
        >
          Comment
        </button>
      </div>

      <h3 className="text-lg font-semibold text-neutral-900">
        Comments ({topLevelComments.length})
      </h3>
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)] pb-4">
        {topLevelComments.length === 0 ? (
          <p className="text-neutral-500">No comments yet.</p>
        ) : (
          topLevelComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              depth={0}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
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