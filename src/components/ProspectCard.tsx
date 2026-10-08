import type { Prospect } from '../types';
import { getPriorityColor } from '../types';
import ScoreBadge from './ScoreBadge';
import { ExternalLink, MapPin, Factory, Zap, TrendingUp, ChevronRight } from 'lucide-react';

interface ProspectCardProps {
  prospect: Prospect;
  onResearch: (prospect: Prospect) => void;
  index: number;
}

export default function ProspectCard({ prospect, onResearch, index }: ProspectCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Score */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <ScoreBadge score={prospect.solarOpportunityScore} size="md" />
          <span className={`mt-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(prospect.priority)}`}>
            {prospect.priority}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{prospect.companyName}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Factory className="w-3.5 h-3.5" />
                  {prospect.industry}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {prospect.location}
                </span>
              </div>
            </div>
          </div>

          {/* Why This Lead */}
          <div className="mt-3 bg-solar-50 border border-solar-200 rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-solar-800">
              <Zap className="w-3.5 h-3.5 inline mr-1" />
              WHY THIS LEAD: {prospect.whyThisLead}
            </p>
          </div>

          {/* Key Signals */}
          {prospect.keySignals.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {prospect.keySignals.slice(0, 5).map((signal, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700">
                  {signal}
                </span>
              ))}
            </div>
          )}

          {/* Decision Maker Roles */}
          {prospect.decisionMakerRoles.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Likely Decision-Makers</p>
              <div className="flex flex-wrap gap-1.5">
                {prospect.decisionMakerRoles.slice(0, 4).map((role, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-xs text-blue-700 border border-blue-100">
                    {role.role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onResearch(prospect)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-solar-600 text-white text-sm font-medium rounded-lg hover:bg-solar-700 transition-colors"
            >
              Research Company
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {prospect.website && (
              <a
                href={prospect.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Website
              </a>
            )}
            {prospect.publicPhone && (
              <span className="text-sm text-gray-600">📞 {prospect.publicPhone}</span>
            )}
            {prospect.publicEmail && (
              <span className="text-sm text-gray-600">✉️ {prospect.publicEmail}</span>
            )}
          </div>

          {/* Confidence */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              prospect.researchConfidence === 'high' ? 'bg-green-100 text-green-700' :
              prospect.researchConfidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {prospect.researchConfidence} confidence
            </span>
            {prospect.sources.length > 0 && (
              <span className="text-xs text-gray-400">
                {prospect.sources.length} source{prospect.sources.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
