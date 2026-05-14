import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import SprintRiskScanner from './pages/SprintRiskScanner'
import UserStoryGenerator from './pages/UserStoryGenerator'
import StandupAgent from './pages/StandupAgent'
import ValueAlignmentAuditor from './pages/ValueAlignmentAuditor'
import StatusReportGenerator from './pages/StatusReportGenerator'

export default function App() {
  return (
    <Routes>
      <Route path="/"                           element={<Landing />} />
      <Route path="/sprint-risk-scanner"        element={<SprintRiskScanner />} />
      <Route path="/user-story-generator"       element={<UserStoryGenerator />} />
      <Route path="/standup-agent"              element={<StandupAgent />} />
      <Route path="/value-alignment-auditor"    element={<ValueAlignmentAuditor />} />
      <Route path="/status-report-generator"    element={<StatusReportGenerator />} />
    </Routes>
  )
}
