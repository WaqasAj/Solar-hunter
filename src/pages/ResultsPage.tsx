import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, RefreshCw, AlertCircle, Loader2, CheckCircle2, Clock } from 'lucide-react';
import type { Prospect, SearchCriteria, SearchProgress, SearchResult } from '../types';
import { searchWeb, generateSearchQueries, deduplicateResults, extractCompanyNames, analyzeCompany, isSearchConfigured, isAIConfigured } from '../lib/api';
import { saveProspects, loadProspects } from '../lib/storage';
import { exportProspectsToCSV } from '../lib/export';
import ProspectCard from '../components/ProspectCard';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchComplete, setSearchComplete] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());

  const runSearch = useCallback(async () => {
    const criteriaStr = sessionStorage.getItem('search_criteria');
    if (!criteriaStr) {
      navigate('/');
      return;
    }

    const criteria: SearchCriteria = JSON.parse(criteriaStr);

    if (!isSearchConfigured() || !isAIConfigured()) {
      setError('Required API keys are not available. Go to Settings to unlock or add your API keys.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setProspects([]);
    setSearchComplete(false);

    try {
      // Stage 1: Search
      setProgress({ stage: 'search', message: 'Searching public business sources...', percent: 10 });
      const queries = generateSearchQueries(criteria.location, criteria.industry, criteria.numProspects);
      
      let allResults: SearchResult[] = [];
      for (let i = 0; i < queries.length; i++) {
        setProgress({ 
          stage: 'search', 
          message: `Searching: "${queries[i]}"...`, 
          percent: 10 + Math.round((i / queries.length) * 20) 
        });
        try {
          const results = await searchWeb(queries[i], 10);
          allResults = [...allResults, ...results];
        } catch (e) {
          // Continue with what we have
        }
      }

      // Deduplicate
      allResults = deduplicateResults(allResults);

      if (allResults.length === 0) {
        throw new Error('No search results found. Try a broader location or different industry.');
      }

      // Stage 2: Extract company names
      setProgress({ stage: 'extract', message: 'Identifying relevant companies from search results...', percent: 35 });
      const companyNames = await extractCompanyNames(allResults, criteria.location, criteria.industry);

      if (companyNames.length === 0) {
        throw new Error('No suitable companies were identified from the search results. Try a broader search.');
      }

      // Stage 3: Research each company
      const maxToResearch = Math.min(companyNames.length, criteria.numProspects * 2); // Research more than needed to filter by score
      const researchedProspects: Prospect[] = [];

      for (let i = 0; i < maxToResearch; i++) {
        const companyName = companyNames[i];
        setProgress({
          stage: 'research',
          message: `Researching ${companyName} (${i + 1}/${maxToResearch})...`,
          percent: 40 + Math.round((i / maxToResearch) * 40)
        });

        try {
          // Search for this specific company
          const companyResults = await searchWeb(`${companyName} ${criteria.location}`, 5);
          const prospect = await analyzeCompany(companyName, companyResults, criteria.location, criteria.industry);
          
          if (prospect.solarOpportunityScore >= criteria.minScore) {
            researchedProspects.push(prospect);
          }

          // Update prospects in real-time
          setProspects([...researchedProspects].sort((a, b) => b.solarOpportunityScore - a.solarOpportunityScore));
        } catch (e) {
          // Skip this company if research fails
          continue;
        }

        // If we have enough, stop
        if (researchedProspects.length >= criteria.numProspects) {
          break;
        }
      }

      // Stage 4: Rank and finalize
      setProgress({ stage: 'rank', message: 'Ranking prospects by solar opportunity...', percent: 85 });
      
      const finalProspects = researchedProspects
        .sort((a, b) => b.solarOpportunityScore - a.solarOpportunityScore)
        .slice(0, criteria.numProspects);

      setProgress({ stage: 'complete', message: 'Generating sales intelligence...', percent: 95 });
      
      setProspects(finalProspects);
      saveProspects(finalProspects);

      setProgress({ stage: 'done', message: 'Complete!', percent: 100 });
      setSearchComplete(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during the search.';
      setError(message);
    } finally {
      setIsSearching(false);
    }
  }, [navigate]);

  useEffect(() => {
    const criteriaStr = sessionStorage.getItem('search_criteria');
    if (criteriaStr) {
      runSearch();
    } else {
      // Check if we already have results from a previous search
      const existing = loadProspects();
      if (existing.length > 0) {
        setProspects(existing);
        setSearchComplete(true);
      }
    }
  }, [runSearch]);

  const handleResearch = (prospect: Prospect) => {
    sessionStorage.setItem('selected_prospect', JSON.stringify(prospect));
    navigate('/company-detail');
  };

  const handleExport = () => {
    const toExport = selectedProspects.size > 0
      ? prospects.filter(p => selectedProspects.has(p.id))
      : prospects;
    if (toExport.length > 0) {
      exportProspectsToCSV(toExport);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProspects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedProspects.size === prospects.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(prospects.map(p => p.id)));
    }
  };

  // Empty state
  if (!isSearching && prospects.length === 0 && !error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your prospect pipeline is empty</h2>
        <p className="text-gray-500 mb-6">Enter a target market and find real solar prospects.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-solar-600 text-white font-medium rounded-xl hover:bg-solar-700 transition-colors"
        >
          Start Searching
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solar Prospects</h1>
          <p className="text-sm text-gray-500">
            {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} found
            {searchComplete && ` • Sorted by opportunity score`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prospects.length > 0 && (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {selectedProspects.size === prospects.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleExport}
                disabled={selectedProspects.size === 0 && prospects.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV {selectedProspects.size > 0 && `(${selectedProspects.size})`}
              </button>
              <button
                onClick={runSearch}
                disabled={isSearching}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                Retry
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      {isSearching && progress && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-solar-600 animate-spin" />
            <span className="text-sm font-medium text-gray-700">{progress.message}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-solar-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{progress.percent}% complete</p>
          
          {/* Stage indicators */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'search', label: 'Searching' },
              { key: 'extract', label: 'Identifying' },
              { key: 'research', label: 'Researching' },
              { key: 'rank', label: 'Ranking' },
            ].map(stage => (
              <div key={stage.key} className="flex items-center gap-1.5 text-xs">
                {progress.percent >= (stage.key === 'search' ? 10 : stage.key === 'extract' ? 35 : stage.key === 'research' ? 40 : 85) ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-solar-600" />
                ) : progress.stage === stage.key ? (
                  <Clock className="w-3.5 h-3.5 text-solar-500 animate-pulse" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                )}
                <span className={progress.stage === stage.key ? 'text-solar-700 font-medium' : 'text-gray-500'}>
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Search Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => navigate('/settings')}
                className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900"
              >
                Go to Settings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {searchComplete && prospects.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No suitable prospects found</h3>
          <p className="text-sm text-gray-500">
            No companies met the minimum score threshold. Try a broader location, different industry, or lower score threshold.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-solar-600 text-white text-sm font-medium rounded-lg hover:bg-solar-700"
          >
            Adjust Search Criteria
          </button>
        </div>
      )}

      {/* Results */}
      {prospects.length > 0 && (
        <div className="space-y-4">
          {prospects.map((prospect, index) => (
            <div key={prospect.id} className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent rounded-l-xl" />
              <div onClick={() => toggleSelect(prospect.id)} className="cursor-pointer">
                <div className={`rounded-xl border transition-all ${
                  selectedProspects.has(prospect.id) ? 'border-solar-400 ring-1 ring-solar-200' : 'border-gray-200'
                }`}>
                  <div className="p-1">
                    <ProspectCard prospect={prospect} onResearch={handleResearch} index={index} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Build Call List */}
      {searchComplete && prospects.length >= 5 && (
        <div className="mt-8 bg-solar-50 border border-solar-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-solar-800 mb-2">Ready to make calls?</h3>
          <p className="text-sm text-solar-700 mb-4">
            Build a prioritized call list from your top prospects.
          </p>
          <button
            onClick={() => {
              sessionStorage.setItem('call_list_prospects', JSON.stringify(prospects.slice(0, 10)));
              navigate('/dashboard');
            }}
            className="px-6 py-2.5 bg-solar-600 text-white font-medium rounded-xl hover:bg-solar-700 transition-colors"
          >
            BUILD MY CALL LIST
          </button>
        </div>
      )}
    </div>
  );
}
