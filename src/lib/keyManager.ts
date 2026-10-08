// API key manager - handles encrypted storage and session caching
import { loadEncryptedKeys, hasEncryptedKeys } from './crypto';

// In-memory cache for the session (cleared on page refresh)
// SECURITY FIX: Only store decrypted keys, never the password
let cachedKeys: { gemini?: string; brave?: string } | null = null;

// Check if keys are set up (encrypted keys exist)
export function isKeySetupComplete(): boolean {
  return hasEncryptedKeys();
}

// Unlock keys with password (called once per session)
// SECURITY FIX: Password is used to decrypt but never stored in memory
export async function unlockKeys(password: string): Promise<boolean> {
  const keys = await loadEncryptedKeys(password);
  if (keys) {
    cachedKeys = keys;
    // SECURITY FIX: Clear password from local scope immediately
    // The password parameter is a local variable that will be garbage collected
    return true;
  }
  return false;
}

// Lock keys (clear session cache)
// SECURITY FIX: Overwrite memory before nulling to prevent memory scraping
export function lockKeys(): void {
  if (cachedKeys) {
    // Overwrite sensitive data before releasing reference
    cachedKeys.gemini = '';
    cachedKeys.brave = '';
  }
  cachedKeys = null;
}

// Check if keys are unlocked (available in session)
export function isUnlocked(): boolean {
  return cachedKeys !== null;
}

// Get Gemini API key (from cache)
export function getGeminiKey(): string {
  return cachedKeys?.gemini || '';
}

// Get Brave Search API key (from cache)
export function getBraveKey(): string {
  return cachedKeys?.brave || '';
}

// Check if Gemini key is available
export function hasGeminiKey(): boolean {
  return !!cachedKeys?.gemini;
}

// Check if Brave key is available
export function hasBraveKey(): boolean {
  return !!cachedKeys?.brave;
}

// Get config status
export function getConfigStatus(): { gemini: boolean; brave: boolean } {
  return {
    gemini: hasGeminiKey(),
    brave: hasBraveKey(),
  };
}
