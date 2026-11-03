import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { notificationService } from '../lib/notificationService'
import { profileService } from '../lib/profileService'

export default function Layout() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileUsername, setProfileUsername] = useState('')

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isAuthRoute = ['/login', '/signup', '/forgot-password'].includes(location.pathname)

  // Load unread notification count on mount and when user changes
  useEffect(() => {
    if (!user) return
    const loadUnreadCount = async () => {
      try {
        const { count } = await notificationService.getUnreadCount()
        setUnreadCount(count || 0)
      } catch (err) {
        console.error(err.message)
      }
    }
    loadUnreadCount()
  }, [user])

  // Load current user's profile username for navigation
  useEffect(() => {
    if (!user) return
    const loadProfileUsername = async () => {
      try {
        const { data } = await profileService.getProfileById(user.id)
        if (data?.username) {
          setProfileUsername(data.username)
        }
      } catch (err) {
        console.error(err.message)
      }
    }
    loadProfileUsername()
  }, [user])

  if (loading) return null

  return (
    <div className="min-h-screen bg-neutral-50">
      {!isAuthRoute && user ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
          <nav className="flex items-center justify-around h-16 px-4">
            <button
              onClick={() => navigate('/feed')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl ${
                location.pathname === '/feed' || location.pathname === '/'
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
              } transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span className="text-[10px] mt-0.5">Home</span>
            </button>

            <button
              onClick={() => navigate('/new-posts')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl ${
                location.pathname === '/new-posts'
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
              } transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v4m0 0v4m0-4L9 18l3-3 3 3"></path>
              </svg>
              <span className="text-[10px] mt-0.5">New Posts</span>
            </button>

            <button
              onClick={() => {
                navigate('/notifications')
                setUnreadCount(0)
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl relative text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span className="text-[10px] mt-0.5">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
              )}
            </button>

            <button
              onClick={() => profileUsername ? navigate(`/profile/${profileUsername}`) : navigate('/settings')}
              className="flex flex-col items-center justify-center p-2 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span className="text-[10px] mt-0.5">Profile</span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center justify-center p-2 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span className="text-[10px] mt-0.5">Settings</span>
            </button>
          </nav>
        </div>
      ) : null}

      <div className="max-w-3xl mx-auto py-8 px-4">
        <Outlet />
      </div>
    </div>
  )
}