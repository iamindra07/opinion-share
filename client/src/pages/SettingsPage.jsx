import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, updatePassword, signOut } = useAuth()

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id)

      if (err) throw err
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    }
    setLoading(false)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error: err } = await updatePassword(newPassword)
    if (err) {
      setError(err.message)
    } else {
      setSuccess('Password changed successfully')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure? This will permanently delete your account and all your data.',
      )
    ) {
      return
    }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.admin.deleteUser(user.id)
      if (err) throw err
    } catch (err) {
      setError(err.message || 'Failed to delete account')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/feed" className="text-brand-600 text-sm font-medium hover:underline">
            ← Back to feed
          </Link>
          <h1 className="text-xl font-bold text-neutral-900 mt-2">Account Settings</h1>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-6 uppercase tracking-wider">
            Profile
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Display name
              </label>
              <input
                type="text"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Bio
              </label>
              <textarea
                className="input"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Profile picture URL
              </label>
              <input
                type="url"
                className="input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Leave blank to use default avatar
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-auto"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
        </div>

        <div className="mt-6 card p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-6 uppercase tracking-wider">
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                New password
              </label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-auto"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Change password'}
            </button>
          </form>
        </div>

        <div className="mt-6 card p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-6 uppercase tracking-wider">
            Danger Zone
          </h2>

          <button
            onClick={handleDeleteAccount}
            className="btn btn-ghost w-auto text-red-600 focus:ring-red-500 hover:bg-red-50 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete account'}
          </button>

          <button
            onClick={handleSignOut}
            className="btn btn-ghost w-auto ml-3 text-neutral-600 focus:ring-neutral-500 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}