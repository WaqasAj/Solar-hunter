import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle, Building2 } from 'lucide-react';
import type { Prospect } from '../types';
import { researchCompany, isSearchConfigured, isAIConfigured } from '../lib/api';
import { addProspect } from '../lib/storage';
import ScoreBadge from '../components/ScoreBadge';
import { getPriorityColor } from '../types';
import { isValidUrl } from '../lib/security';

export default function ResearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<Prospect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState('');

  const handleResearch = async () => {
    if (!query.trim()) return;

    if (!isSearchConfigured() || !isAIConfigured()) {
      setError('Required API keys are not available. Go to Settings to unlock or add your API keys.');
      return;
    }

    setIsResearching(true);
    setError(null);
    setResult(null);

    try {
      setStage('Searching for company information...');
      const prospect = await researchCompany(query.trim());
      setStage('Analysis complete.');
      setResult(prospect);
      addProspect(prospect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-solar-600" />
          Research a Company
        </h1>
        <p className="text-gray-500 mt-1">
          Enter a company name or website to analyze its solar opportunity potential.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            placeholder="Enter company name or website URL..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
            disabled={isResearching}
          />
          <button
            onClick={handleResearch}
            disabled={!query.trim() || isResearching}
            className="px-6 py-3 bg-solar-600 text-white font-medium rounded-xl hover:bg-solar-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            RESEARCH
          </button>
        </div>
      </div>

      {/* Progress */}
      {isResearching && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-solar-600 animate-spin" />
            <span className="text-sm text-gray-700">{stage}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => navigate('/settings')}
                className="mt-2 text-sm font-medium text-red-700 underline"
              >
                Go to Settings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-slide-up">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <ScoreBadge score={result.solarOpportunityScore} size="lg" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{result.companyName}</h2>
                    <p className="text-sm text-gray-500 mt-1">{result.industry} • {result.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(result.priority)}`}>
                    {result.priority}
                  </span>
                </div>
                {result.description && (
                  <p className="mt-3 text-sm text-gray-600">{result.description}</p>
                )}
              </div>
            </div>

            {/* Why This Lead */}
            <div className="mt-4 bg-solar-50 border border-solar-200 rounded-xl p-4">
              <p className="text-sm font-medium text-solar-800">
                <strong>WHY THIS LEAD:</strong> {result.whyThisLead}
              </p>
            </div>
          </div>

          {/* Key Signals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Signals</h4>
              <div className="flex flex-wrap gap-1.5">
                {result.keySignals.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-xs text-gray-700 rounded">{s}</span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Decision-Maker Roles</h4>
              <div className="flex flex-wrap gap-1.5">
                {result.decisionMakerRoles.map((r, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-50 text-xs text-blue-700 border border-blue-100 rounded">{r.role}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sales Angle */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Sales Angle</h4>
            <p className="text-sm text-gray-700">{result.salesAngle}</p>
          </div>

          {/* Contact Message */}
          {result.firstContactMessage && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggested Opening Message</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{result.firstContactMessage}</pre>
            </div>
          )}

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Sources</h4>
              <div className="space-y-1">
                {result.sources.map((s, i) => (
                  isValidUrl(s.url) && (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline truncate">
                      {s.title || s.url}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

          {/* View Full Detail */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                sessionStorage.setItem('selected_prospect', JSON.stringify(result));
                navigate('/company-detail');
              }}
              className="px-6 py-2.5 bg-solar-600 text-white font-medium rounded-xl hover:bg-solar-700 transition-colors"
            >
              View Full Company Intelligence →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
