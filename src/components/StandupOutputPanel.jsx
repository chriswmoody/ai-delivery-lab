import { useState } from 'react'
import CollapsibleSection from './CollapsibleSection'

// ── Copy button ────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} style={{
      fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 500,
      color: copied ? 'var(--color-mint)' : 'var(--color-slate)',
      background: 'transparent', border: 'none', cursor: 'pointer',
      padding: '2px 4px', transition: 'color 0.15s', flexShrink: 0,
    }}>
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

// ── Progress bar ───────────────────────────────────────────────
const STAGES = [
  { key: 'A', label: 'Stage A', sublabel: 'Triage' },
  { key: 'B', label: 'Stage B', sublabel: 'Standup Focus' },
  { key: 'C', label: 'Stage C', sublabel: 'Team Readout' },
]

function ProgressBar({ currentStage, completedStages }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      border: '1px solid var(--color-border)', borderRadius: 10,
      overflow: 'hidden', marginBottom: 20, background: '#fff',
    }}>
      {STAGES.map((stage, i) => {
        const isDone    = completedStages.includes(stage.key)
        const isActive  = currentStage === stage.key
        const isPending = !isDone && !isActive

        let bg     = '#fff'
        let color  = 'var(--color-mist)'
        let border = 'none'

        if (isDone)   { bg = 'rgba(125,212,189,0.12)'; color = '#2d6b5e' }
        if (isActive) { bg = 'rgba(122,175,212,0.12)'; color = '#2a5270' }

        return (
          <div key={stage.key} style={{
            flex: 1, padding: '12px 16px', background: bg,
            borderRight: i < 2 ? '1px solid var(--color-border)' : 'none',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {/* Circle indicator */}
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDone ? 'var(--color-mint)' : isActive ? 'var(--color-sky)' : 'var(--color-sand)',
              border: isPending ? '1px solid var(--color-border)' : 'none',
            }}>
              {isDone
                ? <span style={{ fontSize: 12, color: '#fff' }}>✓</span>
                : isActive
                  ? <span style={{ display: 'flex', gap: 2 }}>
                      {[0,1,2].map(n => (
                        <span key={n} style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: 'var(--color-sky)',
                          animation: 'pulse 1.4s ease-in-out infinite',
                          animationDelay: `${n * 0.2}s`,
                        }} />
                      ))}
                    </span>
                  : <span style={{ fontSize: 11, color: 'var(--color-mist)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{i + 1}</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color }}>{stage.label}</div>
              <div style={{ fontSize: 12, color: isPending ? 'var(--color-mist)' : color, fontFamily: 'var(--font-body)' }}>{stage.sublabel}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

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
      height: 32, fontSize: 12, gap: 6,
      color: copied ? 'var(--color-mint)' : 'var(--color-slate)',
      borderColor: copied ? 'var(--color-mint)' : undefined,
    }}>
      {copied ? '✓ Copied' : '⎘ Copy all'}
    </button>
  )
}

// ── Section defaults per stage ────────────────────────────────
// Action sections always open; context/reference sections collapsed
const STAGE_SECTION_DEFAULTS = {
  A: {
    'OVERNIGHT SIGNALS':              { defaultOpen: true,  tooltip: 'What materially changed since the last standup — new blockers, late messages, status shifts.' },
    'VELOCITY SIGNAL':                { defaultOpen: true  },
    'RISK FLAGS':                     { defaultOpen: true  },
    'COMPLIANCE OR ESCALATION FLAGS': { defaultOpen: false, tooltip: 'Items with regulatory, legal, security, or executive visibility implications. Handle these outside the standup.' },
    'RECOMMENDED STANDUP FOCUS':      { defaultOpen: true,  tooltip: 'The 3 highest-urgency items to anchor the meeting on, ranked by what needs action today.' },
  },
  B: {
    "TODAY'S FOCUS":      { defaultOpen: true  },
    'WHO TO WATCH':       { defaultOpen: true,  tooltip: 'People or workstreams needing a real conversation today. Includes the one question that will tell you what you need to know.' },
    'DECISIONS TO DRIVE': { defaultOpen: true,  tooltip: 'Decisions that, if they slip another day, cause a downstream problem. Know these before you walk in.' },
    'TAKE OFFLINE':       { defaultOpen: false, tooltip: 'Topics likely to derail the standup if raised in the room. Knowing these lets you redirect quickly.' },
    'HEADS UP':           { defaultOpen: false, tooltip: 'Context to carry into the meeting but not raise in it — political, interpersonal, or sensitive.' },
  },
  C: {
    'READOUT':     { defaultOpen: true },
    'SEND NOTES':  { defaultOpen: true },
  },
}

// ── Stage output panel ─────────────────────────────────────────
function StagePanel({ stageKey, label, sublabel, accentColor, output, isActive, defaultStageOpen = true }) {
  const [stageOpen, setStageOpen] = useState(defaultStageOpen)
  const sections = parseSections(output)
  const hasContent = output && output.trim().length > 0

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '0 12px 12px 0',
      overflow: 'hidden',
      marginBottom: 16,
      background: '#fff',
      opacity: hasContent ? 1 : 0.5,
      transition: 'opacity 0.3s ease',
    }}>
      {/* Stage header — clickable to collapse/expand the whole stage */}
      <button
        onClick={() => hasContent && setStageOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--color-sand)',
          borderBottom: (stageOpen || isActive) ? '1px solid var(--color-border)' : 'none',
          border: 'none',
          cursor: hasContent ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasContent && (
            <span style={{
              fontSize: 13, color: 'var(--color-slate)',
              transition: 'transform 0.18s ease',
              transform: stageOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              lineHeight: 1, flexShrink: 0,
            }}>›</span>
          )}
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)',
          }}>
            {label}
          </span>
          <span style={{ fontSize: 13, color: 'var(--color-slate)', fontFamily: 'var(--font-body)' }}>
            {sublabel}
          </span>
        </div>
        {hasContent && stageOpen && <CopyAllButton text={output} />}
      </button>

      {/* Loading state for active stage */}
      {isActive && !hasContent && stageOpen && (
        <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-slate)' }}>
            {stageKey === 'A' ? 'Analyzing sprint data and context...' :
             stageKey === 'B' ? 'Building standup focus...' :
             'Writing team readout...'}
          </span>
        </div>
      )}

      {/* Sections */}
      {hasContent && stageOpen && (
        <div style={{ padding: '10px 12px' }}>
          {Object.entries(sections).map(([title, body]) => {
            const cfg = (STAGE_SECTION_DEFAULTS[stageKey] || {})[title] || { defaultOpen: true }
            const isHeadsUp = title === "HEADS UP"
            return (
              <CollapsibleSection
                key={title}
                title={title}
                body={isHeadsUp ? `⚠ For your eyes only\n\n${body}` : body}
                defaultOpen={cfg.defaultOpen}
                accentColor={isHeadsUp ? 'rgba(232,168,128,0.6)' : 'var(--color-border)'}
                tooltip={cfg.tooltip}
              />
            )
          })}
        </div>
      )}

      {/* Placeholder when not yet reached */}
      {!hasContent && !isActive && stageOpen && (
        <div style={{ padding: '20px 16px' }}>
          <p style={{ fontSize: 13, color: 'var(--color-mist)', margin: 0 }}>
            Waiting for previous stage to complete...
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────
export default function StandupOutputPanel({ stageA, stageB, stageC, currentStage, error }) {

  const completedStages = [
    stageA ? 'A' : null,
    stageB ? 'B' : null,
    stageC ? 'C' : null,
  ].filter(Boolean)

  const isRunning = currentStage !== null
  const hasAnyOutput = stageA || stageB || stageC

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

  if (!isRunning && !hasAnyOutput) {
    return (
      <div style={{ border: '1px dashed var(--color-mist)', borderRadius: 12, padding: '56px 32px', background: 'var(--color-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-mist)', margin: 0, textAlign: 'center' }}>
          Fill in your sprint data and context, then click Run. All three stages will build on screen.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Disclaimer */}
      <div style={{
        fontSize: 12, color: 'var(--color-slate)', background: 'var(--color-sand)',
        border: '1px solid var(--color-border)', borderRadius: 8,
        padding: '8px 14px', marginBottom: 16, lineHeight: 1.5,
      }}>
        <strong style={{ fontFamily: 'var(--font-display)' }}>How this works:</strong> Three prompts run in sequence, each stage feeding the next. You review and edit before anything goes to your team.
      </div>

      {/* Progress bar */}
      <ProgressBar currentStage={currentStage} completedStages={completedStages} />

      {/* Stage panels */}
      <StagePanel
        stageKey="A" label="Stage A" sublabel="Triage"
        accentColor="rgba(122,175,212,0.8)"
        output={stageA} isActive={currentStage === 'A'}
        defaultStageOpen={false}
      />
      <StagePanel
        stageKey="B" label="Stage B" sublabel="Standup Focus"
        accentColor="rgba(125,212,189,0.8)"
        output={stageB} isActive={currentStage === 'B'}
      />
      <StagePanel
        stageKey="C" label="Stage C" sublabel="Team Readout"
        accentColor="rgba(232,168,128,0.8)"
        output={stageC} isActive={currentStage === 'C'}
      />
    </div>
  )
}
