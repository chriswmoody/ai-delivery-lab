import { Link } from 'react-router-dom'

export default function PageLayout({ children, title, subtitle, roles }) {
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
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/"
            style={{ fontSize: 13, color: 'var(--color-slate)', textDecoration: 'none', fontFamily: 'var(--font-body)' }}
          >
            ← All tools
          </Link>
          <span style={{ color: 'var(--color-mist)', fontSize: 13 }}>·</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14, color: 'var(--color-ink)' }}>
            {title}
          </span>
        </div>
      </nav>

      {/* Page hero */}
      <section style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--color-border)',
        padding: '36px 0 32px',
      }}>
        <div className="container">
          {roles && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {roles.map(role => (
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
          )}
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, marginBottom: 10 }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: 15, color: 'var(--color-slate)', lineHeight: 1.65, margin: 0, maxWidth: 580 }}>
              {subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '24px 0',
        background: 'var(--color-sand)',
        marginTop: 64,
      }}>
        <div className="container">
          <span style={{ fontSize: 13, color: 'var(--color-slate)' }}>
            Chris Moody · AI Delivery Lab
          </span>
        </div>
      </footer>

    </div>
  )
}
