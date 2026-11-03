import { useState } from 'react'
import { profileService } from '../lib/profileService'
import { useAuth } from '../context/AuthContext'
import { Plus, UserMinus } from 'lucide-react'

export default function FollowButton({ targetUserId, isFollowing, onChange }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing)

  const handleClick = async () => {
    if (!user) return
    setLoading(true)

    try {
      // Optimistic update
      setLocalIsFollowing(!localIsFollowing)
      onChange && onChange(!localIsFollowing)

      const { error } = await profileService.toggleFollow(targetUserId)
      if (error) {
        // Revert on error
        setLocalIsFollowing(localIsFollowing)
        onChange && onChange(localIsFollowing)
        throw error
      }
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
        localIsFollowing
          ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
          : 'bg-brand-600 text-white hover:bg-brand-700'
      }`}
    >
      {localIsFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span>Following</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </button>
  )
}