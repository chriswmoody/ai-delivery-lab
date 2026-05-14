import { useState } from 'react'
import CollapsibleSection from './CollapsibleSection'

// ── Parse ## sections ──────────────────────────────────────────
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

// ── Extract dashboard numbers ──────────────────────────────────
function extractDashboard(sections) {
  const analysisText = sections['BACKLOG ANALYSIS'] || ''
  const summaryText  = sections['ALIGNMENT SUMMARY'] || ''
  const coverageText = sections['PRIORITY COVERAGE'] || ''

  const lines = analysisText.split('\n').filter(l => l.trim())
  const total    = lines.length
  const strong   = lines.filter(l => l.trimStart().startsWith('STRONG')).length
  const moderate = lines.filter(l => l.trimStart().startsWith('MODERATE')).length
  const weak     = lines.filter(l => l.trimStart().startsWith('WEAK')).length
  const none     = lines.filter(l => l.trimStart().startsWith('NONE')).length

  // Overall health from summary text
  let health = 'unknown'
  const s = summaryText.toLowerCase()
  if (s.includes('alignment tier: strong'))        health = 'strong'
  else if (s.includes('alignment tier: moderate')) health = 'moderate'
  else if (s.includes('alignment tier: weak'))     health = 'weak'
  else if (total > 0) {
    const alignedRatio = (strong + moderate) / total
    if (alignedRatio > 0.65)      health = 'strong'
    else if (alignedRatio > 0.35) health = 'moderate'
    else                          health = 'weak'
  }

  const gapCount = (coverageText.match(/No aligned work found/g) || []).length

  return { total, strong, moderate, weak, none, health, gapCount }
}

// ── Health config ──────────────────────────────────────────────
const HEALTH_CONFIG = {
  strong:  { label: 'Strong',    bg: 'rgba(125,212,189,0.15)', border: 'rgba(125,212,189,0.5)', color: '#2d6b5e' },
  moderate:{ label: 'Moderate',  bg: 'rgba(122,175,212,0.15)', border: 'rgba(122,175,212,0.5)', color: '#2a5270' },
  weak:    { label: 'Weak',      bg: 'rgba(232,168,128,0.18)', border: 'rgba(232,168,128,0.5)', color: '#7a4a28' },
  unknown: { label: 'Analyzing', bg: 'rgba(200,194,188,0.2)',  border: 'rgba(200,194,188,0.5)', color: '#4a4540' },
}

// ── Score tier colors ──────────────────────────────────────────
const SCORE_CONFIG = {
  STRONG:   { color: '#2d6b5e', bg: 'rgba(125,212,189,0.15)', border: 'rgba(125,212,189,0.4)' },
  MODERATE: { color: '#2a5270', bg: 'rgba(122,175,212,0.15)', border: 'rgba(122,175,212,0.4)' },
  WEAK:     { color: '#7a4a28', bg: 'rgba(232,168,128,0.18)', border: 'rgba(232,168,128,0.4)' },
  NONE:     { color: '#8b2020', bg: 'rgba(220,80,80,0.08)',   border: 'rgba(220,80,80,0.3)'   },
}

// ── Tooltip ────────────────────────────────────────────────────
function Tooltip({ text }) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useState(null)

  function handleMouseEnter(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
    setVisible(true)
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 5, cursor: 'default' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        width: 14, height: 14, borderRadius: '50%',
        background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: 'var(--color-slate)', fontFamily: 'var(--font-display)',
        fontWeight: 600, lineHeight: 1, flexShrink: 0,
      }}>?</span>
      {visible && (
        <span style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          transform: 'translate(-50%, -100%)',
          background: 'var(--color-ink)', color: '#fff',
          fontSize: 11, lineHeight: 1.5, fontFamily: 'var(--font-body)',
          padding: '6px 10px', borderRadius: 6,
          width: 200, textAlign: 'center',
          pointerEvents: 'none', zIndex: 9999,
          whiteSpace: 'normal',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

// ── Backlog analysis with color badges ─────────────────────────
function BacklogAnalysisBody({ text }) {
  const lines = text.split('\n').filter(l => l.trim())
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, i) => {
        const match = line.match(/^(STRONG|MODERATE|WEAK|NONE)\s+(.+)$/)
        if (!match) return (
          <div key={i} style={{ fontSize: 13, color: 'var(--color-slate)', lineHeight: 1.6 }}>{line}</div>
        )
        const [, score, rest] = match
        const cfg = SCORE_CONFIG[score] || SCORE_CONFIG.NONE
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'baseline', gap: 10,
            padding: '6px 10px',
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 6,
          }}>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.6px',
              color: cfg.color, flexShrink: 0, minWidth: 64,
            }}>
              {score}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.5 }}>{rest}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Collapsible backlog analysis section ──────────────────────
function CollapsibleBacklogSection({ title, text, accentColor }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  function handleCopy(e) {
    e.stopPropagation()
    const lines = text.split('\n').filter(l => l.trim())
    const rows = lines.map(line => {
      const match = line.match(/^(STRONG|MODERATE|WEAK|NONE)\s+(.+?)\s*→\s*(.+)$/)
      if (match) return [match[1], match[2].trim(), match[3].trim()].join('\t')
      return line
    })
    const tsv = ['Alignment Score\tItem\tPriority', ...rows].join('\n')
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '0 10px 10px 0',
      overflow: 'hidden',
      marginBottom: 10,
      background: '#fff',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px',
          background: 'var(--color-sand)',
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left', gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, color: 'var(--color-slate)',
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            flexShrink: 0, lineHeight: 1,
          }}>›</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)',
          }}>
            {title}
          </span>
        </div>
        {open && (
          <button
            onClick={handleCopy}
            style={{
              fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 500,
              color: copied ? 'var(--color-mint)' : 'var(--color-mist)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '2px 4px', flexShrink: 0, transition: 'color 0.15s',
            }}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        )}
      </button>
      {open && (
        <div style={{ padding: '12px 14px' }}>
          <BacklogAnalysisBody text={text} />
        </div>
      )}
    </div>
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
      marginBottom: 16,
      background: '#fff',
      position: 'relative',
    }}>
      {/* Overall alignment */}
      <div style={{
        padding: '14px 20px',
        background: hc.bg,
        borderRight: `1px solid ${hc.border}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
        minWidth: 110,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: hc.color, opacity: 0.75 }}>Alignment</span>
          <Tooltip text="Overall health of your backlog relative to your stated priorities. Based on the ratio of Strong and Moderate scored items." />
        </div>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, color: hc.color }}>{hc.label}</span>
      </div>

      {/* Items analyzed */}
      <div style={{ padding: '14px 16px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)' }}>Items Analyzed</span>
          <Tooltip text="Total number of backlog items scored in this analysis." />
        </div>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-ink)' }}>
          {dash.total > 0
            ? <>{dash.strong + dash.moderate} aligned <span style={{ color: 'var(--color-mist' }}>of {dash.total}</span></>
            : <span style={{ color: 'var(--color-mist)' }}>—</span>
          }
        </span>
      </div>

      {/* Orphaned */}
      <div style={{ padding: '14px 16px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)' }}>Orphaned Work</span>
          <Tooltip text="Items with no connection to any strategic priority. These are consuming capacity without contributing to your stated goals." />
        </div>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 500, color: dash.none > 0 ? '#8b2020' : '#2d6b5e' }}>
          {dash.none > 0 ? `${dash.none} item${dash.none > 1 ? 's' : ''}` : 'None found'}
        </span>
      </div>

      {/* Priority gaps */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)' }}>Priority Gaps</span>
          <Tooltip text="Strategic priorities with no backlog items pointing at them. These goals have no planned work and will not be delivered." />
        </div>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 500, color: dash.gapCount > 0 ? '#7a4a28' : '#2d6b5e' }}>
          {dash.gapCount > 0 ? `${dash.gapCount} uncovered` : 'None found'}
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

// ── Section config ─────────────────────────────────────────────
const SECTION_CONFIG = {
  'ALIGNMENT SUMMARY':   { accent: 'rgba(122,175,212,0.7)',  defaultOpen: true, tooltip: 'Overall alignment health across your backlog, including total items scored and counts of orphaned work and coverage gaps.' },
  'BACKLOG ANALYSIS':    { accent: 'rgba(125,212,189,0.7)',  defaultOpen: true, tooltip: 'Every backlog item scored against your priorities. Strong and Moderate items have a clear connection. Weak and None are the action items.' },
  'PRIORITY COVERAGE':   { accent: 'rgba(122,175,212,0.7)',  defaultOpen: true, tooltip: 'For each priority, what backlog work is pointing at it. Gaps mean a stated goal has no planned work behind it.' },
  'ORPHANED WORK':       { accent: 'rgba(220,80,80,0.5)',    defaultOpen: true, tooltip: 'Items with no connection to any priority. These consume capacity without contributing to your stated goals.' },
  'RECOMMENDED ACTIONS': { accent: 'rgba(232,168,128,0.7)',  defaultOpen: true, tooltip: 'The highest-leverage moves based on this analysis — what to cut, defer, add, or rewrite.' },
}

const SECTION_ORDER = [
  'ALIGNMENT SUMMARY',
  'BACKLOG ANALYSIS',
  'PRIORITY COVERAGE',
  'ORPHANED WORK',
  'RECOMMENDED ACTIONS',
]

// ── Main export ────────────────────────────────────────────────
export default function ValueAlignmentOutputPanel({ output, isLoading, error }) {

  if (error === 'daily_limit_reached') {
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 32, background: '#fff', textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Daily limit reached</p>
        <p style={{ fontSize: 14, color: 'var(--color-slate)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 20px' }}>
          This tool runs on a daily usage limit to keep it free and accessible. The limit resets tomorrow.
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
        <p style={{ fontSize: 14, color: 'var(--color-slate)', margin: 0 }}>Analyzing alignment...</p>
      </div>
    )
  }

  if (!output) {
    return (
      <div style={{ border: '1px dashed var(--color-mist)', borderRadius: 12, padding: '56px 32px', background: 'var(--color-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-mist)', margin: 0, textAlign: 'center' }}>
          Enter your priorities and backlog, then click Run. Your alignment report will appear here.
        </p>
      </div>
    )
  }

  const sections = parseSections(output)
  const dash = extractDashboard(sections)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <CopyAllButton text={output} />
      </div>

      <DashboardStrip dash={dash} />

      {SECTION_ORDER.map(key => {
        if (!sections[key]) return null
        const cfg = SECTION_CONFIG[key] || { accent: 'var(--color-border)', defaultOpen: true }

        if (key === 'BACKLOG ANALYSIS') {
          return (
            <CollapsibleBacklogSection
              key={key}
              title={key}
              text={sections[key]}
              accentColor={cfg.accent}
            />
          )
        }

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
    </div>
  )
}
