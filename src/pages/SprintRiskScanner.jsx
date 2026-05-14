import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import SprintOutputPanel from '../components/SprintOutputPanel'
import { callClaude } from '../functions/api'
import { SPRINT_RISK_SYSTEM, buildSprintRiskPrompt } from '../functions/sprintRisk'
import { useRotatingExample } from '../functions/useRotatingExample'

const EXAMPLES = [
  {
    sprintBoard: `SPRINT 14 BOARD — Day 4 of 10

DONE (14pts)
TICK-501: API gateway config update (2pts) ✓
TICK-502: Fix broken pagination on accounts list (3pts) ✓
TICK-503: Add audit trail to user role changes (5pts) ✓
TICK-511: Update staging environment variables (4pts) ✓

IN PROGRESS (26pts)
TICK-504: Core data model for reporting module (5pts) — assigned to Alex, no updates since Day 2, no PR, blocks TICK-507 and TICK-509
TICK-505: Investor dashboard UI (8pts) — assigned to Priya, last standup said 40% done — Priya out Thu–Fri
TICK-506: Role-based access control refactor (8pts) — assigned to Sam, PR open, 4 review comments, 2 flagged as significant
TICK-510: Notification preferences API (5pts) — assigned to Jordan, PR open, waiting on UX sign-off requested Day 2, no response

TO DO (21pts)
TICK-507: Reporting module — data aggregation layer (8pts) — not started, blocked on TICK-504
TICK-508: Export report to PDF (5pts) — not started, blocked on TICK-507
TICK-509: Scheduled report delivery (5pts) — not started, blocked on TICK-504 and TICK-507
TICK-512: QA — reporting module end-to-end (3pts) — not started, blocked on TICK-507, TICK-508, and TICK-509`,
    sprintMetadata: `Sprint 14 | Day 4 of 10 | 61 points committed | 14 points done`,
    capacityNotes: `Priya is out Thursday and Friday this week. Marcus joining mid-sprint (starts Day 6), available for small well-defined tickets only. Everyone else full availability. Team of 5 engineers.`,
  },
  {
    sprintBoard: `SPRINT 7 BOARD — Day 7 of 10

DONE (28pts)
PAY-201: Stripe webhook handler for payment events (5pts) ✓
PAY-202: Payment confirmation email template (3pts) ✓
PAY-203: Add idempotency keys to charge API (5pts) ✓
PAY-204: Fraud detection rule — velocity check (8pts) ✓
PAY-205: Update card expiry reminder logic (3pts) ✓
PAY-206: Fix duplicate charge bug in retry logic (4pts) ✓

IN PROGRESS (18pts)
PAY-207: 3DS2 strong authentication flow (8pts) — assigned to Rosa, integration test failing on edge case, no clear ETA, blocks PAY-210
PAY-208: Refund workflow — partial and full refunds (5pts) — assigned to Dev, PR open, waiting on compliance review since Day 5
PAY-209: Dispute management dashboard (5pts) — assigned to Lin, 60% done, design change requested yesterday by product

TO DO (16pts)
PAY-210: End-to-end payment flow regression suite (8pts) — not started, blocked on PAY-207
PAY-211: PCI-DSS compliance documentation update (5pts) — not started, owner unclear
PAY-212: Load test payment API at 10x current volume (3pts) — not started`,
    sprintMetadata: `Sprint 7 | Day 7 of 10 | 62 points committed | 28 points done`,
    capacityNotes: `Rosa flagged she is blocked and may need a pairing session today. Compliance reviewer is external and response times are slow. Team of 4 engineers plus 1 QA.`,
  },
  {
    sprintBoard: `SPRINT 3 BOARD — Day 3 of 10

DONE (8pts)
PLT-301: Set up staging environment for new microservice (5pts) ✓
PLT-302: Add health check endpoint to auth service (3pts) ✓

IN PROGRESS (31pts)
PLT-303: Migrate user session storage from Redis to DynamoDB (13pts) — assigned to Marco, schema design review still open, no PR yet, blocks PLT-306
PLT-304: Implement distributed tracing with OpenTelemetry (8pts) — assigned to Yuki, PR open, large diff, no reviews started
PLT-305: Deprecate legacy REST endpoints and route to GraphQL (5pts) — assigned to Sofia, 2 of 7 endpoints done, client teams still using old routes
PLT-308: Upgrade Node.js runtime from v16 to v20 across all services (5pts) — assigned to team, 3 of 9 services done, 2 flagged breaking changes

TO DO (24pts)
PLT-306: Update session TTL and refresh token logic (5pts) — not started, blocked on PLT-303
PLT-307: Performance benchmark suite for GraphQL endpoints (8pts) — not started, blocked on PLT-305
PLT-309: Cost optimization audit — identify unused Lambda functions (5pts) — not started
PLT-310: Runbook updates for new infrastructure components (3pts) — not started
PLT-311: Chaos engineering test for DynamoDB failover (3pts) — not started, blocked on PLT-303`,
    sprintMetadata: `Sprint 3 | Day 3 of 10 | 63 points committed | 8 points done`,
    capacityNotes: `Marco is the only engineer with DynamoDB experience — single point of failure risk on PLT-303. Yuki working across two teams this sprint at roughly 60% allocation. Full team otherwise.`,
  },
]

export default function SprintRiskScanner() {
  const [sprintBoard, setSprintBoard]       = useState('')
  const [sprintMetadata, setSprintMetadata] = useState('')
  const [capacityNotes, setCapacityNotes]   = useState('')
  const [output, setOutput]                 = useState('')
  const [isLoading, setIsLoading]           = useState(false)
  const [error, setError]                   = useState(null)

  const loadExample = useRotatingExample(EXAMPLES, (ex) => {
    setSprintBoard(ex.sprintBoard)
    setSprintMetadata(ex.sprintMetadata)
    setCapacityNotes(ex.capacityNotes)
    setOutput('')
    setError(null)
  })

  async function handleRun() {
    if (!sprintBoard.trim()) return
    setIsLoading(true)
    setError(null)
    setOutput('')

    try {
      const prompt = buildSprintRiskPrompt({ sprintBoard, sprintMetadata, capacityNotes })
      const result = await callClaude({
        system: SPRINT_RISK_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1500,
        model: 'claude-sonnet-4-5',
      })
      setOutput(result)
    } catch (err) {
      setError(err.message === 'daily_limit_reached' ? 'daily_limit_reached' : 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const canRun = sprintBoard.trim().length > 0 && !isLoading

  return (
    <PageLayout
      title="Sprint Risk Scanner"
      subtitle="Paste your sprint board and get back a risk-tiered analysis with velocity math, dependency flags, and standup focus before the meeting starts."
      roles={['Tech Leads', 'Scrum Masters', 'Delivery Managers']}
    >
      <section className="sect">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
            gap: 40,
            alignItems: 'start',
          }}>

            {/* ── Left: Input form ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 500 }}>Your sprint data</h2>
                <button onClick={loadExample} className="btn-secondary" style={{ height: 36, fontSize: 13 }}>
                  Load example
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Sprint board */}
                <div>
                  <label className="form-label">Sprint board *</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Paste from Jira, a CSV export, or type a list of tickets with status and points. Include any dependency notes inline, e.g. "blocked on TICK-312" or "blocks TICK-445". Messy is fine.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 13 }}
                    placeholder={`TICK-101: Build payment form (8pts) — In Progress, no PR yet\nTICK-102: API integration (5pts) — Done\nTICK-103: Error handling (3pts) — Not started, blocked on TICK-101`}
                    value={sprintBoard}
                    onChange={e => setSprintBoard(e.target.value)}
                  />
                </div>

                {/* Sprint metadata */}
                <div>
                  <label className="form-label">Sprint metadata</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Sprint number, day X of Y, total points committed, points completed so far.
                  </p>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Sprint 12 | Day 6 of 10 | 42 points committed | 18 points done"
                    value={sprintMetadata}
                    onChange={e => setSprintMetadata(e.target.value)}
                  />
                </div>

                {/* Capacity notes */}
                <div>
                  <label className="form-label">Team capacity notes</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    PTO, partial availability, or anything that affects the team's capacity this sprint.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 72 }}
                    placeholder="Alex is out Thursday–Friday. Jordan is at 50% this week."
                    value={capacityNotes}
                    onChange={e => setCapacityNotes(e.target.value)}
                  />
                </div>

<button
                  className="btn-primary"
                  onClick={handleRun}
                  disabled={!canRun}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {isLoading ? 'Analyzing...' : 'Run analysis'}
                </button>

              </div>
            </div>

            {/* ── Right: Output ── */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Analysis</h2>
              <SprintOutputPanel
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
