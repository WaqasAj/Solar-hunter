import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Loader2, AlertCircle } from 'lucide-react';
import type { Prospect, SearchResult } from '../types';
import { searchWeb, analyzeCompany, isSearchConfigured, isAIConfigured, deduplicateResults } from '../lib/api';
import { saveProspects } from '../lib/storage';
import ProspectCard from '../components/ProspectCard';

export default function SimilarPage() {
  const navigate = useNavigate();
  const [referenceCompany, setReferenceCompany] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Prospect[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState('');

  const handleSearch = async () => {
    if (!referenceCompany.trim()) return;

    if (!isSearchConfigured() || !isAIConfigured()) {
      setError('Required API keys are not configured. Go to Settings to securely enter your Brave Search and Gemini API keys.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      // First, research the reference company to understand its characteristics
      setStage('Researching reference company...');
      const refResults = await searchWeb(`${referenceCompany} company`, 5);
      const refProspect = await analyzeCompany(referenceCompany, refResults, '', 'all');

      // Build search query based on reference company characteristics
      const characteristics = [
        refProspect.industry !== 'Unknown' ? refProspect.industry : '',
        refProspect.businessType || '',
        refProspect.location || '',
      ].filter(Boolean).join(' ');

      setStage('Finding similar companies...');
      const similarQueries = [
        `${characteristics} companies`,
        `${refProspect.industry} companies similar to ${referenceCompany}`,
        `${refProspect.industry} manufacturers businesses`,
      ];

      let allResults: SearchResult[] = [];
      for (const q of similarQueries) {
        try {
          const res = await searchWeb(q, 10);
          allResults = [...allResults, ...res];
        } catch { continue; }
      }

      allResults = deduplicateResults(allResults);

      // Filter out the reference company itself
      const filtered = allResults.filter(r => 
        !r.title.toLowerCase().includes(referenceCompany.toLowerCase()) &&
        !r.url.toLowerCase().includes(referenceCompany.toLowerCase())
      );

      // Analyze top candidates
      setStage('Analyzing similar companies...');
      const similarProspects: Prospect[] = [];
      const toAnalyze = filtered.slice(0, 10);

      for (let i = 0; i < toAnalyze.length; i++) {
        setStage(`Analyzing ${toAnalyze[i].title} (${i + 1}/${toAnalyze.length})...`);
        try {
          const companyResults = [toAnalyze[i]];
          const prospect = await analyzeCompany(toAnalyze[i].title, companyResults, refProspect.location, refProspect.industry);
          if (prospect.solarOpportunityScore >= 40) {
            similarProspects.push(prospect);
          }
        } catch { continue; }
      }

      similarProspects.sort((a, b) => b.solarOpportunityScore - a.solarOpportunityScore);
      setResults(similarProspects);
      saveProspects(similarProspects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResearch = (prospect: Prospect) => {
    sessionStorage.setItem('selected_prospect', JSON.stringify(prospect));
    navigate('/company-detail');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-solar-600" />
          Find Similar Prospects
        </h1>
        <p className="text-gray-500 mt-1">
          Enter an existing successful customer to find companies with similar characteristics.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reference Company (your best customer or a known good prospect)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={referenceCompany}
            onChange={(e) => setReferenceCompany(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter company name or website..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
            disabled={isSearching}
          />
          <button
            onClick={handleSearch}
            disabled={!referenceCompany.trim() || isSearching}
            className="px-6 py-3 bg-solar-600 text-white font-medium rounded-xl hover:bg-solar-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            FIND SIMILAR
          </button>
        </div>
      </div>

      {/* Progress */}
      {isSearching && (
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
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Companies similar to your reference — {results.length} found
          </h2>
          <div className="space-y-4">
            {results.map((prospect, index) => (
              <ProspectCard key={prospect.id} prospect={prospect} onResearch={handleResearch} index={index} />
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !isSearching && !error && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Enter a reference company to find similar prospects.</p>
        </div>
      )}
    </div>
  );
}
