// CommentThread - Phase 4: Recursive component for nested comments and replies
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import CommentVoteButton from './CommentVoteButton'
import CommentEditModal from './CommentEditModal'
import CommentDeleteConfirm from './CommentDeleteConfirm'
import { notificationService } from '../lib/notificationService'
import { Reply, Edit2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const MAX_REPLY_DEPTH = 3

export default function CommentThread({ comment, depth = 0, onCommentUpdated, onCommentDeleted }) {
  const { user } = useAuth()
  const [replyContent, setReplyContent] = useState('')
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replies, setReplies] = useState([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [deletingComment, setDeletingComment] = useState(null)
  const [repliesFetched, setRepliesFetched] = useState(false)

  const isOwnComment = user && comment.author_id === user.id
  const canReply = depth < MAX_REPLY_DEPTH
  const hasReplies = (comment.reply_count || 0) > 0

  const fetchReplies = async () => {
    if (repliesFetched) return
    setRepliesLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          reply_count,
          profiles!author_id (username, display_name, avatar_url)
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setReplies(data || [])
    } catch (err) {
      console.error(err.message)
    } finally {
      setRepliesLoading(false)
      setRepliesFetched(true)
    }
  }

  const handleAddReply = async (e) => {
    e.preventDefault()
    const content = replyContent.trim()
    if (!content) return

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: comment.post_id,
        author_id: user.id,
        parent_id: comment.id,
        content,
      })
      if (error) throw error

      // Create notification for parent comment author (if not self-reply)
      if (comment.author_id !== user.id) {
        await notificationService.createNotification({
          recipientId: comment.author_id,
          actorId: user.id,
          type: 'reply_comment',
          postId: comment.post_id,
          commentId: comment.id,
        })
      }

      setReplyContent('')
      setShowReplyForm(false)
      await fetchReplies()
      // Refresh parent comment count via callback
      onCommentUpdated && onCommentUpdated(comment.id, 'increment')
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleCommentUpdated = (commentId, newContent) => {
    setReplies((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content: newContent } : c))
    )
    if (comment.id === commentId) {
      // This won't happen since editing is on parent, but handle gracefully
    }
    onCommentUpdated && onCommentUpdated(commentId, 'content_update')
  }

  const handleCommentDeleted = async (commentId) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId)
      if (error) throw error
      setReplies((prev) => prev.filter((c) => c.id !== commentId))
      if (comment.id === commentId) {
        onCommentDeleted && onCommentDeleted(comment.id)
      } else {
        onCommentUpdated && onCommentUpdated(comment.id, 'decrement')
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleConfirmDelete = (c) => {
    setDeletingComment(c)
  }

  const handleCloseDelete = () => {
    setDeletingComment(null)
  }

  const handleEdit = (c) => {
    setEditingComment(c)
  }

  const handleCloseEdit = () => {
    setEditingComment(null)
  }

  return (
    <div className={`ml-${depth * 4} border-l-2 ${
      depth > 0 ? 'border-brand-200 pl-4' : 'border-transparent pl-0'
    } space-y-3`}>
      <div className="card p-4 relative">
        <div className="flex gap-2 mb-2">
          <img
            className="avatar w-6 h-6"
            src="https://ui-avatars.com/api/?name=user&background=random"
            alt="avatar"
          />
          <div className="flex items-center gap-1">
            <Link to={`/profile/${comment.profiles?.username}`} className="text-sm font-semibold text-neutral-900 hover:underline">
              {comment.profiles?.username || 'Unknown user'}
            </Link>
            {isOwnComment && (
              <span className="text-xs text-brand-600 bg-brand-50 px-1.5 py-0 rounded">You</span>
            )}
            {depth > 0 && (
              <>
                <span className="text-xs text-neutral-400">•</span>
                <span className="text-xs text-neutral-400">Reply</span>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-neutral-900 mb-2">{comment.content}</p>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          <CommentVoteButton commentId={comment.id} commentAuthorId={comment.author_id} />
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 hover:text-brand-600 disabled:opacity-50"
            disabled={!canReply}
            title={canReply ? 'Reply' : 'Maximum reply depth reached'}
          >
            <Reply className="w-3 h-3" />
            <span>Reply</span>
          </button>
          {isOwnComment && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleEdit(comment)}
                className="hover:text-brand-600" title="Edit"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleConfirmDelete(comment)}
                className="hover:text-red-600" title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {editingComment && comment.id === editingComment.id && (
          <CommentEditModal
            comment={comment}
            onClose={handleCloseEdit}
            onUpdate={handleCommentUpdated}
          />
        )}
        {deletingComment && comment.id === deletingComment.id && (
          <CommentDeleteConfirm
            comment={comment}
            onConfirm={handleCommentDeleted}
            onCancel={handleCloseDelete}
          />
        )}

        {showReplyForm && canReply && (
          <form onSubmit={handleAddReply} className="mt-3 space-y-2">
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            ></textarea>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary px-3 disabled:opacity-50 disabled:pointer-events-none"
                disabled={!replyContent.trim()}
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="btn btn-outline text-neutral-600 px-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {canReply && !showReplyForm && hasReplies && !repliesFetched && (
          <button
            onClick={fetchReplies}
            className="mt-2 text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View {comment.reply_count} reply{comment.reply_count !== 1 ? 's' : ''}</span>
          </button>
        )}
      </div>

      {replies.length > 0 && (
        <div className="mt-2">
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}