import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import StatusReportOutputPanel from '../components/StatusReportOutputPanel'
import { callClaude } from '../functions/api'
import { EXEC_UPDATE_SYSTEM, FULL_STATUS_SYSTEM, buildStatusReportPrompt } from '../functions/statusReport'
import { useRotatingExample } from '../functions/useRotatingExample'

const EX1_DUMP = `Week 6 of 18 status. Compiled from standup notes, Jira, Slack threads, and 1:1s with Dan, Marcus, Sarah, and Pete (SRE lead).

OVERALL PROGRAM HEALTH
We are 6 weeks into the 18-week migration from our legacy Rails monolith to a microservices payments architecture. Overall trajectory: mostly on track, with one active blocker (3DS2) that could shift the go-live window if not resolved by Wednesday. Budget burn is 31% against 33% of elapsed timeline. No team attrition. Velocity holding.

WHAT GOT DONE THIS WEEK
Core payments service: deployed to staging Tuesday. Load test ran Thursday morning at 3x recorded Black Friday peak for 90 minutes with zero failures. Latency p99 at 187ms against our 200ms SLA target. p50 was 61ms. No memory or connection pool issues observed. Pete called it the cleanest load test the team has run in two years. Signed off by SRE for production-readiness pending the full integration test suite.

Fraud detection service integration: all 14 integration test cases passing. Sarah and the fraud engineering team did a full sign-off walkthrough Friday at 2pm. Only outstanding item is documentation ticket PAY-1142 for the fraud score threshold configuration. Not blocking, just needs to be written up before go-live.

Auth middleware refactor: merged Wednesday afternoon after a thorough code review from Priya. 340 lines removed, latency on the auth path dropped from 23ms to 9ms. Deployed to staging Wednesday evening with no incidents, no regressions in the test suite. Three days ahead of plan.

Tokenization service: schema finalized after a second design review on Monday. Implementation is 80% complete. Marcus estimates completion by Tuesday of next week barring surprises. Integration tests are being written in parallel.

Cutover runbook v1: first draft complete and shared with SRE and DBA teams Thursday. Pete has review comments and expects to return them by Monday. The runbook covers the traffic migration sequence, rollback triggers, and the 4-hour monitoring window post-cutover. One gap: the rollback playbook for the fraud service integration still needs input from Sarah (action item, due Monday).

IN PROGRESS AND NOT DONE
3DS2 authentication flow - BLOCKER: the implementation is largely done but we are 4 days behind plan because the FIS sandbox environment is returning inconsistent 3DS2 challenge responses. Roughly 1 in 8 authentication attempts fails with error code 65001, which does not appear anywhere in FIS published API documentation. Dan opened support ticket FIS-882341 on Monday. FIS first response on Tuesday was a templated reply pointing to the same docs that do not cover the error. Dan escalated Wednesday and as of Friday EOD has a name (Rodrigo Fonseca, FIS integration team) and a call scheduled Monday 10am. If Monday does not yield a root cause or credible workaround, this is a go-live date decision by Wednesday at the latest. Fallback under consideration: configure 3DS2 as async post-authorization rather than inline, which lets us go live without it fully resolved. Dan and Marcus both say this is technically viable but it has compliance implications that need legal sign-off. That conversation has not happened yet.

Integrated performance test (payments plus fraud plus tokenization): not yet started. Dependent on tokenization completing and 3DS2 being stable enough to include. Scheduled for next Tuesday assuming both unblock. If 3DS2 is still inconsistent, we will run the test without it and flag the gap in the go/no-go checklist.

Production cutover window approval: submitted to the steering committee 8 days ago proposing the week of the 14th. No response received. Pete flagged that the DBA team needs 4 full business days to prep the database migration scripts and coordinate the maintenance window. If we do not have approval by Friday EOD this week, the week-of-14th window is mathematically gone and we push to the week of the 21st. Pete was explicit there is no option to compress DBA prep time.

DECISIONS MADE THIS WEEK
Decision 1: Defer Amex network integration to Phase 2. Approved Tuesday by Jordan (VP of Payments) after a 30-minute working session with Dan and the product team. Background: Amex was flagged as a Phase 1 requirement by the business but after pulling actual transaction data, Amex is 2.1% of volume. The integration requires a separate network adapter, different auth flows, and roughly 22 engineering days. Jordan called it: not worth it for Phase 1. Removes approximately 3 weeks of scope from the current phase and meaningfully de-risks the timeline. Logged in program decision register PDR-12.

Decision 2: Proceed with blue-green deployment for go-live. Pete presented blue-green versus feature flag gradual rollout at Wednesday architecture review. Blue-green won because it gives a clean, fast rollback path within 5 minutes versus 3-4 hours for a full feature flag rollback. Given this is payments infrastructure, rollback speed matters more than rollout granularity.

RISKS
Risk 1 - 3DS2 blocker with FIS (HIGH): Monday call with Rodrigo. Decision point Wednesday. Fallback is async 3DS2 mode pending legal sign-off. If not resolved and fallback not approved, go-live moves to week of the 21st.

Risk 2 - Cutover window approval outstanding (HIGH): no steering committee response by Friday means we lose the week-of-14th window. Elena (program sponsor) needs to escalate directly. Marcus flagging to her Monday morning.

Risk 3 - Raj availability (MEDIUM): Raj (senior engineer, tokenization) received a request from the identity platform team to join a sprint starting the 17th. If tokenization has complications post-launch, we could lose the primary owner at a critical moment. Marcus raised with engineering director Tom. Tom said Raj stays on payments through go-live, no exceptions. Waiting on formal confirmation.

Risk 4 - Fraud rollback playbook gap (LOW): Sarah has not completed the rollback playbook section for the fraud integration. Not blocking go-live prep, but must be done before the cutover window. Owner: Sarah, due Monday.

Risk 5 - FIS documentation quality (LOW/PROCESS): the team has spent an estimated 18 engineering hours diagnosing FIS sandbox issues across this and the prior sprint. Dan suggested requesting a dedicated technical account manager from FIS for the duration of the project. Would need Jordan to make the ask as the business relationship owner.

TEAM AND BUDGET
Velocity: 42 story points this sprint vs. 40-point baseline. No attrition concerns. Load test results energized the team. The 3DS2 situation is frustrating but morale is intact. One retro item: Jira workflow has too many manual status transition steps. Marcus is cleaning up the workflow next week.

Budget: 744K spent of 2.4M total (31%). 6 of 18 weeks elapsed (33%). Slightly under plan on spend, expected given the Amex deferral. No budget risks. If the 3DS2 async fallback requires a legal review engagement, estimated 8-12K incremental, within contingency.

NEXT WEEK PRIORITIES
1. 3DS2: Monday call with Rodrigo at FIS. Dan owns. Outcome needed by Wednesday.
2. Legal review of async 3DS2 fallback: Marcus to brief legal Monday, written sign-off by Wednesday if needed.
3. Steering committee escalation on cutover window: Elena to follow up directly, decision needed by Friday EOD.
4. Tokenization service: Marcus to complete and merge by Tuesday.
5. Integrated performance test: team to run Tuesday contingent on tokenization and 3DS2 status.
6. Fraud rollback playbook: Sarah to complete by Monday EOD.
7. Runbook review: Pete to finalize v1 by Monday EOD.`

const EX2_DUMP = `Sprint 4 retrospective and sprint 5 kickoff notes. Compiled from standup logs, retro board, Slack threads in #data-platform and #data-eng-general, Jira, and 1:1s with Priya, Jamie, Kevin, Mei (data science lead), and Tom (BI lead).

SPRINT 4 AT A GLANCE
Sprint dates: April 28 to May 9. Commitment: 68 story points across 11 stories. Completed: 61 points (9 stories). Carried to sprint 5: 7 points (2 stories, both externally blocked). Velocity trend across sprints: 48, 55, 62, 61. Team is at or above baseline for the program.

COMPLETED WORK - DETAILED

Snowflake schema migration - customer events table (14pts, DONE):
This was the highest-risk item in the sprint and the most technically complex migration task in the program. 2.3 billion historical records migrated from the legacy Postgres data warehouse to Snowflake. Zero data loss confirmed via row count comparison, checksum validation on 50 randomly sampled daily partitions, and a 72-hour parallel read validation where both systems served queries simultaneously and outputs were diff-checked. Priya led the migration and wrapped it 14 days ahead of the original program plan. This is the single most important milestone completed so far. One issue surfaced and resolved during migration: 4.2% of records had malformed timezone offsets from a 2019 system migration. Priya wrote a normalization step that corrected them during load and documented the pattern in the data quality log for future reference.

dbt transformation layer - full deployment to staging (12pts, DONE):
All 7 transformation models deployed to staging. Automated dbt test coverage at 94% (127 of 135 tests passing). The 8 uncovered tests are for edge case models representing less than 0.3% of expected query volume. Mei data science team will validate these manually in sprint 5. Full transformation DAG runtime: 4 minutes 12 seconds against a 6-minute SLA. The 3 most expensive models were refactored with incremental materialization, reducing their individual run times by 60-75%. Kevin noted this gives headroom for the additional models coming in Phase 2.

Real-time Kafka ingestion - 3 of 5 source systems (10pts, DONE):
Product events, user profiles, and transaction ledger connectors are live and ingesting to Snowflake in real time. End-to-end lag averaging 340ms against a 500ms target. No message loss observed over the 5-day monitoring window. The remaining 2 source systems (CRM and billing) are blocked - details below.

Data catalog and lineage documentation (8pts, 60% complete, IN PROGRESS):
Jamie is ahead of schedule. 60% done, targeting 100% by end of sprint 5. All product events and user profile tables fully documented. Transaction ledger in progress. CRM and billing will be documented once the connectors are live.

Staging environment security hardening (8pts, DONE):
Updated security group rules to limit inbound access to the staging Snowflake environment to known IP ranges. IAM roles scoped to least-privilege per security team requirements. Passed the internal security review conducted by infosec on Friday. Two minor findings (overly broad S3 bucket policy on the dbt artifacts bucket, missing CloudTrail logging on one IAM role) were remediated same day.

Data engineering CI/CD pipeline improvements (9pts, DONE - unplanned):
Jamie picked this up after security hardening finished early. Automated test runs now execute on every PR to the data-platform repo. Build time dropped from 22 minutes to 8 minutes after optimizing test parallelization. Deployment to staging is now fully automated via GitHub Actions. Saves an estimated 30 minutes per deployment going forward.

CARRIED TO SPRINT 5 - BLOCKED

CRM Kafka connector (4pts): blocked on service account credentials from the platform team. The platform team needs to provision a service account with read access to the CRM database (Salesforce-to-Postgres replica) and provide the JDBC connection string. Ticket PLAT-4421 was raised Monday April 28th. Platform team SLA is 48 hours. As of Friday May 9th, 9 business days later, the credentials have not been delivered. Timeline of follow-ups: Monday 4/28 ticket raised. Wednesday 4/30 Jamie followed up in Slack, no response. Thursday 5/1 Jamie pinged platform lead David directly, David acknowledged. Monday 5/5 Jamie escalated to engineering manager, got acknowledgment it would be sorted. Friday 5/9 still not delivered. David told Jamie Friday afternoon it would be done first thing Monday. This is the third missed commitment on this ticket. The connector work itself takes 1 day once credentials arrive.

Billing Kafka connector (3pts): same blocker as CRM. Both connectors need service account credentials from the platform team.

DECISIONS MADE THIS SPRINT

Decision 1 - Switch from star schema to hybrid data vault for historical data layer (MAJOR ARCHITECTURAL DECISION):
Background: the original design used a star schema for the historical data warehouse. During a 3-hour design review on Tuesday May 6th, the data science team identified a critical issue. Materializing the wide fact tables required by the star schema for ML feature engineering workloads would be prohibitively expensive at the data volumes targeted in Phase 2 (estimated 15-20TB of daily event data). Time-series feature lookups in particular would require full table scans on 800M+ row tables, which is untenable for iterative model training.
The hybrid data vault approach stores raw data in hub/satellite/link vault structures with purpose-built mart layers for BI and ML workloads separately. Each consumer gets the interface they need without conflicting with the underlying storage model.
Cost: adds approximately 2 weeks to Phase 1, primarily Kevin and Priya time to redesign 3 schemas and rebuild the dbt models.
Benefit: avoids an estimated 2-3 months of rework when the ML platform build begins in Phase 2 and eliminates the performance constraint entirely.
Decision aligned by: Kevin (architect), Priya (lead data engineer), Mei (data science lead), Carlos (VP of Data). Logged in ADR-014. Kevin will present the updated schema design to the broader team Monday.

Decision 2 - Use Fivetran for Phase 2 source system connectors:
Original plan was custom Kafka connectors for all 11 Phase 2 source systems. After the CRM and billing connector delays highlighted how much time bespoke connector work costs when source system owners are unresponsive, the team evaluated Fivetran. Assessment: 6 of the 11 Phase 2 systems have native Fivetran connectors. Using Fivetran for those 6 saves an estimated 6 weeks of engineering time. Cost: 3,200 per month incremental SaaS spend. Carlos approved the budget change Thursday. The remaining 5 systems with no Fivetran connector will still use custom Kafka since those are all internal systems where the data eng team owns the access path.

Decision 3 - Promote Soren (contractor) to act as dbt lead during Priya leave:
Priya is on parental leave starting Monday May 12th for 3 weeks. Soren (contractor, 2-year Snowflake and dbt background) starts Monday and will cover the dbt-related sprint 5 work. Kevin will provide architecture oversight. Priya completed a 4-hour handoff session with Soren Friday and documented all active work, known edge cases in the transformation layer, and the vault schema refactor context.

BLOCKERS
Platform team credentials (CRITICAL): as detailed above. If not received by Tuesday May 13th, the end-to-end pipeline test cannot be completed on schedule. This is the sprint 5 gate criteria. Impact if missed: Phase 1 completion date slides 1-2 weeks. Jamie will follow up with David first thing Monday. If not resolved by Monday noon, engineering director intervention is needed.

Data contract alignment between data science and BI (EMERGING RISK): Mei wants the ML feature store at event-level granularity. Tom wants pre-aggregated daily summaries for the BI-facing marts. These are not incompatible given the vault architecture but if they do not align before sprint 6, we will build mart layers for one consumer and then retrofit them for the other. Both Mei and Tom know this needs to happen. Neither has prioritized scheduling it.

TEAM HEALTH AND RETRO
Overall morale: good. The Snowflake migration success and the unplanned CI/CD win were energizing. The CRM and billing blocker is frustrating because the team has done everything right and is being held up by an external party that has missed SLA three times.
Retro highlights: strong positive on Snowflake completion and dbt test coverage quality. Two improvement areas flagged. First: external dependency management. The team wants a clear escalation path for any PLAT or INFRA ticket over 5 business days with no resolution. Jamie is drafting a proposal for auto-escalation to engineering director level. Second: Jira sub-task clutter is creating noise in sprint reporting. Marcus cleaning up the workflow template before sprint 5 planning. Two engineers flagged context-switching between Phase 1 work and ad hoc data requests from the BI team. Tom team is starting to use staging before the formal handover, creating unexpected interruptions. Recommendation is to treat staging handover as a formal sprint 5 milestone event rather than a gradual drift.

SPRINT 5 PLAN - May 12 to 23
Sprint goal: complete all source system ingestion, validate end-to-end pipeline integrity, and formally onboard the BI team to staging.
Committed stories at 65 points: CRM Kafka connector (4pts, blocked pending credentials), billing Kafka connector (3pts, same blocker), end-to-end pipeline integration test across all 5 source systems (13pts), BI team staging environment orientation and access (5pts), dbt model documentation all 7 models (8pts, Soren leads), vault schema redesign for 3 core domains (13pts, Kevin and Soren), data quality monitoring row count and freshness alerts in Monte Carlo (8pts), Phase 2 source system inventory and Fivetran vs custom connector strategy (8pts, Jamie), retro action on external dependency escalation process (3pts, Jamie).

ASKS FROM LEADERSHIP
1. Platform team credentials: if CRM and billing credentials are not delivered by Monday noon, we need an engineering director to call David manager directly. This has missed SLA by 9 days. Jamie should not have to escalate further.
2. Data contract working session: Carlos to facilitate or mandate a 2-hour session between Mei and Tom before the end of sprint 5. Neither will prioritize it without an explicit push from above. Without it we will build the wrong mart layers.`

const EX3_DUMP = `Month 2 executive update for the Digital Onboarding Redesign program. Compiled from weekly delivery reports, A/B test data exports, compliance notes, engineering sprint summaries, and 1:1s with Aisha (UX), Dev (engineering lead), Lisa (product), and the Jumio account team.

PROGRAM OVERVIEW
5-month initiative to redesign new customer onboarding across web (Phase 1) and mobile (Phase 2), add identity verification for commercial lending (Phase 1 dependency), and launch referral mechanics (Phase 2). Month 2 covers May 1 to May 31. Overall status: Phase 1 on track, one compliance-driven scope addition absorbed within budget, one risk requiring executive awareness.

Program goals: increase 30-day activation rate from 41% baseline to 55% target. Reduce first-7-day support contacts from 4.9% to 3.7% (25% reduction). Enable identity verification for commercial lending eligibility by Q3. Launch referral program in Phase 2.

WHAT LAUNCHED IN MAY

New web onboarding flow - experiment launched May 3rd:
Split: 20% of new signups to treatment, 80% to control. Held at 20% intentionally to build statistical confidence before full rollout. As of May 28th, 25 days of data, sample sizes are 5,900 treatment and 23,600 control. Statistical significance reached on activation rate (p=0.003) and time-to-first-value (p less than 0.001). Support contact rate approaching significance (p=0.07, expected to cross threshold by June 5th).

Results to date:
30-day activation rate: 51.8% treatment vs. 41.4% control, a 10.4 percentage point lift. Tracking above the 55% target trajectory.
Median time to first value action: 2.1 days treatment vs. 4.2 days control. 50% improvement. This is the metric the commercial team cares most about because it correlates directly with trial-to-paid conversion in our cohort data.
First-7-day support contacts: 3.2% treatment vs. 4.9% control. On track for the 25% reduction goal.
Session completion rate on the new flow: 84% vs. 71% on the old flow. The biggest drop-off in the old flow was at the document upload step. We redesigned that interaction with a progress indicator and inline error recovery. It now has a 91% completion rate.
Unexpected finding: users in the 55+ age cohort are completing at 79% on the new flow vs. 65% on the old flow, a larger lift than any other segment. Aisha attributes this to the simplified form structure and larger tap targets. Worth noting because the commercial lending segment skews older.

Based on these results, Lisa approved moving to 100% rollout of the new web flow on June 4th. It is a feature flag flip, no engineering changes required.

Identity verification - Jumio integration launched May 11th:
99.3% of verifications completing successfully over the first 17 days. Volume is approximately 2,200 verifications per day. One issue identified: passport scans from applicants with Nigerian, Bangladeshi, or Indian passports are failing the Jumio liveness check at a 6.2% rate versus 0.4% for all other documents. Affecting approximately 140 applicants per day. Jumio confirmed on May 19th that their liveness model was trained on a dataset underrepresenting these passport formats. Specifically, the microprint pattern and hologram placement differ from their training data. Jumio has a model update staged for June 3rd deployment. In the meantime we implemented a manual review fallback on May 14th. Affected applicants receive a review in progress message and average 4-hour resolution time. Customer support contacts from this issue: 43 total over 17 days, all resolved. No applications were incorrectly rejected, only delayed.

One compliance issue surfaced during Jumio review: the original data processing agreement did not include explicit prohibition on Jumio using verification images for model training. We flagged this to Jumio legal. They confirmed they do not use customer images and have agreed to add explicit contract language. Amended DPA expected by June 6th.

SCOPE CHANGE: CCPA DISCLOSURE FLOW
May 7th: compliance team received updated guidance from outside counsel on CCPA requirements for behavioral data collection during onboarding. Before collecting any behavioral interaction data from California residents such as scroll depth, click patterns, or time-on-step, we need explicit stepped consent with an opt-out path.

This was not in the original program scope. It was a legal requirement, not a product choice.

Engineering scoped it at 8 days. Dev team absorbed it into sprint 3 without pulling anything out, running at higher-than-planned capacity for two weeks. Feature shipped May 22nd. Lisa reviewed the UX with Aisha. The consent flow is clean and non-intrusive. We tested it on a 5% holdout before full deployment and the conversion rate delta was -0.4%, within noise.

Impact: the referral program feature was pushed from the May 28th soft launch to approximately June 14th, a 17-day delay. No other timeline impact. Budget impact: approximately 82K in unplanned engineering cost, absorbed by deferring the in-app tutorial feature from Phase 2 to Phase 3. That deferral was aligned with Lisa on May 23rd.

BUDGET STATUS AS OF MAY 31ST
Total program budget: 2.1M. Spent to date: 1.26M (60%). Timeline elapsed: 40% (2 of 5 months). Spend rate is running ahead of timeline-based plan as expected given Phase 1 has the highest engineering concentration. Phase 2 has a lower run rate. Total program forecast: 2.08M, within budget. Contingency remaining: 180K of original 250K. Unplanned costs absorbed to date: 82K for CCPA work.

TIMELINE STATUS
Phase 1 (web onboarding and identity verification): 100% rollout of new web flow on June 4th, on track. Referral program soft launch on June 14th, pushed 17 days from original plan due to CCPA. Phase 1 complete June 18th, on track against original plan.
Phase 2 (mobile onboarding): mobile experiment launch June 14th on track. Full mobile rollout July 16th on track.
Phase 3 (referral expansion, in-app tutorials, advanced personalization): start August 4th, pushed from July 21st as net effect of CCPA scope addition. In-app tutorials deferred from Phase 2 to Phase 3 as the budget offset.

RISKS

Risk 1 - Mobile App Store Review (HIGH, time-sensitive):
The June 14th mobile experiment launch requires Apple App Store approval. Recent submissions have been running 8-10 calendar days for review. We submitted May 28th. If the review flags anything requiring resubmission, best case is a 3-5 day delay (June 17-19 launch) which is recoverable. A second resubmission puts us past June 22nd, which conflicts with the July 4th holiday slowdown and could push the full mobile rollout to late July. Dev submitted with conservative content descriptions and no new API permission requests to minimize flag risk. Status update expected June 6th.

Risk 2 - ESIGN Act Amendment (MEDIUM, long-horizon):
A proposed federal amendment to the Electronic Signatures in Global and National Commerce Act is expected to enter public comment in July. If passed in its current draft form, it would require changes to our electronic consent capture flows, specifically requiring a separate consent event for each discrete disclosure rather than bundled consent. Legal estimates 3-4 weeks of engineering work. Compliance deadline if passed would be Q4. No action needed now but this needs to be on the executive radar so it is not a surprise if it moves.

Risk 3 - UX Lead Retention (MEDIUM):
Aisha (UX lead) has been approached by a Series B fintech company and was transparent about it. She has not said she is leaving. HR opened a retention conversation last week. Her work has been central to both the design quality and the performance results of the new flow. If she leaves before mobile phase completes, succession plan is to promote Maya (senior UX, 14 months working alongside Aisha) to lead. This adds 2-3 weeks of ramp time to the mobile phase and would likely require backfilling Maya capacity with a contractor.

Risk 4 - Jumio Liveness Model (LOW, resolving):
Staged fix deploying June 3rd. Manual fallback in place. Will monitor for 48 hours post-deployment. If issue does not resolve, escalation path is through our enterprise account manager.

JUNE CALENDAR
June 3: Jumio liveness model update, monitoring required through June 5th
June 4: 100% rollout of new web onboarding flow
June 6: App Store review status expected
June 6: Amended Jumio DPA expected from Jumio legal
June 14: Mobile onboarding experiment launch pending App Store approval
June 14: Referral program soft launch
June 18: Phase 1 complete
June 21: Phase 1 retrospective and Phase 2 formal kickoff
Late June: Phase 2 sprint 3, mobile UX testing with 12-participant user research panel

ONE DECISION NEEDED
The referral program launches June 14th as a soft launch to 10% of eligible users, expanding to 50% on June 28th and 100% on July 12th. Lisa has approved the rollout plan. The open question: the 25 dollar account credit referral reward amount has not been formally approved by finance. The product team has been operating on an assumed approval based on a verbal from the CFO in March. Dev has the reward logic built and parameterized so the amount can be changed without a code deploy. Finance needs to formally sign off before June 10th so we can finalize user-facing copy and legal disclosures. Lisa to confirm with CFO by June 7th.`

const EXAMPLES = [
  {
    label: 'Example 1 of 3',
    reportType: 'exec',
    projectName: 'Payments Platform Modernization',
    audience: 'CTO and VP Engineering',
    timeHorizon: 'weekly',
    statusDump: EX1_DUMP,
  },
  {
    label: 'Example 2 of 3',
    reportType: 'full',
    projectName: 'Data Platform Rebuild — Q2 Sprint 4',
    audience: 'Product and Engineering leadership',
    timeHorizon: 'weekly',
    statusDump: EX2_DUMP,
  },
  {
    label: 'Example 3 of 3',
    reportType: 'exec',
    projectName: 'Digital Onboarding Redesign',
    audience: 'Chief Product Officer',
    timeHorizon: 'monthly',
    statusDump: EX3_DUMP,
  },
]

function Toggle({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--color-sand)',
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: value === opt.value ? 'var(--color-ink)' : 'transparent',
            color: value === opt.value ? '#fff' : 'var(--color-slate)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function StatusReportGenerator() {
  const [reportType, setReportType]   = useState('exec')
  const [timeHorizon, setTimeHorizon] = useState('weekly')
  const [projectName, setProjectName] = useState('')
  const [audience, setAudience]       = useState('')
  const [statusDump, setStatusDump]   = useState('')
  const [output, setOutput]           = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState(null)

  const loadExample = useRotatingExample(EXAMPLES, (ex) => {
    setReportType(ex.reportType)
    setTimeHorizon(ex.timeHorizon)
    setProjectName(ex.projectName)
    setAudience(ex.audience)
    setStatusDump(ex.statusDump)
    setOutput('')
    setError(null)
  })

  async function handleRun() {
    if (!statusDump.trim()) return
    setIsLoading(true)
    setError(null)
    setOutput('')
    try {
      const system = reportType === 'exec' ? EXEC_UPDATE_SYSTEM : FULL_STATUS_SYSTEM
      const result = await callClaude({
        system,
        messages: [{ role: 'user', content: buildStatusReportPrompt({ statusDump, audience, projectName, timeHorizon, reportType }) }],
        maxTokens: 3000,
        model: 'claude-sonnet-4-5-20251022',
      })
      setOutput(result)
    } catch (err) {
      console.error('Status report error:', err.message)
      setError(err.message === 'daily_limit_reached' ? 'daily_limit_reached' : 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const canRun = statusDump.trim().length > 0 && !isLoading

  return (
    <PageLayout
      title="Status Report Generator"
      subtitle="Paste your raw status notes, messages, or a brain dump. Get back a tight, structured update formatted for your audience and ready to send."
      roles={['Delivery Managers', 'Product Managers', 'Program Managers', 'Engineering Managers']}
    >
      <section className="sect">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
            gap: 40,
            alignItems: 'start',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 500 }}>Your inputs</h2>
                <button onClick={loadExample} className="btn-secondary" style={{ height: 36, fontSize: 13 }}>
                  Load example
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Report format</label>
                  <Toggle
                    value={reportType}
                    onChange={setReportType}
                    options={[
                      { value: 'exec', label: 'Executive Update' },
                      { value: 'full', label: 'Full Status Report' },
                    ]}
                  />
                  <p className="form-hint" style={{ marginTop: 8 }}>
                    {reportType === 'exec'
                      ? 'Single-page. Where things stand, key risks, one ask. Designed to read in 60 seconds.'
                      : 'Multi-section. Summary, progress by area, decisions, risks, next steps, and the ask.'}
                  </p>
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Time horizon</label>
                  <Toggle
                    value={timeHorizon}
                    onChange={setTimeHorizon}
                    options={[
                      { value: 'weekly', label: 'Weekly / Sprint' },
                      { value: 'milestone', label: 'Monthly / Milestone' },
                    ]}
                  />
                </div>

                <div>
                  <label className="form-label">Project or initiative name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Payments Platform Modernization"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="form-label">Audience</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CTO and VP Engineering"
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="form-label">Status information *</label>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    Paste anything: notes, messages, a brain dump, bullet points, Slack threads. The messier the better. The tool will organize it.
                  </p>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 560 }}
                    placeholder="What happened this week? What is blocked? What decisions were made? What is coming up? What do you need from leadership? Paste it all here — no need to format or organize it first."
                    value={statusDump}
                    onChange={e => setStatusDump(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={handleRun}
                  disabled={!canRun}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {isLoading ? 'Generating...' : 'Generate status report'}
                </button>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, mar