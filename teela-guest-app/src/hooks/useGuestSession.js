import { useQuery } from 'react-query'
import { supabase } from '../lib/supabaseClient'

export function useGuestSession() {
  return useQuery('guest-session', async () => {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return data.session
  })
}
