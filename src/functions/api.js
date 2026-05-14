/**
 * Calls Anthropic directly in local dev (VITE_ANTHROPIC_API_KEY set in .env.local),
 * or via the Netlify streaming proxy in production (key stays on the server).
 */
const LOCAL_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function callClaude({ system, messages, maxTokens = 1500, model = 'claude-haiku-4-5-20251001' }) {
  // ── Local dev: call Anthropic directly (non-streaming) ──────
  if (LOCAL_KEY) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LOCAL_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error?.message || `Request failed (${response.status})`)
    }

    const data = await response.json()
    return data?.content?.[0]?.text ?? ''
  }

  // ── Production: stream through Netlify proxy ─────────────────
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, maxTokens, model }),
  })

  if (response.status === 429) {
    throw new Error('daily_limit_reached')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Request failed (${response.status})`)
  }

  // Parse SSE stream, collect all text_delta chunks
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // keep incomplete last line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') continue

      try {
        const evt = JSON.parse(payload)
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          text += evt.delta.text
        }
      } catch {
        // malformed line -- skip
      }
    }
  }

  return text
}
