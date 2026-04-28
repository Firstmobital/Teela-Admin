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
    .select('ezee_reservation_id,checkout_date')
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
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.slice(7)
    const reservation = await validateToken(token)

    // Fetch folio from eZee API
    const folioResponse = await fetch(
      `${EZEE_BASE_URL}/properties/${EZEE_PROPERTY_ID}/folios/${reservation.ezee_reservation_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${EZEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!folioResponse.ok) {
      return new Response(JSON.stringify({ error: 'Folio not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const folioData = await folioResponse.json()

    return new Response(
      JSON.stringify({
        charges: folioData.charges || [],
        subtotal: folioData.subtotal || 0,
        gst_breakdown: {
          cgst: folioData.cgst || 0,
          sgst: folioData.sgst || 0,
        },
        total: folioData.total || 0,
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
