import { useState } from 'react'
import CollapsibleSection from './CollapsibleSection'

// ── Section order (controls display sequence) ──────────────────
const SECTION_ORDER = [
  'STANDUP FOCUS',
  'VELOCITY MATH',
  'DEPENDENCIES',
  'RISK TIER 1 — NEEDS ACTION TODAY',
  'RISK TIER 2 — MONITOR CLOSELY',
  'RISK TIER 3 — ON TRACK',
]

// ── Parse ## sections from AI output ──────────────────────────
function parseSections(text) {
  if (!text) return {}
  const lines = text.split('\n')
  const sections = {}
  let currentKey = null
  let currentBody = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentKey) sections[currentKey] = currentBody.join('\n').trim()
      currentKey = line.replace('## ', '').trim()
      currentBody = []
    } else if (currentKey) {
      currentBody.push(line)
    }
  }
  if (currentKey) sections[currentKey] = currentBody.join('\n').trim()
  return sections
}

// ── Extract dashboard numbers from parsed sections ─────────────
function extractDashboard(sections) {
  const velocityText = sections['VELOCITY MATH'] || ''
  const tier1Text    = sections['RISK TIER 1 — NEEDS ACTION TODAY'] || ''
  const tier2Text    = sections['RISK TIER 2 — MONITOR CLOSELY'] || ''

  // Verdict line: "VERDICT: Will miss — 24 pts short at current pace."
  const verdictMatch = velocityText.match(/VERDICT:\s*([^\n]+)/i)
  const verdict = verdictMatch ? verdictMatch[1].trim() : null

  // Health status from verdict
  let health = 'unknown'
  if (verdict) {
    const v = verdict.toLowerCase()
    if (v.includes('on track'))   health = 'on-track'
    else if (v.includes('at risk')) health = 'at-risk'
    else if (v.includes('will miss') || v.includes('miss')) health = 'will-miss'
  }

  // Count Tier 1 and Tier 2 tickets (count bold ticket IDs or numbered items)
  const tier1Count = (tier1Text.match(/\*\*TICK-|^\*\*[A-Z]+-\d+/gm) || tier1Text.match(/TICK-\d+/g) || []).length
  const tier2Count = (tier2Text.match(/\*\*TICK-|^\*\*[A-Z]+-\d+/gm) || tier2Text.match(/TICK-\d+/g) || []).length

  // Velocity gap: "Required burn rate: X pts/day" and "Actual burn rate: X pts/day"
  const actualMatch  = velocityText.match(/Actual burn rate[:\s]+([0-9.]+)\s*pts?\/day/i)
  const requiredMatch = velocityText.match(/Required burn rate[:\s]+([0-9.]+)\s*pts?\/day/i)
  const shortfallMatch = velocityText.match(/Projected shortfall[:\s]+([0-9]+)\s*pts?/i)

  const actualRate   = actualMatch   ? parseFloat(actualMatch[1])   : null
  const requiredRate = requiredMatch ? parseFloat(requiredMatch[1]) : null
  const shortfall    = shortfallMatch ? parseInt(shortfallMatch[1]) : null
  const velocityGap  = (actualRate && requiredRate) ? (requiredRate / actualRate).toFixed(1) : null

  return { health, verdict, tier1Count, tier2Count, velocityGap, shortfall, actualRate, requiredRate }
}

// ── Health badge config ────────────────────────────────────────
const HEALTH_CONFIG = {
  'on-track':  { label: 'On Track',  bg: 'rgba(125,212,189,0.15)', border: 'rgba(125,212,189,0.5)', color: '#2d6b5e' },
  'at-risk':   { label: 'At Risk',   bg: 'rgba(232,168,128,0.18)', border: 'rgba(232,168,128,0.5)', color: '#7a4a28' },
  'will-miss': { label: 'Will Miss', bg: 'rgba(220,80,80,0.1)',    border: 'rgba(220,80,80,0.35)',  color: '#8b2020' },
  'unknown':   { label: 'Analyzing', bg: 'rgba(200,194,188,0.2)',  border: 'rgba(200,194,188,0.5)', color: '#4a4540' },
}

// ── Copy button ────────────────────────────────────────────────
function CopyButton({ text, small }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} style={{
      fontSize: small ? 11 : 12,
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      color: copied ? 'var(--color-mint)' : 'var(--color-slate)',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '2px 4px',
      transition: 'color 0.15s',
      flexShrink: 0,
    }}>
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

// ── Dashboard strip ────────────────────────────────────────────
function DashboardStrip({ dash }) {
  const hc = HEALTH_CONFIG[dash.health] || HEALTH_CONFIG.unknown

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr 1fr 1fr',
      gap: 0,
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      background: '#fff',
    }}>
      {/* Health */}
      <div style={{
        padding: '14px 20px',
        background: hc.bg,
        borderRight: `1px solid ${hc.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
        minWidth: 110,
      }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: hc.color, opacity: 0.75 }}>Sprint Health</span>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, color: hc.color }}>{hc.label}</span>
      </div>

      {/* Tier 1 / Tier 2 */}
      <div style={{ padding: '14px 16px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)' }}>At-Risk Tickets</span>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-ink)' }}>
          <span style={{ color: '#8b2020' }}>{dash.tier1Count} critical</span>
          <span style={{ color: 'var(--color-mist)', margin: '0 6px' }}>·</span>
          <span style={{ color: '#7a4a28' }}>{dash.tier2Count} watch</span>
        </span>
      </div>

      {/* Velocity gap */}
      <div style={{ padding: '14px 16px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)' }}>Velocity Gap</span>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-ink)' }}>
          {dash.velocityGap
            ? <>{dash.velocityGap}× needed</>
            : <span style={{ color: 'var(--color-mist)' }}>—</span>
          }
        </span>
      </div>

      {/* Shortfall */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)' }}>Projected Shortfall</span>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 500, color: dash.shortfall > 0 ? '#8b2020' : '#2d6b5e' }}>
          {dash.shortfall != null
            ? (dash.shortfall > 0 ? `${dash.shortfall} pts` : 'On pace')
            : <span style={{ color: 'var(--color-mist)' }}>—</span>
          }
        </span>
      </div>
    </div>
  )
}

function CopyAllButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} className="btn-secondary" style={{
      height: 36, fontSize: 13, gap: 6,
      color: copied ? 'var(--color-mint)' : 'var(--color-slate)',
      borderColor: copied ? 'var(--color-mint)' : undefined,
    }}>
      {copied ? '✓ Copied' : '⎘ Copy all'}
    </button>
  )
}

// ── Section config: accent color + default open state ─────────
const SECTION_CONFIG = {
  'STANDUP FOCUS':                    { accent: 'rgba(125,212,189,0.7)',  defaultOpen: true,  tooltip: 'The 2 highest-leverage tickets to probe today, with what a good answer looks like vs. a red flag.' },
  'VELOCITY MATH':                    { accent: 'rgba(122,175,212,0.7)',  defaultOpen: true,  tooltip: 'Live burn rate vs. what is required to finish on time. The VERDICT line is the one-call sprint health signal.' },
  'DEPENDENCIES':                     { accent: 'var(--color-border)',    defaultOpen: true,  tooltip: 'Explicit dependencies were stated in your data. Inferred ones were detected by the analysis but not written down.' },
  'RISK TIER 1 — NEEDS ACTION TODAY': { accent: 'rgba(220,80,80,0.5)',    defaultOpen: true,  tooltip: 'Tickets that need intervention today to avoid missing the sprint. Includes probability and a concrete next step.' },
  'RISK TIER 2 — MONITOR CLOSELY':    { accent: 'rgba(232,168,128,0.7)',  defaultOpen: true,  tooltip: 'Tickets that could slip if left unattended. Not critical yet — but worth watching closely.' },
  'RISK TIER 3 — ON TRACK':           { accent: 'var(--color-border)',    defaultOpen: false },
}

// ── Main component ─────────────────────────────────────────────
export default function SprintOutputPanel({ output, isLoading, error }) {

  if (error === 'daily_limit_reached') {
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 32, background: '#fff', textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Daily limit reached</p>
        <p style={{ fontSize: 14, color: 'var(--color-slate)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 20px' }}>
          This tool runs on a daily usage limit to keep it free and accessible. The limit resets tomorrow. Reach out if you'd like to talk about what you're building.
        </p>
        <a href="https://www.linkedin.com/in/chriswmoody" target="_blank" rel="noopener noreferrer" className="btn-secondary">
          Connect with Chris →
        </a>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ border: '1px solid #f5c6cb', borderRadius: 12, padding: 24, background: '#fff5f5' }}>
        <p style={{ fontSize: 14, color: '#7a2020' }}>Something went wrong. Please try again in a moment.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '56px 32px', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-slate)', margin: 0 }}>Analyzing sprint board...</p>
      </div>
    )
  }

  if (!output) {
    return (
      <div style={{ border: '1px dashed var(--color-mist)', borderRadius: 12, padding: '56px 32px', background: 'var(--color-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-mist)', margin: 0, textAlign: 'center' }}>
          Fill in your sprint data and click Run analysis. Your output will appear here.
        </p>
      </div>
    )
  }

  const sections = parseSections(output)
  const dash = extractDashboard(sections)

  return (
    <div>
      {/* Copy all */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <CopyAllButton text={output} />
      </div>

      {/* Dashboard strip */}
      <DashboardStrip dash={dash} />

      {/* Sections in prescribed order */}
      {SECTION_ORDER.map(key => {
        if (!sections[key]) return null
        const cfg = SECTION_CONFIG[key] || { accent: 'var(--color-border)', defaultOpen: true }
        return (
          <CollapsibleSection
            key={key}
            title={key}
            body={sections[key]}
            defaultOpen={cfg.defaultOpen}
            accentColor={cfg.accent}
            tooltip={cfg.tooltip}
          />
        )
      })}

      {/* Any extra sections the AI returned */}
      {Object.entries(sections)
        .filter(([k]) => !SECTION_ORDER.includes(k))
        .map(([k, v]) => (
          <CollapsibleSection key={k} title={k} body={v} defaultOpen={true} />
        ))
      }
    </div>
  )
}
