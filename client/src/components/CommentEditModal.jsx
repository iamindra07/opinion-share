// CommentEditModal - Phase 4: Edit own comment
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

const COMMENT_CHAR_LIMIT = 280

export default function CommentEditModal({ comment, onClose, onUpdate }) {
  const [content, setContent] = useState(comment.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const trimmed = content.trim()
    if (!trimmed) {
      setError('Comment cannot be empty')
      setLoading(false)
      return
    }
    if (trimmed.length > COMMENT_CHAR_LIMIT) {
      setError(`Comment exceeds ${COMMENT_CHAR_LIMIT} character limit`)
      setLoading(false)
      return
    }

    try {
      const { error: err } = await supabase
        .from('comments')
        .update({ content: trimmed })
        .eq('id', comment.id)

      if (err) throw err
      onUpdate && onUpdate(comment.id, trimmed)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Edit Comment</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <textarea
              className="input min-h-[150px]"
              rows={5}
              placeholder="Edit your comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={COMMENT_CHAR_LIMIT}
            ></textarea>
            <div className="flex justify-end text-xs text-neutral-400 mt-1">
              {content.length}/{COMMENT_CHAR_LIMIT}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-outline text-neutral-600 hover:text-brand-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={loading || !content.trim() || content.length > COMMENT_CHAR_LIMIT}
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}