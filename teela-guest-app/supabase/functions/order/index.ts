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
    .select('id,ezee_reservation_id,room_number')
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
    const { token, items, notes } = await req.json()

    if (!token || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'token and items array are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate token
    const reservation = await validateToken(token)

    // Insert food order with status PLACED
    const { data: orderData, error: insertError } = await supabase
      .from('food_orders')
      .insert({
        reservation_id: reservation.id,
        room_number: reservation.room_number,
        status: 'PLACED',
        items: items,
        total_amount: items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0),
      })
      .select()
      .single()

    if (insertError || !orderData) {
      return new Response(JSON.stringify({ error: `Database error: ${insertError?.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send to eZee POS API for KOT
    const kotPayload = {
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.qty,
        notes: notes || '',
      })),
    }

    const kotResponse = await fetch(
      `${EZEE_BASE_URL}/properties/${EZEE_PROPERTY_ID}/pos/orders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EZEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kotPayload),
      }
    )

    let kotId = null
    if (kotResponse.ok) {
      const kotData = await kotResponse.json()
      kotId = kotData.id
    }

    // Update order status to KOT_SENT and save kot_id
    await supabase
      .from('food_orders')
      .update({
        status: 'KOT_SENT',
        kot_id: kotId,
      })
      .eq('id', orderData.id)

    // Charge each item to folio
    for (const item of items) {
      await fetch(
        `${EZEE_BASE_URL}/properties/${EZEE_PROPERTY_ID}/folios/${reservation.ezee_reservation_id}/charges`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${EZEE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: item.name,
            amount: item.price * item.qty,
            quantity: item.qty,
          }),
        }
      )
    }

    return new Response(
      JSON.stringify({
        order_id: orderData.id,
        status: 'KOT_SENT',
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
