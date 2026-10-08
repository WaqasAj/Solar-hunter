// Security utilities for URL validation and sanitization

/**
 * Validates if a URL is safe to use (prevents javascript:, data:, etc.)
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    // Block common malicious patterns
    const maliciousPatterns = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'ftp:',
    ];
    
    const lowerUrl = url.toLowerCase();
    for (const pattern of maliciousPatterns) {
      if (lowerUrl.includes(pattern)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL for safe display (returns empty string if invalid)
 */
export function sanitizeUrl(url: string): string {
  return isValidUrl(url) ? url : '';
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password too long (max 128 characters)' };
  }
  
  // Check for at least one number or special character
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasNumberOrSpecial) {
    return { valid: false, message: 'Password must contain at least one number or special character' };
  }
  
  return { valid: true, message: 'Password is strong' };
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number = 10, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  canMakeCall(): boolean {
    const now = Date.now();
    // Remove old calls outside the window
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    
    if (this.calls.length >= this.maxCalls) {
      return false;
    }
    
    this.calls.push(now);
    return true;
  }

  getWaitTime(): number {
    if (this.calls.length === 0) return 0;
    
    const oldestCall = this.calls[0];
    const waitTime = this.windowMs - (Date.now() - oldestCall);
    return Math.max(0, waitTime);
  }

  reset(): void {
    this.calls = [];
  }
}

/**
 * Validates localStorage data size
 */
export function validateStorageSize(key: string, data: any): boolean {
  try {
    const serialized = JSON.stringify(data);
    const sizeInBytes = new Blob([serialized]).size;
    const sizeInKB = sizeInBytes / 1024;
    
    // Limit to 5MB per key
    if (sizeInKB > 5120) {
      console.warn(`Storage size for ${key} exceeds 5MB limit`);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes text to prevent XSS (for non-HTML contexts)
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Remove null bytes
  let sanitized = text.replace(/\0/g, '');
  
  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}
