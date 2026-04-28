import { supabase } from './supabaseClient'

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}

export const onAuthStateChange = (callback) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)
  return subscription
}

export const getStaffRole = (session) => {
  if (!session?.user?.user_metadata) return null
  return session.user.user_metadata.role || 'staff'
}

export const isAdmin = (session) => {
  return getStaffRole(session) === 'admin'
}
