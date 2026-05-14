import { useState } from 'react'
import CollapsibleSection from './CollapsibleSection'

const STORY_SECTION_TOOLTIPS = {
  'ACCEPTANCE CRITERIA': 'Written in Given/When/Then format. Each criterion should be independently testable with no vague language.',
  'OUT OF SCOPE':        'Explicit boundaries to prevent scope creep during refinement. What the team will not build.',
  'ENGINEERING NOTES':   'Technical dependencies, integration points, and data concerns for the dev team before estimating.',
  'AMBIGUITIES':         'The most valuable section. Every unresolved question the team will hit in refinement — surfaced before they have to ask.',
}

/**
 * Parses markdown-style ## headers into named sections.
 * Returns an array of { title, body } objects.
 */
function parseSections(text) {
  if (!text) return []
  const lines = text.split('\n')
  const sections = []
  let current = null

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current)
      current = { title: line.replace('## ', '').trim(), body: '' }
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line
    }
  }
  if (current) sections.push(current)

  // Trim bodies
  return sections.map(s => ({ ...s, body: s.body.trim() }))
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        fontSize: 11,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        color: copied ? 'var(--color-mint)' : 'var(--color-slate)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 4px',
        transition: 'color 0.15s',
      }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
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

export default function OutputPanel({ output, isLoading, loadingMessage, error }) {

  // Daily limit hit
  if (error === 'daily_limit_reached') {
    return (
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '32px',
        background: '#ffffff',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Daily limit reached</p>
        <p style={{ fontSize: 14, color: 'var(--color-slate)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 20px' }}>
          This tool runs on a daily usage limit to keep it free and accessible.
          The limit resets tomorrow. If you'd like to talk about what you're building,
          reach out directly.
        </p>
        <a
          href="https://www.linkedin.com/in/chriswmoody"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Connect with Chris →
        </a>
      </div>
    )
  }

  // Other error
  if (error) {
    return (
      <div style={{
        border: '1px solid #f5c6cb',
        borderRadius: 12,
        padding: '24px',
        background: '#fff5f5',
      }}>
        <p style={{ fontSize: 14, color: '#7a2020' }}>
          Something went wrong. Please try again in a moment.
        </p>
      </div>
    )
  }

  // Loading
  if (isLoading) {
    return (
      <div style={{
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '48px 32px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-slate)', margin: 0 }}>
          {loadingMessage || 'Analyzing...'}
        </p>
      </div>
    )
  }

  // Empty
  if (!output) {
    return (
      <div style={{
        border: '1px dashed var(--color-mist)',
        borderRadius: 12,
        padding: '48px 32px',
        background: 'var(--color-sand)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        <p style={{ fontSize: 14, color: 'var(--color-mist)', margin: 0, textAlign: 'center' }}>
          Fill in the form and click Run. Your output will appear here.
        </p>
      </div>
    )
  }

  const sections = parseSections(output)

  return (
    <div>
      {/* Copy all button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <CopyAllButton text={output} />
      </div>

      {sections.length > 0
        ? sections.map((section, i) => (
            <CollapsibleSection
              key={i}
              title={section.title}
              body={section.body}
              defaultOpen={true}
              accentColor={section.title === 'AMBIGUITIES' ? 'rgba(232,168,128,0.7)' : 'var(--color-border)'}
              tooltip={STORY_SECTION_TOOLTIPS[section.title]}
            />
          ))
        : (
          <div className="output-section">
            <div className="output-section-body">{output}</div>
          </div>
        )
      }

      {/* Iteration callout */}
      <div style={{
        marginTop: 20,
        padding: '16px 20px',
        background: 'rgba(232,168,128,0.08)',
        border: '1px solid rgba(232,168,128,0.35)',
        borderRadius: 10,
      }}>
        <p style={{ fontSize: 13, color: 'var(--color-slate)', margin: '0 0 12px', lineHeight: 1.6 }}>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Review the ambiguities above before your next run.</strong>{' '}
          Add more context to your inputs and generate again. Each iteration produces a tighter, more accurate story.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-secondary"
          style={{ height: 32, fontSize: 12 }}
        >
          ↑ Refine your inputs
        </button>
      </div>
    </div>
  )
}
