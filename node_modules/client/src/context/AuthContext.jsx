import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import authService from '../lib/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password, username) => {
    return authService.signUp({ email, password, username })
  }

  const signIn = async (email, password) => {
    return authService.signIn({ email, password })
  }

  const signInWithGoogle = async () => {
    return authService.signInWithGoogle()
  }

  const signOut = async () => {
    return authService.signOut()
  }

  const resetPassword = async (email) => {
    return authService.resetPassword(email)
  }

  const updatePassword = async (newPassword) => {
    return authService.updatePassword(newPassword)
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext