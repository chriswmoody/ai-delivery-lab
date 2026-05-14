import { Link } from 'react-router-dom'

const FUNCTIONS = [
  {
    id: 1,
    slug: '/sprint-risk-scanner',
    phase: 'live',
    icon: '⚡',
    name: 'Sprint Risk Scanner',
    description: 'Paste your sprint board. Get back a risk-tiered analysis with velocity math, hidden dependency flags, and probability scoring before standup starts.',
    roles: ['Tech Leads', 'Scrum Masters', 'Delivery Managers'],
    accentColor: 'mint',
  },
  {
    id: 9,
    slug: '/value-alignment-auditor',
    phase: 'live',
    icon: '🧭',
    name: 'Backlog Value Alignment Auditor',
    description: 'Paste your strategic priorities and your backlog. Get back a scored alignment report showing what is connected, what is consuming capacity with no strategic purpose, and which priorities have nothing pointing at them.',
    roles: ['Product Managers', 'Delivery Managers', 'RTEs', 'Engineering Managers'],
    accentColor: 'mint',
  },
  {
    id: 2,
    slug: '/user-story-generator',
    phase: 'live',
    icon: '📋',
    name: 'User Story Generator',
    description: 'Turn a vague feature request into a fully formed user story with acceptance criteria, engineering notes, and every ambiguity surfaced before refinement.',
    roles: ['Product Managers', 'Business Analysts', 'Product Owners'],
    accentColor: 'mint',
  },
  {
    id: 3,
    slug: '/standup-agent',
    phase: 'live',
    icon: '🎯',
    name: 'PM Standup Intelligence Agent',
    description: 'Paste your sprint board and any context: messages, emails, notes. A 3-stage AI chain builds your triage, your standup focus brief, and your team readout in one run.',
    roles: ['Product Managers', 'Delivery Managers', 'Program Managers'],
    accentColor: 'mint',
  },
  {
    id: 7,
    slug: '/status-report-generator',
    phase: 'live',
    icon: '📊',
    name: 'Status Report Generator',
    description: 'Paste your raw status notes or a brain dump. Choose executive update or full status report. Get back a tight, structured update with health status, key risks, and a specific ask — formatted for your audience and ready to send.',
    roles: ['Delivery Managers', 'Product Managers', 'Program Managers', 'Engineering Managers'],
    accentColor: 'mint',
  },
  {
    id: 4,
    slug: null,
    phase: 'coming-soon',
    icon: '🧪',
    name: 'Test Case Generator',
    description: 'From acceptance criteria to a full test suite: happy path, negative tests, edge cases, and compliance scenarios for FINRA, SOX, BSA/AML, and HIPAA.',
    roles: ['QA Engineers', 'QA Leads', 'Engineers'],
    accentColor: 'sky',
  },
  {
    id: 5,
    slug: null,
    phase: 'coming-soon',
    icon: '🔀',
    name: 'PR Description Generator',
    description: 'From ticket and diff to a GitHub-ready PR description with review focus, test steps, risk level, and compliance notes baked in.',
    roles: ['Engineers', 'Tech Leads'],
    accentColor: 'sky',
  },
  {
    id: 6,
    slug: null,
    phase: 'coming-soon',
    icon: '🗂️',
    name: 'Backlog Health Audit',
    description: 'Paste your backlog. Get INVEST scores, stories to split, merge, or kill, hidden dependencies, and a prioritization recommendation.',
    roles: ['Product Managers', 'Tech Leads', 'Scrum Masters', 'RTEs'],
    accentColor: 'peach',
  },
  {
    id: 8,
    slug: null,
    phase: 'coming-soon',
    icon: '👁️',
    name: 'Code Review Feedback Generator',
    description: 'Paste a diff. Get structured review feedback in the right domain context: critical issues, significant concerns, suggestions, and specific positive callouts.',
    roles: ['Senior Engineers', 'Tech Leads', 'Engineering Managers'],
    accentColor: 'peach',
  },
]

const ACCENT_BADGE = {
  mint:  'badge',
  sky:   'badge badge-sky',
  peach: 'badge badge-peach',
}

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>

      {/* Nav */}
      <nav style={{
        height: 'var(--nav-h)',
        background: '#ffffff',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15, color: 'var(--color-ink)' }}>
            Chris Moody
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="https://www.chriswmoody.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ height: 32, fontSize: 12, padding: '0 12px' }}
            >
              chriswmoody.com
            </a>
            <a
              href="https://www.linkedin.com/in/chriswmoody"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ height: 32, fontSize: 12, padding: '0 12px' }}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="sect" style={{ background: '#ffffff', borderBottom: '1px solid var(--color-border)', paddingBottom: 48 }}>
        <div className="container">
          <div style={{ maxWidth: 720 }}>
            <div className="badge" style={{ marginBottom: 24 }}>Chris Moody</div>
            <h1 style={{ fontSize: 'clamp(56px, 8vw, 96px)', fontWeight: 400, lineHeight: 1.05, marginBottom: 24 }}>
              AI Delivery Lab
            </h1>
            <p style={{ fontSize: 17, color: 'var(--color-slate)', lineHeight: 1.7, maxWidth: 600, marginBottom: 0 }}>
              AI tools built for the real work of delivery. Paste your sprint board, a vague feature request,
              or a rough context dump and get back something you can use in the next 15 minutes.
              Built to show what applied AI actually looks like in delivery work, not just what it could look like.
            </p>
          </div>
        </div>
      </section>

      {/* Function Cards */}
      <section className="sect" style={{ paddingTop: 48 }}>
        <div className="container">
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', marginBottom: 8 }}>Functions for real delivery work.</h2>
            <p style={{ fontSize: 15, color: 'var(--color-slate)' }}>
              Several tools are live now with more in progress. New functions ship regularly.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {FUNCTIONS.map(fn => (
              <FunctionCard key={fn.id} fn={fn} />
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="sect" style={{ background: '#ffffff', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ maxWidth: 640 }}>
            <div className="badge badge-peach" style={{ marginBottom: 24 }}>About</div>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Chris Moody</h2>
            <p style={{ fontSize: 15, color: 'var(--color-slate)', lineHeight: 1.75, marginBottom: 20 }}>
              20+ years of delivery and transformation leadership across enterprise clients including
              Starbucks, Premera, T-Mobile, Crown Castle, and eBay. I built this as a working
              demonstration of applied AI in delivery. Not theory, not demos, but tools that
              solve the actual problems delivery teams face every day.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="https://www.chriswmoody.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                chriswmoody.com
              </a>
              <a
                href="https://www.linkedin.com/in/chriswmoody"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '28px 0',
        background: 'var(--color-sand)',
      }}>
        <div className="container">
          <span style={{ fontSize: 13, color: 'var(--color-slate)', fontFamily: 'var(--font-body)' }}>
            2026 Chris Moody · AI Delivery Lab
          </span>
        </div>
      </footer>

    </div>
  )
}

function FunctionCard({ fn }) {
  const isLive = fn.phase === 'live'

  const card = (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        cursor: isLive ? 'pointer' : 'default',
        opacity: isLive ? 1 : 0.75,
      }}
      onMouseEnter={e => {
        if (isLive) {
          e.currentTarget.style.borderColor = 'var(--color-mint)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 24 }}>{fn.icon}</span>
        {isLive
          ? <span className={ACCENT_BADGE[fn.accentColor]}>Live</span>
          : <span style={{ fontSize: 12, color: 'var(--color-mist)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>Coming soon</span>
        }
      </div>

      <div>
        <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>{fn.name}</h3>
        <p style={{ fontSize: 14, color: 'var(--color-slate)', lineHeight: 1.65, margin: 0 }}>{fn.description}</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
        {fn.roles.map(role => (
          <span key={role} style={{
            fontSize: 11,
            color: 'var(--color-slate)',
            background: 'var(--color-sand)',
            border: '1px solid var(--color-border)',
            borderRadius: 100,
            padding: '3px 10px',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
          }}>
            {role}
          </span>
        ))}
      </div>

      {isLive && (
        <div style={{ fontSize: 13, color: 'var(--color-mint)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
          Open
        </div>
      )}
    </div>
  )

  return isLive && fn.slug
    ? <Link to={fn.slug} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>{card}</Link>
    : card
}
