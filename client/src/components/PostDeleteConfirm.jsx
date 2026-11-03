// PostDeleteConfirm - Phase 3: Confirm post deletion
import { useState } from 'react'
import { Trash2, X } from 'lucide-react'

export default function PostDeleteConfirm({ post, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      onConfirm(post.id)
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">
            <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Delete Post
          </h2>
          <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-neutral-700 mb-6">
          Are you sure you want to delete this post? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn btn-outline text-neutral-600 hover:text-brand-600"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 btn btn-outline border-red-500 text-red-600 hover:bg-red-50 focus:ring-red-500"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete post'}
          </button>
        </div>
      </div>
    </div>
  )
}