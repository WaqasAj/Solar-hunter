import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import ResearchPage from './pages/ResearchPage';
import SimilarPage from './pages/SimilarPage';
import CalculatorPage from './pages/CalculatorPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/company-detail" element={<CompanyDetailPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/similar" element={<SimilarPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
