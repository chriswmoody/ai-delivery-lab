import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import OutputPanel from '../components/OutputPanel'
import { callClaude } from '../functions/api'
import { USER_STORY_SYSTEM, buildUserStoryPrompt } from '../functions/userStory'
import { useRotatingExample } from '../functions/useRotatingExample'

const EXAMPLES = [
  {
    rawRequest: `We need to let customers see their transaction history. Something like a list of their past purchases with dates and amounts. Maybe they can filter it or search. Also export it somehow.`,
    accountType: `Retail banking customer (personal checking account)`,
    platform: `Web and mobile`,
    regulatoryEnv: `SOX`,
    teamContext: `8-person squad, 2-week sprints, mid-sprint refinement Tuesday`,
  },
  {
    rawRequest: `Sales keeps asking for a way to see which of their accounts haven't logged in recently. Like a list of at-risk customers. Maybe with some kind of health score? They want to be able to filter by account size and assigned rep. Would be great if they could export it to send to their manager.`,
    accountType: `Internal sales rep (B2B SaaS company)`,
    platform: `Web`,
    regulatoryEnv: `None`,
    teamContext: `5-person product squad, 2-week sprints, stories must be completable in one sprint`,
  },
  {
    rawRequest: `The compliance team needs a way to pull audit reports. Right now they have to ask engineering every time they need a list of who accessed what and when. They want to do it themselves. Needs to cover the last 90 days minimum and they need to be able to filter by user, action type, and date range. PDF export is a must for regulators.`,
    accountType: `Internal compliance officer`,
    platform: `Web`,
    regulatoryEnv: `HIPAA`,
    teamContext: `6-person engineering team, 3-week sprints, compliance deadline driving priority`,
  },
]

const PLATFORM_OPTIONS = ['Web', 'Mobile', 'Web and mobile', 'API only', 'Other']
const REGULATORY_OPTIONS = ['None', 'SOX', 'FINRA', 'HIPAA', 'BSA/AML', 'PCI-DSS', 'GDPR', 'Multiple']

export default function UserStoryGenerator() {
  const [rawRequest, setRawRequest]       = useState('')
  const [accountType, setAccountType]     = useState('')
  const [platform, setPlatform]           = useState('')
  const [regulatoryEnv, setRegulatoryEnv] = useState('')
  const [teamContext, setTeamContext]      = useState('')
  const [output, setOutput]               = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState(null)

  const loadExample = useRotatingExample(EXAMPLES, (ex) => {
    setRawRequest(ex.rawRequest)
    setAccountType(ex.accountType)
    setPlatform(ex.platform)
    setRegulatoryEnv(ex.regulatoryEnv)
    setTeamContext(ex.teamContext)
    setOutput('')
    setError(null)
  })

  async function handleRun() {
    if (!rawRequest.trim()) return
    setIsLoading(true)
    setError(null)
    setOutput('')

    try {
      const prompt = buildUserStoryPrompt({ rawRequest, accountType, platform, regulatoryEnv, teamContext })
      const result = await callClaude({
        system: USER_STORY_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000,
      })
      setOutput(result)
    } catch (err) {
      setError(err.message === 'daily_limit_reached' ? 'daily_limit_reached' : 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const canRun = rawRequest.trim().length > 0 && !isLoading

  return (
    <PageLayout
      title="User Story Generator"
      subtitle="Paste a raw feature request and get a fully formed user story. Review the ambiguities section, add more context, and run it again. Most stories improve significantly in two or three iterations."
      roles={['Product Managers', 'Business Analysts', 'Product Owners']}
    >
      <section className="sect">
        <div className="container">
          <div className="tool-grid">

            {/* ── Left: Input form ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 500 }}>Your feature request</h2>
                <button onClick={loadExample} className="btn-secondary" style={{ height: 36, fontSize: 13 }}>
                  Load example
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Raw request */}
                <div>
                  <label className="form-label">Raw feature request *</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Paste it exactly as you received it: email, Slack message, sticky note. Don't clean it up first.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 160 }}
                    placeholder="e.g. We need a way for customers to update their billing address. Maybe a form somewhere in settings? It should probably send a confirmation email too."
                    value={rawRequest}
                    onChange={e => setRawRequest(e.target.value)}
                  />
                </div>

                {/* Account / customer type */}
                <div>
                  <label className="form-label">Account / customer type</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Who is the actual user? (e.g. retail banking customer, enterprise admin, internal ops team)
                  </p>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Retail banking customer, small business owner, internal ops analyst"
                    value={accountType}
                    onChange={e => setAccountType(e.target.value)}
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="form-label">Platform</label>
                  <select
                    className="form-select"
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                  >
                    <option value="">Select platform...</option>
                    {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Regulatory environment */}
                <div>
                  <label className="form-label">Regulatory environment</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Adding this transforms the output. Compliance-specific acceptance criteria and engineering notes get generated automatically.
                  </p>
                  <select
                    className="form-select"
                    value={regulatoryEnv}
                    onChange={e => setRegulatoryEnv(e.target.value)}
                  >
                    <option value="">Select or leave blank...</option>
                    {REGULATORY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Team context */}
                <div>
                  <label className="form-label">Team context</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Sprint length, team size, refinement cadence, or anything else that should shape the story.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 72 }}
                    placeholder="e.g. 6-person squad, 2-week sprints, Wednesday refinement, stories need to be independently deployable"
                    value={teamContext}
                    onChange={e => setTeamContext(e.target.value)}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={handleRun}
                  disabled={!canRun}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {isLoading ? 'Generating...' : 'Generate story'}
                </button>

              </div>
            </div>

            {/* ── Right: Output ── */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Your story</h2>
              <OutputPanel
                output={output}
                isLoading={isLoading}
                loadingMessage="Writing your user story..."
                error={error}
              />
            </div>

          </div>
        </div>
      </section>
    </PageLayout>
  )
}
