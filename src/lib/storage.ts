// Session storage for prospect data
import type { Prospect, SalesFunnelInputs } from '../types';
import { validateStorageSize } from './security';

const PROSPECTS_KEY = 'solar_hunter_prospects';
const FUNNEL_KEY = 'solar_hunter_funnel';

export function saveProspects(prospects: Prospect[]): void {
  try {
    // SECURITY FIX: Validate storage size before saving
    if (!validateStorageSize(PROSPECTS_KEY, prospects)) {
      console.warn('Prospect data too large to save');
      return;
    }
    localStorage.setItem(PROSPECTS_KEY, JSON.stringify(prospects));
  } catch {
    // Storage full or unavailable
  }
}

export function loadProspects(): Prospect[] {
  try {
    const data = localStorage.getItem(PROSPECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearProspects(): void {
  localStorage.removeItem(PROSPECTS_KEY);
}

export function addProspect(prospect: Prospect): void {
  const existing = loadProspects();
  const idx = existing.findIndex(p => p.companyName === prospect.companyName);
  if (idx >= 0) {
    existing[idx] = prospect;
  } else {
    existing.push(prospect);
  }
  saveProspects(existing);
}

export function saveFunnelInputs(inputs: SalesFunnelInputs): void {
  try {
    // SECURITY FIX: Validate storage size before saving
    if (!validateStorageSize(FUNNEL_KEY, inputs)) {
      console.warn('Funnel data too large to save');
      return;
    }
    localStorage.setItem(FUNNEL_KEY, JSON.stringify(inputs));
  } catch {
    // ignore
  }
}

export function loadFunnelInputs(): SalesFunnelInputs | null {
  try {
    const data = localStorage.getItem(FUNNEL_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
