import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
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

function encodeBase64(str: string): string {
  return btoa(str)
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const url = new URL(req.url)
    const body = await req.json()

    // Create Razorpay order
    if (url.pathname.endsWith('/payment')) {
      const { token, amount } = body

      if (!token || !amount) {
        return new Response(JSON.stringify({ error: 'token and amount are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Validate token
      await validateToken(token)

      const authHeader = `Basic ${encodeBase64(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`

      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: `teela-${Date.now()}`,
        }),
      })

      if (!razorpayResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to create Razorpay order' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const razorpayData = await razorpayResponse.json()

      return new Response(
        JSON.stringify({
          razorpay_order_id: razorpayData.id,
          amount,
          currency: 'INR',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify payment
    if (url.pathname.endsWith('/payment/verify')) {
      const { token, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

      if (!token || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return new Response(
          JSON.stringify({ error: 'token, razorpay_payment_id, razorpay_order_id, razorpay_signature are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate token
      const reservation = await validateToken(token)

      // Verify HMAC SHA256 signature
      const message = `${razorpay_order_id}|${razorpay_payment_id}`
      const encoder = new TextEncoder()
      const key = encoder.encode(RAZORPAY_KEY_SECRET)
      const data = encoder.encode(message)

      const importedKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signature = await crypto.subtle.sign('HMAC', importedKey, data)
      const computedSignature = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      if (computedSignature !== razorpay_signature) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Call eZee checkout API
      await fetch(
        `${EZEE_BASE_URL}/properties/${EZEE_PROPERTY_ID}/reservations/${reservation.ezee_reservation_id}/checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${EZEE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id: razorpay_payment_id,
          }),
        }
      )

      // Update reservation status to CHECKED_OUT
      await supabase
        .from('reservations')
        .update({ checkin_status: 'CHECKED_OUT' })
        .eq('id', reservation.id)

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: razorpay_payment_id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: `Server error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
