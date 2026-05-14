import { getStore } from '@netlify/blobs'

const DAILY_LIMIT = 25

// Returns today's date string in UTC e.g. "2026-05-14"
function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// ── Main handler ────────────────────────────────────────────────
export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // ── Rate limiting ────────────────────────────────────────────
  const ip = context.ip || 'unknown'
  const key = `${ip}::${todayKey()}`

  try {
    const store = getStore('rate-limits')
    const raw = await store.get(key)
    const count = raw ? parseInt(raw, 10) : 0

    if (count >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'daily_limit_reached' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Increment — fire and forget, don't block the response
    store.set(key, String(count + 1), { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) })
  } catch (err) {
    // If blobs is unavailable (e.g. local dev), log and continue
    console.warn('Rate limit store unavailable, skipping:', err.message)
  }

  // ── Parse body ───────────────────────────────────────────────
  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { system, messages, maxTokens, model } = body

  if (!system || !messages) {
    return new Response(JSON.stringify({ error: 'Missing required fields: system, messages' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Call Anthropic ───────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable not set')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens || 800,
        stream: true,
        system,
        messages,
      }),
    })

    if (!anthropicResponse.ok) {
      const data = await anthropicResponse.json()
      console.error('Anthropic API error:', data)
      return new Response(JSON.stringify({ error: 'AI service error', details: data }), {
        status: anthropicResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pipe the SSE stream straight back — Netlify sees active bytes, no 504
    return new Response(anthropicResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('Proxy error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/claude',
  maxDuration: 60,
}
