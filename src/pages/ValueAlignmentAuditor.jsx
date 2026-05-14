import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import ValueAlignmentOutputPanel from '../components/ValueAlignmentOutputPanel'
import { callClaude } from '../functions/api'
import { VALUE_ALIGNMENT_SYSTEM, buildValueAlignmentPrompt } from '../functions/valueAlignment'
import { useRotatingExample } from '../functions/useRotatingExample'

const EXAMPLES = [
  {
    label: 'Example 1 of 3',
    priorities: `1. Grow active monthly users by 25% by end of Q3
2. Reduce customer support ticket volume by 30% through self-service improvements
3. Launch a new reporting module to support enterprise sales conversations
4. Improve engineering deployment reliability — target 99.5% pipeline success rate`,
    backlog: `EPIC-01: Reporting module — core data model (8pts)
EPIC-02: Reporting module — dashboard UI (13pts)
EPIC-03: Reporting module — export to PDF and CSV (5pts)
EPIC-04: Scheduled report delivery via email (5pts)
EPIC-05: Role-based access control for report sharing (3pts)
STORY-10: Redesign onboarding flow for new signups (8pts)
STORY-11: Add in-app tooltips and feature discovery prompts (3pts)
STORY-12: Build referral invite flow for existing users (5pts)
STORY-13: Add self-service password reset flow (5pts)
STORY-14: Build help center search and article index (8pts)
STORY-15: Add live chat widget to support portal (5pts)
STORY-16: Fix broken pagination on the accounts list (2pts)
STORY-17: Refactor legacy authentication middleware (8pts)
STORY-18: Automate deployment rollback on failed health check (5pts)
STORY-19: Add CI/CD test coverage reporting to pull requests (3pts)
STORY-20: Migrate primary database to new managed hosting provider (13pts)
STORY-21: Update marketing site homepage copy and hero images (2pts)
STORY-22: Rebuild internal admin panel using new component library (8pts)
STORY-23: Add audit logging to all user permission changes (3pts)
STORY-24: Implement feature flag service for gradual rollouts (5pts)
STORY-25: Archive and purge records older than 7 years (2pts)`,
  },
  {
    label: 'Example 2 of 3',
    priorities: `1. Reduce patient no-show rate by 20% through better appointment reminders
2. Launch provider portal for real-time schedule and billing visibility
3. Achieve SOC 2 Type II certification by end of year
4. Reduce average claims processing time from 14 days to 7 days`,
    backlog: `EPIC-01: Patient SMS and email reminder system (13pts)
EPIC-02: Reminder preference center — channel and timing controls (5pts)
EPIC-03: Provider portal — schedule view and real-time availability (13pts)
EPIC-04: Provider portal — billing summary and claims status dashboard (8pts)
EPIC-05: Provider portal — secure document upload and retrieval (5pts)
STORY-10: Automated claims triage and routing engine (8pts)
STORY-11: Claims processing SLA tracking and alerting (5pts)
STORY-12: Pre-authorization workflow automation (8pts)
STORY-13: Encrypt all PHI fields in the patient records database (5pts)
STORY-14: Implement role-based access controls across all modules (8pts)
STORY-15: Add comprehensive audit logging for SOC 2 compliance (5pts)
STORY-16: Third-party penetration test and remediation (3pts)
STORY-17: Security awareness training rollout for all staff (2pts)
STORY-18: Rebuild internal reporting dashboards in new BI tool (8pts)
STORY-19: Fix appointment booking bug on mobile Safari (2pts)
STORY-20: Migrate legacy patient records from old EHR system (13pts)
STORY-21: Add ICD-10 code validation to intake form (3pts)
STORY-22: Update company website with new service line descriptions (2pts)
STORY-23: Staff scheduling and shift swap module (8pts)
STORY-24: Patient satisfaction survey automation post-visit (3pts)
STORY-25: Archive claims records older than 10 years per retention policy (2pts)`,
  },
  {
    label: 'Example 3 of 3',
    priorities: `1. Hit $2M ARR by end of Q4 — focus on converting free users to paid plans
2. Reduce churn by improving activation and time-to-value for new accounts
3. Build integrations with the top 3 tools our customers already use (Slack, Notion, HubSpot)
4. Get the engineering team to a sustainable pace — reduce P1 incidents and unplanned work`,
    backlog: `STORY-01: In-app upgrade prompt triggered at usage limit (3pts)
STORY-02: Pricing page redesign with clearer plan comparison (5pts)
STORY-03: Annual billing option with discount (3pts)
STORY-04: Stripe billing portal for self-serve plan changes (5pts)
STORY-05: Trial expiry email sequence — 7, 3, and 1 day reminders (3pts)
STORY-06: Redesign empty states to guide users to first value action (5pts)
STORY-07: Interactive product tour for new signups (8pts)
STORY-08: Onboarding checklist with progress tracking (5pts)
STORY-09: Slack integration — post activity summaries to channels (8pts)
STORY-10: Notion integration — sync items bidirectionally (13pts)
STORY-11: HubSpot integration — push contact and deal activity (8pts)
STORY-12: Integration marketplace page and connection manager UI (5pts)
STORY-13: On-call rotation setup and runbook documentation (3pts)
STORY-14: Automated alerting for error rate and latency thresholds (5pts)
STORY-15: Fix memory leak causing daily worker restarts (5pts)
STORY-16: Database query optimization for slow report pages (3pts)
STORY-17: Post-incident review process and template (2pts)
STORY-18: Rebuild CSV export to handle large datasets without timeout (3pts)
STORY-19: Add dark mode to the web app (5pts)
STORY-20: Conference sponsorship landing page and lead capture form (3pts)
STORY-21: Internal wiki migration to new documentation tool (5pts)
STORY-22: Deprecate and remove legacy v1 API endpoints (3pts)
STORY-23: Add granular permission controls for team workspaces (5pts)`,
  },
]

export default function ValueAlignmentAuditor() {
  const [priorities, setPriorities] = useState('')
  const [backlog, setBacklog]       = useState('')
  const [output, setOutput]         = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState(null)

  const loadExample = useRotatingExample(EXAMPLES, (ex) => {
    setPriorities(ex.priorities)
    setBacklog(ex.backlog)
    setOutput('')
    setError(null)
  })

  async function handleRun() {
    if (!priorities.trim() || !backlog.trim()) return
    setIsLoading(true)
    setError(null)
    setOutput('')

    try {
      const result = await callClaude({
        system: VALUE_ALIGNMENT_SYSTEM,
        messages: [{ role: 'user', content: buildValueAlignmentPrompt({ priorities, backlog }) }],
        maxTokens: 2500,
        model: 'claude-sonnet-4-5',
      })
      setOutput(result)
    } catch (err) {
      setError(err.message === 'daily_limit_reached' ? 'daily_limit_reached' : 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const canRun = priorities.trim().length > 0 && backlog.trim().length > 0 && !isLoading

  return (
    <PageLayout
      title="Backlog Value Alignment Auditor"
      subtitle="Paste your strategic priorities and your backlog. Get back a full alignment report: what is connected, what is orphaned, and which priorities have no backlog coverage at all."
      roles={['Product Managers', 'Delivery Managers', 'RTEs', 'Engineering Managers']}
    >
      <section className="sect">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
            gap: 40,
            alignItems: 'start',
          }}>

            {/* ── Left: Inputs ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 500 }}>Your inputs</h2>
                <button onClick={loadExample} className="btn-secondary" style={{ height: 36, fontSize: 13 }}>
                  Load example
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Strategic priorities */}
                <div>
                  <label className="form-label">Strategic priorities *</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    One per line. Use whatever format you have: goals, themes, initiatives, or quarterly priorities. The more specific, the more useful the analysis.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 180 }}
                    placeholder={`1. Grow active monthly users by 25% by end of Q3\n2. Reduce support ticket volume by 30% through self-service\n3. Launch reporting module to support enterprise sales`}
                    value={priorities}
                    onChange={e => setPriorities(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Backlog */}
                <div>
                  <label className="form-label">Backlog *</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Paste anything: stories, epics, tickets, a sprint plan, a quarterly roadmap. Full story detail is fine — the tool will extract what it needs. One item per line works best.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 320, fontFamily: 'monospace', fontSize: 13 }}
                    placeholder={`EPIC-01: Reporting module core data model (8pts)\nSTORY-10: Redesign onboarding flow for new signups (5pts)\nSTORY-11: Refactor legacy auth middleware (8pts)`}
                    value={backlog}
                    onChange={e => setBacklog(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={handleRun}
                  disabled={!canRun}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {isLoading ? 'Analyzing...' : 'Run alignment audit'}
                </button>

              </div>
            </div>

            {/* ── Right: Output ── */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Alignment report</h2>
              <ValueAlignmentOutputPanel
                output={output}
                isLoading={isLoading}
                error={error}
              />
            </div>

          </div>
        </div>
      </section>
    </PageLayout>
  )
}
