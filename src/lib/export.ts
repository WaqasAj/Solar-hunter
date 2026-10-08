// CSV export functionality
import type { Prospect } from '../types';

export function exportProspectsToCSV(prospects: Prospect[]): void {
  const headers = [
    'Company',
    'Website',
    'Industry',
    'Location',
    'Solar Opportunity Score',
    'Priority',
    'Why This Lead',
    'Key Signals',
    'Decision-Maker Roles',
    'Suggested Sales Angle',
    'Public Phone',
    'Public Email',
    'Sources',
    'Research Confidence',
  ];

  const rows = prospects.map(p => [
    escapeCSV(p.companyName),
    escapeCSV(p.website || ''),
    escapeCSV(p.industry),
    escapeCSV(p.location),
    p.solarOpportunityScore.toString(),
    escapeCSV(p.priority),
    escapeCSV(p.whyThisLead),
    escapeCSV(p.keySignals.join('; ')),
    escapeCSV(p.decisionMakerRoles.map(r => r.role).join('; ')),
    escapeCSV(p.salesAngle),
    escapeCSV(p.publicPhone || ''),
    escapeCSV(p.publicEmail || ''),
    escapeCSV(p.sources.map(s => `${s.title}: ${s.url}`).join('; ')),
    escapeCSV(p.researchConfidence),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `solar-prospects-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
