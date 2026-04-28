import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)

const TOKEN_STORAGE_KEY = 'teela_token'

/**
 * Get token from URL param or localStorage.
 * URL param takes precedence and saves to localStorage.
 */
export function getToken() {
  // Check URL params first
  const params = new URLSearchParams(window.location.search)
  const urlToken = params.get('token')

  if (urlToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, urlToken)
    return urlToken
  }

  // Fall back to localStorage
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

/**
 * Clear token from localStorage.
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

/**
 * Call a Supabase Edge Function with token in Authorization header.
 * @param {string} name - Function name (e.g., 'checkin', 'order')
 * @param {object} body - Request body
 * @returns {Promise<object>} Response from function
 */
export async function callEdgeFunction(name, body = {}) {
  const token = getToken()

  if (!token && name !== 'checkin') {
    throw new Error('No token available. Please check in first.')
  }

  const functionUrl = `${supabaseUrl}/functions/v1/${name}`

  const headers = {
    'Content-Type': 'application/json',
  }

  if (token && name !== 'checkin') {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Function ${name} failed`)
  }

  return response.json()
}
