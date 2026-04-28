import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '')

async function validateToken(token: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('id,room_number,guest_name')
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
    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate token
    const reservation = await validateToken(token)

    // Insert into sos_alerts
    const { data: alertData, error: insertError } = await supabase
      .from('sos_alerts')
      .insert({
        reservation_id: reservation.id,
        room_number: reservation.room_number,
        guest_name: reservation.guest_name,
      })
      .select()
      .single()

    if (insertError || !alertData) {
      return new Response(JSON.stringify({ error: `Database error: ${insertError?.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send FCM notification to staff
    const fcmPayload = {
      to: '/topics/staff-alerts',
      notification: {
        title: 'SOS Alert',
        body: `Guest in room ${reservation.room_number} (${reservation.guest_name}) has triggered an SOS alert.`,
      },
      data: {
        alert_id: alertData.id,
        room_number: reservation.room_number,
        guest_name: reservation.guest_name,
      },
    }

    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload),
    })

    return new Response(
      JSON.stringify({
        alert_id: alertData.id,
        triggered_at: alertData.triggered_at,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: `Server error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
