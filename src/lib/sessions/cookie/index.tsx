import { IncomingMessage, ServerResponse } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  IS_AUTHENTICATED: 'isAuthenticated'
} as const;

// Cookie configurations (matching backend)
export const COOKIE_CONFIGS = {
  MAX_AGE: 1000 * 60 * 60 * 24 * 30 // 30 days (you can sync with process.env.COOKIE_EXPIRE)
} as const;

// Simple cookie options
interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Server context type
interface ServerContext {
  req?: NextApiRequest | IncomingMessage;
  res?: NextApiResponse | ServerResponse;
}

/**
 * Default cookie options (matching backend behavior)
 */
const getDefaultCookieOptions = (): CookieOptions => ({
  httpOnly: false, // ← Change this to false
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: COOKIE_CONFIGS.MAX_AGE
});

/**
 * Get cookie value
 */
export const getCookie = ({name, context}: {name: string, context?: ServerContext}): string | null => {
  // Server-side
  if (context?.req) {
    const cookies = context.req.headers.cookie;
    if (!cookies) return null;
    
    const cookie = cookies
      .split(';')
      .find(c => c.trim().startsWith(`${name}=`));
    
    return cookie ? cookie.split('=')[1].trim() : null;
  }
  
  // Client-side
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
    return cookie ? cookie.split('=')[1].trim() : null;
  }
  
  return null;
};

/**
 * Set cookie with default security options
 */
export const setCookie = ({
  name, 
  value, 
  options = {}, 
  context
}: {
  name: string;
  value: string | boolean | number | null | undefined | object ;
  options?: CookieOptions;
  context?: ServerContext;
}): void => {
  // Merge with defaults (matching backend pattern)
  const cookieOptions = {
    ...getDefaultCookieOptions(),
    ...options
  };

  const {
    expires,
    maxAge,
    domain,
    path,
    secure,
    httpOnly,
    sameSite
  } = cookieOptions;

  let cookieString = `${name}=${value}`;
  
  if (expires) cookieString += `; expires=${expires.toUTCString()}`;
  if (maxAge !== undefined) cookieString += `; max-age=${Math.floor(maxAge / 1000)}`; // Convert to seconds
  if (domain) cookieString += `; domain=${domain}`;
  if (path) cookieString += `; path=${path}`;
  if (secure) cookieString += `; secure`;
  if (httpOnly) cookieString += `; httponly`;
  if (sameSite) cookieString += `; samesite=${sameSite}`;

  // Server-side
  if (context?.res) {
    const existingCookies = context.res.getHeader('Set-Cookie') as string[] || [];
    const newCookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies].filter(Boolean);
    newCookies.push(cookieString);
    context.res.setHeader('Set-Cookie', newCookies);
    
    // Also update the request cookies for immediate reading
    if (context.req) {
      const currentCookies = context.req.headers.cookie || '';
      const cookieEntries = currentCookies.split(';').map(c => c.trim()).filter(Boolean);
      
      // Remove existing cookie with same name
      const filteredCookies = cookieEntries.filter(c => !c.startsWith(`${name}=`));
      
      // Add new cookie
      filteredCookies.push(`${name}=${value}`);
      
      // Update request headers
      context.req.headers.cookie = filteredCookies.join('; ');
    }
    return;
  }
  
  // Client-side
  if (typeof window !== 'undefined') {
    const clientCookieString = cookieString.replace(/;\s*httponly/i, '');
    document.cookie = clientCookieString;
  }
};

/**
 * Update cookie (same as setCookie)
 */
export const updateCookie = (
  name: string,
  value: string,
  options: CookieOptions = {},
  context?: ServerContext
): void => {
  setCookie({
    name,
    value,
    options,
    context
  });
};

/**
 * Delete cookie
 */
export const deleteCookie = (
  name: string,
  options: Pick<CookieOptions, 'path' | 'domain'> = {},
  context?: ServerContext
): void => {
  setCookie({
    name,
    value: '',
    options: {
    ...options,
    expires: new Date(0),
    maxAge: 0,
    path: options.path || '/',
    },
    context
  });
};



