import { useState } from 'react'

function SectionTooltip({ text }) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  function handleMouseEnter(e) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setCoords({ top: rect.top - 8, left: rect.left + rect.width / 2 })
    setVisible(true)
  }

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6, flexShrink: 0 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
      onClick={e => e.stopPropagation()}
    >
      <span style={{
        width: 14, height: 14, borderRadius: '50%',
        background: 'var(--color-sand)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: 'var(--color-mist)',
        fontFamily: 'var(--font-display)', fontWeight: 600,
        lineHeight: 1, cursor: 'default',
      }}>?</span>
      {visible && (
        <span style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          transform: 'translate(-50%, -100%)',
          background: 'var(--color-ink)', color: 'var(--color-cream)',
          fontSize: 11, lineHeight: 1.55, fontFamily: 'var(--font-body)',
          padding: '7px 11px', borderRadius: 6,
          width: 210, textAlign: 'center',
          pointerEvents: 'none', zIndex: 9999,
          whiteSpace: 'normal',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

/**
 * Reusable collapsible section with chevron toggle.
 * defaultOpen: whether the section starts expanded.
 * accentColor: left border color.
 * tooltip: optional short explanation shown on the section label.
 */
export default function CollapsibleSection({ title, body, defaultOpen = true, accentColor = 'var(--color-border)', onCopy, tooltip }) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(body).then(() => {
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
        {/* Left: chevron + title + tooltip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            fontSize: 11, color: 'var(--color-slate)',
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            flexShrink: 0, lineHeight: 1,
          }}>›</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-slate)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </span>
          {tooltip && <SectionTooltip text={tooltip} />}
        </div>

        {/* Right: copy button (only when open) */}
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
        <div style={{
          padding: '14px 16px', fontSize: 14, lineHeight: 1.75,
          color: 'var(--color-ink)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)',
        }}>
          {body}
        </div>
      )}
    </div>
  )
}
