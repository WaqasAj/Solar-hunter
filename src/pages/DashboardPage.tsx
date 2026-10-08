import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, TrendingUp, Target, Phone, BarChart3 } from 'lucide-react';
import { loadProspects } from '../lib/storage';
import type { Prospect } from '../types';
import ScoreBadge from '../components/ScoreBadge';
import { getPriorityColor } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const prospects = loadProspects();

  const stats = useMemo(() => {
    const total = prospects.length;
    const veryHigh = prospects.filter(p => p.solarOpportunityScore >= 90).length;
    const high = prospects.filter(p => p.solarOpportunityScore >= 75 && p.solarOpportunityScore < 90).length;
    const medium = prospects.filter(p => p.solarOpportunityScore >= 60 && p.solarOpportunityScore < 75).length;
    const avgScore = total > 0 ? Math.round(prospects.reduce((sum, p) => sum + p.solarOpportunityScore, 0) / total) : 0;
    return { total, veryHigh, high, medium, avgScore };
  }, [prospects]);

  const topProspects = useMemo(() => {
    return [...prospects].sort((a, b) => b.solarOpportunityScore - a.solarOpportunityScore).slice(0, 5);
  }, [prospects]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-solar-600" />
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Overview of your prospect pipeline and sales activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Prospects Found" value={stats.total} icon={<Search className="w-5 h-5" />} color="text-blue-600 bg-blue-50" />
        <StatCard label="Very High Priority" value={stats.veryHigh} icon={<Target className="w-5 h-5" />} color="text-red-600 bg-red-50" />
        <StatCard label="High Priority" value={stats.high} icon={<TrendingUp className="w-5 h-5" />} color="text-orange-600 bg-orange-50" />
        <StatCard label="Avg Score" value={stats.avgScore} icon={<BarChart3 className="w-5 h-5" />} color="text-solar-600 bg-solar-50" />
        <StatCard label="Medium Priority" value={stats.medium} icon={<Phone className="w-5 h-5" />} color="text-yellow-600 bg-yellow-50" />
      </div>

      {/* Empty State */}
      {prospects.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your prospect pipeline is empty</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start by finding solar prospects or researching a specific company.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-solar-600 text-white font-medium rounded-xl hover:bg-solar-700 transition-colors"
            >
              Find Prospects
            </button>
            <button
              onClick={() => navigate('/research')}
              className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Research a Company
            </button>
          </div>
        </div>
      )}

      {/* Top Prospects / Call List */}
      {topProspects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Top Prospects</h2>
            <button
              onClick={() => navigate('/results')}
              className="text-sm text-solar-600 hover:underline font-medium"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {topProspects.map((prospect, i) => (
              <div
                key={prospect.id}
                className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  sessionStorage.setItem('selected_prospect', JSON.stringify(prospect));
                  navigate('/company-detail');
                }}
              >
                <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                <ScoreBadge score={prospect.solarOpportunityScore} size="sm" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{prospect.companyName}</h3>
                  <p className="text-xs text-gray-500 truncate">{prospect.industry} • {prospect.location}</p>
                </div>
                <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(prospect.priority)}`}>
                  {prospect.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call List */}
      {topProspects.length >= 3 && (
        <div className="bg-solar-50 border border-solar-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-solar-800 mb-3">📋 Quick Call List</h2>
          <div className="space-y-2">
            {topProspects.slice(0, 5).map((prospect, i) => (
              <div key={prospect.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-solar-100">
                <span className="w-6 h-6 bg-solar-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{prospect.companyName}</p>
                  <p className="text-xs text-gray-500 truncate">{prospect.whyThisLead}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-solar-700">{prospect.solarOpportunityScore}</p>
                  {prospect.decisionMakerRoles[0] && (
                    <p className="text-xs text-gray-500">{prospect.decisionMakerRoles[0].role}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
