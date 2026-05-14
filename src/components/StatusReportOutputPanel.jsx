import { useState } from 'react'
import CollapsibleSection from './CollapsibleSection'
import { generateExecPptx, generateFullPptx } from '../functions/statusReportPptx'

// ── Parse sections ─────────────────────────────────────────────
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

// ── Health config ──────────────────────────────────────────────
const HEALTH_CONFIG = {
  'ON TRACK':  { bg: 'rgba(125,212,189,0.15)', border: 'rgba(125,212,189,0.5)', color: '#2d6b5e', dot: 'var(--color-mint)' },
  'AT RISK':   { bg: 'rgba(232,168,128,0.18)', border: 'rgba(232,168,128,0.5)', color: '#7a4a28', dot: 'var(--color-peach)' },
  'OFF TRACK': { bg: 'rgba(220,80,80,0.1)',    border: 'rgba(220,80,80,0.35)',  color: '#8b2020', dot: '#dc5050'           },
}

function getHealth(sections) {
  const raw = (sections['HEALTH STATUS'] || '').trim()
  if (raw.startsWith('ON TRACK'))  return 'ON TRACK'
  if (raw.startsWith('AT RISK'))   return 'AT RISK'
  if (raw.startsWith('OFF TRACK')) return 'OFF TRACK'
  return null
}

function getHealthSentence(sections) {
  const raw = (sections['HEALTH STATUS'] || '').trim()
  const lines = raw.split('\n').filter(l => l.trim())
  return lines.length > 1 ? lines.slice(1).join(' ').trim() : ''
}

// ── Health banner ──────────────────────────────────────────────
function HealthBanner({ sections }) {
  const health = getHealth(sections)
  const sentence = getHealthSentence(sections)
  if (!health) return null
  const hc = HEALTH_CONFIG[health]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', marginBottom: 12,
      background: hc.bg, border: `1px solid ${hc.border}`, borderRadius: 10,
    }}>
      <span style={{
        fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.8px',
        color: hc.color, flexShrink: 0,
        padding: '3px 10px', borderRadius: 100,
        border: `1px solid ${hc.border}`, background: '#fff',
      }}>
        {health}
      </span>
      {sentence && (
        <span style={{ fontSize: 13, color: hc.color, fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
          {sentence}
        </span>
      )}
    </div>
  )
}

// ── Copy all button ────────────────────────────────────────────
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

// ── Export PPT button ──────────────────────────────────────────
function ExportPptButton({ output, reportType, projectName, audience }) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const period = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      console.log('PPT export starting, reportType:', reportType, 'output length:', output?.length)
      if (reportType === 'exec') {
        await generateExecPptx({ output, projectName, audience, period })
      } else {
        await generateFullPptx({ output, projectName, audience, period })
      }
      console.log('PPT export complete')
    } catch (err) {
      console.error('PPT export error:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button onClick={handleExport} disabled={exporting} className="btn-secondary" style={{
      height: 36, fontSize: 13, gap: 6,
      color: 'var(--color-slate)',
      opacity: exporting ? 0.6 : 1,
    }}>
      {exporting ? 'Generating...' : '↓ Export to PPT'}
    </button>
  )
}

// ── Section configs ────────────────────────────────────────────
const EXEC_SECTIONS = [
  { key: 'WHERE WE STAND',      accent: 'rgba(122,175,212,0.7)',  tooltip: 'Outcome-focused summary of where things stand. Progress, trajectory, and any key numbers.' },
  { key: 'RISKS AND DECISIONS', accent: 'rgba(232,168,128,0.7)',  tooltip: 'Active risks with visibility and decisions made or pending. Each item has an owner and consequence.' },
  { key: 'THE ASK',             accent: 'rgba(125,212,189,0.7)',  tooltip: 'The single most important thing needed from the executive or sponsor. One decision, unblock, or resource.' },
]

const FULL_SECTIONS = [
  { key: 'SUMMARY',              accent: 'rgba(122,175,212,0.7)',  tooltip: 'The most important thing to know right now. Leads with the most significant development.' },
  { key: 'PROGRESS BY AREA',    accent: 'rgba(125,212,189,0.7)',  tooltip: 'What was completed and what is in progress, broken down by workstream or area.' },
  { key: 'DECISIONS MADE',      accent: 'rgba(125,212,189,0.7)',  tooltip: 'Decisions taken since the last update with owner and date where available.' },
  { key: 'RISKS AND BLOCKERS',  accent: 'rgba(232,168,128,0.7)',  tooltip: 'Active risks and blockers with owners, impact if unresolved, and recommended actions.' },
  { key: "WHAT'S NEXT",         accent: 'rgba(122,175,212,0.7)',  tooltip: 'The most important things happening in the next period — milestones, tickets, and dates.' },
  { key: 'THE ASK',             accent: 'rgba(125,212,189,0.7)',  tooltip: 'One specific action needed from stakeholders — a decision, approval, resource, or unblock.' },
]

// ── Main export ────────────────────────────────────────────────
export default function StatusReportOutputPanel({ output, isLoading, error, reportType, projectName, audience }) {

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
        <p style={{ fontSize: 14, color: 'var(--color-slate)', margin: 0 }}>Writing your status report...</p>
      </div>
    )
  }

  if (!output) {
    return (
      <div style={{ border: '1px dashed var(--color-mist)', borderRadius: 12, padding: '56px 32px', background: 'var(--color-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-mist)', margin: 0, textAlign: 'center' }}>
          Fill in your status information and click Run. Your report will appear here.
        </p>
      </div>
    )
  }

  const sections = parseSections(output)
  const sectionConfig = reportType === 'exec' ? EXEC_SECTIONS : FULL_SECTIONS

  return (
    <div>
      {/* Top bar: copy all + export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <CopyAllButton text={output} />
        <ExportPptButton
          output={output}
          reportType={reportType}
          projectName={projectName}
          audience={audience}
        />
      </div>

      {/* Health banner */}
      <HealthBanner sections={sections} />

      {/* Sections */}
      {sectionConfig.map(({ key, accent, tooltip }) => {
        if (!sections[key]) return null
        return (
          <CollapsibleSection
            key={key}
            title={key}
            body={sections[key]}
            defaultOpen={true}
            accentColor={accent}
            tooltip={tooltip}
          />
        )
      })}
    </div>
  )
}
