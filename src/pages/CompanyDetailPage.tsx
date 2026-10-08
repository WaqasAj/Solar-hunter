import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Phone, Mail, MapPin, Factory, Zap, TrendingUp, Shield, Lightbulb, MessageSquare, Link2 } from 'lucide-react';
import type { Prospect } from '../types';
import { getPriorityColor } from '../types';
import ScoreBadge from '../components/ScoreBadge';

export default function CompanyDetailPage() {
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<Prospect | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('selected_prospect');
    if (data) {
      setProspect(JSON.parse(data));
    } else {
      navigate('/results');
    }
  }, [navigate]);

  if (!prospect) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to results
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <ScoreBadge score={prospect.solarOpportunityScore} size="lg" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{prospect.companyName}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Factory className="w-4 h-4" />{prospect.industry}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{prospect.location}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(prospect.priority)}`}>
                {prospect.priority}
              </span>
            </div>
            {prospect.description && (
              <p className="mt-3 text-sm text-gray-600">{prospect.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {prospect.website && (
                <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                  <ExternalLink className="w-3.5 h-3.5" /> Website
                </a>
              )}
              {prospect.publicPhone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg">
                  <Phone className="w-3.5 h-3.5" /> {prospect.publicPhone}
                </span>
              )}
              {prospect.publicEmail && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg">
                  <Mail className="w-3.5 h-3.5" /> {prospect.publicEmail}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Why This Lead */}
        <div className="mt-6 bg-solar-50 border border-solar-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-solar-800 flex items-center gap-1.5 mb-1">
            <Zap className="w-4 h-4" /> WHY THIS LEAD?
          </h3>
          <p className="text-solar-700">{prospect.whyThisLead}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Solar Opportunity Score Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Industry / Electricity Intensity', score: prospect.scoreBreakdown.industryIntensity, max: 25 },
            { label: 'Facility / Physical Footprint', score: prospect.scoreBreakdown.facilityFootprint, max: 20 },
            { label: 'Daytime Electricity Usage', score: prospect.scoreBreakdown.daytimeUsage, max: 15 },
            { label: 'Business Scale', score: prospect.scoreBreakdown.businessScale, max: 15 },
            { label: 'Expansion / Growth Signals', score: prospect.scoreBreakdown.expansionSignals, max: 10 },
            { label: 'Solar Suitability Evidence', score: prospect.scoreBreakdown.solarSuitability, max: 15 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.score}/{item.max}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-solar-500 h-2 rounded-full transition-all"
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence & Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Electricity Signals */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-500" /> Electricity Demand Signals
          </h3>
          {prospect.electricitySignals.length > 0 ? (
            <ul className="space-y-2">
              {prospect.electricitySignals.map((signal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-solar-500 mt-0.5">✓</span>
                  {signal}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No specific electricity signals identified.</p>
          )}
        </div>

        {/* Growth Signals */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Growth Signals
          </h3>
          {prospect.growthSignals.length > 0 ? (
            <ul className="space-y-2">
              {prospect.growthSignals.map((signal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 mt-0.5">↑</span>
                  {signal}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No growth signals identified.</p>
          )}
        </div>

        {/* Facility Signals */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Factory className="w-4 h-4 text-gray-500" /> Facility Signals
          </h3>
          {prospect.facilitySignals.length > 0 ? (
            <ul className="space-y-2">
              {prospect.facilitySignals.map((signal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {signal}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No specific facility signals identified.</p>
          )}
        </div>

        {/* Solar Fit */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-solar-500" /> Solar Fit Estimate
          </h3>
          {prospect.solarFitEstimate ? (
            <div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                prospect.solarFitEstimate === 'high' ? 'bg-green-100 text-green-700' :
                prospect.solarFitEstimate === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {prospect.solarFitEstimate.charAt(0).toUpperCase() + prospect.solarFitEstimate.slice(1)} prospecting fit
              </span>
              <p className="text-xs text-gray-500 mt-2">
                This is a prospecting estimate based on publicly available information. Actual PV feasibility requires site assessment, load data, roof/land assessment, and utility information.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Solar fit estimate not available based on current evidence.</p>
          )}
        </div>
      </div>

      {/* Decision Maker Roles */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Likely Decision-Maker Roles</h2>
        {prospect.decisionMakerRoles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prospect.decisionMakerRoles.map((role, i) => (
              <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="font-medium text-blue-800 text-sm">{role.role}</p>
                <p className="text-xs text-blue-600 mt-1">{role.relevance}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No specific decision-maker roles identified.</p>
        )}
      </div>

      {/* Sales Angle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-solar-500" /> Personalized Sales Angle
        </h2>
        <div className="bg-solar-50 border border-solar-200 rounded-xl p-4">
          <p className="text-sm text-solar-800 leading-relaxed">{prospect.salesAngle}</p>
        </div>
      </div>

      {/* First Contact Message */}
      {prospect.firstContactMessage && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-gray-500" /> Suggested Opening Message
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{prospect.firstContactMessage}</pre>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Customize this message before sending. Reference specific evidence and avoid generic language.
          </p>
        </div>
      )}

      {/* Evidence & Sources */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-gray-500" /> Evidence & Sources
        </h2>
        
        {/* Confidence */}
        <div className="mb-4 flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            prospect.researchConfidence === 'high' ? 'bg-green-100 text-green-700' :
            prospect.researchConfidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {prospect.researchConfidence.toUpperCase()} CONFIDENCE
          </span>
          <span className="text-xs text-gray-500">{prospect.confidenceExplanation}</span>
        </div>

        {/* Evidence Items */}
        {prospect.evidence.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Evidence</h4>
            <div className="space-y-2">
              {prospect.evidence.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-solar-500 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-700">{item.claim}</span>
                    <span className="text-gray-400 mx-1">—</span>
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {item.source}
                      </a>
                    ) : (
                      <span className="text-gray-500">{item.source}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Links */}
        {prospect.sources.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Sources Used
            </h4>
            <div className="space-y-1.5">
              {prospect.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{source.title || source.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
