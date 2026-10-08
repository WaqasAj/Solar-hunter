// Secure encryption utilities using Web Crypto API
// Keys are encrypted with a user-chosen password before storage

const STORAGE_KEY = 'encrypted_api_keys';
const SALT_KEY = 'api_keys_salt';

// Derive an encryption key from password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    } as Pbkdf2Params,
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with password
export async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

// Decrypt data with password
export async function decryptData(encryptedBase64: string, password: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null; // Wrong password or corrupted data
  }
}

// Save encrypted API keys
export async function saveEncryptedKeys(keys: { gemini?: string; brave?: string }, password: string): Promise<void> {
  const data = JSON.stringify(keys);
  const encrypted = await encryptData(data, password);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

// Load and decrypt API keys
export async function loadEncryptedKeys(password: string): Promise<{ gemini?: string; brave?: string } | null> {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  
  const decrypted = await decryptData(encrypted, password);
  if (!decrypted) return null;
  
  try {
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

// Check if encrypted keys exist
export function hasEncryptedKeys(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

// Clear encrypted keys
export function clearEncryptedKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}
