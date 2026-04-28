import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function getTokenFromHeader(
  authHeader: string | null
): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }
  return authHeader.slice(7)
}

export async function validateGuestToken(
  token: string
): Promise<{ reservation_id: string; ezee_reservation_id: string; room_number: string; guest_name: string }> {
  const { data, error } = await supabase
    .from('reservations')
    .select('id,ezee_reservation_id,room_number,guest_name')
    .eq('unique_token', token)
    .single()

  if (error || !data) {
    throw new Error('Invalid or expired token')
  }

  return {
    reservation_id: data.id,
    ezee_reservation_id: data.ezee_reservation_id,
    room_number: data.room_number,
    guest_name: data.guest_name,
  }
}

export function buildErrorResponse(
  statusCode: number,
  message: string
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

export function buildSuccessResponse(
  data: Record<string, unknown>
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
