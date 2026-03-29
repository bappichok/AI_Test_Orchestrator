import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Connectors from './pages/Connectors.jsx'
import StoryFetcher from './pages/StoryFetcher.jsx'
import TestPlanCreator from './pages/TestPlanCreator.jsx'
import TestCaseCreator from './pages/TestCaseCreator.jsx'
import CodeGenerator from './pages/CodeGenerator.jsx'
import DashboardAnalytics from './pages/DashboardAnalytics.jsx'
import History from './pages/History.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/"             element={<Dashboard />} />
        <Route path="/fetch"        element={<StoryFetcher />} />
        <Route path="/create"       element={<TestPlanCreator />} />
        <Route path="/test-cases"   element={<TestCaseCreator />} />
        <Route path="/analytics"    element={<DashboardAnalytics />} />
        <Route path="/generate-code" element={<CodeGenerator />} />
        <Route path="/history"      element={<History />} />
        <Route path="/connectors"   element={<Connectors />} />
      </Route>
    </Routes>
  )
}
