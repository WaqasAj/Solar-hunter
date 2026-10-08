import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Search, Building2, Zap, Target, TrendingUp } from 'lucide-react';
import type { SearchCriteria } from '../types';
import { isSearchConfigured, isAIConfigured, getConfigStatus } from '../lib/api';

const INDUSTRIES = [
  'All industries',
  'Manufacturing',
  'Textile',
  'Food Processing',
  'Cold Storage',
  'Warehousing',
  'Plastics',
  'Chemicals',
  'Pharmaceuticals',
  'Hotels',
  'Hospitals',
  'Schools',
  'Universities',
  'Shopping Centers',
  'Retail',
  'Agriculture',
  'Poultry',
  'Data Centers',
  'Logistics',
  'Automotive',
  'Steel',
  'Paper',
  'Printing',
  'Commercial Buildings',
  'Other',
];

export default function HomePage() {
  const navigate = useNavigate();
  const configStatus = getConfigStatus();

  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('All industries');
  const [customIndustry, setCustomIndustry] = useState('');
  const [numProspects, setNumProspects] = useState(20);
  const [minScore, setMinScore] = useState(60);

  const needsSearchKey = !isSearchConfigured();
  const needsAIKey = !isAIConfigured();
  const needsConfig = needsSearchKey || needsAIKey;

  const handleSearch = () => {
    if (!location.trim()) return;
    
    const criteria: SearchCriteria = {
      location: location.trim(),
      industry: industry === 'All industries' ? 'all' : (industry === 'Other' ? customIndustry : industry),
      numProspects,
      minScore,
    };

    // Store criteria in session storage
    sessionStorage.setItem('search_criteria', JSON.stringify(criteria));
    navigate('/results');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-10 pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-solar-100 rounded-2xl mb-4">
          <Sun className="w-9 h-9 text-solar-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Solar Prospect Hunter
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI-powered prospecting for solar sales engineers. Find the companies most worth pursuing — and understand why.
        </p>
      </div>

      {/* Configuration Warning */}
      {needsConfig && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-2">⚙️ API Configuration Required</h3>
          <p className="text-sm text-amber-700 mb-2">
            To find real prospects, the following API keys need to be configured:
          </p>
          <ul className="text-sm space-y-1">
            {needsSearchKey && (
              <li className="flex items-center gap-2 text-amber-700">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <strong>BRAVE_SEARCH_API_KEY</strong> — for finding real businesses via web search
              </li>
            )}
            {needsAIKey && (
              <li className="flex items-center gap-2 text-amber-700">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <strong>GEMINI_API_KEY</strong> — for AI-powered company analysis and scoring
              </li>
            )}
          </ul>
          <p className="text-sm text-amber-600 mt-2">
            Add these as environment variables (VITE_BRAVE_SEARCH_API_KEY, VITE_GEMINI_API_KEY) or configure in{' '}
            <button onClick={() => navigate('/settings')} className="underline font-medium hover:text-amber-900">Settings</button>.
          </p>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-solar-600" />
          Where do you want to sell?
        </h2>

        <div className="space-y-5">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Target Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Lahore, Karachi, Dubai, Texas, California..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none transition-shadow"
            />
            <p className="text-xs text-gray-400 mt-1">Enter any city, region, or country</p>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none transition-shadow"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            {industry === 'Other' && (
              <input
                type="text"
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                placeholder="Specify industry..."
                className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
              />
            )}
          </div>

          {/* Number of Prospects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              How many prospects?
            </label>
            <div className="flex gap-3">
              {[10, 20, 50].map(n => (
                <button
                  key={n}
                  onClick={() => setNumProspects(n)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    numProspects === n
                      ? 'bg-solar-600 text-white border-solar-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-solar-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Minimum Opportunity Score: <span className="text-solar-600 font-bold">{minScore}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 (any)</span>
              <span>50</span>
              <span>100 (best only)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleSearch}
            disabled={!location.trim() || needsConfig}
            className="w-full py-3.5 bg-solar-600 text-white font-semibold rounded-xl hover:bg-solar-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <Search className="w-5 h-5" />
            FIND SOLAR PROSPECTS
          </button>
          <button
            onClick={() => navigate('/research')}
            className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            RESEARCH A SPECIFIC COMPANY
          </button>
        </div>
      </div>

      {/* Value Props */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Zap className="w-6 h-6 text-solar-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 text-sm">Evidence-Based Scoring</h3>
          <p className="text-xs text-gray-500 mt-1">Every score is backed by public evidence and source links</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Target className="w-6 h-6 text-solar-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 text-sm">Sales Intelligence</h3>
          <p className="text-xs text-gray-500 mt-1">Know who to contact, why, and what to say</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <TrendingUp className="w-6 h-6 text-solar-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 text-sm">Prioritize Prospects</h3>
          <p className="text-xs text-gray-500 mt-1">Focus your time on the most promising opportunities</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-center text-sm text-gray-400 mt-8">
        Stop searching for companies manually. Find businesses with stronger solar opportunity signals and focus your sales time on the prospects most worth pursuing.
      </p>
    </div>
  );
}
