/**
 * Utility to get the current base URL dynamically
 * Works for any deployment domain (Vercel, custom domain, localhost, etc.)
 * 
 * Priority:
 * 1. Client-side: window.location.origin
 * 2. Server-side: VERCEL_URL (Vercel automatically provides this)
 * 3. Server-side: NEXT_PUBLIC_VERCEL_URL (if set manually)
 * 4. Development: localhost:3000
 */

/**
 * Get the base URL for the current deployment
 * Works on both client and server side
 * 
 * @returns The base URL (e.g., "https://your-app.vercel.app" or "http://localhost:3000")
 */
export function getBaseUrl(): string {
  // Client-side: use window.location (most reliable)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side: Vercel automatically provides VERCEL_URL environment variable
  // Format: "your-app-abc123.vercel.app" (without protocol)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Alternative: NEXT_PUBLIC_VERCEL_URL (if manually set)
  // Note: NEXT_PUBLIC_* variables are exposed to the browser
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL;
    // Add protocol if not present
    return url.startsWith('http') ? url : `https://${url}`;
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }

  // Production fallback: try NEXT_PUBLIC_SITE_URL if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Last resort: return empty string (will use relative paths)
  // This should rarely happen in production
  return '';
}

/**
 * Convert a relative path to an absolute URL using the current domain
 * @param path - Relative path (e.g., "/images/logo.svg")
 * @returns Absolute URL (e.g., "https://your-domain.vercel.app/images/logo.svg")
 */
export function getAbsoluteUrl(path: string): string {
  // If already absolute, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  const baseUrl = getBaseUrl();
  
  // If no base URL available, return relative path (better than broken absolute URL)
  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
}

