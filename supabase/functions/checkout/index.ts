import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  return new Response(JSON.stringify({ message: 'checkout function ready' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
