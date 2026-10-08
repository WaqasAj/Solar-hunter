// Core data types for Solar Prospect Hunter

export interface SearchCriteria {
  location: string;
  industry: string;
  numProspects: number;
  minScore: number;
}

export interface ScoreBreakdown {
  industryIntensity: number; // 0-25
  facilityFootprint: number; // 0-20
  daytimeUsage: number; // 0-15
  businessScale: number; // 0-15
  expansionSignals: number; // 0-10
  solarSuitability: number; // 0-15
}

export interface EvidenceItem {
  claim: string;
  source: string;
  sourceUrl?: string;
  sourceType: 'company_website' | 'news_article' | 'business_directory' | 'job_posting' | 'public_record' | 'search_result';
}

export interface Prospect {
  id: string;
  companyName: string;
  website?: string;
  industry: string;
  location: string;
  businessType?: string;
  description?: string;
  solarOpportunityScore: number;
  scoreBreakdown: ScoreBreakdown;
  priority: Priority;
  whyThisLead: string;
  keySignals: string[];
  electricitySignals: string[];
  growthSignals: string[];
  facilitySignals: string[];
  decisionMakerRoles: DecisionMakerRole[];
  salesAngle: string;
  firstContactMessage?: string;
  researchConfidence: ConfidenceLevel;
  confidenceExplanation: string;
  evidence: EvidenceItem[];
  sources: SourceItem[];
  publicPhone?: string;
  publicEmail?: string;
  solarFitEstimate?: 'high' | 'medium' | 'low';
  searchedAt: string;
}

export interface DecisionMakerRole {
  role: string;
  relevance: string;
}

export interface SourceItem {
  title: string;
  url: string;
  type: string;
}

export type Priority = 'VERY HIGH PRIORITY' | 'HIGH PRIORITY' | 'MEDIUM PRIORITY' | 'LOW PRIORITY' | 'VERY LOW PRIORITY';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export interface SearchProgress {
  stage: string;
  message: string;
  percent: number;
}

export interface SalesFunnelInputs {
  monthlyTarget: number;
  avgProjectValue: number;
  leadToMeetingRate: number;
  meetingToProposalRate: number;
  proposalToCloseRate: number;
}

export interface SalesFunnelOutputs {
  requiredClosedDeals: number;
  requiredProposals: number;
  requiredMeetings: number;
  requiredLeads: number;
}

export interface AppConfig {
  geminiApiKey: string;
  braveSearchApiKey: string;
}

export function getPriorityFromScore(score: number): Priority {
  if (score >= 90) return 'VERY HIGH PRIORITY';
  if (score >= 75) return 'HIGH PRIORITY';
  if (score >= 60) return 'MEDIUM PRIORITY';
  if (score >= 40) return 'LOW PRIORITY';
  return 'VERY LOW PRIORITY';
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'VERY HIGH PRIORITY': return 'text-red-700 bg-red-50 border-red-200';
    case 'HIGH PRIORITY': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'MEDIUM PRIORITY': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'LOW PRIORITY': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'VERY LOW PRIORITY': return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-red-700';
  if (score >= 75) return 'text-orange-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-blue-600';
  return 'text-gray-500';
}

export function getScoreRingColor(score: number): string {
  if (score >= 90) return '#dc2626';
  if (score >= 75) return '#ea580c';
  if (score >= 60) return '#ca8a04';
  if (score >= 40) return '#2563eb';
  return '#6b7280';
}
