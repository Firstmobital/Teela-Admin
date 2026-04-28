import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const EZEE_API_KEY = Deno.env.get('EZEE_API_KEY')
const EZEE_PROPERTY_ID = Deno.env.get('EZEE_PROPERTY_ID')
const EZEE_BASE_URL = Deno.env.get('EZEE_BASE_URL') || 'https://api.ezeetech.com/v1'

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '')

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { booking_ref, mobile } = await req.json()

    if (!booking_ref || !mobile) {
      return new Response(JSON.stringify({ error: 'booking_ref and mobile are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify booking with eZee API
    const ezeeResponse = await fetch(
      `${EZEE_BASE_URL}/properties/${EZEE_PROPERTY_ID}/reservations/${booking_ref}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${EZEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!ezeeResponse.ok) {
      return new Response(JSON.stringify({ error: 'Booking not found in eZee system' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ezeeData = await ezeeResponse.json()
    const guestName = ezeeData.guest_name || 'Guest'
    const roomNumber = ezeeData.room_number
    const checkinDate = ezeeData.check_in_date
    const checkoutDate = ezeeData.check_out_date

    // Generate unique token
    const uniqueToken = crypto.getRandomValues(new Uint8Array(16))
    const token = Array.from(uniqueToken)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Upsert into reservations table
    const { error: upsertError } = await supabase
      .from('reservations')
      .upsert(
        {
          ezee_reservation_id: booking_ref,
          guest_name: guestName,
          mobile: mobile,
          room_number: roomNumber,
          checkin_date: checkinDate,
          checkout_date: checkoutDate,
          unique_token: token,
          checkin_status: 'PENDING',
        },
        { onConflict: 'ezee_reservation_id' }
      )

    if (upsertError) {
      return new Response(JSON.stringify({ error: `Database error: ${upsertError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        guest_name: guestName,
        room_number: roomNumber,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        token: token,
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
