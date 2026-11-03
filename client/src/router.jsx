import { createBrowserRouter } from 'react-router-dom'

// Route imports
import { LoginPage, SignupPage, ForgotPasswordPage, SettingsPage } from './pages'
import FollowingFeedPage from './pages/FollowingFeedPage'
import NewPostsPage from './pages/NewPostsPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import PostDetailPage from './pages/PostDetailPage'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // Auth routes (guest only)
      {
        path: '/login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: '/signup',
        element: (
          <GuestRoute>
            <SignupPage />
          </GuestRoute>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        ),
      },
      // Protected routes
      {
        path: '/feed',
        element: (
          <ProtectedRoute>
            <FollowingFeedPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/new-posts',
        element: (
          <ProtectedRoute>
            <NewPostsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile/:username',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/post/:postId',
        element: (
          <ProtectedRoute>
            <PostDetailPage />
          </ProtectedRoute>
        ),
      },
      // Redirect root to feed if authenticated, otherwise login
      {
        index: true,
        element: (
          <ProtectedRoute>
            <FollowingFeedPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])