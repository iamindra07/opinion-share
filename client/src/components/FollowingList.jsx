// FollowingList - Phase 5: Modal showing who a user follows
import { useState, useEffect } from 'react'
import { profileService } from '../lib/profileService'
import FollowButton from './FollowButton'

export default function FollowingList({ targetUserId, open, onClose }) {
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !targetUserId) return
    loadFollowing()
  }, [open, targetUserId])

  const loadFollowing = async () => {
    setLoading(true)
    try {
      const { data, error } = await profileService.getFollowing(targetUserId)
      if (error) throw error
      setFollowing(data || [])
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Following</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-neutral-500">Loading following...</p>
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-neutral-500">Not following anyone yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {following.map((follow) => {
              const profile = follow?.profiles?.['follows_following_id_fkey'] ||
                follow?.profiles
              const isOwnProfile = profile?.id === targetUserId
              return (
                <div key={follow.following_id} className="flex items-center justify-between gap-3 p-2 hover:bg-neutral-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img
                      className="avatar w-8 h-8"
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || 'user')}&background=random`}
                      alt={profile?.username || 'user'}
                    />
                    <span className="text-sm text-neutral-900">{profile?.username || 'Unknown user'}</span>
                  </div>
                  {!isOwnProfile && (
                    <FollowButton
                      targetUserId={profile.id}
                      isFollowing={true}
                      onChange={() => {}}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}