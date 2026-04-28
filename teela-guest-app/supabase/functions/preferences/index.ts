import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const EZEE_API_KEY = Deno.env.get('EZEE_API_KEY')
const EZEE_PROPERTY_ID = Deno.env.get('EZEE_PROPERTY_ID')
const EZEE_BASE_URL = Deno.env.get('EZEE_BASE_URL') || 'https://api.ezeetech.com/v1'

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '')

async function validateToken(token: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('id,ezee_reservation_id')
    .eq('unique_token', token)
    .single()

  if (error || !data) {
    throw new Error('Invalid or expired token')
  }

  return data
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const {
      token,
      pillow_preference,
      wakeup_time,
      dietary_tags,
      special_requests,
    } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate token
    const reservation = await validateToken(token)

    // Insert into guest_preferences
    const { error: insertError } = await supabase
      .from('guest_preferences')
      .insert({
        reservation_id: reservation.id,
        pillow_preference,
        wakeup_time,
        dietary_tags,
        special_requests,
      })

    if (insertError) {
      return new Response(
        JSON.stringify({ error: `Database error: ${insertError.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Call eZee API to update reservation with preferences as notes
    const preferencesNotes = `Pillow: ${pillow_preference || 'Not specified'}, Wakeup: ${wakeup_time || 'Not specified'}, Diet: ${dietary_tags?.join(', ') || 'Not specified'}, Requests: ${special_requests || 'None'}`

    await fetch(
      `${EZEE_BASE_URL}/properties/${EZEE_PROPERTY_ID}/reservations/${reservation.ezee_reservation_id}/checkin`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EZEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: preferencesNotes,
        }),
      }
    )

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: `Server error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
