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
    .select('id,ezee_reservation_id,checkout_date')
    .eq('unique_token', token)
    .single()

  if (error || !data) {
    throw new Error('Invalid or expired token')
  }

  // Check if token expired (24 hours after checkout_date)
  if (data.checkout_date) {
    const checkoutTime = new Date(data.checkout_date).getTime()
    const expiryTime = checkoutTime + 24 * 60 * 60 * 1000
    if (Date.now() > expiryTime) {
      throw new Error('Token has expired')
    }
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
    const { token, activity_id, booking_date, time_slot, num_guests } = await req.json()

    if (!token || !activity_id || !booking_date || !time_slot || !num_guests) {
      return new Response(
        JSON.stringify({ error: 'token, activity_id, booking_date, time_slot, num_guests are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate token
    const reservation = await validateToken(token)

    // Fetch activity price
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('name,price_per_person')
      .eq('id', activity_id)
      .single()

    if (activityError || !activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const amount = (activity.price_per_person || 0) * num_guests

    // Insert into activity_bookings
    const { data: bookingData, error: bookingError } = await supabase
      .from('activity_bookings')
      .insert({
        reservation_id: reservation.id,
        activity_id,
        booking_date,
        time_slot,
        num_guests,
        amount,
        status: 'CONFIRMED',
      })
      .select()
      .single()

    if (bookingError || !bookingData) {
      return new Response(JSON.stringify({ error: `Database error: ${bookingError?.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Charge to folio
    await fetch(
      `${EZEE_BASE_URL}/properties/${EZEE_PROPERTY_ID}/folios/${reservation.ezee_reservation_id}/charges`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EZEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: activity.name,
          amount: amount,
          quantity: num_guests,
        }),
      }
    )

    return new Response(
      JSON.stringify({
        booking_id: bookingData.id,
        activity_name: activity.name,
        amount,
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
