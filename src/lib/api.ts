// API clients for search and AI services
import type { SearchResult, AppConfig, Prospect, EvidenceItem, SourceItem, DecisionMakerRole, ScoreBreakdown, ConfidenceLevel } from '../types';
import { getPriorityFromScore } from '../types';
import { getGeminiKey, getBraveKey, hasGeminiKey, hasBraveKey } from './keyManager';

// Environment variable access - uses encrypted key manager
export function getConfig(): AppConfig {
  return {
    geminiApiKey: getGeminiKey(),
    braveSearchApiKey: getBraveKey(),
  };
}

// Check if search is configured
export function isSearchConfigured(): boolean {
  return hasBraveKey();
}

// Check if AI is configured
export function isAIConfigured(): boolean {
  return hasGeminiKey();
}

// Get config status
export function getConfigStatus() {
  return {
    gemini: hasGeminiKey(),
    braveSearch: hasBraveKey(),
  };
}

// Get masked key for display (shows first 4 and last 4 chars)
export function getMaskedKey(type: 'gemini' | 'brave'): string {
  const val = type === 'gemini' ? getGeminiKey() : getBraveKey();
  if (!val) return '';
  if (val.length <= 8) return '••••••••';
  return val.slice(0, 4) + '••••••••' + val.slice(-4);
}

// Brave Search API
export async function searchWeb(query: string, count: number = 10): Promise<SearchResult[]> {
  const config = getConfig();
  if (!config.braveSearchApiKey) {
    throw new Error('Search API key is not configured. Go to Settings to add your search API key.');
  }

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&search_lang=en`,
    {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': config.braveSearchApiKey,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Search API key is invalid or expired. Please check your key in Settings.');
    }
    if (response.status === 429) {
      throw new Error('Brave Search API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Search service returned error: ${response.status}`);
  }

  const data = await response.json();
  const results: SearchResult[] = [];

  if (data.web?.results) {
    for (const r of data.web.results) {
      results.push({
        title: r.title || '',
        url: r.url || '',
        description: r.description || '',
      });
    }
  }

  return results;
}

// Generate search queries based on criteria
export function generateSearchQueries(location: string, industry: string, count: number): string[] {
  const queries: string[] = [];
  const loc = location.trim();

  if (industry && industry !== 'all') {
    queries.push(`${industry} companies in ${loc}`);
    queries.push(`${industry} manufacturers ${loc}`);
    queries.push(`${industry} businesses ${loc} factory`);
    if (count >= 20) {
      queries.push(`${industry} production facility ${loc}`);
      queries.push(`${industry} plant ${loc}`);
    }
    if (count >= 50) {
      queries.push(`large ${industry.toLowerCase()} company ${loc}`);
      queries.push(`${industry} industrial ${loc}`);
      queries.push(`${industry} processing ${loc}`);
    }
  } else {
    queries.push(`manufacturing companies in ${loc}`);
    queries.push(`industrial companies ${loc}`);
    queries.push(`factory ${loc}`);
    queries.push(`large commercial business ${loc}`);
    if (count >= 20) {
      queries.push(`warehouse companies ${loc}`);
      queries.push(`production facility ${loc}`);
    }
    if (count >= 50) {
      queries.push(`cold storage ${loc}`);
      queries.push(`food processing ${loc}`);
      queries.push(`textile mill ${loc}`);
      queries.push(`pharmaceutical company ${loc}`);
    }
  }

  return queries.slice(0, Math.min(queries.length, count >= 50 ? 8 : count >= 20 ? 5 : 3));
}

// Gemini AI API
async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const config = getConfig();
  if (!config.geminiApiKey) {
    throw new Error('AI API key is not configured. Go to Settings to add your AI API key.');
  }

  const body: any = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    }
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new Error('AI API key is invalid. Please check your key in Settings.');
    }
    if (response.status === 429) {
      throw new Error('Gemini API rate limit exceeded. Please try again later.');
    }
    throw new Error(`AI analysis service returned error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('AI analysis returned empty response.');
  }
  return text;
}

// Extract JSON from AI response
function extractJSON(text: string): any {
  // Try to find JSON block
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  // Try to find raw JSON
  const rawMatch = text.match(/\{[\s\S]*\}/);
  if (rawMatch) {
    return JSON.parse(rawMatch[0]);
  }
  throw new Error('Could not parse AI response as JSON.');
}

// Analyze a company using AI
export async function analyzeCompany(
  companyName: string,
  searchResults: SearchResult[],
  location: string,
  industry: string
): Promise<Prospect> {
  const systemInstruction = `You are a commercial solar sales intelligence analyst. Your job is to analyze publicly available information about companies and determine their potential as prospects for commercial/industrial solar installations.

CRITICAL RULES:
- Use ONLY information provided in the search results. Do NOT invent facts.
- If evidence is insufficient for a field, use null or "unknown".
- Do NOT claim exact electricity bills, system sizes, or savings unless explicitly stated in evidence.
- Use language like "appears to be", "suggests", "potential opportunity" rather than definitive claims.
- Every factual claim must be backed by evidence from the search results.
- Do NOT fabricate URLs, phone numbers, or email addresses.`;

  const resultsText = searchResults.map((r, i) => 
    `[Source ${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.description}`
  ).join('\n\n');

  const prompt = `Analyze the following search results about "${companyName}" located in ${location}${industry !== 'all' ? ` in the ${industry} industry` : ''}.

SEARCH RESULTS:
${resultsText}

Return a JSON object with this exact structure:
{
  "company_name": "string",
  "website": "string or null",
  "industry": "string",
  "location": "string",
  "business_type": "string or null",
  "description": "string - brief description based on evidence",
  "score_breakdown": {
    "industry_intensity": number (0-25),
    "facility_footprint": number (0-20),
    "daytime_usage": number (0-15),
    "business_scale": number (0-15),
    "expansion_signals": number (0-10),
    "solar_suitability": number (0-15)
  },
  "why_this_lead": "string - one sentence summary of why this is a good solar prospect",
  "key_signals": ["string array of key solar signals"],
  "electricity_signals": ["string array of electricity demand signals found in evidence"],
  "growth_signals": ["string array of growth/expansion signals found in evidence"],
  "facility_signals": ["string array of facility-related signals found in evidence"],
  "decision_maker_roles": [
    {"role": "string", "relevance": "string - why this role is relevant"}
  ],
  "sales_angle": "string - practical sales approach advice, like advice from an experienced solar sales engineer",
  "first_contact_message": "string - short professional outreach message referencing actual evidence",
  "research_confidence": "high|medium|low",
  "confidence_explanation": "string - why this confidence level",
  "evidence": [
    {"claim": "string", "source": "string", "source_url": "string or null", "source_type": "company_website|news_article|business_directory|job_posting|public_record|search_result"}
  ],
  "solar_fit_estimate": "high|medium|low or null",
  "public_phone": "string or null - only if found in search results",
  "public_email": "string or null - only if found in search results"
}

Scoring guidance:
- industry_intensity (0-25): manufacturing/textile/cold storage/food processing/plastics/steel/chemicals/pharma = 20-25; hotels/hospitals/schools/warehouses = 12-18; offices/consultancy = 3-10
- facility_footprint (0-20): factory/large building/industrial site = 15-20; warehouse/multiple locations = 10-14; single small office = 3-8
- daytime_usage (0-15): manufacturing/production/machinery/refrigeration = 12-15; daytime retail/hospital = 8-11; minimal evidence = 2-6
- business_scale (0-15): large company/multiple facilities = 12-15; medium company = 7-11; small/unknown = 2-6
- expansion_signals (0-10): new factory/expansion/hiring/new facility = 7-10; some growth indicators = 4-6; no signals = 0-2
- solar_suitability (0-15): large roof/industrial site/daytime load = 12-15; suitable facility = 7-11; limited evidence = 2-5

Return ONLY the JSON object, no other text.`;

  const response = await callGemini(prompt, systemInstruction);
  const data = extractJSON(response);

  const totalScore = Object.values(data.score_breakdown as ScoreBreakdown).reduce((sum: number, v: any) => sum + (v || 0), 0);
  const clampedScore = Math.min(100, Math.max(0, totalScore));

  const sources: SourceItem[] = searchResults.map(r => ({
    title: r.title,
    url: r.url,
    type: 'search_result'
  }));

  const prospect: Prospect = {
    id: generateId(),
    companyName: data.company_name || companyName,
    website: data.website || undefined,
    industry: data.industry || industry || 'Unknown',
    location: data.location || location,
    businessType: data.business_type || undefined,
    description: data.description || undefined,
    solarOpportunityScore: clampedScore,
    scoreBreakdown: data.score_breakdown || { industryIntensity: 0, facilityFootprint: 0, daytimeUsage: 0, businessScale: 0, expansionSignals: 0, solarSuitability: 0 },
    priority: getPriorityFromScore(clampedScore),
    whyThisLead: data.why_this_lead || 'Insufficient evidence to determine solar opportunity.',
    keySignals: data.key_signals || [],
    electricitySignals: data.electricity_signals || [],
    growthSignals: data.growth_signals || [],
    facilitySignals: data.facility_signals || [],
    decisionMakerRoles: data.decision_maker_roles || [],
    salesAngle: data.sales_angle || 'Requires further research.',
    firstContactMessage: data.first_contact_message || undefined,
    researchConfidence: (data.research_confidence as ConfidenceLevel) || 'low',
    confidenceExplanation: data.confidence_explanation || 'Limited public information available.',
    evidence: data.evidence || [],
    sources,
    publicPhone: data.public_phone || undefined,
    publicEmail: data.public_email || undefined,
    solarFitEstimate: data.solar_fit_estimate || undefined,
    searchedAt: new Date().toISOString(),
  };

  return prospect;
}

// Research a single company by name/URL
export async function researchCompany(query: string): Promise<Prospect> {
  const searchQueries = [
    query,
    `${query} company`,
    `${query} official website`,
  ];

  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const q of searchQueries) {
    try {
      const results = await searchWeb(q, 5);
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }
    } catch (e) {
      // Continue with results we have
    }
  }

  if (allResults.length === 0) {
    throw new Error(`No public information found for "${query}". The company may not have a significant online presence.`);
  }

  return analyzeCompany(query, allResults, '', 'all');
}

// Find similar companies
export async function findSimilarCompanies(referenceCompany: string, characteristics: string): Promise<SearchResult[]> {
  const query = `companies similar to ${referenceCompany} ${characteristics}`;
  return searchWeb(query, 20);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Deduplicate search results by domain
export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  for (const r of results) {
    try {
      const domain = new URL(r.url).hostname;
      if (!seen.has(domain)) {
        seen.set(domain, r);
      }
    } catch {
      seen.set(r.url, r);
    }
  }
  return Array.from(seen.values());
}

// Extract company names from search results using AI
export async function extractCompanyNames(results: SearchResult[], location: string, industry: string): Promise<string[]> {
  const systemInstruction = `You are a business research assistant. Extract company names from search results. Only include actual companies that appear to be in the specified industry and location. Do not include directories, listing sites, or aggregator pages as companies.`;

  const resultsText = results.map((r, i) => 
    `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`
  ).join('\n\n');

  const prompt = `From these search results, extract the names of actual companies that are:
- Located in or near: ${location}
- In the ${industry === 'all' ? 'manufacturing/industrial' : industry} sector
- Appear to be real businesses (not directory listings or aggregators)

Search results:
${resultsText}

Return a JSON array of objects:
[{"name": "Company Name", "url": "their website if found", "evidence": "brief note about what indicates they are a real company in this industry/location"}]

Return ONLY the JSON array. Include up to 30 companies. If fewer are found, return fewer.`;

  try {
    const response = await callGemini(prompt, systemInstruction);
    const data = extractJSON(response);
    if (Array.isArray(data)) {
      return data.map((d: any) => d.name).filter(Boolean);
    }
    return [];
  } catch {
    // Fallback: extract from titles
    const names: string[] = [];
    for (const r of results) {
      const title = r.title;
      // Simple heuristic: company names often appear before " - " or " | "
      const parts = title.split(/[-|–]/);
      if (parts.length > 0 && parts[0].trim().length > 3) {
        names.push(parts[0].trim());
      }
    }
    return [...new Set(names)].slice(0, 30);
  }
}
