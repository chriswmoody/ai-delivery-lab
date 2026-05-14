import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import StandupOutputPanel from '../components/StandupOutputPanel'
import { callClaude } from '../functions/api'
import {
  STAGE_A_SYSTEM, STAGE_B_SYSTEM, STAGE_C_SYSTEM,
  buildStageAPrompt, buildStageBPrompt, buildStageCPrompt,
} from '../functions/standupAgent'
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
    contextDump: `Slack — #delivery-team (last 12 hours):

Alex (11:42pm): "Ran into a weird schema conflict with the legacy reporting tables. Going to need to look at this more carefully in the morning. Might affect my timeline on TICK-504."

Sam (7:15am): "PR for TICK-506 is up. Two of the review comments are about the permission inheritance model — I think we need a quick design decision before I can close those out. Can we get 15 mins with the tech lead today?"

Jordan (8:02am): "Still no word from UX on the notification preferences design. I can build the API to the old spec but we said we'd wait for their input. What do you want me to do?"

Email from product stakeholder (yesterday 5pm): "Quick heads up — the investor dashboard demo got moved to next Wednesday. Just FYI in case it affects anything on your end."`,
  },
  {
    sprintBoard: `RELEASE SPRINT — Day 8 of 10 (feature freeze yesterday)

DONE (34pts)
MOB-101: Push notification service integration (8pts) ✓
MOB-102: Offline mode for core features (13pts) ✓
MOB-103: App store screenshot and metadata update (3pts) ✓
MOB-104: Crash reporting SDK integration (5pts) ✓
MOB-105: Deep link routing refactor (5pts) ✓

IN PROGRESS (12pts)
MOB-106: Final accessibility audit and fixes (5pts) — assigned to Dana, 3 issues remain, 2 are borderline pass/fail, decision needed
MOB-107: Performance profiling and memory optimization (7pts) — assigned to Kenji, found a significant memory leak in image cache, fix in progress, no ETA

TO DO (5pts)
MOB-108: Release notes and changelog (2pts) — not started, blocked on knowing what's actually shipping
MOB-109: Smoke test sign-off on staging build (3pts) — not started, QA waiting on MOB-107 fix`,
    contextDump: `Slack — #mobile-team:

Dana (8:15am): "Two of the accessibility issues are color contrast on secondary buttons. Design says it meets WCAG AA but our internal standard is AAA. Do we hold the release or ship with a known exception?"

Kenji (8:44am): "Memory leak is in a third-party image caching library. I can either patch it with a workaround today or wait for the library maintainer's fix which is supposedly coming next week. Workaround adds some complexity to the code."

QA lead (yesterday 4pm): "If we don't have a clean staging build by end of day tomorrow, we can't do a proper smoke test before the release window."

App store review historically takes 24-48 hours. Release window is this Friday.`,
  },
  {
    sprintBoard: `Q2 PLANNING SPRINT — Week 2 of 4 (cross-team dependencies)

DONE
PROG-201: Finalize Q2 roadmap and share with stakeholders ✓
PROG-202: Dependency mapping session with 4 delivery teams ✓
PROG-203: Risk register updated ✓

IN PROGRESS
PROG-204: Resource allocation across 6 squads — capacity confirmed for 4, 2 still pending (Platform and Data teams)
PROG-205: OKR alignment review — 3 of 5 product areas done, Security and Infrastructure not yet scheduled
PROG-206: Architecture review for new data pipeline — external consultant engaged, first session not until next week

TO DO
PROG-207: Finalize inter-team dependency schedule — blocked on Platform capacity confirmation
PROG-208: Q2 kickoff deck for executive presentation — due Friday, content not started
PROG-209: Update program-level risk register with Q2 scenarios
PROG-210: Communicate planning decisions to all 6 squads`,
    contextDump: `Email from Platform team lead (yesterday): "We're still finalizing our Q2 capacity. Two engineers are potentially moving to a different program. I should have confirmation by Thursday but no guarantees."

Slack — #program-delivery:
Ravi (8:30am): "The security team OKR review keeps getting deprioritized. Their lead is in back-to-back compliance meetings all week. Should we proceed without them or hold the plan?"

Data team (via email, yesterday): "We have concerns about the new pipeline architecture — we weren't included in the initial scoping. Can we get time before the consultant's session next week?"

Executive sponsor (meeting yesterday): "The Q2 kickoff presentation needs to be ready for Thursday pre-read, not just Friday. Can you confirm that's achievable?"`,
  },
]

export default function StandupAgent() {
  const [sprintBoard, setSprintBoard]     = useState('')
  const [contextDump, setContextDump]     = useState('')
  const [stageA, setStageA]               = useState('')
  const [stageB, setStageB]               = useState('')
  const [stageC, setStageC]               = useState('')
  const [currentStage, setCurrentStage]   = useState(null)
  const [error, setError]                 = useState(null)

  const loadExample = useRotatingExample(EXAMPLES, (ex) => {
    setSprintBoard(ex.sprintBoard)
    setContextDump(ex.contextDump)
    setStageA('')
    setStageB('')
    setStageC('')
    setCurrentStage(null)
    setError(null)
  })

  async function handleRun() {
    if (!sprintBoard.trim()) return

    setStageA('')
    setStageB('')
    setStageC('')
    setError(null)

    try {
      // ── Stage A ──────────────────────────────────────────────
      setCurrentStage('A')
      const aResult = await callClaude({
        system: STAGE_A_SYSTEM,
        messages: [{ role: 'user', content: buildStageAPrompt({ sprintBoard, contextDump }) }],
        maxTokens: 1500,
        model: 'claude-sonnet-4-5',
      })
      setStageA(aResult)

      // ── Stage B ──────────────────────────────────────────────
      setCurrentStage('B')
      const bResult = await callClaude({
        system: STAGE_B_SYSTEM,
        messages: [{ role: 'user', content: buildStageBPrompt(aResult) }],
        maxTokens: 1500,
        model: 'claude-sonnet-4-5',
      })
      setStageB(bResult)

      // ── Stage C ──────────────────────────────────────────────
      setCurrentStage('C')
      const cResult = await callClaude({
        system: STAGE_C_SYSTEM,
        messages: [{ role: 'user', content: buildStageCPrompt(bResult) }],
        maxTokens: 1000,
        model: 'claude-sonnet-4-5',
      })
      setStageC(cResult)

      setCurrentStage(null)

    } catch (err) {
      setCurrentStage(null)
      setError(err.message === 'daily_limit_reached' ? 'daily_limit_reached' : 'error')
    }
  }

  const isRunning = currentStage !== null
  const canRun    = sprintBoard.trim().length > 0 && !isRunning

  return (
    <PageLayout
      title="PM Standup Intelligence Agent"
      subtitle="Paste your sprint board and any relevant context: messages, emails, notes. Three AI stages run in sequence and hand you a triage, a standup focus brief, and a team readout."
      roles={['Product Managers', 'Delivery Managers', 'Program Managers']}
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
                <h2 style={{ fontSize: 16, fontWeight: 500 }}>Your morning data</h2>
                <button onClick={loadExample} className="btn-secondary" style={{ height: 36, fontSize: 13 }}>
                  Load example
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Sprint board */}
                <div>
                  <label className="form-label">Sprint board *</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Paste from Jira or type your ticket list with status, points, and any blockers noted inline.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 13 }}
                    placeholder={`TICK-101: Build payment form (8pts) — In Progress, no PR yet\nTICK-102: API integration (5pts) — Done\nTICK-103: Error handling (3pts) — Not started, blocked on TICK-101`}
                    value={sprintBoard}
                    onChange={e => setSprintBoard(e.target.value)}
                    disabled={isRunning}
                  />
                </div>

                {/* Context dump */}
                <div>
                  <label className="form-label">
                    Context dump <span style={{ color: 'var(--color-mist)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Paste anything relevant from the last 12 to 24 hours: Slack or Teams messages, emails, your own notes, blockers you heard about. Dump it all in. The messier the better.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 180 }}
                    placeholder={`Alex (11:42pm): "Ran into a weird issue with the schema. Going to look at it in the morning."\n\nEmail from stakeholder: "Demo got moved to next Wednesday."\n\nMy notes: Jordan mentioned yesterday the UX team still hasn't responded...`}
                    value={contextDump}
                    onChange={e => setContextDump(e.target.value)}
                    disabled={isRunning}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={handleRun}
                  disabled={!canRun}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {isRunning
                    ? `Running Stage ${currentStage}...`
                    : 'Run agent'
                  }
                </button>

                {isRunning && (
                  <p style={{ fontSize: 12, color: 'var(--color-slate)', margin: 0 }}>
                    Three stages running in sequence. This takes about 30 to 45 seconds total.
                  </p>
                )}

              </div>
            </div>

            {/* ── Right: Output ── */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Output</h2>
              <StandupOutputPanel
                stageA={stageA}
                stageB={stageB}
                stageC={stageC}
                currentStage={currentStage}
                error={error}
              />
            </div>

          </div>
        </div>
      </section>
    </PageLayout>
  )
}
