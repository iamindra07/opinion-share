// CommentVoteButton - Phase 4: Upvote/remove upvote for comments
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { notificationService } from '../lib/notificationService'
import { ArrowUp } from 'lucide-react'

export default function CommentVoteButton({ commentId, commentAuthorId }) {
  const { user } = useAuth()
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [voteCount, setVoteCount] = useState(0)

  // Fetch current vote count and user's vote status on mount
  useEffect(() => {
    if (!user) return

    const fetchVoteStatus = async () => {
      try {
        // Get vote count
        const { count } = await supabase
          .from('comment_votes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', commentId)
        setVoteCount(count || 0)

        // Check if current user has voted
        const { data } = await supabase
          .from('comment_votes')
          .select('*')
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
          .maybeSingle()
        setVoted(!!data)
      } catch (err) {
        console.error(err.message)
      }
    }

    fetchVoteStatus()
  }, [user, commentId])

  const handleVote = async () => {
    if (!user) return
    setLoading(true)

    try {
      if (voted) {
        // Remove upvote
        const { error } = await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
        if (error) throw error
        setVoted(false)
        setVoteCount((c) => Math.max(0, c - 1))
      } else {
        // Add upvote
        const { error } = await supabase
          .from('comment_votes')
          .insert({ comment_id: commentId, user_id: user.id })
        if (error) throw error

        // Create notification for comment author (if not self-upvote)
        if (commentAuthorId && commentAuthorId !== user.id) {
          await notificationService.createNotification({
            recipientId: commentAuthorId,
            actorId: user.id,
            type: 'like_comment',
            commentId: commentId,
          })
        }

        setVoted(true)
        setVoteCount((c) => c + 1)
      }
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex items-center gap-1 text-xs transition-colors ${
        voted
          ? 'text-brand-600 hover:text-brand-700'
          : 'text-neutral-500 hover:text-neutral-700'
      }`}
    >
      <svg
        className={`w-4 h-4 ${voted ? 'fill-brand-600' : 'fill-none'}`}
        stroke={voted ? 'brand-600' : 'currentColor'}
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"></path>
      </svg>
      <span>{voteCount}</span>
    </button>
  )
}